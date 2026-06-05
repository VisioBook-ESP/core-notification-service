# Service Integration Guide

This guide shows how other backend services (Payment Service, User Service, etc.) integrate with the Core Notification Service.

## 🔗 Overview

```
┌─────────────────────────────┐
│   Your Backend Service      │
│  (Payment, User, Auth, etc) │
└──────────┬──────────────────┘
           │
           │ HTTP POST + X-API-Key header
           ▼
┌─────────────────────────────┐
│ Core Notification Service   │
│   /api/v1/email/send        │
│   /api/v1/push/send         │
│   /api/v1/notifications     │
└─────────────────────────────┘
           │
           ├──► SendGrid (Email)
           ├──► Firebase (Push)
           └──► PostgreSQL (In-App)
```

## 🔐 Authentication Setup

### 1. Get API Key

Contact the platform team or generate an API key:

```bash
# Ask DevOps for your service's API key
# It will look like: service-key-abc123xyz789
export NOTIFICATIONS_API_KEY=service-key-abc123xyz789
```

### 2. Store API Key

In your `.env` file:
```bash
NOTIFICATIONS_SERVICE_URL=https://notifications-api.visiobook.com
NOTIFICATIONS_API_KEY=service-key-abc123xyz789
```

## 📧 Sending Emails

### Node.js / Express Example

```typescript
import axios from 'axios';

const notificationsAPI = axios.create({
  baseURL: process.env.NOTIFICATIONS_SERVICE_URL,
  headers: {
    'X-API-Key': process.env.NOTIFICATIONS_API_KEY,
    'Content-Type': 'application/json'
  }
});

// Send welcome email
async function sendWelcomeEmail(email: string, userName: string) {
  try {
    const response = await notificationsAPI.post('/email/send', {
      to: email,
      subject: 'Welcome to VisioBook!',
      body: `<h1>Welcome ${userName}</h1><p>Your account is ready to use.</p>`
    });
    
    console.log('✅ Email queued:', response.data.jobId);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to send email:', error.response.data);
    throw error;
  }
}

// Send template email (with variable substitution)
async function sendVerificationEmail(email: string, verificationCode: string) {
  try {
    const response = await notificationsAPI.post('/email/send-template', {
      to: email,
      templateId: 'verification-email',
      variables: {
        verificationCode: verificationCode,
        expiresIn: '15 minutes'
      }
    });
    
    console.log('✅ Verification email queued:', response.data.jobId);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to send verification email:', error.response.data);
    throw error;
  }
}

// Send batch emails
async function sendNewsletterEmails(emailList: string[]) {
  try {
    const response = await notificationsAPI.post('/email/send-batch', {
      emails: emailList.map(email => ({
        to: email,
        subject: 'Monthly Newsletter',
        body: '<h1>This Month in VisioBook</h1>...'
      }))
    });
    
    console.log(`✅ ${response.data.total} emails queued`);
    return response.data;
  } catch (error) {
    console.error('❌ Batch send failed:', error.response.data);
    throw error;
  }
}
```

### Python Example

```python
import requests
import os

NOTIFICATIONS_API = os.getenv('NOTIFICATIONS_SERVICE_URL')
API_KEY = os.getenv('NOTIFICATIONS_API_KEY')

headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
}

def send_email(email: str, subject: str, body: str):
    """Send an email"""
    response = requests.post(
        f'{NOTIFICATIONS_API}/email/send',
        headers=headers,
        json={
            'to': email,
            'subject': subject,
            'body': body
        }
    )
    response.raise_for_status()
    return response.json()

def send_template_email(email: str, template_id: str, variables: dict):
    """Send a template email"""
    response = requests.post(
        f'{NOTIFICATIONS_API}/email/send-template',
        headers=headers,
        json={
            'to': email,
            'templateId': template_id,
            'variables': variables
        }
    )
    response.raise_for_status()
    return response.json()

# Usage
send_template_email(
    'user@example.com',
    'password-reset',
    {'resetLink': 'https://app.visiobook.com/reset/abc123', 'expiresIn': '1 hour'}
)
```

### Go Example

```go
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

type EmailRequest struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

func sendEmail(email, subject, body string) error {
	payload := EmailRequest{
		To:      email,
		Subject: subject,
		Body:    body,
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest(
		"POST",
		os.Getenv("NOTIFICATIONS_SERVICE_URL")+"/email/send",
		bytes.NewBuffer(data),
	)
	if err != nil {
		return err
	}

	req.Header.Set("X-API-Key", os.Getenv("NOTIFICATIONS_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusAccepted {
		return fmt.Errorf("email service error: %d", resp.StatusCode)
	}

	return nil
}
```

## 🔔 Sending Push Notifications

### When to Send Push Notifications

- New message received
- Payment processed
- Order shipped
- Friend request accepted
- Event reminder
- Important alerts
- Live notifications (stock price change, game result, etc.)

### Node.js Example - Send to Single User

```typescript
// Send push to a specific user
async function notifyUserNewMessage(userId: string, senderId: string, messageText: string) {
  try {
    const response = await notificationsAPI.post('/push/send', {
      userId: userId,
      title: 'New Message',
      body: messageText.substring(0, 100), // First 100 chars
      data: {
        messageId: 'msg-123',
        senderId: senderId,
        conversationId: 'conv-456',
        action: 'open_message'
      },
      imageUrl: 'https://example.com/profile-pic.jpg'
    });
    
    console.log(`✅ Push queued to ${response.data.devicesCount} devices`);
    return response.data;
  } catch (error) {
    console.error('❌ Push notification failed:', error.response.data);
    throw error;
  }
}

// Send to all users subscribed to a topic (broadcast)
async function broadcastAnnouncementToAll(title: string, body: string, newsId: string) {
  try {
    const response = await notificationsAPI.post('/push/topic/send', {
      topic: 'announcements',
      title: title,
      body: body,
      data: {
        newsId: newsId,
        type: 'announcement'
      }
    });
    
    console.log(`✅ Announcement queued, estimated ${response.data.estimatedRecipients} recipients`);
    return response.data;
  } catch (error) {
    console.error('❌ Topic broadcast failed:', error.response.data);
    throw error;
  }
}
```

**Response Example:**
```json
{
  "jobId": "push-job-789",
  "status": "queued",
  "devicesCount": 3,
  "timestamp": "2026-04-23T13:49:57.295Z"
}
```

**Note:** Push is sent to ALL devices the user has registered (iOS, Android, Web, etc.)

### Python Example - Send Push

```python
def send_push_notification(user_id: str, title: str, body: str, data: dict = None):
    """Send a push notification to a user"""
    payload = {
        'userId': user_id,
        'title': title,
        'body': body,
        'data': data or {}
    }
    
    response = requests.post(
        f'{NOTIFICATIONS_API}/push/send',
        headers=headers,
        json=payload
    )
    response.raise_for_status()
    return response.json()

def broadcast_to_topic(topic: str, title: str, body: str, data: dict = None):
    """Send push to all users subscribed to topic"""
    payload = {
        'topic': topic,
        'title': title,
        'body': body,
        'data': data or {}
    }
    
    response = requests.post(
        f'{NOTIFICATIONS_API}/push/topic/send',
        headers=headers,
        json=payload
    )
    response.raise_for_status()
    return response.json()

# Usage
send_push_notification(
    'user-123',
    'Payment Received',
    'Your payment of $50 has been processed',
    {'paymentId': 'pay-456', 'amount': '50'}
)
```

### Go Example - Send Push

```go
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

type PushRequest struct {
	UserID string                 `json:"userId"`
	Title  string                 `json:"title"`
	Body   string                 `json:"body"`
	Data   map[string]interface{} `json:"data"`
}

func sendPushNotification(userId, title, body string, data map[string]interface{}) error {
	payload := PushRequest{
		UserID: userId,
		Title:  title,
		Body:   body,
		Data:   data,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest(
		"POST",
		os.Getenv("NOTIFICATIONS_SERVICE_URL")+"/push/send",
		bytes.NewBuffer(jsonPayload),
	)
	if err != nil {
		return err
	}

	req.Header.Set("X-API-Key", os.Getenv("NOTIFICATIONS_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	if resp.StatusCode != http.StatusAccepted {
		return fmt.Errorf("push failed: %s", string(body))
	}

	fmt.Println("Push notification queued successfully")
	return nil
}
```

### Topic-Based Broadcasting

Subscribe users to topics and send to all subscribers:

```typescript
// Subscribe devices to a topic
async function subscribeToTopic(topic: string, deviceTokens: string[]) {
  try {
    const response = await notificationsAPI.post('/push/topic/subscribe', {
      topic: topic,
      deviceTokens: deviceTokens
    });
    
    console.log(`✅ ${response.data.subscribedCount} devices subscribed to ${topic}`);
    return response.data;
  } catch (error) {
    console.error('❌ Topic subscription failed:', error.response.data);
    throw error;
  }
}

// Send to topic
async function sendToTopic(topic: string, title: string, body: string) {
  try {
    const response = await notificationsAPI.post('/push/topic/send', {
      topic: topic,
      title: title,
      body: body
    });
    
    console.log(`✅ Sent to topic: ${response.data.estimatedRecipients} recipients`);
    return response.data;
  } catch (error) {
    console.error('❌ Topic send failed:', error.response.data);
    throw error;
  }
}

// Usage
// When user subscribes to announcements, register their device token
await subscribeToTopic('announcements', [deviceToken]);

// When sending announcement, broadcast to all subscribers
await sendToTopic('announcements', 'Breaking News', 'Important announcement...');
```

## 📱 In-App Notifications

### Creating In-App Notifications

In-app notifications are stored in the database and displayed in your application interface.

**Node.js Example:**
```typescript
// Create in-app notification (stored in database)
async function createPaymentNotification(userId: string, amount: number, paymentId: string) {
  try {
    const response = await notificationsAPI.post('/notifications', {
      userId: userId,
      title: 'Payment Received',
      message: `Payment of $${amount.toFixed(2)} received successfully`,
      type: 'payment',
      actionUrl: `/payments/receipt/${paymentId}`,
      data: {
        amount: amount.toString(),
        currency: 'USD',
        paymentId: paymentId
      }
    });
    
    console.log('✅ In-app notification created:', response.data.id);
    return response.data;
  } catch (error) {
    console.error('❌ Notification creation failed:', error.response.data);
    throw error;
  }
}

// Retrieve notifications for user (frontend calls with JWT)
async function getUserNotifications(page = 1, limit = 20) {
  try {
    const response = await userNotificationsAPI.get(
      `/notifications?page=${page}&limit=${limit}&read=false`
    );
    
    console.log('✅ Retrieved notifications:', response.data.data.length);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch notifications:', error.response.data);
    throw error;
  }
}
```

**Python Example:**
```python
def create_notification(user_id: str, title: str, message: str, notif_type: str, action_url: str = None, data: dict = None):
    """Create in-app notification"""
    payload = {
        'userId': user_id,
        'title': title,
        'message': message,
        'type': notif_type,
        'actionUrl': action_url or '',
        'data': data or {}
    }
    
    response = requests.post(
        f'{NOTIFICATIONS_API}/notifications',
        headers=headers,
        json=payload
    )
    response.raise_for_status()
    return response.json()

# Usage
create_notification(
    'user-123',
    'Order Shipped',
    'Your order #456 has been shipped',
    'alert',
    '/orders/456',
    {'orderId': '456', 'trackingNumber': 'ABC123'}
)
```

### Supported Notification Types

- `payment` - Payment related (receipt, failed, etc.)
- `message` - Message notifications
- `alert` - Important alerts
- `update` - App/content updates
- `promotion` - Promotional notifications
- `system` - System notifications

### Multi-Channel Example

Send across all channels (email + push + in-app) for important events:

```typescript
// Payment confirmation - notify via all channels
app.post('/api/v1/payments/confirm', async (req, res) => {
  const { userId, amount, paymentId } = req.body;
  
  // Process payment
  const payment = await processPayment(userId, amount);
  
  if (payment.status === 'success') {
    // Notify user via all channels in parallel
    await Promise.all([
      // Email
      notificationsAPI.post('/email/send-template', {
        to: payment.userEmail,
        templateId: 'payment-receipt',
        variables: { amount: amount.toString(), paymentId: paymentId }
      }),
      // Push notification
      notificationsAPI.post('/push/send', {
        userId: userId,
        title: 'Payment Confirmed',
        body: `Payment of $${amount} confirmed`,
        data: { paymentId: paymentId, amount: amount }
      }),
      // In-app notification
      notificationsAPI.post('/notifications', {
        userId: userId,
        title: 'Payment Received',
        message: `Payment of $${amount} confirmed`,
        type: 'payment',
        actionUrl: `/payments/receipt/${paymentId}`
      })
    ]);
  }
  
  res.json(payment);
});
```

## 🔄 Error Handling

### Implement Retry Logic

```typescript
async function sendNotificationWithRetry(
  notificationFn: () => Promise<any>,
  maxRetries: number = 3
) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await notificationFn();
    } catch (error) {
      lastError = error;
      
      if (error.response?.status === 429) {
        // Rate limited - wait before retry
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else if (error.response?.status >= 500) {
        // Server error - retry with exponential backoff
        const waitTime = Math.pow(2, attempt) * 100;
        console.log(`Server error. Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        // Client error - don't retry
        throw error;
      }
    }
  }
  
  throw lastError;
}

// Usage
try {
  await sendNotificationWithRetry(() => 
    sendTemplateEmail('user@example.com', 'verification-email', { code: '123456' })
  );
} catch (error) {
  console.error('Failed to send email after 3 retries:', error);
  // Log to monitoring service
  logError('email_send_failed', error);
}
```

### Handle Different Error Types

```typescript
import axios from 'axios';

async function sendEmailWithErrorHandling(email: string, templateId: string) {
  try {
    await notificationsAPI.post('/email/send-template', {
      to: email,
      templateId: templateId,
      variables: {}
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorCode = error.response?.data?.code;
      
      if (status === 400) {
        console.error('Bad request - check your payload:', error.response.data.message);
      } else if (status === 401) {
        console.error('Unauthorized - check your API key');
      } else if (status === 429) {
        console.error('Rate limited - too many requests');
      } else if (status === 500) {
        console.error('Server error - try again later');
      } else if (errorCode === 'INVALID_EMAIL') {
        console.error('Invalid email address format');
      } else if (errorCode === 'TEMPLATE_NOT_FOUND') {
        console.error('Email template does not exist');
      }\n    } else {\n      console.error('Unknown error:', error);\n    }\n  }\n}\n```\n\n## 📊 Monitoring & Debugging\n\n### Check Email Queue Status\n\n```bash\ncurl https://notifications-api.visiobook.com/api/v1/email/queue/stats\n\n# Response\n{\n  \"pending\": 5,\n  \"active\": 2,\n  \"completed\": 1234,\n  \"failed\": 3,\n  \"averageProcessingTime\": 2500\n}\n```\n\n### Check Push Queue Status\n\n```bash\ncurl https://notifications-api.visiobook.com/api/v1/push/queue/stats \\\n  -H \"X-API-Key: your-api-key\"\n\n# Response\n{\n  \"pending\": 12,\n  \"active\": 3,\n  \"completed\": 5600,\n  \"failed\": 8,\n  \"averageProcessingTime\": 1200\n}\n```\n\n### Common Issues\n\n| Issue | Cause | Solution |\n|-------|-------|----------|\n| 401 Unauthorized | Invalid/missing API key | Check your API key in environment |\n| 400 Bad Request | Invalid email format | Validate email before sending |\n| 429 Too Many Requests | Rate limited | Implement exponential backoff |\n| Template not found | Wrong template ID | Check available templates |\n| Push not delivered | No devices registered | Ensure user has registered devices |\n\n## 🎯 Best Practices\n\n1. **Validate Before Sending**\n   ```typescript\n   const isValidEmail = (email: string) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);\n   if (!isValidEmail(email)) throw new Error('Invalid email');\n   ```\n\n2. **Combine Channels**\n   ```typescript\n   // Send via all channels for important notifications\n   await Promise.all([\n     sendEmail(user.email, 'subject', 'body'),\n     sendPush(user.id, 'title', 'body'),\n     createNotification(user.id, 'title', 'message')\n   ]);\n   ```\n\n3. **Track Delivery**\n   ```typescript\n   const jobId = (await sendEmail(...)).jobId;\n   // Store jobId in database for tracking\n   await db.notifications.insert({ jobId, userId, type: 'email' });\n   ```\n\n4. **Rate Limit Users**\n   ```typescript\n   // Don't spam users - limit notifications per hour\n   const sent = await countNotificationsSentToday(userId);\n   if (sent > 10) {\n     console.warn('User notification limit reached');\n     return;\n   }\n   ```\n\n5. **Use Templates for Consistency**\n   ```typescript\n   // ✅ Good - consistent, maintainable\n   sendTemplateEmail(email, 'verification-email', { code });\n   \n   // ❌ Bad - duplicated HTML in multiple places\n   sendEmail(email, 'Verify', '<h1>Code: ' + code + '</h1>');\n   ```\n\n## 🆘 Support\n\nFor integration questions:\n- Check the [API Reference](./api-reference.md)\n- Review [Architecture Guide](./ARCHITECTURE_GUIDE.md)\n- Contact: notifications-team@visiobook.com\n"