import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EMAIL_QUEUE, PUSH_QUEUE } from './queue.constants';
import { EmailProcessor } from './email.processor';
import { PushProcessor } from './push.processor';
import { QueueService } from './queue.service';
import { AdaptersModule } from '../adapters/adapters.module';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: EMAIL_QUEUE,
        defaultJobOptions: {
          removeOnComplete: true,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      },
      {
        name: PUSH_QUEUE,
        defaultJobOptions: {
          removeOnComplete: true,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      },
    ),
    AdaptersModule,
  ],
  providers: [EmailProcessor, PushProcessor, QueueService],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
