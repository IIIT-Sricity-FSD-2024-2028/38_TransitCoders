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
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import type { IFeedback } from './interfaces/feedback.interface';
import type { IUser } from '../users/interfaces/user.interface';

// ODDT-309 — FeedbackController
@ApiTags('Feedback')
@ApiHeader({ name: 'x-auth-token', required: true })
@UseGuards(AuthGuard, RolesGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  @Roles(Role.CUSTOMER, Role.SUPER_USER)
  @ApiOperation({ summary: 'List feedback (customer sees own, super_user sees all)' })
  findAll(@CurrentUser() user: IUser): IApiResponse<IFeedback[]> {
    return { success: true, data: this.feedbackService.findAll(user) };
  }

  @Post()
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Submit feedback with rating 1-5' })
  @ApiResponse({ status: 400, description: 'Rating must be between 1 and 5' })
  create(
    @Body() dto: CreateFeedbackDto,
    @CurrentUser() user: IUser,
  ): IApiResponse<IFeedback> {
    return { success: true, data: this.feedbackService.create(dto, user) };
  }

  @Put(':id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Update feedback review status (super_user only)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFeedbackDto,
    @CurrentUser() user: IUser,
  ): IApiResponse<IFeedback> {
    return { success: true, data: this.feedbackService.update(id, dto, user) };
  }
}
