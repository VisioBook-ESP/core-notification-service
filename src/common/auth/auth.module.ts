import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ApiKeyGuard } from '../guards/api-key.guard';

@Module({
  providers: [JwtAuthGuard, ApiKeyGuard],
  exports: [JwtAuthGuard, ApiKeyGuard],
})
export class AuthModule {}
