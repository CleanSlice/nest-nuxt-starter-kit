// @scope:api
// @slice:user
// @layer:domain
// @type:types

/** Primary ID prefix of the User entity: `user-<adjective>-<noun>-<12 Crockford>`. */
export const USER_ID_PREFIX = 'user';

export enum RoleTypes {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface IUserData {
  id: string;
  email: string;
  name: string;
  roles: RoleTypes[];
  verified: boolean;
  banned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateUserData {
  email: string;
  name: string;
  password: string;
  roles?: RoleTypes[];
}

export interface IUpdateUserData {
  email?: string;
  name?: string;
  roles?: RoleTypes[];
  verified?: boolean;
  banned?: boolean;
}

export interface IUserFilter {
  search?: string;
  email?: string;
  page?: number;
  perPage?: number;
}
