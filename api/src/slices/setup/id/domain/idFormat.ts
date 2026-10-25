// @scope:api
// @slice:setup/id
// @layer:domain
// @type:types

import { randomBytes } from 'node:crypto';
import { adjectives, nouns } from 'human-id';
import { customRandom } from 'nanoid';

/**
 * The CleanSlice primary ID format. This module is the same in every
 * CleanSlice product; only LEGACY_ID_FORMATS differs.
 *
 *   <prefix>-<adjective>-<noun>-<suffix>      user-calm-rivers-k8m4p2d7n9x3
 *
 * Pure TypeScript (no enums, no parameter properties) so that a plain Node
 * script can load it. Changing the words, alphabet, length or draw order
 * changes the control test vector in every product; see the Identifiers
 * standard in the CleanSlice documentation.
 */

/** Crockford base32, lower case: no i, l, o, u. */
export const ID_SUFFIX_ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz';
export const ID_SUFFIX_LENGTH = 12;
/** The longest accepted value of any format, legacy included. */
export const ID_MAX_LENGTH = 80;
const ID_PREFIX_MAX_LENGTH = 32;
const prefixShape = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

const dictionary = (list: readonly string[]): readonly string[] =>
  Object.freeze(
    list
      .map((word) => word.toLowerCase())
      .filter((word) => /^[a-z]+$/.test(word)),
  );

/** human-id 4.1.3 exactly, in the package's own order, lower-cased, non-[a-z] words dropped. */
export const ID_WORDS: Readonly<{
  adjectives: readonly string[];
  nouns: readonly string[];
}> = Object.freeze({
  adjectives: dictionary(adjectives),
  nouns: dictionary(nouns),
});

/** `size` random bytes, as `crypto.randomBytes` (the default). */
export type IdRandom = (size: number) => Uint8Array;

export type IdPrefixes = string | readonly string[];

/** A caller owns its prefix policy; this lower layer knows no business entities. */
export function assertIdPrefix(prefix: string): void {
  if (!isPrefix(prefix)) throw new TypeError('Invalid identity prefix');
}

function isPrefix(prefix: unknown): prefix is string {
  return (
    typeof prefix === 'string' &&
    prefix.length <= ID_PREFIX_MAX_LENGTH &&
    prefixShape.test(prefix)
  );
}

/**
 * An index below `n`, unbiased: the fewest whole bytes that hold n − 1, read
 * big-endian, masked to its bit length, drawn again while not below n.
 * 200 adjectives: 1 byte, mask 255. 300 nouns: 2 bytes, mask 511.
 */
function index(n: number, random: IdRandom): number {
  const bits = Math.max(1, Math.ceil(Math.log2(n)));
  const size = Math.ceil(bits / 8);
  const mask = 2 ** bits - 1;
  for (;;) {
    const bytes = random(size);
    let value = 0;
    for (let i = 0; i < size; i++) value = value * 256 + bytes[i];
    value &= mask;
    if (value < n) return value;
  }
}

/**
 * A candidate ID only: the primary key decides uniqueness (retry up to five
 * times on a collision). Draws, in order: the adjective, the noun, then the
 * suffix by nanoid 3.3.11 `customRandom` from the same source (one request of
 * 19 bytes, read from the last one back, a 5-bit mask of each, 12 kept).
 * Control vector: bytes 0, 1, 2, … → formatId('user', it) =
 * 'user-afraid-swans-nmkjhgfedcba' (22 bytes read).
 */
export function formatId(
  prefix: string,
  random: IdRandom = randomBytes,
): string {
  assertIdPrefix(prefix);
  const adjective =
    ID_WORDS.adjectives[index(ID_WORDS.adjectives.length, random)];
  const noun = ID_WORDS.nouns[index(ID_WORDS.nouns.length, random)];
  const suffix = customRandom(ID_SUFFIX_ALPHABET, ID_SUFFIX_LENGTH, random)();
  return `${prefix}-${adjective}-${noun}-${suffix}`;
}

const crockford = (text: string, length: number): boolean =>
  text.length === length &&
  [...text].every((character) => ID_SUFFIX_ALPHABET.includes(character));
const sets = {
  adjectives: new Set(ID_WORDS.adjectives),
  nouns: new Set(ID_WORDS.nouns),
};

/**
 * The segments after the prefix, when exactly `count` of them follow one of
 * `prefixes` (longest first) — or, with no prefixes, after any valid prefix.
 * A prefix may contain '-', so a value is never parsed by splitting it whole:
 * the trailing segment count is fixed, which leaves one possible prefix.
 */
function segmentsAfter(
  value: string,
  prefixes: IdPrefixes | undefined,
  count: number,
): string[] | null {
  if (prefixes === undefined) {
    const segments = value.split('-');
    if (
      segments.length <= count ||
      !isPrefix(segments.slice(0, -count).join('-'))
    )
      return null;
    return segments.slice(-count);
  }
  const ordered = (
    typeof prefixes === 'string' ? [prefixes] : [...prefixes]
  ).sort((a, b) => b.length - a.length);
  ordered.forEach(assertIdPrefix);
  for (const prefix of ordered) {
    if (!value.startsWith(`${prefix}-`)) continue;
    const segments = value.slice(prefix.length + 1).split('-');
    if (segments.length === count) return segments;
  }
  return null;
}

/**
 * `<prefix>-<adjective>-<noun>-<12 Crockford>`, words from ID_WORDS. No
 * normalisation: case, Unicode, percent encoding and whitespace are refused.
 * Validation only — it neither looks anything up nor grants access.
 */
export function isCanonicalId(
  value: unknown,
  prefix?: IdPrefixes,
): value is string {
  if (typeof value !== 'string' || value.length > ID_MAX_LENGTH) return false;
  const segments = segmentsAfter(value, prefix, 3);
  return (
    segments !== null &&
    sets.adjectives.has(segments[0]) &&
    sets.nouns.has(segments[1]) &&
    crockford(segments[2], ID_SUFFIX_LENGTH)
  );
}

export interface ILegacyIdFormat {
  readonly name: string;
  readonly shape: string;
  /** false: the value carries no prefix at all and is tested whole. */
  readonly prefixed: boolean;
  /** Prefixed: how many '-' segments follow the prefix. */
  readonly segments: number;
  readonly test: (segments: readonly string[]) => boolean;
}

/**
 * Accepted for IDs already issued, never minted. The only part of this module
 * that differs between products.
 *
 * A fresh CleanSlice project has issued nothing, so the list is empty. A
 * project scaffolded before this standard holds `user-<uuid>` rows; it adds
 * that shape here and nowhere else:
 *
 *   {
 *     name: 'prefixed-uuid',
 *     shape: '<prefix>-<lower-case UUID> (before the ID standard)',
 *     prefixed: true,
 *     segments: 5,
 *     test: (s) =>
 *       /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(s.join('-')),
 *   }
 */
export const LEGACY_ID_FORMATS: readonly ILegacyIdFormat[] = Object.freeze(
  [] as ILegacyIdFormat[],
);

/** Which LEGACY_ID_FORMATS entry `value` is, if any. A prefixless legacy value matches whatever the prefix. */
export function legacyIdFormat(
  value: unknown,
  prefix?: IdPrefixes,
): ILegacyIdFormat | null {
  if (typeof value !== 'string' || value.length > ID_MAX_LENGTH) return null;
  if (prefix !== undefined)
    (typeof prefix === 'string' ? [prefix] : prefix).forEach(assertIdPrefix);
  for (const format of LEGACY_ID_FORMATS) {
    const segments = format.prefixed
      ? segmentsAfter(value, prefix, format.segments)
      : value.split('-');
    if (
      segments &&
      segments.length === format.segments &&
      format.test(segments)
    )
      return format;
  }
  return null;
}

export function isLegacyId(
  value: unknown,
  prefix?: IdPrefixes,
): value is string {
  return legacyIdFormat(value, prefix) !== null;
}

/** What a DTO, pipe or gateway accepts: the canonical form, or an already issued legacy ID. */
export function isId(value: unknown, prefix: IdPrefixes): value is string {
  return isCanonicalId(value, prefix) || isLegacyId(value, prefix);
}

/**
 * Which of the caller's prefixes owns `value`, or null. A prefixless legacy
 * value (UUID) has no owner.
 */
export function idPrefixOf(
  value: unknown,
  prefixes: readonly string[],
): string | null {
  if (typeof value !== 'string') return null;
  return (
    [...new Set(prefixes)]
      .sort((a, b) => b.length - a.length)
      .find(
        (prefix) =>
          isCanonicalId(value, prefix) ||
          legacyIdFormat(value, prefix)?.prefixed === true,
      ) ?? null
  );
}

/** OpenAPI shape of a new ID; isCanonicalId additionally checks the words. */
export function idPattern(prefix: string): string {
  assertIdPrefix(prefix);
  return `^${prefix}-[a-z]+-[a-z]+-[${ID_SUFFIX_ALPHABET}]{${ID_SUFFIX_LENGTH}}$`;
}
