# Major System Refactor - Implementation Plan

## Branch: main

## Overview
Four major architectural changes to improve role-based access, data scoping, and system organization.

---

## 1. Role-Based Registration Flow ✅ COMPLETED

### Requirements
- No role dropdown - role determined by context
- Instructor invite → locked as "Instructor"
- Enrollment code → locked as "Student"  
- Direct registration → allow selection

### Implementation
✅ Updated `apps/web/src/app/register/page.tsx`:
- Added `roleIsLocked` logic based on invite/enrollment context
- Hide role dropdown when role is locked
- Show informational badge when role is locked
- Allow role selection only for direct registration

### Testing
- [ ] Test instructor invite link → should lock role as "Instructor"
- [ ] Test enrollment code link → should lock role as "Student"
- [ ] Test direct registration → should show role dropdown
- [ ] Verify enrollment number field only shows for students

---

## 2. Admin Activity Logs 🔄 TODO

### Requirements
- Full activity log panel for admin/super_admin roles
- Log: user actions, logins, registrations, class/subject changes
- Students and regular instructors cannot access logs

### Database Schema Changes Needed
```sql
CREATE TABLE activity_logs (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),  -- 'user', 'class', 'subject', 'exam', etc.
  entity_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
```

### Implementation Steps
1. Create migration for activity_logs table
2. Create audit middleware to log actions
3. Add logging to key routes (auth, classes, subjects, exams)
4. Create admin logs API endpoint
5. Create admin logs UI page
6. Add role check (super_admin only)

### Files to Create/Modify
- `packages/database/src/schema/activity-logs.ts` - New schema
- `apps/api/src/middleware/audit.ts` - Enhanced logging
- `apps/api/src/routes/admin-logs.ts` - New route
- `apps/web/src/app/dashboard/admin/logs/page.tsx` - New page

---

## 3. Separate Dashboards for Student vs Instructor 🔄 TODO

### Requirements
- Different dashboard views for students vs instructors
- Students: enrolled classes, own progress, own assignments
- Instructors: classes they manage, student lists, subject management
- Strict data scoping - students only see their own data

### Current Issues
- Both roles see same dashboard
- No data scoping by enrollment
- Students can potentially see other students' data

### Implementation Steps

#### A. Backend API Changes
1. **Update all API endpoints to scope by role:**
   - Students: Filter by `classEnrollments.studentId = userId`
   - Instructors: Filter by `classes.instructorId = userId`
   
2. **Add middleware for data scoping:**
   ```typescript
   // apps/api/src/middleware/scope.ts
   export function scopeByEnrollment(req, res, next) {
     if (req.user.role === 'student') {
       req.enrolledClassIds = await getStudentClassIds(req.user.userId);
     }
     next();
   }
   ```

3. **Update routes:**
   - `/api/classes` - scope by role
   - `/api/subjects` - scope by enrolled classes
   - `/api/exams` - scope by enrolled classes
   - `/api/attempts` - scope by student
   - `/api/analytics/student` - own data only
   - `/api/analytics/instructor` - managed classes only

#### B. Frontend Dashboard Changes
1. **Create role-specific dashboard components:**
   - `apps/web/src/app/dashboard/student/page.tsx`
   - `apps/web/src/app/dashboard/instructor/page.tsx`
   
2. **Update main dashboard to route by role:**
   ```typescript
   // apps/web/src/app/dashboard/page.tsx
   if (user.role === 'student') redirect('/dashboard/student');
   if (user.role === 'instructor') redirect('/dashboard/instructor');
   ```

3. **Student Dashboard Components:**
   - Enrolled classes list
   - Upcoming exams
   - Recent attempts/grades
   - Progress charts

4. **Instructor Dashboard Components:**
   - Classes managed
   - Student count per class
   - Recent exam activity
   - Question bank stats

### Files to Create/Modify
- `apps/api/src/middleware/scope.ts` - New middleware
- `apps/api/src/routes/*.ts` - Update all routes with scoping
- `apps/web/src/app/dashboard/student/page.tsx` - New
- `apps/web/src/app/dashboard/instructor/page.tsx` - New
- `apps/web/src/app/dashboard/page.tsx` - Update to route by role

---

## 4. Subjects Nested Under Classes 🔄 TODO (MAJOR)

### Requirements
- Subjects belong to classes, not standalone
- UI: Select Class → Then manage subjects
- Subjects from one class not visible in another
- Database schema change required

### Current Schema Issue
```typescript
// Current - subjects are standalone
subjects {
  subjectId
  subjectName
  description
}

classes {
  classId
  instructorId
  subjectId  // References subjects
  className
}
```

### New Schema Required
```typescript
// New - subjects belong to classes
subjects {
  subjectId
  classId  // NEW: Foreign key to classes
  subjectName
  description
  createdBy
  createdAt
}

classes {
  classId
  instructorId
  className
  enrollmentCode
  createdAt
}

// Remove subjectId from classes table
```

### Migration Strategy
1. **Create new column:**
   ```sql
   ALTER TABLE subjects ADD COLUMN class_id UUID REFERENCES classes(class_id);
   ```

2. **Data migration:**
   ```sql
   -- For each class, copy its subjectId to the subject's classId
   UPDATE subjects s
   SET class_id = c.class_id
   FROM classes c
   WHERE c.subject_id = s.subject_id;
   ```

3. **Make classId required:**
   ```sql
   ALTER TABLE subjects ALTER COLUMN class_id SET NOT NULL;
   ```

4. **Remove subjectId from classes:**
   ```sql
   ALTER TABLE classes DROP COLUMN subject_id;
   ```

5. **Add index:**
   ```sql
   CREATE INDEX idx_subjects_class ON subjects(class_id);
   ```

### API Changes
1. **Update subjects routes:**
   - `GET /api/subjects?classId=xxx` - Required parameter
   - `POST /api/subjects` - Require classId in body
   - `GET /api/subjects/:id` - Check user has access to class
   
2. **Update classes routes:**
   - `GET /api/classes/:id/subjects` - New endpoint
   - Remove subjectId from class creation

3. **Update topics routes:**
   - Topics already reference subjects, no change needed
   - But need to verify class access through subject

### UI Changes
1. **Remove standalone subjects page**
2. **Add subjects tab/section within class detail page:**
   ```
   /dashboard/classes/:classId
     - Overview
     - Students
     - Subjects ← NEW
     - Exams
   ```

3. **Update navigation:**
   - Remove "Subjects" from main nav
   - Add "Subjects" within class management

### Files to Create/Modify
- `packages/database/drizzle/XXXX_subjects_nested_in_classes.sql` - Migration
- `packages/database/src/schema/subjects.ts` - Update schema
- `apps/api/src/routes/subjects.ts` - Update all endpoints
- `apps/api/src/routes/classes.ts` - Add subjects endpoints
- `apps/web/src/app/dashboard/classes/[classId]/subjects/page.tsx` - New
- `apps/web/src/app/dashboard/subjects/page.tsx` - Remove or redirect

---

## Implementation Order

### Phase 1: Registration Flow ✅
- Already completed

### Phase 2: Admin Logs (1-2 days)
1. Create database schema
2. Add audit middleware
3. Create API endpoints
4. Create admin UI

### Phase 3: Separate Dashboards (2-3 days)
1. Add data scoping middleware
2. Update all API endpoints
3. Create role-specific dashboard pages
4. Test data isolation

### Phase 4: Subjects Under Classes (3-4 days) ⚠️ BREAKING CHANGE
1. Create migration script
2. Test migration on dev database
3. Update database schema
4. Update API endpoints
5. Update UI components
6. Test thoroughly
7. Deploy with downtime window

---

## Testing Checklist

### Registration Flow
- [ ] Instructor invite link locks role
- [ ] Enrollment code locks role as student
- [ ] Direct registration shows dropdown
- [ ] OTP verification works for all flows

### Admin Logs
- [ ] Super admin can access logs
- [ ] Regular users cannot access logs
- [ ] All actions are logged
- [ ] Logs show correct details

### Separate Dashboards
- [ ] Students only see enrolled classes
- [ ] Students cannot see other students' data
- [ ] Instructors only see managed classes
- [ ] Instructors cannot see other instructors' classes
- [ ] Super admin sees everything

### Subjects Under Classes
- [ ] Subjects are scoped to classes
- [ ] Cannot access subjects from other classes
- [ ] Migration preserves all data
- [ ] UI flows work correctly
- [ ] Topics still work with nested subjects

---

## Rollback Plan

### For Admin Logs
- Remove audit middleware
- Drop activity_logs table
- Remove admin logs UI

### For Separate Dashboards
- Revert API scoping changes
- Restore original dashboard
- Remove role-specific pages

### For Subjects Under Classes ⚠️
- Restore database backup
- Revert schema changes
- Restore original API endpoints
- Restore original UI

**IMPORTANT:** Test Phase 4 thoroughly on staging before production!

---

## Current Status

✅ Phase 1: Registration Flow - COMPLETED
⏳ Phase 2: Admin Logs - TODO
⏳ Phase 3: Separate Dashboards - TODO  
⏳ Phase 4: Subjects Under Classes - TODO

Ready to proceed with Phase 2?
