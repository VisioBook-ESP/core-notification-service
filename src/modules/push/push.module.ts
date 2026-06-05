import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { QueueModule } from '../queue/queue.module';
import { AdaptersModule } from '../adapters/adapters.module';
import { PushService } from './push.service';
import { PushController } from './push.controller';

@Module({
  imports: [DatabaseModule, QueueModule, AdaptersModule],
  providers: [PushService],
  controllers: [PushController],
  exports: [PushService],
})
export class PushModule {}
