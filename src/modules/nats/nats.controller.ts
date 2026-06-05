import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EmailService } from '../email/email.service';
import { PushService } from '../push/push.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, EmailTemplate } from '../../common/enums';
import { SendEmailDto, SendTemplateEmailDto } from '../email/email.dto';
import { SendPushDto } from '../push/push.dto';
import { CreateNotificationDto } from '../../database/dto';
import {
  NATS_SUBJECTS,
  GenerationCompletedPayload,
  GenerationFailedPayload,
  ContentSharedPayload,
  PaymentConfirmedPayload,
  UserRegisteredPayload,
  UserPasswordResetPayload,
} from './nats.events';

@Controller()
export class NatsController {
  private readonly logger = new Logger(NatsController.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly pushService: PushService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── Generic subjects ─────────────────────────────────────────────────────────

  @EventPattern(NATS_SUBJECTS.SEND_EMAIL)
  async handleSendEmail(@Payload() data: SendEmailDto): Promise<void> {
    this.logger.log(`[NATS] ${NATS_SUBJECTS.SEND_EMAIL} — to: ${data?.to}`);
    try {
      await this.emailService.sendEmailQueued(data);
    } catch (err: unknown) {
      this.logger.error(`[NATS] ${NATS_SUBJECTS.SEND_EMAIL} failed: ${(err as Error).message}`);
    }
  }

  @EventPattern(NATS_SUBJECTS.SEND_TEMPLATE_EMAIL)
  async handleSendTemplateEmail(@Payload() data: SendTemplateEmailDto): Promise<void> {
    this.logger.log(`[NATS] ${NATS_SUBJECTS.SEND_TEMPLATE_EMAIL} — template: ${data?.templateId}`);
    try {
      await this.emailService.sendTemplateEmail(data);
    } catch (err: unknown) {
      this.logger.error(
        `[NATS] ${NATS_SUBJECTS.SEND_TEMPLATE_EMAIL} failed: ${(err as Error).message}`,
      );
    }
  }

  @EventPattern(NATS_SUBJECTS.SEND_PUSH)
  async handleSendPush(@Payload() data: SendPushDto): Promise<void> {
    this.logger.log(`[NATS] ${NATS_SUBJECTS.SEND_PUSH} — userId: ${data?.userId}`);
    try {
      await this.pushService.sendPushNotification(data);
    } catch (err: unknown) {
      this.logger.error(`[NATS] ${NATS_SUBJECTS.SEND_PUSH} failed: ${(err as Error).message}`);
    }
  }

  @EventPattern(NATS_SUBJECTS.CREATE_IN_APP)
  async handleCreateInApp(@Payload() data: CreateNotificationDto): Promise<void> {
    this.logger.log(`[NATS] ${NATS_SUBJECTS.CREATE_IN_APP} — userId: ${data?.userId}`);
    try {
      await this.notificationsService.createNotification(data);
    } catch (err: unknown) {
      this.logger.error(`[NATS] ${NATS_SUBJECTS.CREATE_IN_APP} failed: ${(err as Error).message}`);
    }
  }

  // ─── Domain events ────────────────────────────────────────────────────────────

  @EventPattern(NATS_SUBJECTS.GENERATION_COMPLETED)
  async handleGenerationCompleted(@Payload() data: GenerationCompletedPayload): Promise<void> {
    this.logger.log(
      `[NATS] ${NATS_SUBJECTS.GENERATION_COMPLETED} — userId: ${data.userId}, id: ${data.generationId}`,
    );
    try {
      await Promise.allSettled([
        this.emailService.sendTemplateEmail({
          to: data.userEmail,
          templateId: EmailTemplate.GENERATION_COMPLETE,
          data: { generationId: data.generationId, title: data.title },
        }),
        this.pushService.sendPushNotification({
          userId: data.userId,
          title: 'Your generation is ready!',
          body: `"${data.title}" is ready to view`,
          data: { generationId: data.generationId, action: 'view_generation' },
        }),
        this.notificationsService.createNotification({
          userId: data.userId,
          type: NotificationType.GENERATION_COMPLETE,
          title: 'Generation Complete',
          body: `"${data.title}" has been generated successfully`,
          data: { generationId: data.generationId },
        }),
      ]);
    } catch (err: unknown) {
      this.logger.error(
        `[NATS] ${NATS_SUBJECTS.GENERATION_COMPLETED} failed: ${(err as Error).message}`,
      );
    }
  }

  @EventPattern(NATS_SUBJECTS.GENERATION_FAILED)
  async handleGenerationFailed(@Payload() data: GenerationFailedPayload): Promise<void> {
    this.logger.log(
      `[NATS] ${NATS_SUBJECTS.GENERATION_FAILED} — userId: ${data.userId}, id: ${data.generationId}`,
    );
    try {
      await Promise.allSettled([
        this.pushService.sendPushNotification({
          userId: data.userId,
          title: 'Generation failed',
          body: data.reason || 'Your generation could not be completed. Please try again.',
          data: { generationId: data.generationId },
        }),
        this.notificationsService.createNotification({
          userId: data.userId,
          type: NotificationType.GENERATION_FAILED,
          title: 'Generation Failed',
          body: data.reason || 'Your generation could not be completed. Please try again.',
          data: { generationId: data.generationId },
        }),
      ]);
    } catch (err: unknown) {
      this.logger.error(
        `[NATS] ${NATS_SUBJECTS.GENERATION_FAILED} failed: ${(err as Error).message}`,
      );
    }
  }

  @EventPattern(NATS_SUBJECTS.CONTENT_SHARED)
  async handleContentShared(@Payload() data: ContentSharedPayload): Promise<void> {
    this.logger.log(
      `[NATS] ${NATS_SUBJECTS.CONTENT_SHARED} — userId: ${data.userId}, contentId: ${data.contentId}`,
    );
    try {
      await Promise.allSettled([
        this.pushService.sendPushNotification({
          userId: data.userId,
          title: `${data.sharedByName} shared content with you`,
          body: 'You have received new shared content',
          data: { contentId: data.contentId },
        }),
        this.notificationsService.createNotification({
          userId: data.userId,
          type: NotificationType.SHARE_RECEIVED,
          title: 'Content Shared With You',
          body: `${data.sharedByName} shared new content with you`,
          data: { contentId: data.contentId, sharedByName: data.sharedByName },
        }),
      ]);
    } catch (err: unknown) {
      this.logger.error(`[NATS] ${NATS_SUBJECTS.CONTENT_SHARED} failed: ${(err as Error).message}`);
    }
  }

  @EventPattern(NATS_SUBJECTS.PAYMENT_CONFIRMED)
  async handlePaymentConfirmed(@Payload() data: PaymentConfirmedPayload): Promise<void> {
    this.logger.log(
      `[NATS] ${NATS_SUBJECTS.PAYMENT_CONFIRMED} — userId: ${data.userId}, paymentId: ${data.paymentId}`,
    );
    try {
      await Promise.allSettled([
        this.emailService.sendTemplateEmail({
          to: data.userEmail,
          templateId: EmailTemplate.PAYMENT_CONFIRMATION,
          data: {
            amount: `${data.amount} ${data.currency}`,
            paymentId: data.paymentId,
            paymentDate: new Date().toLocaleDateString('fr-FR'),
          },
        }),
        this.pushService.sendPushNotification({
          userId: data.userId,
          title: 'Payment Confirmed',
          body: `Your payment of ${data.amount} ${data.currency} was processed successfully`,
          data: { paymentId: data.paymentId },
        }),
        this.notificationsService.createNotification({
          userId: data.userId,
          type: NotificationType.PAYMENT_CONFIRMED,
          title: 'Payment Confirmed',
          body: `Your payment of ${data.amount} ${data.currency} was processed successfully`,
          data: { paymentId: data.paymentId },
        }),
      ]);
    } catch (err: unknown) {
      this.logger.error(
        `[NATS] ${NATS_SUBJECTS.PAYMENT_CONFIRMED} failed: ${(err as Error).message}`,
      );
    }
  }

  @EventPattern(NATS_SUBJECTS.USER_REGISTERED)
  async handleUserRegistered(@Payload() data: UserRegisteredPayload): Promise<void> {
    this.logger.log(`[NATS] ${NATS_SUBJECTS.USER_REGISTERED} — userId: ${data.userId}`);
    try {
      await this.emailService.sendTemplateEmail({
        to: data.email,
        templateId: EmailTemplate.EMAIL_VERIFICATION,
        data: {
          userName: data.name,
          verificationToken: data.verificationToken,
        },
      });
    } catch (err: unknown) {
      this.logger.error(
        `[NATS] ${NATS_SUBJECTS.USER_REGISTERED} failed: ${(err as Error).message}`,
      );
    }
  }

  @EventPattern(NATS_SUBJECTS.USER_PASSWORD_RESET_REQUESTED)
  async handlePasswordResetRequested(@Payload() data: UserPasswordResetPayload): Promise<void> {
    this.logger.log(
      `[NATS] ${NATS_SUBJECTS.USER_PASSWORD_RESET_REQUESTED} — userId: ${data.userId}`,
    );
    try {
      await this.emailService.sendTemplateEmail({
        to: data.email,
        templateId: EmailTemplate.PASSWORD_RESET,
        data: { resetToken: data.resetToken },
      });
    } catch (err: unknown) {
      this.logger.error(
        `[NATS] ${NATS_SUBJECTS.USER_PASSWORD_RESET_REQUESTED} failed: ${(err as Error).message}`,
      );
    }
  }
}
