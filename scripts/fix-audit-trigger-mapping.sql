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
