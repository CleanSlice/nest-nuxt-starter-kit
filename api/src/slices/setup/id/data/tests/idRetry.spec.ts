import { Prisma } from '@prisma/client';
import { withIdRetry, ID_MAX_ATTEMPTS } from '../idRetry';

/** A unique violation the way Prisma 6 surfaces one on PostgreSQL. */
const conflict = (target: string[]) =>
  new Prisma.PrismaClientKnownRequestError(
    'Unique constraint failed on the fields: (`id`)',
    { code: 'P2002', clientVersion: 'test', meta: { target } },
  );

describe('primary identity collision retry', () => {
  it('repeats the whole factory after a primary-key collision', async () => {
    const work = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(conflict(['id']))
      .mockResolvedValue('created');
    await expect(withIdRetry(work)).resolves.toBe('created');
    expect(work).toHaveBeenCalledTimes(2);
  });

  it.each([['email'], ['teamId', 'id'], ['name'], ['publicId']])(
    'does not reinterpret another uniqueness constraint: %j',
    async (...target) => {
      const error = conflict(target);
      const work = jest.fn<Promise<string>, []>().mockRejectedValue(error);
      await expect(withIdRetry(work)).rejects.toBe(error);
      expect(work).toHaveBeenCalledTimes(1);
    },
  );

  it('bounds retries and preserves the last error', async () => {
    const error = conflict(['id']);
    const work = jest.fn<Promise<string>, []>().mockRejectedValue(error);
    await expect(withIdRetry(work)).rejects.toBe(error);
    expect(work).toHaveBeenCalledTimes(ID_MAX_ATTEMPTS);
  });

  it('leaves ambient transaction retry to the owner of the transaction', async () => {
    const error = conflict(['id']);
    const work = jest.fn<Promise<string>, []>().mockRejectedValue(error);
    await expect(withIdRetry(work, true)).rejects.toBe(error);
    expect(work).toHaveBeenCalledTimes(1);
  });

  it('never retries a failure that merely resembles Prisma', async () => {
    const lookalike = { code: 'P2002', meta: { target: ['id'] } };
    const work = jest.fn<Promise<string>, []>().mockRejectedValue(lookalike);
    await expect(withIdRetry(work)).rejects.toBe(lookalike);
    expect(work).toHaveBeenCalledTimes(1);
  });

  it('never retries a different Prisma error', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('not found', {
      code: 'P2025',
      clientVersion: 'test',
    });
    const work = jest.fn<Promise<string>, []>().mockRejectedValue(error);
    await expect(withIdRetry(work)).rejects.toBe(error);
    expect(work).toHaveBeenCalledTimes(1);
  });
});
