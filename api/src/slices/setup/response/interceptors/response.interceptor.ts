// @scope:api
// @slice:setup/response
// @layer:interceptors
// @type:interceptor

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import { FLAT_RESPONSE_KEY } from '../decorators/flat-response.decorator';
import { IApiResponse, IPaginatedResponse } from '../domain/response.types';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<IApiResponse | IPaginatedResponse> {
    const isFlatResponse = this.reflector.getAllAndOverride<boolean>(
      FLAT_RESPONSE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isFlatResponse) {
      return next.handle();
    }

    return next.handle().pipe(
      map((responseData) => {
        if (responseData && responseData.meta) {
          return {
            data: responseData.data,
            meta: responseData.meta,
            success: true,
          };
        }

        return {
          data: responseData,
          success: true,
        };
      }),
    );
  }
}
