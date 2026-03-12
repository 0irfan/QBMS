-- Rollback: 0009_subjects_nested_under_classes_rollback.sql
-- Description: Rollback script to reverse subjects-under-classes migration

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
DROP COLUMN IF EXISTS class_id,
DROP COLUMN IF EXISTS created_by,
DROP COLUMN IF EXISTS created_at;

-- Step 4: Drop index
DROP INDEX IF EXISTS idx_subjects_class_id;

COMMIT;

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'Rollback completed successfully';
END $$;
