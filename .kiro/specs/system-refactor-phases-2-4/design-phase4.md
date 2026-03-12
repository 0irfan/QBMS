# Phase 4: Subjects Nested Under Classes - Technical Design

## Overview

This phase involves a major database schema change to reverse the relationship between classes and subjects. Currently, classes reference subjects (one-to-one). After this change, subjects will reference classes (many-to-one), allowing multiple subjects per class.

## Database Schema Changes

### Current Schema

```typescript
// Current structure
subjects {
  subjectId: UUID PRIMARY KEY
  subjectName: VARCHAR(255)
  description: TEXT
}

classes {
  classId: UUID PRIMARY KEY
  instructorId: UUID REFERENCES users
  subjectId: UUID REFERENCES subjects  // ← TO BE REMOVED
  className: VARCHAR(255)
  enrollmentCode: VARCHAR(50)
}
```

### Target Schema

```typescript
// New structure
subjects {
  subjectId: UUID PRIMARY KEY
  classId: UUID REFERENCES classes  // ← NEW FIELD
  subjectName: VARCHAR(255)
  description: TEXT
  createdBy: UUID REFERENCES users
  createdAt: TIMESTAMP
}

classes {
  classId: UUID PRIMARY KEY
  instructorId: UUID REFERENCES users
  className: VARCHAR(255)
  enrollmentCode: VARCHAR(50)
  createdAt: TIMESTAMP
  // subjectId removed
}
```

## Migration Strategy

### Migration Steps

```sql
-- Migration: 0009_subjects_nested_under_classes.sql

BEGIN;

-- Step 1: Add classId column to subjects (nullable initially)
ALTER TABLE subjects 
ADD COLUMN class_id UUID REFERENCES classes(class_id) ON DELETE CASCADE;

-- Step 2: Add metadata columns
ALTER TABLE subjects 
ADD COLUMN created_by UUID REFERENCES users(user_id),
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 3: Migrate existing data
-- For each class, set the subject's classId to the class's classId
UPDATE subjects s
SET class_id = c.class_id,
    created_by = c.instructor_id,
    created_at = c.created_at
FROM classes c
WHERE c.subject_id = s.subject_id;

-- Step 4: Handle orphaned subjects (subjects not referenced by any class)
-- Option A: Delete them
DELETE FROM subjects WHERE class_id IS NULL;

-- Option B: Create a default "Uncategorized" class and assign orphans
-- INSERT INTO classes (instructor_id, class_name, enrollment_code)
-- VALUES ((SELECT user_id FROM users WHERE role = 'super_admin' LIMIT 1), 
--         'Uncategorized', 'ORPHAN');
-- UPDATE subjects SET class_id = (SELECT class_id FROM classes WHERE class_name = 'Uncategorized')
-- WHERE class_id IS NULL;

-- Step 5: Make classId NOT NULL
ALTER TABLE subjects 
ALTER COLUMN class_id SET NOT NULL;

-- Step 6: Create index for performance
CREATE INDEX idx_subjects_class_id ON subjects(class_id);

-- Step 7: Remove subjectId from classes
ALTER TABLE classes 
DROP COLUMN subject_id;

-- Step 8: Verify data integrity
DO $$
DECLARE
  orphan_count INTEGER;
  invalid_refs INTEGER;
BEGIN
  -- Check for subjects without valid class references
  SELECT COUNT(*) INTO invalid_refs
  FROM subjects s
  LEFT JOIN classes c ON s.class_id = c.class_id
  WHERE c.class_id IS NULL;
  
  IF invalid_refs > 0 THEN
    RAISE EXCEPTION 'Migration failed: % subjects have invalid class references', invalid_refs;
  END IF;
  
  -- Check for classes with old subject_id column
  SELECT COUNT(*) INTO orphan_count
  FROM information_schema.columns
  WHERE table_name = 'classes' AND column_name = 'subject_id';
  
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: subject_id column still exists in classes table';
  END IF;
  
  RAISE NOTICE 'Migration validation passed';
END $$;

COMMIT;
```

### Rollback Script

```sql
-- Rollback: 0009_subjects_nested_under_classes_rollback.sql

BEGIN;

-- Step 1: Add subjectId back to classes
ALTER TABLE classes 
ADD COLUMN subject_id UUID REFERENCES subjects(subject_id);

-- Step 2: Restore the relationship (take first subject from each class)
WITH first_subjects AS (
  SELECT DISTINCT ON (class_id) 
    class_id, 
    subject_id
  FROM subjects
  ORDER BY class_id, created_at
)
UPDATE classes c
SET subject_id = fs.subject_id
FROM first_subjects fs
WHERE c.class_id = fs.class_id;

-- Step 3: Remove classId from subjects
ALTER TABLE subjects 
DROP COLUMN class_id,
DROP COLUMN created_by,
DROP COLUMN created_at;

-- Step 4: Drop index
DROP INDEX IF EXISTS idx_subjects_class_id;

COMMIT;
```

### Dry Run Script

```sql
-- Dry run: Shows what would happen without making changes

SELECT 
  'Classes with subjects' as category,
  COUNT(*) as count
FROM classes
WHERE subject_id IS NOT NULL

UNION ALL

SELECT 
  'Orphaned subjects' as category,
  COUNT(*) as count
FROM subjects s
LEFT JOIN classes c ON c.subject_id = s.subject_id
WHERE c.class_id IS NULL

UNION ALL

SELECT 
  'Total subjects' as category,
  COUNT(*) as count
FROM subjects;

-- Show which subjects will be assigned to which classes
SELECT 
  c.class_id,
  c.class_name,
  s.subject_id,
  s.subject_name,
  'Will be migrated' as status
FROM classes c
INNER JOIN subjects s ON c.subject_id = s.subject_id

UNION ALL

SELECT 
  NULL as class_id,
  'NO CLASS' as class_name,
  s.subject_id,
  s.subject_name,
  'ORPHANED - Will be deleted' as status
FROM subjects s
LEFT JOIN classes c ON c.subject_id = s.subject_id
WHERE c.class_id IS NULL;
```

