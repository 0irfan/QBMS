# Requirements Document

## Introduction

This document specifies requirements for Phases 2-4 of the QBMS (Question Bank Management System) refactor. Phase 1 (Role-Based Registration Flow) has been completed. These phases introduce admin activity logging, role-specific dashboards with strict data scoping, and a major schema change to nest subjects under classes.

The system currently serves multiple user roles (super_admin, admin, instructor, student) with a PostgreSQL database. These phases address critical gaps in audit capabilities, data isolation, and logical data hierarchy.

## Glossary

- **QBMS**: Question Bank Management System - the application being refactored
- **Activity_Log_System**: The audit logging subsystem that records user actions
- **Audit_Middleware**: Server-side component that intercepts requests and logs activities
- **Admin_User**: A user with role super_admin or admin who can view system logs
- **Privileged_User**: A user with role super_admin, admin, or instructor
- **Student_User**: A user with role student
- **Instructor_User**: A user with role instructor
- **Student_Dashboard**: UI view showing only student-owned data (enrollments, progress, assignments)
- **Instructor_Dashboard**: UI view showing classes managed by instructor, student lists, and analytics
- **Data_Scope_Middleware**: Server-side component that filters queries based on user role and ownership
- **Class_Entity**: A class in the system (existing table: classes)
- **Subject_Entity**: A subject that belongs to a class (existing table: subjects)
- **Audit_Logs_Table**: Existing database table for storing activity logs
- **Schema_Migration**: Database migration scripts that modify table structure
- **Breaking_Change**: A modification that requires data migration and may affect existing functionality

## Requirements

### Requirement 1: Admin Activity Logging System

**User Story:** As a super_admin or admin, I want to view comprehensive logs of all user activities in the system, so that I can audit actions, troubleshoot issues, and ensure system security.

#### Acceptance Criteria

1. WHEN any user performs an action (login, registration, class modification, subject modification, exam activity), THE Activity_Log_System SHALL record the action with timestamp, user ID, role, action type, and affected resource
2. THE Activity_Log_System SHALL store logs in the Audit_Logs_Table with fields: id, timestamp, user_id, user_role, action_type, resource_type, resource_id, details, ip_address
3. WHEN an Admin_User requests activity logs, THE QBMS SHALL return all logs with pagination support
4. WHEN a Student_User or Instructor_User requests activity logs, THE QBMS SHALL return an authorization error
5. THE Audit_Middleware SHALL automatically log actions without requiring explicit logging calls in business logic
6. WHEN a login attempt occurs, THE Activity_Log_System SHALL record both successful and failed login attempts
7. WHEN a user registration occurs, THE Activity_Log_System SHALL record the registration with the registering user's role
8. WHEN a class is created, updated, or deleted, THE Activity_Log_System SHALL record the action with class ID and changes
9. WHEN a subject is created, updated, or deleted, THE Activity_Log_System SHALL record the action with subject ID and changes
10. WHEN an exam is created, updated, deleted, or taken, THE Activity_Log_System SHALL record the action with exam ID and participant information

### Requirement 2: Admin Activity Log API Endpoints

**User Story:** As a super_admin or admin, I want API endpoints to retrieve and filter activity logs, so that I can integrate log viewing into the admin interface.

#### Acceptance Criteria

1. THE QBMS SHALL provide a GET /api/admin/activity-logs endpoint that returns paginated activity logs
2. WHEN an Admin_User calls GET /api/admin/activity-logs, THE QBMS SHALL return logs ordered by timestamp descending
3. WHEN a non-Admin_User calls GET /api/admin/activity-logs, THE QBMS SHALL return HTTP 403 Forbidden
4. THE QBMS SHALL support query parameters: page, limit, user_id, action_type, resource_type, start_date, end_date
5. WHEN filter parameters are provided, THE QBMS SHALL return only logs matching all specified filters
6. THE QBMS SHALL return log entries with fields: id, timestamp, user_email, user_role, action_type, resource_type, resource_id, details, ip_address
7. FOR ALL log API responses, THE QBMS SHALL include pagination metadata: total_count, page, limit, total_pages

### Requirement 3: Admin Activity Log User Interface

**User Story:** As a super_admin or admin, I want a user interface to view and filter activity logs, so that I can easily audit system activities without using API tools.

#### Acceptance Criteria

1. THE QBMS SHALL provide an Activity Logs page accessible only to Admin_Users
2. WHEN an Admin_User navigates to the Activity Logs page, THE QBMS SHALL display a table of recent activity logs
3. THE QBMS SHALL provide filter controls for: date range, user, action type, and resource type
4. WHEN an Admin_User applies filters, THE QBMS SHALL update the log display to show only matching entries
5. THE QBMS SHALL display log entries with: timestamp, user email, role, action description, and resource identifier
6. THE QBMS SHALL provide pagination controls to navigate through log pages
7. WHEN a Student_User or Instructor_User attempts to access the Activity Logs page, THE QBMS SHALL redirect to an unauthorized page

### Requirement 4: Student Dashboard with Data Scoping

**User Story:** As a student, I want a dashboard that shows only my enrolled classes, my progress, and my assignments, so that I can focus on my own academic work without seeing other students' data.

#### Acceptance Criteria

1. WHEN a Student_User accesses the dashboard, THE QBMS SHALL display the Student_Dashboard
2. THE Student_Dashboard SHALL display only classes where the student has an active enrollment record
3. THE Student_Dashboard SHALL display the student's own exam scores and progress metrics
4. THE Student_Dashboard SHALL display assignments assigned to classes the student is enrolled in
5. THE Data_Scope_Middleware SHALL filter all student queries to return only data owned by or assigned to the authenticated student
6. WHEN a Student_User attempts to access another student's data via API, THE QBMS SHALL return HTTP 403 Forbidden
7. THE Student_Dashboard SHALL NOT display instructor management features, student lists, or system analytics
8. THE Student_Dashboard SHALL display: enrolled classes list, recent exam results, upcoming assignments, and personal progress charts

### Requirement 5: Instructor Dashboard with Data Scoping

**User Story:** As an instructor, I want a dashboard that shows classes I manage, students in those classes, and analytics for my classes, so that I can effectively manage my teaching responsibilities.

#### Acceptance Criteria

1. WHEN an Instructor_User accesses the dashboard, THE QBMS SHALL display the Instructor_Dashboard
2. THE Instructor_Dashboard SHALL display only classes where the instructor is assigned as the class instructor
3. THE Instructor_Dashboard SHALL display student lists only for classes the instructor manages
4. THE Instructor_Dashboard SHALL display subjects only for classes the instructor manages
5. THE Data_Scope_Middleware SHALL filter all instructor queries to return only classes and related data where the instructor is assigned
6. WHEN an Instructor_User attempts to access another instructor's class data via API, THE QBMS SHALL return HTTP 403 Forbidden
7. THE Instructor_Dashboard SHALL display: managed classes list, student enrollment counts, subject management interface, and class-specific analytics
8. THE Instructor_Dashboard SHALL provide navigation to: class details, student lists, subject management, and exam creation
9. THE Instructor_Dashboard SHALL NOT display system-wide analytics or classes managed by other instructors

### Requirement 6: Data Scoping Middleware Implementation

**User Story:** As a system architect, I want middleware that automatically enforces data scoping rules based on user roles, so that data isolation is guaranteed at the API layer without manual checks in every endpoint.

#### Acceptance Criteria

1. THE Data_Scope_Middleware SHALL intercept all API requests and attach user role and ID to the request context
2. WHEN a Student_User makes a query for classes, THE Data_Scope_Middleware SHALL add a filter condition: WHERE enrollments.user_id = authenticated_user_id
3. WHEN an Instructor_User makes a query for classes, THE Data_Scope_Middleware SHALL add a filter condition: WHERE classes.instructor_id = authenticated_user_id
4. WHEN an Admin_User makes a query, THE Data_Scope_Middleware SHALL NOT add scoping filters
5. THE Data_Scope_Middleware SHALL apply scoping to queries for: classes, subjects, exams, enrollments, and exam results
6. WHEN a user attempts to access a resource outside their scope, THE Data_Scope_Middleware SHALL return HTTP 403 Forbidden before executing the query
7. THE Data_Scope_Middleware SHALL log authorization failures to the Activity_Log_System
8. FOR ALL scoped queries, THE Data_Scope_Middleware SHALL ensure the scope filter cannot be bypassed by query parameters

### Requirement 7: Database Schema Migration for Subject-Class Relationship

**User Story:** As a system architect, I want to migrate the database schema so that subjects belong to classes rather than existing standalone, so that the data model reflects the logical hierarchy of the educational system.

#### Acceptance Criteria

1. THE Schema_Migration SHALL add a classId column to the subjects table with type integer and NOT NULL constraint
2. THE Schema_Migration SHALL add a foreign key constraint on subjects.classId referencing classes.id with ON DELETE CASCADE
3. THE Schema_Migration SHALL remove the subjectId column from the classes table
4. THE Schema_Migration SHALL migrate existing data: for each class with a subjectId, update the corresponding subject to have classId = class.id
5. THE Schema_Migration SHALL handle orphaned subjects (subjects not referenced by any class) by either deleting them or assigning them to a default class
6. THE Schema_Migration SHALL create a rollback script that reverses all schema changes
7. THE Schema_Migration SHALL execute within a database transaction to ensure atomicity
8. WHEN the migration completes, THE QBMS SHALL verify that all subjects have a valid classId and no classes have a subjectId

### Requirement 8: Subject Management Under Classes

**User Story:** As an instructor, I want to manage subjects within the context of a specific class, so that subjects are organized by class and I don't see subjects from other classes.

#### Acceptance Criteria

1. WHEN an Instructor_User views a class detail page, THE QBMS SHALL display subjects that belong to that class only
2. WHEN an Instructor_User creates a new subject, THE QBMS SHALL require selection of a class and set the subject's classId to the selected class
3. WHEN an Instructor_User edits a subject, THE QBMS SHALL allow changing the subject's classId to move it to a different class the instructor manages
4. THE QBMS SHALL NOT display subjects from Class A when viewing Class B
5. WHEN a Class_Entity is deleted, THE QBMS SHALL cascade delete all Subject_Entities with classId matching the deleted class
6. THE QBMS SHALL provide API endpoint GET /api/classes/:classId/subjects that returns subjects for the specified class
7. THE QBMS SHALL provide API endpoint POST /api/classes/:classId/subjects that creates a subject under the specified class
8. WHEN a Student_User views their enrolled class, THE QBMS SHALL display subjects belonging to that class

### Requirement 9: Subject-Class UI Flow

**User Story:** As an instructor, I want a UI flow where I first select a class and then manage subjects under that class, so that the interface reflects the hierarchical relationship between classes and subjects.

#### Acceptance Criteria

1. THE QBMS SHALL provide a class selection interface as the entry point to subject management
2. WHEN an Instructor_User selects a class, THE QBMS SHALL navigate to a class detail page showing subjects for that class
3. THE QBMS SHALL provide an "Add Subject" button on the class detail page that creates subjects under the current class
4. THE QBMS SHALL NOT provide a standalone "All Subjects" page that shows subjects across all classes
5. WHEN an Instructor_User creates a subject from the class detail page, THE QBMS SHALL automatically set the classId without requiring manual selection
6. THE QBMS SHALL display breadcrumb navigation: Classes > [Class Name] > Subjects
7. THE QBMS SHALL provide a subject list view filtered by the current class context
8. WHEN an Admin_User views subjects, THE QBMS SHALL display the associated class name for each subject

### Requirement 10: Migration Data Integrity Validation

**User Story:** As a system administrator, I want validation checks after the schema migration, so that I can confirm data integrity and identify any migration issues before deploying to production.

#### Acceptance Criteria

1. THE Schema_Migration SHALL include a validation step that checks all subjects have a non-null classId
2. THE Schema_Migration SHALL include a validation step that checks all subject classId values reference existing classes
3. THE Schema_Migration SHALL include a validation step that checks no classes table has a subjectId column
4. WHEN validation fails, THE Schema_Migration SHALL rollback all changes and report specific validation errors
5. THE Schema_Migration SHALL generate a migration report showing: subjects migrated, orphaned subjects handled, and validation results
6. THE Schema_Migration SHALL provide a dry-run mode that reports planned changes without executing them
7. FOR ALL subjects after migration, querying subjects with their class SHALL return valid class data (referential integrity test)
8. THE Schema_Migration SHALL verify that cascade delete works: deleting a test class SHALL delete its associated test subjects

### Requirement 11: Backward Compatibility Handling

**User Story:** As a developer, I want clear documentation of breaking changes and migration steps, so that I can update application code and inform users of the changes.

#### Acceptance Criteria

1. THE QBMS SHALL provide migration documentation listing all breaking API changes
2. THE QBMS SHALL document that GET /api/subjects (all subjects) endpoint is deprecated and replaced with GET /api/classes/:classId/subjects
3. THE QBMS SHALL document that POST /api/subjects now requires classId in the request body
4. THE QBMS SHALL provide a breaking changes log with: changed endpoints, new required parameters, and removed parameters
5. WHEN legacy API endpoints are called after migration, THE QBMS SHALL return HTTP 410 Gone with a message indicating the endpoint is deprecated
6. THE QBMS SHALL provide example API calls for the new subject management endpoints
7. THE QBMS SHALL document the database schema changes in the migration file comments

### Requirement 12: Activity Log Performance and Retention

**User Story:** As a system administrator, I want activity logs to be performant and have a retention policy, so that the logs don't degrade system performance or consume excessive storage.

#### Acceptance Criteria

1. THE Audit_Logs_Table SHALL have indexes on: timestamp, user_id, action_type, and resource_type
2. WHEN querying activity logs with filters, THE QBMS SHALL use indexes to optimize query performance
3. THE Activity_Log_System SHALL implement log rotation: logs older than 90 days SHALL be archived or deleted
4. THE QBMS SHALL provide a configuration setting for log retention period with default value 90 days
5. THE Activity_Log_System SHALL batch-insert logs asynchronously to avoid blocking request processing
6. WHEN log insertion fails, THE QBMS SHALL continue processing the request and log the insertion failure separately
7. THE QBMS SHALL provide an admin endpoint to manually trigger log archival: POST /api/admin/activity-logs/archive
8. FOR ALL activity log queries, response time SHALL be under 500ms for result sets up to 1000 records

