import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AssignAgentDto } from './dto/assign-agent.dto';
import { TransferOrderDto } from './dto/transfer-order.dto';
import { MishapDto } from './dto/mishap.dto';
import { SchedulePickupDto } from './dto/schedule-pickup.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/constants/roles.constant';
import { OrderStatus } from '../common/constants/statuses.constant';
import { BarcodeService } from './barcode.service';
import type { IUser } from '../users/interfaces/user.interface';
import type { IOrder } from './interfaces/order.interface';
import type { IApiResponse } from '../common/interfaces/api-response.interface';

@ApiTags('Orders')
@ApiHeader({ name: 'x-auth-token', required: true })
@UseGuards(AuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly barcodeService: BarcodeService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List orders (role-filtered)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiResponse({ status: 200, description: 'Orders returned' })
  findAll(@CurrentUser() user: IUser, @Query('status') status?: string): IApiResponse<IOrder[]> {
    let orders = this.ordersService.findAll(user);
    if (status) orders = orders.filter((o) => o.status === status);
    return { success: true, data: orders };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details (object-level access enforced)' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 403, description: 'No access to this order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findById(@Param('id') id: string, @CurrentUser() user: IUser): IApiResponse<IOrder> {
    return { success: true, data: this.ordersService.getAuthorizedOrder(id, user) };
  }

  @Get(':id/barcode')
  @Roles(Role.MERCHANT, Role.HUB_MANAGER, Role.SUPER_USER, Role.ADMIN, Role.DELIVERY_AGENT)
  @ApiOperation({ summary: 'Barcode (Code 128 SVG) for order identification' })
  @ApiResponse({ status: 200, description: 'SVG barcode' })
  getBarcode(@Param('id') id: string, @CurrentUser() user: IUser, @Res() res: Response): void {
    const order = this.ordersService.getAuthorizedOrder(id, user);
    const svg = this.barcodeService.code128Svg(order.trackingId);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  }

  @Post()
  @Roles(Role.MERCHANT, Role.SUPER_USER)
  @ApiOperation({ summary: 'Create a new order (Merchant only — backend computes the price)' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'Order created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Body() dto: CreateOrderDto, @CurrentUser() user: IUser): Promise<IApiResponse<IOrder>> {
    return { success: true, data: await this.ordersService.create(dto, user) };
  }

  @Put(':id')
  @Roles(Role.MERCHANT, Role.HUB_MANAGER, Role.SUPER_USER, Role.ADMIN)
  @ApiOperation({ summary: 'Update an order (financial fields are not editable)' })
  @ApiBody({ type: UpdateOrderDto })
  @ApiResponse({ status: 200, description: 'Order updated' })
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto, @CurrentUser() user: IUser): IApiResponse<IOrder> {
    return { success: true, data: this.ordersService.update(id, dto, user) };
  }

  @Patch(':id/status')
  @Roles(Role.HUB_MANAGER, Role.DELIVERY_AGENT, Role.SUPER_USER, Role.ADMIN)
  @ApiOperation({ summary: 'Update order status (state machine + ownership enforced)' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 403, description: 'Not your order / not your hub' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
    @CurrentUser() user: IUser,
  ): IApiResponse<IOrder> {
    return { success: true, data: this.ordersService.updateStatus(id, status, user) };
  }

  @Patch(':id/assign')
  @Roles(Role.HUB_MANAGER, Role.SUPER_USER, Role.ADMIN)
  @ApiOperation({ summary: 'Assign a delivery agent to a Pending order (own hub only)' })
  @ApiBody({ type: AssignAgentDto })
  @ApiResponse({ status: 200, description: 'Agent assigned' })
  @ApiResponse({ status: 400, description: 'Order not Pending / invalid agent' })
  assignAgent(@Param('id') id: string, @Body() dto: AssignAgentDto, @CurrentUser() user: IUser): IApiResponse<IOrder> {
    return { success: true, data: this.ordersService.assignAgent(id, dto.agentId, user) };
  }

  @Patch(':id/auto-assign')
  @Roles(Role.HUB_MANAGER, Role.SUPER_USER, Role.ADMIN)
  @ApiOperation({ summary: 'Dispatch automation: assign least-loaded available agent in hub' })
  @ApiResponse({ status: 200, description: 'Agent auto-assigned' })
  @ApiResponse({ status: 400, description: 'No available agents / order not Pending' })
  autoAssign(@Param('id') id: string, @CurrentUser() user: IUser): IApiResponse<IOrder> {
    return { success: true, data: this.ordersService.autoAssign(id, user) };
  }

  @Patch(':id/cancel')
  @Roles(Role.MERCHANT, Role.SUPER_USER, Role.ADMIN)
  @ApiOperation({ summary: 'Cancel a Pending/Assigned order (owner merchant or Super User; triggers refund)' })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel at this stage' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  cancelOrder(@Param('id') id: string, @CurrentUser() user: IUser): IApiResponse<unknown> {
    const result = this.ordersService.cancel(id, user);
    return { success: true, message: 'Order cancelled successfully', data: result };
  }

  @Patch(':id/transfer')
  @Roles(Role.HUB_MANAGER, Role.SUPER_USER, Role.ADMIN)
  @ApiOperation({ summary: 'Send order to a different hub (SRS: inter-hub routing)' })
  @ApiBody({ type: TransferOrderDto })
  @ApiResponse({ status: 200, description: 'Order transferred' })
  transfer(
    @Param('id') id: string,
    @Body() dto: TransferOrderDto,
    @CurrentUser() user: IUser,
  ): IApiResponse<IOrder> {
    return { success: true, data: this.ordersService.transferToHub(id, dto.toHubId, dto.reason, user) };
  }

  @Patch(':id/return')
  @Roles(Role.HUB_MANAGER, Role.SUPER_USER, Role.ADMIN)
  @ApiOperation({ summary: 'Authorize return/refund for a Delivered order (SRS)' })
  @ApiResponse({ status: 200, description: 'Return authorized + refund issued' })
  @ApiResponse({ status: 400, description: 'Order not Delivered' })
  authorizeReturn(
    @Param('id') id: string,
    @Body('reason') reason: string | undefined,
    @CurrentUser() user: IUser,
  ): IApiResponse<IOrder> {
    return { success: true, data: this.ordersService.authorizeReturn(id, user, reason) };
  }

  @Post(':id/mishap')
  @Roles(Role.DELIVERY_AGENT)
  @ApiOperation({ summary: 'Report a delivery mishap (agent, own order only)' })
  @ApiBody({ type: MishapDto })
  @ApiResponse({ status: 201, description: 'Mishap recorded, order marked Failed' })
  @ApiResponse({ status: 403, description: 'Not your delivery' })
  reportMishap(
    @Param('id') id: string,
    @Body() dto: MishapDto,
    @CurrentUser() user: IUser,
  ): IApiResponse<IOrder> {
    return {
      success: true,
      data: this.ordersService.reportMishap(id, user, dto.type, dto.description),
    };
  }

  @Patch(':id/pickup')
  @Roles(Role.MERCHANT, Role.CUSTOMER, Role.SUPER_USER, Role.ADMIN)
  @ApiOperation({ summary: 'Schedule a pickup for a Pending order (SRS: pickup scheduling)' })
  @ApiBody({ type: SchedulePickupDto })
  @ApiResponse({ status: 200, description: 'Pickup scheduled' })
  schedulePickup(
    @Param('id') id: string,
    @Body() dto: SchedulePickupDto,
    @CurrentUser() user: IUser,
  ): IApiResponse<IOrder> {
    return {
      success: true,
      data: this.ordersService.schedulePickup(id, user, new Date(dto.pickupAt)),
    };
  }

  @Patch(':id/confirm')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Customer confirms delivery receipt (SRS: delivery confirmation)' })
  @ApiResponse({ status: 200, description: 'Delivery confirmed' })
  @ApiResponse({ status: 400, description: 'Order not Delivered yet' })
  confirmDelivery(@Param('id') id: string, @CurrentUser() user: IUser): IApiResponse<IOrder> {
    return { success: true, data: this.ordersService.confirmDelivery(id, user) };
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Delete an order (Super User only)' })
  @ApiResponse({ status: 200, description: 'Order deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string, @CurrentUser() user: IUser): IApiResponse<null> {
    const order = this.ordersService.getAuthorizedOrder(id, user);
    if (order.status !== 'Pending' && order.status !== 'Cancelled') {
      throw new NotFoundException('Only Pending or Cancelled orders can be deleted');
    }
    this.ordersService.removeOrder(order.id);
    return { success: true, message: 'Order deleted' };
  }
}