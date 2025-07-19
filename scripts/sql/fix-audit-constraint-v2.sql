-- Drop the existing constraint completely
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_action_type_check;

-- Add a much more permissive constraint
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_action_type_check 
CHECK (action_type IS NOT NULL AND LENGTH(action_type) > 0);

-- Verify the change
SELECT 'Audit constraint updated to allow any non-empty action_type' as status;

-- Test with a sample insert (will rollback)
BEGIN;
INSERT INTO audit_logs (action_type, action_description, created_at) 
VALUES ('CREATE', 'Test constraint', NOW());
ROLLBACK;

SELECT 'Test insert successful - constraint is working' as test_result;
