// @scope:api
// @slice:user/auth
// @layer:presentation
// @type:module

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './domain/auth.service';
import { IAuthGateway } from './domain/auth.gateway';
import { AuthGateway } from './data/auth.gateway';
import { AuthMapper } from './data/auth.mapper';
import { JwtStrategy } from './guards/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN', '7d'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthMapper,
    JwtStrategy,
    {
      provide: IAuthGateway,
      useClass: AuthGateway,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
