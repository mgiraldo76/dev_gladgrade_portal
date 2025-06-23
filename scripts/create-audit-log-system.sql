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

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_business_context ON audit_logs(business_context);

CREATE INDEX IF NOT EXISTS idx_prospect_ownership_prospect_id ON prospect_ownership_logs(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_ownership_changed_by ON prospect_ownership_logs(changed_by_id);
CREATE INDEX IF NOT EXISTS idx_prospect_ownership_changed_at ON prospect_ownership_logs(changed_at);

CREATE INDEX IF NOT EXISTS idx_employee_sessions_employee_id ON employee_activity_sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_sessions_active ON employee_activity_sessions(is_active);

-- 5. Function to log prospect ownership changes
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

-- 6. Insert initial audit log for system setup
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
    RAISE NOTICE '📊 Tables Created: audit_logs, prospect_ownership_logs, employee_activity_sessions';
    RAISE NOTICE '🔧 Functions Created: log_prospect_ownership_change()';
END $$;
