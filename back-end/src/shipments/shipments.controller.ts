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
import { ShipmentsService } from './shipments.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/constants/roles.constant';
import type { IUser } from '../users/interfaces/user.interface';
import type { IApiResponse } from '../common/interfaces/api-response.interface';
import type { IShipment } from './interfaces/shipment.interface';

@ApiTags('Shipments')
@ApiSecurity('x-auth-token')
@Controller('shipments')
@UseGuards(AuthGuard)
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List shipments (merchants see own, others see all)' })
  @ApiHeader({ name: 'x-auth-token', required: true })
  @ApiResponse({ status: 200, description: 'Shipments retrieved' })
  findAll(@CurrentUser() user: IUser): IApiResponse<IShipment[]> {
    return { success: true, data: this.shipmentsService.findAll(user) };
  }

  @Get(':id/track')
  @ApiOperation({ summary: 'Get tracking timeline for a shipment' })
  @ApiHeader({ name: 'x-auth-token', required: true })
  @ApiResponse({ status: 200, description: 'Tracking timeline' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  getTracking(@Param('id') id: string): IApiResponse<IShipment['trackingTimeline']> {
    return { success: true, data: this.shipmentsService.getTracking(id) };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.MERCHANT, Role.SUPER_USER)
  @ApiOperation({ summary: 'Create a shipment' })
  @ApiHeader({ name: 'x-auth-token', required: true })
  @ApiBody({ type: CreateShipmentDto })
  @ApiResponse({ status: 201, description: 'Shipment created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateShipmentDto, @CurrentUser() user: IUser): IApiResponse<IShipment> {
    return { success: true, data: this.shipmentsService.create(dto, user), message: 'Shipment created' };
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.MERCHANT, Role.SUPER_USER)
  @ApiOperation({ summary: 'Update a shipment' })
  @ApiHeader({ name: 'x-auth-token', required: true })
  @ApiBody({ type: UpdateShipmentDto })
  @ApiResponse({ status: 200, description: 'Shipment updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  update(@Param('id') id: string, @Body() dto: UpdateShipmentDto, @CurrentUser() user: IUser): IApiResponse<IShipment> {
    return { success: true, data: this.shipmentsService.update(id, dto, user) };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Delete a shipment (Super User only)' })
  @ApiHeader({ name: 'x-auth-token', required: true })
  @ApiResponse({ status: 200, description: 'Shipment deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  delete(@Param('id') id: string, @CurrentUser() user: IUser): IApiResponse<null> {
    this.shipmentsService.delete(id, user);
    return { success: true, message: 'Shipment deleted' };
  }
}
