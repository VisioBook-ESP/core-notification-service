import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

export class DatabaseSeeder {
  private readonly logger = new Logger(DatabaseSeeder.name);

  async seed(dataSource: DataSource): Promise<void> {
    this.logger.log('🌱 Starting database seeding...');

    try {
      await this.seedEmailTemplates(dataSource);
      this.logger.log('✅ Database seeding completed successfully');
    } catch (error) {
      this.logger.error(`❌ Database seeding failed: ${error}`);
      throw error;
    }
  }

  private async seedEmailTemplates(dataSource: DataSource): Promise<void> {
    const templateRepository = dataSource.getRepository('email_templates');

    const templates = [
      {
        templateId: 'email_verification',
        name: 'Email Verification',
        subject: 'Verify your email address',
        body: '<h1>Welcome to VisioBook</h1><p>Click the link to verify your email: {{verificationLink}}</p>',
        variables: { verificationLink: 'string' },
        active: true,
      },
      {
        templateId: 'password_reset',
        name: 'Password Reset',
        subject: 'Reset your password',
        body: '<h1>Password Reset Request</h1><p>Click to reset: {{resetLink}}</p>',
        variables: { resetLink: 'string' },
        active: true,
      },
      {
        templateId: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to VisioBook!',
        body: '<h1>Welcome {{username}}</h1><p>Get started with your first project.</p>',
        variables: { username: 'string' },
        active: true,
      },
      {
        templateId: 'generation_complete',
        name: 'Generation Complete',
        subject: 'Your video is ready!',
        body: '<h1>Generation Complete</h1><p>Your project "{{projectName}}" is ready to view.</p>',
        variables: { projectName: 'string' },
        active: true,
      },
      {
        templateId: 'payment_confirmation',
        name: 'Payment Confirmation',
        subject: 'Payment received',
        body: '<h1>Payment Confirmed</h1><p>Order {{orderId}} has been confirmed.</p>',
        variables: { orderId: 'string' },
        active: true,
      },
    ];

    for (const template of templates) {
      const exists = await templateRepository.findOne({
        where: { templateId: template.templateId },
      });

      if (!exists) {
        await templateRepository.insert(template);
        this.logger.log(`✓ Seeded template: ${template.templateId}`);
      }
    }
  }
}

export const databaseSeeder = new DatabaseSeeder();
