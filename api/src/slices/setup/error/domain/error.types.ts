// @scope:api
// @slice:setup/error
// @layer:domain
// @type:types

export enum ErrorCodes {
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  BAD_REQUEST = 'BAD_REQUEST',

  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_EXISTS = 'USER_EXISTS',
}

export interface IErrorResponse {
  code: string;
  statusCode: number;
  message: string;
  timestamp: string;
  path?: string;
  details?: unknown;
}
