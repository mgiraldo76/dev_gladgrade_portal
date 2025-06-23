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
