import {
  Body,
  Controller,
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
import { ComplaintsService } from './complaints.service';
import { ComplaintResponseDto } from './dto/complaint-response.dto';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import type { IComplaint } from './interfaces/complaint.interface';
import type { IUser } from '../users/interfaces/user.interface';

// ODDT-304 — ComplaintsController
@ApiTags('Complaints')
@ApiHeader({ name: 'x-auth-token', required: true })
@UseGuards(AuthGuard, RolesGuard)
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Get()
  @Roles(Role.CUSTOMER, Role.SUPER_USER)
  @ApiOperation({ summary: 'List complaints (customer sees own, super_user sees all)' })
  @ApiResponse({ status: 200, type: [ComplaintResponseDto] })
  findAll(@CurrentUser() user: IUser): IApiResponse<ComplaintResponseDto[]> {
    return { success: true, data: this.complaintsService.findAll(user) };
  }

  @Post()
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'File a new complaint' })
  create(
    @Body() dto: CreateComplaintDto,
    @CurrentUser() user: IUser,
  ): IApiResponse<ComplaintResponseDto> {
    return { success: true, data: this.complaintsService.create(dto, user) };
  }

  @Put(':id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Update complaint status (super_user only)' })
  @ApiResponse({ status: 403, description: 'Not super_user' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateComplaintDto,
    @CurrentUser() user: IUser,
  ): IApiResponse<ComplaintResponseDto> {
    return { success: true, data: this.complaintsService.update(id, dto, user) };
  }
}
