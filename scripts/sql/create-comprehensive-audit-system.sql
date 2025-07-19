-- COMPREHENSIVE AUDIT SYSTEM FOR GLADGRADE PORTAL
-- Execute this first - creates all audit logging tables and functions

-- 1. Main audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    
    -- User Information
    user_id INTEGER REFERENCES employees(id),
    user_email VARCHAR(300),
    user_name VARCHAR(300),
    user_role VARCHAR(100),
    
    -- Action Details
    action_type VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INTEGER,
    action_description TEXT NOT NULL,
    
    -- Change Details
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    -- System Information
    ip_address INET,
    user_agent TEXT,
    browser_info JSONB,
    location_info JSONB,
    session_id VARCHAR(255),
    
    -- Request Information
    request_method VARCHAR(10),
    request_url TEXT,
    request_headers JSONB,
    response_status INTEGER,
    
    -- Business Context
    business_context VARCHAR(100),
    severity_level VARCHAR(20) DEFAULT 'info',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT audit_logs_action_type_check CHECK (action_type IN (
        'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ASSIGN', 'CONVERT', 
        'PERMISSION_CHANGE', 'STATUS_CHANGE', 'BULK_UPDATE', 'EXPORT', 'IMPORT'
    ))
);

-- 2. Prospect ownership changes log
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
    device_type VARCHAR(50),
    
    -- Location (from IP)
    country VARCHAR(100),
    region VARCHAR(100),
    city VARCHAR(100),
    timezone VARCHAR(100),
    
    -- Security
    login_method VARCHAR(50),
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

-- 10. Insert initial audit log
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
    'Comprehensive audit logging system initialized',
    'system@gladgrade.com',
    'System',
    'system',
    'system',
    'info'
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ COMPREHENSIVE AUDIT SYSTEM CREATED SUCCESSFULLY!';
    RAISE NOTICE '📊 Tables: audit_logs, prospect_ownership_logs, employee_activity_sessions, system_config_logs';
    RAISE NOTICE '🔍 Triggers: Applied to prospects, employees, business_clients, commissions, employee_permissions';
    RAISE NOTICE '📈 Views: recent_audit_activity, prospect_ownership_history';
    RAISE NOTICE '🔧 Functions: audit_trigger_function(), log_prospect_ownership_change()';
END $$;
