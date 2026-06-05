import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseFilters,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  CreateNotificationDto,
  NotificationResponseDto,
  ListNotificationsResponseDto,
} from '../../database/dto';
import { AllExceptionsFilter } from '../../common/filters/http-exception.filter';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationType } from '../../common/enums';

@ApiTags('Notifications')
@Controller('notifications')
@UseFilters(AllExceptionsFilter)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({
    status: 200,
    description: 'List of notifications',
    type: ListNotificationsResponseDto,
  })
  async getNotifications(
    @CurrentUser() user: any,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('read') read?: string,
    @Query('type') type?: string,
  ): Promise<ListNotificationsResponseDto> {
    this.logger.log(`📬 GET /notifications - Fetching notifications for user ${user.userId}`);
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const readBool = read === 'true' ? true : read === 'false' ? false : undefined;
    const typeEnum =
      type && Object.values(NotificationType).includes(type as NotificationType)
        ? (type as NotificationType)
        : undefined;
    return this.notificationsService.getUserNotifications(user.userId, {
      page,
      limit,
      read: readBool,
      type: typeEnum,
    });
  }

  @Post()
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiSecurity('api_key')
  @ApiOperation({ summary: 'Create notification - Service only' })
  @ApiResponse({ status: 201, description: 'Notification created', type: NotificationResponseDto })
  async createNotification(@Body() dto: CreateNotificationDto): Promise<NotificationResponseDto> {
    this.logger.log(`📬 POST /notifications - Creating notification`);
    return this.notificationsService.createNotification(dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get single notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification details', type: NotificationResponseDto })
  async getNotification(
    @CurrentUser() user: any,
    @Param('id') notificationId: string,
  ): Promise<NotificationResponseDto> {
    this.logger.log(
      `📬 GET /notifications/${notificationId} - Fetching notification for user ${user.userId}`,
    );
    return this.notificationsService.getNotification(notificationId, user.userId);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(
    @CurrentUser() user: any,
    @Param('id') notificationId: string,
  ): Promise<NotificationResponseDto> {
    this.logger.log(
      `📬 PATCH /notifications/${notificationId}/read - Marking as read for user ${user.userId}`,
    );
    return this.notificationsService.updateNotification(notificationId, user.userId, {
      read: true,
    });
  }

  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@CurrentUser() user: any): Promise<any> {
    this.logger.log(
      `📬 PATCH /notifications/read-all - Marking all as read for user ${user.userId}`,
    );
    return this.notificationsService.markAllAsRead(user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 204, description: 'Notification deleted' })
  async deleteNotification(
    @CurrentUser() user: any,
    @Param('id') notificationId: string,
  ): Promise<void> {
    this.logger.log(
      `📬 DELETE /notifications/${notificationId} - Deleting notification for user ${user.userId}`,
    );
    return this.notificationsService.deleteNotification(notificationId, user.userId);
  }

  @Get('unread/count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  async getUnreadCount(@CurrentUser() user: any): Promise<any> {
    this.logger.log(
      `📬 GET /notifications/unread/count - Getting unread count for user ${user.userId}`,
    );
    return this.notificationsService.getUnreadCount(user.userId);
  }
}
