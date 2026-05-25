# CleanSlice - Combined API + App Container
# Multi-stage build for NestJS API (port 3333) and Nuxt App (port 3000)
# nginx reverse proxy on port 8080

# ============================================
# Stage 1: Build the API
# ============================================
FROM oven/bun:1-alpine AS api-builder

WORKDIR /build/api

COPY api/package.json api/bun.lock ./
RUN bun install --frozen-lockfile

COPY api/ ./

# Merge slice schemas, generate Prisma client, build NestJS, generate swagger spec
RUN bunx prisma-import --force && bunx prisma generate && bun run build && bun run generate:swagger

# ============================================
# Stage 2: Build the App
# ============================================
FROM oven/bun:1-alpine AS app-builder

WORKDIR /build

# Copy swagger-spec.json for OpenAPI SDK generation
COPY --from=api-builder /build/api/swagger-spec.json ./api/swagger-spec.json

COPY app/package.json app/bun.lock ./app/

WORKDIR /build/app
RUN bun install --frozen-lockfile

COPY app/ ./

ENV NODE_ENV=production
ENV NUXT_PUBLIC_API_URL=/api
RUN bun run build

# ============================================
# Stage 3: Production runtime
# ============================================
FROM node:22-alpine AS runner

RUN apk add --no-cache nginx curl

WORKDIR /app

# Copy API production build
COPY --from=api-builder /build/api/dist ./api/dist
COPY --from=api-builder /build/api/node_modules ./api/node_modules
COPY --from=api-builder /build/api/package.json ./api/
COPY --from=api-builder /build/api/prisma ./api/prisma

# Copy Nuxt production build
COPY --from=app-builder /build/app/.output ./app/.output

# Copy nginx config and startup script
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["./start.sh"]
