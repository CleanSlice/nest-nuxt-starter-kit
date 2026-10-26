import { PrismaService } from '#setup/prisma';
import { isCanonicalId } from '#setup/id';
import { UserGateway } from '../data/user.gateway';
import { UserMapper } from '../data/user.mapper';
import { UserNotFoundError } from '../domain/user.errors';
import { RoleTypes, USER_ID_PREFIX } from '../domain/user.types';

/** UserGateway against the real test database (test/globalSetup.cjs). */
describe('UserGateway (Postgres)', () => {
  let prisma: PrismaService;
  let gateway: UserGateway;

  const create = (email: string, name = email.split('@')[0]) =>
    gateway.createUser({ email, name, password: 'hash' });

  beforeAll(async () => {
    prisma = await PrismaService.open();
    gateway = new UserGateway(prisma, new UserMapper());
  });

  afterAll(async () => {
    await prisma.close();
  });

  beforeEach(async () => {
    await prisma.rawExecuteUnsafe('TRUNCATE "User"');
  });

  it('mints a canonical id and maps the row back', async () => {
    const user = await create('ann@example.com', 'Ann');

    expect(isCanonicalId(user.id, USER_ID_PREFIX)).toBe(true);
    expect(user).toMatchObject({
      email: 'ann@example.com',
      name: 'Ann',
      roles: [RoleTypes.USER],
      verified: false,
    });
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(await gateway.getUser(user.id)).toEqual(user);
  });

  it('searches name and email case-insensitively, wildcards taken literally', async () => {
    await create('ann@example.com', 'Ann');
    await create('bob_100%@example.com', 'Bob');
    await create('bobby@example.com', 'Bobby');

    const byName = await gateway.getUsers({ search: 'ANN' });
    const literal = await gateway.getUsers({ search: '_100%' });
    const byEmail = await gateway.getUsers({ email: 'BOBBY@example.com' });

    expect(byName.data.map((u) => u.name)).toEqual(['Ann']);
    expect(literal.data.map((u) => u.name)).toEqual(['Bob']);
    expect(byEmail.data.map((u) => u.name)).toEqual(['Bobby']);
  });

  it('pages newest first with the total of the whole filter', async () => {
    for (const email of ['a@example.com', 'b@example.com', 'c@example.com'])
      await create(email);

    const second = await gateway.getUsers({ page: 2, perPage: 2 });

    expect(second.meta).toEqual({
      total: 3,
      page: 2,
      perPage: 2,
      totalPages: 2,
    });
    expect(second.data.map((u) => u.email)).toEqual(['a@example.com']);
  });

  it('updates the given fields and leaves the rest', async () => {
    const user = await create('ann@example.com', 'Ann');

    const updated = await gateway.updateUser(user.id, {
      name: 'Anna',
      verified: true,
    });
    const unchanged = await gateway.updateUser(user.id, {});

    expect(updated).toMatchObject({
      name: 'Anna',
      verified: true,
      email: 'ann@example.com',
    });
    expect(unchanged).toEqual(updated);
  });

  it('reports a missing user on update and delete, where Prisma 6 threw P2025', async () => {
    const user = await create('ann@example.com');
    await gateway.deleteUser(user.id);

    await expect(
      gateway.updateUser(user.id, { name: 'x' }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
    await expect(gateway.deleteUser(user.id)).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
    expect(await gateway.getUser(user.id)).toBeNull();
  });
});
