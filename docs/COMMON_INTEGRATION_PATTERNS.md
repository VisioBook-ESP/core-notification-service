# Common Integration Patterns

Real-world examples of how to integrate notifications into your service.

## 1. User Registration Flow

When a user signs up, send verification email and welcome in-app notification.

```typescript
// user-service/users.controller.ts
import axios from 'axios';

const notificationsAPI = axios.create({
  baseURL: process.env.NOTIFICATIONS_SERVICE_URL,
  headers: {
    'X-API-Key': process.env.NOTIFICATIONS_API_KEY,
    'Content-Type': 'application/json'
  }
});

@Post('/register')
async register(@Body() dto: CreateUserDto) {
  // 1. Create user in database
  const user = await this.usersService.create(dto);
  
  // 2. Generate verification code
  const verificationCode = generateCode(6);
  await this.cacheService.set(
    `verify:${user.id}`,
    verificationCode,
    3600 // 1 hour expiry
  );
  
  // 3. Send verification email
  try {
    await notificationsAPI.post('/email/send-template', {
      to: user.email,
      templateId: 'verification-email',
      variables: {
        userName: user.name,
        verificationCode: verificationCode,
        expiresIn: '1 hour'
      }
    });
  } catch (error) {
    console.error('Email send failed:', error);
    // Don't fail registration if email fails
    // Log for manual follow-up
  }
  
  // 4. Create in-app notification
  try {
    await notificationsAPI.post('/notifications', {
      userId: user.id,
      title: 'Welcome to VisioBook!',
      message: `Hello ${user.name}, verify your email to get started`,
      type: 'system',
      actionUrl: '/verify-email'
    });
  } catch (error) {
    console.error('In-app notification failed:', error);
  }
  
  return {
    id: user.id,
    email: user.email,
    message: 'Verification email sent'
  };
}

@Post('/verify-email')
async verifyEmail(
  @Body() dto: VerifyEmailDto,
  @Req() req: Request
) {
  const userId = req.user.id;
  
  // 1. Verify code
  const cached = await this.cacheService.get(`verify:${userId}`);
  if (cached !== dto.code) {
    throw new BadRequestException('Invalid verification code');
  }
  
  // 2. Update user
  await this.usersService.update(userId, { verified: true });
  
  // 3. Send welcome email
  const user = await this.usersService.findOne(userId);
  await notificationsAPI.post('/email/send-template', {
    to: user.email,
    templateId: 'welcome-email',
    variables: {
      userName: user.name
    }
  });
  
  return { verified: true };
}
```

## 2. Payment Confirmation Flow

Send email, push notification, and in-app notification when payment succeeds.

```typescript
// payment-service/payments.controller.ts
@Post('/confirm')
async confirmPayment(
  @Body() dto: ConfirmPaymentDto,
  @Req() req: Request
) {
  const userId = req.user.id;
  
  // 1. Process payment with Stripe/PayPal
  const payment = await this.paymentsService.process(dto);
  
  if (payment.status !== 'success') {
    // Send failure notification
    await notificationsAPI.post('/email/send-template', {
      to: payment.userEmail,
      templateId: 'payment-failed',
      variables: {
        reason: payment.failureReason,
        amount: payment.amount
      }
    });
    throw new PaymentFailedException(payment.failureReason);
  }
  
  // 2. Send confirmation email
  await notificationsAPI.post('/email/send-template', {
    to: payment.userEmail,
    templateId: 'payment-receipt',
    variables: {
      amount: `$${payment.amount}`,
      currency: 'USD',
      paymentDate: new Date().toLocaleDateString(),
      receiptNumber: payment.id
    }
  });
  
  // 3. Send push notification to all user devices
  await notificationsAPI.post('/push/send', {
    userId: userId,
    title: 'Payment Confirmed',
    body: `Payment of $${payment.amount} confirmed successfully`,
    data: {
      paymentId: payment.id,
      amount: payment.amount,
      action: 'view_receipt'
    },
    imageUrl: 'https://visiobook.com/images/payment-success.png'
  });
  
  // 4. Create in-app notification
  await notificationsAPI.post('/notifications', {
    userId: userId,
    title: 'Payment Received',
    message: `Payment of $${payment.amount} has been processed successfully`,
    type: 'payment',
    actionUrl: `/payments/receipt/${payment.id}`,
    data: {
      paymentId: payment.id,
      amount: payment.amount
    }
  });
  
  return payment;
}
```

## 3. Batch Newsletter Sending

Send newsletters to thousands of users efficiently.

```typescript
// marketing-service/newsletter.service.ts
async sendNewsletter(newsletterId: string) {
  // 1. Get newsletter content
  const newsletter = await this.newslettersDB.findById(newsletterId);
  
  // 2. Get all subscribed users
  const subscribers = await this.usersDB.find({
    newsletterSubscribed: true,
    verified: true
  });
  
  console.log(`Sending newsletter to ${subscribers.length} users`);
  
  // 3. Batch into chunks of 100 (API limit)
  const batchSize = 100;
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);
    
    // 4. Create batch request
    const emailBatch = batch.map(user => ({
      to: user.email,
      subject: newsletter.subject,
      body: newsletter.htmlContent
    }));
    
    try {
      // 5. Send batch
      const response = await notificationsAPI.post('/email/send-batch', {
        emails: emailBatch
      });
      
      console.log(`Sent batch ${Math.floor(i / batchSize) + 1}, job ID: ${response.data.jobIds}`);
      
      // 6. Track in database
      await this.newsletterLogsDB.create({
        newsletterId,
        batchNumber: Math.floor(i / batchSize) + 1,
        count: batch.length,
        jobIds: response.data.jobIds,
        status: 'queued',
        sentAt: new Date()
      });
      
      // 7. Small delay to avoid overwhelming service
      await new Promise(r => setTimeout(r, 100));
      
    } catch (error) {
      console.error(`Batch failed for users ${i}-${i + batchSize}:`, error);
      
      // Log failure and continue with next batch
      await this.newsletterLogsDB.create({
        newsletterId,
        batchNumber: Math.floor(i / batchSize) + 1,
        count: batch.length,
        status: 'failed',
        error: error.message,
        sentAt: new Date()
      });
    }
  }
  
  console.log('Newsletter campaign completed');
}

// Monitor progress
async getNewslletterStats(newsletterId: string) {
  // Get all batches sent
  const logs = await this.newsletterLogsDB.find({ newsletterId });
  
  // Query email queue stats
  const queueStats = await notificationsAPI.get('/email/queue/stats');
  
  return {
    batches: logs.length,
    totalSent: logs.reduce((sum, log) => sum + log.count, 0),
    failed: logs.filter(l => l.status === 'failed').length,
    queueStats
  };
}
```

## 4. Real-Time Notifications for Messaging App

Send push notification when message arrives, with deep linking.

```typescript
// messaging-service/messages.controller.ts
@Post('/:conversationId/send')
async sendMessage(
  @Param('conversationId') conversationId: string,
  @Body() dto: SendMessageDto,
  @Req() req: Request
) {
  const senderId = req.user.id;
  
  // 1. Create message
  const message = await this.messagesDB.create({
    conversationId,
    senderId,
    content: dto.content,
    createdAt: new Date()
  });
  
  // 2. Get conversation details
  const conversation = await this.conversationsDB.findById(conversationId);
  const otherUserId = conversation.participants.find(p => p !== senderId);
  
  // 3. Get recipient user details for notification
  const recipient = await this.usersDB.findById(otherUserId);
  const sender = await this.usersDB.findById(senderId);
  
  // 4. Send push notification to recipient
  // (only to their devices, not to sender's devices)
  await notificationsAPI.post('/push/send', {
    userId: otherUserId,
    title: `Message from ${sender.name}`,
    body: dto.content.substring(0, 100), // First 100 chars
    data: {
      messageId: message.id,
      conversationId: conversationId,
      senderId: senderId,
      senderName: sender.name,
      senderAvatar: sender.avatarUrl,
      action: 'open_conversation'
    },
    imageUrl: sender.avatarUrl
  });
  
  // 5. Create in-app notification
  await notificationsAPI.post('/notifications', {
    userId: otherUserId,
    title: `New message from ${sender.name}`,
    message: dto.content.substring(0, 100),
    type: 'message',
    actionUrl: `/conversations/${conversationId}`,
    data: {
      messageId: message.id,
      conversationId: conversationId
    }
  });
  
  // 6. Emit WebSocket event for real-time update
  this.websocketService.emit(`user:${otherUserId}:messages`, {
    type: 'new_message',
    message: message
  });
  
  return message;
}
```

## 5. Admin Announcements Broadcast

Send announcement to all users via topic-based push.

```typescript
// admin-service/announcements.controller.ts
@Post('/create')
@UseGuards(RolesGuard)
@Roles('admin')
async createAnnouncement(@Body() dto: CreateAnnouncementDto) {
  // 1. Save announcement
  const announcement = await this.announcementsDB.create({
    title: dto.title,
    body: dto.body,
    image: dto.imageUrl,
    createdAt: new Date()
  });
  
  // 2. Send to "announcements" topic
  // All users who have subscribed to announcements will receive
  await notificationsAPI.post('/push/topic/send', {
    topic: 'announcements',
    title: announcement.title,
    body: announcement.body,
    data: {
      announcementId: announcement.id,
      action: 'view_announcement'
    },
    imageUrl: announcement.image
  });
  
  // 3. Create in-app notifications for all users
  // Get all active users
  const users = await this.usersDB.find({ active: true });
  
  // Send in batches
  const batchSize = 100;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    
    // For this, we need a batch create endpoint or loop
    for (const user of batch) {
      await notificationsAPI.post('/notifications', {
        userId: user.id,
        title: 'Platform Announcement',
        message: announcement.body,
        type: 'system',
        actionUrl: '/announcements',
        data: {
          announcementId: announcement.id
        }
      });
    }
  }
  
  return announcement;
}
```

## 6. Scheduled Reminders

Send reminders using background jobs.

```typescript
// reminder-service/reminder.job.ts
// Runs every hour via Bull queue
@Process('send-due-reminders')
async sendDueReminders() {
  // 1. Get all reminders due in next 5 minutes
  const now = new Date();
  const fiveMinutesLater = new Date(now.getTime() + 5 * 60000);
  
  const dueReminders = await this.remindersDB.find({
    scheduledTime: {
      $gte: now,
      $lte: fiveMinutesLater
    },
    sent: false
  });
  
  console.log(`Processing ${dueReminders.length} reminders`);
  
  for (const reminder of dueReminders) {
    try {
      const user = await this.usersDB.findById(reminder.userId);
      
      // 2. Send push notification
      await notificationsAPI.post('/push/send', {
        userId: reminder.userId,
        title: 'Reminder',
        body: reminder.title,
        data: {
          reminderId: reminder.id,
          action: 'view_reminder'
        }
      });
      
      // 3. Send email if user has reminder emails enabled
      if (user.emailReminders) {
        await notificationsAPI.post('/email/send', {
          to: user.email,
          subject: `Reminder: ${reminder.title}`,
          body: `<h2>${reminder.title}</h2><p>${reminder.description}</p>`
        });
      }
      
      // 4. Mark as sent
      await this.remindersDB.update(reminder.id, { sent: true });
      
    } catch (error) {
      console.error(`Failed to send reminder ${reminder.id}:`, error);
      // Don't fail entire job, continue with next reminder
    }
  }
}
```

## 7. Error Handling and Retry Pattern

Implement robust error handling with retries.

```typescript
// notification.helper.ts
async function sendNotificationWithRetry(
  notificationFn: () => Promise<any>,
  options = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000
  }
) {
  let lastError;
  
  for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
    try {
      const result = await notificationFn();
      if (attempt > 1) {
        console.log(`Notification sent on attempt ${attempt}`);
      }
      return result;
      
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        if (error.response?.status === 429) {
          // Rate limited - retry
          console.log(`Rate limited, retrying...`);
        } else {
          // Other 4xx errors - don't retry
          throw error;
        }
      }
      
      // Calculate backoff time
      const backoff = Math.min(
        options.initialDelay * Math.pow(2, attempt - 1),
        options.maxDelay
      );
      
      if (attempt < options.maxRetries) {
        console.log(`Attempt ${attempt} failed, retrying in ${backoff}ms...`);
        await new Promise(r => setTimeout(r, backoff));
      }
    }
  }
  
  throw new Error(
    `Failed to send notification after ${options.maxRetries} attempts: ${lastError.message}`
  );
}

// Usage
await sendNotificationWithRetry(() =>
  notificationsAPI.post('/email/send', {
    to: 'user@example.com',
    subject: 'Hello',
    body: 'Test email'
  })
);
```

## 8. Deduplication Pattern

Prevent sending duplicate notifications.

```typescript
// notification.dedup.ts
const redis = require('redis').createClient();

async function sendNotificationDedup(
  notification: any,
  deduplicationKey: string,
  ttlSeconds: number = 3600
) {
  // 1. Check if already sent
  const key = `notif:${deduplicationKey}`;
  const existing = await redis.get(key);
  
  if (existing) {
    console.log('Notification already sent:', deduplicationKey);
    return { status: 'skipped', reason: 'duplicate' };
  }
  
  // 2. Send notification
  const result = await notificationsAPI.post('/email/send', notification);
  
  // 3. Mark as sent
  await redis.setex(key, ttlSeconds, result.data.jobId);
  
  return result.data;
}

// Usage - when user clicks "resend" button
await sendNotificationDedup(
  {
    to: 'user@example.com',
    templateId: 'verification-email',
    variables: { code: '123456' }
  },
  `verify-email-${userId}`,
  300 // Don't resend within 5 minutes
);
```

## Best Practices Summary

✅ **Do:**
- Use templates for consistent formatting
- Use batch APIs for multiple notifications
- Implement retry logic with exponential backoff
- Store notification IDs for tracking
- Use deduplication to prevent duplicates
- Send notifications asynchronously
- Log notification sends for debugging
- Monitor queue stats regularly

❌ **Don't:**
- Send notifications synchronously in request/response cycle
- Store API keys in code
- Send notifications without user consent
- Ignore rate limits
- Overwhelm with too many notifications
- Hardcode email addresses or phone numbers
- Skip error handling
