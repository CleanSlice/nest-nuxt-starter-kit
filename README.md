# CleanSlice Starter Kit

Full-stack starter kit built on the **CleanSlice architecture** — vertical slices with Clean Architecture layers, using NestJS (backend) and Nuxt (frontend).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS, Prisma 8, PostgreSQL |
| Frontend | Nuxt 3, Vue 3, Pinia |
| Styling | Tailwind CSS, shadcn-vue |
| API Contract | Swagger/OpenAPI, @hey-api/openapi-ts |
| Infrastructure | Docker Compose |

## Project Structure

```
nest-nuxt-starter-kit/
├── api/                          # Backend (NestJS)
│   ├── src/
│   │   ├── slices/
│   │   │   ├── setup/
│   │   │   │   ├── prisma/      # Database ORM (global)
│   │   │   │   ├── error/       # Error handling interceptors
│   │   │   │   ├── health/      # Health check endpoint
│   │   │   │   ├── id/          # Primary IDs: formatId(), withIdRetry(), @IsEntityId()
│   │   │   │   └── mail/        # Email sending (SMTP; Mailpit locally)
│   │   │   └── user/            # Example feature slice
│   │   │       ├── domain/      # Types, abstract gateway
│   │   │       ├── data/        # Concrete gateway, mapper
│   │   │       └── dtos/        # Request/response DTOs
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   └── migrations/          # Prisma 8 migration plans (TypeScript), forward only
│   ├── generated/prisma/        # Emitted contract (`prisma contract emit`, gitignored)
│   ├── scripts/
│   │   ├── cleanslice-check.cjs # Boundary check (runs on `bun run dev`)
│   │   └── migrate.mjs          # The one migration entrypoint (dev, tests, Docker)
│   ├── prisma.config.ts         # Prisma 8: globs src/slices/**/*.prisma
│   ├── cleanslice.config.cjs    # Slice groups, lowest first
│   ├── docker-compose.yml
│   ├── .env.example
│   └── tsconfig.json
│
├── app/                          # Frontend (Nuxt)
│   ├── slices/
│   │   ├── setup/
│   │   │   ├── theme/           # Tailwind + shadcn-vue components
│   │   │   ├── pinia/           # State management config
│   │   │   ├── api/             # Generated API SDK (@hey-api)
│   │   │   ├── error/           # Error handling + toasts
│   │   │   └── i18n/            # Internationalization
│   │   └── user/                # Example feature slice
│   │       ├── pages/
│   │       ├── components/
│   │       └── stores/
│   ├── nuxt.config.ts
│   ├── registerSlices.ts        # Auto-discovers slice layers
│   └── app.vue
│
└── README.md
```

## Prerequisites

- [Bun](https://bun.sh/) — the package manager for everything here
- Node.js 24+ (see `.nvmrc`) — still the production runtime for the api
- Docker & Docker Compose

## AI Development Skills (Claude Code)

This starter kit includes a `/setup` skill that installs the required agent skills for AI-assisted development:

| Skill | Purpose |
|-------|---------|
| **cleanslice** | Architecture patterns, vertical slices, gateway, Provider.vue |
| **shadcn-vue** | UI component library, Reka UI, Tailwind, dark mode |
| **conventional-commits** | Conventional Commits standard for git messages |

Run `/setup` in Claude Code to install all skills. You can also install them manually:

```bash
bunx playbooks add skill noartem/skills --skill shadcn-vue
bunx skills add CleanSlice/skills --skill cleanslice
bunx skills add CleanSlice/skills --skill conventional-commits
```

Restart the Claude Code session after installing to activate the skills.

## Quick Start

```bash
# 1. Clone the starter kit
git clone <repo-url> my-project
cd my-project

# 2. Start the API
cd api
cp .env.example .env.dev
bun install
docker compose up -d           # Starts PostgreSQL + Mailpit (inbox: http://localhost:4232)
bun run db:deploy              # Applies the Prisma 8 migrations (bun run dev does it too)
bun run dev                    # http://localhost:4229
                               # Swagger UI: http://localhost:4229/api

# 3. Start the App (new terminal)
cd app
bun install
bun run build:api              # Generates typed SDK from Swagger spec
bun run dev                    # http://localhost:4226

# 4. Install AI development skills (Claude Code)
/setup                         # Installs CleanSlice + shadcn-vue skills
```

The api is on **Prisma 8**: no assembled `schema.prisma`, no `prisma generate`.
Each slice owns its `*.prisma`; `bun install` emits the contract to
`generated/prisma`. A local database built by the earlier Prisma 6 kit cannot
take the Prisma 8 migrations: reset it (`docker compose down && rm -rf
docker/postgresql`) or follow
[Upgrading a Prisma 6 project](https://github.com/CleanSlice/mcp/blob/main/docs/01-setup/api-prisma.md#upgrading-a-prisma-6-project).

## Architecture

### Vertical Slices

Every feature is a self-contained **slice** — a folder that owns its own layers, routes, components, and data access. Adding a feature means adding a folder. Removing one means deleting it.

```
slices/user/                   # One slice = one feature
├── user.controller.ts         # Presentation layer
├── domain/                    # Domain layer (business rules)
│   ├── user.types.ts          # Interfaces: IUserData
│   └── user.gateway.ts        # Abstract class: IUserGateway
├── data/                      # Data layer (infrastructure)
│   ├── user.gateway.ts        # Concrete gateway (Prisma)
│   └── user.mapper.ts         # Prisma → domain conversion
└── dtos/                      # API boundary
    ├── user.dto.ts             # Response DTO
    └── createUser.dto.ts       # Request DTO
```

### Three Layers

```
Presentation  →  Domain  →  Data
(HTTP/UI)        (Rules)    (Prisma/API)
```

Dependencies always point inward. The domain layer has no knowledge of frameworks, databases, or UI.

### Boundary Check

Those rules are invisible to the compiler — TypeScript accepts a controller
that injects a gateway from a neighbouring slice — so they are checked by a
program instead of by review:

```bash
bun run check     # also runs automatically before `bun run dev`
```

```
cleanslice-check: OK — 2 group(s) [setup -> user], 64 modules, 296 ms
```

Three rules: groups depend only downward, no cycles anywhere, and inside a
slice the presentation and domain layers never touch `data/`. The group order
is declared in `api/cleanslice.config.cjs`, so the script itself is the same
in every CleanSlice project:

```javascript
module.exports = {
  groups: ['setup', 'user'],   // lowest first — the order IS the rule
};
```

What the check does NOT catch is written down: CleanSlice MCP,
`02-standards/boundary-check.md`. A green run means "none of these three rules
is broken", never "this code is CleanSlice".

### Gateway Pattern

The abstract gateway lives in `domain/`, the concrete implementation in `data/`. Prisma IS the repository — no extra layer needed.

```typescript
// domain/user.gateway.ts — the contract
export abstract class IUserGateway {
  abstract findAll(): Promise<IUserData[]>;
  abstract findById(id: string): Promise<IUserData | null>;
  abstract create(data: ICreateUserData): Promise<IUserData>;
}

// data/user.gateway.ts — the implementation
@Injectable()
export class UserGateway extends IUserGateway {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: UserMapper,
  ) { super(); }

  private get users() {
    return this.prisma.db.public.User;
  }

  async findById(id: string): Promise<IUserData | null> {
    const user = await this.users.first({ id });
    return user ? this.mapper.toData(user) : null;
  }
}
```

### Provider.vue Pattern (Frontend)

Every component folder has a `Provider.vue` that handles data fetching. Child components receive data via props:

```vue
<!-- components/user/Provider.vue -->
<script setup lang="ts">
const props = defineProps<{ id: string }>();
const store = useUserStore();
const { data, pending } = await useAsyncData('user', () => store.fetchById(props.id));
</script>

<template>
  <UserItem v-if="!pending" :user="data" />
  <div v-else>Loading...</div>
</template>
```

## Naming Conventions

| What | Rule | Example |
|------|------|---------|
| Slice folders | **Singular** | `user/`, `project/`, `chat/` |
| Controller routes | **Plural** | `@Controller('users')` |
| Page files | **Plural** | `pages/users.vue` |
| DTO files | **camelCase** | `createUser.dto.ts` |
| Interfaces | **I prefix** | `IUserData`, `IUserGateway` |
| Enums | **Types suffix** | `UserStatusTypes`, `RoleTypes` |
| Enum values | **String** | `Active = 'active'` |

## Setup Slices

Setup slices provide shared infrastructure. They are pre-configured in this starter kit.

### Backend (`api/src/slices/setup/`)

| Slice | Purpose |
|-------|---------|
| `prisma/` | Database ORM — global `PrismaService` |
| `error/` | Error handling + response interceptors |
| `health/` | `GET /health` endpoint |
| `id/` | Primary IDs: `formatId(prefix)` + `withIdRetry()` in gateways, `@IsEntityId()` / `EntityIdPipe` at the boundary |
| `mail/` | Email sending behind `IMailGateway`; Mailpit locally |

### Frontend (`app/slices/setup/`)

| Slice | Purpose | Alias |
|-------|---------|-------|
| `theme/` | Tailwind CSS + shadcn-vue components | `#theme` |
| `pinia/` | State management + store auto-discovery | — |
| `api/` | Generated TypeScript SDK from Swagger | `#api` |
| `error/` | Error handling + toast notifications | `#error` |
| `i18n/` | Internationalization (en, fr, etc.) | `#i18n` |

Registration order matters — dependencies load first. This is handled by `registerSlices.ts`.

## Adding a New Feature Slice

### 1. Backend

```bash
mkdir -p api/src/slices/project/{domain,data,dtos}
```

Create the files:

```
api/src/slices/project/
├── project.module.ts
├── project.controller.ts          # @Controller('projects')
├── domain/
│   ├── index.ts
│   ├── project.types.ts           # IProjectData, ICreateProjectData
│   └── project.gateway.ts         # Abstract IProjectGateway
├── data/
│   ├── project.gateway.ts         # Concrete gateway (Prisma)
│   └── project.mapper.ts
└── dtos/
    ├── index.ts
    ├── project.dto.ts
    ├── createProject.dto.ts
    └── filterProject.dto.ts
```

Add the Prisma model at the slice root:

```prisma
// use prisma-8
// api/src/slices/project/project.prisma
model Project {
  id          String  @id // minted by the gateway: formatId('project'), never @default(uuid()/cuid())
  name        String
  description String?
  createdAt   TimestamptzJsDate(3) @default(now())
  updatedAt   temporal.timestamptzJsDate(3, onCreate: now, onUpdate: now)
}
```

`prisma.config.ts` picks the file up by its glob: there is no schema to assemble.

Register in `app.module.ts`:

```typescript
import { ProjectModule } from './slices/project/project.module';

@Module({
  imports: [
    // ... setup slices
    ProjectModule,
  ],
})
export class AppModule {}
```

Plan the migration, point the deploy ref at it, apply:

```bash
bun run prisma:emit                         # Emits the contract (types for the gateway)
bun run db:plan -- --name project           # Writes prisma/migrations/app/<timestamp>_project
                                            # Review its ops.json / the DDL preview
bunx prisma migration ref set deploy <hash> # The "to" hash the plan printed
bun run db:deploy                           # Applies it (bun run dev does this too)
```

The full workflow, raw SQL, transactions and upgrading a Prisma 6 project:
[Prisma setup](https://github.com/CleanSlice/mcp/blob/main/docs/01-setup/api-prisma.md).

### 2. Frontend

```bash
mkdir -p app/slices/project/{pages,components/project,components/projectList,stores,locales}
```

Create the files:

```
app/slices/project/
├── nuxt.config.ts                 # Alias: #project
├── pages/
│   ├── projects.vue               # /projects
│   └── projects/[id].vue          # /projects/:id
├── components/
│   ├── project/
│   │   ├── Provider.vue           # Data fetching
│   │   ├── Item.vue               # Display
│   │   └── Form.vue               # Create/edit
│   └── projectList/
│       ├── Provider.vue
│       └── Thumb.vue              # List card
├── stores/
│   └── project.ts                 # Pinia store
└── locales/
    └── en.json
```

Regenerate the API SDK:

```bash
bun run build:api              # Generates typed services from Swagger
```

The slice auto-registers via `registerSlices.ts` — no manual config needed.

## Import Aliases

### Backend (`#` prefix via tsconfig paths)

```typescript
import { PrismaService } from '#setup/prisma';
import { IUserData } from '#user/user/domain';
```

### Frontend (`#` prefix via nuxt.config alias)

```typescript
import { UsersService, type UserDto } from '#api/data';
import { cn } from '#theme/utils/cn';
```

Nuxt auto-imports Vue APIs, composables, components, and Pinia stores — no manual imports needed for those.

## Scripts

Every command here runs through **Bun** — `bun install`, `bun run <script>`,
`bunx <cli>`. The lockfile is `bun.lock`; there is no `package-lock.json` in
this repo and adding one back would give the project two disagreeing
dependency graphs.

### API

| Script | Purpose |
|--------|---------|
| `bun run dev` | Start dev server with hot reload (runs `check` first) |
| `bun run check` | CleanSlice boundary check — groups, cycles, slice layers |
| `bun run docker` | Start Docker services (PostgreSQL, Mailpit) |
| `bun run db:deploy` | Apply the Prisma 8 migrations (`scripts/migrate.mjs`) |
| `bun run db:plan -- --name <what>` | Plan a migration from the `deploy` ref to the current contract |
| `bun run db:status` / `db:verify` | Migration status / check the database against the contract |
| `bun run prisma:emit` | Emit the contract to `generated/prisma` (also postinstall, build, dev, test) |
| `bun run typecheck` | Emit the contract, then `tsc --noEmit` |
| `bun run test` | Unit and Postgres-backed specs (rebuilds the `cleanslice-api-test` database) |
| `bun run build` | Production build |

### App

| Script | Purpose |
|--------|---------|
| `bun run dev` | Start Nuxt dev server |
| `bun run build:api` | Regenerate API SDK from Swagger spec |
| `bun run build` | Production build (regenerates SDK first) |

## Environment Variables

Copy `.env.example` to `.env.dev` in the `api/` directory:

```bash
# Database (Docker)
DATABASE_URL=postgresql://postgres:root@localhost:5432/starter-api-local-database

# Server
PORT=3000
CORS_ORIGIN=http://localhost:3001

# JWT
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=7d

# Email (Docker: Mailpit catches everything, inbox at http://localhost:4232)
SMTP_HOST=localhost
SMTP_PORT=4231
SMTP_SECURE=false
SMTP_FROM=CleanSlice <noreply@cleanslice.local>
```

### In a deployed container

The image reads these from the environment, and the api **exits on boot**
without them:

| Variable | Read by | Consequence when missing |
|----------|---------|--------------------------|
| `DATABASE_URL` | Prisma, both at `start.sh` migration time (`scripts/migrate.mjs`) and at runtime | migrations fail, api never starts |
| `JWT_SECRET` | `JwtStrategy` via `getOrThrow` | `Configuration key "JWT_SECRET" does not exist` — api exits |

A missing `JWT_SECRET` is quiet from the outside. Nuxt keeps serving pages on
`/`, and only `/health` and `/api/*` return 502 — nginx is up, the api behind
it is not.

## Key Principles

- **All code lives in `slices/`** — no root-level `components/`, `pages/`, or `services/`
- **Gateway, not Repository** — Prisma IS the repository, the gateway provides the abstraction
- **One ID format** — `<prefix>-<adjective>-<noun>-<12 Crockford>`, minted by the gateway with `formatId()`; never `@default(uuid())` / `cuid()`
- **Abstract classes as DI tokens** — `IUserGateway` is both the type and the injection token
- **Provider.vue in every component folder** — handles data fetching, children receive props
- **Pinia stores for state** — in `stores/`, not `composables/`
- **API first, then App** — implement backend before frontend
- **No `any` type** — use `unknown` with type guards

## Documentation

- [CleanSlice Docs](https://cleanslice.org) — Full architecture documentation
- [CleanSlice MCP](https://mcp.cleanslice.org) — AI agent instructions via MCP server
- [GitHub](https://github.com/CleanSlice/nest-nuxt-starter-kit) — Starter kit repository

## License

MIT
