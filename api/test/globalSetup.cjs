// Jest globalSetup: runs once before any suite. Builds the dedicated test
// database from scratch on every run (drop, create, then the same
// scripts/migrate.mjs the dev server and the Docker start run), so a database
// left by an earlier run cannot stand in the way. Suites clean their own rows.
//
// It refuses a database whose name does not contain "test": a run pointed at
// the dev database by accident would otherwise drop it.
const { execFileSync } = require('node:child_process');
const { join } = require('node:path');
const { Client } = require('pg');

module.exports = async function globalSetup() {
  require('./env.cjs');
  const url = new URL(process.env.DATABASE_URL);
  const database = decodeURIComponent(url.pathname.slice(1));
  if (!/test/i.test(database)) {
    throw new Error(`globalSetup: refusing to rebuild "${database}": the test database's name must contain "test"`);
  }
  const admin = new URL(url);
  admin.pathname = '/postgres';
  const root = new Client({ connectionString: admin.toString() });
  try {
    await root.connect();
  } catch (error) {
    throw new Error(`globalSetup: cannot reach Postgres at ${admin.host} (run \`bun run docker\`): ${error.message}`);
  }
  try {
    const quoted = '"' + database.replace(/"/g, '""') + '"';
    await root.query(`DROP DATABASE IF EXISTS ${quoted} WITH (FORCE)`);
    await root.query(`CREATE DATABASE ${quoted}`);
  } finally {
    await root.end();
  }
  execFileSync(process.execPath, ['scripts/migrate.mjs'], {
    cwd: join(__dirname, '..'),
    stdio: ['ignore', 'ignore', 'inherit'],
    env: process.env,
  });
};
