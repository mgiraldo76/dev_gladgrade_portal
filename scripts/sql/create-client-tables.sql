-- Create client/business tables for GladGrade Portal

-- Industry categories table
CREATE TABLE IF NOT EXISTS industry_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Business clients table
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
    security_level VARCHAR(50) DEFAULT 'pending', -- pending, verified, flagged, suspended
    verification_status VARCHAR(50) DEFAULT 'unverified', -- unverified, pending, verified, rejected
    verification_documents JSONB, -- Store document URLs/info
    gcsg_score INTEGER DEFAULT 300,
    monthly_reviews INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    subscription_plan VARCHAR(50) DEFAULT 'free', -- free, basic, premium, enterprise
    subscription_status VARCHAR(50) DEFAULT 'active',
    onboarding_completed BOOLEAN DEFAULT false,
    terms_accepted BOOLEAN DEFAULT false,
    privacy_accepted BOOLEAN DEFAULT false,
    marketing_consent BOOLEAN DEFAULT false,
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

-- Insert some sample business clients
INSERT INTO business_clients (
    business_name, contact_name, contact_email, phone, 
    industry_category_id, number_of_locations, security_level,
    gcsg_score, monthly_reviews, total_reviews, average_rating
) VALUES
    ('Miami Beach Restaurant', 'Carlos Martinez', 'carlos@miamibeach.com', '+1-305-555-0123',
     (SELECT id FROM industry_categories WHERE name = 'Restaurant & Food'), 3, 'verified',
     785, 45, 234, 4.2),
    ('Downtown Coffee Shop', 'Emma Wilson', 'emma@downtowncoffee.com', '+1-305-555-0456',
     (SELECT id FROM industry_categories WHERE name = 'Restaurant & Food'), 1, 'pending',
     692, 12, 67, 3.8),
    ('Sunset Spa & Wellness', 'Maria Rodriguez', 'maria@sunsetspa.com', '+1-305-555-0789',
     (SELECT id FROM industry_categories WHERE name = 'Beauty & Wellness'), 2, 'verified',
     823, 28, 156, 4.6),
    ('TechFix Solutions', 'David Kim', 'david@techfixsolutions.com', '+1-305-555-0321',
     (SELECT id FROM industry_categories WHERE name = 'Technology'), 1, 'flagged',
     634, 8, 34, 3.2)
ON CONFLICT (contact_email) DO NOTHING;

-- Insert sample locations for the businesses
INSERT INTO business_locations (
    business_client_id, location_name, address, city, state, postal_code, 
    phone, is_primary, operating_hours
) VALUES
    ((SELECT id FROM business_clients WHERE contact_email = 'carlos@miamibeach.com'),
     'Miami Beach Main Location', '123 Ocean Drive', 'Miami Beach', 'FL', '33139',
     '+1-305-555-0123', true, '{"monday": "11:00-22:00", "tuesday": "11:00-22:00", "wednesday": "11:00-22:00", "thursday": "11:00-22:00", "friday": "11:00-23:00", "saturday": "11:00-23:00", "sunday": "11:00-21:00"}'),
    ((SELECT id FROM business_clients WHERE contact_email = 'emma@downtowncoffee.com'),
     'Downtown Coffee Main', '456 Biscayne Blvd', 'Miami', 'FL', '33132',
     '+1-305-555-0456', true, '{"monday": "06:00-18:00", "tuesday": "06:00-18:00", "wednesday": "06:00-18:00", "thursday": "06:00-18:00", "friday": "06:00-18:00", "saturday": "07:00-17:00", "sunday": "07:00-16:00"}')
ON CONFLICT DO NOTHING;
