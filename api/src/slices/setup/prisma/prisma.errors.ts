// @scope:api
// @slice:setup/prisma
// @layer:data
// @type:types

import { Prisma } from '@prisma/client';

/**
 * Prisma 6 surfaces a unique-constraint violation as `P2002`; on PostgreSQL
 * `meta.target` lists the columns of the violated index.
 */
export function uniqueViolationColumns(error: unknown): string[] | undefined {
  if (!isPrismaKnownError(error) || error.code !== 'P2002') return undefined;
  const target = (error.meta as { target?: unknown } | undefined)?.target;
  if (Array.isArray(target)) return target.map(String);
  if (typeof target === 'string') return [target];
  return undefined;
}

/**
 * True for a unique violation; with `columns`, only for the index on exactly
 * those columns (in any order). `['id']` is a primary-key collision.
 */
export function isUniqueViolation(
  error: unknown,
  columns?: readonly string[],
): boolean {
  if (!isPrismaKnownError(error) || error.code !== 'P2002') return false;
  if (columns === undefined) return true;
  const target = uniqueViolationColumns(error);
  return (
    target !== undefined &&
    target.length === columns.length &&
    columns.every((column) => target.includes(column))
  );
}

function isPrismaKnownError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}
