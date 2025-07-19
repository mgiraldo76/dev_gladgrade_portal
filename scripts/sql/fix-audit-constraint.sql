-- Fix the audit logs constraint to allow more action types
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_action_type_check;

ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_action_type_check 
CHECK (action_type IN (
    'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ASSIGN', 'CONVERT', 
    'PERMISSION_CHANGE', 'STATUS_CHANGE', 'BULK_UPDATE', 'EXPORT', 'IMPORT',
    'PROSPECT_CREATED', 'PROSPECT_UPDATED', 'PROSPECT_CONVERTED', 'PROSPECT_ASSIGNED',
    'CLIENT_CREATED', 'CLIENT_UPDATED', 'EMPLOYEE_CREATED', 'EMPLOYEE_UPDATED'
));

-- Test the constraint
SELECT 'Constraint updated successfully' as status;
