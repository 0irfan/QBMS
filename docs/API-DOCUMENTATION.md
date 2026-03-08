# QBMS API Documentation

Complete API reference for the Question Bank Management System.

**Base URL**: `http://localhost:8080/api` (development) or `https://yourdomain.com/api` (production)

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token lifecycle
- Access token expires in 1 hour
- Refresh token expires in 7 days
- Use `/api/auth/refresh` to get a new access token

## Endpoints

### Authentication

#### POST /api/auth/register
Register a new user (Step 1: Send OTP)

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "student",
  "inviteToken": "optional-for-instructor"
}
```

**Response:**
```json
{
  "message": "OTP sent to your email",
  "email": "john@example.com"
}
```

#### POST /api/auth/register/verify-otp
Register a new user (Step 2: Verify OTP and create account)

**Request:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "name": "John Doe",
  "password": "SecurePass123!",
  "role": "student"
}
```

**Response:**
```json
{
  "message": "Account created. Please log in."
}
```

#### POST /api/auth/login
Login with email and password

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "user": {
    "userId": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  },
  "accessToken": "jwt-token",
  "expiresIn": 3600
}
```

#### POST /api/auth/refresh
Refresh access token

**Request:**
```json
{
  "refreshToken": "refresh-token"
}
```
Or send refresh token in cookie.

**Response:**
```json
{
  "accessToken": "new-jwt-token",
  "expiresIn": 3600
}
```

#### POST /api/auth/logout
Logout (requires authentication)

**Response:**
```json
{
  "ok": true
}
```

#### GET /api/auth/me
Get current user info (requires authentication)

**Response:**
```json
{
  "userId": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "student",
  "status": "active"
}
```

#### POST /api/auth/forgot-password
Request password reset

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "message": "If the email exists, a reset link has been sent."
}
```

#### POST /api/auth/reset-password
Reset password with token

**Request:**
```json
{
  "token": "reset-token-from-email",
  "password": "NewSecurePass123!"
}
```

**Response:**
```json
{
  "message": "Password updated"
}
```

---

### Subjects

#### GET /api/subjects
List all subjects

**Response:**
```json
[
  {
    "subjectId": "uuid",
    "subjectName": "Mathematics",
    "description": "Advanced mathematics"
  }
]
```

#### GET /api/subjects/:id
Get subject by ID

**Response:**
```json
{
  "subjectId": "uuid",
  "subjectName": "Mathematics",
  "description": "Advanced mathematics"
}
```

#### POST /api/subjects
Create subject (instructor/admin only)

**Request:**
```json
{
  "subjectName": "Mathematics",
  "description": "Advanced mathematics"
}
```

**Response:**
```json
{
  "subjectId": "uuid",
  "subjectName": "Mathematics",
  "description": "Advanced mathematics"
}
```

#### PATCH /api/subjects/:id
Update subject (instructor/admin only)

**Request:**
```json
{
  "subjectName": "Advanced Mathematics",
  "description": "Updated description"
}
```

#### DELETE /api/subjects/:id
Delete subject (instructor/admin only)

**Response:** 204 No Content

---

### Topics

#### GET /api/topics
List topics (optionally filter by subjectId)

**Query params:**
- `subjectId` (optional): Filter by subject

**Response:**
```json
[
  {
    "topicId": "uuid",
    "subjectId": "uuid",
    "topicName": "Calculus"
  }
]
```

#### POST /api/topics
Create topic (instructor/admin only)

**Request:**
```json
{
  "subjectId": "uuid",
  "topicName": "Calculus"
}
```

---

### Questions

#### GET /api/questions
List questions (optionally filter by topicId)

**Query params:**
- `topicId` (optional): Filter by topic

**Response:**
```json
[
  {
    "questionId": "uuid",
    "topicId": "uuid",
    "questionText": "What is 2+2?",
    "type": "mcq",
    "difficulty": "easy",
    "marks": 1,
    "createdBy": "uuid",
    "version": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "options": [
      {
        "optionId": "uuid",
        "optionText": "3",
        "isCorrect": false
      },
      {
        "optionId": "uuid",
        "optionText": "4",
        "isCorrect": true
      }
    ]
  }
]
```

#### GET /api/questions/:id
Get question by ID with options

#### POST /api/questions
Create question (instructor/admin only)

**Request:**
```json
{
  "topicId": "uuid",
  "questionText": "What is 2+2?",
  "type": "mcq",
  "difficulty": "easy",
  "marks": 1,
  "options": [
    { "optionText": "3", "isCorrect": false },
    { "optionText": "4", "isCorrect": true },
    { "optionText": "5", "isCorrect": false }
  ]
}
```

**Types:** `mcq`, `short`, `essay`  
**Difficulty:** `easy`, `medium`, `hard`

#### PATCH /api/questions/:id
Update question (instructor/admin only)

#### DELETE /api/questions/:id
Delete question (instructor/admin only)

---

### Classes

#### GET /api/classes
List classes
- Instructors: see their classes
- Students: see enrolled classes
- Admin: see all classes

**Response:**
```json
[
  {
    "classId": "uuid",
    "instructorId": "uuid",
    "subjectId": "uuid",
    "className": "Math 101",
    "enrollmentCode": "ABC123",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /api/classes
Create class (instructor/admin only)

**Request:**
```json
{
  "subjectId": "uuid",
  "className": "Math 101"
}
```

**Response includes auto-generated `enrollmentCode`**

#### POST /api/classes/enroll
Enroll in class (student only)

**Request:**
```json
{
  "enrollmentCode": "ABC123"
}
```

---

### Exams

#### GET /api/exams
List exams
- Students: see exams from enrolled classes
- Instructors/Admin: see all exams (optionally filter by classId)

**Query params:**
- `classId` (optional): Filter by class

**Response:**
```json
[
  {
    "examId": "uuid",
    "classId": "uuid",
    "title": "Midterm Exam",
    "totalMarks": 100,
    "timeLimit": 60,
    "status": "active",
    "scheduledAt": "2024-01-15T10:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

**Status:** `draft`, `scheduled`, `active`, `completed`

#### GET /api/exams/:id
Get exam details with question IDs

#### GET /api/exams/:id/with-questions
Get exam with full question text and options (for taking exam)

**Response:**
```json
{
  "examId": "uuid",
  "title": "Midterm Exam",
  "totalMarks": 100,
  "timeLimit": 60,
  "questions": [
    {
      "examQuestionId": "uuid",
      "questionId": "uuid",
      "questionOrder": 0,
      "questionText": "What is 2+2?",
      "type": "mcq",
      "marks": 1,
      "options": [
        { "optionId": "uuid", "optionText": "3", "isCorrect": false },
        { "optionId": "uuid", "optionText": "4", "isCorrect": true }
      ]
    }
  ]
}
```

#### POST /api/exams
Create exam (instructor/admin only)

**Request:**
```json
{
  "classId": "uuid",
  "title": "Midterm Exam",
  "totalMarks": 100,
  "timeLimit": 60,
  "scheduledAt": "2024-01-15T10:00:00Z",
  "questionIds": ["uuid1", "uuid2", "uuid3"]
}
```

#### PATCH /api/exams/:id
Update exam (instructor/admin only)

**Request:**
```json
{
  "title": "Updated Title",
  "status": "active",
  "questionIds": ["uuid1", "uuid2"]
}
```

#### DELETE /api/exams/:id
Delete exam (instructor/admin only)

---

### Exam Attempts

#### GET /api/attempts
List attempts
- Students: see their own attempts
- Instructors/Admin: see all attempts (optionally filter by examId)

**Query params:**
- `examId` (optional): Filter by exam

#### POST /api/attempts/start
Start exam attempt (student only)

**Request:**
```json
{
  "examId": "uuid"
}
```

**Response:**
```json
{
  "attemptId": "uuid",
  "examId": "uuid",
  "studentId": "uuid",
  "startedAt": "2024-01-15T10:00:00Z",
  "status": "in_progress"
}
```

#### GET /api/attempts/:id
Get attempt details with responses

**Response:**
```json
{
  "attemptId": "uuid",
  "examId": "uuid",
  "studentId": "uuid",
  "startedAt": "2024-01-15T10:00:00Z",
  "submittedAt": null,
  "status": "in_progress",
  "responses": [
    {
      "responseId": "uuid",
      "questionId": "uuid",
      "answerText": "4",
      "selectedOptionId": "uuid",
      "isCorrect": true,
      "marksObtained": 1,
      "questionText": "What is 2+2?",
      "options": [...]
    }
  ],
  "result": null
}
```

#### POST /api/attempts/:id/responses
Save answer for a question (student only, during exam)

**Request:**
```json
{
  "questionId": "uuid",
  "selectedOptionId": "uuid",
  "answerText": "Optional text answer"
}
```

**Response:**
```json
{
  "ok": true
}
```

#### POST /api/attempts/:id/submit
Submit exam attempt (student only)

**Response:**
```json
{
  "totalScore": 85,
  "percentage": 85.00,
  "grade": "B"
}
```

#### GET /api/attempts/:id/result
Get exam result

**Response:**
```json
{
  "resultId": "uuid",
  "attemptId": "uuid",
  "totalScore": 85,
  "percentage": "85.00",
  "grade": "B",
  "generatedAt": "2024-01-15T11:30:00Z"
}
```

---

### Paper Generation

#### POST /api/paper/generate
Generate question paper from bank (instructor/admin only)

**Request:**
```json
{
  "subjectId": "uuid",
  "topicIds": ["uuid1", "uuid2"],
  "totalMarks": 100,
  "difficulty": {
    "easy": 30,
    "medium": 50,
    "hard": 20
  }
}
```

**Response:**
```json
{
  "questions": [
    {
      "questionId": "uuid",
      "questionText": "...",
      "type": "mcq",
      "difficulty": "easy",
      "marks": 2,
      "options": [...]
    }
  ],
  "totalMarks": 100,
  "distribution": {
    "easy": 30,
    "medium": 50,
    "hard": 20
  }
}
```

---

### AI Question Generation

#### POST /api/ai/generate-questions
Generate questions using AI (instructor/admin only, requires OPENAI_API_KEY)

**Request:**
```json
{
  "topicId": "uuid",
  "type": "mcq",
  "difficulty": "medium",
  "count": 5,
  "marks": 2
}
```

**Response:**
```json
{
  "questions": [
    {
      "questionId": "uuid",
      "questionText": "AI generated question",
      "type": "mcq",
      "difficulty": "medium",
      "marks": 2,
      "options": [...]
    }
  ]
}
```

---

### Analytics

#### GET /api/analytics/instructor
Instructor analytics (instructor/admin only)

**Response:**
```json
{
  "totalClasses": 5,
  "totalExams": 20,
  "totalAttempts": 150,
  "averageScore": 75.5
}
```

#### GET /api/analytics/student
Student analytics (student only)

**Response:**
```json
{
  "totalAttempts": 10,
  "averageScore": 82.3,
  "highestScore": 95,
  "lowestScore": 65
}
```

---

### Invites

#### POST /api/invites/instructor
Invite instructor (admin only)

**Request:**
```json
{
  "email": "instructor@example.com"
}
```

**Response:**
```json
{
  "inviteId": "uuid",
  "email": "instructor@example.com",
  "token": "invite-token",
  "expiresAt": "2024-01-08T00:00:00Z"
}
```

---

### Health

#### GET /health
API health check

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### GET /health/db
Database health check

#### GET /health/redis
Redis health check

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message"
}
```

### Common HTTP status codes

- `200` - Success
- `201` - Created
- `204` - No Content (successful deletion)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., email already exists)
- `423` - Locked (account locked due to failed login attempts)
- `500` - Internal Server Error

---

## Rate Limiting

- Login endpoint: 5 requests per 15 minutes per IP
- Other endpoints: 100 requests per 15 minutes per IP

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## WebSocket (Real-time features)

Connect to: `ws://localhost:8080` or `wss://yourdomain.com`

### Events

#### exam:timer
Real-time exam timer updates

**Payload:**
```json
{
  "attemptId": "uuid",
  "remainingSeconds": 3540
}
```

---

## Testing

Use the provided test script:

```bash
npm run test:api
```

Or test manually with curl:

```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@qbms.local","password":"Admin@123"}'

# Get subjects (with token)
curl http://localhost:8080/api/subjects \
  -H "Authorization: Bearer YOUR_TOKEN"
```
