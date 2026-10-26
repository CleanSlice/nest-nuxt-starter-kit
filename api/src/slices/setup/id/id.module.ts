// @scope:api
// @slice:setup/id
// @layer:presentation
// @type:module

import { Global, Module } from '@nestjs/common';
import { IIdGateway } from './domain/id.gateway';
import { IdGateway } from './data/id.gateway';

@Global()
@Module({
  providers: [{ provide: IIdGateway, useClass: IdGateway }],
  exports: [IIdGateway],
})
export class IdModule {}
