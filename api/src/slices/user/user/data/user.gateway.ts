// @scope:api
// @slice:user
// @layer:data
// @type:gateway

import { Injectable } from '@nestjs/common';
import { PrismaService } from '#setup/prisma';
import { formatId, withIdRetry } from '#setup/id';
import { IMetaResponse } from '#setup/response';
import { IUserGateway } from '../domain/user.gateway';
import {
  IUserData,
  ICreateUserData,
  IUpdateUserData,
  IUserFilter,
  USER_ID_PREFIX,
} from '../domain/user.types';
import { UserNotFoundError } from '../domain/user.errors';
import { UserMapper } from './user.mapper';

/** `%`, `_` and `\` are LIKE wildcards; escape them so a search matches them literally. */
const likeLiteral = (value: string): string => value.replace(/[\\%_]/g, '\\$&');

@Injectable()
export class UserGateway extends IUserGateway {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: UserMapper,
  ) {
    super();
  }

  private get users() {
    return this.prisma.db.public.User;
  }

  async getUsers(
    filter: IUserFilter,
  ): Promise<{ data: IUserData[]; meta: IMetaResponse }> {
    const page = filter.page || 1;
    const perPage = filter.perPage || 10;

    let users = this.users;
    if (filter.search) {
      const pattern = `%${likeLiteral(filter.search)}%`;
      users = users.where((u) =>
        this.prisma.or(u.name.ilike(pattern), u.email.ilike(pattern)),
      );
    }
    if (filter.email) {
      const email = likeLiteral(filter.email);
      users = users.where((u) => u.email.ilike(email));
    }

    const [total, rows] = await Promise.all([
      users.aggregate((a) => ({ n: a.count() })).then((r) => r.n),
      users
        // `id` breaks ties, so a page boundary cannot drop or repeat a row.
        .orderBy([(u) => u.createdAt.desc(), (u) => u.id.desc()])
        .offset((page - 1) * perPage)
        .limit(perPage)
        .all(),
    ]);

    return {
      data: rows.map((user) => this.mapper.toData(user)),
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async getUser(id: string): Promise<IUserData | null> {
    const user = await this.users.first({ id });
    return user ? this.mapper.toData(user) : null;
  }

  async createUser(data: ICreateUserData): Promise<IUserData> {
    const createData = this.mapper.toCreate(data);
    const user = await withIdRetry(
      () => this.users.create({ id: formatId(USER_ID_PREFIX), ...createData }),
      this.prisma.inTransaction,
    );
    return this.mapper.toData(user);
  }

  async updateUser(id: string, data: IUpdateUserData): Promise<IUserData> {
    const changes = this.mapper.toUpdate(data);
    // Nothing to write is a read: an empty update answers null on Prisma 8.
    const user =
      Object.keys(changes).length === 0
        ? await this.users.first({ id })
        : await this.users.where({ id }).update(changes);
    // Prisma 6 threw P2025 on a missing row; Prisma 8 answers null.
    if (!user) throw new UserNotFoundError(id);
    return this.mapper.toData(user);
  }

  async deleteUser(id: string): Promise<IUserData> {
    const user = await this.users.where({ id }).delete();
    if (!user) throw new UserNotFoundError(id);
    return this.mapper.toData(user);
  }
}
