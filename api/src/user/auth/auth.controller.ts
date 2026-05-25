// @scope:api
// @slice:user/auth
// @layer:presentation
// @type:controller

import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './domain/auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { AuthDto } from './dtos/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserDto } from '../user/dtos/user.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ operationId: 'register', summary: 'Register a new user' })
  async register(@Body() dto: RegisterDto): Promise<AuthDto> {
    const result = await this.authService.register(dto);
    return new AuthDto(result);
  }

  @Post('login')
  @ApiOperation({
    operationId: 'login',
    summary: 'Login with email and password',
  })
  async login(@Body() dto: LoginDto): Promise<AuthDto> {
    const result = await this.authService.login(dto);
    return new AuthDto(result);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'getMe',
    summary: 'Get current authenticated user',
  })
  async getMe(@Request() req): Promise<UserDto> {
    return req.user;
  }
}
