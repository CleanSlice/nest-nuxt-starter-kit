// @scope:api
// @slice:user
// @layer:presentation
// @type:dto

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { RoleTypes } from '../domain/user.types';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({
    enum: RoleTypes,
    isArray: true,
    example: [RoleTypes.USER],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(RoleTypes, { each: true })
  roles?: RoleTypes[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  banned?: boolean;
}
