// @scope:api
// @slice:user
// @layer:presentation
// @type:dto

import { ApiProperty } from '@nestjs/swagger';
import { IUserData, RoleTypes } from '../domain/user.types';

export class UserDto implements IUserData {
  @ApiProperty({ example: 'user-a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ enum: RoleTypes, isArray: true, example: [RoleTypes.USER] })
  roles: RoleTypes[];

  @ApiProperty({ example: false })
  verified: boolean;

  @ApiProperty({ example: false })
  banned: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
