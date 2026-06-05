# Core Notification Service

> 📧 Email • 🔔 Push Notifications • 📲 In-App Messages • 📡 NATS Event-Driven

A scalable microservice for managing all types of notifications in the VisioBook platform.
Other services trigger notifications by **publishing NATS events** — no HTTP calls needed.

## 🎯 Features

### 📧 Email Notifications
- **SendGrid Integration** - Enterprise-grade email delivery
- **Template System** - Pre-built templates with variable substitution
- **Batch Processing** - Send multiple emails efficiently
- **Retry Logic** - Automatic retries with exponential backoff
- **Queue Monitoring** - Real-time queue stats and health metrics

**Available Templates:**
- `email_verification` — Email verification code
- `password_reset` — Password reset link
- `welcome` — New user welcome
- `generation_complete` — Content generation ready
- `generation_failed` — Generation failure notice
- `payment_confirmation` — Payment receipt
- `subscription_cancelled` — Subscription cancellation

### 🔔 Push Notifications
- **Firebase Cloud Messaging** - Multi-platform push support (iOS, Android, Web)
- **Topic-based Broadcasting** - Send to groups of users
- **Device Management** - Track & manage registered tokens
- **Rich Notifications** - Custom data, images, and deep linking

### 📲 In-App Notifications
- **Database Storage** - Persistent notification history
- **Read Status Tracking** - Track read/unread per user
- **Pagination** - Efficient handling of large lists
- **Typed notifications** - `generation_complete`, `generation_failed`, `share_received`, `payment_confirmed`, `system_announcement`

### 📡 NATS Event Listener
- **Event-driven** — subscribes to events published by other VisioBook services
- **Queue group** `notifications` — safe for horizontal scaling (each event delivered once)
- **Generic subjects** — any service can request email, push, or in-app directly
- **Domain subjects** — reacts automatically to business events (payment, generation, etc.)

### 🔐 Security & Reliability
- **JWT** — user-facing endpoints (reading, marking as read, device registration)
- **API Key** — direct HTTP fallback for service-to-service calls
- **Async Processing** — Bull + Redis queue for non-blocking delivery
- **Health Checks** — PostgreSQL, Redis, and HTTP liveness probes

## 📦 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                  Other VisioBook Services                     │
│        (core-user-service, core-payment-service, …)          │
└───────────────────────────┬──────────────────────────────────┘
                            │ publish NATS events
                            ▼
                   ┌─────────────────┐
                   │   NATS Server   │  nats://nats:4222
                   └────────┬────────┘
                            │ subscribe (queue group: notifications)
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                Core Notification Service                      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  NATS Controller  (@EventPattern handlers)           │    │
│  │  Generic: send.email · send.push · create.in_app     │    │
│  │  Domain:  payment.confirmed · generation.completed   │    │
│  │           generation.failed · content.shared         │    │
│  │           user.registered · user.password_reset…     │    │
│  └────────────────────────┬─────────────────────────────┘    │
│                           │                                   │
│  ┌────────────────────────▼─────────────────────────────┐    │
│  │  Services: EmailService · PushService · Notifications │    │
│  └────────────────────────┬─────────────────────────────┘    │
│                           │                                   │
│  ┌────────────────────────▼─────────────────────────────┐    │
│  │  Bull Queue (Redis) — async, retry with backoff       │    │
│  └────────────────────────┬─────────────────────────────┘    │
│                           │                                   │
│  ┌────────────────────────▼─────────────────────────────┐    │
│  │  Adapters: SendGrid · Firebase · PostgreSQL           │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  HTTP (still available)                                       │
│  ├── JWT  → GET/PATCH/DELETE /notifications, /push/subscribe  │
│  └── API Key → POST /email/send, /push/send, /notifications   │
└──────────────────────────────────────────────────────────────┘
```

## 📡 NATS Integration

### How other services publish events

Install the `nats` package in the publishing service, then:

```typescript
// NestJS example — inject ClientProxy configured with Transport.NATS
this.natsClient.emit('payment.confirmed', {
  userId: 'uuid',
  userEmail: 'user@example.com',
  amount: 29.99,
  currency: 'EUR',
  paymentId: 'pay-xxx',
});
```

### Subjects reference

#### Generic (direct notification request)

| Subject | Payload |
|---------|---------|
| `notifications.send.email` | `{ to, subject, body, attachments? }` |
| `notifications.send.template_email` | `{ to, templateId, data }` |
| `notifications.send.push` | `{ userId, title, body, data?, imageUrl? }` |
| `notifications.create.in_app` | `{ userId, type, title, body, data? }` |

#### Domain events (VisioBook business events)

| Subject | Payload | Triggers |
|---------|---------|----------|
| `user.registered` | `{ userId, email, name, verificationToken? }` | Verification email |
| `user.password_reset_requested` | `{ userId, email, resetToken }` | Reset email |
| `payment.confirmed` | `{ userId, userEmail, amount, currency, paymentId }` | Receipt email + push + in-app |
| `generation.completed` | `{ userId, userEmail, generationId, title }` | Email + push + in-app |
| `generation.failed` | `{ userId, generationId, reason? }` | Push + in-app |
| `content.shared` | `{ userId, sharedByName, contentId }` | Push + in-app |

All subject constants are in [src/modules/nats/nats.events.ts](./src/modules/nats/nats.events.ts).

### Testing NATS locally

```bash
# Fire a test event (uses the nats npm package, no extra tools needed)
node scripts/test-nats.mjs

# See all available test subjects
# Then fire one:
node scripts/test-nats.mjs payment.confirmed
node scripts/test-nats.mjs notifications.send.email
node scripts/test-nats.mjs generation.completed
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- SendGrid API Key
- Firebase Credentials

### Local Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Configure environment
cp .env.example .env
# Fill in SENDGRID_API_KEY, Firebase credentials, JWT_SECRET

# Start everything (NATS + Postgres + Redis + service)
docker compose up --build

# Service: http://localhost:8088
# NATS:    nats://localhost:4222  (monitoring: http://localhost:8222)
```

### Environment Variables

```bash
# Server
NODE_ENV=development
PORT=8088
LOG_LEVEL=debug

# Database
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=visiobook
DATABASE_PASSWORD=visiobook_dev_password
DATABASE_NAME=notifications_db

# Redis (Bull queue)
REDIS_HOST=redis
REDIS_PORT=6379

# NATS
NATS_URL=nats://nats:4222

# JWT (user-facing endpoints)
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h

# SendGrid
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@visiobook.com

# Firebase
FIREBASE_PROJECT_ID=visiobook-xxx
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@visiobook-xxx.iam.gserviceaccount.com

# API Keys (comma-separated, for direct HTTP fallback)
VALID_API_KEYS=service1-key,service2-key
```

## 📚 HTTP API Reference

HTTP endpoints remain available as a fallback or for direct calls.

### Email

```bash
POST /api/v1/email/send              # X-API-Key — queue raw email
POST /api/v1/email/send-template     # X-API-Key — queue template email
POST /api/v1/email/send-batch        # X-API-Key — queue batch emails
GET  /api/v1/email/queue/stats       # queue statistics
GET  /api/v1/email/templates         # list templates
```

### Push Notifications

```bash
POST   /api/v1/push/subscribe              # Bearer JWT — register device token
DELETE /api/v1/push/unsubscribe/:deviceId  # Bearer JWT — remove device
GET    /api/v1/push/devices                # Bearer JWT — list user devices
POST   /api/v1/push/send                   # X-API-Key — send push to user
POST   /api/v1/push/topic/send             # X-API-Key — broadcast to topic
```

### In-App Notifications

```bash
GET    /api/v1/notifications           # Bearer JWT — list user notifications
GET    /api/v1/notifications/:id       # Bearer JWT — get single
PATCH  /api/v1/notifications/:id/read  # Bearer JWT — mark as read
PATCH  /api/v1/notifications/read-all  # Bearer JWT — mark all as read
DELETE /api/v1/notifications/:id       # Bearer JWT — delete
GET    /api/v1/notifications/unread/count  # Bearer JWT — unread count
POST   /api/v1/notifications           # X-API-Key — create (service only)
```

See [docs/api-reference.md](./docs/api-reference.md) for full request/response schemas.

## 🔗 Backend Service Integration

### Recommended: NATS (event-driven)

1. Configure a NATS client in your service pointing to the shared NATS server
2. Publish events using the subjects from the [table above](#subjects-reference)
3. No API key or HTTP call needed

### Fallback: HTTP + API Key

```bash
curl -X POST http://core-notification-service:8088/api/v1/email/send \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{ "to": "user@example.com", "subject": "Hello", "body": "<p>Hi</p>" }'
```

See [docs/COMMON_INTEGRATION_PATTERNS.md](./docs/COMMON_INTEGRATION_PATTERNS.md) for real-world examples.

## 🧪 Health Check

```bash
curl http://localhost:8088/api/v1/health
# { "status": "ok", "timestamp": "...", "service": "core-notification-service" }
```

## 📊 Monitoring

```bash
# Queue stats
curl http://localhost:8088/api/v1/email/queue/stats
curl http://localhost:8088/api/v1/push/queue/stats

# NATS monitoring (JetStream HTTP)
curl http://localhost:8222/varz
```

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [Architecture Guide](./docs/ARCHITECTURE_GUIDE.md) | System design & flows |
| [API Reference](./docs/api-reference.md) | Complete endpoint docs |
| [Common Integration Patterns](./docs/COMMON_INTEGRATION_PATTERNS.md) | Real-world usage examples |
| [Authentication](./docs/authentication.md) | Auth strategies |
| [Database Schema](./docs/DATABASE.md) | Entities & migrations |
| [Deployment Guide](./docs/deployment-guide.md) | Production setup |
| [Testing Guide](./docs/testing.md) | Running tests |
| [iOS Integration](./docs/ios-integration.md) | iOS push setup |
| [Android Integration](./docs/android-integration.md) | Android push setup |

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 License

Private — VisioBook Project
