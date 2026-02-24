// @scope:api
// @slice:user
// @layer:domain
// @type:types

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
