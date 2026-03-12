# Implementation Tasks

## Phase 2: Admin Activity Logging System

### Task 2.1: Enhance Database Schema for Activity Logs
**Status**: todo
**Priority**: high
**Estimated Effort**: 1 hour

**Description**: Update the existing audit_logs table with additional fields needed for comprehensive activity logging.

**Acceptance Criteria**:
- [ ] Add user_email column to audit_logs table
- [ ] Add user_role column to audit_logs table  
- [ ] Add details column (TEXT) to audit_logs table
- [ ] Create indexes on timestamp, user_id, action, resource_type, user_role
- [ ] Backfill existing records with user_email and user_role from users table
- [ ] Migration script executes successfully without errors

**Files to Modify**:
- Create: `packages/database/drizzle/0008_enhance_audit_logs.sql`
- Update: `packages/database/src/schema/index.ts` (enhance auditLogs table definition)

---

### Task 2.2: Enhance Audit Middleware
**Status**: todo
**Priority**: high
**Estimated Effort**: 2 hours

**Description**: Upgrade the existing audit middleware to support async logging queue and comprehensive action tracking.

**Acceptance Criteria**:
- [ ] Implement async logging queue to avoid blocking requests
- [ ] Add batch processing (100 logs at a time)
- [ ] Capture user email, role, IP address, user agent
- [ ] Support details field for additional context
- [ ] Add helper function setAuditLog() for routes to use
- [ ] Handle logging failures gracefully without breaking requests
- [ ] Test with high-volume requests

**Files to Modify**:
- Update: `apps/api/src/middleware/audit.ts`

---

### Task 2.3: Integrate Audit Logging in Auth Routes
**Status**: todo
**Priority**: high
**Estimated Effort**: 1 hour

**Description**: Add audit logging to authentication-related routes (login, register, password reset).

**Acceptance Criteria**:
- [ ] Log successful login attempts with user details
- [ ] Log failed login attempts with email and reason
- [ ] Log user registrations with role
- [ ] Log password reset requests
- [ ] Log password changes
- [ ] All logs include relevant details in JSON format

**Files to Modify**:
- Update: `apps/api/src/routes/auth.ts`

---

### Task 2.4: Integrate Audit Logging in Class Routes
**Status**: todo
**Priority**: medium
**Estimated Effort**: 1 hour

**Description**: Add audit logging to class management routes.

**Acceptance Criteria**:
- [ ] Log class creation with class name and instructor
- [ ] Log class updates with changed fields
- [ ] Log class deletion
- [ ] Log student enrollments
- [ ] Log enrollment code generation

**Files to Modify**:
- Update: `apps/api/src/routes/classes.ts`

---

### Task 2.5: Integrate Audit Logging in Subject Routes
**Status**: todo
**Priority**: medium
**Estimated Effort**: 1 hour

**Description**: Add audit logging to subject management routes.

**Acceptance Criteria**:
- [ ] Log subject creation
- [ ] Log subject updates
- [ ] Log subject deletion
- [ ] Include subject name and associated class in details

**Files to Modify**:
- Update: `apps/api/src/routes/subjects.ts`

---

### Task 2.6: Integrate Audit Logging in Exam Routes
**Status**: todo
**Priority**: medium
**Estimated Effort**: 1 hour

**Description**: Add audit logging to exam-related routes.

**Acceptance Criteria**:
- [ ] Log exam creation
- [ ] Log exam updates (status changes, scheduling)
- [ ] Log exam deletion
- [ ] Log exam attempts (start, submit)
- [ ] Log grading actions

**Files to Modify**:
- Update: `apps/api/src/routes/exams.ts`

---

### Task 2.7: Create Admin Activity Logs API Endpoints
**Status**: todo
**Priority**: high
**Estimated Effort**: 2 hours

**Description**: Create API endpoints for retrieving and filtering activity logs.

**Acceptance Criteria**:
- [ ] GET /api/admin/activity-logs with pagination
- [ ] Support filters: userId, action, resourceType, startDate, endDate
- [ ] Return logs ordered by timestamp descending
- [ ] Include pagination metadata (total count, pages)
- [ ] GET /api/admin/activity-logs/stats for action statistics
- [ ] Require admin/super_admin role (403 for others)
- [ ] Test with various filter combinations

**Files to Create**:
- Create: `apps/api/src/routes/admin-logs.ts`
- Update: `apps/api/src/index.ts` (register route)

---

### Task 2.8: Create Admin Activity Logs UI Page
**Status**: todo
**Priority**: high
**Estimated Effort**: 3 hours

**Description**: Build the frontend page for viewing and filtering activity logs.

**Acceptance Criteria**:
- [ ] Create activity logs page accessible only to admins
- [ ] Display logs in a table with columns: timestamp, user, role, action, resource, IP
- [ ] Implement filter controls (action, resource type, date range)
- [ ] Add pagination controls
- [ ] Format timestamps in readable format
- [ ] Format action names (replace dots with spaces, uppercase)
- [ ] Redirect non-admin users to unauthorized page
- [ ] Responsive design for mobile/tablet

**Files to Create**:
- Create: `apps/web/src/app/dashboard/admin/activity-logs/page.tsx`

---

### Task 2.9: Add Activity Logs Navigation Link
**Status**: todo
**Priority**: low
**Estimated Effort**: 15 minutes

**Description**: Add navigation link to activity logs page in admin dashboard.

**Acceptance Criteria**:
- [ ] Add "Activity Logs" link in dashboard navigation
- [ ] Only visible to admin/super_admin users
- [ ] Link navigates to /dashboard/admin/activity-logs

**Files to Modify**:
- Update: `apps/web/src/app/dashboard/layout.tsx`

---

## Phase 3: Separate Dashboards with Data Scoping

### Task 3.1: Create Data Scoping Middleware
**Status**: todo
**Priority**: high
**Estimated Effort**: 2 hours

**Description**: Implement middleware that determines user's data scope based on role and attachments to request.

**Acceptance Criteria**:
- [ ] Fetch enrolled class IDs for students
- [ ] Fetch managed class IDs for instructors
- [ ] No scoping for admin/super_admin
- [ ] Attach scope object to request
- [ ] Export helper functions: hasClassAccess(), applyScopeToClassQuery()
- [ ] Handle errors gracefully
- [ ] Test with all user roles

**Files to Create**:
- Create: `apps/api/src/middleware/dataScoping.ts`

---

### Task 3.2: Update Classes API with Data Scoping
**Status**: todo
**Priority**: high
**Estimated Effort**: 2 hours

**Description**: Apply data scoping to all class-related API endpoints.

**Acceptance Criteria**:
- [ ] Apply dataScopingMiddleware to all routes
- [ ] GET /api/classes filters by scope (enrolled or managed)
- [ ] GET /api/classes/:id checks access before returning
- [ ] POST /api/classes restricted to instructors
- [ ] GET /api/classes/:id/students restricted to instructors/admins
- [ ] Students cannot view class rosters
- [ ] Return 403 for unauthorized access attempts
- [ ] Test with student, instructor, and admin accounts

**Files to Modify**:
- Update: `apps/api/src/routes/classes.ts`

---

### Task 3.3: Update Subjects API with Data Scoping
**Status**: todo
**Priority**: high
**Estimated Effort**: 1.5 hours

**Description**: Apply data scoping to subject-related API endpoints.

**Acceptance Criteria**:
- [ ] Apply dataScopingMiddleware to all routes
- [ ] Filter subjects by accessible classes
- [ ] Check class access before allowing subject operations
- [ ] Students can view subjects from enrolled classes only
- [ ] Instructors can manage subjects in their classes only
- [ ] Return 403 for unauthorized access

**Files to Modify**:
- Update: `apps/api/src/routes/subjects.ts`

---

### Task 3.4: Update Exams API with Data Scoping
**Status**: todo
**Priority**: high
**Estimated Effort**: 2 hours

**Description**: Apply data scoping to exam-related API endpoints.

**Acceptance Criteria**:
- [ ] Apply dataScopingMiddleware to all routes
- [ ] GET /api/exams filters by enrolled/managed classes
- [ ] GET /api/exams/:id checks class access
- [ ] GET /api/exams/attempts/my returns only student's own attempts
- [ ] Students cannot view other students' attempts
- [ ] Instructors can view attempts for their classes only
- [ ] Return 403 for unauthorized access

**Files to Modify**:
- Update: `apps/api/src/routes/exams.ts`

---

### Task 3.5: Update Analytics API with Data Scoping
**Status**: todo
**Priority**: medium
**Estimated Effort**: 1.5 hours

**Description**: Apply data scoping to analytics endpoints.

**Acceptance Criteria**:
- [ ] Students see only their own analytics
- [ ] Instructors see analytics for managed classes only
- [ ] Admins see all analytics
- [ ] Filter data by scope before aggregation
- [ ] Test analytics accuracy with scoped data

**Files to Modify**:
- Update: `apps/api/src/routes/analytics.ts`

---

### Task 3.6: Create Dashboard Router Component
**Status**: todo
**Priority**: high
**Estimated Effort**: 30 minutes

**Description**: Update main dashboard page to route users to role-specific dashboards.

**Acceptance Criteria**:
- [ ] Check user role on mount
- [ ] Redirect students to /dashboard/student
- [ ] Redirect instructors to /dashboard/instructor
- [ ] Redirect admins to /dashboard/admin
- [ ] Show loading spinner during redirect
- [ ] Handle unauthenticated users (redirect to login)

**Files to Modify**:
- Update: `apps/web/src/app/dashboard/page.tsx`

---

### Task 3.7: Create Student Dashboard Page
**Status**: todo
**Priority**: high
**Estimated Effort**: 3 hours

**Description**: Build the student-specific dashboard showing enrolled classes and personal progress.

**Acceptance Criteria**:
- [ ] Display list of enrolled classes
- [ ] Show recent exam results (last 5)
- [ ] Display score and percentage for each attempt
- [ ] Show "Join a Class" button
- [ ] Show "View Available Exams" button
- [ ] Responsive design
- [ ] Handle empty states (no classes, no attempts)
- [ ] Click on class navigates to class detail

**Files to Create**:
- Create: `apps/web/src/app/dashboard/student/page.tsx`

---

### Task 3.8: Create Instructor Dashboard Page
**Status**: todo
**Priority**: high
**Estimated Effort**: 3 hours

**Description**: Build the instructor-specific dashboard showing managed classes and statistics.

**Acceptance Criteria**:
- [ ] Display stats cards (total classes, students, exams)
- [ ] Show grid of managed classes
- [ ] Display enrollment count per class
- [ ] Show subject name for each class
- [ ] Add "Create New Class" button
- [ ] Quick action buttons (Manage Questions, Create Exam, Analytics)
- [ ] Click on class navigates to class detail
- [ ] Subjects and Students buttons for each class
- [ ] Responsive design
- [ ] Handle empty state (no classes)

**Files to Create**:
- Create: `apps/web/src/app/dashboard/instructor/page.tsx`

---

### Task 3.9: Create Admin Dashboard Page
**Status**: todo
**Priority**: medium
**Estimated Effort**: 2 hours

**Description**: Build the admin dashboard with system-wide overview and management links.

**Acceptance Criteria**:
- [ ] Display system-wide statistics
- [ ] Show total users, classes, subjects, exams
- [ ] Link to activity logs
- [ ] Link to user management
- [ ] Link to system settings
- [ ] Recent activity summary
- [ ] Responsive design

**Files to Create**:
- Create: `apps/web/src/app/dashboard/admin/page.tsx`

---

### Task 3.10: Update Dashboard Navigation
**Status**: todo
**Priority**: medium
**Estimated Effort**: 1 hour

**Description**: Update dashboard layout navigation to show role-appropriate links.

**Acceptance Criteria**:
- [ ] Students see: My Classes, Exams, Results
- [ ] Instructors see: Classes, Subjects, Questions, Exams, Analytics
- [ ] Admins see: Dashboard, Users, Activity Logs, Settings
- [ ] Hide links based on user role
- [ ] Update active link highlighting

**Files to Modify**:
- Update: `apps/web/src/app/dashboard/layout.tsx`

---

## Phase 4: Subjects Nested Under Classes

### Task 4.1: Create Database Migration Script
**Status**: todo
**Priority**: high
**Estimated Effort**: 2 hours

**Description**: Create migration script to restructure subject-class relationship.

**Acceptance Criteria**:
- [ ] Add classId column to subjects table
- [ ] Add createdBy and createdAt columns to subjects
- [ ] Migrate existing data (set classId from classes.subjectId)
- [ ] Handle orphaned subjects (delete or assign to default class)
- [ ] Make classId NOT NULL
- [ ] Create index on subjects.classId
- [ ] Remove subjectId column from classes table
- [ ] Include validation checks
- [ ] Wrap in transaction for atomicity
- [ ] Test on development database copy

**Files to Create**:
- Create: `packages/database/drizzle/0009_subjects_nested_under_classes.sql`

---

### Task 4.2: Create Migration Rollback Script
**Status**: todo
**Priority**: high
**Estimated Effort**: 1 hour

**Description**: Create rollback script to reverse the schema migration if needed.

**Acceptance Criteria**:
- [ ] Add subjectId back to classes table
- [ ] Restore relationship (use first subject from each class)
- [ ] Remove classId from subjects
- [ ] Remove createdBy and createdAt from subjects
- [ ] Drop index on subjects.classId
- [ ] Wrap in transaction
- [ ] Test rollback on development database

**Files to Create**:
- Create: `packages/database/drizzle/0009_subjects_nested_under_classes_rollback.sql`

---

### Task 4.3: Create Migration Dry Run Script
**Status**: todo
**Priority**: medium
**Estimated Effort**: 30 minutes

**Description**: Create script to preview migration changes without executing them.

**Acceptance Criteria**:
- [ ] Show count of classes with subjects
- [ ] Show count of orphaned subjects
- [ ] Show total subjects count
- [ ] List which subjects will be assigned to which classes
- [ ] Identify orphaned subjects that will be deleted
- [ ] No data modifications

**Files to Create**:
- Create: `packages/database/drizzle/0009_subjects_nested_under_classes_dryrun.sql`

---

### Task 4.4: Update Database Schema Definition
**Status**: todo
**Priority**: high
**Estimated Effort**: 30 minutes

**Description**: Update Drizzle schema to reflect new subject-class relationship.

**Acceptance Criteria**:
- [ ] Add classId field to subjects table definition
- [ ] Add createdBy field to subjects table definition
- [ ] Add createdAt field to subjects table definition
- [ ] Remove subjectId from classes table definition
- [ ] Update relations: subjects belong to classes
- [ ] Update TypeScript types

**Files to Modify**:
- Update: `packages/database/src/schema/index.ts`

---

### Task 4.5: Run Database Migration
**Status**: todo
**Priority**: high
**Estimated Effort**: 1 hour

**Description**: Execute the database migration on development environment.

**Acceptance Criteria**:
- [ ] Run dry run script first to preview changes
- [ ] Backup database before migration
- [ ] Execute migration script
- [ ] Verify all subjects have valid classId
- [ ] Verify no classes have subjectId column
- [ ] Check referential integrity
- [ ] Test rollback script (on backup copy)
- [ ] Document any issues encountered

**Commands to Run**:
```bash
# Backup database
pg_dump -h localhost -p 5433 -U postgres qbms > backup_before_migration.sql

# Run dry run
psql -h localhost -p 5433 -U postgres qbms < packages/database/drizzle/0009_subjects_nested_under_classes_dryrun.sql

# Run migration
psql -h localhost -p 5433 -U postgres qbms < packages/database/drizzle/0009_subjects_nested_under_classes.sql
```

---

### Task 4.6: Update Subjects API Endpoints
**Status**: todo
**Priority**: high
**Estimated Effort**: 2 hours

**Description**: Update subject API endpoints to work with new schema.

**Acceptance Criteria**:
- [ ] Deprecate GET /api/subjects (return 410 Gone)
- [ ] Create GET /api/classes/:classId/subjects
- [ ] Update POST /api/subjects to require classId
- [ ] Update PUT /api/subjects/:id to allow changing classId
- [ ] Update DELETE /api/subjects/:id (cascade handled by DB)
- [ ] Verify class access before subject operations
- [ ] Return appropriate error messages
- [ ] Test all endpoints with new schema

**Files to Modify**:
- Update: `apps/api/src/routes/subjects.ts`
- Update: `apps/api/src/routes/classes.ts` (add subjects endpoint)

---

### Task 4.7: Update Topics API to Verify Class Access
**Status**: todo
**Priority**: medium
**Estimated Effort**: 1 hour

**Description**: Update topics API to verify class access through subject relationship.

**Acceptance Criteria**:
- [ ] Join subjects table to get classId
- [ ] Verify user has access to the class
- [ ] Apply data scoping through subject's class
- [ ] Return 403 for unauthorized access
- [ ] Test with different user roles

**Files to Modify**:
- Update: `apps/api/src/routes/topics.ts`

---

### Task 4.8: Update Questions API to Verify Class Access
**Status**: todo
**Priority**: medium
**Estimated Effort**: 1 hour

**Description**: Update questions API to verify class access through topic->subject->class chain.

**Acceptance Criteria**:
- [ ] Join through topics and subjects to get classId
- [ ] Verify user has access to the class
- [ ] Apply data scoping
- [ ] Return 403 for unauthorized access
- [ ] Test question creation and retrieval

**Files to Modify**:
- Update: `apps/api/src/routes/questions.ts`

---

### Task 4.9: Remove Standalone Subjects Page
**Status**: todo
**Priority**: medium
**Estimated Effort**: 15 minutes

**Description**: Remove or redirect the standalone subjects page.

**Acceptance Criteria**:
- [ ] Remove /dashboard/subjects/page.tsx OR
- [ ] Redirect to classes page with message
- [ ] Update any links pointing to old subjects page

**Files to Modify/Delete**:
- Delete or Update: `apps/web/src/app/dashboard/subjects/page.tsx`

---

### Task 4.10: Create Class Subjects Management Page
**Status**: todo
**Priority**: high
**Estimated Effort**: 3 hours

**Description**: Create page to manage subjects within a class context.

**Acceptance Criteria**:
- [ ] Create page at /dashboard/classes/[classId]/subjects
- [ ] Display breadcrumb: Classes > [Class Name] > Subjects
- [ ] List subjects for the current class only
- [ ] Add "Create Subject" button (auto-sets classId)
- [ ] Edit subject functionality
- [ ] Delete subject functionality
- [ ] Show subject name and description
- [ ] Verify user has access to the class
- [ ] Responsive design

**Files to Create**:
- Create: `apps/web/src/app/dashboard/classes/[classId]/subjects/page.tsx`

---

### Task 4.11: Update Class Detail Page Navigation
**Status**: todo
**Priority**: medium
**Estimated Effort**: 30 minutes

**Description**: Add subjects tab/link to class detail page.

**Acceptance Criteria**:
- [ ] Add "Subjects" tab or button on class detail page
- [ ] Link navigates to /dashboard/classes/[classId]/subjects
- [ ] Show subject count badge
- [ ] Update layout to accommodate new tab

**Files to Modify**:
- Update: `apps/web/src/app/dashboard/classes/[classId]/page.tsx` (if exists)
- Or Update: Class detail component

---

### Task 4.12: Update Subject Creation Forms
**Status**: todo
**Priority**: high
**Estimated Effort**: 1 hour

**Description**: Update subject creation/edit forms to work with new schema.

**Acceptance Criteria**:
- [ ] Remove class selection dropdown (classId from context)
- [ ] Auto-populate classId from URL parameter
- [ ] Update API calls to use new endpoints
- [ ] Handle validation errors
- [ ] Show success/error messages
- [ ] Test creation and editing

**Files to Modify**:
- Update: Subject creation/edit components

---

### Task 4.13: Update Navigation Menu
**Status**: todo
**Priority**: medium
**Estimated Effort**: 30 minutes

**Description**: Remove "Subjects" from main navigation menu.

**Acceptance Criteria**:
- [ ] Remove "Subjects" link from main navigation
- [ ] Subjects now accessed through Classes
- [ ] Update any breadcrumbs or navigation hints
- [ ] Test navigation flow

**Files to Modify**:
- Update: `apps/web/src/app/dashboard/layout.tsx`

---

### Task 4.14: Create Breaking Changes Documentation
**Status**: todo
**Priority**: high
**Estimated Effort**: 1 hour

**Description**: Document all breaking changes and migration steps.

**Acceptance Criteria**:
- [ ] List all deprecated API endpoints
- [ ] List all new API endpoints
- [ ] Document changed request/response formats
- [ ] Provide migration guide for API consumers
- [ ] Include example API calls
- [ ] Document UI changes
- [ ] Include rollback instructions

**Files to Create**:
- Create: `docs/PHASE4-BREAKING-CHANGES.md`

---

### Task 4.15: End-to-End Testing
**Status**: todo
**Priority**: high
**Estimated Effort**: 2 hours

**Description**: Comprehensive testing of all three phases together.

**Acceptance Criteria**:
- [ ] Test activity logging for all actions
- [ ] Verify logs appear in admin dashboard
- [ ] Test student dashboard with enrolled classes
- [ ] Test instructor dashboard with managed classes
- [ ] Verify data scoping (students can't see others' data)
- [ ] Test subject management within classes
- [ ] Verify subjects are scoped to classes
- [ ] Test cascade delete (delete class deletes subjects)
- [ ] Test with multiple user roles
- [ ] Document any bugs found

---

## Summary

**Total Tasks**: 45
- Phase 2 (Admin Activity Logs): 9 tasks
- Phase 3 (Separate Dashboards): 10 tasks
- Phase 4 (Subjects Under Classes): 15 tasks
- Testing: 1 task

**Estimated Total Effort**: ~45-50 hours

**Recommended Implementation Order**:
1. Complete all Phase 2 tasks (Admin Activity Logs)
2. Complete all Phase 3 tasks (Separate Dashboards)
3. Complete all Phase 4 tasks (Subjects Under Classes)
4. Perform end-to-end testing

**Critical Path**:
- Phase 2 can be implemented independently
- Phase 3 depends on Phase 2 (audit middleware)
- Phase 4 is independent but should be done last (breaking change)
