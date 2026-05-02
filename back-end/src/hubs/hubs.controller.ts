import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { HubsService } from './hubs.service';
import { CreateHubDto } from './dto/create-hub.dto';
import { UpdateHubDto } from './dto/update-hub.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/constants/roles.constant';

@ApiTags('Hubs')
@ApiSecurity('x-auth-token')
@Controller('hubs')
@UseGuards(AuthGuard)
export class HubsController {
  constructor(private readonly hubsService: HubsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all hubs' })
  @ApiHeader({ name: 'x-auth-token', required: true })
  @ApiResponse({ status: 200, description: 'Hubs retrieved' })
  findAll() {
    return { success: true, data: this.hubsService.findAll() };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hub by ID or hubId (e.g. H001)' })
  @ApiHeader({ name: 'x-auth-token', required: true })
  @ApiResponse({ status: 200, description: 'Hub found' })
  @ApiResponse({ status: 404, description: 'Hub not found' })
  findOne(@Param('id') id: string) {
    return { success: true, data: this.hubsService.findById(id) };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Create a hub (Super User only)' })
  @ApiHeader({ name: 'x-auth-token', required: true })
  @ApiBody({ type: CreateHubDto })
  @ApiResponse({ status: 201, description: 'Hub created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateHubDto) {
    return { success: true, data: this.hubsService.create(dto) };
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_USER, Role.HUB_MANAGER)
  @ApiOperation({ summary: 'Update hub' })
  @ApiHeader({ name: 'x-auth-token', required: true })
  @ApiBody({ type: UpdateHubDto })
  @ApiResponse({ status: 200, description: 'Hub updated' })
  @ApiResponse({ status: 404, description: 'Hub not found' })
  update(@Param('id') id: string, @Body() dto: UpdateHubDto) {
    return { success: true, data: this.hubsService.update(id, dto) };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Delete hub (Super User only)' })
  @ApiHeader({ name: 'x-auth-token', required: true })
  @ApiResponse({ status: 200, description: 'Hub deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Hub not found' })
  delete(@Param('id') id: string) {
    this.hubsService.delete(id);
    return { success: true, message: 'Hub deleted' };
  }
}
