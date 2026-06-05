# Templates Module Documentation

## Overview

The Templates module provides CRUD operations for managing email templates used by the Email service. It wraps the `EmailTemplateRepository` with service-level business logic and exposes REST endpoints for template management.

## Architecture

```
TemplatesModule
├── TemplatesController (REST endpoints)
├── TemplatesService (business logic)
└── DatabaseModule (EmailTemplateRepository)
```

## Endpoints

### 1. Create Template
```
POST /api/v1/templates
Content-Type: application/json

{
  "templateId": "welcome-email",
  "name": "Welcome Email",
  "subject": "Welcome to VisioBook {{firstName}}",
  "body": "<h1>Hello {{firstName}}</h1>...",
  "variables": {
    "firstName": "string",
    "email": "string",
    "company": "string"
  },
  "active": true
}

Response: 201 Created
{
  "id": "uuid",
  "templateId": "welcome-email",
  "name": "Welcome Email",
  "subject": "Welcome to VisioBook {{firstName}}",
  "body": "<h1>Hello {{firstName}}</h1>...",
  "variables": {...},
  "active": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 2. List Templates
```
GET /api/v1/templates?page=1&limit=20&active=true&search=welcome

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "templateId": "welcome-email",
      "name": "Welcome Email",
      "subject": "Welcome to VisioBook {{firstName}}",
      "body": "...",
      "variables": {...},
      "active": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `active`: Filter by active status (optional)
- `search`: Search by name or templateId (optional)

### 3. Get Active Templates
```
GET /api/v1/templates/active

Response: 200 OK
{
  "items": [...],
  "total": 5
}
```

### 4. Get Template by ID
```
GET /api/v1/templates/:templateId

Response: 200 OK
{
  "id": "uuid",
  "templateId": "welcome-email",
  ...
}
```

### 5. Update Template
```
PATCH /api/v1/templates/:templateId
Content-Type: application/json

{
  "name": "Welcome Email Updated",
  "subject": "Welcome to VisioBook, {{firstName}}!",
  "body": "...",
  "variables": {...}
}

Response: 200 OK
{
  "id": "uuid",
  "templateId": "welcome-email",
  "name": "Welcome Email Updated",
  ...
  "updatedAt": "2024-01-15T11:45:00Z"
}
```

### 6. Delete Template (Soft Delete)
```
DELETE /api/v1/templates/:templateId

Response: 204 No Content
```

**Note**: Soft deletes - templates are deactivated, not permanently removed.

### 7. Test Template
```
POST /api/v1/templates/:templateId/test
Content-Type: application/json

{
  "firstName": "John",
  "email": "john@example.com",
  "company": "Acme Inc"
}

Response: 200 OK
{
  "valid": true,
  "templateId": "welcome-email",
  "requiredVariables": ["firstName", "email", "company"],
  "providedVariables": ["firstName", "email", "company"]
}
```

**Error Response**: 400 Bad Request if variables missing
```
{
  "statusCode": 400,
  "message": "Missing required variables: firstName, company",
  "error": "Bad Request",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Service Methods

### `createTemplate(dto: CreateEmailTemplateDto): Promise<EmailTemplateResponseDto>`
Creates a new email template.

**Validation**:
- templateId must be unique
- variables schema must be valid JSON object
- Logs creation with template ID

**Throws**:
- `BadRequestException` - if templateId already exists
- Error from repository save operation

### `getTemplate(templateId: string): Promise<EmailTemplateResponseDto>`
Retrieves a template by templateId.

**Throws**:
- `NotFoundException` - if template doesn't exist

### `listTemplates(query: ListEmailTemplatesQueryDto): Promise<ListEmailTemplatesResponseDto>`
Lists templates with pagination and filtering.

**Features**:
- Pagination (page, limit)
- Search by name or templateId
- Filter by active status
- Returns total count

### `updateTemplate(templateId: string, dto: UpdateEmailTemplateDto): Promise<EmailTemplateResponseDto>`
Updates an existing template.

**Behavior**:
- Updates only provided fields
- Sets updatedAt timestamp
- All fields optional except templateId

**Throws**:
- `NotFoundException` - if template doesn't exist

### `deleteTemplate(templateId: string): Promise<void>`
Soft deletes a template (deactivates).

**Behavior**:
- Sets active = false instead of deleting
- UpdatedAt timestamp updated
- Template still queryable with active=false filter

**Throws**:
- `NotFoundException` - if template doesn't exist

### `testTemplate(templateId: string, data: Record<string, any>): Promise<any>`
Validates template variables.

**Behavior**:
- Checks that all required variables are provided
- Returns validation result and variable lists

**Throws**:
- `NotFoundException` - if template doesn't exist
- `BadRequestException` - if required variables missing

### `getActiveTemplates(): Promise<any>`
Gets all active templates.

**Returns**:
- Array of active templates with total count

## DTOs

### CreateEmailTemplateDto
```typescript
{
  templateId: string;      // Unique identifier (e.g., "welcome-email")
  name: string;            // Display name
  subject: string;         // Email subject line
  body: string;            // HTML email body
  variables: Record<string, string>;  // Variable schema
  active?: boolean;        // Default: true
}
```

### UpdateEmailTemplateDto
```typescript
{
  name?: string;
  subject?: string;
  body?: string;
  variables?: Record<string, string>;
  active?: boolean;
}
```

### ListEmailTemplatesQueryDto
```typescript
{
  page?: number;           // Default: 1
  limit?: number;          // Default: 20
  active?: boolean;        // Optional filter
  search?: string;         // Search term
}
```

## Repository Integration

The TemplatesService uses `EmailTemplateRepository` methods:

- `findByTemplateId(templateId)` - Get template by ID
- `getAllTemplates(skip, limit, activeOnly)` - Paginated list
- `searchTemplates(term, activeOnly, skip, limit)` - Search functionality
- `deactivateTemplate(templateId)` - Soft delete
- `findAllActive(skip, limit)` - Get all active templates

## Pre-seeded Templates

The database seeder includes 5 default templates:

1. **verification-email**
   - Subject: `Email Verification - VisioBook`
   - Variables: `{name, verificationLink}`

2. **password-reset**
   - Subject: `Reset Your Password - VisioBook`
   - Variables: `{name, resetLink}`

3. **welcome-email**
   - Subject: `Welcome to VisioBook, {{name}}!`
   - Variables: `{name, email, company}`

4. **generation-complete**
   - Subject: `Your Vision Board is Ready`
   - Variables: `{name, boardTitle, boardLink}`

5. **payment-confirmation**
   - Subject: `Payment Confirmation - VisioBook`
   - Variables: `{name, amount, transactionId, date}`

## Integration with Email Module

The Email module uses these templates:

```typescript
async sendTemplateEmail(to, templateId, data) {
  1. Call TemplatesService.getTemplate(templateId)
  2. Validate variables with testTemplate()
  3. Pass to SendGridAdapter.sendTemplate()
  4. SendGrid renders template with data
}
```

## Error Handling

All endpoints return standard error responses:

```json
{
  "statusCode": 400 | 404 | 500,
  "message": "Error description",
  "error": "Bad Request | Not Found | Internal Server Error",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Common Status Codes**:
- **201**: Template created successfully
- **200**: Successful GET/PATCH operation
- **204**: Template deleted successfully
- **400**: Bad request (missing/invalid data)
- **404**: Template not found
- **500**: Server error

## Logging

All operations include detailed logging:

```
📝 Creating email template: welcome-email
✓ Template created: <uuid>
📝 Fetching template: welcome-email
📝 Fetching templates (page 1, limit 20)
📝 Updating template: welcome-email
✓ Template updated: welcome-email
📝 Deleting template: welcome-email
✓ Template deactivated: welcome-email
🧪 Testing template: welcome-email
✓ Template validation passed
```

## Security Considerations

- ⚠️ No authentication/authorization on these endpoints (Task #9)
- Soft deletes preserve audit trail
- Variables schema is flexible - no validation of variable types
- HTML body is stored as-is - consider sanitization if user-provided

## Usage Example

```typescript
// In EmailService
async sendWelcomeEmail(userId: string, email: string, name: string) {
  // Get template
  const template = await this.templatesService.getTemplate('welcome-email');
  
  // Test variables
  await this.templatesService.testTemplate('welcome-email', {
    name,
    email,
    company: 'VisioBook'
  });
  
  // Send via email service (which uses SendGridAdapter)
  await this.sendTemplateEmail({
    to: email,
    templateId: 'welcome-email',
    data: { name, email, company: 'VisioBook' }
  });
}
```

## Testing Checklist

- [ ] Create new template successfully
- [ ] List templates with pagination
- [ ] Search templates by name/ID
- [ ] Filter active/inactive templates
- [ ] Get specific template by ID
- [ ] Update template fields
- [ ] Soft delete template
- [ ] Test template with valid variables (pass)
- [ ] Test template with missing variables (fail)
- [ ] Error handling for non-existent templates

## Future Enhancements

1. **Template Versioning**: Track template changes over time
2. **Template Categories**: Organize templates by type
3. **Template Preview**: Render preview with sample data
4. **Import/Export**: Bulk template management
5. **Translation Support**: Multi-language templates
6. **A/B Testing**: Compare template performance
7. **Template Audit**: Track who created/modified templates
