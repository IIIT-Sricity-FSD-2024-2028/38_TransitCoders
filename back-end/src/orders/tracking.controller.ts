import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import type { IApiResponse } from '../common/interfaces/api-response.interface';

/**
 * TrackingController — PUBLIC real-time tracking endpoint (no auth).
 *
 * SRS (Customer/Receiver): "Access full real-time tracking of their package."
 * The landing-page tracking widget and customer portal both use this.
 *
 * Returns only non-sensitive fields: status, timeline, ETA. No phone
 * numbers, no full addresses, no financial data.
 */
@ApiTags('Tracking')
@Controller('tracking')
export class TrackingController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get(':trackingId')
  @ApiOperation({ summary: 'Public shipment tracking by tracking ID (no auth)' })
  @ApiResponse({ status: 200, description: 'Tracking timeline returned' })
  @ApiResponse({ status: 404, description: 'Unknown tracking ID' })
  track(@Param('trackingId') trackingId: string): IApiResponse<unknown> {
    return { success: true, data: this.ordersService.getPublicTracking(trackingId) };
  }
}