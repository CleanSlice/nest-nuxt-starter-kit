// @scope:api
// @slice:user
// @layer:presentation
// @type:module

import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './domain/user.service';
import { IUserGateway } from './domain/user.gateway';
import { UserGateway } from './data/user.gateway';
import { UserMapper } from './data/user.mapper';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    UserMapper,
    {
      provide: IUserGateway,
      useClass: UserGateway,
    },
  ],
  exports: [UserService],
})
export class UserModule {}
