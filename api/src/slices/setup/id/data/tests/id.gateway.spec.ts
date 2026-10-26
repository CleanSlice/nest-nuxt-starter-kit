import { PrismaService } from '#setup/prisma';
import { IdGateway } from '../id.gateway';
import { isCanonicalId } from '../../domain';

describe('IdGateway.reserve', () => {
  const conflict = Object.assign(new Error('duplicate key'), {
    sqlState: '23505',
    detail: 'Key (id)=(file-x) already exists.',
  });

  it('mints a fresh candidate on every attempt and returns the one that committed', async () => {
    const create = jest
      .fn<Promise<{ id: string }>, [{ id: string }]>()
      .mockRejectedValueOnce(conflict)
      .mockImplementation((row) => Promise.resolve({ id: row.id }));
    const prisma = {
      db: { public: { IdReservation: { create } } },
    } as unknown as PrismaService;

    const id = await new IdGateway(prisma).reserve('file');

    expect(create).toHaveBeenCalledTimes(2);
    const [first, second] = create.mock.calls.map(([row]) => row.id);
    expect(first).not.toBe(second);
    expect(id).toBe(second);
    expect(isCanonicalId(id, 'file')).toBe(true);
  });

  it('refuses a prefix that is not kebab-case before touching the database', async () => {
    const create = jest.fn();
    const prisma = {
      db: { public: { IdReservation: { create } } },
    } as unknown as PrismaService;
    await expect(new IdGateway(prisma).reserve('File')).rejects.toThrow(
      TypeError,
    );
    expect(create).not.toHaveBeenCalled();
  });
});
