// @scope:api
// @slice:user/auth
// @layer:domain
// @type:gateway

import { IUserData } from '../../user/domain/user.types';
import { IRegisterData, IUserWithPasswordData } from './auth.types';

export abstract class IAuthGateway {
  abstract findByEmail(email: string): Promise<IUserWithPasswordData | null>;
  abstract findById(id: string): Promise<IUserData | null>;
  abstract create(
    data: IRegisterData & { hashedPassword: string },
  ): Promise<IUserData>;
}
