-- Dry run: 0009_subjects_nested_under_classes_dryrun.sql
-- Description: Preview migration changes without executing them

-- Show current state
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
WHERE c.class_id IS NULL
ORDER BY status, class_name;
