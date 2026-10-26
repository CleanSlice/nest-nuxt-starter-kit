import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  formatId,
  idPattern,
  idPrefixOf,
  isCanonicalId,
  isId,
  isLegacyId,
  legacyIdFormat,
  IdRandom,
  ID_MAX_LENGTH,
  ID_SUFFIX_ALPHABET,
  ID_SUFFIX_LENGTH,
  ID_WORDS,
  LEGACY_ID_FORMATS,
} from '../idFormat';

/** Hands out 0, 1, 2, … in order, however many bytes each draw asks for. */
const counter = (): IdRandom & { used: () => number } => {
  let next = 0;
  const random = (size: number): Uint8Array =>
    Uint8Array.from({ length: size }, () => next++ % 256);
  return Object.assign(random, { used: () => next });
};

/** A fixed byte script, for the rejection paths. */
const script = (bytes: number[]): IdRandom => {
  let at = 0;
  return (size) => {
    if (at + size > bytes.length) throw new Error('script exhausted');
    return Uint8Array.from(bytes.slice(at, (at += size)));
  };
};

describe('ID format (shared by every CleanSlice product)', () => {
  describe('the control test vector — the Identifiers standard', () => {
    it('formatId("user", bytes 0,1,2,…) is user-afraid-swans-nmkjhgfedcba', () => {
      const random = counter();
      expect(formatId('user', random)).toBe('user-afraid-swans-nmkjhgfedcba');
      // 1 byte adjective, 2 bytes noun, one nanoid request of 19 bytes read backwards.
      expect(random.used()).toBe(22);
    });

    it('pins the dictionaries it was computed from (human-id 4.1.3)', () => {
      expect(ID_WORDS.adjectives).toHaveLength(200);
      expect(ID_WORDS.nouns).toHaveLength(300);
      expect([ID_WORDS.adjectives[0], ID_WORDS.nouns[258]]).toEqual([
        'afraid',
        'swans',
      ]);
      for (const list of [ID_WORDS.adjectives, ID_WORDS.nouns]) {
        expect(list.every((word) => /^[a-z]+$/.test(word))).toBe(true);
        expect(new Set(list).size).toBe(list.length);
      }
      const api = join(__dirname, '../../../../../..');
      const read = (
        path: string,
      ): { version?: string; dependencies?: Record<string, string> } =>
        JSON.parse(readFileSync(join(api, path, 'package.json'), 'utf8')) as {
          version?: string;
          dependencies?: Record<string, string>;
        };
      expect(read('node_modules/human-id').version).toBe('4.1.3');
      expect(read('node_modules/nanoid').version).toBe('3.3.11');
      // Pinned exactly, no range: a floating minor would change the dictionaries.
      expect(read('.').dependencies).toMatchObject({
        'human-id': '4.1.3',
        nanoid: '3.3.11',
      });
    });
  });

  describe('draws without bias', () => {
    it('rejects an adjective byte at or above 200 and draws again', () => {
      const id = formatId(
        'user',
        script([200, 255, 7, 0, 0, ...(Array(19).fill(31) as number[])]),
      );
      expect(id).toBe(
        `user-${ID_WORDS.adjectives[7]}-${ID_WORDS.nouns[0]}-${'z'.repeat(12)}`,
      );
    });

    it('masks a noun pair to 9 bits and rejects a value at or above 300', () => {
      // 0x01 0x2c & 511 = 300 is refused; 0xff 0xff & 511 = 511 is refused; 0x03 0x2b & 511 = 299.
      const id = formatId(
        'user',
        script([
          0,
          0x01,
          0x2c,
          0xff,
          0xff,
          0x03,
          0x2b,
          ...(Array(19).fill(0) as number[]),
        ]),
      );
      expect(id).toBe(`user-afraid-${ID_WORDS.nouns[299]}-${'0'.repeat(12)}`);
    });

    it('takes the suffix as nanoid customRandom does: 19 bytes, last first, low five bits', () => {
      const suffix = Array.from({ length: 19 }, (_, i) => i + 32 * (i % 3));
      const id = formatId('user', script([0, 0, 0, ...suffix]));
      const expected = suffix
        .slice(7)
        .reverse()
        .map((byte) => ID_SUFFIX_ALPHABET[byte & 31])
        .join('');
      expect(id.slice(-12)).toBe(expected);
    });
  });

  it('round-trips 10000 independently formatted IDs; words are never the uniqueness guarantee', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 10000; i++) {
      const id = formatId('org');
      expect(isCanonicalId(id, 'org')).toBe(true);
      expect(isCanonicalId(id)).toBe(true);
      expect(isLegacyId(id, 'org')).toBe(false);
      expect(isId(id, 'organization')).toBe(false);
      expect(isId(id, 'team')).toBe(false);
      expect(new RegExp(idPattern('org')).test(id)).toBe(true);
      ids.add(id);
    }
    expect(ids.size).toBe(10000);
  });

  it('has 60 bits in the suffix, from a 32-letter Crockford alphabet', () => {
    expect(ID_SUFFIX_ALPHABET).toBe('0123456789abcdefghjkmnpqrstvwxyz');
    expect(ID_SUFFIX_LENGTH).toBe(12);
    expect(ID_SUFFIX_LENGTH * Math.log2(ID_SUFFIX_ALPHABET.length)).toBe(60);
  });

  it.each([
    '',
    'ORG',
    'org-',
    '-team',
    'team--api',
    'team_api',
    '../org',
    'оrganization',
    'a'.repeat(33),
    '1org',
    'Team-Api',
  ])('rejects prefix %p', (prefix) => {
    expect(() => formatId(prefix)).toThrow(TypeError);
    expect(() => isCanonicalId('x', prefix)).toThrow(TypeError);
  });

  describe('refuses every other shape as canonical', () => {
    const id = 'user-calm-rivers-k8m4p2d7n9x3';
    it('accepts a well-formed ID — "river" is not a human-id word, "rivers" is', () => {
      expect(isCanonicalId(id, 'user')).toBe(true);
      expect(isCanonicalId(id)).toBe(true);
      expect(isCanonicalId('user-calm-river-k8m4p2d7n9x3')).toBe(false);
    });
    it.each([
      ['a verb as a third word', 'user-calm-rivers-rescue-k8m4p2d7n9x3'],
      ['a 6-letter suffix', 'user-calm-rivers-k8m4p2'],
      ['a 20-letter suffix', 'user-calm-rivers-k8m4p2d7n9x3k8m4p2d7'],
      ['a 16-hex suffix', 'user-calm-rivers-0123456789abcdef'],
      ['a 32-hex suffix', 'user-calm-rivers-23a63374d40f48a1a952e38524413be4'],
      ['an i/l/o/u in the suffix', 'user-calm-rivers-k8m4p2d7n9xi'],
      ['an unknown adjective', 'user-abusive-river-k8m4p2d7n9x3'],
      ['an unknown noun', 'user-calm-word-k8m4p2d7n9x3'],
      ['adjective and noun swapped', 'user-rivers-calm-k8m4p2d7n9x3'],
      ['upper case', id.toUpperCase()],
      ['surrounding space', ` ${id}`],
      ['a trailing newline', `${id}\n`],
      ['an extra segment', `${id}-x`],
      ['percent-encoded dashes', id.split('-').join('%2d')],
      ['a Cyrillic letter', id.replace('user', 'usеr')],
      ['a prefixed UUID', 'user-23a63374-d40f-48a1-a952-e38524413be4'],
      ['a bare UUID', '23a63374-d40f-48a1-a952-e38524413be4'],
      ['a cuid', 'user-clh3k2j8e0000qzrm5x7y9z1a'],
      ['a credential', 'emk.public.secret'],
    ])('%s', (_, value) => {
      expect(isCanonicalId(value, 'user')).toBe(false);
      expect(isCanonicalId(value)).toBe(false);
    });
    it('refuses non-strings', () => {
      for (const value of [
        null,
        undefined,
        42,
        {},
        ['user-calm-rivers-k8m4p2d7n9x3'],
      ])
        expect(isCanonicalId(value)).toBe(false);
    });
    it('cannot tell 12 hex digits from 12 Crockford letters: hex is a subset', () => {
      expect(isCanonicalId('user-calm-rivers-a1b2c3d4e5f6', 'user')).toBe(true);
    });
  });

  describe('LEGACY_ID_FORMATS: a fresh project has issued nothing', () => {
    const uuid = '23a63374-d40f-48a1-a952-e38524413be4';

    it('is empty, so isId is exactly isCanonicalId', () => {
      expect(LEGACY_ID_FORMATS).toHaveLength(0);
      for (const value of [
        uuid,
        `user-${uuid}`,
        'user-calm-rivers-k8m4p2d7n9x3',
      ]) {
        expect(legacyIdFormat(value, 'user')).toBeNull();
        expect(isLegacyId(value, 'user')).toBe(false);
        expect(isId(value, 'user')).toBe(isCanonicalId(value, 'user'));
      }
    });

    it('fits the longest prefix with the longest words inside ID_MAX_LENGTH', () => {
      const longest =
        Math.max(...ID_WORDS.adjectives.map((w) => w.length)) +
        Math.max(...ID_WORDS.nouns.map((w) => w.length));
      expect(formatId('a'.repeat(32)).length).toBeLessThanOrEqual(
        32 + 3 + longest + ID_SUFFIX_LENGTH,
      );
      expect(32 + 3 + longest + ID_SUFFIX_LENGTH).toBeLessThanOrEqual(
        ID_MAX_LENGTH,
      );
    });
  });

  describe('hyphenated prefixes', () => {
    const prefixes = [
      'team',
      'team-api-key',
      'team-member',
      'agent',
      'agent-skill',
      'agent-skill-use',
    ];

    it('never lets a shorter prefix claim the ID of a longer one', () => {
      for (const long of prefixes) {
        const id = formatId(long);
        expect(idPrefixOf(id, prefixes)).toBe(long);
        expect(isCanonicalId(id, prefixes)).toBe(true);
        for (const other of prefixes.filter((p) => p !== long)) {
          expect(isId(id, other)).toBe(false);
          expect(new RegExp(idPattern(other)).test(id)).toBe(false);
        }
      }
      expect(isId(formatId('team-api-key'), 'team')).toBe(false);
    });

    it('resolves the owner regardless of order', () => {
      const id = formatId('agent-skill-use');
      expect(idPrefixOf(id, ['agent', 'agent-skill', 'agent-skill-use'])).toBe(
        'agent-skill-use',
      );
      expect(idPrefixOf(id, ['agent-skill-use', 'agent'])).toBe(
        'agent-skill-use',
      );
      expect(idPrefixOf(id, ['agent', 'agent-skill'])).toBeNull();
      expect(idPrefixOf(`${id}x`, prefixes)).toBeNull();
      expect(idPrefixOf(42, prefixes)).toBeNull();
    });
  });
});
