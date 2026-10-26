// @scope:api
// @slice:user/auth
// @layer:data
// @type:mapper

import { Injectable } from '@nestjs/common';
import type { PrismaCreate, PrismaRow } from '#setup/prisma';
import { IUserData, RoleTypes } from '../../user/domain/user.types';
import { IUserWithPasswordData, IRegisterData } from '../domain/auth.types';

@Injectable()
export class AuthMapper {
  toData(user: PrismaRow<'User'>): IUserData {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: [...user.roles] as RoleTypes[],
      verified: user.verified,
      banned: user.banned,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  toDataWithPassword(user: PrismaRow<'User'>): IUserWithPasswordData {
    return {
      ...this.toData(user),
      password: user.password,
    };
  }

  /** Everything but the id: the gateway mints that with formatId(USER_ID_PREFIX). */
  toCreate(
    data: IRegisterData & { hashedPassword: string },
  ): Omit<PrismaCreate<'User'>, 'id'> {
    return {
      email: data.email,
      name: data.name,
      password: data.hashedPassword,
      roles: [RoleTypes.USER],
    };
  }
}
