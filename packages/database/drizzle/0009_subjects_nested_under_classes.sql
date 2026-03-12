-- Migration: 0009_subjects_nested_under_classes.sql
-- Description: Restructure subject-class relationship - subjects belong to classes

BEGIN;

-- Step 1: Add classId column to subjects (nullable initially)
ALTER TABLE subjects 
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(class_id) ON DELETE CASCADE;

-- Step 2: Add metadata columns
ALTER TABLE subjects 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(user_id),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 3: Migrate existing data
-- For each class, set the subject's classId to the class's classId
UPDATE subjects s
SET class_id = c.class_id,
    created_by = c.instructor_id,
    created_at = c.created_at
FROM classes c
WHERE c.subject_id = s.subject_id
  AND s.class_id IS NULL;

-- Step 4: Handle orphaned subjects (subjects not referenced by any class)
-- Delete orphaned subjects
DELETE FROM subjects WHERE class_id IS NULL;

-- Step 5: Make classId NOT NULL
ALTER TABLE subjects 
ALTER COLUMN class_id SET NOT NULL;

-- Step 6: Create index for performance
CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON subjects(class_id);

-- Step 7: Remove subjectId from classes
ALTER TABLE classes 
DROP COLUMN IF EXISTS subject_id;

-- Step 8: Verify data integrity
DO $$
DECLARE
  orphan_count INTEGER;
  invalid_refs INTEGER;
  old_column_exists INTEGER;
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
  SELECT COUNT(*) INTO old_column_exists
  FROM information_schema.columns
  WHERE table_name = 'classes' AND column_name = 'subject_id';
  
  IF old_column_exists > 0 THEN
    RAISE EXCEPTION 'Migration failed: subject_id column still exists in classes table';
  END IF;
  
  -- Check that all subjects have classId
  SELECT COUNT(*) INTO orphan_count
  FROM subjects
  WHERE class_id IS NULL;
  
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % subjects have NULL class_id', orphan_count;
  END IF;
  
  RAISE NOTICE 'Migration validation passed successfully';
END $$;

COMMIT;
