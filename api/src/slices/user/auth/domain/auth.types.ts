// @scope:api
// @slice:user/auth
// @layer:domain
// @type:types

import { IUserData } from '../../user/domain/user.types';

export interface IAuthPayload {
  sub: string;
  email: string;
}

export interface IAuthTokenData {
  accessToken: string;
  user: IUserData;
}

export interface IRegisterData {
  email: string;
  name: string;
  password: string;
}

export interface ILoginData {
  email: string;
  password: string;
}

export interface IUserWithPasswordData extends IUserData {
  password: string;
}
