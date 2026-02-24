// @scope:api
// @slice:user
// @layer:data
// @type:gateway

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '#/setup/prisma';
import { IMetaResponse } from '#/setup/response';
import { IUserGateway } from '../domain/user.gateway';
import {
  IUserData,
  ICreateUserData,
  IUpdateUserData,
  IUserFilter,
} from '../domain/user.types';
import { UserMapper } from './user.mapper';

@Injectable()
export class UserGateway extends IUserGateway {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: UserMapper,
  ) {
    super();
  }

  async getUsers(
    filter: IUserFilter,
  ): Promise<{ data: IUserData[]; meta: IMetaResponse }> {
    const page = filter.page || 1;
    const perPage = filter.perPage || 10;
    const skip = (page - 1) * perPage;

    const where: Prisma.UserWhereInput = {};

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter.email) {
      where.email = { equals: filter.email, mode: 'insensitive' };
    }

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: users.map((user) => this.mapper.toData(user)),
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async getUser(id: string): Promise<IUserData | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.mapper.toData(user) : null;
  }

  async createUser(data: ICreateUserData): Promise<IUserData> {
    const createData = this.mapper.toCreate(data);
    const user = await this.prisma.user.create({ data: createData });
    return this.mapper.toData(user);
  }

  async updateUser(id: string, data: IUpdateUserData): Promise<IUserData> {
    const updateData = this.mapper.toUpdate(data);
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });
    return this.mapper.toData(user);
  }

  async deleteUser(id: string): Promise<IUserData> {
    const user = await this.prisma.user.delete({ where: { id } });
    return this.mapper.toData(user);
  }
}
