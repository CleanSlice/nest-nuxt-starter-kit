// @scope:api
// @slice:user/auth
// @layer:data
// @type:gateway

import { Injectable } from '@nestjs/common';
import { PrismaService } from '#setup/prisma';
import { formatId, withIdRetry } from '#setup/id';
import { IAuthGateway } from '../domain/auth.gateway';
import { IUserData, USER_ID_PREFIX } from '../../user/domain/user.types';
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

  private get users() {
    return this.prisma.db.public.User;
  }

  async findByEmail(email: string): Promise<IUserWithPasswordData | null> {
    const user = await this.users.first({ email });
    return user ? this.mapper.toDataWithPassword(user) : null;
  }

  async findById(id: string): Promise<IUserData | null> {
    const user = await this.users.first({ id });
    return user ? this.mapper.toData(user) : null;
  }

  async create(
    data: IRegisterData & { hashedPassword: string },
  ): Promise<IUserData> {
    const createData = this.mapper.toCreate(data);
    const user = await withIdRetry(
      () => this.users.create({ id: formatId(USER_ID_PREFIX), ...createData }),
      this.prisma.inTransaction,
    );
    return this.mapper.toData(user);
  }
}
