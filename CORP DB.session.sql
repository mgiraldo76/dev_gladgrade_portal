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