// @scope:api
// @slice:user/auth
// @layer:data
// @type:gateway

import { Injectable } from '@nestjs/common';
import { PrismaService } from '#setup/prisma';
import { IAuthGateway } from '../domain/auth.gateway';
import { IUserData } from '../../user/domain/user.types';
import { IRegisterData, IUserWithPasswordData } from '../domain/auth.types';
import { AuthMapper } from './auth.mapper';

@Injectable()
export class AuthGateway extends IAuthGateway {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: AuthMapper,
  ) {
    super();
  }

  async findByEmail(email: string): Promise<IUserWithPasswordData | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user ? this.mapper.toDataWithPassword(user) : null;
  }

  async findById(id: string): Promise<IUserData | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user ? this.mapper.toData(user) : null;
  }

  async create(
    data: IRegisterData & { hashedPassword: string },
  ): Promise<IUserData> {
    const createData = this.mapper.toCreate(data);
    const user = await this.prisma.user.create({ data: createData });
    return this.mapper.toData(user);
  }
}
