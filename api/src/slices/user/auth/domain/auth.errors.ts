// @scope:api
// @slice:user/auth
// @layer:domain
// @type:error

import { HttpStatus } from '@nestjs/common';
import { BaseError, ErrorCodes } from '#setup/error';

export class InvalidCredentialsError extends BaseError {
  public override code = ErrorCodes.INVALID_CREDENTIALS;

  constructor() {
    super('Invalid email or password', HttpStatus.UNAUTHORIZED);
  }
}

export class EmailTakenError extends BaseError {
  public override code = ErrorCodes.EMAIL_TAKEN;

  constructor(email: string) {
    super(`Email "${email}" is already registered`, HttpStatus.CONFLICT);
  }
}
