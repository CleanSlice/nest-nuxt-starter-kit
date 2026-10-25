// @scope:api
// @slice:user
// @layer:presentation
// @type:dto

import { ApiProperty } from '@nestjs/swagger';
import { idPattern } from '#setup/id';
import { IUserData, RoleTypes, USER_ID_PREFIX } from '../domain/user.types';

export class UserDto implements IUserData {
  @ApiProperty({
    example: 'user-calm-rivers-k8m4p2d7n9x3',
    pattern: idPattern(USER_ID_PREFIX),
  })
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
