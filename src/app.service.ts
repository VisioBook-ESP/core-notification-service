import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(@Inject(DataSource) private dataSource: DataSource) {}

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'core-notification-service',
    };
  }

  async getReady() {
    const databaseConnected = this.dataSource.isInitialized;

    return {
      ready: databaseConnected,
      timestamp: new Date().toISOString(),
      service: 'core-notification-service',
      checks: {
        database: databaseConnected ? 'ok' : 'failed',
      },
    };
  }
}
