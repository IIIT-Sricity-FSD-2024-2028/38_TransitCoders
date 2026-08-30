import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { QuoteDto, UpdatePricingConfigDto } from './dto/quote.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/constants/roles.constant';
import type { IPricingBreakdown } from '../orders/interfaces/order.interface';
import type { IApiResponse } from '../common/interfaces/api-response.interface';

/**
 * Pricing endpoints.
 *
 * POST /pricing/quote  — any authenticated user (customer/merchant) gets an
 *                        authoritative price quote. The client supplies only
 *                        INPUTS (service level, weight, payment mode); the
 *                        backend computes the amount. The client can never
 *                        set the final charge.
 * GET  /pricing/config — current pricing rules (authenticated).
 * PUT  /pricing/config — Super User only: change business pricing rules.
 */
@ApiTags('Pricing')
@ApiHeader({ name: 'x-auth-token', required: true })
@UseGuards(AuthGuard, RolesGuard)
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('quote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate an authoritative shipping price quote' })
  @ApiBody({ type: QuoteDto })
  @ApiResponse({ status: 201, description: 'Quote calculated' })
  quote(@Body() dto: QuoteDto): IApiResponse<IPricingBreakdown> {
    return { success: true, data: this.pricingService.calculateQuote(dto) };
  }

  @Get('config')
  @ApiOperation({ summary: 'Get current pricing configuration' })
  @ApiResponse({ status: 200, description: 'Pricing config returned' })
  getConfig(): IApiResponse<Record<string, number>> {
    return { success: true, data: this.pricingService.getConfig() as any };
  }

  @Put('config')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Update pricing rules (Super User only)' })
  @ApiBody({ type: UpdatePricingConfigDto })
  @ApiResponse({ status: 200, description: 'Pricing config updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  updateConfig(@Body() dto: UpdatePricingConfigDto): IApiResponse<Record<string, number>> {
    return { success: true, data: this.pricingService.updateConfig(dto) as any };
  }
}