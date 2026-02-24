// @scope:api
// @type:module

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '#/setup/prisma';
import { SetupModule } from '#/setup/setup.module';
import { HealthModule } from '#/setup/health/health.module';
import { UserModule } from '#/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV || 'dev'}`,
      isGlobal: true,
    }),
    PrismaModule,
    SetupModule,
    HealthModule,
    UserModule,
  ],
})
export class AppModule {}
