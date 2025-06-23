-- Remove the UNIQUE constraint on contact_email from business_clients table
-- Multiple clients can have the same contact email (e.g., shared business emails)

-- First, check if the constraint exists
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'business_clients' 
  AND constraint_type = 'UNIQUE'
  AND constraint_name LIKE '%contact_email%';

-- Drop the unique constraint on contact_email
ALTER TABLE business_clients 
DROP CONSTRAINT IF EXISTS business_clients_contact_email_key;

-- Verify the constraint is removed
SELECT 'Email constraint removed successfully' as status;

-- Show current constraints on the table
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'business_clients' 
  AND constraint_type IN ('UNIQUE', 'PRIMARY KEY');
