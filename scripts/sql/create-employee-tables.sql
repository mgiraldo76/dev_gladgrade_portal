-- Create employee tables for GladGrade Portal

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) UNIQUE, -- Firebase user ID
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'employee', -- employee, moderator, admin, super_admin
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, inactive, suspended
    hire_date DATE DEFAULT CURRENT_DATE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employee permissions (in addition to department permissions)
CREATE TABLE IF NOT EXISTS employee_permissions (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    granted_by INTEGER REFERENCES employees(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, permission_id)
);

-- Employee sessions/activity log
CREATE TABLE IF NOT EXISTS employee_sessions (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Insert some sample employees
INSERT INTO employees (email, full_name, department_id, role, status) VALUES
    ('sarah@gladgrade.com', 'Sarah Johnson', 
     (SELECT id FROM departments WHERE name = 'Content Moderation' LIMIT 1), 
     'moderator', 'active'),
    ('mike@gladgrade.com', 'Mike Chen', 
     (SELECT id FROM departments WHERE name = 'Customer Support' LIMIT 1), 
     'employee', 'active'),
    ('lisa@gladgrade.com', 'Lisa Rodriguez', 
     (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), 
     'admin', 'active'),
    ('miguel.giraldo@gladgrade.com', 'Miguel Giraldo', 
     (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), 
     'super_admin', 'active')
ON CONFLICT (email) DO NOTHING;

-- Grant some individual permissions to employees
WITH emp_perms AS (
    SELECT 
        e.id as emp_id,
        p.id as perm_id
    FROM employees e
    CROSS JOIN permissions p
    WHERE 
        (e.email = 'sarah@gladgrade.com' AND p.name IN ('content_moderation', 'image_approval')) OR
        (e.email = 'mike@gladgrade.com' AND p.name IN ('customer_support', 'basic_reports')) OR
        (e.email = 'lisa@gladgrade.com' AND p.name IN ('user_management', 'advanced_reports')) OR
        (e.email = 'miguel.giraldo@gladgrade.com' AND p.name IN ('full_access', 'system_admin'))
)
INSERT INTO employee_permissions (employee_id, permission_id)
SELECT emp_id, perm_id FROM emp_perms
ON CONFLICT (employee_id, permission_id) DO NOTHING;

-- Update department employee counts
UPDATE departments SET employee_count = (
    SELECT COUNT(*) FROM employees WHERE department_id = departments.id AND status = 'active'
);
