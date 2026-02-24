// @scope:api
// @slice:setup/error
// @layer:domain
// @type:error

import { HttpException } from '@nestjs/common';
import { ErrorCodes } from './error.types';

export abstract class BaseError extends HttpException {
  public code: ErrorCodes = ErrorCodes.UNEXPECTED_ERROR;
  public override cause: Error;

  constructor(
    message: string,
    statusCode: number = 500,
    options?: { cause?: Error },
  ) {
    super(message, statusCode, { cause: options?.cause });
    this.cause = options?.cause || new Error(message);
    this.name = this.constructor.name;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  getStatus(): number {
    return super.getStatus();
  }

  getCode(): ErrorCodes {
    return this.code;
  }

  getCause(): Error {
    return this.cause || new Error('No cause provided');
  }
}
