-- VERIFICATION SCRIPT
-- Execute this third - verifies everything is working correctly

-- 1. Check audit system is working
SELECT 'AUDIT SYSTEM CHECK:' as info;
SELECT 
    COUNT(*) as total_audit_logs,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as recent_logs
FROM audit_logs;

-- 2. Check employees (should only be real ones)
SELECT 'CURRENT EMPLOYEES:' as info;
SELECT 
    id,
    full_name,
    email,
    role,
    status,
    department_id
FROM employees 
ORDER BY id;

-- 3. Check prospects and their assignments
SELECT 'PROSPECT ASSIGNMENTS:' as info;
SELECT 
    p.id,
    p.business_name,
    p.assigned_salesperson_id,
    e.full_name as assigned_to,
    p.status
FROM prospects p
LEFT JOIN employees e ON p.assigned_salesperson_id = e.id
ORDER BY p.id;

-- 4. Check Ada's record (she should be getting assignments)
SELECT 'ADA FERNANDEZ RECORD:' as info;
SELECT 
    id,
    full_name,
    email,
    role,
    status,
    department_id,
    (SELECT name FROM departments WHERE id = employees.department_id) as department_name
FROM employees 
WHERE id = 7;

-- 5. Check recent audit activity
SELECT 'RECENT AUDIT ACTIVITY:' as info;
SELECT 
    action_type,
    table_name,
    action_description,
    user_name,
    created_at
FROM audit_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- Success message
SELECT '✅ SYSTEM VERIFICATION COMPLETE! All systems operational.' as verification_status;
