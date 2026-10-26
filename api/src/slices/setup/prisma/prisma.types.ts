// @scope:api
// @slice:setup/prisma
// @layer:data
// @type:types

import type postgres from '@prisma/orm-postgres/runtime' with {
  'resolution-mode': 'import',
};
import type { param as rawParam } from '@prisma/orm-postgres/relational-core/expression' with {
  'resolution-mode': 'import',
};
import type { JsonValue as PrismaJsonValue } from '@prisma/orm-postgres/target/codec-types' with {
  'resolution-mode': 'import',
};

import type { Contract } from '../../../../generated/prisma/contract.d.ts' with {
  'resolution-mode': 'import',
};

/**
 * The names a gateway or mapper types its rows with. Prisma 8 generates no
 * `User` / `Prisma.UserCreateInput` model types the way Prisma 6 did:
 * everything is derived from the emitted contract, here, once.
 */

export type PrismaClient = ReturnType<typeof postgres<Contract>>;
export type PrismaTx = Parameters<
  Parameters<PrismaClient['transaction']>[0]
>[0];
/** What a gateway queries: the ORM of the root client or of the current transaction. */
export type PrismaDb = PrismaClient['orm'];
/** The model collections of the `public` schema, e.g. `PrismaModels['User']`. */
export type PrismaModels = PrismaDb['public'];
export type PrismaModelName = Extract<keyof PrismaModels, string>;

/**
 * The raw SQL tag. Every `${value}` becomes a bound parameter, never text in
 * the statement. A bare string, number, bigint, boolean or Uint8Array infers
 * its codec; anything else (null, Date, an array, a JSON object) goes through
 * `PrismaService.param`. Terminate with `.returnsRow({ column: 'pg/text@1', … })`
 * for rows or `.affectedCount()` for a statement without them; `.returns(codec)`
 * makes a fragment that another raw template can embed.
 */
export type PrismaRawSql = PrismaClient['raw']['sql'];
/** A parameter with an explicit codec, e.g. `param(null, 'pg/text@1')`. */
export type PrismaRawParam = ReturnType<typeof rawParam>;
/** A raw fragment: `sql\`…\`.returns('pg/text@1')`, embeddable in another raw template. */
export type PrismaRawFragment = ReturnType<ReturnType<PrismaRawSql>['returns']>;
/** A raw boolean condition, accepted by an ORM `.where(() => condition)`. */
export type PrismaRawCondition = ReturnType<PrismaRawFragment['buildAst']>;
type RawPlan = Parameters<PrismaTx['execute']>[0];
/** A `.returnsRow(...)` statement; Row is resolved from its codec spec. */
export interface PrismaRawRowQuery<Row> {
  build(): RawPlan & { readonly _row?: Row };
}
/** An `.affectedCount()` statement. */
export interface PrismaRawCountQuery {
  build(): RawPlan;
}

/** A JSON value as a `Jsonb` column reads and writes it (Prisma 6's `Prisma.JsonValue`). */
export type JsonValue = PrismaJsonValue;
/** A JSON object (Prisma 6's `Prisma.JsonObject` / `Prisma.InputJsonObject`). */
export type JsonObject = { [key: string]: JsonValue };

/*
 * What a mapper converts from and to, derived from a model collection: the
 * counterparts of Prisma 6's `User`, `Prisma.UserCreateInput` and
 * `Prisma.UserUpdateInput`, which Prisma 8 does not generate.
 */
type AnyFn = (...args: never[]) => unknown;
export type PrismaResponse<C extends { first: AnyFn }> = NonNullable<
  Awaited<ReturnType<C['first']>>
>;
/** A row of a model as a plain read returns it: every column, no relation. */
export type PrismaRow<M extends PrismaModelName> = PrismaResponse<
  PrismaModels[M]
>;
/** The first overload of `create`: plain columns, without nested relation writes. */
export type PrismaCreateRequest<C extends { create: AnyFn }> =
  C['create'] extends {
    (data: infer Data, ...rest: never[]): unknown;
    (...args: never[]): unknown;
  }
    ? Data
    : never;
export type PrismaCreate<M extends PrismaModelName> = PrismaCreateRequest<
  PrismaModels[M]
>;
export type PrismaUpdateRequest<
  C extends { where: (...args: never[]) => { update: AnyFn } },
> = Parameters<ReturnType<C['where']>['update']>[0];
export type PrismaUpdate<M extends PrismaModelName> = PrismaUpdateRequest<
  PrismaModels[M]
>;
