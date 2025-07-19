-- Update existing prospects to be assigned to Ada Fernandez (the active sales person)
-- This ensures the email service will find Ada's name correctly

UPDATE prospects 
SET assigned_salesperson_id = 7  -- Ada's employee ID
WHERE assigned_salesperson_id = 1  -- Currently assigned to inactive Sarah Johnson
   OR assigned_salesperson_id IS NULL;

-- Verify the update
SELECT 
    p.id,
    p.business_name,
    p.assigned_salesperson_id,
    e.full_name as salesperson_name,
    e.status as salesperson_status
FROM prospects p
LEFT JOIN employees e ON p.assigned_salesperson_id = e.id
ORDER BY p.id;

-- Show Ada's info for confirmation
SELECT 
    id,
    full_name,
    email,
    department_id,
    status
FROM employees 
WHERE id = 7;
