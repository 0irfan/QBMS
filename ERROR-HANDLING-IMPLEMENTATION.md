# Error Handling Implementation

## Overview
Comprehensive error handling has been implemented across the QBMS API to provide clear, actionable error messages instead of generic "internal server error" responses.

## Error Classes

### Base Error Class
- `AppError`: Base class for all application errors with statusCode and operational flag

### Specific Error Classes
- `BadRequestError` (400): Invalid request data or parameters
- `UnauthorizedError` (401): Authentication failures
- `ForbiddenError` (403): Authorization failures
- `NotFoundError` (404): Resource not found
- `ConflictError` (409): Duplicate resources
- `ValidationError` (400): Data validation failures with field details
- `DatabaseError` (500): Database operation failures
- `ExternalServiceError` (503): External service failures (Azure, OpenAI, etc.)
- `FileUploadError` (400): File upload issues
- `EmailServiceError` (503): Email sending failures
- `AIServiceError` (503): AI service errors

## Implementation

### Routes Updated
1. **Authentication Routes** (`apps/api/src/routes/auth.ts`)
   - Registration with OTP validation
   - Login with account lockout
   - Token refresh
   - Password reset

2. **Question Extraction** (`apps/api/src/routes/question-extract.ts`)
   - File upload validation
   - AI extraction errors
   - Bulk import errors

3. **File Upload** (`apps/api/src/routes/upload.ts`)
   - Azure Storage errors
   - File type validation
   - File size limits

4. **Analytics** (`apps/api/src/routes/analytics.ts`)
   - Database query errors

5. **AI Generation** (`apps/api/src/routes/ai.ts`)
   - OpenAI service errors
   - Response validation

### Error Handler Middleware
Enhanced `apps/api/src/middleware/errorHandler.ts` to:
- Log detailed error information
- Handle Zod validation errors with field details
- Provide user-friendly messages
- Include stack traces in development mode
- Handle Redis connection errors gracefully
- Distinguish between operational and system errors

### Socket Error Handling
Updated `apps/api/src/socket.ts` to:
- Silently handle Redis connection errors
- Continue operation without Redis for non-critical features

## Error Response Format

### Standard Error Response
```json
{
  "error": "Error type",
  "message": "User-friendly error message"
}
```

### Validation Error Response
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

### External Service Error Response
```json
{
  "error": "AI service error",
  "message": "AI service is currently unavailable. Please try again later.",
  "service": "openai"
}
```

## Error Messages by Category

### Authentication Errors
- "Invalid email or password"
- "Account locked due to multiple failed login attempts. Please try again later."
- "Your session has expired. Please log in again."
- "Invalid or expired invite token"
- "Email already registered"

### File Upload Errors
- "No file uploaded. Please select a file to upload."
- "Invalid file type. Only PDF and images (PNG, JPEG) are allowed."
- "The uploaded file exceeds the maximum size limit of 10MB"
- "Failed to upload file to Azure Storage. Please try again."

### AI Service Errors
- "AI service is currently unavailable. Please try again later."
- "AI service returned an empty response. Please try again."
- "AI service returned invalid data. Please try again."
- "AI question generation is not configured. Please contact your administrator."

### Database Errors
- "A record with this information already exists"
- "The referenced resource does not exist"
- "The requested resource was not found"
- "Failed to fetch dashboard statistics"

### Email Service Errors
- "Failed to send OTP email. Please try again later."

## Benefits

1. **User Experience**: Clear, actionable error messages help users understand what went wrong
2. **Debugging**: Detailed logging helps developers identify and fix issues quickly
3. **Security**: Sensitive information is not exposed in production error messages
4. **Consistency**: All errors follow the same format across the API
5. **Maintainability**: Centralized error handling makes it easy to update error messages

## Usage Example

### Before (Generic Error)
```typescript
res.status(500).json({ error: 'Internal server error' });
```

### After (Specific Error)
```typescript
throw new EmailServiceError('Failed to send OTP email. Please try again later.');
```

The error handler middleware automatically:
- Sets the correct HTTP status code (503)
- Formats the response consistently
- Logs the error details
- Includes service information if applicable

## Testing

To test error handling:

1. **Invalid Login**: Try logging in with wrong credentials
2. **File Upload**: Upload an invalid file type
3. **Expired Token**: Use an expired JWT token
4. **Duplicate Entry**: Try registering with an existing email
5. **Missing Fields**: Submit forms with missing required fields

## Future Enhancements

1. Add error codes for programmatic error handling
2. Implement error tracking service integration (Sentry, etc.)
3. Add rate limiting error messages
4. Implement retry logic for transient errors
5. Add localization support for error messages
