import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { databaseHealthCheck } from './database.health';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('Initializing database connection...');
      const isConnected = await databaseHealthCheck.checkConnection(this.dataSource);
      if (isConnected) {
        this.logger.log('✅ Database connection established');
      } else {
        this.logger.warn('⚠️ Database connection check failed');
      }
    } catch (error) {
      this.logger.error(`Database initialization error: ${error}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    return databaseHealthCheck.checkConnection(this.dataSource);
  }

  getDataSource(): DataSource {
    return this.dataSource;
  }
}
