-- Check the current constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'audit_logs_action_type_check';

-- Also check if the table exists and its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
ORDER BY ordinal_position;

-- Check what action_type values currently exist
SELECT DISTINCT action_type, COUNT(*) 
FROM audit_logs 
GROUP BY action_type;
