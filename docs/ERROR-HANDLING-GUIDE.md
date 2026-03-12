# Error Handling Guide for Developers

## Quick Start

### Using Error Classes

Instead of returning generic error responses, use specific error classes:

```typescript
import { BadRequestError, UnauthorizedError, NotFoundError } from '../lib/errors.js';
import { asyncHandler } from '../lib/asyncHandler.js';

// Wrap route handlers with asyncHandler
router.post('/example', asyncHandler(async (req, res) => {
  // Throw specific errors - they'll be caught and handled automatically
  if (!req.body.email) {
    throw new BadRequestError('Email is required');
  }
  
  const user = await findUser(req.body.email);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  res.json({ user });
}));
```

## Available Error Classes

| Error Class | Status Code | Use Case |
|------------|-------------|----------|
| `BadRequestError` | 400 | Invalid input, missing required fields |
| `UnauthorizedError` | 401 | Authentication failures, invalid credentials |
| `ForbiddenError` | 403 | Insufficient permissions |
| `NotFoundError` | 404 | Resource doesn't exist |
| `ConflictError` | 409 | Duplicate entries, conflicts |
| `ValidationError` | 400 | Form validation with field details |
| `DatabaseError` | 500 | Database operation failures |
| `ExternalServiceError` | 503 | Azure, OpenAI, email service errors |
| `FileUploadError` | 400 | File upload issues |
| `EmailServiceError` | 503 | Email sending failures |
| `AIServiceError` | 503 | AI service errors |

## Common Patterns

### 1. Input Validation
```typescript
if (!topicId) {
  throw new BadRequestError('Topic ID is required');
}

if (!Array.isArray(questions) || questions.length === 0) {
  throw new BadRequestError('No questions provided for import');
}
```

### 2. Resource Not Found
```typescript
const user = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
if (!user.length) {
  throw new NotFoundError('User not found');
}
```

### 3. Authentication Errors
```typescript
if (!user) {
  throw new UnauthorizedError('Invalid email or password');
}

if (user.status !== 'active') {
  throw new UnauthorizedError('Account is inactive');
}
```

### 4. Duplicate Resources
```typescript
const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
if (existing.length) {
  throw new ConflictError('Email already registered');
}
```

### 5. External Service Errors
```typescript
try {
  await sendOtpEmail(email, otp);
} catch (e) {
  console.error('Send OTP email error:', e);
  await redis.del(key);
  throw new EmailServiceError('Failed to send OTP email. Please try again later.');
}
```

### 6. AI Service Errors
```typescript
if (!isOpenAIAvailable()) {
  throw new AIServiceError('AI service is not configured. Please contact your administrator.');
}

try {
  const result = await extractQuestionsFromFile(req.file);
} catch (error) {
  if (error instanceof Error && error.message.includes('OpenAI')) {
    throw new AIServiceError('AI service is currently unavailable. Please try again later.');
  }
  throw new AIServiceError('Failed to extract questions from the uploaded file');
}
```

### 7. File Upload Errors
```typescript
if (!req.file) {
  throw new FileUploadError('No file uploaded. Please select a file to upload.');
}

try {
  const { url, blobName } = await uploadToAzure(req.file.buffer, req.file.originalname, req.file.mimetype);
} catch (error) {
  if (error instanceof Error && error.message.includes('Azure')) {
    throw new ExternalServiceError('azure', 'Failed to upload file to Azure Storage. Please try again.');
  }
  throw new FileUploadError('Failed to upload file');
}
```

### 8. Database Errors
```typescript
try {
  const stats = await db.select({ count: sql<number>`count(*)` }).from(subjects);
  res.json({ totalSubjects: Number(stats[0]?.count || 0) });
} catch (error) {
  console.error('Dashboard stats error:', error);
  throw new DatabaseError('Failed to fetch dashboard statistics');
}
```

## Best Practices

### 1. Always Use asyncHandler
Wrap all async route handlers with `asyncHandler` to automatically catch errors:

```typescript
// ✅ Good
router.post('/example', asyncHandler(async (req, res) => {
  throw new BadRequestError('Something went wrong');
}));

// ❌ Bad - errors won't be caught
router.post('/example', async (req, res) => {
  throw new BadRequestError('Something went wrong');
});
```

### 2. Provide Clear, Actionable Messages
```typescript
// ✅ Good - tells user what to do
throw new BadRequestError('Email is required. Please provide a valid email address.');

// ❌ Bad - too generic
throw new BadRequestError('Invalid input');
```

### 3. Log Before Throwing
```typescript
try {
  await externalService.call();
} catch (error) {
  console.error('External service error:', error); // Log for debugging
  throw new ExternalServiceError('service-name', 'User-friendly message');
}
```

### 4. Don't Expose Sensitive Information
```typescript
// ✅ Good - generic message in production
throw new UnauthorizedError('Invalid email or password');

// ❌ Bad - reveals which field is wrong
throw new UnauthorizedError('Email not found');
```

### 5. Use Specific Error Classes
```typescript
// ✅ Good - specific error class
throw new ConflictError('Email already registered');

// ❌ Bad - generic error
throw new Error('Email already registered');
```

## Error Response Examples

### Simple Error
```json
{
  "error": "Invalid email or password",
  "message": "Invalid email or password"
}
```

### Validation Error with Details
```json
{
  "error": "Validation failed",
  "message": "The provided data is invalid",
  "details": {
    "email": ["Invalid email format"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

### External Service Error
```json
{
  "error": "AI service is currently unavailable. Please try again later.",
  "service": "openai"
}
```

## Testing Error Handling

### Manual Testing
1. Test with invalid inputs
2. Test with missing required fields
3. Test with expired tokens
4. Test with duplicate entries
5. Test with non-existent resources

### Example Test Cases
```typescript
// Test invalid input
POST /api/auth/register
Body: { email: "invalid" }
Expected: 400 BadRequestError

// Test duplicate entry
POST /api/auth/register
Body: { email: "existing@example.com", ... }
Expected: 409 ConflictError

// Test not found
GET /api/users/non-existent-id
Expected: 404 NotFoundError

// Test unauthorized
POST /api/protected-route
Headers: { Authorization: "Bearer invalid-token" }
Expected: 401 UnauthorizedError
```

## Migration Checklist

When updating existing routes:

- [ ] Import error classes and asyncHandler
- [ ] Wrap route handler with asyncHandler
- [ ] Replace `res.status(4xx).json()` with `throw new ErrorClass()`
- [ ] Replace `res.status(5xx).json()` with `throw new ErrorClass()`
- [ ] Add try-catch for external service calls
- [ ] Provide clear, user-friendly error messages
- [ ] Test all error scenarios
- [ ] Check diagnostics for TypeScript errors

## Common Mistakes to Avoid

### 1. Forgetting asyncHandler
```typescript
// ❌ Wrong - error won't be caught
router.post('/example', async (req, res) => {
  throw new BadRequestError('Error');
});

// ✅ Correct
router.post('/example', asyncHandler(async (req, res) => {
  throw new BadRequestError('Error');
}));
```

### 2. Mixing Error Styles
```typescript
// ❌ Wrong - inconsistent
router.post('/example', asyncHandler(async (req, res) => {
  if (!input) return res.status(400).json({ error: 'Bad input' });
  throw new BadRequestError('Another error');
}));

// ✅ Correct - consistent
router.post('/example', asyncHandler(async (req, res) => {
  if (!input) throw new BadRequestError('Bad input');
  if (!valid) throw new BadRequestError('Another error');
}));
```

### 3. Not Logging Errors
```typescript
// ❌ Wrong - no logging
throw new ExternalServiceError('service', 'Failed');

// ✅ Correct - log before throwing
console.error('Service error:', error);
throw new ExternalServiceError('service', 'Failed');
```

## Need Help?

- Check `apps/api/src/lib/errors.ts` for all available error classes
- Check `apps/api/src/middleware/errorHandler.ts` for error handling logic
- Look at updated routes for examples: `auth.ts`, `question-extract.ts`, `upload.ts`
