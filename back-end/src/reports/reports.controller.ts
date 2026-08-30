import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/constants/roles.constant';
import type { IApiResponse } from '../common/interfaces/api-response.interface';

/**
 * Reporting endpoints — Super User only (admin monitoring & revenue).
 */
@ApiTags('Reports')
@ApiHeader({ name: 'x-auth-token', required: true })
@UseGuards(AuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('revenue')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Revenue summary (gross / refunds / net, by level, hub, day)' })
  @ApiResponse({ status: 200, description: 'Revenue summary returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  revenue(): IApiResponse<unknown> {
    return { success: true, data: this.reportsService.getRevenueSummary() };
  }

  @Get('operations')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Operations monitoring snapshot' })
  operations(): IApiResponse<unknown> {
    return { success: true, data: this.reportsService.getOperationsSummary() };
  }

  @Get('payments')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Payment ledger audit view' })
  payments(@Query('limit') limit?: string): IApiResponse<unknown> {
    const n = Math.min(Math.max(parseInt(limit || '200', 10) || 200, 1), 500);
    return { success: true, data: this.reportsService.getPaymentLedger(n) };
  }
}