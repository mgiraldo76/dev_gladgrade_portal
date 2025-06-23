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
