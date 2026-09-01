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
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/constants/roles.constant';
import type { IApiResponse } from '../common/interfaces/api-response.interface';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import type { ITicket } from './interfaces/ticket.interface';
import type { IUser } from '../users/interfaces/user.interface';

// ODDT-299 — TicketsController
@ApiTags('Tickets')
@ApiHeader({ name: 'x-auth-token', required: true })
@UseGuards(AuthGuard, RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @Roles(Role.MERCHANT, Role.SUPER_USER, Role.ADMIN)
  @ApiOperation({ summary: 'List tickets (merchant sees own, super_user sees all)' })
  findAll(@CurrentUser() user: IUser): IApiResponse<ITicket[]> {
    return { success: true, data: this.ticketsService.findAll(user) };
  }

  @Post()
  @Roles(Role.MERCHANT)
  @ApiOperation({ summary: 'Create a support ticket' })
  create(
    @Body() dto: CreateTicketDto,
    @CurrentUser() user: IUser,
  ): IApiResponse<ITicket> {
    return { success: true, data: this.ticketsService.create(dto, user) };
  }

  @Put(':id')
  @Roles(Role.MERCHANT, Role.SUPER_USER, Role.ADMIN)
  @ApiOperation({ summary: 'Update ticket status or priority' })
  @ApiResponse({ status: 403, description: 'Not ticket owner' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @CurrentUser() user: IUser,
  ): IApiResponse<ITicket> {
    return { success: true, data: this.ticketsService.update(id, dto, user) };
  }

  @Delete(':id')
  @Roles(Role.MERCHANT)
  @ApiOperation({ summary: 'Delete a ticket (merchant — own only)' })
  @ApiResponse({ status: 403, description: 'Not ticket owner' })
  delete(
    @Param('id') id: string,
    @CurrentUser() user: IUser,
  ): IApiResponse<null> {
    this.ticketsService.delete(id, user);
    return { success: true, message: 'Ticket deleted' };
  }
}
