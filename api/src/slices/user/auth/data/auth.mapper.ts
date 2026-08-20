// @scope:api
// @slice:user/auth
// @layer:data
// @type:mapper

import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { v4 as uuid } from 'uuid';
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

  toCreate(data: IRegisterData & { hashedPassword: string }) {
    return {
      id: `user-${uuid()}`,
      email: data.email,
      name: data.name,
      password: data.hashedPassword,
      roles: [RoleTypes.USER],
    };
  }
}
