# Authentication & Authorization Documentation

## Overview

The Core Notification Service implements three authentication strategies:

1. **JWT Bearer Token** - For user applications (client-facing endpoints)
2. **API Key** - For service-to-service communication (admin/service-only endpoints)
3. **Public Access** - For read-only operations (list templates, health checks)

## Architecture

```
Request → Authentication Middleware → Guard (JWT/ApiKey) → Route Handler
                                      ↓
                            @CurrentUser decorator
                            (extracts user from token)
```

## Implementation Files

### Guards (`src/common/guards/`)

**JwtAuthGuard** - Validates JWT Bearer tokens
- Extracts token from `Authorization: Bearer <token>` header
- Validates JWT format (3 parts separated by dots)
- Decodes token payload and stores user info on request
- Throws `UnauthorizedException` if token invalid/missing

**ApiKeyGuard** - Validates API keys for service-to-service auth
- Extracts key from `X-API-Key` header or `?apiKey=` query param
- Validates against configured API keys (comma-separated in `VALID_API_KEYS` env)
- Throws `UnauthorizedException` if key invalid
- Skips validation if no keys configured (dev mode)

**RolesGuard** - Role-based access control (optional, for future use)
- Checks user role from token payload
- Validates against role requirements from `@Roles()` decorator
- Throws `ForbiddenException` if role insufficient

### Decorators (`src/common/decorators/`)

**@CurrentUser()** - Param decorator for extracting user from request
```typescript
async getNotifications(@CurrentUser() user: any) {
  // user = { userId, email, role, ... }
}
```

**@Roles('admin', 'moderator')** - Metadata for role-based access
```typescript
@UseGuards(RolesGuard)
@Roles('admin')
async deleteTemplate(...) { }
```

### Services (`src/common/services/`)

**AuthStrategyService** - Detects and identifies auth strategy used
```typescript
getAuthStrategy(request) // Returns 'jwt' | 'apiKey' | 'none'
getRequesterIdentifier(request) // Returns 'user:123' or 'service:abc...'
```

## Endpoint Security Mapping

### User-Facing Endpoints (JWT Required)

These endpoints require valid JWT token in `Authorization: Bearer <token>` header.

**Push Module**:
- `POST /api/v1/push/subscribe` - Register device
- `DELETE /api/v1/push/unsubscribe/:deviceId` - Unregister device
- `GET /api/v1/push/devices` - List user's devices

**Notifications Module**:
- `GET /api/v1/notifications` - List notifications
- `GET /api/v1/notifications/:id` - Get notification
- `PATCH /api/v1/notifications/:id/read` - Mark as read
- `PATCH /api/v1/notifications/read-all` - Mark all as read
- `DELETE /api/v1/notifications/:id` - Delete notification
- `GET /api/v1/notifications/unread/count` - Unread count

### Service-Only Endpoints (API Key Required)

These endpoints require API key in `X-API-Key` header. Used by other backend services.

**Email Module**:
- `POST /api/v1/email/send` - Queue email
- `POST /api/v1/email/send-batch` - Batch queue
- All other endpoints read-only

**Push Module**:
- `POST /api/v1/push/send` - Queue push notification
- `POST /api/v1/push/topic/subscribe` - Subscribe to topic
- `POST /api/v1/push/topic/send` - Send to topic
- `GET /api/v1/push/queue/stats` - Queue statistics

**Templates Module**:
- `POST /api/v1/templates` - Create template
- `PATCH /api/v1/templates/:id` - Update template
- `DELETE /api/v1/templates/:id` - Delete template

**Notifications Module**:
- `POST /api/v1/notifications` - Create notification (from other services)

### Public Endpoints (No Authentication)

These endpoints are publicly accessible.

**Email Module**:
- `GET /api/v1/email/templates` - List templates
- `GET /api/v1/email/templates/:id` - Get template
- `GET /api/v1/email/verify/:email` - Verify email
- `GET /api/v1/email/queue/stats` - Queue stats (in future restricted to API key)

**Templates Module**:
- `GET /api/v1/templates` - List templates
- `GET /api/v1/templates/active` - Active templates
- `GET /api/v1/templates/:id` - Get template
- `POST /api/v1/templates/:id/test` - Test template

**App Module**:
- `GET /api/v1/health` - Health check
- `GET /api/v1/ready` - Readiness check

## JWT Token Format

Expected JWT payload structure:

```json
{
  "userId": "uuid-v4",
  "email": "user@example.com",
  "role": "user",    // "user", "admin", "moderator"
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Token Generation Example**:
```bash
# Create JWT (from core-user-service or identity provider)
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U
```

## API Key Format

API keys are arbitrary strings stored in environment variable:

```bash
# .env
VALID_API_KEYS=sk-service-email-1234,sk-service-push-5678,sk-admin-template-9012
```

**Usage Example**:
```bash
curl -X POST http://localhost:8088/api/v1/email/send \
  -H "X-API-Key: sk-service-email-1234" \
  -H "Content-Type: application/json" \
  -d '{"to": "user@example.com", "subject": "Hello"}'
```

## Swagger Security Configuration

The Swagger documentation at `/api/docs` includes two security schemes:

### 1. JWT Bearer
```yaml
schemes:
  - type: http
    scheme: bearer
    bearerFormat: JWT
    description: 'JWT token for user authentication'
```

**Usage in Swagger**:
1. Click "Authorize" button
2. Paste your token in format: `Bearer <token>`
3. Click authorize

### 2. API Key
```yaml
schemes:
  - type: apiKey
    name: X-API-Key
    in: header
    description: 'API key for service-to-service authentication'
```

**Usage in Swagger**:
1. Click "Authorize" button
2. Select API Key security
3. Enter your API key value
4. Click authorize

## Error Responses

### 401 Unauthorized - Missing Token
```json
{
  "statusCode": 401,
  "message": "Authorization token required",
  "error": "Unauthorized",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 401 Unauthorized - Invalid Token
```json
{
  "statusCode": 401,
  "message": "Invalid or expired token",
  "error": "Unauthorized",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 401 Unauthorized - Invalid API Key
```json
{
  "statusCode": 401,
  "message": "Invalid API key",
  "error": "Unauthorized",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 403 Forbidden - Insufficient Permissions
```json
{
  "statusCode": 403,
  "message": "Access denied. Required roles: admin, moderator",
  "error": "Forbidden",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Development Mode

**Disable API Key Validation**:
```bash
# Leave VALID_API_KEYS empty
VALID_API_KEYS=
```

In this mode, ApiKeyGuard will allow requests without API keys.

**Test JWT Token (Development Only)**:
```typescript
// Create a simple JWT for testing
const token = Buffer.from(JSON.stringify({
  userId: 'test-user-123',
  email: 'test@example.com',
  role: 'user'
})).toString('base64');

// Use: Authorization: Bearer <token>
```

⚠️ **Note**: The JWT implementation in dev mode does NOT validate signatures. For production, integrate with a proper JWT library (jsonwebtoken) and validate signatures with your secret key.

## Integration with Core-User-Service

For production deployment:

1. **JWT Verification**: Use `jsonwebtoken` library to verify signatures
```typescript
import * as jwt from 'jsonwebtoken';

const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

2. **Update JwtAuthGuard**:
```typescript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
request.user = decoded;
return true;
```

3. **Configure Secret in .env**:
```bash
JWT_SECRET=your-shared-secret-key
```

## Production Checklist

- [ ] Update JwtAuthGuard to use `jwt.verify()` with secret
- [ ] Set `VALID_API_KEYS` to actual service keys
- [ ] Set `JWT_SECRET` to match core-user-service
- [ ] Enable HTTPS on API endpoints
- [ ] Implement rate limiting (`@nestjs/throttler`)
- [ ] Add request logging with security headers
- [ ] Audit logs for failed authentication attempts
- [ ] Rotate API keys periodically
- [ ] Monitor for suspicious patterns

## Testing Authentication

### Test JWT Endpoint
```bash
# Get a valid token from core-user-service
TOKEN=$(curl -X POST http://core-user-service/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass"}' \
  | jq -r '.token')

# Use token
curl -X GET http://localhost:8088/api/v1/notifications \
  -H "Authorization: Bearer $TOKEN"
```

### Test API Key Endpoint
```bash
curl -X POST http://localhost:8088/api/v1/email/send \
  -H "X-API-Key: sk-service-email-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Test",
    "body": "Test email"
  }'
```

### Test Public Endpoint
```bash
# No authentication required
curl -X GET http://localhost:8088/api/v1/templates
curl -X GET http://localhost:8088/api/v1/health
```

## Security Best Practices

1. **Token Storage**: Store JWT tokens securely (httpOnly cookies, not localStorage)
2. **Token Expiration**: Implement short expiration times (15-60 minutes)
3. **Refresh Tokens**: Use refresh tokens for obtaining new JWT tokens
4. **API Key Rotation**: Rotate API keys every 90 days
5. **HTTPS Only**: Always use HTTPS in production
6. **CORS Configuration**: Restrict to known origins
7. **Rate Limiting**: Implement per-user/API-key rate limits
8. **Logging**: Log all authentication failures
9. **Monitoring**: Alert on unusual access patterns
10. **Documentation**: Keep security documentation updated

## Future Enhancements

- [ ] OAuth2/OpenID Connect integration
- [ ] Multi-factor authentication (MFA)
- [ ] IP whitelisting for API keys
- [ ] Token scopes and permissions
- [ ] WebAuthn/FIDO2 support
- [ ] Key expiration and rotation
- [ ] Audit trail for security events
- [ ] Rate limiting per endpoint
- [ ] Request signing for service-to-service calls
- [ ] CORS per-endpoint configuration
