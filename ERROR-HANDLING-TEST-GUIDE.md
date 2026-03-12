# Error Handling Testing Guide

## Quick Test Commands

Use these curl commands or Postman to test the new error handling:

### 1. Test Registration Errors

**Missing Email:**
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","password":"Test123!"}'
```
Expected: 400 - "Invalid registration data"

**Duplicate Email:**
```bash
# First register a user
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"Test123!","role":"student"}'

# Try to register again with same email
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test2","email":"test@example.com","password":"Test123!","role":"student"}'
```
Expected: 409 - "Email already registered"

### 2. Test Login Errors

**Invalid Credentials:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@example.com","password":"wrongpass"}'
```
Expected: 401 - "Invalid email or password"

**Missing Password:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```
Expected: 400 - "Invalid login credentials"

### 3. Test File Upload Errors

**No File:**
```bash
curl -X POST http://localhost:4000/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Expected: 400 - "No file uploaded. Please select a file to upload."

**Invalid File Type:**
```bash
curl -X POST http://localhost:4000/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.txt"
```
Expected: 400 - "Invalid file type. Only JPG, PNG, GIF, PDF, DOC, and DOCX files are allowed."

### 4. Test AI Service Errors

**AI Not Configured:**
```bash
# Remove OPENAI_API_KEY from .env first
curl -X POST http://localhost:4000/api/ai/generate-questions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"topicName":"Math","count":3}'
```
Expected: 503 - "AI question generation is not configured. Please contact your administrator."

### 5. Test Question Extraction Errors

**No File:**
```bash
curl -X POST http://localhost:4000/api/question-extract/upload \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Expected: 400 - "No file uploaded. Please select a file to upload."

**Missing Topic ID:**
```bash
curl -X POST http://localhost:4000/api/question-extract/bulk-import \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"questions":[]}'
```
Expected: 400 - "No questions provided for import"

### 6. Test Authentication Token Errors

**No Token:**
```bash
curl -X GET http://localhost:4000/api/auth/me
```
Expected: 401 - "Authentication required"

**Invalid Token:**
```bash
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer invalid_token"
```
Expected: 401 - "Your authentication token is invalid. Please log in again."

**Expired Token:**
```bash
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer EXPIRED_TOKEN"
```
Expected: 401 - "Your session has expired. Please log in again."

## Frontend Testing

### Test in Browser Console

```javascript
// Test registration error
fetch('http://localhost:4000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Test' }) // Missing email
})
.then(r => r.json())
.then(console.log);

// Test login error
fetch('http://localhost:4000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'wrong@test.com', password: 'wrong' })
})
.then(r => r.json())
.then(console.log);
```

## Expected Error Response Format

### Simple Error
```json
{
  "error": "Invalid email or password",
  "message": "Invalid email or password"
}
```

### Validation Error
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

## Automated Testing Script

Create a file `test-errors.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:4000"

echo "Testing Error Handling..."
echo ""

echo "1. Test missing email in registration:"
curl -s -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","password":"Test123!"}' | jq

echo ""
echo "2. Test invalid login:"
curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@test.com","password":"wrong"}' | jq

echo ""
echo "3. Test no auth token:"
curl -s -X GET $API_URL/api/auth/me | jq

echo ""
echo "All tests completed!"
```

Run with: `bash test-errors.sh`

## Manual Testing Checklist

- [ ] Registration with missing fields
- [ ] Registration with duplicate email
- [ ] Login with wrong credentials
- [ ] Login with inactive account
- [ ] File upload without file
- [ ] File upload with invalid type
- [ ] File upload exceeding size limit
- [ ] AI generation without API key
- [ ] Question extraction without file
- [ ] Bulk import without topic ID
- [ ] API calls without auth token
- [ ] API calls with invalid token
- [ ] API calls with expired token
- [ ] Database connection errors
- [ ] Redis connection errors (stop Redis and test)

## Monitoring Error Logs

Watch the API logs while testing:

```bash
cd apps/api
npm run dev
```

Look for:
- Error messages in the console
- Stack traces (in development mode)
- Request details (path, method, body)
- Proper error status codes

## Success Criteria

✅ No generic "internal server error" messages
✅ All errors return appropriate HTTP status codes
✅ Error messages are clear and actionable
✅ Validation errors include field details
✅ External service errors are handled gracefully
✅ Logs contain detailed error information
✅ No sensitive information exposed in production
✅ API continues to run after errors

## Common Issues

### Issue: API crashes on error
**Solution:** Make sure all route handlers use `asyncHandler`

### Issue: Generic error messages still appearing
**Solution:** Check that specific error classes are being thrown, not generic `Error`

### Issue: Stack traces in production
**Solution:** Verify `NODE_ENV=production` is set

### Issue: Redis errors crashing the app
**Solution:** Check that Redis error handling is in place in `socket.ts` and `redis.ts`
