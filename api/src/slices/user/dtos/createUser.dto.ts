// @scope:api
// @slice:user
// @layer:presentation
// @type:dto

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsArray,
  IsEnum,
} from 'class-validator';
import { RoleTypes } from '../domain/user.types';

export class CreateUserDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({
    enum: RoleTypes,
    isArray: true,
    example: [RoleTypes.USER],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(RoleTypes, { each: true })
  roles?: RoleTypes[];
}
