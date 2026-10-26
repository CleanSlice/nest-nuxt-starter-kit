// @scope:api
// @slice:setup/prisma
// @layer:data
// @type:service

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { param as rawParam } from '@prisma/orm-postgres/relational-core/expression' with {
  'resolution-mode': 'import',
};
import type * as OrmClient from '@prisma/orm-postgres/orm-client' with {
  'resolution-mode': 'import',
};

import type { Contract } from '../../../../generated/prisma/contract.d.ts' with {
  'resolution-mode': 'import',
};
import { isRetryable } from './prisma.errors';
import type {
  PrismaClient,
  PrismaModels,
  PrismaRawCondition,
  PrismaRawCountQuery,
  PrismaRawFragment,
  PrismaRawParam,
  PrismaRawRowQuery,
  PrismaRawSql,
  PrismaTx,
} from './prisma.types';

/** How long one {@link PrismaService.transaction} may run, and wait for a connection. */
const TRANSACTION_TIMEOUT_MS = 30_000;
const TRANSACTION_MAX_WAIT_MS = 10_000;

/**
 * Emitted by `prisma contract emit` (postinstall, build, dev, test) into
 * api/generated/prisma. The same relative path works from src/ and dist/.
 */
const CONTRACT_PATH = join(
  __dirname,
  '../../../../generated/prisma/contract.json',
);

export enum TransactionIsolationLevel {
  ReadCommitted = 'READ COMMITTED',
  RepeatableRead = 'REPEATABLE READ',
  Serializable = 'SERIALIZABLE',
}

export interface ITransactionOptions {
  /** PostgreSQL's default is READ COMMITTED. */
  isolationLevel?: TransactionIsolationLevel;
  /**
   * Extra attempts after a serialization failure or deadlock (SQLSTATE
   * 40001/40P01). The whole unit runs again, so it must not have side effects
   * outside the database. Default 2. A joined (nested) transaction never
   * retries on its own: the outermost one does.
   */
  maxRetries?: number;
  /** Upper bound for the whole unit, in milliseconds. Default 30 000. */
  timeoutMs?: number;
}

/** What {@link PrismaService.open} takes; the Nest provider reads DATABASE_URL. */
export interface IPrismaOpenOptions {
  url?: string;
}

/** Thrown when a unit outlives {@link ITransactionOptions.timeoutMs}; it is rolled back. */
export class TransactionTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(
      `transaction did not finish within ${timeoutMs} ms and was rolled back`,
    );
    this.name = 'TransactionTimeoutError';
  }
}

/**
 * The single owner of the database connection, on Prisma 8.
 *
 * Gateways read {@link db}: the ORM of the transaction open on this call stack,
 * or of the root client otherwise (`this.prisma.db.public.User`). Raw SQL goes
 * through {@link sql} and runs with {@link rawRows} / {@link rawExecute}, which
 * pick the transaction the same way.
 *
 * The Prisma 8 runtime is ESM-only and loaded with a real `import()` (the build
 * is CommonJS; Node 22 loads ESM from it, and Jest does under
 * `--experimental-vm-modules`). It is loaded at module init; the pool opens its
 * first connection on the first query.
 *
 * Transactions are ambient: {@link transaction} parks the open transaction in
 * an `AsyncLocalStorage`, and {@link db} and the raw helpers answer with it
 * while it is set. A gateway called inside one needs no `tx` parameter, so no
 * Prisma type reaches a domain contract, and no writer can forget to enlist.
 * A {@link transaction} opened while one is in progress JOINS it: PostgreSQL
 * has no nested transactions, and every caller wants "all of this, or none".
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly ambient = new AsyncLocalStorage<PrismaTx>();
  private root?: PrismaClient;
  private makeParam?: typeof rawParam;
  private combinators?: Pick<typeof OrmClient, 'and' | 'or' | 'not'>;
  private options: IPrismaOpenOptions = {};

  /** A client outside Nest: scripts and test setup. Close it with {@link close}. */
  static async open(options: IPrismaOpenOptions = {}): Promise<PrismaService> {
    const service = new PrismaService();
    service.options = options;
    await service.onModuleInit();
    return service;
  }

  /** The model collections of `public`, inside the current transaction if one is open. */
  get db(): { public: PrismaModels } {
    return this.queryable().orm;
  }

  /** True while a {@link transaction} is open on this call stack. */
  get inTransaction(): boolean {
    return this.ambient.getStore() !== undefined;
  }

  async onModuleInit(): Promise<void> {
    if (this.root) return;
    const url = this.options.url ?? process.env.DATABASE_URL;
    if (!url)
      throw new Error(
        'DATABASE_URL is not set; the database is not configured',
      );
    const { default: postgres } = await import('@prisma/orm-postgres/runtime');
    const { param } =
      await import('@prisma/orm-postgres/relational-core/expression');
    this.makeParam = param;
    const { and, or, not } = await import('@prisma/orm-postgres/orm-client');
    this.combinators = { and, or, not };
    const contractJson: unknown = JSON.parse(
      readFileSync(CONTRACT_PATH, 'utf8'),
    );
    this.root = postgres<Contract>({
      contractJson,
      url,
      poolOptions: { connectionTimeoutMillis: TRANSACTION_MAX_WAIT_MS },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  async close(): Promise<void> {
    const root = this.root;
    this.root = undefined;
    await root?.close();
  }

  /**
   * Run `work` as one unit: every write it makes through this service, directly
   * or through any gateway it calls, commits together or not at all. Nested
   * calls join the transaction already in progress.
   *
   * `work` is handed the transaction's model collections for convenience; the
   * gateways it calls need nothing, since {@link db} already answers with the
   * same transaction.
   */
  async transaction<T>(
    work: (db: PrismaModels) => Promise<T>,
    options: ITransactionOptions = {},
  ): Promise<T> {
    const running = this.ambient.getStore();
    if (running !== undefined) return work(running.orm.public);

    const client = this.client();
    const maxRetries = options.maxRetries ?? 2;
    const timeoutMs = options.timeoutMs ?? TRANSACTION_TIMEOUT_MS;
    for (let attempt = 0; ; attempt++) {
      try {
        return await client.transaction(async (tx) => {
          if (options.isolationLevel) {
            await tx.execute(
              this.unsafe(
                `SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`,
              ),
            );
          }
          return withTimeout(
            this.ambient.run(tx, () => work(tx.orm.public)),
            timeoutMs,
          );
        });
      } catch (error) {
        if (attempt >= maxRetries || !isRetryable(error)) throw error;
      }
    }
  }

  /**
   * The raw SQL tag, for statements the ORM cannot express (`FOR UPDATE SKIP
   * LOCKED`, `ON CONFLICT … DO UPDATE` over many rows, advisory locks). Run what
   * it builds with {@link rawRows} or {@link rawExecute}.
   */
  get sql(): PrismaRawSql {
    return this.client().raw.sql;
  }

  /** A raw SQL parameter whose codec cannot be inferred from the value: `param(date, 'pg/timestamptz-date@1')`. */
  param(value: unknown, codecId: string): PrismaRawParam {
    if (!this.makeParam) throw new Error('PrismaService is not initialised');
    return this.makeParam(value, { codecId });
  }

  /**
   * Joins raw fragments with a separator (Prisma 6's `Prisma.join`):
   * `join(rows.map((r) => sql\`(${r.a}, ${r.b})\`.returns('pg/text@1')), ', ')`.
   */
  join(
    fragments: readonly PrismaRawFragment[],
    separator = ', ',
  ): PrismaRawFragment {
    const strings = ['', ...fragments.slice(1).map(() => separator), ''];
    return this.sql(template(strings), ...fragments).returns('pg/text@1');
  }

  /**
   * Trusted SQL text spliced in verbatim (Prisma 6's `Prisma.raw`): an
   * identifier the code itself chose, never a value from outside.
   */
  verbatim(text: string): PrismaRawFragment {
    return this.sql(template([text])).returns('pg/text@1');
  }

  /**
   * A raw boolean condition for an ORM `.where(...)`, for what the field proxy
   * cannot say (a JSON path, an array membership):
   * `.where(() => prisma.condition\`${role} = ANY("roles")\`)`.
   * Name columns unqualified only on a collection without `include`.
   */
  condition(
    strings: TemplateStringsArray,
    ...values: Parameters<PrismaRawSql>[1][]
  ): PrismaRawCondition {
    return this.sql(strings, ...values)
      .returns('pg/bool@1')
      .buildAst();
  }

  /**
   * `and` / `or` / `not` for an ORM `.where((u) => …)`. Prisma documents them as
   * imports from `@prisma/orm-postgres/orm-client`; that module is ESM-only and
   * a static import compiles to `require()`, which Jest cannot load, so they
   * come from here, loaded with the runtime.
   */
  get and(): (typeof OrmClient)['and'] {
    return this.combinator('and');
  }

  get or(): (typeof OrmClient)['or'] {
    return this.combinator('or');
  }

  get not(): (typeof OrmClient)['not'] {
    return this.combinator('not');
  }

  private combinator<K extends 'and' | 'or' | 'not'>(
    name: K,
  ): (typeof OrmClient)[K] {
    if (!this.combinators) throw new Error('PrismaService is not initialised');
    return this.combinators[name] as (typeof OrmClient)[K];
  }

  /** Runs a `.returnsRow(...)` statement: in the current transaction, if any. */
  async rawRows<Row>(query: PrismaRawRowQuery<Row>): Promise<Row[]> {
    return this.queryable().query<Row>(query.build()).toArray();
  }

  /** Runs an `.affectedCount()` statement and returns the affected row count. */
  async rawExecute(query: PrismaRawCountQuery): Promise<number> {
    const stats = await this.queryable().execute(query.build());
    return stats.affectedRows;
  }

  /**
   * A whole statement of trusted text, without parameters (Prisma 6's
   * `$executeRawUnsafe` for DDL, `TRUNCATE`, `SET LOCAL`). Never pass a value
   * from outside: there is no binding here.
   */
  async rawExecuteUnsafe(text: string): Promise<number> {
    const stats = await this.queryable().execute(this.unsafe(text));
    return stats.affectedRows;
  }

  private unsafe(
    text: string,
  ): ReturnType<
    ReturnType<ReturnType<PrismaRawSql>['affectedCount']>['build']
  > {
    return this.sql(template([text]))
      .affectedCount()
      .build();
  }

  /** Where queries run: the current transaction, else the root runtime. */
  private queryable(): Pick<PrismaTx, 'query' | 'execute' | 'orm'> {
    const tx = this.ambient.getStore();
    if (tx) return tx;
    const client = this.client();
    const runtime = client.runtime();
    return {
      orm: client.orm,
      query: runtime.query.bind(runtime),
      execute: runtime.execute.bind(runtime),
    } as never;
  }

  private client(): PrismaClient {
    if (!this.root)
      throw new Error(
        'PrismaService is not initialised (onModuleInit has not run)',
      );
    return this.root;
  }
}

/** A template-strings array for the raw tag, built from parts the code owns. */
function template(parts: readonly string[]): TemplateStringsArray {
  return Object.assign([...parts], { raw: [...parts] });
}

/** Rejects once `ms` pass; the transaction callback rejecting is what rolls it back. */
async function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const expired = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new TransactionTimeoutError(ms)), ms);
  });
  try {
    return await Promise.race([work, expired]);
  } finally {
    clearTimeout(timer);
  }
}
