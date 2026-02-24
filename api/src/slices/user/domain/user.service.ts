// @scope:api
// @slice:user
// @layer:domain
// @type:service

import { Injectable } from '@nestjs/common';
import { IUserGateway } from './user.gateway';
import {
  ICreateUserData,
  IUpdateUserData,
  IUserFilter,
} from './user.types';
import { UserNotFoundError } from './user.errors';

@Injectable()
export class UserService {
  constructor(private readonly userGateway: IUserGateway) {}

  async getUsers(filter: IUserFilter) {
    return this.userGateway.getUsers(filter);
  }

  async getUser(id: string) {
    const user = await this.userGateway.getUser(id);

    if (!user) {
      throw new UserNotFoundError(id);
    }

    return user;
  }

  async createUser(data: ICreateUserData) {
    return this.userGateway.createUser({
      ...data,
      email: data.email.toLowerCase().trim(),
      name: data.name.trim(),
    });
  }

  async updateUser(id: string, data: IUpdateUserData) {
    await this.getUser(id);

    return this.userGateway.updateUser(id, {
      ...data,
      ...(data.email && { email: data.email.toLowerCase().trim() }),
      ...(data.name && { name: data.name.trim() }),
    });
  }

  async deleteUser(id: string) {
    await this.getUser(id);
    return this.userGateway.deleteUser(id);
  }
}
