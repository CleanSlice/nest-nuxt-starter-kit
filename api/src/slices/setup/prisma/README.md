# prisma (setup slice)

The database client on **Prisma 8**. Postgres only.

`PrismaService` is the single owner of the connection; `PrismaModule` is
`@Global()`, so every gateway injects it without importing the module. Prisma
**is** the repository: gateways query it directly, there are no `*Repository`
classes over it.

## Contract

- Each slice owns its `{slice}.prisma` at the slice root, first line
  `// use prisma-8` (`user/user/user.prisma`, `setup/id/id.prisma`).
- `api/prisma.config.ts` globs `./src/slices/**/*.prisma`. There is no
  assembled `schema.prisma`, no `datasource` or `generator` block and no
  prisma-import: the connection is `DATABASE_URL`.
- `bun run prisma:emit` (`prisma contract emit`; also `postinstall`, `build`,
  `dev`, `typecheck`, `test`) writes `api/generated/prisma/contract.{json,d.ts}`.
  Generated, gitignored. `PrismaService` reads `contract.json` at start.
- Timestamps are `TimestamptzJsDate(3)`, read and written as JS `Date`;
  `@updatedAt` is `temporal.timestamptzJsDate(3, onCreate: now, onUpdate: now)`.

## Types

Prisma 8 generates no `User` / `Prisma.UserCreateInput`. `prisma.types.ts`
derives them from the contract: `PrismaRow<'User'>` (a row),
`PrismaCreate<'User'>`, `PrismaUpdate<'User'>`, `PrismaModels`, `JsonValue`,
`JsonObject`. Mappers take and return these; domain types never see them.

## Querying

```ts
private get users() { return this.prisma.db.public.User; }

await this.users.first({ id });                                     // Row | null
await this.users.where((u) => u.email.ilike(pattern)).orderBy((u) => u.createdAt.desc()).limit(10).all();
await this.users.aggregate((a) => ({ n: a.count() }));
await this.users.create({ id: formatId('user'), ...data });
await this.users.where({ id }).update(changes);                     // Row | null: no P2025
await this.users.where({ id }).delete();                            // Row | null
```

`and` / `or` / `not` come from the service (`this.prisma.or(...)`): the
`orm-client` module is ESM-only and cannot be imported statically.

Raw SQL: `this.prisma.sql` (the tag; every `${value}` is a bound parameter),
then `rawRows(sql\`…\`.returnsRow({ id: 'pg/text@1' }))` or
`rawExecute(sql\`…\`.affectedCount())`. `param(value, codecId)` for a value
whose codec cannot be inferred (null, `Date`, arrays, JSON); `join`, `verbatim`
(trusted text only), `condition` (a raw predicate inside an ORM `.where`),
`rawExecuteUnsafe(text)` (no parameters: DDL, `TRUNCATE`).

Errors (`prisma.errors.ts`): Prisma 8 passes PostgreSQL's SQLSTATE through
instead of `P2002` / `P2003`. `isUniqueViolation(error, ['email'])`,
`uniqueViolationColumns`, `isForeignKeyViolation`, `isRetryable`, `sqlState`,
`violatedConstraint`.

## Transactions

`this.prisma.transaction(async () => { … }, options?)` runs the callback as one
unit: every write it makes through `PrismaService`, directly or through any
gateway it calls, commits together or not at all. The transaction is ambient
(an `AsyncLocalStorage`): `db` and the raw helpers answer with it, so gateways
take no `tx` parameter and no Prisma type reaches a domain contract.

- A `transaction()` opened inside another **joins** it (Postgres has no nested
  transactions; savepoints are not used).
- The outermost one retries a serialization failure or deadlock (40001/40P01)
  `maxRetries` times (default 2), so the callback must have no side effects
  outside the database; it gives up after `timeoutMs` (30 s) with
  `TransactionTimeoutError`; `isolationLevel` sets the isolation.
- There is no batched `$transaction([...])`: the callback is the only shape.
- `withIdRetry(work, this.prisma.inTransaction)`: inside a transaction an id
  collision is left to the owner of the unit.

## Migrations

TypeScript plans in `api/prisma/migrations/app/<timestamp>_<name>/`
(`migration.ts` + `ops.json` + `migration.json`), applied forward only up to
`prisma/migrations/app/refs/deploy.json`.

1. Edit the slice's `.prisma`, `bun run prisma:emit`.
2. `bun run db:plan -- --name <what>`: plans from the `deploy` ref (the last
   shipped contract) and prints the DDL. Review `ops.json`.
3. SQL the planner cannot say (a partial index, a trigger): a guarded `rawSql`
   step in `migration.ts`, then self-emit with
   `node prisma/migrations/app/<dir>/migration.ts`.
4. `bunx prisma migration ref set deploy <hash>` (the plan's `to` hash).
5. `bun run db:deploy`.

`bun run db:deploy` = `node scripts/migrate.mjs`, the one entrypoint the dev
server (`predev`), the test global setup and the Docker start (`docker/start.sh`)
all use. A second run is a no-op. `bun run db:status`, `bun run db:verify`.

## Tests

Jest runs under `NODE_OPTIONS=--experimental-vm-modules` (`bun run test`; never
`bun test`): the runtime is loaded with a real `import()`. `test/globalSetup.cjs`
drops and recreates the test database (its name must contain `test`;
`TEST_DATABASE_URL` overrides the default) and runs `scripts/migrate.mjs`.
`tests/prisma.service.e2e-spec.ts` pins the error shape, the transaction
semantics and the raw helpers against that database. Outside Nest (scripts,
suites) use `await PrismaService.open()` … `close()`.

Prisma's own reference for this exact version ships in
`node_modules/@prisma/orm-postgres/skills/prisma-8/references/`.

## Depends on

`@prisma/orm-postgres` 8.0.0-rc.14 (runtime), `prisma` 8.0.0-rc.19 (CLI, dev),
`@prisma/orm-toolchain` / `@prisma/orm-framework` 8.0.0-rc.14 (`overrides`),
`pg` (test setup). All pinned exactly; `bun.lock` is committed.
