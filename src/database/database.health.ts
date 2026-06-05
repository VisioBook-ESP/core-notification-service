import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';

export class DatabaseHealthCheck {
  private readonly logger = new Logger(DatabaseHealthCheck.name);

  async checkConnection(dataSource: DataSource): Promise<boolean> {
    try {
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.release();
      return true;
    } catch (error) {
      this.logger.error(`Database connection check failed: ${error}`);
      return false;
    }
  }

  async checkTables(dataSource: DataSource): Promise<boolean> {
    try {
      const tables = await dataSource.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
      );
      return tables.length > 0;
    } catch (error) {
      this.logger.error(`Database table check failed: ${error}`);
      return false;
    }
  }
}

export const databaseHealthCheck = new DatabaseHealthCheck();
