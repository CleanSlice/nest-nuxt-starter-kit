#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/api
# The one migration entrypoint (Prisma 8 plans up to the deploy ref). The
# runner stage is a plain Node image (no Bun): it runs the CLI with node.
node scripts/migrate.mjs

echo "Starting API on port 3333..."
NODE_ENV=production PORT=3333 node dist/main.js &

echo "Starting Nuxt on port 3000..."
cd /app/app
PORT=3000 node .output/server/index.mjs &

echo "Starting nginx on port 8080..."
nginx -g 'daemon off;'
