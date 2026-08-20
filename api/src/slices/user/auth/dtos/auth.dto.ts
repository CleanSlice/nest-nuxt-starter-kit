// @scope:api
// @slice:user/auth
// @layer:presentation
// @type:dto

import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from '../../user/dtos/user.dto';
import { IAuthTokenData } from '../domain/auth.types';

export class AuthDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ type: UserDto })
  user: UserDto;

  constructor(data: IAuthTokenData) {
    this.accessToken = data.accessToken;
    this.user = data.user;
  }
}
