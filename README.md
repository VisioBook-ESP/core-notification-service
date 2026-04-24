# Core Notification Service

> 📧 Email • 🔔 Push Notifications • 📲 In-App Messages

A scalable microservice for managing all types of notifications in the VisioBook platform.

## 🎯 Features for Backend Services

### 📧 Email Notifications
- **SendGrid Integration** - Enterprise-grade email delivery
- **Template System** - 9+ pre-built templates with variable substitution
- **Batch Processing** - Send multiple emails efficiently
- **Retry Logic** - Automatic retries with exponential backoff
- **Duplicate Prevention** - Smart deduplication across requests
- **Queue Monitoring** - Real-time queue stats and health metrics

**Available Templates:**
- Email verification
- Password reset
- Welcome emails
- Payment receipts
- Account notifications
- And more...

### 🔔 Push Notifications
- **Firebase Cloud Messaging** - Multi-platform push support
- **iOS & Android** - Native app notifications
- **Web Push** - Browser notifications
- **Topic-based Broadcasting** - Send to groups of users/topics
- **Device Management** - Track & manage registered devices
- **Rich Notifications** - Custom data, images, and deep linking

### 📱 In-App Notifications
- **Database Storage** - Persistent notification history
- **Real-time Access** - Instant notification retrieval
- **Pagination** - Efficient handling of large notification lists
- **Read Status Tracking** - Track read/unread notifications
- **Deep Linking** - Action URLs for app navigation
- **Type System** - Categorized notifications (payment, message, alert, etc.)

### 🔐 Security & Reliability
- **API Key Authentication** - Service-to-service communication
- **JWT Support** - User-facing endpoints
- **Rate Limiting** - Prevent abuse and resource exhaustion
- **Error Handling** - Comprehensive error codes and messages
- **Async Processing** - Non-blocking notification sending
- **Health Checks** - Service availability monitoring

## 📦 System Architecture

```
┌──────────────────────────────────┐
│   External Services              │
│ (Auth, User, Payment, etc)       │
└────────────┬─────────────────────┘
             │ HTTP + API Key/JWT
             ▼
┌──────────────────────────────────┐
│ Core Notification Service        │
│ ┌────────────────────────────┐   │
│ │ Email │ Push │ In-App      │   │
│ │ Controllers                │   │
│ └────────┬─────────┬─────────┘   │
│          │         │              │
│          ▼         ▼              │
│ ┌─────────────────────────────┐  │
│ │ Bull Queue (Redis)          │  │
│ │ - Async Processing          │  │
│ │ - Retry with Backoff        │  │
│ │ - Job Monitoring            │  │
│ └─────┬───────────────────────┘  │
│       │                           │
│       ▼                           │
│ ┌─────────────────────────────┐  │
│ │ Adapters                    │  │
│ │ - SendGrid (Email)          │  │
│ │ - Firebase (Push)           │  │
│ │ - PostgreSQL (In-App)       │  │
│ └─────────────────────────────┘  │
└──────────────────────────────────┘
         │          │      │
         ▼          ▼      ▼
    SendGrid   Firebase  PostgreSQL
    (Email)    (Push)    (Storage)
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- SendGrid API Key
- Firebase Credentials

### Local Development

```bash
# Clone and install
git clone <repo>
cd core-notification-service
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start services
docker compose up

# Service runs on http://localhost:8088
```

### Environment Variables

```bash
# Server
NODE_ENV=development
PORT=8088
LOG_LEVEL=debug

# Database
DATABASE_HOST=postgres
DATABASE_PORT=5433
DATABASE_USER=visiobook
DATABASE_PASSWORD=visiobook_dev_password
DATABASE_NAME=notifications_db

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h

# SendGrid
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@visiobook.com

# Firebase
FIREBASE_PROJECT_ID=visiobook-xxx
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@visiobook-xxx.iam.gserviceaccount.com

# API Keys (comma-separated for service-to-service auth)
VALID_API_KEYS=service1-key,service2-key,service3-key
```

## 📚 API Reference

### Email Endpoints

**Send Email**
```bash
POST /api/v1/email/send
X-API-Key: your-api-key

{
  "to": "user@example.com",
  "subject": "Welcome!",
  "body": "<h1>Welcome to VisioBook</h1>",
  "priority": "high"
}
```

**Send Template Email**
```bash
POST /api/v1/email/send-template
X-API-Key: your-api-key

{
  "to": "user@example.com",
  "templateId": "verification-email",
  "variables": {
    "code": "123456",
    "expiresIn": "15 minutes"
  }
}
```

### Push Notification Endpoints

**Subscribe Device**
```bash
POST /api/v1/push/subscribe
Authorization: Bearer {jwt-token}

{
  "deviceId": "device-123",
  "platform": "ios",
  "token": "firebase-token-from-app"
}
```

**Send Push Notification**
```bash
POST /api/v1/push/send
X-API-Key: your-api-key

{
  "userId": "user-uuid",
  "title": "New Message",
  "body": "You have a new message",
  "data": {
    "messageId": "msg-123"
  }
}
```

### In-App Notifications

**Create Notification**
```bash
POST /api/v1/notifications
X-API-Key: your-api-key

{
  "userId": "user-uuid",
  "title": "Payment Received",
  "message": "Payment of $100 confirmed",
  "type": "payment",
  "actionUrl": "/payments/receipt/123"
}
```

**List User Notifications**
```bash
GET /api/v1/notifications?page=1&limit=20
Authorization: Bearer {jwt-token}
```

See [API Reference](./docs/api-reference.md) for complete endpoint documentation.

## 🔐 Authentication

### Service-to-Service (API Key)
For backend services sending notifications:

```bash
curl -X POST http://localhost:8088/api/v1/email/send \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### User-Facing (JWT)
For user mobile/web apps:

```bash
curl -X GET http://localhost:8088/api/v1/notifications \
  -H "Authorization: Bearer your-jwt-token"
```

## 🔗 Backend Service Integration Guide

**👉 START HERE for integrating this service into your backend:**

### Step 1: Quick Overview (5 min)
- Read [API Quick Reference](./docs/API_QUICK_REFERENCE.md) - Endpoint cheatsheet
- Skim [Documentation Complete](./docs/DOCUMENTATION_COMPLETE.md) - What's available

### Step 2: Integration Setup (30 min)
- Follow [Service Integration Checklist](./docs/SERVICE_INTEGRATION_CHECKLIST.md) - Step-by-step
- Get your API Key from DevOps
- Copy code from [Integration Guide](./docs/integration-guide.md) - Node.js, Python, Go examples

### Step 3: Implementation (1-2 hours)
- Find your use case in [Common Patterns](./docs/COMMON_INTEGRATION_PATTERNS.md) - Real-world examples:
  - User registration with email verification
  - Payment confirmation notifications
  - Batch newsletter sending
  - Real-time messaging
  - Admin announcements
  - And more...
- Test each notification type (email, push, in-app)

### Step 4: Troubleshooting & Production
- If issues: Check [Troubleshooting Integration](./docs/TROUBLESHOOTING_INTEGRATION.md) - 20+ solutions
- Deploy to production with confidence
- Monitor queue stats: `/email/queue/stats` and `/push/queue/stats`

## �📱 Client Integration

### Web App
See [Web Integration Guide](./docs/web-integration.md)

### iOS App
See [iOS Integration Guide](./docs/ios-integration.md)

### Android App
See [Android Integration Guide](./docs/android-integration.md)

## 🛠 Deployment

See [Deployment Guide](./docs/deployment-guide.md) for production deployment instructions.

## 📖 Documentation

### 🚀 Getting Started
- [API Quick Reference](./docs/API_QUICK_REFERENCE.md) - Quick endpoint lookup
- [Service Integration Checklist](./docs/SERVICE_INTEGRATION_CHECKLIST.md) - Checklist for backend services
- [Integration Guide](./docs/integration-guide.md) - Code examples and implementation guide
- [Common Integration Patterns](./docs/COMMON_INTEGRATION_PATTERNS.md) - Real-world usage patterns

### 📋 Reference
- [Architecture Guide](./docs/ARCHITECTURE_GUIDE.md) - System design and flows
- [API Reference](./docs/api-reference.md) - Complete endpoint documentation
- [Authentication](./docs/authentication.md) - Auth strategies and guards
- [Database Schema](./docs/DATABASE.md) - Database entities and migrations

### 🛠 Operations
- [Deployment Guide](./docs/deployment-guide.md) - Production deployment instructions
- [Troubleshooting](./docs/troubleshooting.md) - Service troubleshooting
- [Troubleshooting Integration](./docs/TROUBLESHOOTING_INTEGRATION.md) - Integration issues
- [Testing Guide](./docs/testing.md) - Running tests

### 📱 Client Integration
- [iOS Integration](./docs/ios-integration.md) - iOS app integration
- [Android Integration](./docs/android-integration.md) - Android app integration

## 🧪 Health Check

```bash
curl http://localhost:8088/api/v1/health

# Response
{
  "status": "ok",
  "timestamp": "2026-04-23T13:49:57.295Z",
  "service": "core-notification-service"
}
```

## 📊 Monitoring

### Queue Statistics
```bash
curl http://localhost:8088/api/v1/email/queue/stats
curl http://localhost:8088/api/v1/push/queue/stats
```

### Database Health
Service includes automatic PostgreSQL and Redis health checks in Docker.

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 License

Private - VisioBook Project
