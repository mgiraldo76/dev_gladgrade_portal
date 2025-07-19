-- Create settings and departments tables for GladGrade Portal

-- Organization settings table
CREATE TABLE IF NOT EXISTS organization_settings (
    id SERIAL PRIMARY KEY,
    org_name VARCHAR(255) NOT NULL DEFAULT 'GladGrade Holding Corporation',
    org_domain VARCHAR(255) NOT NULL DEFAULT 'gladgrade.com',
    org_address TEXT,
    support_email VARCHAR(255),
    admin_email VARCHAR(255),
    min_gcsg_score INTEGER DEFAULT 300,
    max_gcsg_score INTEGER DEFAULT 850,
    gcsg_update_frequency VARCHAR(50) DEFAULT 'daily',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    employee_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name)
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Department permissions junction table
CREATE TABLE IF NOT EXISTS department_permissions (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(department_id, permission_id)
);

-- Notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255), -- Firebase UID or email
    email_alerts BOOLEAN DEFAULT true,
    review_notifications BOOLEAN DEFAULT true,
    security_alerts BOOLEAN DEFAULT true,
    weekly_reports BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Security settings table
CREATE TABLE IF NOT EXISTS security_settings (
    id SERIAL PRIMARY KEY,
    two_factor_required BOOLEAN DEFAULT true,
    password_complexity_required BOOLEAN DEFAULT true,
    session_timeout_minutes INTEGER DEFAULT 30,
    api_rate_limit_per_minute INTEGER DEFAULT 1000,
    max_file_upload_mb INTEGER DEFAULT 10,
    maintenance_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default organization settings
INSERT INTO organization_settings (org_name, org_domain, org_address, support_email, admin_email)
VALUES (
    'GladGrade Holding Corporation',
    'gladgrade.com',
    'Miami, Florida, USA',
    'support@gladgrade.com',
    'admin@gladgrade.com'
) ON CONFLICT DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, description) VALUES
    ('user_management', 'Manage users and roles'),
    ('content_moderation', 'Moderate reviews and content'),
    ('review_management', 'Manage customer reviews'),
    ('image_approval', 'Approve uploaded images'),
    ('customer_support', 'Handle customer support tickets'),
    ('basic_reports', 'View basic analytics reports'),
    ('advanced_reports', 'View detailed analytics and exports'),
    ('system_admin', 'Full system administration'),
    ('client_management', 'Manage business clients'),
    ('partner_relations', 'Manage partner relationships'),
    ('data_export', 'Export data and reports'),
    ('analytics_dashboard', 'Access analytics dashboard'),
    ('full_access', 'Complete system access'),
    ('basic_access', 'Basic system access')
ON CONFLICT (name) DO NOTHING;

-- Insert default departments
INSERT INTO departments (name, employee_count) VALUES
    ('Content Moderation', 8),
    ('Customer Support', 12),
    ('Operations', 5),
    ('Data Analytics', 6),
    ('Business Development', 4)
ON CONFLICT (name) DO NOTHING;

-- Assign default permissions to departments
WITH dept_perms AS (
    SELECT 
        d.id as dept_id,
        p.id as perm_id
    FROM departments d
    CROSS JOIN permissions p
    WHERE 
        (d.name = 'Content Moderation' AND p.name IN ('content_moderation', 'review_management', 'image_approval')) OR
        (d.name = 'Customer Support' AND p.name IN ('customer_support', 'basic_reports')) OR
        (d.name = 'Operations' AND p.name IN ('full_access', 'system_admin', 'user_management')) OR
        (d.name = 'Data Analytics' AND p.name IN ('advanced_reports', 'data_export', 'analytics_dashboard')) OR
        (d.name = 'Business Development' AND p.name IN ('client_management', 'partner_relations'))
)
INSERT INTO department_permissions (department_id, permission_id)
SELECT dept_id, perm_id FROM dept_perms
ON CONFLICT (department_id, permission_id) DO NOTHING;

-- Insert default security settings
INSERT INTO security_settings DEFAULT VALUES ON CONFLICT DO NOTHING;
