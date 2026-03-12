# Phase 4: Breaking Changes Documentation

## Overview
Phase 4 introduces a major schema change where subjects are now nested under classes instead of being standalone entities. This is a **BREAKING CHANGE** that requires database migration and API updates.

## Database Schema Changes

### Before (Old Schema)
```typescript
subjects {
  subjectId: UUID
  subjectName: VARCHAR
  description: TEXT
}

classes {
  classId: UUID
  instructorId: UUID
  subjectId: UUID  // References subjects
  className: VARCHAR
  enrollmentCode: VARCHAR
}
```

### After (New Schema)
```typescript
subjects {
  subjectId: UUID
  classId: UUID  // NEW: References classes
  subjectName: VARCHAR
  description: TEXT
  createdBy: UUID  // NEW
  createdAt: TIMESTAMP  // NEW
}

classes {
  classId: UUID
  instructorId: UUID
  // subjectId REMOVED
  className: VARCHAR
  enrollmentCode: VARCHAR
}
```

## API Changes

### Deprecated Endpoints

#### ❌ GET /api/subjects
**Status**: 410 Gone  
**Replacement**: GET /api/classes/:classId/subjects  
**Reason**: Subjects are now scoped to classes

**Old Usage**:
```javascript
GET /api/subjects
Response: [{ subjectId, subjectName, description }, ...]
```

**New Usage**:
```javascript
GET /api/classes/:classId/subjects
Response: [{ subjectId, classId, subjectName, description, createdBy, createdAt }, ...]
```

### Modified Endpoints

#### POST /api/subjects
**Change**: Now requires `classId` parameter

**Old Request**:
```json
{
  "subjectName": "Mathematics",
  "description": "Math subject"
}
```

**New Request**:
```json
{
  "classId": "uuid-here",
  "subjectName": "Mathematics",
  "description": "Math subject"
}
```

#### POST /api/classes
**Change**: No longer requires `subjectId` parameter

**Old Request**:
```json
{
  "subjectId": "uuid-here",
  "className": "Class A"
}
```

**New Request**:
```json
{
  "className": "Class A"
}
```

### New Endpoints

#### GET /api/classes/:classId/subjects
**Description**: Get all subjects for a specific class  
**Access**: Students (enrolled), Instructors (managed), Admins (all)

**Request**:
```
GET /api/classes/abc-123/subjects
```

**Response**:
```json
[
  {
    "subjectId": "sub-1",
    "classId": "abc-123",
    "subjectName": "Mathematics",
    "description": "Math subject",
    "createdBy": "user-id",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

## Migration Steps

### 1. Backup Database
```bash
pg_dump -h localhost -p 5433 -U postgres qbms > backup_before_phase4.sql
```

### 2. Run Dry Run (Preview Changes)
```bash
psql -h localhost -p 5433 -U postgres qbms < packages/database/drizzle/0009_subjects_nested_under_classes_dryrun.sql
```

### 3. Execute Migration
```bash
psql -h localhost -p 5433 -U postgres qbms < packages/database/drizzle/0009_subjects_nested_under_classes.sql
```

### 4. Verify Migration
Check that:
- All subjects have a valid `classId`
- No classes have a `subjectId` column
- Cascade delete works (test on a copy)

### 5. Rollback (If Needed)
```bash
psql -h localhost -p 5433 -U postgres qbms < packages/database/drizzle/0009_subjects_nested_under_classes_rollback.sql
```

## Frontend Changes Required

### Update Subject Creation Forms
```typescript
// OLD
const createSubject = async (name: string, description: string) => {
  await api.post('/subjects', { subjectName: name, description });
};

// NEW
const createSubject = async (classId: string, name: string, description: string) => {
  await api.post('/subjects', { classId, subjectName: name, description });
};
```

### Update Subject Listing
```typescript
// OLD
const fetchSubjects = async () => {
  const response = await api.get('/subjects');
  return response.data;
};

// NEW
const fetchSubjects = async (classId: string) => {
  const response = await api.get(`/classes/${classId}/subjects`);
  return response.data;
};
```

### Update Class Creation Forms
```typescript
// OLD
const createClass = async (name: string, subjectId: string) => {
  await api.post('/classes', { className: name, subjectId });
};

// NEW
const createClass = async (name: string) => {
  await api.post('/classes', { className: name });
};
```

## UI Flow Changes

### Old Flow
1. Navigate to "Subjects" page (standalone)
2. View all subjects
3. Create/edit subjects independently
4. Create class and select existing subject

### New Flow
1. Navigate to "Classes" page
2. Select a class
3. View subjects for that class
4. Create/edit subjects within class context
5. Subjects are automatically associated with the class

## Data Migration Details

### What Happens to Existing Data

1. **Subjects Referenced by Classes**: Automatically migrated
   - Subject's `classId` set to the class that references it
   - Subject's `createdBy` set to class instructor
   - Subject's `createdAt` set to class creation date

2. **Orphaned Subjects**: Deleted
   - Subjects not referenced by any class are removed
   - Review dry-run output to identify orphans before migration

3. **Classes**: Updated
   - `subjectId` column removed
   - Relationship reversed (classes now have many subjects)

## Testing Checklist

After migration, verify:

- [ ] All subjects have a valid `classId`
- [ ] GET /api/subjects returns 410 Gone
- [ ] GET /api/classes/:id/subjects works
- [ ] POST /api/subjects requires classId
- [ ] POST /api/classes doesn't require subjectId
- [ ] Subject creation within class works
- [ ] Subject editing works
- [ ] Subject deletion works
- [ ] Cascade delete: deleting class deletes its subjects
- [ ] Students can only see subjects from enrolled classes
- [ ] Instructors can only see subjects from managed classes
- [ ] Admins can see all subjects

## Rollback Plan

If issues occur:

1. Stop the application
2. Restore database from backup:
   ```bash
   psql -h localhost -p 5433 -U postgres qbms < backup_before_phase4.sql
   ```
3. Or run rollback script:
   ```bash
   psql -h localhost -p 5433 -U postgres qbms < packages/database/drizzle/0009_subjects_nested_under_classes_rollback.sql
   ```
4. Revert code changes (git revert)
5. Restart application

## Timeline

- **Preparation**: Review this document, backup database
- **Downtime Window**: 15-30 minutes
- **Migration**: 5-10 minutes
- **Verification**: 10-15 minutes
- **Rollback Time** (if needed): 10 minutes

## Support

If you encounter issues:
1. Check migration logs for errors
2. Verify all subjects have classId
3. Check application logs
4. Review API responses
5. Test with different user roles

## Notes

- This is a one-way migration (data structure changes)
- Requires application downtime
- All API clients must be updated
- Frontend must be updated simultaneously
- Test thoroughly on staging before production
