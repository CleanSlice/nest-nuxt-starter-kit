// @scope:api
// @slice:setup/prisma
// @layer:data
// @type:types

/**
 * Database errors under Prisma 8.
 *
 * Prisma 6 translated a PostgreSQL error into `PrismaClientKnownRequestError`
 * with a code of its own (`P2002` unique, `P2003` foreign key, `P2034` write
 * conflict) and the columns of the violated constraint in `meta.target`.
 * Prisma 8 passes the database's own error through: a `SqlQueryError` whose
 * `sqlState` (or its `cause`'s) is the SQLSTATE, with the `pg` driver error
 * (constraint name, `detail`) further down the `cause` chain. These helpers
 * read that chain, so a gateway asks the question it asked before.
 *
 * A missing row is no longer an error at all: `update`/`delete` on a collection
 * answer `null` where Prisma 6 threw `P2025`.
 */

/** SQLSTATE 23505: the row collides with a unique constraint (Prisma 6 `P2002`). */
export const UNIQUE_VIOLATION = '23505';
/** SQLSTATE 23503: a foreign key has no parent, or a parent still has children (`P2003`). */
export const FOREIGN_KEY_VIOLATION = '23503';
/** SQLSTATE 23514: a CHECK constraint refused the row. */
export const CHECK_VIOLATION = '23514';

const RETRYABLE_SQLSTATES = new Set(['40001', '40P01']);

interface IDriverError {
  sqlState?: unknown;
  code?: unknown;
  constraint?: unknown;
  detail?: unknown;
  cause?: unknown;
}

/** Walks the `cause` chain (a few links at most) and returns the first match. */
function find<T>(
  error: unknown,
  pick: (link: IDriverError) => T | undefined,
): T | undefined {
  let current: unknown = error;
  for (
    let depth = 0;
    depth < 6 && current !== null && typeof current === 'object';
    depth++
  ) {
    const found = pick(current);
    if (found !== undefined) return found;
    current = (current as IDriverError).cause;
  }
  return undefined;
}

/** The SQLSTATE of a database error, looked up along its `cause` chain. */
export function sqlState(error: unknown): string | undefined {
  return find(error, (link) => {
    if (typeof link.sqlState === 'string') return link.sqlState;
    // The pg driver's own error carries it as `code` (five characters).
    if (typeof link.code === 'string' && /^[0-9A-Z]{5}$/.test(link.code))
      return link.code;
    return undefined;
  });
}

/** The name of the constraint a database error names, if it names one. */
export function violatedConstraint(error: unknown): string | undefined {
  return find(error, (link) =>
    typeof link.constraint === 'string' ? link.constraint : undefined,
  );
}

/**
 * The columns of the unique key a `23505` collided on (what Prisma 6 put in
 * `meta.target`), read off PostgreSQL's `Key (email)=(…) already exists.`
 */
export function uniqueViolationColumns(error: unknown): string[] | undefined {
  if (sqlState(error) !== UNIQUE_VIOLATION) return undefined;
  const detail = find(error, (link) =>
    typeof link.detail === 'string' ? link.detail : undefined,
  );
  const match = detail === undefined ? null : /^Key \((.+?)\)=\(/.exec(detail);
  if (match === null) return undefined;
  return match[1]
    .split(',')
    .map((column) => column.trim().replace(/^"(.*)"$/, '$1'));
}

/**
 * True for a unique violation; with `columns`, only for the key on exactly
 * those columns (in any order). `['id']` is a primary-key collision.
 */
export function isUniqueViolation(
  error: unknown,
  columns?: readonly string[],
): boolean {
  if (sqlState(error) !== UNIQUE_VIOLATION) return false;
  if (columns === undefined) return true;
  const target = uniqueViolationColumns(error);
  return (
    target !== undefined &&
    target.length === columns.length &&
    columns.every((column) => target.includes(column))
  );
}

export function isForeignKeyViolation(error: unknown): boolean {
  return sqlState(error) === FOREIGN_KEY_VIOLATION;
}

/**
 * Serialization failure or deadlock (Prisma 6 `P2034`): safe to run the whole
 * unit of work again.
 */
export function isRetryable(error: unknown): boolean {
  const state = sqlState(error);
  return state !== undefined && RETRYABLE_SQLSTATES.has(state);
}
