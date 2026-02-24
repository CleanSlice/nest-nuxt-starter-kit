// @scope:api
// @slice:setup
// @layer:presentation
// @type:module

import { Module } from '@nestjs/common';
import { ErrorModule } from './error';
import { ResponseModule } from './response';

@Module({
  imports: [ErrorModule, ResponseModule],
  exports: [ErrorModule, ResponseModule],
})
export class SetupModule {}
