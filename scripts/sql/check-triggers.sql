-- Check for triggers on prospects table
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.event_object_table,
    t.action_statement,
    t.action_timing,
    t.action_orientation
FROM information_schema.triggers t
WHERE t.event_object_table = 'prospects'
ORDER BY t.trigger_name;

-- Check for trigger functions
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname LIKE '%audit%' OR p.proname LIKE '%trigger%'
ORDER BY p.proname;

-- Check what action_type the trigger is trying to use
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    most_common_vals
FROM pg_stats 
WHERE tablename = 'audit_logs' 
AND attname = 'action_type';
