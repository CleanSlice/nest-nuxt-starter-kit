// @scope:api
// @slice:setup/error
// @layer:presentation
// @type:module

import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ErrorHandlingInterceptor } from './interceptors/error-handling.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorHandlingInterceptor,
    },
  ],
  exports: [],
})
export class ErrorModule {}
