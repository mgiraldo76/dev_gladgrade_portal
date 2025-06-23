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

-- Insert company positions
INSERT INTO company_positions (title, description, level, additional_permissions, can_access_sales) VALUES
('CEO', 'Chief Executive Officer', 5, ARRAY['*'], TRUE),
('CCO', 'Chief Commercial Officer', 5, ARRAY['sales_pipeline', 'commission_management', 'financial_reports'], TRUE),
('CTO', 'Chief Technology Officer', 5, ARRAY['system_admin', 'technical_reports'], FALSE),
('Sales Director', 'Director of Sales', 4, ARRAY['sales_pipeline', 'team_management'], TRUE),
('Sales Manager', 'Sales Team Manager', 3, ARRAY['sales_pipeline', 'team_reports'], TRUE),
('Account Manager', 'Client Account Management', 3, ARRAY['client_management'], TRUE),
('Sales Representative', 'Individual Sales Rep', 2, ARRAY['sales_pipeline'], TRUE),
('Marketing Manager', 'Marketing and Lead Generation', 3, ARRAY['marketing_tools', 'lead_management'], TRUE)
ON CONFLICT (title) DO NOTHING;

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
