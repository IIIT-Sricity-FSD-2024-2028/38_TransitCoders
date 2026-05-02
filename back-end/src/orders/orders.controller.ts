import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
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
  @ApiResponse({ status: 200, description: 'Orders returned' })
  findAll(@CurrentUser() user: IUser): IApiResponse<IOrder[]> {
    return { success: true, data: this.ordersService.findAll(user) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findById(@Param('id') id: string): IApiResponse<IOrder> {
    return { success: true, data: this.ordersService.findById(id) };
  }

  @Post()
  @Roles(Role.MERCHANT)
  @ApiOperation({ summary: 'Create a new order (Merchant only)' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'Order created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Body() dto: CreateOrderDto, @CurrentUser() user: IUser): Promise<IApiResponse<IOrder>> {
    return { success: true, data: await this.ordersService.create(dto, user) };
  }

  @Put(':id')
  @Roles(Role.MERCHANT, Role.HUB_MANAGER)
  @ApiOperation({ summary: 'Update an order' })
  @ApiBody({ type: UpdateOrderDto })
  @ApiResponse({ status: 200, description: 'Order updated' })
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto, @CurrentUser() user: IUser): IApiResponse<IOrder> {
    return { success: true, data: this.ordersService.update(id, dto, user) };
  }

  @Patch(':id/status')
  @Roles(Role.HUB_MANAGER, Role.DELIVERY_AGENT)
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  updateStatus(@Param('id') id: string, @Body('status') status: OrderStatus, @CurrentUser() user: IUser): IApiResponse<IOrder> {
    return { success: true, data: this.ordersService.updateStatus(id, status, user) };
  }

  @Patch(':id/assign')
  @Roles(Role.HUB_MANAGER)
  @ApiOperation({ summary: 'Assign a delivery agent to a Pending order' })
  @ApiBody({ type: AssignAgentDto })
  @ApiResponse({ status: 200, description: 'Agent assigned' })
  @ApiResponse({ status: 400, description: 'Order not in Pending status' })
  assignAgent(@Param('id') id: string, @Body() dto: AssignAgentDto, @CurrentUser() user: IUser): IApiResponse<IOrder> {
    return { success: true, data: this.ordersService.assignAgent(id, dto.agentId, user) };
  }

  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(Role.MERCHANT, Role.SUPER_USER)
  @ApiOperation({ summary: 'Cancel a Pending order (Merchant or Super User only)' })
  @ApiHeader({ name: 'x-auth-token', description: 'Auth token from login', required: true })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel at this stage' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  cancelOrder(
    @Param('id') id: string,
    @CurrentUser() user: IUser,
  ) {
    this.ordersService.cancel(id, user);
    return { success: true, message: 'Order cancelled successfully' };
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Delete an order (Super User only)' })
  @ApiResponse({ status: 200, description: 'Order deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string, @CurrentUser() user: IUser): IApiResponse<null> {
    // Re-uses cancel logic — only valid for Pending orders
    this.ordersService.cancel(id, user);
    return { success: true, message: 'Order deleted' };
  }
}
