import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AssignAgentDto } from './dto/assign-agent.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/constants/roles.constant';
import { OrderStatus } from '../common/constants/statuses.constant';
import type { IUser } from '../users/interfaces/user.interface';
import type { IOrder } from './interfaces/order.interface';
import type { IApiResponse } from '../common/interfaces/api-response.interface';

@ApiTags('Orders')
@ApiHeader({ name: 'x-auth-token', required: true })
@UseGuards(AuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List orders (role-filtered)' })
  findAll(@CurrentUser() user: IUser): IApiResponse<IOrder[]> {
    return { success: true, data: this.ordersService.findAll(user) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  findById(@Param('id') id: string): IApiResponse<IOrder> {
    return { success: true, data: this.ordersService.findById(id) };
  }

  @Post()
  @Roles(Role.MERCHANT)
  @ApiOperation({ summary: 'Create a new order' })
  async create(@Body() dto: CreateOrderDto, @CurrentUser() user: IUser): Promise<IApiResponse<IOrder>> {
    return { success: true, data: await this.ordersService.create(dto, user) };
  }

  @Put(':id')
  @Roles(Role.MERCHANT, Role.HUB_MANAGER)
  @ApiOperation({ summary: 'Update an order' })
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto, @CurrentUser() user: IUser): IApiResponse<IOrder> {
    return { success: true, data: this.ordersService.update(id, dto, user) };
  }

  @Patch(':id/status')
  @Roles(Role.HUB_MANAGER, Role.DELIVERY_AGENT)
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(@Param('id') id: string, @Body('status') status: OrderStatus, @CurrentUser() user: IUser): IApiResponse<IOrder> {
    return { success: true, data: this.ordersService.updateStatus(id, status, user) };
  }

  @Patch(':id/assign')
  @Roles(Role.HUB_MANAGER)
  @ApiOperation({ summary: 'Assign an agent to an order' })
  assignAgent(@Param('id') id: string, @Body() dto: AssignAgentDto, @CurrentUser() user: IUser): IApiResponse<IOrder> {
    return { success: true, data: this.ordersService.assignAgent(id, dto.agentId, user) };
  }

  @Delete(':id')
  @Roles(Role.MERCHANT, Role.SUPER_USER)
  @ApiOperation({ summary: 'Cancel an order' })
  cancel(@Param('id') id: string, @CurrentUser() user: IUser): IApiResponse<null> {
    this.ordersService.cancel(id, user);
    return { success: true, message: 'Order cancelled successfully' };
  }
}
