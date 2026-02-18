# CleanSlice Starter Kit

Full-stack starter kit built on the **CleanSlice architecture** — vertical slices with Clean Architecture layers, using NestJS (backend) and Nuxt (frontend).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS, Prisma, PostgreSQL |
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
│   │   │   │   └── health/      # Health check endpoint
│   │   │   └── user/            # Example feature slice
│   │   │       ├── domain/      # Types, abstract gateway
│   │   │       ├── data/        # Concrete gateway, mapper
│   │   │       └── dtos/        # Request/response DTOs
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma        # Auto-generated (do not edit)
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

- Node.js 24+ (see `.nvmrc`)
- Docker & Docker Compose
- npm

## Quick Start

```bash
# 1. Clone the starter kit
git clone <repo-url> my-project
cd my-project

# 2. Start the API
cd api
cp .env.example .env.dev
npm install
docker compose up -d           # Starts PostgreSQL
npm run migrate                # Runs Prisma migrations
npm run start:dev              # http://localhost:3000
                               # Swagger UI: http://localhost:3000/api

# 3. Start the App (new terminal)
cd app
npm install
npm run build:api              # Generates typed SDK from Swagger spec
npm run dev                    # http://localhost:3001
```

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

  async findById(id: string): Promise<IUserData | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.mapper.toDomain(user) : null;
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
// api/src/slices/project/project.prisma
model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

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

Run migration and regenerate:

```bash
npm run migrate                # Merges schemas + creates migration
npm run start:dev              # Restart to update swagger-spec.json
```

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
npm run build:api              # Generates typed services from Swagger
```

The slice auto-registers via `registerSlices.ts` — no manual config needed.

## Import Aliases

### Backend (`#` prefix via tsconfig paths)

```typescript
import { PrismaService } from '#/setup/prisma';
import { IUserData } from '#/user/domain';
```

### Frontend (`#` prefix via nuxt.config alias)

```typescript
import { UsersService, type UserDto } from '#api/data';
import { cn } from '#theme/utils/cn';
```

Nuxt auto-imports Vue APIs, composables, components, and Pinia stores — no manual imports needed for those.

## NPM Scripts

### API

| Script | Purpose |
|--------|---------|
| `npm run start:dev` | Start dev server with hot reload |
| `npm run docker` | Start Docker services (PostgreSQL) |
| `npm run migrate` | Merge Prisma schemas + run migrations |
| `npm run generate` | Merge Prisma schemas only |
| `npm run studio` | Open Prisma Studio (DB browser) |
| `npm run build` | Production build |

### App

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Nuxt dev server |
| `npm run build:api` | Regenerate API SDK from Swagger spec |
| `npm run build` | Production build (regenerates SDK first) |

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
```

## Key Principles

- **All code lives in `slices/`** — no root-level `components/`, `pages/`, or `services/`
- **Gateway, not Repository** — Prisma IS the repository, the gateway provides the abstraction
- **Abstract classes as DI tokens** — `IUserGateway` is both the type and the injection token
- **Provider.vue in every component folder** — handles data fetching, children receive props
- **Pinia stores for state** — in `stores/`, not `composables/`
- **API first, then App** — implement backend before frontend
- **No `any` type** — use `unknown` with type guards

## Documentation

- [CleanSlice Docs](https://cleanslice.dev) — Full architecture documentation
- [CleanSlice MCP](https://github.com/nicenathapong/cleanslice) — AI agent instructions via MCP server

## License

MIT
