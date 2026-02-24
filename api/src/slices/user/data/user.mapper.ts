// @scope:api
// @slice:user
// @layer:data
// @type:mapper

import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import {
  IUserData,
  ICreateUserData,
  IUpdateUserData,
  RoleTypes,
} from '../domain/user.types';

@Injectable()
export class UserMapper {
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

  toCreate(data: ICreateUserData) {
    return {
      id: `user-${uuid()}`,
      email: data.email,
      name: data.name,
      roles: data.roles || [RoleTypes.USER],
    };
  }

  toUpdate(data: IUpdateUserData) {
    return {
      ...(data.email !== undefined && { email: data.email }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.roles !== undefined && { roles: data.roles }),
      ...(data.verified !== undefined && { verified: data.verified }),
      ...(data.banned !== undefined && { banned: data.banned }),
    };
  }
}
