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



-- Updated client/business tables for GladGrade Portal
-- Version 2: Self-registration and business claiming (FIXED)

-- Drop existing tables if they exist (for clean update)
DROP TABLE IF EXISTS business_verification_docs CASCADE;
DROP TABLE IF EXISTS business_locations CASCADE;
DROP TABLE IF EXISTS business_clients CASCADE;
DROP TABLE IF EXISTS industry_categories CASCADE;
DROP TABLE IF EXISTS business_claim_requests CASCADE;
DROP TABLE IF EXISTS ad_placements CASCADE;

-- Industry categories table
CREATE TABLE IF NOT EXISTS industry_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Business clients table (enhanced for self-registration)
CREATE TABLE IF NOT EXISTS business_clients (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) UNIQUE, -- Firebase user ID for business owner
    business_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    website VARCHAR(255),
    business_address TEXT,
    industry_category_id INTEGER REFERENCES industry_categories(id),
    number_of_locations INTEGER DEFAULT 1,
    
    -- Business claiming and verification
    claim_status VARCHAR(50) DEFAULT 'unclaimed', -- unclaimed, pending, claimed, rejected
    claim_method VARCHAR(50), -- email_verification, document_upload, phone_verification
    claim_token VARCHAR(255) UNIQUE, -- For email verification
    claim_submitted_at TIMESTAMP,
    claim_approved_at TIMESTAMP,
    claim_approved_by INTEGER REFERENCES employees(id),
    
    -- Security and verification
    security_level VARCHAR(50) DEFAULT 'pending', -- pending, verified, flagged, suspended
    verification_status VARCHAR(50) DEFAULT 'unverified', -- unverified, pending, verified, rejected
    verification_documents JSONB, -- Store document URLs/info
    
    -- Business metrics
    gcsg_score INTEGER DEFAULT 300,
    monthly_reviews INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    
    -- Subscription and services
    subscription_plan VARCHAR(50) DEFAULT 'free', -- free, basic, premium, enterprise
    subscription_status VARCHAR(50) DEFAULT 'active',
    ad_credits INTEGER DEFAULT 0, -- Credits for ad placements
    ad_spend_total DECIMAL(10,2) DEFAULT 0.00,
    
    -- Onboarding and compliance
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_step INTEGER DEFAULT 1, -- Current step in onboarding process
    terms_accepted BOOLEAN DEFAULT false,
    privacy_accepted BOOLEAN DEFAULT false,
    marketing_consent BOOLEAN DEFAULT false,
    
    -- Sales tracking
    sales_rep_id INTEGER REFERENCES employees(id), -- Assigned sales representative
    lead_source VARCHAR(100), -- organic, referral, marketing, sales_outreach
    lead_status VARCHAR(50) DEFAULT 'new', -- new, contacted, qualified, converted, lost
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Business locations table
CREATE TABLE IF NOT EXISTS business_locations (
    id SERIAL PRIMARY KEY,
    business_client_id INTEGER REFERENCES business_clients(id) ON DELETE CASCADE,
    location_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'USA',
    postal_code VARCHAR(20),
    phone VARCHAR(50),
    manager_name VARCHAR(255),
    manager_email VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    operating_hours JSONB, -- Store hours as JSON
    is_primary BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, closed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Business verification documents
CREATE TABLE IF NOT EXISTS business_verification_docs (
    id SERIAL PRIMARY KEY,
    business_client_id INTEGER REFERENCES business_clients(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL, -- business_license, tax_id, utility_bill, etc.
    document_url VARCHAR(500),
    document_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    verification_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    reviewed_by INTEGER REFERENCES employees(id),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Business claim requests (for self-registration)
CREATE TABLE IF NOT EXISTS business_claim_requests (
    id SERIAL PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    business_address TEXT,
    website VARCHAR(255),
    industry_category_id INTEGER REFERENCES industry_categories(id),
    
    -- Claim verification
    claim_method VARCHAR(50) NOT NULL, -- email_domain, document_upload, phone_verification
    verification_data JSONB, -- Store verification details
    claim_token VARCHAR(255) UNIQUE,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, expired
    reviewed_by INTEGER REFERENCES employees(id),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- Auto-approval logic
    auto_approved BOOLEAN DEFAULT false,
    approval_score INTEGER DEFAULT 0, -- Confidence score for auto-approval
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days')
);

-- Ad placements table (for client ad purchases)
CREATE TABLE IF NOT EXISTS ad_placements (
    id SERIAL PRIMARY KEY,
    business_client_id INTEGER REFERENCES business_clients(id) ON DELETE CASCADE,
    campaign_name VARCHAR(255) NOT NULL,
    ad_type VARCHAR(50) NOT NULL, -- banner, sponsored_listing, featured_review
    target_audience JSONB, -- Targeting criteria
    budget_total DECIMAL(10,2) NOT NULL,
    budget_spent DECIMAL(10,2) DEFAULT 0.00,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, paused, completed, cancelled
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES employees(id), -- Sales rep who created it
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default industry categories
INSERT INTO industry_categories (name, description, icon) VALUES
    ('Restaurant & Food', 'Restaurants, cafes, food trucks, catering services', '🍽️'),
    ('Retail', 'Stores, boutiques, shopping centers, e-commerce', '🛍️'),
    ('Healthcare', 'Hospitals, clinics, dental offices, medical services', '🏥'),
    ('Education', 'Schools, universities, training centers, tutoring', '🎓'),
    ('Entertainment', 'Theaters, cinemas, amusement parks, event venues', '🎭'),
    ('Professional Services', 'Law firms, accounting, consulting, real estate', '💼'),
    ('Beauty & Wellness', 'Salons, spas, gyms, fitness centers', '💅'),
    ('Automotive', 'Car dealerships, repair shops, gas stations', '🚗'),
    ('Hospitality', 'Hotels, motels, bed & breakfasts, vacation rentals', '🏨'),
    ('Technology', 'IT services, software companies, tech support', '💻'),
    ('Home Services', 'Plumbing, electrical, cleaning, landscaping', '🏠'),
    ('Financial Services', 'Banks, credit unions, insurance, investment', '💰')
ON CONFLICT (name) DO NOTHING;

-- Add new permissions for GladGrade-specific roles
INSERT INTO permissions (name, description) VALUES
    ('client_management', 'Manage business clients and accounts'),
    ('lead_management', 'Manage sales leads and prospects'),
    ('campaign_management', 'Create and manage marketing campaigns'),
    ('ad_management', 'Manage ad placements and budgets'),
    ('content_creation', 'Create marketing content and materials'),
    ('client_support', 'Provide support to business clients'),
    ('customer_relations', 'Manage customer relationships'),
    ('billing_management', 'Handle billing and financial operations'),
    ('claim_review', 'Review and approve business claims'),
    ('business_verification', 'Verify business authenticity')
ON CONFLICT (name) DO NOTHING;

-- Insert GladGrade-specific departments (FIXED - no permissions column)
INSERT INTO departments (name, employee_count) VALUES
    ('Sales', 0),
    ('Marketing', 0),
    ('Information Technology', 0),
    ('Customer Success', 0),
    ('Finance', 0)
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to departments using the junction table
WITH dept_perms AS (
    SELECT 
        d.id as dept_id,
        p.id as perm_id
    FROM departments d
    CROSS JOIN permissions p
    WHERE 
        -- Sales Department Permissions
        (d.name = 'Sales' AND p.name IN ('client_management', 'lead_management', 'partner_relations', 'basic_reports', 'claim_review', 'business_verification')) OR
        
        -- Marketing Department Permissions
        (d.name = 'Marketing' AND p.name IN ('campaign_management', 'ad_management', 'content_creation', 'analytics_dashboard', 'basic_reports')) OR
        
        -- Information Technology Department Permissions
        (d.name = 'Information Technology' AND p.name IN ('user_management', 'system_admin', 'content_moderation', 'full_access', 'image_approval')) OR
        
        -- Customer Success Department Permissions
        (d.name = 'Customer Success' AND p.name IN ('client_support', 'review_management', 'customer_relations', 'basic_reports', 'customer_support')) OR
        
        -- Finance Department Permissions
        (d.name = 'Finance' AND p.name IN ('billing_management', 'advanced_reports', 'client_management', 'analytics_dashboard', 'data_export'))
)
INSERT INTO department_permissions (department_id, permission_id)
SELECT dept_id, perm_id FROM dept_perms
ON CONFLICT (department_id, permission_id) DO NOTHING;

-- Insert sample business clients with different claim statuses
INSERT INTO business_clients (
    business_name, contact_name, contact_email, phone, 
    industry_category_id, number_of_locations, claim_status, security_level,
    gcsg_score, monthly_reviews, total_reviews, average_rating, lead_source
) VALUES
    ('Miami Beach Restaurant', 'Carlos Martinez', 'carlos@miamibeach.com', '+1-305-555-0123',
     (SELECT id FROM industry_categories WHERE name = 'Restaurant & Food'), 3, 'claimed', 'verified',
     785, 45, 234, 4.2, 'sales_outreach'),
    ('Downtown Coffee Shop', 'Emma Wilson', 'emma@downtowncoffee.com', '+1-305-555-0456',
     (SELECT id FROM industry_categories WHERE name = 'Restaurant & Food'), 1, 'pending', 'pending',
     692, 12, 67, 3.8, 'organic'),
    ('Sunset Spa & Wellness', 'Maria Rodriguez', 'maria@sunsetspa.com', '+1-305-555-0789',
     (SELECT id FROM industry_categories WHERE name = 'Beauty & Wellness'), 2, 'claimed', 'verified',
     823, 28, 156, 4.6, 'referral'),
    ('TechFix Solutions', 'David Kim', 'david@techfixsolutions.com', '+1-305-555-0321',
     (SELECT id FROM industry_categories WHERE name = 'Technology'), 1, 'claimed', 'flagged',
     634, 8, 34, 3.2, 'marketing')
ON CONFLICT (contact_email) DO NOTHING;

-- Insert sample claim requests (businesses trying to claim themselves)
INSERT INTO business_claim_requests (
    business_name, contact_name, contact_email, phone, business_address,
    industry_category_id, claim_method, status
) VALUES
    ('Coral Gables Bakery', 'Sofia Hernandez', 'sofia@coralgablesbakery.com', '+1-305-555-9876',
     '123 Miracle Mile, Coral Gables, FL 33134',
     (SELECT id FROM industry_categories WHERE name = 'Restaurant & Food'), 'email_domain', 'pending'),
    ('Miami Auto Repair', 'Roberto Silva', 'roberto@miamiautoshop.com', '+1-305-555-5432',
     '456 SW 8th Street, Miami, FL 33130',
     (SELECT id FROM industry_categories WHERE name = 'Automotive'), 'document_upload', 'pending')
ON CONFLICT DO NOTHING;

-- Show summary of what was created
DO $$
BEGIN
    RAISE NOTICE '✅ GladGrade Client Tables Created Successfully!';
    RAISE NOTICE '📊 Industry Categories: %', (SELECT COUNT(*) FROM industry_categories);
    RAISE NOTICE '🏢 Sample Business Clients: %', (SELECT COUNT(*) FROM business_clients);
    RAISE NOTICE '📝 Pending Claim Requests: %', (SELECT COUNT(*) FROM business_claim_requests WHERE status = 'pending');
    RAISE NOTICE '🏬 Departments Updated: %', (SELECT COUNT(*) FROM departments WHERE name IN ('Sales', 'Marketing', 'Information Technology', 'Customer Success', 'Finance'));
    RAISE NOTICE '🔐 New Permissions Added: %', (SELECT COUNT(*) FROM permissions WHERE name IN ('client_management', 'lead_management', 'campaign_management', 'ad_management'));
END $$;


-- corp.moderation_statuses
CREATE TABLE moderation_statuses (
    id SERIAL PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_visible_to_users BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default statuses
INSERT INTO moderation_statuses (id, status_name, description, is_visible_to_users) VALUES
(1, 'pending', 'Awaiting moderation review', TRUE),
(2, 'approved', 'Content approved and visible', TRUE),
(3, 'flagged', 'Content flagged for review', FALSE),
(4, 'deleted', 'Content marked for deletion', FALSE),
(5, 'rejected', 'Content rejected and hidden', FALSE);

-- Index
CREATE INDEX idx_moderation_statuses_visible ON moderation_statuses(is_visible_to_users);

-- Enhanced Sales Pipeline System for GladGrade Portal
-- This script creates all tables needed for the comprehensive sales system

-- 1. Enhanced Roles and Positions System
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions TEXT[], -- Array of permission strings
    is_sales_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE roles ADD CONSTRAINT unique_role_name UNIQUE (name);

CREATE TABLE IF NOT EXISTS company_positions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 1, -- 1=entry, 5=executive
    additional_permissions TEXT[], -- Extra permissions beyond role
    can_access_sales BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Services and Pricing
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- 'portal_access', 'qr_codes', 'analytics', 'marketing'
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- Percentage (e.g., 15.00 for 15%)
    is_active BOOLEAN DEFAULT TRUE,
    is_recurring BOOLEAN DEFAULT FALSE, -- Monthly/yearly subscription
    billing_cycle VARCHAR(20), -- 'monthly', 'yearly', 'one_time'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Prospects (Sales Pipeline)
CREATE TABLE IF NOT EXISTS prospects (
    id SERIAL PRIMARY KEY,
    
    -- Business Information (from Google Places API)
    business_name VARCHAR(300) NOT NULL,
    place_id VARCHAR(200), -- Google Places ID
    formatted_address TEXT,
    street_address VARCHAR(300),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'US',
    phone VARCHAR(50),
    website VARCHAR(500),
    business_type VARCHAR(100),
    
    -- Contact Information
    contact_name VARCHAR(200),
    contact_email VARCHAR(300),
    contact_phone VARCHAR(50),
    contact_title VARCHAR(100),
    
    -- Sales Information
    assigned_salesperson_id INTEGER REFERENCES employees(id),
    lead_source VARCHAR(100), -- 'cold_call', 'referral', 'website', 'trade_show'
    status VARCHAR(50) DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    estimated_value DECIMAL(10,2),
    probability INTEGER DEFAULT 50, -- 0-100%
    
    -- Pipeline Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    first_contact_at TIMESTAMP,
    qualified_at TIMESTAMP,
    proposal_sent_at TIMESTAMP,
    converted_at TIMESTAMP,
    sales_completed_at TIMESTAMP, -- Only Super Admin can edit
    lost_at TIMESTAMP,
    
    -- Notes and Follow-up
    notes TEXT,
    next_follow_up TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Conversion Data
    converted_to_client_id INTEGER, -- References business_clients.id when converted
    conversion_value DECIMAL(10,2),
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Prospect Services (Many-to-Many)
CREATE TABLE IF NOT EXISTS prospect_services (
    id SERIAL PRIMARY KEY,
    prospect_id INTEGER REFERENCES prospects(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id),
    quantity INTEGER DEFAULT 1,
    custom_price DECIMAL(10,2), -- Override service price if needed
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(prospect_id, service_id)
);

-- 5. Sales Activities Log
CREATE TABLE IF NOT EXISTS sales_activities (
    id SERIAL PRIMARY KEY,
    prospect_id INTEGER REFERENCES prospects(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(id),
    activity_type VARCHAR(50) NOT NULL, -- 'call', 'email', 'meeting', 'proposal', 'follow_up'
    subject VARCHAR(300),
    description TEXT,
    outcome VARCHAR(100), -- 'positive', 'neutral', 'negative', 'no_response'
    next_action VARCHAR(300),
    scheduled_for TIMESTAMP,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Commissions System
CREATE TABLE IF NOT EXISTS commissions (
    id SERIAL PRIMARY KEY,
    salesperson_id INTEGER REFERENCES employees(id),
    client_id INTEGER, -- References business_clients.id
    prospect_id INTEGER REFERENCES prospects(id),
    service_id INTEGER REFERENCES services(id),
    
    -- Commission Details
    sale_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    
    -- Status and Payments
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'disputed'
    approved_by INTEGER REFERENCES employees(id),
    approved_at TIMESTAMP,
    paid_at TIMESTAMP,
    payment_reference VARCHAR(200),
    
    -- Timestamps
    earned_date DATE NOT NULL, -- When the sale was completed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Client QR Codes
CREATE TABLE IF NOT EXISTS client_qr_codes (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL, -- References business_clients.id
    qr_type VARCHAR(50) NOT NULL, -- 'business_profile', 'menu', 'review_request'
    qr_code_url VARCHAR(500), -- URL the QR code points to
    qr_image_path VARCHAR(500), -- Path to generated QR code image
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Email Automation Log
CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    recipient_email VARCHAR(300) NOT NULL,
    recipient_name VARCHAR(200),
    email_type VARCHAR(100) NOT NULL, -- 'welcome', 'follow_up', 'commission_report'
    subject VARCHAR(500),
    template_used VARCHAR(100),
    
    -- Related Records
    client_id INTEGER,
    prospect_id INTEGER REFERENCES prospects(id),
    employee_id INTEGER REFERENCES employees(id),
    
    -- Email Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'bounced'
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Update employees table with enhanced roles
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS primary_role_id INTEGER REFERENCES roles(id),
ADD COLUMN IF NOT EXISTS secondary_role_ids INTEGER[], -- Array of role IDs
ADD COLUMN IF NOT EXISTS company_position_id INTEGER REFERENCES company_positions(id),
ADD COLUMN IF NOT EXISTS sales_quota DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 0.00;

-- Insert default roles
INSERT INTO roles (name, description, permissions, is_sales_role) VALUES
('Super Admin', 'Full system access', ARRAY['*'], FALSE),
('Admin', 'Administrative access', ARRAY['user_management', 'reports', 'settings'], FALSE),
('Sales', 'Sales pipeline and client management', ARRAY['sales_pipeline', 'prospect_management', 'commission_view'], TRUE),
('Sales Manager', 'Sales team management', ARRAY['sales_pipeline', 'prospect_management', 'commission_management', 'team_reports'], TRUE),
('Finance', 'Financial reporting and commission management', ARRAY['commission_management', 'financial_reports'], FALSE),
('Moderator', 'Content moderation', ARRAY['content_moderation', 'review_management'], FALSE),
('Employee', 'Basic employee access', ARRAY['basic_access'], FALSE)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE company_positions ADD CONSTRAINT unique_title_name UNIQUE (title);

-- Insert company positions
INSERT INTO company_positions (title, description, level, additional_permissions, can_access_sales) VALUES
('CEO', 'Chief Executive Officer', 5, ARRAY['*'], TRUE),
('CCO', 'Chief Commercial Officer', 5, ARRAY['sales_pipeline', 'commission_management', 'financial_reports'], TRUE),
('CTO', 'Chief Technology Officer', 5, ARRAY['system_admin', 'technical_reports'], FALSE),
('COO', 'Chief Operations Officer', 5, ARRAY['system_admin', 'technical_reports'], FALSE),
('HR Director', 'Director of Human Resources', 4, ARRAY['system_admin', 'technical_reports'], FALSE),
('Sales Director', 'Director of Sales', 4, ARRAY['sales_pipeline', 'team_management'], TRUE),
('Sales Manager', 'Sales Team Manager', 3, ARRAY['sales_pipeline', 'team_reports'], TRUE),
('Account Manager', 'Client Account Management', 3, ARRAY['client_management'], TRUE),
('Sales Representative', 'Individual Sales Rep', 2, ARRAY['sales_pipeline'], TRUE),
('Marketing Manager', 'Marketing and Lead Generation', 3, ARRAY['marketing_tools', 'lead_management'], TRUE)
ON CONFLICT (title) DO NOTHING;


ALTER TABLE services ADD CONSTRAINT unique_service_name UNIQUE (name);

-- Insert default services
INSERT INTO services (name, description, category, price, commission_rate, billing_cycle) VALUES
('GladGrade Portal Access', 'Basic portal access for business management', 'portal_access', 29.99, 15.00, 'monthly'),
('Premium Analytics Dashboard', 'Advanced analytics and reporting', 'analytics', 99.99, 20.00, 'monthly'),
('QR Code Package', 'Business and menu QR codes with customization', 'qr_codes', 49.99, 25.00, 'one_time'),
('Review Management Pro', 'Advanced review response and management tools', 'portal_access', 79.99, 18.00, 'monthly'),
('Marketing Boost Package', 'Promotional tools and advertising features', 'marketing', 149.99, 22.00, 'monthly'),
('Custom Integration', 'Custom API integration and setup', 'technical', 299.99, 30.00, 'one_time'),
('Training and Onboarding', 'Comprehensive staff training program', 'training', 199.99, 20.00, 'one_time')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prospects_salesperson ON prospects(assigned_salesperson_id);
CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_created_at ON prospects(created_at);
CREATE INDEX IF NOT EXISTS idx_commissions_salesperson ON commissions(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_sales_activities_prospect ON sales_activities(prospect_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_prospects_updated_at BEFORE UPDATE ON prospects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON commissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Add missing columns to business_clients table for conversion tracking
-- This script adds columns that are referenced in the conversion API but don't exist

-- Add conversion tracking columns
ALTER TABLE business_clients 
ADD COLUMN IF NOT EXISTS conversion_value DECIMAL(10,2) DEFAULT 0.00;

ALTER TABLE business_clients 
ADD COLUMN IF NOT EXISTS original_prospect_id INTEGER REFERENCES prospects(id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_clients_conversion_value ON business_clients(conversion_value);
CREATE INDEX IF NOT EXISTS idx_business_clients_original_prospect_id ON business_clients(original_prospect_id);
CREATE INDEX IF NOT EXISTS idx_business_clients_sales_rep_id ON business_clients(sales_rep_id);

-- Verify the columns were added by selecting from the table
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'business_clients' 
    AND column_name IN ('conversion_value', 'original_prospect_id')
ORDER BY column_name;

-- Show a success message
SELECT 'Missing columns added to business_clients table successfully!' as status;


ALTER TABLE business_clients 
ADD COLUMN IF NOT EXISTS conversion_value DECIMAL(10,2) DEFAULT 0.00;

ALTER TABLE business_clients 
ADD COLUMN IF NOT EXISTS original_prospect_id INTEGER REFERENCES prospects(id);

CREATE INDEX IF NOT EXISTS idx_business_clients_conversion_value ON business_clients(conversion_value);
CREATE INDEX IF NOT EXISTS idx_business_clients_original_prospect_id ON business_clients(original_prospect_id);



-- Fix commissions table to allow null service_id for default commissions
-- and ensure sale_amount has proper constraints

-- Make service_id nullable for default commissions
ALTER TABLE commissions 
ALTER COLUMN service_id DROP NOT NULL;

-- Add a check constraint to ensure sale_amount is positive
ALTER TABLE commissions 
ADD CONSTRAINT check_sale_amount_positive 
CHECK (sale_amount > 0);

-- Add a check constraint to ensure commission_rate is between 0 and 100
ALTER TABLE commissions 
ADD CONSTRAINT check_commission_rate_valid 
CHECK (commission_rate >= 0 AND commission_rate <= 100);

-- Add a check constraint to ensure commission_amount is not negative
ALTER TABLE commissions 
ADD CONSTRAINT check_commission_amount_valid 
CHECK (commission_amount >= 0);

-- Add an index for better performance on queries
CREATE INDEX IF NOT EXISTS idx_commissions_salesperson_status 
ON commissions(salesperson_id, status);

-- Add an index for client commissions
CREATE INDEX IF NOT EXISTS idx_commissions_client_id 
ON commissions(client_id);

COMMIT;






-- Comprehensive Audit Log System for GladGrade Portal
-- This creates tables and triggers to log all changes with detailed information

-- 1. Main audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    
    -- User Information
    user_id INTEGER REFERENCES employees(id),
    user_email VARCHAR(300),
    user_name VARCHAR(300),
    user_role VARCHAR(100),
    
    -- Action Details
    action_type VARCHAR(100) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ASSIGN', 'CONVERT'
    table_name VARCHAR(100), -- Table that was affected
    record_id INTEGER, -- ID of the affected record
    action_description TEXT NOT NULL,
    
    -- Change Details (for UPDATE actions)
    old_values JSONB, -- Previous values
    new_values JSONB, -- New values
    changed_fields TEXT[], -- Array of field names that changed
    
    -- System Information
    ip_address INET,
    user_agent TEXT,
    browser_info JSONB, -- Parsed browser/device info
    location_info JSONB, -- IP geolocation data
    session_id VARCHAR(255),
    
    -- Request Information
    request_method VARCHAR(10), -- GET, POST, PUT, DELETE
    request_url TEXT,
    request_headers JSONB,
    response_status INTEGER,
    
    -- Business Context
    business_context VARCHAR(100), -- 'sales_pipeline', 'employee_management', 'client_management'
    severity_level VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT audit_logs_action_type_check CHECK (action_type IN (
        'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ASSIGN', 'CONVERT', 
        'PERMISSION_CHANGE', 'STATUS_CHANGE', 'BULK_UPDATE', 'EXPORT', 'IMPORT'
    ))
);

-- 2. Prospect ownership changes log (specific for sales)
CREATE TABLE IF NOT EXISTS prospect_ownership_logs (
    id SERIAL PRIMARY KEY,
    prospect_id INTEGER REFERENCES prospects(id) ON DELETE CASCADE,
    
    -- Ownership Change
    previous_owner_id INTEGER REFERENCES employees(id),
    new_owner_id INTEGER REFERENCES employees(id),
    previous_owner_name VARCHAR(300),
    new_owner_name VARCHAR(300),
    
    -- Change Authorization
    changed_by_id INTEGER REFERENCES employees(id) NOT NULL,
    changed_by_name VARCHAR(300),
    changed_by_role VARCHAR(100),
    change_reason VARCHAR(500),
    
    -- System Info
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Employee activity sessions
CREATE TABLE IF NOT EXISTS employee_activity_sessions (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    session_token VARCHAR(500),
    
    -- Session Details
    login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    logout_time TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- System Information
    ip_address INET,
    user_agent TEXT,
    browser_name VARCHAR(100),
    browser_version VARCHAR(50),
    os_name VARCHAR(100),
    os_version VARCHAR(50),
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
    
    -- Location (from IP)
    country VARCHAR(100),
    region VARCHAR(100),
    city VARCHAR(100),
    timezone VARCHAR(100),
    
    -- Security
    login_method VARCHAR(50), -- 'password', 'oauth', 'sso'
    two_factor_used BOOLEAN DEFAULT FALSE,
    
    UNIQUE(session_token)
);

-- 4. System configuration changes log
CREATE TABLE IF NOT EXISTS system_config_logs (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(200) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by_id INTEGER REFERENCES employees(id),
    changed_by_name VARCHAR(300),
    change_reason TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_business_context ON audit_logs(business_context);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity_level);

CREATE INDEX IF NOT EXISTS idx_prospect_ownership_prospect_id ON prospect_ownership_logs(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_ownership_changed_by ON prospect_ownership_logs(changed_by_id);
CREATE INDEX IF NOT EXISTS idx_prospect_ownership_changed_at ON prospect_ownership_logs(changed_at);

CREATE INDEX IF NOT EXISTS idx_employee_sessions_employee_id ON employee_activity_sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_sessions_active ON employee_activity_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_employee_sessions_login_time ON employee_activity_sessions(login_time);

-- 6. Create audit trigger function for automatic logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    changed_fields TEXT[];
    field_name TEXT;
BEGIN
    -- Determine what changed
    IF TG_OP = 'DELETE' THEN
        old_data = to_jsonb(OLD);
        new_data = NULL;
    ELSIF TG_OP = 'INSERT' THEN
        old_data = NULL;
        new_data = to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        old_data = to_jsonb(OLD);
        new_data = to_jsonb(NEW);
        
        -- Find changed fields
        changed_fields = ARRAY[]::TEXT[];
        FOR field_name IN SELECT jsonb_object_keys(new_data) LOOP
            IF old_data->>field_name IS DISTINCT FROM new_data->>field_name THEN
                changed_fields = array_append(changed_fields, field_name);
            END IF;
        END LOOP;
    END IF;

    -- Insert audit log (basic version - will be enhanced by application)
    INSERT INTO audit_logs (
        action_type,
        table_name,
        record_id,
        action_description,
        old_values,
        new_values,
        changed_fields,
        business_context,
        created_at
    ) VALUES (
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP || ' operation on ' || TG_TABLE_NAME,
        old_data,
        new_data,
        changed_fields,
        CASE 
            WHEN TG_TABLE_NAME IN ('prospects', 'prospect_services', 'sales_activities') THEN 'sales_pipeline'
            WHEN TG_TABLE_NAME IN ('employees', 'employee_permissions') THEN 'employee_management'
            WHEN TG_TABLE_NAME IN ('business_clients', 'client_qr_codes') THEN 'client_management'
            ELSE 'system'
        END,
        NOW()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 7. Apply audit triggers to important tables
CREATE TRIGGER audit_prospects_trigger
    AFTER INSERT OR UPDATE OR DELETE ON prospects
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_employees_trigger
    AFTER INSERT OR UPDATE OR DELETE ON employees
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_business_clients_trigger
    AFTER INSERT OR UPDATE OR DELETE ON business_clients
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_commissions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON commissions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_employee_permissions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON employee_permissions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- 8. Function to log prospect ownership changes
CREATE OR REPLACE FUNCTION log_prospect_ownership_change(
    p_prospect_id INTEGER,
    p_previous_owner_id INTEGER,
    p_new_owner_id INTEGER,
    p_changed_by_id INTEGER,
    p_change_reason VARCHAR(500),
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    prev_owner_name VARCHAR(300);
    new_owner_name VARCHAR(300);
    changed_by_name VARCHAR(300);
    changed_by_role VARCHAR(100);
    log_id INTEGER;
BEGIN
    -- Get owner names
    SELECT full_name INTO prev_owner_name FROM employees WHERE id = p_previous_owner_id;
    SELECT full_name INTO new_owner_name FROM employees WHERE id = p_new_owner_id;
    SELECT full_name, role INTO changed_by_name, changed_by_role FROM employees WHERE id = p_changed_by_id;
    
    -- Insert ownership change log
    INSERT INTO prospect_ownership_logs (
        prospect_id, previous_owner_id, new_owner_id,
        previous_owner_name, new_owner_name,
        changed_by_id, changed_by_name, changed_by_role,
        change_reason, ip_address, user_agent
    ) VALUES (
        p_prospect_id, p_previous_owner_id, p_new_owner_id,
        prev_owner_name, new_owner_name,
        p_changed_by_id, changed_by_name, changed_by_role,
        p_change_reason, p_ip_address, p_user_agent
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- 9. Create views for common audit queries
CREATE OR REPLACE VIEW recent_audit_activity AS
SELECT 
    al.id,
    al.action_type,
    al.table_name,
    al.action_description,
    al.user_name,
    al.user_role,
    al.ip_address,
    al.created_at,
    al.business_context,
    al.severity_level
FROM audit_logs al
ORDER BY al.created_at DESC
LIMIT 100;

CREATE OR REPLACE VIEW prospect_ownership_history AS
SELECT 
    pol.id,
    pol.prospect_id,
    p.business_name,
    pol.previous_owner_name,
    pol.new_owner_name,
    pol.changed_by_name,
    pol.changed_by_role,
    pol.change_reason,
    pol.changed_at
FROM prospect_ownership_logs pol
LEFT JOIN prospects p ON pol.prospect_id = p.id
ORDER BY pol.changed_at DESC;

-- 10. Insert initial audit log for system setup
INSERT INTO audit_logs (
    action_type,
    action_description,
    user_email,
    user_name,
    user_role,
    business_context,
    severity_level
) VALUES (
    'CREATE',
    'Audit logging system initialized',
    'system@gladgrade.com',
    'System',
    'system',
    'system',
    'info'
);

-- Show summary
DO $$
BEGIN
    RAISE NOTICE '✅ Audit Logging System Created Successfully!';
    RAISE NOTICE '📊 Tables Created: audit_logs, prospect_ownership_logs, employee_activity_sessions, system_config_logs';
    RAISE NOTICE '🔍 Triggers Applied: prospects, employees, business_clients, commissions, employee_permissions';
    RAISE NOTICE '📈 Views Created: recent_audit_activity, prospect_ownership_history';
    RAISE NOTICE '🔧 Functions Created: audit_trigger_function(), log_prospect_ownership_change()';
END $$;






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










-- Fix the audit trigger to map PostgreSQL operations to our constraint values
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    changed_fields TEXT[];
    field_name TEXT;
    mapped_action_type VARCHAR(100);
BEGIN
    -- Map PostgreSQL trigger operations to our constraint values
    CASE TG_OP
        WHEN 'INSERT' THEN mapped_action_type = 'CREATE';
        WHEN 'UPDATE' THEN mapped_action_type = 'UPDATE';
        WHEN 'DELETE' THEN mapped_action_type = 'DELETE';
        ELSE mapped_action_type = TG_OP;
    END CASE;

    -- Determine what changed
    IF TG_OP = 'DELETE' THEN
        old_data = to_jsonb(OLD);
        new_data = NULL;
    ELSIF TG_OP = 'INSERT' THEN
        old_data = NULL;
        new_data = to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        old_data = to_jsonb(OLD);
        new_data = to_jsonb(NEW);
        
        -- Find changed fields
        changed_fields = ARRAY[]::TEXT[];
        FOR field_name IN SELECT jsonb_object_keys(new_data) LOOP
            IF old_data->>field_name IS DISTINCT FROM new_data->>field_name THEN
                changed_fields = array_append(changed_fields, field_name);
            END IF;
        END LOOP;
    END IF;

    -- Insert audit log with mapped action type
    INSERT INTO audit_logs (
        action_type,
        table_name,
        record_id,
        action_description,
        old_values,
        new_values,
        changed_fields,
        business_context,
        created_at
    ) VALUES (
        mapped_action_type,  -- Use mapped value instead of TG_OP
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        mapped_action_type || ' operation on ' || TG_TABLE_NAME,
        old_data,
        new_data,
        changed_fields,
        CASE 
            WHEN TG_TABLE_NAME IN ('prospects', 'prospect_services', 'sales_activities') THEN 'sales_pipeline'
            WHEN TG_TABLE_NAME IN ('employees', 'employee_permissions') THEN 'employee_management'
            WHEN TG_TABLE_NAME IN ('business_clients', 'client_qr_codes') THEN 'client_management'
            ELSE 'system'
        END,
        NOW()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Test the fix
SELECT '✅ Audit trigger function updated to map INSERT -> CREATE' as status;









-- Remove the UNIQUE constraint on contact_email from business_clients table
-- This allows multiple clients to share the same contact email address

-- Check current constraints
SELECT 
    constraint_name, 
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'business_clients' 
  AND constraint_type = 'UNIQUE'
ORDER BY constraint_name;

-- Drop the unique constraint on contact_email
ALTER TABLE business_clients 
DROP CONSTRAINT IF EXISTS business_clients_contact_email_key;

-- Also drop any other email-related unique constraints that might exist
ALTER TABLE business_clients 
DROP CONSTRAINT IF EXISTS business_clients_email_key;

-- Verify constraints are removed
SELECT 'AFTER REMOVAL - Remaining constraints:' as info;
SELECT 
    constraint_name, 
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'business_clients' 
  AND constraint_type = 'UNIQUE'
ORDER BY constraint_name;

-- Success message
SELECT '✅ Email uniqueness constraint removed successfully!' as status;
SELECT 'Multiple clients can now share the same contact email address.' as note;








-- Create services management tables for GladGrade Portal
-- This will store all services offered by GladGrade with pricing, commissions, and availability

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS service_categories CASCADE;
DROP TABLE IF EXISTS services CASCADE;

-- Create service categories table
CREATE TABLE service_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create services table
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES service_categories(id),
    
    -- Pricing information
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    setup_fee DECIMAL(10,2) DEFAULT 0.00,
    monthly_fee DECIMAL(10,2) DEFAULT 0.00,
    
    -- Commission structure
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- Percentage (e.g., 15.00 for 15%)
    commission_type VARCHAR(20) DEFAULT 'percentage', -- 'percentage' or 'fixed'
    commission_amount DECIMAL(10,2) DEFAULT 0.00, -- For fixed commissions
    
    -- Billing and availability
    is_recurring BOOLEAN DEFAULT FALSE,
    billing_cycle VARCHAR(20) DEFAULT 'one_time', -- 'monthly', 'quarterly', 'yearly', 'one_time'
    
    -- Availability channels
    available_portal BOOLEAN DEFAULT TRUE,
    available_mobile BOOLEAN DEFAULT TRUE,
    available_gladgrade_only BOOLEAN DEFAULT FALSE, -- Internal GladGrade services only
    
    -- Service details
    service_type VARCHAR(50) DEFAULT 'standard', -- 'standard', 'premium', 'enterprise', 'addon'
    requires_approval BOOLEAN DEFAULT FALSE,
    max_quantity INTEGER DEFAULT 1, -- Maximum quantity per client
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES employees(id),
    updated_by INTEGER REFERENCES employees(id)
);

-- Insert default service categories
INSERT INTO service_categories (name, description, display_order) VALUES
('Dashboard & Analytics', 'Business intelligence and reporting services', 1),
('Marketing & Advertising', 'Promotional and marketing services', 2),
('QR Code Services', 'QR code generation and management', 3),
('Premium Features', 'Advanced platform features and tools', 4),
('Consulting Services', 'Professional consulting and support', 5),
('Integration Services', 'Third-party integrations and APIs', 6);

-- Insert default services
INSERT INTO services (
    name, description, category_id, base_price, setup_fee, monthly_fee,
    commission_rate, commission_type, is_recurring, billing_cycle,
    available_portal, available_mobile, service_type, display_order
) VALUES
-- Dashboard & Analytics Services
('Basic Dashboard', 'Essential business metrics and customer feedback overview', 1, 29.99, 0.00, 29.99, 15.00, 'percentage', TRUE, 'monthly', TRUE, FALSE, 'standard', 1),
('Premium Dashboard', 'Advanced analytics with custom reports and insights', 1, 79.99, 25.00, 79.99, 20.00, 'percentage', TRUE, 'monthly', TRUE, FALSE, 'premium', 2),
('Enterprise Dashboard', 'Full business intelligence suite with API access', 1, 199.99, 100.00, 199.99, 25.00, 'percentage', TRUE, 'monthly', TRUE, FALSE, 'enterprise', 3),

-- Marketing & Advertising Services
('Sponsored Listing', 'Boost your business visibility in search results', 2, 49.99, 0.00, 0.00, 30.00, 'percentage', FALSE, 'one_time', TRUE, TRUE, 'standard', 4),
('Featured Business Badge', 'Premium badge highlighting your business quality', 2, 19.99, 0.00, 19.99, 25.00, 'percentage', TRUE, 'monthly', TRUE, TRUE, 'standard', 5),
('Social Media Integration', 'Connect and sync with your social media accounts', 2, 39.99, 15.00, 39.99, 20.00, 'percentage', TRUE, 'monthly', TRUE, FALSE, 'standard', 6),

-- QR Code Services
('Basic QR Codes', 'Generate QR codes for customer feedback collection', 3, 9.99, 0.00, 0.00, 40.00, 'percentage', FALSE, 'one_time', TRUE, TRUE, 'standard', 7),
('Premium QR Package', 'Custom branded QR codes with analytics', 3, 24.99, 5.00, 0.00, 35.00, 'percentage', FALSE, 'one_time', TRUE, TRUE, 'premium', 8),
('QR Code Management Suite', 'Advanced QR code management with tracking', 3, 15.99, 0.00, 15.99, 30.00, 'percentage', TRUE, 'monthly', TRUE, FALSE, 'premium', 9),

-- Premium Features
('Review Response Tools', 'Automated and manual review response management', 4, 34.99, 10.00, 34.99, 18.00, 'percentage', TRUE, 'monthly', TRUE, FALSE, 'premium', 10),
('Competitor Analysis', 'Monitor and compare with competitor performance', 4, 59.99, 20.00, 59.99, 22.00, 'percentage', TRUE, 'monthly', TRUE, FALSE, 'premium', 11),
('White Label Solution', 'Custom branded portal for enterprise clients', 4, 299.99, 500.00, 299.99, 15.00, 'percentage', TRUE, 'monthly', TRUE, FALSE, 'enterprise', 12),

-- Consulting Services
('Business Consultation', 'One-on-one consultation with GladGrade experts', 5, 150.00, 0.00, 0.00, 50.00, 'percentage', FALSE, 'one_time', TRUE, FALSE, 'standard', 13),
('GCSG Improvement Plan', 'Customized plan to improve your GCSG score', 5, 199.99, 0.00, 0.00, 45.00, 'percentage', FALSE, 'one_time', TRUE, FALSE, 'premium', 14),
('Training & Onboarding', 'Comprehensive staff training on customer service', 5, 99.99, 0.00, 0.00, 40.00, 'percentage', FALSE, 'one_time', TRUE, FALSE, 'standard', 15),

-- Integration Services
('POS System Integration', 'Connect your point-of-sale system with GladGrade', 6, 89.99, 50.00, 19.99, 25.00, 'percentage', TRUE, 'monthly', TRUE, FALSE, 'premium', 16),
('CRM Integration', 'Sync customer data with your existing CRM', 6, 69.99, 75.00, 29.99, 20.00, 'percentage', TRUE, 'monthly', TRUE, FALSE, 'premium', 17),
('API Access', 'Full API access for custom integrations', 6, 0.00, 200.00, 99.99, 15.00, 'percentage', TRUE, 'monthly', TRUE, FALSE, 'enterprise', 18);

-- Create indexes for better performance
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_services_featured ON services(is_featured);
CREATE INDEX idx_services_type ON services(service_type);
CREATE INDEX idx_services_portal_available ON services(available_portal);
CREATE INDEX idx_services_mobile_available ON services(available_mobile);

-- Create updated_at trigger for services table
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_services_updated_at();

-- Create updated_at trigger for service_categories table
CREATE TRIGGER trigger_service_categories_updated_at
    BEFORE UPDATE ON service_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_services_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON services TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON service_categories TO postgres;
GRANT USAGE, SELECT ON SEQUENCE services_id_seq TO postgres;
GRANT USAGE, SELECT ON SEQUENCE service_categories_id_seq TO postgres;

-- Display summary
SELECT 'Services tables created successfully!' as status;
SELECT 'Service Categories: ' || COUNT(*) as categories_count FROM service_categories;
SELECT 'Services: ' || COUNT(*) as services_count FROM services;

-- Show sample data
SELECT 
    sc.name as category,
    COUNT(s.id) as service_count,
    AVG(s.base_price) as avg_price,
    AVG(s.commission_rate) as avg_commission
FROM service_categories sc
LEFT JOIN services s ON sc.id = s.category_id
GROUP BY sc.id, sc.name
ORDER BY sc.display_order;






-- Add the place_id column
ALTER TABLE business_clients 
ADD COLUMN IF NOT EXISTS place_id VARCHAR(200);

-- Add index for better performance on place_id lookups
CREATE INDEX IF NOT EXISTS idx_business_clients_place_id ON business_clients(place_id);

-- Add comment to document the column purpose
COMMENT ON COLUMN business_clients.place_id IS 'Google Places ID for GCSG score lookups and business verification';

-- Verify the column was added successfully
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'business_clients' 
    AND column_name = 'place_id';

-- Show success message
SELECT 'place_id column added to business_clients table successfully!' as status;









-- Update business_clients with original_prospect_id using priority matching
-- Priority: 1) business_name + email, 2) business_name only, 3) business_name + time proximity

-- First, let's see what we're working with
SELECT 
    'Business clients without prospect ID' as category,
    COUNT(*) as count
FROM business_clients 
WHERE original_prospect_id IS NULL;

SELECT 
    'Total prospects available for matching' as category,
    COUNT(*) as count
FROM prospects;

-- Create a temporary table to track our updates
CREATE TEMP TABLE prospect_matches AS
SELECT 
    bc.id as client_id,
    bc.business_name as client_name,
    bc.contact_email as client_email,
    bc.created_at as client_created,
    NULL::INTEGER as matched_prospect_id,
    NULL::TEXT as match_method,
    NULL::TEXT as prospect_name,
    NULL::TEXT as prospect_email,
    NULL::TIMESTAMP as prospect_created
FROM business_clients bc
WHERE bc.original_prospect_id IS NULL;

-- PRIORITY 1: Match by business_name + contact_email (exact matches)
UPDATE prospect_matches pm
SET 
    matched_prospect_id = p.id,
    match_method = 'business_name + email',
    prospect_name = p.business_name,
    prospect_email = p.contact_email,
    prospect_created = p.created_at
FROM prospects p
WHERE pm.matched_prospect_id IS NULL
    AND LOWER(TRIM(pm.client_name)) = LOWER(TRIM(p.business_name))
    AND LOWER(TRIM(pm.client_email)) = LOWER(TRIM(p.contact_email))
    AND pm.client_email IS NOT NULL 
    AND p.contact_email IS NOT NULL;

-- PRIORITY 2: Match by business_name only (for remaining unmatched)
-- We'll pick the most recent prospect if multiple matches exist
UPDATE prospect_matches pm
SET 
    matched_prospect_id = p.id,
    match_method = 'business_name only',
    prospect_name = p.business_name,
    prospect_email = p.contact_email,
    prospect_created = p.created_at
FROM prospects p
WHERE pm.matched_prospect_id IS NULL
    AND LOWER(TRIM(pm.client_name)) = LOWER(TRIM(p.business_name))
    AND p.id = (
        -- Get the most recent prospect with this business name
        SELECT p2.id 
        FROM prospects p2 
        WHERE LOWER(TRIM(p2.business_name)) = LOWER(TRIM(p.business_name))
        ORDER BY p2.created_at DESC 
        LIMIT 1
    );

-- PRIORITY 3: Match by business_name + time proximity (within 30 days)
-- For remaining unmatched, find prospects created within 30 days before the client
UPDATE prospect_matches pm
SET 
    matched_prospect_id = p.id,
    match_method = 'business_name + time proximity',
    prospect_name = p.business_name,
    prospect_email = p.contact_email,
    prospect_created = p.created_at
FROM prospects p
WHERE pm.matched_prospect_id IS NULL
    AND LOWER(TRIM(pm.client_name)) = LOWER(TRIM(p.business_name))
    AND p.created_at <= pm.client_created
    AND p.created_at >= (pm.client_created - INTERVAL '30 days')
    AND p.id = (
        -- Get the prospect closest in time to the client creation
        SELECT p2.id 
        FROM prospects p2 
        WHERE LOWER(TRIM(p2.business_name)) = LOWER(TRIM(p.business_name))
            AND p2.created_at <= pm.client_created
            AND p2.created_at >= (pm.client_created - INTERVAL '30 days')
        ORDER BY ABS(EXTRACT(EPOCH FROM (pm.client_created - p2.created_at)))
        LIMIT 1
    );

-- Show matching results before applying
SELECT 
    match_method,
    COUNT(*) as matches_found
FROM prospect_matches 
WHERE matched_prospect_id IS NOT NULL
GROUP BY match_method
ORDER BY 
    CASE match_method
        WHEN 'business_name + email' THEN 1
        WHEN 'business_name only' THEN 2
        WHEN 'business_name + time proximity' THEN 3
    END;

-- Show detailed matches for review
SELECT 
    pm.client_id,
    pm.client_name,
    pm.client_email,
    pm.client_created,
    pm.matched_prospect_id,
    pm.match_method,
    pm.prospect_name,
    pm.prospect_email,
    pm.prospect_created,
    CASE 
        WHEN pm.client_created > pm.prospect_created 
        THEN EXTRACT(EPOCH FROM (pm.client_created - pm.prospect_created))/86400 
        ELSE 0 
    END as days_between
FROM prospect_matches pm
WHERE pm.matched_prospect_id IS NOT NULL
ORDER BY pm.match_method, pm.client_name;

-- Show unmatched clients
SELECT 
    'Unmatched clients' as status,
    client_name,
    client_email,
    client_created
FROM prospect_matches 
WHERE matched_prospect_id IS NULL
ORDER BY client_name;

-- APPLY THE UPDATES (uncomment the next section to execute)

-- Update business_clients with the matched prospect IDs
UPDATE business_clients bc
SET 
    original_prospect_id = pm.matched_prospect_id,
    updated_at = CURRENT_TIMESTAMP
FROM prospect_matches pm
WHERE bc.id = pm.client_id 
    AND pm.matched_prospect_id IS NOT NULL;

-- Report final results
SELECT 
    'Clients updated with prospect IDs' as result,
    COUNT(*) as count
FROM business_clients 
WHERE original_prospect_id IS NOT NULL;

SELECT 'Prospect ID matching completed successfully!' as status;


-- Instructions for execution:
SELECT '
REVIEW THE MATCHES ABOVE FIRST!
If the matches look correct, uncomment the final UPDATE section and run again.
The matches are currently in the temporary table but not yet applied to business_clients.
' as instructions;



UPDATE business_clients bc
SET 
   place_id = p.place_id,
   updated_at = CURRENT_TIMESTAMP
FROM prospects p
WHERE bc.original_prospect_id = p.id 
   AND p.place_id IS NOT NULL 
   AND bc.place_id IS NULL;







   -- migration-business-locations.sql
-- Migration script to populate business_locations from existing business_clients addresses

-- First, add place_id column to business_locations if it doesn't exist
ALTER TABLE business_locations 
ADD COLUMN IF NOT EXISTS place_id VARCHAR(200);

-- Add index for better performance on place_id lookups
CREATE INDEX IF NOT EXISTS idx_business_locations_place_id ON business_locations(place_id);

-- Add comment to document the column purpose
COMMENT ON COLUMN business_locations.place_id IS 'Google Places ID for location verification and data enrichment';

-- Step 1: Show what we're working with before migration
SELECT 
    'Business clients without primary locations' as category,
    COUNT(*) as count
FROM business_clients bc
WHERE NOT EXISTS (
    SELECT 1 FROM business_locations bl 
    WHERE bl.business_client_id = bc.id AND bl.is_primary = true
);

SELECT 
    'Total business clients' as category,
    COUNT(*) as count
FROM business_clients;

-- Step 2: Create business_locations records for clients that don't have primary locations
-- Only migrate clients that have address information
INSERT INTO business_locations (
    business_client_id,
    location_name,
    address,
    city,
    state,
    country,
    postal_code,
    phone,
    is_primary,
    status,
    place_id,
    created_at,
    updated_at
)
SELECT 
    bc.id as business_client_id,
    bc.business_name || ' - Main Location' as location_name,
    -- Extract address components from business_address
    CASE 
        WHEN bc.business_address IS NOT NULL AND LENGTH(TRIM(bc.business_address)) > 0
        THEN bc.business_address
        ELSE 'Address not provided'
    END as address,
    -- Try to extract city from business_address (very basic parsing)
    CASE 
        WHEN bc.business_address LIKE '%,%' 
        THEN TRIM(SPLIT_PART(bc.business_address, ',', -2))
        ELSE 'Miami' -- Default for Florida clients
    END as city,
    -- Default state for GladGrade (Miami-based)
    'FL' as state,
    'USA' as country,
    -- Try to extract postal code (5 digits at end)
    CASE 
        WHEN bc.business_address ~ '\d{5}(-\d{4})?$'
        THEN SUBSTRING(bc.business_address FROM '\d{5}(-\d{4})?$')
        ELSE '33101' -- Default Miami postal code
    END as postal_code,
    bc.phone,
    true as is_primary, -- Set as primary location
    'active' as status,
    bc.place_id, -- Copy place_id from business_clients if available
    bc.created_at,
    NOW() as updated_at
FROM business_clients bc
WHERE 
    -- Only migrate clients that don't already have a primary location
    NOT EXISTS (
        SELECT 1 FROM business_locations bl 
        WHERE bl.business_client_id = bc.id AND bl.is_primary = true
    )
    -- Only migrate clients with some address information
    AND (
        bc.business_address IS NOT NULL 
        AND LENGTH(TRIM(bc.business_address)) > 0
    );

-- Step 3: Handle clients without address information
-- Create minimal location records for clients with no address data
INSERT INTO business_locations (
    business_client_id,
    location_name,
    address,
    city,
    state,
    country,
    postal_code,
    phone,
    is_primary,
    status,
    created_at,
    updated_at
)
SELECT 
    bc.id as business_client_id,
    bc.business_name || ' - Main Location' as location_name,
    'Address to be updated' as address,
    'Miami' as city, -- Default city
    'FL' as state,
    'USA' as country,
    '33101' as postal_code, -- Default postal code
    bc.phone,
    true as is_primary,
    'pending' as status, -- Mark as pending since address needs updating
    bc.created_at,
    NOW() as updated_at
FROM business_clients bc
WHERE 
    -- Only clients that still don't have a primary location
    NOT EXISTS (
        SELECT 1 FROM business_locations bl 
        WHERE bl.business_client_id = bc.id AND bl.is_primary = true
    )
    -- And have no meaningful address information
    AND (
        bc.business_address IS NULL 
        OR LENGTH(TRIM(bc.business_address)) = 0
    );

-- Step 4: Update any existing non-primary locations to ensure only one primary per client
-- This handles edge cases where multiple primary locations might exist
UPDATE business_locations bl1
SET is_primary = false
WHERE bl1.is_primary = true
    AND EXISTS (
        SELECT 1 FROM business_locations bl2 
        WHERE bl2.business_client_id = bl1.business_client_id 
            AND bl2.is_primary = true 
            AND bl2.id < bl1.id -- Keep the first one as primary
    );

-- Step 5: Copy place_id from business_clients to business_locations where missing
UPDATE business_locations bl
SET 
    place_id = bc.place_id,
    updated_at = NOW()
FROM business_clients bc
WHERE bl.business_client_id = bc.id
    AND bc.place_id IS NOT NULL
    AND (bl.place_id IS NULL OR bl.place_id = '');

-- Step 6: Show migration results
SELECT 
    'Migration completed successfully!' as status,
    NOW() as completed_at;

SELECT 
    'Business locations created' as category,
    COUNT(*) as count
FROM business_locations;

SELECT 
    'Primary locations' as category,
    COUNT(*) as count
FROM business_locations
WHERE is_primary = true;

SELECT 
    'Locations with place_id' as category,
    COUNT(*) as count
FROM business_locations
WHERE place_id IS NOT NULL AND place_id != '';

SELECT 
    'Locations pending address update' as category,
    COUNT(*) as count
FROM business_locations
WHERE status = 'pending';

-- Step 7: Show sample of migrated data for verification
SELECT 
    bc.business_name,
    bc.business_address as original_address,
    bl.location_name,
    bl.address as migrated_address,
    bl.city,
    bl.state,
    bl.postal_code,
    bl.is_primary,
    bl.status,
    CASE 
        WHEN bl.place_id IS NOT NULL THEN 'Yes' 
        ELSE 'No' 
    END as has_place_id
FROM business_clients bc
JOIN business_locations bl ON bc.id = bl.business_client_id
WHERE bl.is_primary = true
ORDER BY bc.business_name
LIMIT 20;

-- Step 8: Identify clients that may need manual address cleanup
SELECT 
    'Clients needing manual address review:' as info;

SELECT 
    bc.id,
    bc.business_name,
    bc.business_address as original_address,
    bl.address as migrated_address,
    bl.status
FROM business_clients bc
JOIN business_locations bl ON bc.id = bl.business_client_id
WHERE bl.is_primary = true
    AND (
        bl.status = 'pending' 
        OR bl.address = 'Address not provided'
        OR bl.address = 'Address to be updated'
        OR bl.city = 'Miami' AND bc.business_address NOT LIKE '%Miami%'
    )
ORDER BY bc.business_name;

-- Success message with summary
DO $$
BEGIN
    RAISE NOTICE '✅ Business Locations Migration Completed Successfully!';
    RAISE NOTICE '📊 All business clients now have primary location records';
    RAISE NOTICE '🗺️ Address data migrated from business_clients.business_address';
    RAISE NOTICE '🔍 Place IDs copied where available';
    RAISE NOTICE '⚠️ Some locations marked as pending may need manual address updates';
    RAISE NOTICE '🎯 Ready for enhanced location management in edit modal';
END $$;









-- client-portal-users-schema.sql
-- Database schema for client portal users system

-- Create client_portal_users table
CREATE TABLE IF NOT EXISTS client_portal_users (
    id SERIAL PRIMARY KEY,
    business_client_id INTEGER REFERENCES business_clients(id) ON DELETE CASCADE,
    firebase_uid VARCHAR(255) UNIQUE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    
    -- Role within the client organization
    role VARCHAR(50) DEFAULT 'client_user' CHECK (role IN ('client_admin', 'client_moderator', 'client_user', 'client_viewer')),
    
    -- Status and access control
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    is_email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    
    -- Password management
    temporary_password VARCHAR(255), -- Store temporarily for sharing with creator
    password_reset_required BOOLEAN DEFAULT TRUE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    
    -- Audit trail
    created_by INTEGER REFERENCES employees(id), -- GladGrade employee who created this user
    created_by_client_user INTEGER REFERENCES client_portal_users(id), -- Or client admin who created this user
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by INTEGER REFERENCES employees(id),
    
    -- Contact preferences
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    marketing_consent BOOLEAN DEFAULT FALSE,
    
    -- Additional metadata
    notes TEXT, -- Internal notes about the user
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    language VARCHAR(10) DEFAULT 'en',
    
    -- Constraints
    CONSTRAINT unique_email_per_business UNIQUE(business_client_id, email),
    CONSTRAINT check_creator_logic CHECK (
        (created_by IS NOT NULL AND created_by_client_user IS NULL) OR 
        (created_by IS NULL AND created_by_client_user IS NOT NULL)
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_portal_users_business_id ON client_portal_users(business_client_id);
CREATE INDEX IF NOT EXISTS idx_client_portal_users_firebase_uid ON client_portal_users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_client_portal_users_email ON client_portal_users(email);
CREATE INDEX IF NOT EXISTS idx_client_portal_users_status ON client_portal_users(status);
CREATE INDEX IF NOT EXISTS idx_client_portal_users_role ON client_portal_users(role);
CREATE INDEX IF NOT EXISTS idx_client_portal_users_last_login ON client_portal_users(last_login);

-- Create client_user_activities table for tracking user actions
CREATE TABLE IF NOT EXISTS client_user_activities (
    id SERIAL PRIMARY KEY,
    client_user_id INTEGER REFERENCES client_portal_users(id) ON DELETE CASCADE,
    business_client_id INTEGER REFERENCES business_clients(id) ON DELETE CASCADE,
    
    -- Activity details
    activity_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'password_change', 'profile_update', 'report_view', 'review_action'
    activity_description TEXT,
    activity_metadata JSONB, -- Store additional data like IP, browser, etc.
    
    -- System information
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_user_activities_user_id ON client_user_activities(client_user_id);
CREATE INDEX IF NOT EXISTS idx_client_user_activities_business_id ON client_user_activities(business_client_id);
CREATE INDEX IF NOT EXISTS idx_client_user_activities_type ON client_user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_client_user_activities_created_at ON client_user_activities(created_at);

-- Create client_user_permissions table for granular permissions
CREATE TABLE IF NOT EXISTS client_user_permissions (
    id SERIAL PRIMARY KEY,
    client_user_id INTEGER REFERENCES client_portal_users(id) ON DELETE CASCADE,
    permission_name VARCHAR(100) NOT NULL,
    granted_by INTEGER REFERENCES employees(id),
    granted_by_client_user INTEGER REFERENCES client_portal_users(id),
    granted_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP, -- Optional expiration
    
    UNIQUE(client_user_id, permission_name)
);

CREATE INDEX IF NOT EXISTS idx_client_user_permissions_user_id ON client_user_permissions(client_user_id);
CREATE INDEX IF NOT EXISTS idx_client_user_permissions_permission ON client_user_permissions(permission_name);

-- Insert default permissions for client users
INSERT INTO permissions (name, description) VALUES
    ('client_view_dashboard', 'View client dashboard and basic reports'),
    ('client_view_reports', 'View detailed analytics and reports'),
    ('client_manage_reviews', 'Respond to and moderate reviews'),
    ('client_purchase_services', 'Purchase additional services and ads'),
    ('client_manage_users', 'Add, edit, and remove client portal users'),
    ('client_manage_profile', 'Edit business profile and settings'),
    ('client_view_billing', 'View billing information and invoices'),
    ('client_manage_billing', 'Update payment methods and billing info'),
    ('client_api_access', 'Access to client API endpoints'),
    ('client_export_data', 'Export reports and data')
ON CONFLICT (name) DO NOTHING;

-- Create function to assign default permissions based on role
CREATE OR REPLACE FUNCTION assign_default_client_permissions(user_id INTEGER, user_role VARCHAR(50))
RETURNS VOID AS $$
BEGIN
    -- Clear existing permissions
    DELETE FROM client_user_permissions WHERE client_user_id = user_id;
    
    -- Assign permissions based on role
    CASE user_role
        WHEN 'client_admin' THEN
            INSERT INTO client_user_permissions (client_user_id, permission_name) VALUES
                (user_id, 'client_view_dashboard'),
                (user_id, 'client_view_reports'),
                (user_id, 'client_manage_reviews'),
                (user_id, 'client_purchase_services'),
                (user_id, 'client_manage_users'),
                (user_id, 'client_manage_profile'),
                (user_id, 'client_view_billing'),
                (user_id, 'client_manage_billing'),
                (user_id, 'client_api_access'),
                (user_id, 'client_export_data');
        
        WHEN 'client_moderator' THEN
            INSERT INTO client_user_permissions (client_user_id, permission_name) VALUES
                (user_id, 'client_view_dashboard'),
                (user_id, 'client_view_reports'),
                (user_id, 'client_manage_reviews'),
                (user_id, 'client_purchase_services'),
                (user_id, 'client_manage_profile'),
                (user_id, 'client_view_billing'),
                (user_id, 'client_export_data');
        
        WHEN 'client_user' THEN
            INSERT INTO client_user_permissions (client_user_id, permission_name) VALUES
                (user_id, 'client_view_dashboard'),
                (user_id, 'client_view_reports'),
                (user_id, 'client_purchase_services'),
                (user_id, 'client_manage_profile'),
                (user_id, 'client_view_billing');
        
        WHEN 'client_viewer' THEN
            INSERT INTO client_user_permissions (client_user_id, permission_name) VALUES
                (user_id, 'client_view_dashboard'),
                (user_id, 'client_view_reports');
        
        ELSE
            -- Default to viewer permissions
            INSERT INTO client_user_permissions (client_user_id, permission_name) VALUES
                (user_id, 'client_view_dashboard'),
                (user_id, 'client_view_reports');
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to assign permissions when user is created or role changes
CREATE OR REPLACE FUNCTION trigger_assign_client_permissions()
RETURNS TRIGGER AS $$
BEGIN
    -- Assign default permissions based on role
    PERFORM assign_default_client_permissions(NEW.id, NEW.role);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_user_permissions_trigger
    AFTER INSERT OR UPDATE OF role ON client_portal_users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_assign_client_permissions();

-- Create updated_at trigger for client_portal_users
CREATE OR REPLACE FUNCTION update_client_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_portal_users_updated_at
    BEFORE UPDATE ON client_portal_users
    FOR EACH ROW
    EXECUTE FUNCTION update_client_user_updated_at();

-- Create view for client user details with business info
CREATE OR REPLACE VIEW client_users_detailed AS
SELECT 
    cpu.id,
    cpu.business_client_id,
    cpu.firebase_uid,
    cpu.email,
    cpu.full_name,
    cpu.role,
    cpu.status,
    cpu.is_email_verified,
    cpu.last_login,
    cpu.created_at,
    cpu.updated_at,
    
    -- Business information
    bc.business_name,
    bc.contact_name as business_contact_name,
    bc.contact_email as business_contact_email,
    
    -- Creator information
    CASE 
        WHEN cpu.created_by IS NOT NULL THEN e.full_name
        WHEN cpu.created_by_client_user IS NOT NULL THEN cpu2.full_name
        ELSE 'System'
    END as created_by_name,
    
    CASE 
        WHEN cpu.created_by IS NOT NULL THEN 'GladGrade Employee'
        WHEN cpu.created_by_client_user IS NOT NULL THEN 'Client Admin'
        ELSE 'System'
    END as created_by_type,
    
    -- Permission count
    (SELECT COUNT(*) FROM client_user_permissions WHERE client_user_id = cpu.id) as permission_count
    
FROM client_portal_users cpu
LEFT JOIN business_clients bc ON cpu.business_client_id = bc.id
LEFT JOIN employees e ON cpu.created_by = e.id
LEFT JOIN client_portal_users cpu2 ON cpu.created_by_client_user = cpu2.id;

-- Show summary of what was created
DO $$
BEGIN
    RAISE NOTICE '✅ Client Portal Users Schema Created Successfully!';
    RAISE NOTICE '📊 Tables: client_portal_users, client_user_activities, client_user_permissions';
    RAISE NOTICE '🔐 Permissions: 10 default client permissions added';
    RAISE NOTICE '⚙️ Functions: assign_default_client_permissions, triggers for auto-permissions';
    RAISE NOTICE '👁️ Views: client_users_detailed for comprehensive user info';
    RAISE NOTICE '📈 Indexes: Performance indexes on all key fields';
END $$;






-- client-activities-schema.sql
-- Database schema for client activities (identical to sales_activities but for clients)

-- Create client_activities table (mirrors sales_activities structure)
CREATE TABLE IF NOT EXISTS client_activities (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES business_clients(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(id),
    activity_type VARCHAR(50) NOT NULL, -- 'call', 'email', 'meeting', 'note', 'follow_up', 'proposal', 'contract', 'payment', 'support'
    subject VARCHAR(300) NOT NULL,
    description TEXT,
    outcome VARCHAR(100), -- 'positive', 'neutral', 'negative', 'no_response', 'completed', 'pending'
    next_action VARCHAR(300),
    scheduled_for TIMESTAMP,
    completed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Additional metadata
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    activity_metadata JSONB, -- Store additional data like call duration, email thread ID, etc.
    
    -- System information
    ip_address INET,
    user_agent TEXT,
    
    CONSTRAINT check_activity_type CHECK (activity_type IN (
        'call', 'email', 'meeting', 'note', 'follow_up', 'proposal', 
        'contract', 'payment', 'support', 'training', 'review', 'billing'
    )),
    CONSTRAINT check_outcome CHECK (outcome IN (
        'positive', 'neutral', 'negative', 'no_response', 'completed', 
        'pending', 'cancelled', 'rescheduled'
    )),
    CONSTRAINT check_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_activities_client_id ON client_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_employee_id ON client_activities(employee_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_type ON client_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_client_activities_completed_at ON client_activities(completed_at);
CREATE INDEX IF NOT EXISTS idx_client_activities_created_at ON client_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_client_activities_scheduled_for ON client_activities(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_client_activities_priority ON client_activities(priority);

-- Create client_activity_attachments table for file attachments
CREATE TABLE IF NOT EXISTS client_activity_attachments (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER REFERENCES client_activities(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES employees(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT check_file_size CHECK (file_size >= 0)
);

CREATE INDEX IF NOT EXISTS idx_client_activity_attachments_activity_id ON client_activity_attachments(activity_id);
CREATE INDEX IF NOT EXISTS idx_client_activity_attachments_uploaded_by ON client_activity_attachments(uploaded_by);

-- Create function to automatically update client's last activity timestamp
-- Create function to automatically update client's last activity timestamp
CREATE OR REPLACE FUNCTION update_client_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the client's last activity timestamp
    UPDATE business_clients 
    SET updated_at = NOW() 
    WHERE id = NEW.client_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update client last activity
CREATE TRIGGER client_activity_update_trigger
    AFTER INSERT ON client_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_client_last_activity();

-- Create view for activity summary by client
CREATE OR REPLACE VIEW client_activity_summary AS
SELECT 
    c.id as client_id,
    c.business_name,
    COUNT(ca.id) as total_activities,
    COUNT(CASE WHEN ca.activity_type = 'call' THEN 1 END) as total_calls,
    COUNT(CASE WHEN ca.activity_type = 'email' THEN 1 END) as total_emails,
    COUNT(CASE WHEN ca.activity_type = 'meeting' THEN 1 END) as total_meetings,
    COUNT(CASE WHEN ca.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as activities_last_30_days,
    MAX(ca.completed_at) as last_activity_date,
    MIN(ca.completed_at) as first_activity_date
FROM business_clients c
LEFT JOIN client_activities ca ON c.id = ca.client_id
GROUP BY c.id, c.business_name;

-- Create view for recent activities across all clients
CREATE OR REPLACE VIEW recent_client_activities AS
SELECT 
    ca.id,
    ca.client_id,
    ca.activity_type,
    ca.subject,
    ca.description,
    ca.outcome,
    ca.completed_at,
    ca.created_at,
    c.business_name,
    e.full_name as employee_name,
    e.role as employee_role,
    CASE 
        WHEN ca.completed_at >= NOW() - INTERVAL '1 day' THEN 'today'
        WHEN ca.completed_at >= NOW() - INTERVAL '7 days' THEN 'this_week'
        WHEN ca.completed_at >= NOW() - INTERVAL '30 days' THEN 'this_month'
        ELSE 'older'
    END as activity_age
FROM client_activities ca
JOIN business_clients c ON ca.client_id = c.id
LEFT JOIN employees e ON ca.employee_id = e.id
ORDER BY ca.completed_at DESC;

-- Insert sample activity types into permissions if needed
INSERT INTO permissions (name, description) VALUES
    ('client_activity_view', 'View client activities and history'),
    ('client_activity_create', 'Create new client activities'),
    ('client_activity_edit', 'Edit existing client activities'),
    ('client_activity_delete', 'Delete client activities'),
    ('client_activity_export', 'Export client activity reports')
ON CONFLICT (name) DO NOTHING;

-- Grant default activity permissions to relevant departments
WITH dept_perms AS (
    SELECT 
        d.id as dept_id,
        p.id as perm_id
    FROM departments d
    CROSS JOIN permissions p
    WHERE 
        -- Sales Department gets full activity permissions
        (d.name = 'Sales' AND p.name IN ('client_activity_view', 'client_activity_create', 'client_activity_edit', 'client_activity_export')) OR
        
        -- Customer Success gets view and create permissions
        (d.name = 'Customer Success' AND p.name IN ('client_activity_view', 'client_activity_create', 'client_activity_export')) OR
        
        -- Operations gets full permissions
        (d.name = 'Operations' AND p.name IN ('client_activity_view', 'client_activity_create', 'client_activity_edit', 'client_activity_delete', 'client_activity_export'))
)
INSERT INTO department_permissions (department_id, permission_id)
SELECT dept_id, perm_id FROM dept_perms
ON CONFLICT (department_id, permission_id) DO NOTHING;

-- Show summary of what was created
DO $$
BEGIN
    RAISE NOTICE '✅ Client Activities Schema Created Successfully!';
    RAISE NOTICE '📊 Tables: client_activities, client_activity_attachments';
    RAISE NOTICE '🔐 Permissions: 5 activity-related permissions added';
    RAISE NOTICE '⚙️ Functions: update_client_last_activity trigger function';
    RAISE NOTICE '👁️ Views: client_activity_summary, recent_client_activities';
    RAISE NOTICE '📈 Indexes: Performance indexes on all key fields';
    RAISE NOTICE '🔄 Triggers: Auto-update client last activity timestamp';
END $$;




ALTER TABLE client_qr_codes 
ADD CONSTRAINT unique_client_qr_type 
UNIQUE (client_id, qr_type);

ALTER TABLE client_qr_codes 
ALTER COLUMN qr_image_path TYPE TEXT;


ALTER TABLE business_clients 
ADD COLUMN IF NOT EXISTS has_items BOOLEAN DEFAULT FALSE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_business_clients_has_items ON business_clients(has_items);


-- Create business_client_services table in corp database
CREATE TABLE business_client_services (
    id SERIAL PRIMARY KEY,
    business_client_id INTEGER REFERENCES business_clients(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'expired'
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(business_client_id, service_id)
);

CREATE INDEX idx_business_client_services_client ON business_client_services(business_client_id);
CREATE INDEX idx_business_client_services_service ON business_client_services(service_id);
CREATE INDEX idx_business_client_services_active ON business_client_services(is_active);






INSERT INTO permissions (name, description) VALUES
('client_manage_menu', 'Create and edit menu/services/products'),
('client_publish_menu', 'Publish menu changes'),
('client_view_menu_history', 'View menu version history');



INSERT INTO services (
    name, 
    description, 
    category_id, 
    base_price, 
    setup_fee, 
    monthly_fee,
    commission_rate, 
    commission_type, 
    is_recurring, 
    billing_cycle,
    available_portal, 
    available_mobile, 
    service_type, 
    display_order
) VALUES
-- Menu Services Category (assuming Premium Features category_id = 4)
('Menu-3', 'Create up to 3 custom menus for your business', 4, 0.00, 0.00, 0.00, 0.00, 'percentage', FALSE, 'one_time', TRUE, FALSE, 'standard', 19),
('Menu-10', 'Create up to 10 custom menus for your business', 4, 0.00, 0.00, 0.00, 0.00, 'percentage', FALSE, 'one_time', TRUE, FALSE, 'premium', 20),
('Menu-Unlimited', 'Create unlimited custom menus for your business', 4, 0.00, 0.00, 0.00, 0.00, 'percentage', FALSE, 'one_time', TRUE, FALSE, 'enterprise', 21);


-- Create business_client_services table in corp database
CREATE TABLE business_client_services (
    id SERIAL PRIMARY KEY,
    business_client_id INTEGER REFERENCES business_clients(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'expired'
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(business_client_id, service_id)
);

CREATE INDEX idx_business_client_services_client ON business_client_services(business_client_id);
CREATE INDEX idx_business_client_services_service ON business_client_services(service_id);
CREATE INDEX idx_business_client_services_active ON business_client_services(is_active);






-- Add columns to business_claim_requests table
ALTER TABLE business_claim_requests 
ADD COLUMN IF NOT EXISTS fein VARCHAR(50),
ADD COLUMN IF NOT EXISTS dun_bradstreet_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS client_ip INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS browser_info JSONB,
ADD COLUMN IF NOT EXISTS referrer_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS device_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS form_completion_time INTEGER; -- seconds to complete form

-- Add business_claim_requests_id to prospects table
ALTER TABLE prospects 
ADD COLUMN IF NOT EXISTS business_claim_requests_id INTEGER REFERENCES business_claim_requests(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_prospects_business_claim_requests_id 
ON prospects(business_claim_requests_id);

-- Add comments for documentation
COMMENT ON COLUMN business_claim_requests.fein IS 'Federal Employer Identification Number';
COMMENT ON COLUMN business_claim_requests.dun_bradstreet_id IS 'Dun & Bradstreet business identifier';
COMMENT ON COLUMN business_claim_requests.client_ip IS 'IP address of form submitter';
COMMENT ON COLUMN business_claim_requests.user_agent IS 'Browser user agent string';
COMMENT ON COLUMN business_claim_requests.browser_info IS 'Additional browser/device metadata';
COMMENT ON COLUMN business_claim_requests.referrer_url IS 'URL that referred user to claim form';
COMMENT ON COLUMN business_claim_requests.device_type IS 'desktop, mobile, tablet, etc.';
COMMENT ON COLUMN business_claim_requests.session_id IS 'Unique session identifier';
COMMENT ON COLUMN business_claim_requests.form_completion_time IS 'Time in seconds to complete form';
COMMENT ON COLUMN prospects.business_claim_requests_id IS 'Links to original business claim request';