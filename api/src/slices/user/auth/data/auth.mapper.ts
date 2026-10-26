// @scope:api
// @slice:user/auth
// @layer:data
// @type:mapper

import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { IUserData, RoleTypes } from '../../user/domain/user.types';
import { IUserWithPasswordData, IRegisterData } from '../domain/auth.types';

@Injectable()
export class AuthMapper {
  toData(user: User): IUserData {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles as RoleTypes[],
      verified: user.verified,
      banned: user.banned,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  toDataWithPassword(user: User): IUserWithPasswordData {
    return {
      ...this.toData(user),
      password: user.password,
    };
  }

  /** Everything but the id: the gateway mints that with formatId(USER_ID_PREFIX). */
  toCreate(data: IRegisterData & { hashedPassword: string }) {
    return {
      email: data.email,
      name: data.name,
      password: data.hashedPassword,
      roles: [RoleTypes.USER],
    };
  }
}
