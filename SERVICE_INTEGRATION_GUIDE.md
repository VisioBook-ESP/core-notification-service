# Core Notification Service - Backend Service Integration Guide

**Status:** ✅ Complete & Production Ready  
**Last Updated:** April 23, 2026

## 🚀 Quick Start (Choose Your Path)

### ⚡ I have 5 minutes
Read: **[API_QUICK_REFERENCE.md](./docs/API_QUICK_REFERENCE.md)**
- Quick endpoint lookup
- Common status codes
- Example requests/responses

### ⏱ I have 30 minutes
1. Read: **[API_QUICK_REFERENCE.md](./docs/API_QUICK_REFERENCE.md)** (10 min)
2. Follow: **[SERVICE_INTEGRATION_CHECKLIST.md](./docs/SERVICE_INTEGRATION_CHECKLIST.md)** (20 min)

### ⏲ I have 1-2 hours (Full Integration)
1. Read: **[API_QUICK_REFERENCE.md](./docs/API_QUICK_REFERENCE.md)** (10 min)
2. Follow: **[SERVICE_INTEGRATION_CHECKLIST.md](./docs/SERVICE_INTEGRATION_CHECKLIST.md)** (20 min)
3. Find your use case: **[COMMON_INTEGRATION_PATTERNS.md](./docs/COMMON_INTEGRATION_PATTERNS.md)** (30 min)
4. Implement & test (30-60 min)

### 🆘 I'm having issues (20 minutes)
Check: **[TROUBLESHOOTING_INTEGRATION.md](./docs/TROUBLESHOOTING_INTEGRATION.md)**
- Find your error
- Follow solution steps
- Get help resources

---

## 📚 Documentation Files

### 🎯 For Backend Services (Use These!)

| Document | Purpose | Best For |
|----------|---------|----------|
| [API_QUICK_REFERENCE.md](./docs/API_QUICK_REFERENCE.md) | Endpoint cheatsheet | Quick lookup |
| [SERVICE_INTEGRATION_CHECKLIST.md](./docs/SERVICE_INTEGRATION_CHECKLIST.md) | Step-by-step integration | New integrations |
| [COMMON_INTEGRATION_PATTERNS.md](./docs/COMMON_INTEGRATION_PATTERNS.md) | Real-world examples (8 patterns) | Finding your use case |
| [TROUBLESHOOTING_INTEGRATION.md](./docs/TROUBLESHOOTING_INTEGRATION.md) | Common issues & solutions | Debugging problems |

### 📖 For Complete Reference

| Document | Content |
|----------|---------|
| [api-reference.md](./docs/api-reference.md) | Complete API documentation |
| [integration-guide.md](./docs/integration-guide.md) | Code examples (Node.js, Python, Go) |
| [ARCHITECTURE_GUIDE.md](./docs/ARCHITECTURE_GUIDE.md) | System design & flows |
| [authentication.md](./docs/authentication.md) | Auth strategies in detail |

### 🛠 For Operations

| Document | Content |
|----------|---------|
| [deployment-guide.md](./docs/deployment-guide.md) | Production setup |
| [DATABASE.md](./docs/DATABASE.md) | Database schema |
| [testing.md](./docs/testing.md) | Testing guide |

### 📱 For Mobile Integration

| Document | Content |
|----------|---------|
| [ios-integration.md](./docs/ios-integration.md) | iOS app setup |
| [android-integration.md](./docs/android-integration.md) | Android app setup |

---

## 🎯 What You Can Do

### ✉️ Send Emails
- **Custom emails** - Plain HTML
- **Template emails** - 9+ pre-built templates with variables
- **Batch emails** - Multiple recipients in one request
- **Examples:** Node.js, Python, Go

### 🔔 Send Push Notifications
- **To individual users** - Across all their devices
- **To topic subscribers** - Broadcast to groups
- **Rich notifications** - With images, custom data, deep links
- **Examples:** Node.js, Python, Go

### 📱 Create In-App Notifications
- **Store notifications** - In database for history
- **Track read status** - Know which ones users saw
- **Deep linking** - Take users to relevant screens
- **Categorized** - 6 notification types

---

## 🔑 Key Features

### Reliability
- ✅ Automatic retries with exponential backoff
- ✅ Queue-based async processing
- ✅ Real-time queue monitoring
- ✅ Error tracking & logging

### Performance
- ✅ Batch API for bulk operations
- ✅ Template system for consistency
- ✅ Async non-blocking sending
- ✅ Connection pooling

### Security
- ✅ API Key authentication (service-to-service)
- ✅ JWT authentication (user endpoints)
- ✅ HTTPS/TLS encryption
- ✅ Rate limiting

### Scalability
- ✅ Multi-threaded processing
- ✅ Redis-backed queuing
- ✅ PostgreSQL storage
- ✅ Horizontal scaling ready

---

## 📊 Use Cases Covered

1. **User Registration** - Email verification + welcome notification
2. **Payment Confirmation** - Email + push + in-app (multi-channel)
3. **Batch Newsletters** - Send to thousands efficiently
4. **Real-Time Messaging** - Instant push + in-app notifications
5. **Admin Announcements** - Topic-based broadcast
6. **Scheduled Reminders** - Time-based automation
7. **Error Handling** - Retry logic & deduplication
8. **Monitoring** - Queue stats & health checks

See **[COMMON_INTEGRATION_PATTERNS.md](./docs/COMMON_INTEGRATION_PATTERNS.md)** for complete examples.

---

## 🚦 Authentication

### For Sending Notifications (Service-to-Service)
```bash
X-API-Key: your-service-api-key
```

### For User Endpoints (Mobile Apps)
```bash
Authorization: Bearer your-jwt-token
```

See **[SERVICE_INTEGRATION_CHECKLIST.md](./docs/SERVICE_INTEGRATION_CHECKLIST.md)** for setup.

---

## 🔗 Getting Your API Key

1. Ask DevOps/Platform team for your service's API key
2. Store in `.env`:
   ```bash
   NOTIFICATIONS_SERVICE_URL=https://notifications-api.visiobook.com
   NOTIFICATIONS_API_KEY=your-api-key
   ```
3. Test with curl or code
4. You're ready! ✅

---

## 💻 Code Examples

### Node.js/TypeScript
```typescript
const notificationsAPI = axios.create({
  baseURL: process.env.NOTIFICATIONS_SERVICE_URL,
  headers: { 'X-API-Key': process.env.NOTIFICATIONS_API_KEY }
});

// Send email
await notificationsAPI.post('/email/send', {
  to: 'user@example.com',
  subject: 'Hello',
  body: '<h1>Welcome</h1>'
});

// Send push
await notificationsAPI.post('/push/send', {
  userId: 'user-123',
  title: 'New Message',
  body: 'You have a message'
});

// Create in-app notification
await notificationsAPI.post('/notifications', {
  userId: 'user-123',
  title: 'Payment',
  message: 'Payment received',
  type: 'payment'
});
```

See **[integration-guide.md](./docs/integration-guide.md)** for Python & Go examples.

---

## ✅ Integration Checklist

- [ ] Get API key from DevOps
- [ ] Store credentials in `.env`
- [ ] Test authentication with health endpoint
- [ ] Send test email
- [ ] Send test push notification
- [ ] Create test in-app notification
- [ ] Implement error handling
- [ ] Add retry logic
- [ ] Monitor queue stats
- [ ] Deploy to production

See **[SERVICE_INTEGRATION_CHECKLIST.md](./docs/SERVICE_INTEGRATION_CHECKLIST.md)** for detailed checklist.

---

## 🆘 Need Help?

### Common Issues
- **404 Not Found:** Check endpoint is correct
- **401 Unauthorized:** Check API key in header
- **429 Too Many Requests:** Implement retry logic
- **500 Server Error:** Check service status

See **[TROUBLESHOOTING_INTEGRATION.md](./docs/TROUBLESHOOTING_INTEGRATION.md)** for 15+ solutions.

### Getting Support
- 📖 Check documentation first
- 💬 Ask in #notifications Slack
- 📧 Email: notifications-support@visiobook.com
- 🐛 Report bugs in repository

---

## 📈 Monitoring

### Check Service Health
```bash
GET /health
# Response: { status: "ok", service: "core-notification-service" }
```

### Monitor Queues
```bash
GET /email/queue/stats
GET /push/queue/stats
# Response: { pending, active, completed, failed, failureRate }
```

Set up alerts if:
- Failure rate > 1%
- Queue backlog growing
- Processing time increasing

---

## 🎓 Real-World Patterns

### Pattern 1: User Signup
1. Send verification email
2. Create welcome in-app notification
3. Store verification code for later check

### Pattern 2: Payment Received
1. Send email receipt
2. Send push to all user devices
3. Create in-app payment notification

### Pattern 3: Broadcast Announcement
1. Send to all topic subscribers
2. Create in-app system notification
3. Monitor delivery stats

### Pattern 4: Retry Failed Notifications
1. Catch notification errors
2. Queue for retry with backoff
3. Log failed attempts
4. Alert if repeated failures

See **[COMMON_INTEGRATION_PATTERNS.md](./docs/COMMON_INTEGRATION_PATTERNS.md)** for 8 complete patterns with code.

---

## 🔐 Best Practices

### ✅ Do
- Use batch API for multiple notifications
- Use templates for consistent formatting
- Implement retry logic with backoff
- Monitor queue stats regularly
- Store API key in environment variables
- Send notifications asynchronously
- Track notification IDs for debugging
- Respect user notification preferences

### ❌ Don't
- Send notifications synchronously in requests
- Hardcode API keys in code
- Store API keys in git
- Ignore rate limits
- Skip error handling
- Send duplicate notifications
- Overwhelm users with too many notifications
- Forget to test before production

---

## 📞 Contact & Resources

| Need | Resource |
|------|----------|
| Quick lookup | [API_QUICK_REFERENCE.md](./docs/API_QUICK_REFERENCE.md) |
| Integration help | [SERVICE_INTEGRATION_CHECKLIST.md](./docs/SERVICE_INTEGRATION_CHECKLIST.md) |
| Code examples | [COMMON_INTEGRATION_PATTERNS.md](./docs/COMMON_INTEGRATION_PATTERNS.md) |
| Problem solving | [TROUBLESHOOTING_INTEGRATION.md](./docs/TROUBLESHOOTING_INTEGRATION.md) |
| Complete API | [api-reference.md](./docs/api-reference.md) |
| Slack support | #notifications channel |
| Email support | notifications-support@visiobook.com |

---

## 🎉 Ready?

1. **Choose your path** - Pick above (5 min, 30 min, or 1-2 hours)
2. **Get your API key** - Ask DevOps
3. **Follow the docs** - Checklist guides you
4. **Implement** - Copy examples, test, deploy
5. **Success!** ✅

**Let's go!** 🚀

---

**Service:** Core Notification Service  
**Version:** 1.0.0  
**Status:** Production Ready ✅  
**Last Updated:** April 23, 2026
