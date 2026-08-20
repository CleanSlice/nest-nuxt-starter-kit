// @scope:api
// @slice:user/auth
// @layer:domain
// @type:service

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IAuthGateway } from './auth.gateway';
import {
  IAuthPayload,
  IAuthTokenData,
  IRegisterData,
  ILoginData,
} from './auth.types';
import { InvalidCredentialsError, EmailTakenError } from './auth.errors';
import { IUserData } from '../../user/domain/user.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly authGateway: IAuthGateway,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: IRegisterData): Promise<IAuthTokenData> {
    const existing = await this.authGateway.findByEmail(
      data.email.toLowerCase().trim(),
    );

    if (existing) {
      throw new EmailTakenError(data.email);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.authGateway.create({
      ...data,
      email: data.email.toLowerCase().trim(),
      name: data.name.trim(),
      hashedPassword,
    });

    const accessToken = this.generateToken(user);

    return { accessToken, user };
  }

  async login(data: ILoginData): Promise<IAuthTokenData> {
    const user = await this.authGateway.findByEmail(
      data.email.toLowerCase().trim(),
    );

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const { password: _, ...userData } = user;
    const accessToken = this.generateToken(userData);

    return { accessToken, user: userData };
  }

  async validateToken(payload: IAuthPayload): Promise<IUserData> {
    const user = await this.authGateway.findById(payload.sub);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    return user;
  }

  private generateToken(user: IUserData): string {
    const payload: IAuthPayload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload);
  }
}
