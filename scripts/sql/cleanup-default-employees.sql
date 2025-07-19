-- CLEANUP DEFAULT SAMPLE EMPLOYEES
-- Execute this second - removes Sarah, Mike, Lisa and reassigns their data to Ada

-- Show what will be affected before cleanup
SELECT 'BEFORE CLEANUP - Current Employees:' as info;
SELECT 
    id, 
    full_name, 
    email, 
    role, 
    status,
    CASE 
        WHEN email IN ('sarah@gladgrade.com', 'mike@gladgrade.com', 'lisa@gladgrade.com') 
        THEN '❌ WILL BE DELETED' 
        ELSE '✅ WILL BE KEPT' 
    END as cleanup_action
FROM employees 
ORDER BY id;

-- Update any prospects that are assigned to default employees to be assigned to Ada
UPDATE prospects 
SET assigned_salesperson_id = 7 -- Ada Fernandez
WHERE assigned_salesperson_id IN (
    SELECT id FROM employees 
    WHERE email IN ('sarah@gladgrade.com', 'mike@gladgrade.com', 'lisa@gladgrade.com')
);

-- Update any commissions that reference default employees
UPDATE commissions 
SET salesperson_id = 7 -- Ada Fernandez
WHERE salesperson_id IN (
    SELECT id FROM employees 
    WHERE email IN ('sarah@gladgrade.com', 'mike@gladgrade.com', 'lisa@gladgrade.com')
);

-- Update any business clients assigned to default sales reps
UPDATE business_clients 
SET sales_rep_id = 7 -- Ada Fernandez
WHERE sales_rep_id IN (
    SELECT id FROM employees 
    WHERE email IN ('sarah@gladgrade.com', 'mike@gladgrade.com', 'lisa@gladgrade.com')
);

-- Remove employee permissions for default employees
DELETE FROM employee_permissions 
WHERE employee_id IN (
    SELECT id FROM employees 
    WHERE email IN ('sarah@gladgrade.com', 'mike@gladgrade.com', 'lisa@gladgrade.com')
);

-- Remove employee sessions for default employees
DELETE FROM employee_sessions 
WHERE employee_id IN (
    SELECT id FROM employees 
    WHERE email IN ('sarah@gladgrade.com', 'mike@gladgrade.com', 'lisa@gladgrade.com')
);

-- Remove sales activities by default employees
DELETE FROM sales_activities 
WHERE employee_id IN (
    SELECT id FROM employees 
    WHERE email IN ('sarah@gladgrade.com', 'mike@gladgrade.com', 'lisa@gladgrade.com')
);

-- Remove email logs for default employees
DELETE FROM email_logs 
WHERE employee_id IN (
    SELECT id FROM employees 
    WHERE email IN ('sarah@gladgrade.com', 'mike@gladgrade.com', 'lisa@gladgrade.com')
);

-- Finally, delete the default employees
DELETE FROM employees 
WHERE email IN ('sarah@gladgrade.com', 'mike@gladgrade.com', 'lisa@gladgrade.com');

-- Update department employee counts
UPDATE departments SET employee_count = (
    SELECT COUNT(*) FROM employees WHERE department_id = departments.id AND status = 'active'
);

-- Show the cleaned up employee list
SELECT 'AFTER CLEANUP - Remaining Employees:' as info;
SELECT 
    id, 
    full_name, 
    email, 
    role, 
    status,
    department_id,
    created_at
FROM employees 
ORDER BY id;

-- Show updated department counts
SELECT 'UPDATED DEPARTMENT COUNTS:' as info;
SELECT 
    d.name as department_name,
    d.employee_count as recorded_count,
    COUNT(e.id) as actual_count
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
GROUP BY d.id, d.name, d.employee_count
ORDER BY d.name;

-- Success message
SELECT '✅ DEFAULT SAMPLE EMPLOYEES REMOVED SUCCESSFULLY! Only real employees remain.' as cleanup_status;
