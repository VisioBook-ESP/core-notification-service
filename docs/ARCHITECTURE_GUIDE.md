# Core Notification Service - Architecture Guide

## 🎯 High-Level Overview

The **Core Notification Service** is a microservice that manages all notifications in the VisioBook platform. It handles three types of notifications:
1. **Email** - Transactional and marketing emails via SendGrid
2. **Push Notifications** - Mobile/web push notifications via Firebase
3. **In-App Notifications** - In-application messages stored in the database

Other services in the platform communicate with this service to send notifications without needing to manage the email/push infrastructure themselves.

## 📊 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
│              (Auth Service, User Service, etc.)                  │
│                                                                  │
│ POST /api/v1/email/send    POST /api/v1/push/send              │
│ POST /api/v1/notifications (create for users)                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ HTTP Request w/ API Key or JWT
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│          Core Notification Service (NestJS)                      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           API Controllers                                │   │
│  │  ┌──────────┬──────────┬──────────┬──────────┐          │   │
│  │  │  Email   │  Push    │ In-App   │Templates │          │   │
│  │  │Controller│Controller│Controller│Controller│          │   │
│  │  └──────────┴─────────┬┴──────────┴──────────┘          │   │
│  │                       │                                  │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │           Auth/Security Layer                            │   │
│  │  ┌──────────────────┬──────────────────┐               │   │
│  │  │  JwtAuthGuard    │  ApiKeyGuard     │               │   │
│  │  │  (JWT Tokens)    │  (API Keys)      │               │   │
│  │  └──────────────────┴──────────────────┘               │   │
│  │                                                          │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │           Business Logic (Services)                      │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ EmailService    │  PushService    │ Notifications │   │   │
│  │  │ TemplatesService                │  Services      │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                    │                                    │   │
│  │                    ▼                                    │   │
│  │  ┌──────────────────────────────────────────┐          │   │
│  │  │      Queue System (Bull + Redis)         │          │   │
│  │  │  - Email Processor                       │          │   │
│  │  │  - Push Processor                        │          │   │
│  │  │  - Retry Logic (Exponential Backoff)     │          │   │
│  │  └──────────────────────────────────────────┘          │   │
│  │                                                          │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │           External Integrations (Adapters)              │   │
│  │  ┌──────────────────┬──────────────────┐               │   │
│  │  │  SendGrid        │  Firebase        │               │   │
│  │  │  Adapter         │  Adapter         │               │   │
│  │  └──────────────────┴──────────────────┘               │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────┬─────────────────┬─────────────────┬───────────────┘
              │                 │                 │
              ▼                 ▼                 ▼
         ┌─────────┐      ┌─────────┐      ┌──────────┐
         │PostgreSQL       │ Redis       │SendGrid API
         │  Database  │    (Cache/Queue)│  & Firebase
         └─────────┘      └─────────┘      └──────────┘
```

## 🔌 How External Services Use the Notification Service

### 1️⃣ **Send Email**
```http
POST /api/v1/email/send
Headers:
  X-API-Key: <service-api-key>
  Content-Type: application/json

Body:
{
  "to": "user@example.com",
  "subject": "Welcome to VisioBook!",
  "body": "<h1>Welcome</h1>",
  "priority": "high"
}

Response (202 Accepted):
{
  "jobId": "email-job-123",
  "status": "queued",
  "timestamp": "2026-04-17T10:30:00Z"
}
```

**Flow**:
1. External service makes HTTP request with **API Key** (service-to-service auth)
2. ApiKeyGuard validates the key
3. EmailService receives the request
4. Email is added to **Bull queue** (Redis)
5. **EmailProcessor** picks up the job asynchronously
6. SendGridAdapter sends via SendGrid API
7. Response is returned immediately (202 Accepted)

---

### 2️⃣ **Send Template Email**
```http
POST /api/v1/email/send-template
Headers:
  Content-Type: application/json

Body:
{
  "to": "user@example.com",
  "templateId": "verification-email",
  "variables": {
    "verificationCode": "123456",
    "expiresIn": "15 minutes"
  }
}

Response (202 Accepted):
{
  "jobId": "email-job-456",
  "status": "queued",
  "timestamp": "2026-04-17T10:30:00Z"
}
```

**Pre-loaded Templates**:
- `verification-email` - Email verification
- `password-reset` - Password reset link
- `welcome-email` - New user welcome
- `order-confirmation` - Purchase confirmation
- `payment-receipt` - Transaction receipt

**Features**:
- Template validation before sending
- Variable substitution
- Duplicate send prevention
- Batch processing support

---

### 3️⃣ **Send Push Notifications**
```http
POST /api/v1/push/send
Headers:
  X-API-Key: <service-api-key>
  Content-Type: application/json

Body:
{
  "userId": "user-uuid-123",
  "title": "New Message",
  "body": "You have a new message from John",
  "data": {
    "messageId": "msg-456",
    "senderId": "user-789"
  }
}

Response (202 Accepted):
{
  "jobId": "push-job-789",
  "status": "queued",
  "failedDevices": [],
  "successCount": 2
}
```

**Flow**:
1. Service requests push notification via API Key
2. System finds all devices registered by the user
3. Firebase multicast sends to all devices
4. Response includes success count and failed devices
5. Automatic retry for failed devices

---

### 4️⃣ **Create In-App Notification**
```http
POST /api/v1/notifications
Headers:
  X-API-Key: <service-api-key>
  Content-Type: application/json

Body:
{
  "userId": "user-uuid-123",
  "title": "Payment Received",
  "message": "Payment of $100 received successfully",
  "type": "payment",
  "actionUrl": "/payments/receipt/123"
}

Response (201 Created):
{
  "id": "notification-uuid-123",
  "userId": "user-uuid-123",
  "title": "Payment Received",
  "message": "Payment of $100 received successfully",
  "read": false,
  "createdAt": "2026-04-17T10:30:00Z"
}
```

**User Retrieves Notifications**:
```http
GET /api/v1/notifications?page=1&limit=20
Headers:
  Authorization: Bearer <jwt-token>

Response:
{
  "data": [
    { "id": "notif-123", "title": "...", "read": false },
    { "id": "notif-456", "title": "...", "read": true }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

---

## 🔐 Authentication & Authorization

### Types of Access

| Access Type | Uses | Example |
|------------|------|---------|
| **API Key** | Service-to-Service | Email Service calling Notification Service |
| **JWT Token** | User-to-Service | Mobile app getting user's notifications |
| **Public** | Read-only operations | Listing templates, testing templates |

### API Key Authentication
```javascript
// Other services include their API key
const response = await fetch('https://notifications-service/api/v1/email/send', {
  method: 'POST',
  headers: {
    'X-API-Key': process.env.NOTIFICATIONS_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ to: 'user@example.com', subject: '...' })
});
```

### JWT Token Authentication (User)
```javascript
// User mobile app includes JWT token
const response = await fetch('https://notifications-service/api/v1/notifications', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${userJwtToken}`,
  }
});
```

---

## 📦 Data Models

### Email Template
```typescript
{
  id: UUID,
  templateId: string,        // "verification-email", "password-reset", etc.
  name: string,              // "Email Verification"
  subject: string,           // "Verify your email address"
  body: string,              // HTML content with {{variable}} placeholders
  variables: string[],       // ["code", "expiresIn"]
  isActive: boolean,         // Soft delete support
  createdAt: Date,
  updatedAt: Date
}
```

### Device Token
```typescript
{
  id: UUID,
  userId: UUID,
  deviceToken: string,       // Firebase device token
  platform: string,          // "ios", "android", or "web"
  topics: string[],          // ["promotions", "messages"]
  isActive: boolean,
  lastUsedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### In-App Notification
```typescript
{
  id: UUID,
  userId: UUID,
  title: string,
  message: string,
  type: string,              // "payment", "message", "alert", etc.
  actionUrl?: string,        // Link to take action
  read: boolean,
  readAt?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔄 Complete Data Flow Example

**Scenario**: User makes a payment, and we need to notify them via all channels.

```
Payment Service
      ↓
      │ POST /api/v1/email/send-template
      │ (API Key auth)
      ▼
Email Controller → ApiKeyGuard → EmailService
      │
      ├─→ Validate template exists
      ├─→ Substitute variables in template
      └─→ Add job to Bull queue (Redis)
                  │
                  ▼
         Redis Queue (Email)
                  │
                  ▼
      EmailProcessor (picks up job)
                  │
                  ├─→ SendGridAdapter.send()
                  └─→ Mark job as completed/failed
                         │
                         ├─→ Success: Email sent
                         └─→ Failure: Retry 3x with backoff


Payment Service
      ↓
      │ POST /api/v1/push/send
      │ (API Key auth)
      ▼
Push Controller → ApiKeyGuard → PushService
      │
      ├─→ Fetch user's device tokens from DB
      ├─→ Filter active devices
      └─→ Add job to Bull queue (Redis)
                  │
                  ▼
         Redis Queue (Push)
                  │
                  ▼
      PushProcessor (picks up job)
                  │
                  ├─→ FirebaseAdapter.multicast()
                  └─→ Return success/failure count
                         │
                         ├─→ Success: On all devices
                         └─→ Partial: Retry on failed devices


Payment Service
      ↓
      │ POST /api/v1/notifications
      │ (API Key auth)
      ▼
Notifications Controller → ApiKeyGuard → NotificationsService
      │
      ├─→ Validate user exists
      └─→ Store in PostgreSQL
                  │
                  ▼
      Notification stored successfully
```

User later retrieves notifications:
```
Mobile App
      ↓
      │ GET /api/v1/notifications
      │ (JWT token auth)
      ▼
Notifications Controller → JwtAuthGuard
      │
      ├─→ Extract user ID from JWT
      ├─→ Query PostgreSQL for user's notifications
      └─→ Return paginated results
```

---

## 🎯 Endpoint Summary

### Email Endpoints
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/v1/email/send` | API Key | Queue raw email |
| POST | `/api/v1/email/send-template` | API Key | Queue templated email |
| POST | `/api/v1/email/send-batch` | API Key | Batch send emails |
| POST | `/api/v1/email/verify` | Public | Verify email (SMS code) |
| GET | `/api/v1/email/templates` | Public | List templates |

### Push Endpoints
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/v1/push/send` | API Key | Send push to user |
| POST | `/api/v1/push/subscribe` | JWT | Register device token |
| DELETE | `/api/v1/push/unsubscribe/:deviceId` | JWT | Unregister device |
| GET | `/api/v1/push/devices` | JWT | List user's devices |
| POST | `/api/v1/push/subscribe-topic` | JWT | Subscribe to topic |

### Notification Endpoints
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/v1/notifications` | API Key/JWT | Create notification |
| GET | `/api/v1/notifications` | JWT | List user's notifications |
| GET | `/api/v1/notifications/:id` | JWT | Get single notification |
| PATCH | `/api/v1/notifications/:id` | JWT | Mark as read |
| DELETE | `/api/v1/notifications/:id` | JWT | Delete notification |

### Template Endpoints
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/v1/templates` | Public | List all templates |
| GET | `/api/v1/templates/:id` | Public | Get template |
| POST | `/api/v1/templates` | API Key | Create template |
| PATCH | `/api/v1/templates/:id` | API Key | Update template |
| DELETE | `/api/v1/templates/:id` | API Key | Delete template |
| POST | `/api/v1/templates/:id/test` | Public | Test template |

---

## ⚙️ Internal Service Components

### 1. **Services** (Business Logic)

#### EmailService
- `sendEmailDirect()` - Immediate send via SendGrid
- `sendEmailQueued()` - Queue via Bull
- `sendTemplateEmail()` - Use predefined template
- `sendBatchEmails()` - Bulk operations

#### PushService
- `subscribeDevice()` - Register device token
- `unsubscribeDevice()` - Remove device
- `sendPushNotification()` - Send to user's devices
- `subscribeToTopic()` - Topic-based messaging
- `listUserDevices()` - Get user's registered devices

#### NotificationsService
- `createNotification()` - Create in-app notification
- `getUserNotifications()` - Fetch paginated list
- `getNotification()` - Get single
- `markAsRead()` - Mark one as read
- `markAllAsRead()` - Mark all as read
- `deleteNotification()` - Soft delete

#### TemplatesService
- `createTemplate()` - Create email template
- `getTemplate()` - Fetch template
- `listTemplates()` - List with pagination
- `updateTemplate()` - Modify template
- `deleteTemplate()` - Deactivate template
- `testTemplate()` - Send test email

### 2. **Adapters** (External Integrations)

#### SendGridAdapter
- Integrates with SendGrid API
- Handles email sending
- Error handling and retry logic
- Email verification support

#### FirebaseAdapter
- Integrates with Firebase Admin SDK
- Manages device subscriptions
- Topic-based push notifications
- Multicast to multiple devices

### 3. **Repositories** (Data Access)
- EmailTemplateRepository
- NotificationRepository
- DeviceTokenRepository

### 4. **Queue System** (Bull + Redis)

**Why Async Processing?**
- Email/push can be slow (external APIs)
- Don't block user requests
- Automatic retry on failure
- Better scalability

**Queue Jobs**:
```typescript
// Email job
{
  type: 'send-email',
  data: {
    to: 'user@example.com',
    subject: 'Welcome',
    body: '<h1>Welcome</h1>'
  }
}

// Push job
{
  type: 'send-push',
  data: {
    userId: 'user-123',
    title: 'New Message',
    body: 'You have a new message'
  }
}
```

**Processor**:
- Listens for jobs in queue
- Executes job (calls SendGrid/Firebase)
- Handles success/failure
- Retry with exponential backoff (1s, 2s, 4s, 8s)

---

## 🔍 Monitoring & Health Checks

### Health Endpoints
```http
GET /api/v1/health
Response: {"status": "ok", "timestamp": "..."}

GET /api/v1/ready
Response: {"ready": true, "services": {"db": true, "redis": true}}
```

### Metrics Available
- Email sent count
- Push notification sent count
- Queue job count
- Failed jobs count
- API latency

---

## 🚀 How to Integrate from Another Service

### Example: Auth Service Sending Verification Email

```typescript
// In Auth Service
import axios from 'axios';

async function sendVerificationEmail(email: string, code: string) {
  try {
    const response = await axios.post(
      'http://core-notification-service:8088/api/v1/email/send-template',
      {
        to: email,
        templateId: 'verification-email',
        variables: {
          verificationCode: code,
          expiresIn: '15 minutes'
        }
      },
      {
        headers: {
          'X-API-Key': process.env.NOTIFICATIONS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✓ Email queued: Job#${response.data.jobId}`);
  } catch (error) {
    console.error('✗ Failed to queue email:', error.message);
    throw error;
  }
}
```

### Example: Payments Service Creating In-App Notification

```typescript
// In Payments Service
async function notifyPaymentReceived(userId: string, amount: number) {
  const response = await axios.post(
    'http://core-notification-service:8088/api/v1/notifications',
    {
      userId,
      title: 'Payment Received',
      message: `Payment of $${amount} received successfully`,
      type: 'payment',
      actionUrl: `/payments/receipt/${orderId}`
    },
    {
      headers: {
        'X-API-Key': process.env.NOTIFICATIONS_API_KEY
      }
    }
  );
  
  return response.data; // Notification created
}
```

---

## 📋 Configuration

### Environment Variables
```bash
# Database
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=visiobook
DATABASE_PASSWORD=password
DATABASE_NAME=notifications_db

# Redis (for queue)
REDIS_HOST=redis
REDIS_PORT=6379

# SendGrid
SENDGRID_API_KEY=SG.xxx...
SENDGRID_FROM_EMAIL=noreply@visiobook.com

# Firebase
FIREBASE_PROJECT_ID=visiobook-prod
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# JWT (for user auth)
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h

# API Keys (for service auth)
VALID_API_KEYS=service-1-key,service-2-key,service-3-key

# Application
NODE_ENV=production
LOG_LEVEL=info
```

---

## 🔄 Request/Response Cycle Summary

1. **External Service** sends HTTP request with credentials (API Key or JWT)
2. **Guard Middleware** validates credentials
3. **Controller** receives and validates request DTO
4. **Service** implements business logic
5. **Repository/Adapter** interacts with database/external APIs
6. **Queue System** (optional) handles async processing
7. **Response** sent back to caller
8. **Processors** (background) complete async jobs

---

## 🎓 Key Takeaways

✅ **Notification Service** = Centralized hub for all notifications  
✅ **Async Processing** = Queue-based system for reliability  
✅ **Multiple Channels** = Email, Push, In-App in one place  
✅ **Secure** = API Key (service) + JWT (user) authentication  
✅ **Scalable** = Stateless, auto-scaling support  
✅ **Reliable** = Retry logic, error handling, health checks  
✅ **Easy to Integrate** = Simple HTTP API with clear contracts  

Other services just call HTTP endpoints and let this service handle the complexity!
