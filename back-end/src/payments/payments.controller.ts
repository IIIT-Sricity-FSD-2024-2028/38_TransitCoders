import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrdersService } from '../orders/orders.service';
import { Role } from '../common/constants/roles.constant';
import type { IUser } from '../users/interfaces/user.interface';
import type { IApiResponse } from '../common/interfaces/api-response.interface';
import type { IPayment } from './interfaces/payment.interface';

/**
 * Payment history endpoints. Ownership is enforced through
 * OrdersService.getAuthorizedOrder (same access rules as order reads).
 */
@ApiTags('Payments')
@ApiHeader({ name: 'x-auth-token', required: true })
@UseGuards(AuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly ordersService: OrdersService,
  ) {}

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Payment records for an order (owner or staff)' })
  @ApiResponse({ status: 200, description: 'Payments returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findByOrder(
    @Param('orderId') orderId: string,
    @CurrentUser() user: IUser,
  ): IApiResponse<IPayment[]> {
    // Authorization: same visibility rules as reading the order itself
    this.ordersService.getAuthorizedOrder(orderId, user);
    return { success: true, data: this.paymentsService.getPaymentsForOrder(orderId) };
  }
}