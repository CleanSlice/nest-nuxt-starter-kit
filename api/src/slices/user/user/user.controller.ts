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
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { EntityIdPipe } from '#setup/id';
import { UserService } from './domain/user.service';
import { CreateUserDto } from './dtos/createUser.dto';
import { UpdateUserDto } from './dtos/updateUser.dto';
import { FilterUserDto } from './dtos/filterUser.dto';
import { USER_ID_PREFIX } from './domain/user.types';

const userIdParam = {
  name: 'id',
  description: 'User primary ID',
  example: 'user-calm-rivers-k8m4p2d7n9x3',
};

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
  @ApiParam(userIdParam)
  getUser(@Param('id', new EntityIdPipe(USER_ID_PREFIX)) id: string) {
    return this.userService.getUser(id);
  }

  @Post()
  @ApiOperation({ operationId: 'createUser', summary: 'Create a new user' })
  createUser(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @Patch(':id')
  @ApiOperation({ operationId: 'updateUser', summary: 'Update user by id' })
  @ApiParam(userIdParam)
  updateUser(
    @Param('id', new EntityIdPipe(USER_ID_PREFIX)) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ operationId: 'deleteUser', summary: 'Delete user by id' })
  @ApiParam(userIdParam)
  deleteUser(@Param('id', new EntityIdPipe(USER_ID_PREFIX)) id: string) {
    return this.userService.deleteUser(id);
  }
}
