// The one way to bring a database up to date:
//
//   node scripts/migrate.mjs     # what the container runs before the api (docker/start.sh)
//   bun run db:deploy            # the same, from a checkout: reads api/.env.dev, then api/.env
//
// It applies the Prisma 8 plans in prisma/migrations up to
// prisma/migrations/app/refs/deploy.json (`prisma db migrate --to deploy`).
// Applied ones are skipped, so a second run is a no-op. The dev server, the
// test global setup and the Docker start all call it, so a database is never
// built two different ways.
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const say = (line) => console.error(`migrate: ${line}`);

function run(command, args) {
  const result = spawnSync(command, args, { cwd: apiDir, stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${[command, ...args].join(' ')} exited with ${result.status ?? result.signal}`);
  }
}

function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

  say('applying database migrations');
  // The CLI's own entry, run by this node: the runtime image has no Bun and no npx.
  const cli = join(apiDir, 'node_modules', 'prisma', 'dist', 'prisma.js');
  run(process.execPath, [cli, 'db', 'migrate', '--to', 'deploy', '--format', 'human']);
  say('done');
}

try {
  main();
} catch (error) {
  say(`failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
