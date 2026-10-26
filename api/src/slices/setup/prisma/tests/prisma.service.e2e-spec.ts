import { PrismaService } from '../prisma.service';
import {
  isUniqueViolation,
  sqlState,
  UNIQUE_VIOLATION,
} from '../prisma.errors';

/**
 * PrismaService against the real test database (test/globalSetup.cjs): the
 * error shape Prisma 8 surfaces, ambient transactions and the raw helpers.
 */
describe('PrismaService (Postgres)', () => {
  let prisma: PrismaService;

  const user = (id: string, email = `${id}@example.com`) => ({
    id,
    email,
    name: id,
    password: 'x',
    roles: ['USER'],
  });

  beforeAll(async () => {
    prisma = await PrismaService.open();
  });

  afterAll(async () => {
    await prisma.close();
  });

  beforeEach(async () => {
    await prisma.rawExecuteUnsafe('TRUNCATE "User", "IdReservation"');
  });

  describe('unique violations', () => {
    it('names the primary key the row collided on', async () => {
      await prisma.db.public.User.create(user('user-a'));
      const error = await prisma.db.public.User.create(
        user('user-a', 'other@example.com'),
      ).catch((e: unknown) => e);

      expect(sqlState(error)).toBe(UNIQUE_VIOLATION);
      expect(isUniqueViolation(error, ['id'])).toBe(true);
      expect(isUniqueViolation(error, ['email'])).toBe(false);
    });

    it('names another unique key the same way', async () => {
      await prisma.db.public.User.create(user('user-a', 'same@example.com'));
      const error = await prisma.db.public.User.create(
        user('user-b', 'same@example.com'),
      ).catch((e: unknown) => e);

      expect(isUniqueViolation(error, ['email'])).toBe(true);
      expect(isUniqueViolation(error, ['id'])).toBe(false);
    });
  });

  describe('transaction', () => {
    it('commits every write of the unit', async () => {
      await prisma.transaction(async (db) => {
        await db.User.create(user('user-a'));
        // A gateway reads prisma.db: the same transaction, nothing passed along.
        await prisma.db.public.User.create(user('user-b'));
      });

      const n = await prisma.db.public.User.aggregate((a) => ({
        n: a.count(),
      }));
      expect(n.n).toBe(2);
    });

    it('rolls back every write when the unit throws', async () => {
      await expect(
        prisma.transaction(async () => {
          await prisma.db.public.User.create(user('user-a'));
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');

      expect(await prisma.db.public.User.first({ id: 'user-a' })).toBeNull();
    });

    it('joins a transaction already in progress', async () => {
      await expect(
        prisma.transaction(async () => {
          await prisma.transaction(async () => {
            expect(prisma.inTransaction).toBe(true);
            await prisma.db.public.User.create(user('user-inner'));
          });
          throw new Error('outer fails after the inner block returned');
        }),
      ).rejects.toThrow('outer fails');

      // The inner write went down with the outer unit.
      expect(
        await prisma.db.public.User.first({ id: 'user-inner' }),
      ).toBeNull();
      expect(prisma.inTransaction).toBe(false);
    });
  });

  describe('raw SQL', () => {
    it('binds values and reads typed rows', async () => {
      await prisma.db.public.User.create(user('user-a'));

      const affected = await prisma.rawExecute(
        prisma.sql`UPDATE "User" SET "verified" = true WHERE "id" = ${'user-a'}`.affectedCount(),
      );
      const rows = await prisma.rawRows(
        prisma.sql`SELECT "id", "verified" FROM "User" WHERE ${'USER'} = ANY("roles")`.returnsRow(
          {
            id: 'pg/text@1',
            verified: 'pg/bool@1',
          },
        ),
      );

      expect(affected).toBe(1);
      expect(rows).toEqual([{ id: 'user-a', verified: true }]);
    });

    it('filters an ORM query with a raw condition', async () => {
      await prisma.db.public.User.create({
        ...user('user-admin'),
        roles: ['ADMIN'],
      });
      await prisma.db.public.User.create(user('user-plain'));

      const admins = await prisma.db.public.User.where(
        () => prisma.condition`${'ADMIN'} = ANY("roles")`,
      ).all();

      expect(admins.map((u) => u.id)).toEqual(['user-admin']);
    });
  });
});
