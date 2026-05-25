// @scope:api
// @slice:user
// @layer:presentation
// @type:controller

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserService } from './domain/user.service';
import { CreateUserDto } from './dtos/createUser.dto';
import { UpdateUserDto } from './dtos/updateUser.dto';
import { FilterUserDto } from './dtos/filterUser.dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ operationId: 'getUsers', summary: 'Get paginated users' })
  getUsers(@Query() filter: FilterUserDto) {
    return this.userService.getUsers(filter);
  }

  @Get(':id')
  @ApiOperation({ operationId: 'getUser', summary: 'Get user by id' })
  getUser(@Param('id') id: string) {
    return this.userService.getUser(id);
  }

  @Post()
  @ApiOperation({ operationId: 'createUser', summary: 'Create a new user' })
  createUser(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @Patch(':id')
  @ApiOperation({ operationId: 'updateUser', summary: 'Update user by id' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.updateUser(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ operationId: 'deleteUser', summary: 'Delete user by id' })
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}
