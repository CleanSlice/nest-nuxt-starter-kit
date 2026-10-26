# Primary identity

`id` is the primary key of every entity. The format is one standard across all
CleanSlice products, documented with its control test vector in the
**Identifiers** standard (docs site: Standards → Identifiers; MCP:
`02-standards/id-standards.md`):

```
<prefix>-<adjective>-<noun>-<12 Crockford base32>
user-calm-rivers-k8m4p2d7n9x3
```

`domain/idFormat.ts` is the one module that generates and checks it. It is the
same in every repository except `LEGACY_ID_FORMATS`.

## Minting

`formatId(prefix)` is the only way a new ID is made. Words come from
**human-id 4.1.3** adjectives/nouns, each index drawn by masked rejection; the
suffix is **nanoid 3.3.11** `customRandom`; all bytes from Node
`crypto.randomBytes`. Both versions are pinned exactly in `package.json` and
`bun.lock`; `domain/tests/idFormat.spec.ts` fails if either floats.

The suffix supplies 60 bits, the words a further ~16. Neither is a uniqueness
guarantee: the database primary key is. `withIdRetry` repeats the entire write
at most five times, only for a Prisma `P2002` whose target is exactly `['id']`;
mint inside the callback so every attempt is a new candidate:

```typescript
const user = await withIdRetry(() =>
  this.prisma.user.create({ data: { id: formatId(USER_ID_PREFIX), ...createData } }),
);
```

Do not wrap a single statement inside an already aborted transaction (pass
`insideTransaction = true` from within `$transaction`; the owner of the
transaction repeats the whole unit of work), and never repeat external effects.

## Prefixes

A prefix is lowercase kebab-case, at most 32 characters, and may contain `-`
(`team-api-key`). The number of segments after it is fixed, so
`team-api-key-…` is never a `team` ID. Each slice declares its prefix next to
its types (`USER_ID_PREFIX = 'user'` in `user/domain/user.types.ts`); the
registry of prefixes belongs to the application, not to this slice.

## Validation

`isId(value, prefix)` accepts the canonical form or an already issued legacy
one. It refuses case, Unicode, percent encoding and whitespace rather than
normalizing identities. It never looks anything up and never grants access.

- DTO field: `@IsEntityId('team') teamId: string`
- Route or query parameter: `@Param('id', new EntityIdPipe('user')) id: string`
- Anywhere else (zod, pipes of your own): `entityId('user')` returns the check
- OpenAPI: `@ApiProperty({ pattern: idPattern('user') })`

## Reservation

`IIdGateway.reserve(prefix)` burns an identity in its own committed statement
before irreversible external work that must carry it (an object key in S3, a
provider-side record, a webhook secret). Failed operations do not recycle IDs.
Call it before opening the business transaction.

## Legacy

A fresh project has issued nothing, so `LEGACY_ID_FORMATS` is empty. A project
scaffolded before this standard still holds `user-<uuid>` rows; it adds that
shape to `LEGACY_ID_FORMATS` (the comment in `idFormat.ts` shows the entry),
and nothing else changes: legacy IDs are accepted, never minted. Rewriting
existing rows is a separate, explicitly approved maintenance transition.
