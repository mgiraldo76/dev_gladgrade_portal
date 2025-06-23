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
