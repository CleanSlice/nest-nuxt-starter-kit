import { definePrismaConfig } from 'prisma/config';
import { defineConfig as definePostgresConfig } from '@prisma/orm-postgres/config';

/**
 * Prisma 8 CLI configuration.
 *
 * `contract` globs the `*.prisma` files of the slices: each model lives in the
 * slice whose gateway owns it (src/slices/<slice>/<slice>.prisma). There is no
 * assembled schema. The emitted contract (contract.json + contract.d.ts) goes
 * to generated/prisma, outside src/ and ignored by Git. Migrations are
 * TypeScript plans in Git under prisma/migrations, applied forward only.
 *
 * Prisma 8 has no datasource or generator block: the connection is
 * DATABASE_URL here. It is optional, so `contract emit` works without a database.
 */
export default definePrismaConfig({
  orm: definePostgresConfig({
    contract: './src/slices/**/*.prisma',
    output: 'generated/prisma',
    migrations: { dir: 'prisma/migrations' },
    db: { connection: process.env['DATABASE_URL'] },
  }),
});
