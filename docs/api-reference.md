# API Reference - Core Notification Service

## Base URL

```
Production:  https://notifications-api.visiobook.com/api/v1
Development: http://localhost:8088/api/v1
```

## Authentication

Two authentication methods:

1. **API Key** (Service-to-Service)
   ```bash
   X-API-Key: your-api-key
   ```

2. **JWT Bearer Token** (User/Client)
   ```bash
   Authorization: Bearer your-jwt-token
   ```

---

## Email Module

### POST /email/send

Queue an email to be sent immediately.

**Authentication:** API Key

**Request:**
```json
{
  "to": "user@example.com",
  "subject": "Welcome to VisioBook",
  "body": "<h1>Welcome</h1><p>Your account is ready.</p>",
  "priority": "high"
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "email-job-12345",
  "status": "queued",
  "timestamp": "2026-04-23T13:49:57.295Z",
  "estimatedDeliveryTime": "2026-04-23T13:50:57.295Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid email or body
- `401 Unauthorized` - Missing/invalid API key
- `500 Internal Server Error` - Queue error

---

### POST /email/send-template

Queue a templated email with variable substitution.

**Authentication:** API Key

**Request:**
```json
{
  "to": "user@example.com",
  "templateId": "verification-email",
  "variables": {
    "verificationCode": "123456",
    "expiresIn": "15 minutes",
    "userName": "John Doe"
  }
}
```

**Available Templates:**
- `verification-email` - Email verification code
- `password-reset` - Password reset link
- `welcome-email` - New user welcome
- `order-confirmation` - Purchase confirmation
- `payment-receipt` - Transaction receipt
- `account-suspended` - Account suspension notice
- `payment-failed` - Payment failure notice

**Response (202 Accepted):**
```json
{
  "jobId": "email-job-12346",
  "status": "queued",
  "templateId": "verification-email",
  "timestamp": "2026-04-23T13:49:57.295Z"
}
```

---

### POST /email/send-batch

Queue multiple emails in one request.

**Authentication:** API Key

**Request:**
```json
{
  "emails": [
    {
      "to": "user1@example.com",
      "subject": "Newsletter",
      "body": "<h1>This Month's Updates</h1>"
    },
    {
      "to": "user2@example.com",
      "subject": "Newsletter",
      "body": "<h1>This Month's Updates</h1>"
    }
  ]
}
```

**Response (202 Accepted):**
```json
{
  "jobIds": ["email-job-12347", "email-job-12348"],
  "total": 2,
  "status": "queued",
  "timestamp": "2026-04-23T13:49:57.295Z"
}
```

---

### GET /email/templates

List all available email templates (public).

**Request:**
```bash
GET /email/templates
```

**Response (200 OK):**
```json
{
  "templates": [
    {
      "id": "template-uuid-1",
      "templateId": "verification-email",
      "name": "Email Verification",
      "subject": "Verify your email address",
      "variables": ["verificationCode", "expiresIn"],
      "isActive": true
    },
    {
      "id": "template-uuid-2",
      "templateId": "password-reset",
      "name": "Password Reset",
      "subject": "Reset your password",
      "variables": ["resetLink", "expiresIn"],
      "isActive": true
    }
  ],
  "total": 2
}
```

---

### GET /email/queue/stats

Get email queue statistics (public).

**Request:**
```bash
GET /email/queue/stats
```

**Response (200 OK):**
```json
{
  "pending": 5,
  "active": 2,
  "completed": 1234,
  "failed": 3,
  "averageProcessingTime": 2500,
  "failureRate": 0.0024
}
```

---

## Push Notification Module

### POST /push/subscribe

Register a device for push notifications.

**Authentication:** JWT Bearer Token

**Request:**
```json
{
  "deviceId": "device-unique-id-123",
  "platform": "ios",
  "token": "firebase-device-token-from-app"
}
```

**Platform Values:** `ios`, `android`, `web`

**Response (201 Created):**
```json
{
  "id": "device-record-uuid",
  "deviceId": "device-unique-id-123",
  "platform": "ios",
  "active": true,
  "createdAt": "2026-04-23T13:49:57.295Z"
}
```

---

### DELETE /push/unsubscribe/:deviceId

Unregister a device from push notifications.

**Authentication:** JWT Bearer Token

**Request:**
```bash
DELETE /push/unsubscribe/device-unique-id-123
```

**Response (204 No Content)**

---

### GET /push/devices

List all registered devices for authenticated user.

**Authentication:** JWT Bearer Token

**Request:**
```bash
GET /push/devices
```

**Response (200 OK):**
```json
{
  "devices": [
    {
      "id": "device-record-uuid-1",
      "deviceId": "iphone-13-pro",
      "platform": "ios",
      "active": true,
      "lastUsedAt": "2026-04-23T13:49:57.295Z",
      "createdAt": "2026-04-20T10:00:00.000Z"
    },
    {
      "id": "device-record-uuid-2",
      "deviceId": "pixel-6",
      "platform": "android",
      "active": true,
      "lastUsedAt": "2026-04-23T12:00:00.000Z",
      "createdAt": "2026-04-15T15:30:00.000Z"
    }
  ],
  "total": 2
}
```

---

### POST /push/send

Queue a push notification to a user.

**Authentication:** API Key

**Request:**
```json
{
  "userId": "user-uuid-123",
  "title": "New Message",
  "body": "You have a new message from John",
  "data": {
    "messageId": "msg-456",
    "senderId": "user-789",
    "conversationId": "conv-111"
  },
  "imageUrl": "https://example.com/image.jpg"
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "push-job-789",
  "status": "queued",
  "devicesCount": 2,
  "timestamp": "2026-04-23T13:49:57.295Z"
}
```

**Note:** Notification is sent to ALL active devices registered by the user.

---

### POST /push/topic/subscribe

Subscribe devices to a topic (topic-based messaging).

**Authentication:** API Key

**Request:**
```json
{
  "topic": "breaking-news",
  "deviceTokens": [
    "firebase-token-1",
    "firebase-token-2",
    "firebase-token-3"
  ]
}
```

**Response (201 Created):**
```json
{
  "topic": "breaking-news",
  "subscribedCount": 3,
  "timestamp": "2026-04-23T13:49:57.295Z"
}
```

---

### POST /push/topic/send

Send a push notification to all devices subscribed to a topic.

**Authentication:** API Key

**Request:**
```json
{
  "topic": "breaking-news",
  "title": "Breaking News",
  "body": "Major announcement from VisioBook",
  "data": {
    "newsId": "news-123",
    "priority": "high"
  }
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "push-topic-job-123",
  "status": "queued",
  "topic": "breaking-news",
  "estimatedRecipients": 5000,
  "timestamp": "2026-04-23T13:49:57.295Z"
}
```

---

### GET /push/queue/stats

Get push notification queue statistics.

**Authentication:** API Key

**Request:**
```bash
GET /push/queue/stats
```

**Response (200 OK):**
```json
{
  "pending": 12,
  "active": 3,
  "completed": 5600,
  "failed": 8,
  "averageProcessingTime": 1200,
  "failureRate": 0.0014,
  "totalDevices": 8942
}
```

---

## In-App Notifications Module

### POST /notifications

Create an in-app notification for a user.

**Authentication:** API Key

**Request:**
```json
{
  "userId": "user-uuid-123",
  "title": "Payment Received",
  "message": "Payment of $100 received successfully",
  "type": "payment",
  "actionUrl": "/payments/receipt/123",
  "data": {
    "amount": "100",
    "currency": "USD"
  }
}
```

**Notification Types:** `payment`, `message`, `alert`, `update`, `promotion`, `system`

**Response (201 Created):**
```json
{
  "id": "notification-uuid-123",
  "userId": "user-uuid-123",
  "title": "Payment Received",
  "message": "Payment of $100 received successfully",
  "type": "payment",
  "read": false,
  "createdAt": "2026-04-23T13:49:57.295Z"
}
```

---

### GET /notifications

List in-app notifications for authenticated user.

**Authentication:** JWT Bearer Token

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `type` - Filter by type (optional)
- `read` - Filter by read status (optional: true/false)

**Request:**
```bash
GET /notifications?page=1&limit=20&read=false
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "notification-uuid-1",
      "title": "Payment Received",
      "message": "Payment of $100 confirmed",
      "type": "payment",
      "read": false,
      "actionUrl": "/payments/receipt/123",
      "createdAt": "2026-04-23T13:49:57.295Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### GET /notifications/unread/count

Get count of unread notifications.

**Authentication:** JWT Bearer Token

**Request:**
```bash
GET /notifications/unread/count
```

**Response (200 OK):**
```json
{
  "unreadCount": 3
}
```

---

### PATCH /notifications/:id/read

Mark a notification as read.

**Authentication:** JWT Bearer Token

**Request:**
```bash
PATCH /notifications/notification-uuid-123/read
```

**Response (200 OK):**
```json
{
  "id": "notification-uuid-123",
  "read": true,
  "readAt": "2026-04-23T13:50:00.000Z"
}
```

---

### PATCH /notifications/read-all

Mark all notifications as read.

**Authentication:** JWT Bearer Token

**Request:**
```bash
PATCH /notifications/read-all
```

**Response (200 OK):**
```json
{
  "markedAsRead": 5,
  "timestamp": "2026-04-23T13:50:00.000Z"
}
```

---

### DELETE /notifications/:id

Delete a notification.

**Authentication:** JWT Bearer Token

**Request:**
```bash
DELETE /notifications/notification-uuid-123
```

**Response (204 No Content)**

---

## Health & Status

### GET /health

Health check endpoint (public).

**Request:**
```bash
GET /health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-04-23T13:49:57.295Z",
  "service": "core-notification-service"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Invalid email address",
  "code": "INVALID_EMAIL",
  "timestamp": "2026-04-23T13:49:57.295Z",
  "path": "/api/v1/email/send"
}
```

**Common Status Codes:**
- `200 OK` - Successful GET request
- `201 Created` - Resource created
- `202 Accepted` - Async job queued
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing/invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limited
- `500 Internal Server Error` - Server error
