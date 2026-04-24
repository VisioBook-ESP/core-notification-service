# Database Schema & Entities Documentation

## Overview

The notification service uses **TypeORM** with **PostgreSQL** to manage three primary entities:
- **Notifications**: In-app notifications for users
- **Email Templates**: Reusable email templates with variable substitution
- **Device Tokens**: Push notification device registrations

---

## Database Entities

### 1. NotificationEntity (`notifications` table)

Stores in-app notifications for users.

| Column | Type | Nullable | Indexes | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | Primary Key | Unique notification ID |
| userId | UUID | No | Index | User who receives the notification |
| type | ENUM | No | - | Notification type (generation_complete, etc.) |
| title | VARCHAR | No | - | Notification title |
| body | TEXT | No | - | Notification body/content |
| data | JSONB | Yes | - | Optional metadata |
| status | ENUM | No | - | NotificationStatus (pending, sent, delivered, failed) |
| read | BOOLEAN | No | Index | Read status |
| readAt | TIMESTAMP | Yes | - | When notification was read |
| createdAt | TIMESTAMP | No | Index | Creation timestamp |
| updatedAt | TIMESTAMP | No | - | Last update timestamp |

**Indexes:**
- `IDX_notifications_userId_createdAt` - Fast queries for user notifications
- `IDX_notifications_read_userId` - Fast unread notification queries

**Enums:**
```typescript
NotificationType: 'generation_complete' | 'generation_failed' | 'share_received' | 'payment_confirmed' | 'system_announcement'
NotificationStatus: 'pending' | 'sent' | 'delivered' | 'failed' | 'queued'
```

---

### 2. EmailTemplateEntity (`email_templates` table)

Reusable email templates for transactional emails.

| Column | Type | Nullable | Indexes | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | Primary Key | Unique template ID |
| templateId | VARCHAR | No | Unique | Template identifier (email_verification, etc.) |
| name | VARCHAR | No | - | Human-readable template name |
| subject | VARCHAR | No | - | Email subject line |
| body | TEXT | No | - | HTML email body |
| variables | JSONB | No | - | Required variables schema |
| active | BOOLEAN | No | - | Template active/disabled status |
| createdAt | TIMESTAMP | No | - | Creation timestamp |
| updatedAt | TIMESTAMP | No | - | Last update timestamp |

**Pre-seeded Templates:**
- `email_verification` - Email address verification
- `password_reset` - Password reset request
- `welcome` - Welcome email for new users
- `generation_complete` - Project generation completion
- `payment_confirmation` - Payment receipt

---

### 3. DeviceTokenEntity (`device_tokens` table)

Push notification device tokens and subscriptions.

| Column | Type | Nullable | Indexes | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | Primary Key | Unique device token ID |
| userId | UUID | No | Index | User who owns the device |
| deviceId | VARCHAR | No | Unique (with userId) | Device identifier |
| token | TEXT | No | - | Push notification token |
| platform | ENUM | No | - | Device platform (ios, android, web) |
| active | BOOLEAN | No | - | Token active/disabled status |
| lastUsedAt | TIMESTAMP | Yes | - | Last time token was used |
| createdAt | TIMESTAMP | No | - | Registration timestamp |
| updatedAt | TIMESTAMP | No | - | Last update timestamp |

**Unique Constraint:**
- `UQ_device_tokens_deviceId_userId` - One token per device per user

**Enums:**
```typescript
DevicePlatform: 'ios' | 'android' | 'web'
```

---

## DTOs (Data Transfer Objects)

### Notification DTOs

**Create Notification:**
```typescript
{
  userId: string;           // UUID
  type: NotificationType;   // enum
  title: string;
  body: string;
  data?: Record<string, any>;
}
```

**List Notifications Query:**
```typescript
{
  page?: number;            // default: 1
  limit?: number;           // default: 20
  read?: boolean;           // filter by read status
  type?: NotificationType;  // filter by type
}
```

---

### Email Template DTOs

**Create Template:**
```typescript
{
  templateId: string;           // unique identifier
  name: string;
  subject: string;
  body: string;                 // HTML content
  variables: Record<string, any>;  // variable schema
  active?: boolean;             // default: true
}
```

---

### Device Token DTOs

**Subscribe Device:**
```typescript
{
  token: string;            // Push notification token
  deviceId: string;         // Device identifier
  platform: DevicePlatform; // 'ios' | 'android' | 'web'
}
```

---

## Custom Repositories

### NotificationRepository

Custom query methods for notifications:

```typescript
// Find notifications by user with filtering
findByUserId(userId: string, skip?: number, take?: number, filters?: {
  read?: boolean;
  type?: NotificationType;
}): Promise<{ items: NotificationEntity[]; total: number }>

// Count all notifications for a user
countByUserId(userId: string): Promise<number>

// Count unread notifications
countUnreadByUserId(userId: string): Promise<number>

// Mark as read
markAsRead(notificationId: string, userId: string): Promise<void>

// Mark all as read
markAllAsRead(userId: string): Promise<void>

// Find expired notifications (for cleanup)
findExpiredNotifications(daysOld?: number): Promise<NotificationEntity[]>
```

### EmailTemplateRepository

```typescript
// Find template by templateId
findByTemplateId(templateId: string): Promise<EmailTemplateEntity | null>

// Get all active templates with pagination
findAllActive(skip?: number, take?: number): Promise<{ items; total }>

// Search templates
searchTemplates(search: string, activeOnly?: boolean, skip?: number, take?: number): Promise<{ items; total }>

// Deactivate template
deactivateTemplate(templateId: string): Promise<void>
```

### DeviceTokenRepository

```typescript
// Get all active tokens for a user
findActiveTokensByUserId(userId: string): Promise<string[]>

// Get device by user and device ID
findByUserIdAndDeviceId(userId: string, deviceId: string): Promise<DeviceTokenEntity | null>

// List devices with pagination and filters
findDevicesByUserId(userId: string, skip?: number, take?: number, filters?: {
  active?: boolean;
  platform?: DevicePlatform;
}): Promise<{ items; total }>

// Count devices
countDevicesByUserId(userId: string): Promise<number>

// Update last used timestamp
updateLastUsed(deviceId: string, userId: string): Promise<void>

// Clean up old tokens
deleteInactiveTokens(daysInactive?: number): Promise<void>
```

---

## Database Initialization

### Automatic (Development)

With `synchronize: true` in development, TypeORM automatically creates tables on startup:

```bash
npm run start:dev
```

### Manual Migrations

```bash
# Run migrations
npm run db:migrate

# Revert last migration
npm run db:revert

# Run seeds (populate email templates)
npm run db:seed
```

### Initialize Database Script

```bash
npm run db:init
```

Creates the database if it doesn't exist.

---

## TypeORM Configuration

Location: `src/app.module.ts`

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [NotificationEntity, EmailTemplateEntity, DeviceTokenEntity],
  synchronize: process.env.NODE_ENV === 'development',  // Auto-create tables in dev
  logging: process.env.NODE_ENV === 'development',       // Log SQL queries in dev
  migrations: ['src/database/migrations/*.ts'],
  migrationsRun: false,  // Run on application start
})
```

---

## Mappers

Data mappers convert between entities and DTOs:

### NotificationMapper

```typescript
static toEntity(dto: CreateNotificationDto): Partial<NotificationEntity>
static toResponse(entity: NotificationEntity): NotificationResponseDto
static toResponseList(entities: NotificationEntity[], total: number, page: number, limit: number): ListNotificationsResponseDto
```

### EmailTemplateMapper

```typescript
static toEntity(dto: CreateEmailTemplateDto): Partial<EmailTemplateEntity>
static toUpdateEntity(dto: UpdateEmailTemplateDto): Partial<EmailTemplateEntity>
static toResponse(entity: EmailTemplateEntity): EmailTemplateResponseDto
static toResponseList(entities: EmailTemplateEntity[], ...): ListEmailTemplatesResponseDto
```

### DeviceTokenMapper

```typescript
static toEntity(userId: string, dto: SubscribeDeviceDto): Partial<DeviceTokenEntity>
static toResponse(entity: DeviceTokenEntity): DeviceTokenResponseDto
static toResponseList(entities: DeviceTokenEntity[], ...): ListDeviceTokensResponseDto
```

---

## Database Seeding

Initial email templates are seeded automatically on first run:

### Pre-seeded Templates

| Template ID | Name | Subject | Variables |
|-------------|------|---------|-----------|
| email_verification | Email Verification | Verify your email address | `verificationLink` |
| password_reset | Password Reset | Reset your password | `resetLink` |
| welcome | Welcome Email | Welcome to VisioBook! | `username` |
| generation_complete | Generation Complete | Your video is ready! | `projectName` |
| payment_confirmation | Payment Confirmation | Payment received | `orderId` |

---

## Environment Variables

```env
# Database Connection
DATABASE_HOST=postgres           # PostgreSQL host
DATABASE_PORT=5432              # PostgreSQL port
DATABASE_USER=visiobook          # Database user
DATABASE_PASSWORD=mypassword     # Database password
DATABASE_NAME=notifications_db   # Database name

# Migrations
DATABASE_MIGRATIONS_RUN=false    # Auto-run migrations on startup
```

---

## Database File Structure

```
src/database/
├── entities/                          # TypeORM entities
│   ├── notification.entity.ts
│   ├── email-template.entity.ts
│   ├── device-token.entity.ts
│   └── index.ts
├── repositories/                      # Custom repositories
│   ├── notification.repository.ts
│   ├── email-template.repository.ts
│   ├── device-token.repository.ts
│   └── index.ts
├── dto/                               # Data Transfer Objects
│   ├── notification.dto.ts
│   ├── email-template.dto.ts
│   ├── device-token.dto.ts
│   └── index.ts
├── mappers/                           # Entity to DTO mappers
│   ├── notification.mapper.ts
│   ├── email-template.mapper.ts
│   └── index.ts
├── migrations/                        # Database migrations
│   └── 1681234567000-CreateNotificationTables.ts
├── database.module.ts                 # Database module (import in AppModule)
├── database.service.ts                # Database health checks
├── database.health.ts                 # Health check utilities
├── database.seeder.ts                 # Database seeding utilities
├── data-source.ts                     # TypeORM DataSource config
└── index.ts                           # Barrel exports
```

---

## Testing Database Queries

The repositories are fully tested, but you can verify them manually:

```typescript
// In a service or controller
constructor(
  private notificationRepo: NotificationRepository,
  private deviceTokenRepo: DeviceTokenRepository,
  private templateRepo: EmailTemplateRepository,
) {}

async exampleMethod(userId: string) {
  // Get user notifications
  const { items, total } = await this.notificationRepo.findByUserId(userId, 0, 10);

  // Get active tokens
  const tokens = await this.deviceTokenRepo.findActiveTokensByUserId(userId);

  // Get template
  const template = await this.templateRepo.findByTemplateId('email_verification');
}
```

---

## Performance Considerations

### Indexes

✅ **Optimized indexes:**
- `notifications.userId + createdAt` - Fast user notification queries
- `notifications.read + userId` - Fast unread queries
- `device_tokens.userId` - Fast device lookup

### Query Optimization

The repositories include optimized query builders:
- Use filtering and pagination to reduce result size
- Leverage indexes for WHERE clauses
- Select specific columns when possible

### Cleanup

Implement periodic cleanup:

```typescript
// Clean up old notifications (monthly task)
await this.notificationRepo.findExpiredNotifications(30);

// Clean up inactive device tokens (quarterly task)
await this.deviceTokenRepo.deleteInactiveTokens(90);
```

---

## Troubleshooting

### Tables not created

**Issue:** Tables missing after startup

**Solution:**
```bash
# If using Docker:
docker compose down -v          # Remove volume
docker compose up               # Recreate with synchronize: true

# If using migrations:
npm run db:migrate
```

### Connection refused

**Issue:** Cannot connect to PostgreSQL

**Solution:**
```bash
# Check database is running
docker compose ps

# Check credentials in .env
cat .env | grep DATABASE_

# Try connecting manually
psql -h localhost -U visiobook -d notifications_db
```

### Duplicate key error

**Issue:** Unique constraint violation

**Solution:**
```bash
# Clear database
npm run db:revert 0
npm run db:migrate

# Reseed
npm run db:seed
```

---

## Next Steps

The database schema is complete. You can now:
1. ✅ Create database entities and repositories
2. ⏳ Implement services using these repositories
3. ⏳ Create controllers with API endpoints
4. ⏳ Wire up adapters (SendGrid, Firebase)
5. ⏳ Implement Bull Queue processors

See the main task list for the next implementation steps!
