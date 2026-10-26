// @scope:api
// @slice:setup/id
// @layer:data
// @type:util

import { isUniqueViolation } from '#setup/prisma';

export const ID_MAX_ATTEMPTS = 5;

/**
 * Retry a complete atomic write, minting candidates INSIDE the callback.
 * Never retry a failed statement inside an aborted PostgreSQL transaction:
 * pass `insideTransaction = true` from within `$transaction` and let the
 * owner of the transaction repeat the whole unit of work.
 * Only primary `id` collisions qualify; email/name/idempotency conflicts keep
 * their original semantics. External side effects must stay outside `work`.
 */
export async function withIdRetry<T>(
  work: () => Promise<T>,
  insideTransaction = false,
): Promise<T> {
  if (insideTransaction) return work();
  for (let attempt = 1; ; attempt++) {
    try {
      return await work();
    } catch (error) {
      // A unique violation on exactly the `id` key: Prisma 6 P2002 with
      // `meta.target` of `['id']`, read off the database's own error.
      const collision = isUniqueViolation(error, ['id']);
      if (!collision || attempt >= ID_MAX_ATTEMPTS) throw error;
    }
  }
}
