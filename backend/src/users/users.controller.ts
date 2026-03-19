import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  findAll(
    @Query('page') page?: number, 
    @Query('limit') limit?: number, 
    @Query('search') search?: string
  ) {
    if (page || limit || search) {
      return this.usersService.findAllPaginated({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 50,
        search
      });
    }
    return this.usersService.findAll();
  }

  @Post()
  createUser(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @Patch('change-password')
  changePassword(@Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(dto);
  }

  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() data: UpdateUserDto) {
    return this.usersService.updateUser(id, data);
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}

