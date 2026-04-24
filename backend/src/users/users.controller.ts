import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/constants/roles.constant';
import type { IApiResponse } from '../common/interfaces/api-response.interface';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { IUser, ISafeUser } from './interfaces/user.interface';

// ODDT-247 — Build controller routes
@ApiTags('Users')
@ApiHeader({ name: 'x-auth-token', required: true, description: 'Auth token from login' })
@UseGuards(AuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.SUPER_USER, Role.HUB_MANAGER)
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'Returns all users' })
  findAll(): IApiResponse<ISafeUser[]> {
    return { success: true, data: this.usersService.findAll() };
  }

  @Get(':id')
  @Roles(Role.SUPER_USER, Role.HUB_MANAGER)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findById(@Param('id') id: string): IApiResponse<ISafeUser> {
    return { success: true, data: this.usersService.findById(id) };
  }

  @Post()
  @Roles(Role.SUPER_USER, Role.HUB_MANAGER)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async create(@Body() dto: CreateUserDto): Promise<IApiResponse<ISafeUser>> {
    return { success: true, data: await this.usersService.create(dto) };
  }

  @Put(':id')
  @Roles(Role.SUPER_USER, Role.HUB_MANAGER)
  @ApiOperation({ summary: 'Update user details' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<IApiResponse<ISafeUser>> {
    return { success: true, data: await this.usersService.update(id, dto) };
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Delete a user (super_user only)' })
  @ApiResponse({ status: 400, description: 'Cannot delete your own account' })
  delete(
    @Param('id') id: string,
    @CurrentUser() user: IUser,
  ): IApiResponse<null> {
    this.usersService.delete(id, user.id);
    return { success: true, message: 'User deleted successfully' };
  }

  @Patch(':id/approve')
  @Roles(Role.SUPER_USER, Role.HUB_MANAGER)
  @ApiOperation({ summary: 'Approve a pending user account' })
  @ApiResponse({ status: 400, description: 'User is already active' })
  approve(@Param('id') id: string): IApiResponse<ISafeUser> {
    return { success: true, data: this.usersService.approve(id) };
  }
}
