import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { QueueModule } from '../queue/queue.module';
import { AdaptersModule } from '../adapters/adapters.module';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';

@Module({
  imports: [DatabaseModule, QueueModule, AdaptersModule],
  providers: [EmailService],
  controllers: [EmailController],
  exports: [EmailService],
})
export class EmailModule {}
