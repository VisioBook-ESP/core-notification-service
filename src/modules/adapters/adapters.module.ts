import { Module } from '@nestjs/common';
import { SendGridAdapter } from './sendgrid.adapter';
import { FirebaseAdapter } from './firebase.adapter';

@Module({
  providers: [SendGridAdapter, FirebaseAdapter],
  exports: [SendGridAdapter, FirebaseAdapter],
})
export class AdaptersModule {}
