import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { IUser } from '../users/interfaces/user.interface';
import type { IApiResponse } from '../common/interfaces/api-response.interface';
import type { INotification } from './notifications.service';

@ApiTags('Notifications')
@ApiHeader({ name: 'x-auth-token', required: true })
@UseGuards(AuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'My notifications (auto-generated worklist signals)' })
  @ApiResponse({ status: 200, description: 'Notifications returned' })
  findAll(@CurrentUser() user: IUser): IApiResponse<INotification[]> {
    return { success: true, data: this.notificationsService.findAllForUser(user.id) };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Unread notification count' })
  unreadCount(@CurrentUser() user: IUser): IApiResponse<{ count: number }> {
    return { success: true, data: { count: this.notificationsService.countUnread(user.id) } };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(@Param('id') id: string, @CurrentUser() user: IUser): IApiResponse<{ ok: boolean }> {
    return { success: true, data: { ok: this.notificationsService.markRead(id, user.id) } };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  markAllRead(@CurrentUser() user: IUser): IApiResponse<{ updated: number }> {
    return { success: true, data: { updated: this.notificationsService.markAllRead(user.id) } };
  }
}