// @scope:api
// @slice:setup/mail
// @layer:domain
// @type:error

import { HttpStatus } from '@nestjs/common';
import { BaseError, ErrorCodes } from '#setup/error';

export class MailNotConfiguredError extends BaseError {
  public override code = ErrorCodes.MAIL_NOT_CONFIGURED;

  constructor(variable: string) {
    super(
      `Mail is not configured: set ${variable} in the environment`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class MailDeliveryError extends BaseError {
  public override code = ErrorCodes.MAIL_DELIVERY_FAILED;

  constructor(to: string | string[], cause?: Error) {
    const recipients = Array.isArray(to) ? to.join(', ') : to;
    super(`Could not deliver mail to "${recipients}"`, HttpStatus.BAD_GATEWAY, {
      cause,
    });
  }
}
