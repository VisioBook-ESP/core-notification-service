# Testing Guide

## Overview

The Core Notification Service includes comprehensive unit and integration test coverage using Jest. Tests cover services, controllers, guards, adapters, and queue processors.

## Test Structure

```
tests/
├── email.service.spec.ts         # Email service unit tests
├── email.controller.spec.ts       # Email controller unit tests
├── push.service.spec.ts          # Push service unit tests
├── notifications.service.spec.ts # Notifications service unit tests
├── templates.service.spec.ts     # Templates service unit tests
├── auth.guard.spec.ts            # JWT and API Key guard tests
├── adapters.spec.ts              # SendGrid and Firebase adapter tests
├── queue.processor.spec.ts       # Email and Push processor tests
└── app.e2e.spec.ts               # End-to-end integration tests
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:cov
```

### Run Specific Test File
```bash
npm test -- email.service.spec.ts
npm test -- --testNamePattern="sendEmailQueued"
```

### Run Integration Tests Only
```bash
npm test -- app.e2e.spec.ts
```

## Test Coverage Goals

- **Services**: 80%+ coverage
  - All public methods tested
  - Error cases covered
  - Edge cases validated

- **Controllers**: 75%+ coverage
  - Valid requests tested
  - Invalid inputs rejected
  - Proper HTTP status codes

- **Guards**: 90%+ coverage
  - Valid tokens/keys accepted
  - Invalid/missing tokens rejected
  - All error paths covered

- **Adapters**: 70%+ coverage
  - Basic functionality tested
  - External service error handling
  - Note: Full Firebase testing requires cloud setup

## Unit Tests

### EmailService Tests (`email.service.spec.ts`)

**Coverage**:
- ✅ `sendEmailQueued()` - Queue email with validation
- ✅ `sendEmailDirect()` - Send immediately via adapter
- ✅ `sendTemplateEmail()` - Template-based email with variables
- ✅ `sendBatchEmails()` - Multiple emails queued
- ✅ `verifyEmail()` - Email validation
- ✅ `getTemplates()` - List templates
- ✅ `getQueueStats()` - Queue statistics

**Key Test Cases**:
- Valid email sending
- Missing template error handling
- Required variables validation
- Adapter error propagation
- Batch processing

**Mocked Dependencies**:
- SendGridAdapter
- EmailTemplateRepository
- QueueService

### EmailController Tests (`email.controller.spec.ts`)

**Coverage**:
- ✅ `sendEmail()` - POST /email/send
- ✅ `sendTemplateEmail()` - POST /email/send-template
- ✅ `verifyEmail()` - GET /email/verify/:email
- ✅ `getTemplates()` - GET /email/templates

**Key Test Cases**:
- Valid request handling
- Service method invocation
- Correct response format

**Mocked Dependencies**:
- EmailService

### PushService Tests (`push.service.spec.ts`)

**Coverage**:
- ✅ `subscribeDevice()` - Register/update device
- ✅ `unsubscribeDevice()` - Mark device inactive
- ✅ `sendPushNotification()` - Queue push
- ✅ `subscribeToTopic()` - Topic subscription
- ✅ `listUserDevices()` - Paginated device list

**Key Test Cases**:
- Device registration and updates
- Device not found error handling
- Topic subscription validation
- Pagination logic

**Mocked Dependencies**:
- FirebaseAdapter
- DeviceTokenRepository
- QueueService

### NotificationsService Tests (`notifications.service.spec.ts`)

**Coverage**:
- ✅ `createNotification()` - Create new notification
- ✅ `getUserNotifications()` - Paginated list with filters
- ✅ `getNotification()` - Single notification with authorization check
- ✅ `updateNotification()` - Mark as read
- ✅ `markAllAsRead()` - Batch read marking
- ✅ `deleteNotification()` - Delete single
- ✅ `getUnreadCount()` - Count unread

**Key Test Cases**:
- Notification creation
- User authorization enforcement
- Read/unread status changes
- Filter operations
- Pagination

**Mocked Dependencies**:
- NotificationRepository

### TemplatesService Tests (`templates.service.spec.ts`)

**Coverage**:
- ✅ `createTemplate()` - Create with duplicate check
- ✅ `getTemplate()` - Retrieve single
- ✅ `listTemplates()` - Paginated list and search
- ✅ `updateTemplate()` - Update fields
- ✅ `deleteTemplate()` - Soft delete
- ✅ `testTemplate()` - Variable validation

**Key Test Cases**:
- Duplicate templateId prevention
- Template not found errors
- Variable validation
- Search functionality

**Mocked Dependencies**:
- EmailTemplateRepository

### Guards Tests (`auth.guard.spec.ts`)

**JwtAuthGuard Coverage**:
- ✅ Missing authorization header error
- ✅ Invalid Authorization format error
- ✅ Token extraction and validation
- ✅ Token signature validation

**ApiKeyGuard Coverage**:
- ✅ Pass when no keys configured
- ✅ Missing API key error
- ✅ Valid API key acceptance
- ✅ Invalid API key rejection
- ✅ Query parameter API key fallback

**Error Cases Tested**:
- Malformed tokens
- Expired tokens (when signature verification enabled)
- Missing credentials
- Invalid credentials

### Adapters Tests (`adapters.spec.ts`)

**SendGridAdapter Coverage**:
- ✅ Direct email sending
- ✅ Email verification
- ✅ Error handling

**FirebaseAdapter Coverage**:
- ✅ Adapter initialization check
- Note: Full Firebase testing requires credential setup

**Environment Setup**:
- SendGrid API key configuration
- Firebase service account configuration

### Queue Processor Tests (`queue.processor.spec.ts`)

**EmailProcessor Coverage**:
- ✅ `processSendEmail()` - Process email job
- ✅ Direct email handling
- ✅ Template email handling
- ✅ Error handling with retry logic
- ✅ `onCompleted()` - Job completion logging
- ✅ `onFailed()` - Job failure logging

**Test Cases**:
- Successful job processing
- Failed job handling
- Template email processing
- Progress tracking

**Mocked Dependencies**:
- SendGridAdapter
- Bull Job interface

## Integration Tests

### End-to-End Tests (`app.e2e.spec.ts`)

Tests verify authentication requirements and endpoint accessibility:

**Email Module (e2e)**:
- ✅ POST /api/v1/email/send requires API key
- ✅ GET /api/v1/email/templates public access
- ✅ POST /api/v1/email/send-template requires API key

**Push Module (e2e)**:
- ✅ POST /api/v1/push/subscribe requires JWT
- ✅ POST /api/v1/push/send requires API key
- ✅ GET /api/v1/push/devices requires JWT

**Notifications Module (e2e)**:
- ✅ GET /api/v1/notifications requires JWT
- ✅ POST /api/v1/notifications requires API key

**Templates Module (e2e)**:
- ✅ GET /api/v1/templates public access
- ✅ POST /api/v1/templates requires API key
- ✅ POST /api/v1/templates/:id/test public access

## Running Tests Locally

### Prerequisites
```bash
# Install dependencies
npm install

# Set up test environment
export NODE_ENV=test
export SENDGRID_API_KEY=test-api-key
export VALID_API_KEYS=test-key-1,test-key-2
```

### Execute Tests
```bash
# Single run
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# With coverage report
npm run test:cov

# Specific test file
npm test -- email.service.spec.ts

# Specific test suite
npm test -- --testNamePattern="EmailService"
```

## Coverage Reports

After running tests with coverage:

```bash
npm run test:cov
```

Reports are generated in:
- `coverage/` directory
- `coverage/index.html` - HTML coverage report (open in browser)
- `coverage/lcov-report/` - Detailed line-by-line coverage

### Coverage Thresholds
- **Statements**: 75%
- **Branches**: 70%
- **Functions**: 75%
- **Lines**: 75%

View coverage:
```bash
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
start coverage\lcov-report\index.html  # Windows
```

## Mocking Strategy

### Service Mocking
Services are mocked using Jest Mock Factory:

```typescript
mockServices = {
  createNotification: jest.fn(),
  getUserNotifications: jest.fn(),
  // ... other methods
} as any;
```

### Repository Mocking
Database repositories are mocked to avoid DB dependencies:

```typescript
mockRepository = {
  findByTemplateId: jest.fn(),
  getAllTemplates: jest.fn(),
  save: jest.fn(),
  // ... other methods
} as any;
```

### Adapter Mocking
External service adapters are mocked:

```typescript
mockSendGridAdapter = {
  send: jest.fn(),
  sendTemplate: jest.fn(),
  verifyEmail: jest.fn(),
} as any;
```

### ExecutionContext Mocking (for Guards)
Guards are tested with mock ExecutionContext:

```typescript
const mockContext = {
  switchToHttp: () => ({
    getRequest: () => ({
      headers: { authorization: 'Bearer token' },
    }),
  }),
} as ExecutionContext;
```

## Test Patterns

### Testing Service Methods
```typescript
it('should do something', async () => {
  // Arrange
  mockRepository.method.mockResolvedValue(expectedValue);
  
  // Act
  const result = await service.method(input);
  
  // Assert
  expect(mockRepository.method).toHaveBeenCalledWith(expectedValue);
  expect(result).toEqual(expectedResult);
});
```

### Testing Error Handling
```typescript
it('should throw error on invalid input', async () => {
  mockRepository.method.mockRejectedValue(new Error('DB Error'));
  
  await expect(service.method(input)).rejects.toThrow('DB Error');
});
```

### Testing Guard Authorization
```typescript
it('should reject without token', () => {
  const mockContext = {
    switchToHttp: () => ({
      getRequest: () => ({ headers: {} }),
    }),
  } as ExecutionContext;
  
  expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
});
```

## Troubleshooting

### Tests Failing Locally

**Issue**: Tests pass in CI but fail locally
- **Solution**: Clear node_modules and reinstall
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  npm test
  ```

**Issue**: Timeout errors
- **Solution**: Increase Jest timeout in jest.config.js
  ```javascript
  testTimeout: 10000  // 10 seconds
  ```

**Issue**: Cannot find module errors
- **Solution**: Verify moduleNameMapper in jest.config.js matches your aliases

### Coverage Not Meeting Thresholds

**Issue**: Coverage below expected
- **Solution**: 
  1. Run coverage report: `npm run test:cov`
  2. Identify untested files in report
  3. Add tests for missing coverage
  4. Check for unused code to remove

## GitHub Actions CI

Tests run automatically on:
- Pull requests
- Push to main branch

CI workflow (.github/workflows/ci-cd.yml):
```yaml
- name: Run Tests
  run: npm test -- --coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: coverage/lcov.info
```

## Best Practices

✅ **DO**:
- Test one thing per test case
- Use descriptive test names
- Mock external dependencies completely
- Test error paths, not just success cases
- Keep tests independent (no shared state)
- Use consistent setup/teardown

❌ **DON'T**:
- Test implementation details, test behavior
- Mock internal dependencies
- Create circular test dependencies
- Skip "boring" error cases
- Use real external services in tests
- Make tests too complex

## Future Testing Enhancements

- [ ] E2E tests with TestContainers (PostgreSQL + Redis)
- [ ] Performance tests for queue processing
- [ ] Load testing for concurrent notifications
- [ ] Mutation testing (Stryker)
- [ ] Contract testing with other services
- [ ] Visual regression testing (if UI exists)

## Resources

- [NestJS Testing Documentation](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

## Test Maintenance

Regular tasks:
- Review test coverage weekly
- Update tests when adding features
- Remove tests for deprecated code
- Keep mocks synchronized with real implementations
- Monitor test execution time (should be < 30 seconds)
