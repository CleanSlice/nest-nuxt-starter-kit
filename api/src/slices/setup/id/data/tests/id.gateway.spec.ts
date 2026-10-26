import { Prisma } from '@prisma/client';
import { PrismaService } from '#setup/prisma';
import { IdGateway } from '../id.gateway';
import { isCanonicalId } from '../../domain';

describe('IdGateway.reserve', () => {
  const conflict = new Prisma.PrismaClientKnownRequestError('dup', {
    code: 'P2002',
    clientVersion: 'test',
    meta: { target: ['id'] },
  });

  it('mints a fresh candidate on every attempt and returns the one that committed', async () => {
    const create = jest
      .fn<Promise<{ id: string }>, [{ data: { id: string } }]>()
      .mockRejectedValueOnce(conflict)
      .mockImplementation(({ data }) => Promise.resolve({ id: data.id }));
    const prisma = { idReservation: { create } } as unknown as PrismaService;

    const id = await new IdGateway(prisma).reserve('file');

    expect(create).toHaveBeenCalledTimes(2);
    const [first, second] = create.mock.calls.map(([arg]) => arg.data.id);
    expect(first).not.toBe(second);
    expect(id).toBe(second);
    expect(isCanonicalId(id, 'file')).toBe(true);
  });

  it('refuses a prefix that is not kebab-case before touching the database', async () => {
    const create = jest.fn();
    const prisma = { idReservation: { create } } as unknown as PrismaService;
    await expect(new IdGateway(prisma).reserve('File')).rejects.toThrow(
      TypeError,
    );
    expect(create).not.toHaveBeenCalled();
  });
});
