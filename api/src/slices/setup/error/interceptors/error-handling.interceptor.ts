// @scope:api
// @slice:setup/error
// @layer:interceptors
// @type:interceptor

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';
import { Response } from 'express';
import { BaseError } from '../domain/base.error';
import { IErrorResponse } from '../domain/error.types';

@Injectable()
export class ErrorHandlingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorHandlingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest();

        const statusCode =
          error instanceof HttpException || error instanceof BaseError
            ? error.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
          error.response?.message ||
          error.message ||
          'An unexpected error occurred';

        const code =
          error instanceof BaseError
            ? error.getCode()
            : error.code || 'UNEXPECTED_ERROR';

        const errorResponse: IErrorResponse = {
          code,
          statusCode,
          message,
          timestamp: new Date().toISOString(),
          path: request.url,
        };

        if (error.details) {
          errorResponse.details = error.details;
        }

        this.logger.error(
          `[${code}] ${message}`,
          error.stack,
          JSON.stringify({
            path: request.url,
            method: request.method,
            statusCode,
          }),
        );

        response.status(statusCode).json(errorResponse);
        return throwError(() => error);
      }),
    );
  }
}
