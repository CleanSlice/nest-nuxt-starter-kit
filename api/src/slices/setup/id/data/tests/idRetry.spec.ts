import { withIdRetry, ID_MAX_ATTEMPTS } from '../idRetry';

/**
 * A unique violation the way Prisma 8 surfaces one on PostgreSQL: the
 * database's SQLSTATE, and the pg driver error with the key in `detail`
 * down the `cause` chain.
 */
const conflict = (target: string[]) =>
  Object.assign(new Error('duplicate key value violates unique constraint'), {
    sqlState: '23505',
    cause: Object.assign(new Error('duplicate key'), {
      code: '23505',
      detail: `Key (${target.map((column) => `"${column}"`).join(', ')})=(x) already exists.`,
    }),
  });

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

  it('never retries a Prisma 6 error shape', async () => {
    const lookalike = { code: 'P2002', meta: { target: ['id'] } };
    const work = jest.fn<Promise<string>, []>().mockRejectedValue(lookalike);
    await expect(withIdRetry(work)).rejects.toBe(lookalike);
    expect(work).toHaveBeenCalledTimes(1);
  });

  it('never retries a different database error', async () => {
    const error = Object.assign(
      new Error('insert or update violates foreign key'),
      {
        sqlState: '23503',
      },
    );
    const work = jest.fn<Promise<string>, []>().mockRejectedValue(error);
    await expect(withIdRetry(work)).rejects.toBe(error);
    expect(work).toHaveBeenCalledTimes(1);
  });
});
