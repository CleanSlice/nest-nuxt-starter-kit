// @scope:api
// @slice:user
// @layer:domain
// @type:gateway

import {
  IUserData,
  ICreateUserData,
  IUpdateUserData,
  IUserFilter,
} from './user.types';
import { IMetaResponse } from '#/setup/response';

export abstract class IUserGateway {
  abstract getUsers(
    filter: IUserFilter,
  ): Promise<{ data: IUserData[]; meta: IMetaResponse }>;
  abstract getUser(id: string): Promise<IUserData | null>;
  abstract createUser(data: ICreateUserData): Promise<IUserData>;
  abstract updateUser(id: string, data: IUpdateUserData): Promise<IUserData>;
  abstract deleteUser(id: string): Promise<IUserData>;
}
