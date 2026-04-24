import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/constants/roles.constant';
import type { IApiResponse } from '../common/interfaces/api-response.interface';
import { RolesService } from './roles.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import type { IRole } from './interfaces/role.interface';

// ODDT-314 — RolesController
@ApiTags('Roles')
@ApiHeader({ name: 'x-auth-token', required: true })
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.SUPER_USER)  // All routes: super_user only
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'List all system roles' })
  findAll(): IApiResponse<IRole[]> {
    return { success: true, data: this.rolesService.findAll() };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  findById(@Param('id') id: string): IApiResponse<IRole> {
    return { success: true, data: this.rolesService.findById(id) };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update role permissions (permissions only — name/roleId immutable)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ): IApiResponse<IRole> {
    return { success: true, data: this.rolesService.update(id, dto) };
  }
}
