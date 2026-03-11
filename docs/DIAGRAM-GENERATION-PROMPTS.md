# QBMS Diagram Generation Prompts

Complete collection of prompts for generating all essential diagrams for the Question Bank Management System (QBMS) project documentation.

## Table of Contents

1. [Use Case Diagram](#use-case-diagram)
2. [Entity Relationship Diagram (ERD)](#entity-relationship-diagram-erd)
3. [System Architecture Diagram](#system-architecture-diagram)
4. [Data Flow Diagrams (DFD)](#data-flow-diagrams-dfd)
5. [Class Diagram](#class-diagram)
6. [Sequence Diagrams](#sequence-diagrams)
7. [Activity Diagram](#activity-diagram)
8. [Network Architecture Diagram](#network-architecture-diagram)
9. [Deployment Diagram](#deployment-diagram)
10. [Component Diagram](#component-diagram)

---

## Use Case Diagram

### Prompt for Use Case Diagram Generation

```
Create a comprehensive Use Case diagram for a Question Bank Management System (QBMS) with the following specifications:

**System Context:**
- Educational web application for exam management
- Supports online question banking and automated assessment
- Integrates AI for question generation
- Cloud-deployed with modern architecture

**Actors:**
1. Super Administrator (top left)
2. Instructor (top center) 
3. Student (top right)

**External Systems:**
4. OpenAI API (bottom left)
5. Email System (bottom center)
6. Azure Storage (bottom right)

**Use Cases for Super Administrator:**
- Manage Users (create, edit, delete, activate/deactivate)
- System Configuration (settings, parameters, integrations)
- View System Analytics (usage statistics, performance metrics)
- Manage Instructor Invitations
- Monitor System Health
- Generate System Reports
- Configure AI Settings
- Manage System Backups

**Use Cases for Instructor:**
- Create Questions (MCQ, True/False, Short Answer, Essay)
- Manage Question Bank (edit, delete, categorize questions)
- Generate Questions with AI
- Create Subjects and Topics
- Manage Classes (create, configure, monitor)
- Enroll Students (invite, add, remove students)
- Create Exams (manual and AI-assisted)
- Schedule Examinations
- Monitor Exam Progress
- Grade Exams (automatic and manual)
- Generate Performance Reports
- View Student Analytics
- Upload Question Files
- Export Question Banks

**Use Cases for Student:**
- Take Online Exams
- View Exam Results
- Access Study Materials
- Enroll in Classes (via invitation)
- View Performance History
- Download Result Certificates
- Submit Exam Answers
- View Exam Timer
- Resume Interrupted Exams

**Shared Use Cases (all actors):**
- Login/Logout
- Manage Profile
- Change Password
- View Notifications
- Access Help/Support
- Update Personal Information
- View Audit Logs (role-specific)

**System Integration Use Cases:**
- Generate AI Questions (Instructor → OpenAI API)
- Send Email Notifications (System → Email Service)
- Store Files (System → Azure Storage)
- Authenticate Users (All → System)
- Cache Data (System → Redis)

**System Boundary:** Draw a rectangle labeled "QBMS - Question Bank Management System"

**Relationships:**
- Use <<include>> for Login/Logout (required for all other use cases)
- Use <<extend>> for "Generate with AI" extending "Create Questions"
- Use <<extend>> for "Auto-Grade" extending "Grade Exams"
- Use <<extend>> for "Resume Exam" extending "Take Online Exams"
- Use <<extend>> for "Export Results" extending "View Performance Reports"

**Permissions and Restrictions:**
- Super Admin: Full system access, can perform all use cases
- Instructor: Cannot manage other instructors, limited to own content
- Student: Read-only access, can only interact with assigned content

**Visual Requirements:**
- Use stick figures for human actors
- Use rectangles for system actors
- Use ovals for use cases
- Use solid lines for associations
- Use dashed lines with arrows for include/extend relationships
- Color code: Blue for admin functions, Green for instructor functions, Orange for student functions, Purple for shared functions
- Add system boundary box around all use cases
- Include multiplicity where relevant
- Show actor inheritance if applicable
```

---

## Entity Relationship Diagram (ERD)

### Prompt for ERD Generation

```
Create a detailed Entity Relationship Diagram (ERD) for QBMS with the following entities and relationships:

**Database Design Context:**
- PostgreSQL database with UUID primary keys
- Supports ACID transactions and referential integrity
- Optimized for educational data management
- Includes audit trails and soft deletes where applicable

**Entities and Attributes:**

1. **Users**
   - id (PK, UUID, NOT NULL)
   - email (UNIQUE, NOT NULL, VARCHAR(255))
   - password (NOT NULL, VARCHAR(255), bcrypt hashed)
   - role (ENUM: super_admin, instructor, student, NOT NULL)
   - name (NOT NULL, VARCHAR(255))
   - verified (BOOLEAN, DEFAULT false)
   - avatar_url (VARCHAR(500), NULLABLE)
   - last_login (TIMESTAMP, NULLABLE)
   - created_at (TIMESTAMP, DEFAULT NOW())
   - updated_at (TIMESTAMP, DEFAULT NOW())

2. **Subjects**
   - id (PK, UUID, NOT NULL)
   - name (NOT NULL, VARCHAR(255))
   - description (TEXT, NULLABLE)
   - code (VARCHAR(50), UNIQUE, NULLABLE)
   - is_active (BOOLEAN, DEFAULT true)
   - created_by (FK to Users, NOT NULL)
   - created_at (TIMESTAMP, DEFAULT NOW())
   - updated_at (TIMESTAMP, DEFAULT NOW())

3. **Topics**
   - id (PK, UUID, NOT NULL)
   - name (NOT NULL, VARCHAR(255))
   - description (TEXT, NULLABLE)
   - subject_id (FK to Subjects, NOT NULL)
   - order_index (INTEGER, DEFAULT 0)
   - is_active (BOOLEAN, DEFAULT true)
   - created_by (FK to Users, NOT NULL)
   - created_at (TIMESTAMP, DEFAULT NOW())
   - updated_at (TIMESTAMP, DEFAULT NOW())

4. **Questions**
   - id (PK, UUID, NOT NULL)
   - text (TEXT, NOT NULL)
   - type (ENUM: mcq, true_false, short_answer, essay, NOT NULL)
   - options (JSONB, NULLABLE)
   - correct_answer (TEXT, NOT NULL)
   - difficulty (ENUM: easy, medium, hard, NOT NULL)
   - subject_id (FK to Subjects, NOT NULL)
   - topic_id (FK to Topics, NOT NULL)
   - explanation (TEXT, NULLABLE)
   - marks (INTEGER, DEFAULT 1)
   - time_limit (INTEGER, NULLABLE, seconds)
   - is_ai_generated (BOOLEAN, DEFAULT false)
   - usage_count (INTEGER, DEFAULT 0)
   - created_by (FK to Users, NOT NULL)
   - created_at (TIMESTAMP, DEFAULT NOW())
   - updated_at (TIMESTAMP, DEFAULT NOW())

5. **Classes**
   - id (PK, UUID, NOT NULL)
   - name (NOT NULL, VARCHAR(255))
   - description (TEXT, NULLABLE)
   - code (VARCHAR(50), UNIQUE, NOT NULL)
   - instructor_id (FK to Users, NOT NULL)
   - max_students (INTEGER, DEFAULT 100)
   - is_active (BOOLEAN, DEFAULT true)
   - created_at (TIMESTAMP, DEFAULT NOW())
   - updated_at (TIMESTAMP, DEFAULT NOW())

6. **Class_Students** (Junction Table)
   - id (PK, UUID, NOT NULL)
   - class_id (FK to Classes, NOT NULL)
   - student_id (FK to Users, NOT NULL)
   - enrolled_at (TIMESTAMP, DEFAULT NOW())
   - status (ENUM: active, inactive, suspended, DEFAULT active)
   - UNIQUE(class_id, student_id)

7. **Exams**
   - id (PK, UUID, NOT NULL)
   - title (NOT NULL, VARCHAR(255))
   - description (TEXT, NULLABLE)
   - instructions (TEXT, NULLABLE)
   - class_id (FK to Classes, NOT NULL)
   - duration (INTEGER, NOT NULL, minutes)
   - total_marks (INTEGER, NOT NULL)
   - passing_marks (INTEGER, NULLABLE)
   - scheduled_at (TIMESTAMP, NOT NULL)
   - ends_at (TIMESTAMP, NOT NULL)
   - is_published (BOOLEAN, DEFAULT false)
   - allow_review (BOOLEAN, DEFAULT true)
   - shuffle_questions (BOOLEAN, DEFAULT false)
   - created_by (FK to Users, NOT NULL)
   - created_at (TIMESTAMP, DEFAULT NOW())
   - updated_at (TIMESTAMP, DEFAULT NOW())

8. **Exam_Questions** (Junction Table)
   - id (PK, UUID, NOT NULL)
   - exam_id (FK to Exams, NOT NULL)
   - question_id (FK to Questions, NOT NULL)
   - marks (INTEGER, NOT NULL)
   - order_number (INTEGER, NOT NULL)
   - is_required (BOOLEAN, DEFAULT true)
   - UNIQUE(exam_id, question_id)

9. **Attempts**
   - id (PK, UUID, NOT NULL)
   - exam_id (FK to Exams, NOT NULL)
   - student_id (FK to Users, NOT NULL)
   - started_at (TIMESTAMP, NOT NULL)
   - submitted_at (TIMESTAMP, NULLABLE)
   - score (DECIMAL(5,2), NULLABLE)
   - total_marks (INTEGER, NOT NULL)
   - percentage (DECIMAL(5,2), NULLABLE)
   - status (ENUM: in_progress, submitted, expired, graded, NOT NULL)
   - time_taken (INTEGER, NULLABLE, seconds)
   - ip_address (VARCHAR(45), NULLABLE)
   - user_agent (TEXT, NULLABLE)
   - UNIQUE(exam_id, student_id)

10. **Answers**
    - id (PK, UUID, NOT NULL)
    - attempt_id (FK to Attempts, NOT NULL)
    - question_id (FK to Questions, NOT NULL)
    - answer_text (TEXT, NULLABLE)
    - selected_options (JSONB, NULLABLE)
    - is_correct (BOOLEAN, NULLABLE)
    - marks_earned (DECIMAL(5,2), DEFAULT 0)
    - time_spent (INTEGER, NULLABLE, seconds)
    - created_at (TIMESTAMP, DEFAULT NOW())
    - updated_at (TIMESTAMP, DEFAULT NOW())
    - UNIQUE(attempt_id, question_id)

11. **Files**
    - id (PK, UUID, NOT NULL)
    - filename (NOT NULL, VARCHAR(255))
    - original_name (NOT NULL, VARCHAR(255))
    - file_path (NOT NULL, VARCHAR(500))
    - file_size (INTEGER, NOT NULL, bytes)
    - mime_type (VARCHAR(100), NOT NULL)
    - storage_type (ENUM: local, azure_blob, NOT NULL)
    - uploaded_by (FK to Users, NOT NULL)
    - created_at (TIMESTAMP, DEFAULT NOW())

12. **Audit_Logs**
    - id (PK, UUID, NOT NULL)
    - user_id (FK to Users, NULLABLE)
    - action (VARCHAR(100), NOT NULL)
    - entity_type (VARCHAR(50), NOT NULL)
    - entity_id (UUID, NULLABLE)
    - old_values (JSONB, NULLABLE)
    - new_values (JSONB, NULLABLE)
    - ip_address (VARCHAR(45), NULLABLE)
    - user_agent (TEXT, NULLABLE)
    - created_at (TIMESTAMP, DEFAULT NOW())

**Relationships:**
- Users (1) → (M) Subjects (created_by)
- Users (1) → (M) Topics (created_by)
- Users (1) → (M) Questions (created_by)
- Users (1) → (M) Classes (instructor_id)
- Users (1) → (M) Exams (created_by)
- Users (1) → (M) Attempts (student_id)
- Users (1) → (M) Files (uploaded_by)
- Users (1) → (M) Audit_Logs (user_id)
- Subjects (1) → (M) Topics
- Subjects (1) → (M) Questions
- Topics (1) → (M) Questions
- Classes (M) ↔ (M) Users (Students) via Class_Students
- Classes (1) → (M) Exams
- Exams (M) ↔ (M) Questions via Exam_Questions
- Exams (1) → (M) Attempts
- Attempts (1) → (M) Answers
- Questions (1) → (M) Answers

**Indexes for Performance:**
- idx_users_email ON users(email)
- idx_users_role ON users(role)
- idx_questions_subject_topic ON questions(subject_id, topic_id)
- idx_questions_difficulty ON questions(difficulty)
- idx_questions_type ON questions(type)
- idx_exams_class_scheduled ON exams(class_id, scheduled_at)
- idx_attempts_student_exam ON attempts(student_id, exam_id)
- idx_attempts_status ON attempts(status)
- idx_class_students_class ON class_students(class_id)
- idx_class_students_student ON class_students(student_id)
- idx_audit_logs_user_action ON audit_logs(user_id, action)

**Visual Requirements:**
- Use rectangles for entities
- Use diamonds for relationships
- Show cardinality (1, M, 1:1, 1:M, M:M)
- Underline primary keys
- Use dashed underline for foreign keys
- Use different line styles for different relationship types
- Color code entities by domain:
  - Users & Auth: Blue
  - Content Management: Green  
  - Assessment: Orange
  - System: Purple
- Include entity attributes with data types
- Show relationship names and constraints
- Use crow's foot notation for cardinality
```

---

## System Architecture Diagram

### Prompt for System Architecture Diagram

```
Create a comprehensive System Architecture diagram for QBMS showing a modern 3-tier architecture:

**Architecture Overview:**
- Cloud-native application deployed on Azure
- Containerized microservices architecture
- Scalable and secure design
- Modern web technologies stack

**Presentation Layer (Top Tier):**
- **Client Devices:**
  - Web Browsers (Chrome, Firefox, Safari, Edge)
  - Mobile Devices (Tablets, Smartphones)
  - Desktop Applications (Responsive Web App)

- **Frontend Technologies:**
  - Next.js 14 Frontend Application (React 18, TypeScript)
  - Tailwind CSS Styling Framework
  - Zustand State Management
  - React Query for API State
  - Progressive Web App (PWA) Features
  - Responsive Design Components
  - Real-time WebSocket Connections

**Business Logic Layer (Middle Tier):**
- **API Gateway & Load Balancer:**
  - Nginx Reverse Proxy
  - SSL/TLS Termination
  - Rate Limiting & Security Headers
  - Static File Serving
  - Gzip Compression

- **Application Services:**
  - Express.js API Server (Node.js 18, TypeScript)
  - Authentication Middleware (JWT, bcrypt)
  - Authorization Middleware (Role-based access)
  - Business Logic Controllers
  - Data Validation Layer
  - Error Handling Middleware
  - Audit Logging Service
  - WebSocket Server (Real-time features)

- **Background Services:**
  - Email Queue Processing
  - File Processing Service
  - Analytics Aggregation
  - Backup Services
  - Health Check Monitoring

**Data Layer (Bottom Tier):**
- **Primary Database:**
  - PostgreSQL 15 (Primary data storage)
  - Connection Pooling
  - Read Replicas (if needed)
  - Automated Backups

- **Caching Layer:**
  - Redis 7 (Session management, caching)
  - Query Result Caching
  - Session Storage
  - Rate Limiting Data

- **File Storage:**
  - Azure Blob Storage (Primary file storage)
  - Local File System (Fallback)
  - CDN Integration
  - Automatic File Optimization

**External Integrations (Side Components):**
- **AI Services:**
  - OpenAI GPT API (Question generation)
  - Content Analysis
  - Natural Language Processing

- **Communication Services:**
  - SendGrid SMTP (Email notifications)
  - SMS Gateway (Optional)
  - Push Notifications

- **Cloud Services:**
  - Azure Virtual Machine (Hosting)
  - Azure Blob Storage (File storage)
  - Azure Monitor (Logging & Monitoring)
  - GitHub Container Registry (Image storage)

**Security Layer (Cross-cutting):**
- **Authentication & Authorization:**
  - JWT Token Management
  - OAuth 2.0 Integration (Future)
  - Multi-Factor Authentication (Future)
  - Session Management

- **Security Measures:**
  - SSL/TLS Certificates (Let's Encrypt)
  - Input Validation & Sanitization
  - SQL Injection Prevention
  - XSS Protection
  - CSRF Protection
  - Rate Limiting
  - Firewall Rules (UFW)

**Communication Protocols:**
- HTTPS/TLS 1.3 (Client ↔ API Gateway)
- WebSocket (Real-time features)
- REST API (JSON over HTTPS)
- Database Connections (Encrypted TCP)
- SMTP/TLS (Email communications)

**Deployment Infrastructure:**
- **Containerization:**
  - Docker Containers
  - Docker Compose Orchestration
  - Multi-stage Builds
  - Health Checks

- **CI/CD Pipeline:**
  - GitHub Actions
  - Automated Testing
  - Security Scanning
  - Automated Deployment
  - Rollback Capabilities

- **Monitoring & Logging:**
  - Application Performance Monitoring
  - Error Tracking & Alerting
  - Log Aggregation
  - Health Check Endpoints
  - Resource Usage Monitoring

**Visual Requirements:**
- Use layered boxes for architectural tiers
- Show data flow with labeled arrows
- Use different colors for each layer:
  - Presentation: Blue
  - Business Logic: Green
  - Data: Orange
  - External: Purple
  - Security: Red
- Include technology logos where appropriate
- Show network protocols on connections
- Add security shields for security components
- Use cloud symbols for external services
- Include load balancing and scaling indicators
- Show backup and disaster recovery paths
```

---

## Data Flow Diagrams (DFD)

### Context Level DFD (Level 0) Prompt

```
Create a Context Level Data Flow Diagram (Level 0) for QBMS:

**System Context:**
- High-level view of system interactions
- Shows external entities and their data exchanges
- Focuses on system boundaries and external interfaces

**Central Process:** 
- Large circle labeled "QBMS - Question Bank Management System"
- Represents the entire system as a single process

**External Entities:**
1. **Student** (left side)
   - Represents all student users
   - Primary system users for taking exams

2. **Instructor** (top)
   - Represents teaching staff
   - Content creators and exam administrators

3. **Super Administrator** (right side)
   - System administrators
   - Highest level of system access

4. **Email System** (bottom left)
   - External email service (SendGrid)
   - Handles all email communications

5. **AI Service** (bottom right)
   - OpenAI GPT API
   - Provides AI-powered question generation

6. **File Storage Service** (bottom center)
   - Azure Blob Storage
   - External file storage and management

**Data Flows:**

**From Student to System:**
- Login Credentials
- Exam Responses & Answers
- Profile Update Requests
- Class Enrollment Requests
- File Uploads (assignments)

**From System to Student:**
- Exam Questions & Instructions
- Results & Feedback
- Performance Analytics
- Notifications & Alerts
- Study Materials

**From Instructor to System:**
- Questions & Content Creation
- Exam Configurations & Scheduling
- Class Management Data
- Student Enrollment Actions
- Performance Report Requests
- AI Question Generation Requests

**From System to Instructor:**
- Student Performance Data
- Analytics & Reports
- System Notifications
- Generated Questions (AI)
- Class Statistics

**From Super Admin to System:**
- System Configuration Commands
- User Management Actions
- Security Policy Updates
- System Monitoring Requests
- Backup & Maintenance Commands

**From System to Super Admin:**
- System Health Reports
- User Activity Logs
- Performance Metrics
- Security Audit Reports
- System Status Updates

**From/To Email System:**
- Verification Email Requests
- Notification Messages
- Password Reset Tokens
- Exam Reminders
- System Alerts

**From/To AI Service:**
- Question Generation Requests
- Content Analysis Requests
- Generated Questions & Content
- AI Processing Results

**From/To File Storage:**
- File Upload Requests
- File Retrieval Requests
- Stored Files & Documents
- File Metadata

**Visual Requirements:**
- Use circles for external entities
- Use one large circle for the central system
- Use labeled arrows for data flows
- Keep arrows straight and clearly labeled
- Use consistent colors:
  - Human actors: Blue
  - System actors: Green
  - Data flows: Black arrows with labels
- Maintain symmetrical layout
- Include data flow descriptions
- Show bidirectional flows where applicable
```

### Level 1 DFD Prompt

```
Create a Level 1 Data Flow Diagram showing internal QBMS processes:

**System Decomposition:**
Break down the main system into major functional processes

**Processes (numbered circles):**
1. **User Authentication & Authorization**
   - Handles login, logout, password management
   - Manages user sessions and security

2. **Question Management**
   - Question creation, editing, deletion
   - Question categorization and organization
   - AI-powered question generation

3. **Exam Management**
   - Exam creation and configuration
   - Exam scheduling and publishing
   - Question paper generation

4. **Assessment Processing**
   - Online exam delivery
   - Answer collection and validation
   - Automatic grading and scoring

5. **Class Administration**
   - Class creation and management
   - Student enrollment and tracking
   - Instructor assignments

6. **Analytics & Reporting**
   - Performance data analysis
   - Report generation and visualization
   - Statistical computations

7. **File Management**
   - File upload and storage
   - File retrieval and serving
   - Storage optimization

8. **Notification System**
   - Email notification processing
   - Alert generation and delivery
   - Communication management

**Data Stores (open rectangles):**
D1: **Users Database**
    - User accounts, profiles, authentication data

D2: **Questions Database**
    - Question bank, metadata, categorization

D3: **Exams Database**
    - Exam configurations, schedules, settings

D4: **Classes Database**
    - Class information, enrollments, assignments

D5: **Attempts Database**
    - Exam attempts, answers, scores

D6: **Files Storage**
    - Uploaded files, documents, media

D7: **Audit Logs**
    - System activity logs, security events

D8: **Cache Storage**
    - Session data, temporary data, performance cache

**External Entities:**
- Student
- Instructor
- Super Admin
- Email Service
- AI Service
- File Storage Service

**Data Flows Between Processes and Stores:**

**Authentication Process (1):**
- Reads from D1 (Users Database)
- Writes to D8 (Cache Storage) for sessions
- Writes to D7 (Audit Logs) for security events

**Question Management Process (2):**
- Reads/Writes D2 (Questions Database)
- Reads D1 (Users Database) for permissions
- Writes D7 (Audit Logs) for changes
- Exchanges data with AI Service

**Exam Management Process (3):**
- Reads/Writes D3 (Exams Database)
- Reads D2 (Questions Database) for question selection
- Reads D4 (Classes Database) for class assignments
- Writes D7 (Audit Logs)

**Assessment Processing Process (4):**
- Reads D3 (Exams Database) for exam data
- Reads/Writes D5 (Attempts Database)
- Reads D2 (Questions Database) for questions
- Writes D7 (Audit Logs)

**Class Administration Process (5):**
- Reads/Writes D4 (Classes Database)
- Reads D1 (Users Database) for user data
- Writes D7 (Audit Logs)

**Analytics & Reporting Process (6):**
- Reads D5 (Attempts Database) for performance data
- Reads D3 (Exams Database) for exam metadata
- Reads D4 (Classes Database) for class data
- Uses D8 (Cache Storage) for computed results

**File Management Process (7):**
- Reads/Writes D6 (Files Storage)
- Exchanges data with File Storage Service
- Writes D7 (Audit Logs)

**Notification System Process (8):**
- Reads D1 (Users Database) for contact info
- Exchanges data with Email Service
- Writes D7 (Audit Logs)

**Inter-Process Data Flows:**
- Process 1 → Process 2,3,4,5,6,7,8 (Authentication tokens)
- Process 2 → Process 3 (Question data for exams)
- Process 3 → Process 4 (Exam configurations)
- Process 4 → Process 6 (Assessment results)
- Process 5 → Process 8 (Enrollment notifications)
- Process 6 → Process 8 (Report notifications)

**Visual Requirements:**
- Number processes 1-8 in circles
- Use open rectangles for data stores (D1-D8)
- Use consistent symbols and notation
- Label all data flows clearly
- Show data stores with appropriate labels
- Use colors to group related processes:
  - Core Functions: Blue (1,2,3,4,5)
  - Support Functions: Green (6,7,8)
  - Data Stores: Orange
- Include process names and descriptions
- Show data flow directions with arrows
- Maintain clear, readable layout
```

---

## Class Diagram

### Prompt for UML Class Diagram

```
Create a detailed UML Class Diagram for QBMS with comprehensive class relationships:

**Design Patterns Used:**
- Inheritance for User types
- Factory pattern for Question creation
- Observer pattern for real-time updates
- Repository pattern for data access

**Core Classes:**

**1. User Class Hierarchy (Abstract Base Class):**
```
<<abstract>> User
-----------------
- id: string
- email: string  
- password: string
- role: UserRole
- name: string
- verified: boolean
- avatarUrl: string
- lastLogin: Date
- createdAt: Date
- updatedAt: Date
-----------------
+ authenticate(password: string): boolean
+ updateProfile(data: UserData): void
+ resetPassword(newPassword: string): void
+ sendVerificationEmail(): void
+ getPermissions(): Permission[]
+ isActive(): boolean
# hashPassword(password: string): string
# validateEmail(email: string): boolean
```

**2. Inherited User Classes:**
```
SuperAdmin extends User
-----------------
- systemAccess: SystemAccess[]
-----------------
+ manageUsers(): void
+ configureSystem(config: SystemConfig): void
+ viewSystemAnalytics(): AnalyticsData
+ generateSystemReports(): Report[]
+ manageBackups(): void
+ auditSystemLogs(): AuditLog[]

Instructor extends User
-----------------
- subjects: Subject[]
- classes: Class[]
- totalStudents: number
-----------------
+ createQuestion(data: QuestionData): Question
+ createExam(data: ExamData): Exam
+ manageClass(classId: string): void
+ gradeExam(attemptId: string): void
+ viewStudentAnalytics(studentId: string): Analytics
+ generateQuestionWithAI(prompt: string): Question
+ exportQuestionBank(): File

Student extends User
-----------------
- enrolledClasses: Class[]
- attempts: Attempt[]
- totalScore: number
- averageScore: number
-----------------
+ takeExam(examId: string): Attempt
+ viewResults(attemptId: string): ExamResult
+ enrollInClass(classCode: string): void
+ getPerformanceHistory(): Performance[]
+ downloadCertificate(attemptId: string): File
```

**3. Core Domain Classes:**
```
Question
-----------------
- id: string
- text: string
- type: QuestionType
- options: string[]
- correctAnswer: string
- difficulty: DifficultyLevel
- subjectId: string
- topicId: string
- explanation: string
- marks: number
- timeLimit: number
- isAIGenerated: boolean
- usageCount: number
- createdBy: string
- createdAt: Date
- updatedAt: Date
-----------------
+ validate(): ValidationResult
+ checkAnswer(answer: string): boolean
+ calculateMarks(answer: string): number
+ updateUsageCount(): void
+ clone(): Question
+ export(): QuestionData
+ getStatistics(): QuestionStats

Subject
-----------------
- id: string
- name: string
- description: string
- code: string
- isActive: boolean
- topics: Topic[]
- questions: Question[]
- createdBy: string
-----------------
+ addTopic(topic: Topic): void
+ removeTopic(topicId: string): void
+ getQuestionCount(): number
+ getTopicCount(): number
+ activate(): void
+ deactivate(): void

Topic
-----------------
- id: string
- name: string
- description: string
- subjectId: string
- orderIndex: number
- isActive: boolean
- questions: Question[]
-----------------
+ addQuestion(question: Question): void
+ removeQuestion(questionId: string): void
+ getQuestionsByDifficulty(level: DifficultyLevel): Question[]
+ reorder(newIndex: number): void

Class
-----------------
- id: string
- name: string
- description: string
- code: string
- instructorId: string
- maxStudents: number
- isActive: boolean
- students: Student[]
- exams: Exam[]
- createdAt: Date
-----------------
+ enrollStudent(student: Student): void
+ removeStudent(studentId: string): void
+ createExam(examData: ExamData): Exam
+ getStudentCount(): number
+ getAverageScore(): number
+ generateClassReport(): ClassReport

Exam
-----------------
- id: string
- title: string
- description: string
- instructions: string
- classId: string
- duration: number
- totalMarks: number
- passingMarks: number
- scheduledAt: Date
- endsAt: Date
- isPublished: boolean
- allowReview: boolean
- shuffleQuestions: boolean
- questions: ExamQuestion[]
- attempts: Attempt[]
- createdBy: string
-----------------
+ addQuestion(question: Question, marks: number): void
+ removeQuestion(questionId: string): void
+ generatePaper(criteria: GenerationCriteria): void
+ publish(): void
+ unpublish(): void
+ startExam(studentId: string): Attempt
+ getStatistics(): ExamStatistics
+ isAvailable(): boolean
+ getTimeRemaining(): number

ExamQuestion
-----------------
- examId: string
- questionId: string
- marks: number
- orderNumber: number
- isRequired: boolean
-----------------
+ getQuestion(): Question
+ updateMarks(marks: number): void
+ reorder(newOrder: number): void

Attempt
-----------------
- id: string
- examId: string
- studentId: string
- startedAt: Date
- submittedAt: Date
- score: number
- totalMarks: number
- percentage: number
- status: AttemptStatus
- timeTaken: number
- ipAddress: string
- userAgent: string
- answers: Answer[]
-----------------
+ submitAnswer(questionId: string, answer: string): void
+ calculateScore(): number
+ submitAttempt(): void
+ getTimeRemaining(): number
+ getProgress(): number
+ canResume(): boolean
+ autoSubmit(): void

Answer
-----------------
- id: string
- attemptId: string
- questionId: string
- answerText: string
- selectedOptions: string[]
- isCorrect: boolean
- marksEarned: number
- timeSpent: number
- createdAt: Date
- updatedAt: Date
-----------------
+ validate(): boolean
+ calculateMarks(): number
+ isAnswered(): boolean
+ getFormattedAnswer(): string
```

**4. Service Classes:**
```
AuthenticationService
-----------------
- jwtSecret: string
- tokenExpiry: number
-----------------
+ login(email: string, password: string): AuthResult
+ logout(token: string): void
+ generateTokens(user: User): TokenPair
+ validateToken(token: string): User
+ refreshToken(refreshToken: string): TokenPair
+ resetPassword(email: string): void

QuestionService
-----------------
- aiClient: OpenAIClient
- repository: QuestionRepository
-----------------
+ createQuestion(data: QuestionData): Question
+ generateWithAI(prompt: string): Question[]
+ searchQuestions(criteria: SearchCriteria): Question[]
+ validateQuestion(question: Question): ValidationResult
+ bulkImport(file: File): ImportResult

ExamService
-----------------
- questionService: QuestionService
- repository: ExamRepository
-----------------
+ createExam(data: ExamData): Exam
+ generateQuestionPaper(criteria: Criteria): Question[]
+ scheduleExam(examId: string, schedule: Schedule): void
+ startExam(examId: string, studentId: string): Attempt
+ submitExam(attemptId: string): ExamResult

AnalyticsService
-----------------
- dataProcessor: DataProcessor
- reportGenerator: ReportGenerator
-----------------
+ generateStudentReport(studentId: string): StudentReport
+ generateClassReport(classId: string): ClassReport
+ generateSystemReport(): SystemReport
+ getPerformanceMetrics(): Metrics[]
+ exportAnalytics(format: ExportFormat): File
```

**5. Utility and Helper Classes:**
```
FileManager
-----------------
- storageProvider: StorageProvider
- allowedTypes: string[]
- maxFileSize: number
-----------------
+ uploadFile(file: File): UploadResult
+ deleteFile(fileId: string): void
+ getFileUrl(fileId: string): string
+ validateFile(file: File): ValidationResult

EmailService
-----------------
- smtpClient: SMTPClient
- templates: EmailTemplate[]
-----------------
+ sendVerificationEmail(user: User): void
+ sendPasswordReset(user: User, token: string): void
+ sendExamNotification(student: Student, exam: Exam): void
+ sendResultNotification(student: Student, result: ExamResult): void

CacheManager
-----------------
- redisClient: RedisClient
- defaultTTL: number
-----------------
+ get<T>(key: string): T | null
+ set<T>(key: string, value: T, ttl?: number): void
+ delete(key: string): void
+ clear(): void
+ exists(key: string): boolean
```

**Enumerations:**
```
enum UserRole {
    SUPER_ADMIN,
    INSTRUCTOR,
    STUDENT
}

enum QuestionType {
    MCQ,
    TRUE_FALSE,
    SHORT_ANSWER,
    ESSAY
}

enum DifficultyLevel {
    EASY,
    MEDIUM,
    HARD
}

enum AttemptStatus {
    IN_PROGRESS,
    SUBMITTED,
    EXPIRED,
    GRADED
}
```

**Relationships:**
- User ←→ Question (1:M, created_by)
- User ←→ Class (1:M, instructor)
- User ←→ Attempt (1:M, student)
- Class ←→ Student (M:M, enrollment)
- Subject ←→ Topic (1:M, composition)
- Subject ←→ Question (1:M, categorization)
- Topic ←→ Question (1:M, categorization)
- Exam ←→ Question (M:M, exam_questions)
- Exam ←→ Attempt (1:M, exam_attempts)
- Attempt ←→ Answer (1:M, composition)
- Question ←→ Answer (1:M, reference)

**Design Pattern Implementations:**
- Factory: QuestionFactory for creating different question types
- Observer: ExamObserver for real-time exam monitoring
- Repository: UserRepository, QuestionRepository, ExamRepository
- Service Layer: AuthenticationService, ExamService, AnalyticsService
- Singleton: CacheManager, EmailService

**Visual Requirements:**
- Use UML class notation (3 sections per class)
- Show inheritance with hollow triangular arrows
- Show composition with filled diamond arrows
- Show aggregation with hollow diamond arrows
- Show associations with simple lines
- Include multiplicity (1, *, 0..1, 1..*)
- Use + for public, - for private, # for protected
- Color code by domain:
  - User Management: Blue
  - Content Management: Green
  - Assessment: Orange
  - Services: Purple
  - Utilities: Gray
- Group related classes in packages
- Show interface implementations where applicable
- Include stereotypes (<<abstract>>, <<interface>>, <<enum>>)
```

---
## Sequence Diagrams

### User Authentication Sequence Diagram Prompt

```
Create a UML Sequence Diagram for User Authentication in QBMS:

**Scenario:** User login process with JWT token generation

**Participants (left to right):**
1. **User** (Actor)
2. **Web Browser** (Client)
3. **Frontend App** (Next.js)
4. **API Gateway** (Nginx)
5. **Auth Service** (Express.js)
6. **User Repository** (Data Access)
7. **Database** (PostgreSQL)
8. **Cache** (Redis)
9. **Email Service** (SendGrid)

**Main Success Flow:**

1. User → Browser: Enter credentials (email, password)
2. Browser → Frontend: Submit login form
3. Frontend → API Gateway: POST /api/auth/login {email, password}
4. API Gateway → Auth Service: Forward request with headers
5. Auth Service → Auth Service: Validate input format
6. Auth Service → User Repository: findByEmail(email)
7. User Repository → Database: SELECT * FROM users WHERE email = ?
8. Database → User Repository: User record (if exists)
9. User Repository → Auth Service: User object or null

**Authentication Logic:**
10. Auth Service → Auth Service: bcrypt.compare(password, hashedPassword)
11. Auth Service → Auth Service: Generate JWT access token (15min expiry)
12. Auth Service → Auth Service: Generate refresh token (7 days expiry)
13. Auth Service → Cache: Store refresh token with user ID
14. Cache → Auth Service: Confirmation

**Response Flow:**
15. Auth Service → API Gateway: {user: userData, accessToken, refreshToken}
16. API Gateway → Frontend: Authentication response
17. Frontend → Browser: Store tokens in localStorage/cookies
18. Browser → Frontend: Redirect to dashboard
19. Frontend → User: Display dashboard

**Alternative Flows:**

**Alt 1: Invalid Credentials (after step 9)**
- Auth Service → Auth Service: Password validation fails
- Auth Service → API Gateway: 401 Unauthorized {error: "Invalid credentials"}
- API Gateway → Frontend: Error response
- Frontend → User: Display error message

**Alt 2: User Not Found (after step 8)**
- Database → User Repository: Empty result
- User Repository → Auth Service: null
- Auth Service → API Gateway: 404 Not Found {error: "User not found"}
- API Gateway → Frontend: Error response
- Frontend → User: Display error message

**Alt 3: Account Not Verified (after step 9)**
- Auth Service → Auth Service: Check user.verified = false
- Auth Service → Email Service: Send verification email
- Email Service → Auth Service: Email sent confirmation
- Auth Service → API Gateway: 403 Forbidden {error: "Account not verified"}
- API Gateway → Frontend: Verification required response
- Frontend → User: Show verification message

**Alt 4: Account Locked (security feature)**
- Auth Service → Cache: Check failed login attempts
- Cache → Auth Service: Attempt count > threshold
- Auth Service → API Gateway: 423 Locked {error: "Account temporarily locked"}
- API Gateway → Frontend: Account locked response
- Frontend → User: Display lockout message

**Security Considerations:**
- Rate limiting at API Gateway level
- Password hash verification using bcrypt
- JWT token with short expiry time
- Refresh token rotation for enhanced security
- Failed login attempt tracking
- IP address logging for audit

**Performance Optimizations:**
- Database connection pooling
- Redis caching for session data
- Async/await for non-blocking operations
- Connection reuse for external services

**Visual Requirements:**
- Use lifelines for each participant
- Show activation boxes for processing time
- Use solid arrows for synchronous calls
- Use dashed arrows for return messages
- Add notes for important security validations
- Show alternative flows with alt/opt frames
- Include timing constraints where relevant
- Use different colors for success/error flows
- Add sequence numbers for clarity
- Show parallel processing where applicable
```

### Exam Taking Sequence Diagram Prompt

```
Create a Sequence Diagram for Online Exam Taking Process in QBMS:

**Scenario:** Student taking an online examination with real-time features

**Participants:**
1. **Student** (Actor)
2. **Frontend** (Next.js App)
3. **WebSocket** (Real-time Connection)
4. **API Server** (Express.js)
5. **Exam Service** (Business Logic)
6. **Question Service** (Business Logic)
7. **Timer Service** (Background Service)
8. **Database** (PostgreSQL)
9. **Cache** (Redis)
10. **File Storage** (Azure Blob)

**Pre-conditions:**
- Student is authenticated and enrolled in class
- Exam is scheduled and published
- Student has not exceeded attempt limits

**Main Flow:**

**Exam Initialization:**
1. Student → Frontend: Click "Start Exam" button
2. Frontend → API Server: GET /api/exams/{examId}/details
3. API Server → Exam Service: validateExamAccess(examId, studentId)
4. Exam Service → Database: Check exam schedule, student enrollment
5. Database → Exam Service: Exam details and validation result
6. Exam Service → API Server: Exam metadata and permissions

**Exam Start Process:**
7. API Server → Frontend: Exam details {title, duration, instructions, questionCount}
8. Frontend → Student: Display exam instructions and confirmation
9. Student → Frontend: Confirm start exam
10. Frontend → API Server: POST /api/exams/{examId}/start
11. API Server → Exam Service: createAttempt(examId, studentId)
12. Exam Service → Database: INSERT INTO attempts (exam_id, student_id, started_at)
13. Database → Exam Service: Attempt ID and confirmation
14. Exam Service → Timer Service: initializeTimer(attemptId, duration)
15. Timer Service → Cache: Store timer data with expiry
16. Exam Service → Question Service: getExamQuestions(examId)
17. Question Service → Database: SELECT questions for exam
18. Database → Question Service: Question list with metadata

**Real-time Connection Setup:**
19. API Server → WebSocket: Establish connection for attempt
20. WebSocket → Frontend: Connection confirmed
21. API Server → Frontend: {attemptId, questions, timeRemaining}
22. Frontend → Student: Display first question with timer

**Question Answering Loop:**
23. Student → Frontend: Select/Enter answer
24. Frontend → API Server: POST /api/attempts/{attemptId}/answers
25. API Server → Exam Service: saveAnswer(attemptId, questionId, answer)
26. Exam Service → Database: INSERT/UPDATE answers table
27. Database → Exam Service: Save confirmation
28. Exam Service → Cache: Update attempt progress
29. API Server → WebSocket: Broadcast progress update
30. WebSocket → Frontend: Update progress indicator

**Auto-save Mechanism (Parallel):**
31. Frontend → Frontend: Auto-save timer (every 30 seconds)
32. Frontend → API Server: PUT /api/attempts/{attemptId}/auto-save
33. API Server → Cache: Store current state
34. Cache → API Server: Confirmation

**Navigation Between Questions:**
35. Student → Frontend: Click "Next Question"
36. Frontend → Frontend: Validate current answer (client-side)
37. Frontend → Student: Display next question
38. Repeat steps 23-30 for each question

**Timer Management (Continuous):**
39. Timer Service → Timer Service: Check remaining time
40. Timer Service → WebSocket: Send time updates (every minute)
41. WebSocket → Frontend: Update timer display
42. Frontend → Student: Show remaining time

**Exam Submission:**

**Manual Submission:**
43. Student → Frontend: Click "Submit Exam"
44. Frontend → Student: Show confirmation dialog
45. Student → Frontend: Confirm submission
46. Frontend → API Server: POST /api/attempts/{attemptId}/submit
47. API Server → Exam Service: submitAttempt(attemptId)
48. Exam Service → Database: UPDATE attempts SET submitted_at, status
49. Exam Service → Question Service: calculateScore(attemptId)
50. Question Service → Database: Calculate marks for each answer
51. Database → Question Service: Score calculation results
52. Question Service → Exam Service: Total score and percentage
53. Exam Service → Database: UPDATE attempts SET score, percentage
54. Database → Exam Service: Update confirmation

**Auto-submission (Time Expired):**
55. Timer Service → Timer Service: Time limit reached
56. Timer Service → API Server: POST /api/attempts/{attemptId}/auto-submit
57. API Server → Exam Service: autoSubmitAttempt(attemptId)
58. Exam Service → WebSocket: Notify frontend of auto-submission
59. WebSocket → Frontend: Display auto-submit notification
60. Continue with steps 48-54 for scoring

**Result Generation:**
61. Exam Service → Database: Get detailed results
62. Database → Exam Service: Attempt details with answers
63. Exam Service → API Server: Complete exam results
64. API Server → Frontend: {score, percentage, correctAnswers, explanations}
65. Frontend → Student: Display exam results

**File Handling (if applicable):**
66. Student → Frontend: Upload answer file (for essay questions)
67. Frontend → API Server: POST /api/files/upload
68. API Server → File Storage: Store file
69. File Storage → API Server: File URL
70. API Server → Database: Link file to answer
71. Database → API Server: Confirmation

**Alternative Flows:**

**Alt 1: Connection Lost**
- WebSocket connection drops
- Frontend → Frontend: Detect connection loss
- Frontend → API Server: Reconnect and sync state
- API Server → Cache: Retrieve saved state
- Cache → API Server: Current attempt data
- API Server → Frontend: Restore exam state
- Frontend → Student: Resume from last saved state

**Alt 2: Browser Refresh/Close**
- Frontend → Frontend: beforeunload event
- Frontend → API Server: Emergency save current state
- API Server → Cache: Store current answers
- Student → Frontend: Reload page
- Frontend → API Server: GET /api/attempts/{attemptId}/resume
- API Server → Cache: Retrieve saved state
- Frontend → Student: Resume exam

**Alt 3: Suspicious Activity Detection**
- Frontend → API Server: Report tab switch/window focus loss
- API Server → Database: Log suspicious activity
- API Server → WebSocket: Send warning to student
- WebSocket → Frontend: Display warning message
- Frontend → Student: Show academic integrity reminder

**Error Handling:**
- Network timeouts with retry mechanism
- Database connection failures with graceful degradation
- File upload failures with retry options
- Timer synchronization issues with server-side validation

**Visual Requirements:**
- Use lifelines for all participants
- Show activation boxes for processing periods
- Use solid arrows for synchronous calls
- Use dashed arrows for asynchronous responses
- Include loop frames for repetitive actions
- Show parallel activities with par frames
- Use alt frames for alternative scenarios
- Add notes for important business rules
- Color code different types of operations:
  - Blue: User interactions
  - Green: Data operations
  - Orange: Real-time communications
  - Red: Error handling
- Include timing annotations where relevant
- Show message parameters in brackets
```

### AI Question Generation Sequence Diagram Prompt

```
Create a Sequence Diagram for AI-Powered Question Generation in QBMS:

**Scenario:** Instructor using AI to generate questions for a specific topic

**Participants:**
1. **Instructor** (Actor)
2. **Frontend** (Next.js)
3. **API Server** (Express.js)
4. **AI Service** (Internal Service)
5. **OpenAI Client** (External API Client)
6. **OpenAI API** (External Service)
7. **Question Service** (Business Logic)
8. **Database** (PostgreSQL)
9. **Cache** (Redis)

**Pre-conditions:**
- Instructor is authenticated with question creation permissions
- OpenAI API key is configured and valid
- Subject and topic exist in the system

**Main Flow:**

**Request Initiation:**
1. Instructor → Frontend: Navigate to "Generate Questions with AI"
2. Frontend → API Server: GET /api/subjects/{subjectId}/topics
3. API Server → Database: Fetch available topics
4. Database → API Server: Topic list
5. API Server → Frontend: Available topics and subjects
6. Frontend → Instructor: Display AI generation form

**Parameter Selection:**
7. Instructor → Frontend: Select topic, difficulty, question count, type
8. Frontend → Frontend: Validate form inputs (client-side)
9. Instructor → Frontend: Click "Generate Questions"
10. Frontend → API Server: POST /api/questions/generate-ai

**Request Processing:**
11. API Server → AI Service: generateQuestions(parameters)
12. AI Service → AI Service: Validate generation parameters
13. AI Service → Cache: Check for cached similar requests
14. Cache → AI Service: Cache miss (or hit with cached data)

**OpenAI API Interaction:**
15. AI Service → OpenAI Client: Prepare API request
16. OpenAI Client → OpenAI Client: Build prompt with parameters
17. OpenAI Client → OpenAI API: POST /v1/chat/completions

**Prompt Structure:**
```
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "You are an expert educator creating exam questions..."
    },
    {
      "role": "user", 
      "content": "Generate 5 medium difficulty multiple choice questions about JavaScript Arrays..."
    }
  ],
  "temperature": 0.7,
  "max_tokens": 2000
}
```

18. OpenAI API → OpenAI Client: Generated content response
19. OpenAI Client → AI Service: Parsed question data

**Content Processing:**
20. AI Service → AI Service: Parse and validate generated content
21. AI Service → AI Service: Format questions according to system schema
22. AI Service → Question Service: validateGeneratedQuestions(questions)
23. Question Service → Question Service: Apply business rules validation
24. Question Service → AI Service: Validation results

**Database Storage:**
25. AI Service → Question Service: saveGeneratedQuestions(questions, metadata)
26. Question Service → Database: BEGIN TRANSACTION
27. Question Service → Database: INSERT INTO questions (multiple records)
28. Database → Question Service: Question IDs and confirmation
29. Question Service → Database: INSERT INTO audit_logs (AI generation event)
30. Database → Question Service: Audit confirmation
31. Question Service → Database: COMMIT TRANSACTION
32. Database → Question Service: Transaction success

**Caching and Response:**
33. Question Service → Cache: Store generated questions for future reference
34. Cache → Question Service: Cache confirmation
35. Question Service → AI Service: Saved questions with IDs
36. AI Service → API Server: Generation results
37. API Server → Frontend: Generated questions data
38. Frontend → Instructor: Display generated questions for review

**Question Review and Editing:**
39. Instructor → Frontend: Review generated questions
40. Instructor → Frontend: Edit question text/options (optional)
41. Frontend → API Server: PUT /api/questions/{questionId}
42. API Server → Question Service: updateQuestion(questionId, changes)
43. Question Service → Database: UPDATE questions SET ...
44. Database → Question Service: Update confirmation
45. Question Service → API Server: Updated question
46. API Server → Frontend: Confirmation
47. Frontend → Instructor: Show success message

**Bulk Operations:**
48. Instructor → Frontend: Select multiple questions for bulk actions
49. Frontend → Frontend: Show bulk action options (approve, delete, edit)
50. Instructor → Frontend: Choose bulk action
51. Frontend → API Server: POST /api/questions/bulk-action
52. API Server → Question Service: processBulkAction(questionIds, action)
53. Question Service → Database: Execute bulk operation
54. Database → Question Service: Bulk operation results
55. Question Service → API Server: Operation summary
56. API Server → Frontend: Bulk action results
57. Frontend → Instructor: Display operation summary

**Alternative Flows:**

**Alt 1: OpenAI API Error**
- OpenAI API → OpenAI Client: Error response (rate limit, invalid key, etc.)
- OpenAI Client → AI Service: API error details
- AI Service → AI Service: Log error and determine retry strategy
- AI Service → Cache: Check for fallback content
- Cache → AI Service: Fallback questions (if available)
- AI Service → API Server: Error response or fallback content
- API Server → Frontend: Error message or limited results
- Frontend → Instructor: Display error with retry option

**Alt 2: Content Validation Failure**
- AI Service → AI Service: Generated content fails validation
- AI Service → AI Service: Attempt content correction
- AI Service → OpenAI Client: Retry with refined prompt
- OpenAI Client → OpenAI API: Second generation attempt
- If still fails: AI Service → API Server: Validation error
- API Server → Frontend: Content quality error
- Frontend → Instructor: Suggest manual question creation

**Alt 3: Duplicate Question Detection**
- Question Service → Database: Check for similar existing questions
- Database → Question Service: Similar questions found
- Question Service → Question Service: Calculate similarity score
- If high similarity: Question Service → AI Service: Duplicate warning
- AI Service → API Server: Duplicate detection results
- API Server → Frontend: Show duplicate warnings
- Frontend → Instructor: Option to proceed or regenerate

**Alt 4: Rate Limiting**
- OpenAI Client → OpenAI API: Request exceeds rate limit
- OpenAI API → OpenAI Client: 429 Rate Limit Error
- OpenAI Client → AI Service: Rate limit notification
- AI Service → Cache: Store request for delayed processing
- AI Service → API Server: Rate limit response with retry time
- API Server → Frontend: Rate limit message
- Frontend → Instructor: Show retry countdown timer

**Performance Optimizations:**
- Request batching for multiple questions
- Caching of similar generation requests
- Async processing for large question sets
- Connection pooling for database operations
- Retry logic with exponential backoff

**Security Considerations:**
- API key encryption and secure storage
- Request validation and sanitization
- Rate limiting per user/organization
- Audit logging of all AI interactions
- Content filtering for inappropriate material

**Visual Requirements:**
- Use lifelines for all participants
- Show activation boxes for processing time
- Include loop frames for batch processing
- Use alt frames for error scenarios
- Show parallel processing where applicable
- Add notes for important business logic
- Color code by operation type:
  - Blue: User interactions
  - Green: AI processing
  - Orange: Database operations
  - Red: Error handling
- Include timing annotations for API calls
- Show message parameters and response formats
```

---

## Activity Diagram

### Prompt for Complete Exam Taking Activity Diagram

```
Create a comprehensive Activity Diagram for the Complete Exam Taking Process in QBMS:

**Diagram Scope:**
- End-to-end exam taking workflow
- Multiple decision points and parallel activities
- Error handling and recovery paths
- Time-based constraints and auto-submission

**Start State:**
- Student logs into QBMS system
- Initial state: "User Authenticated"

**Swim Lanes (Actors):**
1. **Student** - User actions and interactions
2. **System** - Automated system processes
3. **Timer Service** - Time management and countdown
4. **Database** - Data persistence operations

**Main Activity Flow:**

**Initial Navigation:**
1. **Start:** Student Dashboard
2. **Activity:** Navigate to Exams Section
3. **Activity:** View Available Exams List
4. **Decision:** Are there available exams?
   - **No:** Display "No exams available" → **End**
   - **Yes:** Continue to exam selection

**Exam Selection and Validation:**
5. **Activity:** Select Exam to Take
6. **Activity:** System validates exam access
7. **Decision:** Is student enrolled in exam class?
   - **No:** Display "Not enrolled" error → **End**
   - **Yes:** Continue validation
8. **Decision:** Is exam currently scheduled?
   - **No:** Display schedule information → **End**
   - **Yes:** Continue validation
9. **Decision:** Has student already taken this exam?
   - **Yes:** Display previous results → **End**
   - **No:** Continue to exam start

**Exam Initialization:**
10. **Activity:** Display exam instructions and rules
11. **Activity:** Show exam details (duration, questions, marks)
12. **Decision:** Student ready to start?
    - **No:** Return to exam list
    - **Yes:** Continue to start exam

**Exam Start Process:**
13. **Activity:** System creates exam attempt record
14. **Activity:** Initialize exam timer (parallel activity starts)
15. **Activity:** Load first question
16. **Activity:** Display question interface

**Parallel Activities Begin:**

**Timer Management (Continuous):**
- **Timer Service:** Start countdown timer
- **Timer Service:** Update remaining time every second
- **Timer Service:** Send periodic updates to frontend
- **Decision:** Time remaining > 0?
  - **Yes:** Continue countdown
  - **No:** Trigger auto-submission

**Question Answering Loop:**
17. **Activity:** Student reads question
18. **Activity:** Student selects/enters answer
19. **Decision:** Is answer format valid?
    - **No:** Display validation error → Return to step 18
    - **Yes:** Continue
20. **Activity:** System saves answer (auto-save)
21. **Activity:** Update progress indicator
22. **Decision:** Are there more questions?
    - **Yes:** Load next question → Return to step 17
    - **No:** Continue to submission options

**Navigation Controls (Parallel):**
- **Activity:** Student can navigate between questions
- **Activity:** Student can flag questions for review
- **Activity:** Student can view progress summary
- **Decision:** Student wants to review flagged questions?
  - **Yes:** Navigate to flagged question
  - **No:** Continue current flow

**Auto-Save Mechanism (Parallel):**
- **Activity:** System auto-saves answers every 30 seconds
- **Activity:** Store current state in cache
- **Activity:** Update attempt progress in database

**Exam Submission Process:**

**Manual Submission Path:**
23. **Activity:** Student clicks "Submit Exam"
24. **Activity:** System displays submission confirmation
25. **Decision:** Student confirms submission?
    - **No:** Return to exam → Continue answering
    - **Yes:** Continue to submission processing

**Auto-Submission Path (Time Expired):**
26. **Activity:** Timer reaches zero
27. **Activity:** System automatically submits exam
28. **Activity:** Display auto-submission notification

**Submission Processing (Both Paths Merge):**
29. **Activity:** System locks exam attempt
30. **Activity:** Calculate total score
31. **Activity:** Process each answer for correctness
32. **Activity:** Update attempt record with final score
33. **Activity:** Generate exam results

**Result Display:**
34. **Activity:** Display exam completion message
35. **Activity:** Show score and percentage
36. **Decision:** Allow answer review?
    - **Yes:** Display correct answers and explanations
    - **No:** Show only score
37. **Activity:** Generate result certificate (if passed)
38. **Activity:** Send result notification email
39. **End:** Exam completed successfully

**Error Handling and Recovery Paths:**

**Connection Lost Recovery:**
- **Activity:** Detect connection loss
- **Activity:** Store current state locally
- **Activity:** Attempt reconnection
- **Decision:** Connection restored?
  - **Yes:** Sync local state with server → Resume exam
  - **No:** Display offline mode → Continue local storage

**Browser Refresh/Close Recovery:**
- **Activity:** Detect page unload event
- **Activity:** Emergency save current state
- **Activity:** User returns to exam
- **Activity:** System detects existing attempt
- **Decision:** Can resume exam?
  - **Yes:** Restore previous state → Continue from last question
  - **No:** Display session expired → **End**

**Suspicious Activity Handling:**
- **Activity:** Monitor for tab switches/window focus loss
- **Activity:** Log suspicious behavior
- **Decision:** Behavior exceeds threshold?
  - **Yes:** Display academic integrity warning
  - **No:** Continue monitoring
- **Decision:** Continue with warnings?
  - **Yes:** Allow exam continuation with logged warnings
  - **No:** Force exam submission → End with integrity flag

**Technical Error Recovery:**
- **Activity:** System error occurs
- **Activity:** Log error details
- **Activity:** Attempt automatic recovery
- **Decision:** Recovery successful?
  - **Yes:** Resume normal operation
  - **No:** Display error message → Provide manual recovery options

**Concurrent Activities (Throughout Exam):**

**Security Monitoring:**
- Monitor for multiple browser tabs
- Track mouse/keyboard activity patterns
- Log IP address changes
- Detect copy/paste attempts

**Performance Monitoring:**
- Track response times
- Monitor system resource usage
- Log user interaction patterns
- Measure question completion times

**Data Synchronization:**
- Sync answers between client and server
- Maintain session state consistency
- Handle network interruptions gracefully
- Ensure data integrity throughout process

**Decision Points Summary:**
1. Available exams check
2. Student enrollment validation
3. Exam schedule validation
4. Previous attempt check
5. Student readiness confirmation
6. Answer format validation
7. More questions available
8. Review flagged questions
9. Manual submission confirmation
10. Allow answer review
11. Connection restoration check
12. Resume capability check
13. Suspicious activity threshold
14. Continue with warnings
15. Error recovery success

**End States:**
- **Success:** Exam completed and submitted
- **Error:** Various error conditions (not enrolled, time expired, technical issues)
- **Cancelled:** Student chose not to take exam
- **Suspended:** Academic integrity violation

**Visual Requirements:**
- Use rounded rectangles for activities
- Use diamonds for decision points
- Use parallel bars for concurrent activities
- Show swim lanes for different actors
- Use different colors for different types of activities:
  - Blue: Student actions
  - Green: System processes
  - Orange: Timer operations
  - Red: Error handling
- Include merge points where parallel paths rejoin
- Show loop indicators for repetitive processes
- Add notes for important business rules
- Use guard conditions on decision branches
- Include timing constraints where relevant
```

---

## Network Architecture Diagram

### Prompt for Network Architecture Diagram

```
Create a comprehensive Network Architecture Diagram for QBMS Production Deployment:

**Architecture Overview:**
- Cloud-native deployment on Azure infrastructure
- Multi-layered security with DMZ and internal networks
- Scalable and highly available design
- Modern containerized application stack

**Network Layers and Components:**

**Internet Layer (Public Network):**
- **End Users:**
  - Students accessing from various locations
  - Instructors working from home/office
  - Administrators with secure access
  - Mobile users on tablets/smartphones

- **DNS and CDN:**
  - Domain: qbms.pro (A record pointing to public IP)
  - DNS Resolution (Azure DNS or external provider)
  - Optional CDN for static assets (Azure CDN)
  - SSL Certificate management (Let's Encrypt)

- **Public IP Address:**
  - Static IP: 20.121.189.81
  - Assigned to Azure Virtual Machine
  - Firewall rules for port access

**DMZ (Demilitarized Zone):**
- **Load Balancer/Reverse Proxy:**
  - Nginx Reverse Proxy (Primary entry point)
  - SSL/TLS Termination (Port 443)
  - HTTP to HTTPS Redirect (Port 80)
  - Rate Limiting and DDoS Protection
  - Security Headers Implementation
  - Static File Serving and Caching
  - WebSocket Proxy Support

- **Security Components:**
  - Web Application Firewall (WAF) rules
  - Rate limiting per IP/endpoint
  - Geographic access controls (optional)
  - Bot detection and mitigation

**Application Network (Internal):**
- **Container Network (Docker Bridge):**
  - Network Name: qbms-network
  - Subnet: 172.18.0.0/16
  - Internal DNS resolution between containers
  - Isolated from host network for security

- **Application Containers:**
  - **Frontend Container (qbms-web):**
    - Internal IP: 172.18.0.2
    - Port: 3000 (internal only)
    - Next.js application server
    - Static asset serving
    
  - **Backend API Container (qbms-api):**
    - Internal IP: 172.18.0.3
    - Port: 3001 (internal only)
    - Express.js application server
    - WebSocket server for real-time features
    
  - **Nginx Container (qbms-nginx):**
    - Internal IP: 172.18.0.4
    - Ports: 80, 443 (exposed to host)
    - Reverse proxy configuration
    - SSL certificate management

**Data Network (Backend):**
- **Database Network:**
  - **PostgreSQL Container (qbms-postgres):**
    - Internal IP: 172.18.0.5
    - Port: 5432 (internal only)
    - Persistent volume for data storage
    - Automated backup configuration
    - Connection pooling support
    
  - **Redis Container (qbms-redis):**
    - Internal IP: 172.18.0.6
    - Port: 6379 (internal only)
    - In-memory data structure store
    - Session and cache management
    - Persistence configuration

**External Service Connections:**
- **OpenAI API Integration:**
  - HTTPS connections to api.openai.com
  - API key authentication
  - Rate limiting and retry logic
  - Secure credential storage

- **SendGrid SMTP Service:**
  - SMTP over TLS (Port 587)
  - API-based email sending
  - Webhook endpoints for delivery tracking
  - Bounce and spam handling

- **Azure Blob Storage:**
  - HTTPS connections to Azure storage endpoints
  - Shared Access Signature (SAS) authentication
  - Blob container: qbms
  - Automatic failover to local storage

- **GitHub Container Registry:**
  - HTTPS connections for image pulls
  - Authentication via GitHub tokens
  - Automated image updates via CI/CD
  - Image vulnerability scanning

**Security Network Configuration:**

**Host-Level Security (Azure VM):**
- **Operating System:** Ubuntu 22.04 LTS
- **Firewall (UFW) Rules:**
  - Allow SSH (Port 22) - Restricted to admin IPs
  - Allow HTTP (Port 80) - Public access
  - Allow HTTPS (Port 443) - Public access
  - Deny all other inbound traffic
  - Allow all outbound traffic (with monitoring)

- **Network Security Group (Azure):**
  - Inbound Rules:
    - SSH: Port 22, Source: Admin IP ranges
    - HTTP: Port 80, Source: Any
    - HTTPS: Port 443, Source: Any
  - Outbound Rules:
    - HTTPS: Port 443, Destination: Any (API calls)
    - SMTP: Port 587, Destination: SendGrid
    - DNS: Port 53, Destination: Any

**Container Security:**
- **Network Isolation:**
  - Containers communicate only through defined networks
  - No direct external access to database containers
  - API container acts as gateway for database access
  - Secrets management through environment variables

- **Port Exposure:**
  - Only Nginx container exposes ports to host
  - Internal container communication via Docker network
  - Database ports not exposed to host system
  - Health check endpoints for monitoring

**Monitoring and Logging Network:**
- **Log Aggregation:**
  - Container logs collected by Docker daemon
  - Centralized logging to host system
  - Log rotation and retention policies
  - Remote log shipping (optional)

- **Health Monitoring:**
  - Health check endpoints on all services
  - Container health monitoring
  - Resource usage tracking
  - Alert notifications for failures

**Backup and Disaster Recovery:**
- **Database Backups:**
  - Automated daily backups to Azure Blob Storage
  - Point-in-time recovery capability
  - Backup encryption and compression
  - Cross-region backup replication (optional)

- **Application Backups:**
  - Container image backups in registry
  - Configuration file backups
  - SSL certificate backups
  - Disaster recovery procedures

**Network Performance Optimization:**
- **Caching Strategy:**
  - Redis for application-level caching
  - Nginx for static file caching
  - Browser caching headers
  - CDN integration for global performance

- **Connection Optimization:**
  - HTTP/2 support for improved performance
  - Connection keep-alive settings
  - Gzip compression for text content
  - Image optimization and lazy loading

**Development and Staging Networks:**
- **Development Environment:**
  - Local Docker Compose setup
  - Separate network namespace
  - Mock external services for testing
  - Hot reload for development efficiency

- **Staging Environment (Optional):**
  - Separate Azure VM or container instance
  - Production-like configuration
  - Automated deployment from CI/CD
  - Testing and validation environment

**Network Topology Specifications:**
- **Bandwidth Requirements:**
  - Minimum: 100 Mbps for basic operation
  - Recommended: 1 Gbps for optimal performance
  - Burst capacity for exam periods
  - Traffic shaping for quality of service

- **Latency Requirements:**
  - Target: <100ms response time for API calls
  - Real-time features: <50ms WebSocket latency
  - Database queries: <10ms average
  - External API calls: <500ms timeout

**Visual Requirements:**
- Use network topology symbols and conventions
- Show physical and logical network boundaries
- Use different colors for network zones:
  - Red: Public Internet/DMZ
  - Blue: Application Network
  - Green: Data Network
  - Purple: External Services
  - Orange: Security Components
- Include IP addresses and port numbers
- Show firewall rules and security boundaries
- Use cloud symbols for Azure services
- Include data flow arrows with protocols
- Show load balancing and failover paths
- Add network performance metrics
- Include security controls and monitoring points
- Use standard network diagram symbols (routers, switches, firewalls)
```

---

## Deployment Diagram

### Prompt for UML Deployment Diagram

```
Create a comprehensive UML Deployment Diagram for QBMS showing complete infrastructure:

**Deployment Overview:**
- Production deployment on Azure cloud infrastructure
- Containerized application architecture
- Multi-tier deployment with security layers
- Scalable and maintainable infrastructure

**Hardware Nodes (Execution Environments):**

**1. Client Devices (Multiple Instances)**
```
<<device>> Client Device
─────────────────────────
Hardware Specs:
- CPU: Dual-core 1.6GHz+
- RAM: 2GB minimum
- Storage: 1GB free space
- Network: 5Mbps+ internet

Operating Systems:
- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu/Fedora)
- iOS 14+ (Mobile)
- Android 8+ (Mobile)

Software Components:
- Web Browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- JavaScript Engine (V8, SpiderMonkey, JavaScriptCore)
- HTML5/CSS3 Support
- WebSocket Support
```

**2. Azure Virtual Machine (Primary Server)**
```
<<execution environment>> Azure VM (qbms-vm)
─────────────────────────────────────────────
Hardware Configuration:
- VM Size: Standard_B2s
- vCPU: 2 cores (Intel Xeon)
- RAM: 4GB DDR4
- Storage: 50GB Premium SSD
- Network: 1 Gbps bandwidth
- Public IP: 20.121.189.81
- Private IP: 10.0.0.4

Operating System:
- Ubuntu 22.04 LTS (64-bit)
- Kernel: Linux 5.15+
- Package Manager: APT
- Init System: systemd

System Software:
- Docker Engine 24.x
- Docker Compose 2.x
- Nginx 1.22+
- UFW Firewall
- Certbot (Let's Encrypt)
- Git 2.30+
- Node.js 18.x LTS
```

**3. Docker Container Runtime Environment**
```
<<container platform>> Docker Engine
────────────────────────────────────
Container Runtime:
- Docker Engine 24.x
- containerd runtime
- runc container executor
- Docker Compose orchestration

Network Configuration:
- Bridge Network: qbms-network
- Subnet: 172.18.0.0/16
- DNS Resolution: Internal
- Port Mapping: Host to container

Volume Management:
- Named volumes for persistence
- Bind mounts for configuration
- Tmpfs mounts for temporary data
```

**Container Nodes (Application Components):**

**4. Frontend Container**
```
<<container>> qbms-web
──────────────────────
Base Image: node:18-alpine
Runtime Environment:
- Node.js 18.x LTS
- Next.js 14 Framework
- React 18 Runtime

Resource Allocation:
- CPU Limit: 1 core
- Memory Limit: 512MB
- Storage: 100MB

Network Configuration:
- Internal Port: 3000
- Container IP: 172.18.0.2
- Protocol: HTTP/1.1, HTTP/2

Environment Variables:
- NODE_ENV=production
- NEXT_PUBLIC_API_URL
```

**5. Backend API Container**
```
<<container>> qbms-api
──────────────────────
Base Image: node:18-alpine
Runtime Environment:
- Node.js 18.x LTS
- Express.js Framework
- TypeScript Runtime

Resource Allocation:
- CPU Limit: 2 cores
- Memory Limit: 1GB
- Storage: 200MB

Network Configuration:
- Internal Port: 3001
- Container IP: 172.18.0.3
- Protocol: HTTP/1.1, WebSocket

Environment Variables:
- NODE_ENV=production
- DATABASE_URL
- REDIS_URL
- JWT_SECRET
- OPENAI_API_KEY
```

**6. Reverse Proxy Container**
```
<<container>> qbms-nginx
────────────────────────
Base Image: nginx:alpine
Web Server:
- Nginx 1.22+
- HTTP/2 Support
- SSL/TLS Termination

Resource Allocation:
- CPU Limit: 0.5 cores
- Memory Limit: 256MB
- Storage: 50MB

Network Configuration:
- External Ports: 80, 443
- Container IP: 172.18.0.4
- SSL Certificate: Let's Encrypt

Configuration Files:
- nginx.conf (Main config)
- SSL certificates
- Security headers
```

**Data Tier Containers:**

**7. Database Container**
```
<<container>> qbms-postgres
───────────────────────────
Base Image: postgres:15-alpine
Database Engine:
- PostgreSQL 15.x
- ACID Compliance
- Connection Pooling

Resource Allocation:
- CPU Limit: 1 core
- Memory Limit: 1GB
- Storage: 10GB (persistent volume)

Network Configuration:
- Internal Port: 5432
- Container IP: 172.18.0.5
- Protocol: TCP (encrypted)

Persistent Storage:
- Volume: postgres_data
- Backup Location: /opt/qbms-backups
- Retention: 30 days
```

**8. Cache Container**
```
<<container>> qbms-redis
────────────────────────
Base Image: redis:7-alpine
Cache Engine:
- Redis 7.x
- In-memory data store
- Persistence enabled

Resource Allocation:
- CPU Limit: 0.5 cores
- Memory Limit: 512MB
- Storage: 1GB (persistent volume)

Network Configuration:
- Internal Port: 6379
- Container IP: 172.18.0.6
- Protocol: TCP

Configuration:
- Append-only file (AOF)
- Memory optimization
- Connection limits
```

**External Service Nodes:**

**9. OpenAI API Service**
```
<<cloud service>> OpenAI Platform
─────────────────────────────────
Service Provider: OpenAI Inc.
API Endpoint: https://api.openai.com
Model: GPT-4o-mini

Connection Details:
- Protocol: HTTPS/TLS 1.3
- Authentication: API Key
- Rate Limits: Per organization
- Timeout: 30 seconds

Integration Points:
- Question generation
- Content analysis
- Natural language processing
```

**10. Email Service**
```
<<cloud service>> SendGrid SMTP
───────────────────────────────
Service Provider: Twilio SendGrid
SMTP Endpoint: smtp.sendgrid.net
Port: 587 (STARTTLS)

Connection Details:
- Protocol: SMTP over TLS
- Authentication: API Key
- Rate Limits: Per plan
- Delivery Tracking: Webhooks

Email Types:
- Account verification
- Password reset
- Exam notifications
- System alerts
```

**11. File Storage Service**
```
<<cloud service>> Azure Blob Storage
────────────────────────────────────
Service Provider: Microsoft Azure
Storage Account: qbms-storage
Container: qbms

Connection Details:
- Protocol: HTTPS/REST API
- Authentication: Account Key/SAS
- Redundancy: LRS (Locally Redundant)
- Access Tier: Hot

Storage Configuration:
- Max File Size: 10MB
- Supported Formats: Images, Documents
- CDN Integration: Optional
- Backup: Cross-region replication
```

**12. Container Registry**
```
<<cloud service>> GitHub Container Registry
──────────────────────────────────────────
Service Provider: GitHub Inc.
Registry URL: ghcr.io
Repository: ghcr.io/0irfan/qbms

Connection Details:
- Protocol: HTTPS/Docker Registry API
- Authentication: GitHub Token
- Visibility: Private repository
- Vulnerability Scanning: Enabled

Image Management:
- Multi-architecture support
- Layer caching
- Automated builds via GitHub Actions
- Image signing and verification
```

**Deployment Artifacts:**

**Application Artifacts:**
- **qbms-frontend.tar** (Next.js build output)
- **qbms-api.tar** (Express.js application)
- **docker-compose.prod.yml** (Container orchestration)
- **nginx.prod.conf** (Web server configuration)
- **.env.production** (Environment variables)

**Configuration Artifacts:**
- **SSL Certificates** (Let's Encrypt)
- **Database Schema** (SQL migration files)
- **Backup Scripts** (Automated backup procedures)
- **Monitoring Config** (Health check endpoints)

**Deployment Relationships:**

**Communication Protocols:**
- Client ↔ Nginx: HTTPS/TLS 1.3 (Port 443)
- Nginx ↔ Frontend: HTTP (Port 3000)
- Nginx ↔ Backend: HTTP (Port 3001)
- Backend ↔ Database: TCP/PostgreSQL (Port 5432)
- Backend ↔ Cache: TCP/Redis (Port 6379)
- Backend ↔ OpenAI: HTTPS (Port 443)
- Backend ↔ SendGrid: SMTP/TLS (Port 587)
- Backend ↔ Azure Storage: HTTPS (Port 443)

**Deployment Dependencies:**
- Frontend depends on Backend API
- Backend depends on Database and Cache
- All containers depend on Docker Engine
- SSL certificates depend on domain DNS
- External services require network connectivity

**Scaling and High Availability:**
- **Horizontal Scaling:** Multiple container instances
- **Load Balancing:** Nginx upstream configuration
- **Database Replication:** Read replicas (future)
- **Cache Clustering:** Redis cluster mode (future)
- **CDN Integration:** Azure CDN for static assets

**Monitoring and Logging:**
- **Health Checks:** HTTP endpoints on all services
- **Log Aggregation:** Docker logging driver
- **Metrics Collection:** Container resource usage
- **Alert System:** Email notifications for failures
- **Backup Monitoring:** Automated backup verification

**Security Deployment:**
- **Network Segmentation:** Container isolation
- **Firewall Rules:** UFW and Azure NSG
- **SSL/TLS:** End-to-end encryption
- **Secret Management:** Environment variables
- **Access Control:** Role-based permissions
- **Audit Logging:** All system activities

**Visual Requirements:**
- Use 3D boxes for hardware nodes
- Use rectangles with component icons for containers
- Use cloud symbols for external services
- Show communication paths with protocol labels
- Include deployment relationships with <<deploy>> stereotypes
- Use different colors for node types:
  - Blue: Client devices
  - Green: Server infrastructure
  - Orange: Application containers
  - Purple: External services
- Show artifact deployment with dashed arrows
- Include resource specifications and constraints
- Add network protocols and port information
- Show dependencies between components
- Include scaling and redundancy indicators
```

---

## Component Diagram

### Prompt for UML Component Diagram

```
Create a comprehensive UML Component Diagram for QBMS showing system architecture:

**Component Architecture Overview:**
- Layered architecture with clear separation of concerns
- Microservices-oriented design within monolithic deployment
- Interface-based communication between components
- Dependency injection and inversion of control

**Package Structure and Component Organization:**

**1. Presentation Layer Package**
```
<<package>> Presentation Layer
├── <<component>> Authentication UI
├── <<component>> Dashboard UI
├── <<component>> Question Management UI
├── <<component>> Exam Management UI
├── <<component>> Analytics UI
├── <<component>> File Upload UI
├── <<component>> Notification UI
└── <<component>> Common UI Components
```

**2. Business Logic Layer Package**
```
<<package>> Business Logic Layer
├── <<component>> Authentication Service
├── <<component>> User Management Service
├── <<component>> Question Service
├── <<component>> Exam Service
├── <<component>> Class Service
├── <<component>> Analytics Service
├── <<component>> File Service
├── <<component>> Email Service
└── <<component>> AI Integration Service
```

**3. Data Access Layer Package**
```
<<package>> Data Access Layer
├── <<component>> Database Access Layer (DAL)
├── <<component>> Redis Cache Manager
├── <<component>> Azure Blob Client
├── <<component>> Migration Manager
└── <<component>> Audit Logger
```

**4. External Integration Package**
```
<<package>> External Integrations
├── <<component>> OpenAI API Client
├── <<component>> SendGrid SMTP Client
├── <<component>> Azure Storage Client
└── <<component>> GitHub Registry Client
```

**Detailed Component Specifications:**

**Frontend Components:**

**Authentication UI Component:**
```
<<component>> Authentication UI
─────────────────────────────
Responsibilities:
- Login/logout interface
- Registration forms
- Password reset functionality
- Email verification UI

Provided Interfaces:
○ ILoginInterface
○ IRegistrationInterface
○ IPasswordResetInterface

Required Interfaces:
◐ IAuthenticationService
◐ IValidationService
◐ INotificationService

Technologies:
- React 18 components
- React Hook Form
- Zod validation
- Tailwind CSS styling
```

**Dashboard UI Component:**
```
<<component>> Dashboard UI
──────────────────────────
Responsibilities:
- Role-based dashboard rendering
- Navigation menu management
- Quick action widgets
- System status display

Provided Interfaces:
○ IDashboardInterface
○ INavigationInterface
○ IWidgetInterface

Required Interfaces:
◐ IUserService
◐ IAnalyticsService
◐ INotificationService

State Management:
- Zustand store integration
- Real-time data updates
- Responsive layout system
```

**Question Management UI Component:**
```
<<component>> Question Management UI
───────────────────────────────────
Responsibilities:
- Question CRUD operations
- Question type selection
- AI generation interface
- Bulk operations UI

Provided Interfaces:
○ IQuestionInterface
○ IQuestionFormInterface
○ IBulkOperationInterface

Required Interfaces:
◐ IQuestionService
◐ IAIService
◐ IFileService
◐ IValidationService

Features:
- Rich text editor
- Image upload support
- Question preview
- Batch import/export
```

**Backend Service Components:**

**Authentication Service:**
```
<<component>> Authentication Service
───────────────────────────────────
Responsibilities:
- User authentication
- JWT token management
- Session handling
- Password security

Provided Interfaces:
○ IAuthenticationService
  + login(credentials): AuthResult
  + logout(token): void
  + validateToken(token): User
  + refreshToken(token): TokenPair
  + resetPassword(email): void

Required Interfaces:
◐ IUserRepository
◐ ICacheManager
◐ IEmailService
◐ IHashingService

Security Features:
- bcrypt password hashing
- JWT token generation
- Rate limiting
- Audit logging
```

**Question Service:**
```
<<component>> Question Service
─────────────────────────────
Responsibilities:
- Question CRUD operations
- Question validation
- Search and filtering
- AI integration coordination

Provided Interfaces:
○ IQuestionService
  + createQuestion(data): Question
  + updateQuestion(id, data): Question
  + deleteQuestion(id): boolean
  + searchQuestions(criteria): Question[]
  + generateWithAI(prompt): Question[]

Required Interfaces:
◐ IQuestionRepository
◐ IAIClient
◐ IValidationService
◐ ICacheManager
◐ IAuditLogger

Business Rules:
- Question format validation
- Duplicate detection
- Usage tracking
- Version control
```

**Exam Service:**
```
<<component>> Exam Service
─────────────────────────
Responsibilities:
- Exam lifecycle management
- Question paper generation
- Exam scheduling
- Result processing

Provided Interfaces:
○ IExamService
  + createExam(data): Exam
  + scheduleExam(id, schedule): void
  + startExam(examId, studentId): Attempt
  + submitExam(attemptId): ExamResult
  + generatePaper(criteria): Question[]

Required Interfaces:
◐ IExamRepository
◐ IQuestionService
◐ ITimerService
◐ INotificationService
◐ IAnalyticsService

Exam Features:
- Auto question selection
- Timer management
- Real-time monitoring
- Automatic grading
```

**Data Access Components:**

**Database Access Layer (DAL):**
```
<<component>> Database Access Layer
──────────────────────────────────
Responsibilities:
- Database connection management
- Query execution
- Transaction handling
- Connection pooling

Provided Interfaces:
○ IUserRepository
○ IQuestionRepository
○ IExamRepository
○ IClassRepository
○ IAttemptRepository

Required Interfaces:
◐ IDatabaseConnection
◐ IQueryBuilder
◐ ITransactionManager

Technologies:
- Drizzle ORM
- PostgreSQL driver
- Connection pooling
- Query optimization
```

**Redis Cache Manager:**
```
<<component>> Redis Cache Manager
────────────────────────────────
Responsibilities:
- Cache operations
- Session storage
- Rate limiting data
- Temporary data storage

Provided Interfaces:
○ ICacheManager
  + get<T>(key): T | null
  + set<T>(key, value, ttl): void
  + delete(key): void
  + exists(key): boolean
  + increment(key): number

Required Interfaces:
◐ IRedisConnection
◐ ISerializationService

Cache Strategies:
- Time-based expiration
- LRU eviction policy
- Distributed caching
- Cache warming
```

**External Integration Components:**

**OpenAI API Client:**
```
<<component>> OpenAI API Client
──────────────────────────────
Responsibilities:
- AI API communication
- Prompt engineering
- Response processing
- Error handling

Provided Interfaces:
○ IAIClient
  + generateQuestions(prompt): AIResponse
  + analyzeContent(text): Analysis
  + validateResponse(response): boolean

Required Interfaces:
◐ IHttpClient
◐ IRetryPolicy
◐ IRateLimiter
◐ IConfigurationService

AI Features:
- Prompt templates
- Response validation
- Rate limit handling
- Cost optimization
```

**SendGrid SMTP Client:**
```
<<component>> SendGrid SMTP Client
─────────────────────────────────
Responsibilities:
- Email delivery
- Template management
- Delivery tracking
- Bounce handling

Provided Interfaces:
○ IEmailService
  + sendEmail(to, subject, content): void
  + sendTemplateEmail(template, data): void
  + trackDelivery(messageId): DeliveryStatus

Required Interfaces:
◐ ISMTPClient
◐ ITemplateEngine
◐ IDeliveryTracker

Email Features:
- HTML templates
- Attachment support
- Delivery webhooks
- Spam compliance
```

**Cross-Cutting Concern Components:**

**Validation Service:**
```
<<component>> Validation Service
──────────────────────────────
Responsibilities:
- Input validation
- Business rule validation
- Schema validation
- Error formatting

Provided Interfaces:
○ IValidationService
  + validateInput(data, schema): ValidationResult
  + validateBusinessRules(entity): RuleResult
  + formatErrors(errors): FormattedError[]

Technologies:
- Zod schema validation
- Custom business rules
- Internationalization support
```

**Logging and Monitoring:**
```
<<component>> Audit Logger
──────────────────────────
Responsibilities:
- Activity logging
- Security event tracking
- Performance monitoring
- Error reporting

Provided Interfaces:
○ IAuditLogger
  + logActivity(user, action, entity): void
  + logSecurityEvent(event): void
  + logError(error, context): void
  + logPerformance(metric): void

Required Interfaces:
◐ ILogStorage
◐ IMetricsCollector
```

**Interface Definitions:**

**Core Business Interfaces:**
```
<<interface>> IAuthenticationService
+ login(credentials: LoginCredentials): Promise<AuthResult>
+ logout(token: string): Promise<void>
+ validateToken(token: string): Promise<User>
+ refreshToken(refreshToken: string): Promise<TokenPair>

<<interface>> IQuestionService
+ createQuestion(data: QuestionData): Promise<Question>
+ updateQuestion(id: string, data: Partial<QuestionData>): Promise<Question>
+ deleteQuestion(id: string): Promise<boolean>
+ searchQuestions(criteria: SearchCriteria): Promise<Question[]>

<<interface>> IExamService
+ createExam(data: ExamData): Promise<Exam>
+ startExam(examId: string, studentId: string): Promise<Attempt>
+ submitExam(attemptId: string): Promise<ExamResult>
+ generateQuestionPaper(criteria: GenerationCriteria): Promise<Question[]>
```

**Data Access Interfaces:**
```
<<interface>> IRepository<T>
+ findById(id: string): Promise<T | null>
+ findAll(criteria?: SearchCriteria): Promise<T[]>
+ create(entity: Omit<T, 'id'>): Promise<T>
+ update(id: string, updates: Partial<T>): Promise<T>
+ delete(id: string): Promise<boolean>

<<interface>> ICacheManager
+ get<T>(key: string): Promise<T | null>
+ set<T>(key: string, value: T, ttl?: number): Promise<void>
+ delete(key: string): Promise<void>
+ exists(key: string): Promise<boolean>
```

**Component Dependencies and Relationships:**

**Dependency Flow:**
- UI Components → Business Services → Data Access → External Services
- Cross-cutting concerns (validation, logging) used by all layers
- Interface-based communication for loose coupling
- Dependency injection for testability

**Communication Patterns:**
- Synchronous: Direct method calls through interfaces
- Asynchronous: Event-driven communication for notifications
- Pub/Sub: Real-time updates through WebSocket
- Request/Response: HTTP API calls to external services

**Deployment Mapping:**
- Frontend Components → Next.js Application Container
- Backend Services → Express.js API Container
- Data Access → Database and Cache Containers
- External Integrations → Cloud Services

**Visual Requirements:**
- Use component symbols (rectangles with component icon)
- Show provided interfaces as circles (lollipops)
- Show required interfaces as semicircles (sockets)
- Use dependency arrows between components
- Group components in packages with folder symbols
- Color code by architectural layer:
  - Blue: Presentation Layer
  - Green: Business Logic Layer
  - Orange: Data Access Layer
  - Purple: External Integrations
  - Gray: Cross-cutting Concerns
- Include interface names and key methods
- Show component stereotypes (<<component>>, <<interface>>)
- Use assembly connectors for interface connections
- Include component responsibilities and technologies
- Show package dependencies with dashed arrows
```

---

## Usage Instructions

### How to Use These Prompts

1. **Choose the appropriate diagram type** based on your documentation needs
2. **Copy the complete prompt** for your selected diagram
3. **Use with diagram generation tools** such as:
   - Draw.io (Lucidchart)
   - PlantUML
   - Mermaid
   - AI-powered diagram generators (Claude, ChatGPT with plugins)
   - Visual Paradigm
   - Enterprise Architect

4. **Customize the prompts** by:
   - Adjusting entity names and attributes
   - Modifying relationships based on your specific implementation
   - Adding or removing components as needed
   - Updating technology stack references

5. **Generate multiple versions** for different audiences:
   - High-level diagrams for stakeholders
   - Detailed technical diagrams for developers
   - Simplified diagrams for documentation

### Tips for Best Results

- **Be specific** about visual requirements and styling
- **Include all necessary details** in the prompt
- **Specify colors and layouts** for consistency
- **Mention standards** (UML, IEEE, etc.) when applicable
- **Iterate and refine** based on initial results
- **Validate accuracy** against your actual implementation

### Integration with Documentation

These diagrams should be integrated into your final year project documentation in the appropriate chapters:

- **Use Case Diagram** → Chapter 2 (Requirements Specification)
- **ERD** → Chapter 3 (Design and Analysis)
- **System Architecture** → Chapter 3 (Design and Analysis)
- **Class Diagram** → Chapter 3 (Design and Analysis)
- **Sequence Diagrams** → Chapter 3 (Design and Analysis)
- **Activity Diagram** → Chapter 3 (Design and Analysis)
- **Deployment Diagram** → Chapter 6 (Implementation)
- **Component Diagram** → Chapter 4 (Development)

---

*This comprehensive collection of diagram generation prompts ensures you can create professional, accurate, and detailed diagrams for your QBMS project documentation.*