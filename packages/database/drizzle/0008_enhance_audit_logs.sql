-- Migration: 0008_enhance_audit_logs.sql
-- Description: Enhance audit_logs table with additional fields for comprehensive activity logging

BEGIN;

-- Add new columns to audit_logs table
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_role user_role;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details TEXT;

-- Backfill user_email and user_role from users table for existing records
UPDATE audit_logs al
SET 
  user_email = u.email,
  user_role = u.role
FROM users u
WHERE al.user_id = u.user_id
  AND al.user_email IS NULL;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_role ON audit_logs(user_role);

-- Verify the migration
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  -- Check if all new columns exist
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'audit_logs' 
    AND column_name IN ('user_email', 'user_role', 'details');
  
  IF col_count < 3 THEN
    RAISE EXCEPTION 'Migration failed: Not all columns were added';
  END IF;
  
  RAISE NOTICE 'Migration completed successfully';
END $$;

COMMIT;
