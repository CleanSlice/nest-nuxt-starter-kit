// @scope:api
// @slice:user
// @layer:domain
// @type:error

import { HttpStatus } from '@nestjs/common';
import { BaseError, ErrorCodes } from '#/setup/error';

export class UserNotFoundError extends BaseError {
  public override code = ErrorCodes.USER_NOT_FOUND;

  constructor(id: string) {
    super(`User with id "${id}" not found`, HttpStatus.NOT_FOUND);
  }
}

export class UserExistsError extends BaseError {
  public override code = ErrorCodes.USER_EXISTS;

  constructor(email: string) {
    super(`User with email "${email}" already exists`, HttpStatus.CONFLICT);
  }
}
