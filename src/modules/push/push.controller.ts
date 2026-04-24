import {
  Controller,
  Post,
  Get,
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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { PushService } from './push.service';
import {
  SubscribeDeviceDto,
  SendPushDto,
  SendPushResponseDto,
  SendTopicPushDto,
  SubscribeTopicDto,
  ListDevicesResponseDto,
} from './push.dto';
import { AllExceptionsFilter } from '../../common/filters/http-exception.filter';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Push Notifications')
@Controller('push')
@UseFilters(AllExceptionsFilter)
export class PushController {
  private readonly logger = new Logger(PushController.name);

  constructor(private pushService: PushService) {}

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe device for push notifications' })
  @ApiResponse({ status: 201, description: 'Device subscribed successfully' })
  async subscribeDevice(@CurrentUser() user: any, @Body() dto: SubscribeDeviceDto): Promise<any> {
    this.logger.log(`📱 POST /push/subscribe - Subscribing device for user ${user.userId}`);
    return this.pushService.subscribeDevice(user.userId, dto);
  }

  @Delete('unsubscribe/:deviceId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unsubscribe device from push notifications' })
  @ApiResponse({ status: 204, description: 'Device unsubscribed successfully' })
  async unsubscribeDevice(
    @CurrentUser() user: any,
    @Param('deviceId') deviceId: string,
  ): Promise<void> {
    this.logger.log(
      `📱 DELETE /push/unsubscribe/${deviceId} - Unsubscribing device for user ${user.userId}`,
    );
    return this.pushService.unsubscribeDevice(user.userId, deviceId);
  }

  @Post('send')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiSecurity('api_key')
  @ApiOperation({ summary: 'Send push notification to user - Service only' })
  @ApiResponse({ status: 202, description: 'Push notification queued', type: SendPushResponseDto })
  async sendPush(@Body() dto: SendPushDto): Promise<SendPushResponseDto> {
    this.logger.log(`🔔 POST /push/send - Sending push to user ${dto.userId}`);
    return this.pushService.sendPushNotification(dto);
  }

  @Post('topic/subscribe')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiSecurity('api_key')
  @ApiOperation({ summary: 'Subscribe devices to Firebase topic - Service only' })
  @ApiResponse({ status: 201, description: 'Devices subscribed to topic' })
  async subscribeToTopic(@Body() dto: SubscribeTopicDto): Promise<any> {
    this.logger.log(`📍 POST /push/topic/subscribe - Subscribing to topic "${dto.topic}"`);
    return this.pushService.subscribeToTopic(dto);
  }

  @Post('topic/send')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiSecurity('api_key')
  @ApiOperation({ summary: 'Send push to Firebase topic - Service only' })
  @ApiResponse({ status: 202, description: 'Push sent to topic' })
  async sendToTopic(@Body() dto: SendTopicPushDto): Promise<any> {
    this.logger.log(`📍 POST /push/topic/send - Sending to topic "${dto.topic}"`);
    return this.pushService.sendPushToTopic(dto);
  }

  @Get('devices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user devices' })
  @ApiResponse({ status: 200, description: 'List of user devices', type: ListDevicesResponseDto })
  async listDevices(
    @CurrentUser() user: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<ListDevicesResponseDto> {
    this.logger.log(`📱 GET /push/devices - Listing devices for user ${user.userId}`);
    return this.pushService.listUserDevices(user.userId, page, limit);
  }

  @Get('queue/stats')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api_key')
  @ApiOperation({ summary: 'Get push queue statistics - Service only' })
  @ApiResponse({ status: 200, description: 'Queue statistics' })
  async getQueueStats() {
    this.logger.log('📊 GET /push/queue/stats - Fetching queue stats');
    return this.pushService.getQueueStats();
  }
}
