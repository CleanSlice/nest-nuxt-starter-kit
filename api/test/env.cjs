// Jest setupFiles: every test worker talks to the TEST database, never the dev
// one. TEST_DATABASE_URL overrides the default (the docker-compose Postgres).
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://postgres:root@localhost:4230/cleanslice-api-test';
process.env.JWT_SECRET ||= 'jest-only-secret';
