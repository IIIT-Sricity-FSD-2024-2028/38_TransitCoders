import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/constants/roles.constant';
import type { IUser } from '../users/interfaces/user.interface';
import type { IAgentProfile } from './interfaces/agent.interface';
import type { IOrder } from '../orders/interfaces/order.interface';
import type { IApiResponse } from '../common/interfaces/api-response.interface';

@ApiTags('Agents')
@ApiHeader({ name: 'x-auth-token', required: true })
@UseGuards(AuthGuard, RolesGuard)
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  @Roles(Role.HUB_MANAGER, Role.SUPER_USER)
  @ApiOperation({ summary: 'List all agents' })
  findAll(): IApiResponse<IAgentProfile[]> {
    return { success: true, data: this.agentsService.findAll() };
  }

  @Get(':id')
  @Roles(Role.HUB_MANAGER, Role.SUPER_USER, Role.DELIVERY_AGENT)
  @ApiOperation({ summary: 'Get agent profile' })
  findById(@Param('id') id: string): IApiResponse<IAgentProfile> {
    return { success: true, data: this.agentsService.findById(id) };
  }

  @Get(':id/worklist')
  @Roles(Role.DELIVERY_AGENT, Role.HUB_MANAGER, Role.SUPER_USER)
  @ApiOperation({ summary: 'Get assigned orders for an agent' })
  getWorklist(@Param('id') id: string, @CurrentUser() user: IUser): IApiResponse<IOrder[]> {
    return { success: true, data: this.agentsService.getWorklist(id, user) };
  }

  @Patch(':id/availability')
  @Roles(Role.DELIVERY_AGENT)
  @ApiOperation({ summary: 'Update agent availability status' })
  updateAvailability(@Param('id') id: string, @Body() dto: UpdateAvailabilityDto, @CurrentUser() user: IUser): IApiResponse<IAgentProfile> {
    return { success: true, data: this.agentsService.updateAvailability(id, dto, user) };
  }
}
