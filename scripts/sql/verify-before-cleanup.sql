-- Run this BEFORE cleanup to see what will be affected
-- This shows you exactly what the cleanup will do

-- 1. Show current employees (what will be kept vs deleted)
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

-- 2. Show prospects that will be reassigned
SELECT 
    p.id,
    p.business_name,
    p.assigned_salesperson_id,
    e.full_name as current_owner,
    CASE 
        WHEN e.email IN ('sarah@gladgrade.com', 'mike@gladgrade.com', 'lisa@gladgrade.com')
        THEN '🔄 WILL BE REASSIGNED TO ADA'
        ELSE '✅ NO CHANGE NEEDED'
    END as reassignment_action
FROM prospects p
LEFT JOIN employees e ON p.assigned_salesperson_id = e.id;

-- 3. Show commissions that will be reassigned
SELECT 
    c.id,
    c.salesperson_id,
    e.full_name as current_salesperson,
    c.sale_amount,
    CASE 
        WHEN e.email IN ('sarah@gladgrade.com', 'mike@gladgrade.com', 'lisa@gladgrade.com')
        THEN '🔄 WILL BE REASSIGNED TO ADA'
        ELSE '✅ NO CHANGE NEEDED'
    END as reassignment_action
FROM commissions c
LEFT JOIN employees e ON c.salesperson_id = e.id;

-- 4. Show what Ada's record looks like (she'll get the reassignments)
SELECT 
    id,
    full_name,
    email,
    role,
    status,
    department_id
FROM employees 
WHERE id = 7; -- Ada Fernandez

-- Summary
SELECT 
    'CLEANUP SUMMARY' as info,
    (SELECT COUNT(*) FROM employees WHERE email IN ('sarah@gladgrade.com', 'mike@gladgrade.com', 'lisa@gladgrade.com')) as employees_to_delete,
    (SELECT COUNT(*) FROM prospects WHERE assigned_salesperson_id IN (SELECT id FROM employees WHERE email IN ('sarah@gladgrade.com', 'mike@gladgrade.com', 'lisa@gladgrade.com'))) as prospects_to_reassign,
    (SELECT COUNT(*) FROM commissions WHERE salesperson_id IN (SELECT id FROM employees WHERE email IN ('sarah@gladgrade.com', 'mike@gladgrade.com', 'lisa@gladgrade.com'))) as commissions_to_reassign;
