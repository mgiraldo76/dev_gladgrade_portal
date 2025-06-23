-- Add missing columns to business_clients table for conversion tracking
-- This script adds columns that are referenced in the conversion API but don't exist

-- Add conversion tracking columns
ALTER TABLE business_clients 
ADD COLUMN IF NOT EXISTS conversion_value DECIMAL(10,2) DEFAULT 0.00;

ALTER TABLE business_clients 
ADD COLUMN IF NOT EXISTS original_prospect_id INTEGER REFERENCES prospects(id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_clients_conversion_value ON business_clients(conversion_value);
CREATE INDEX IF NOT EXISTS idx_business_clients_original_prospect_id ON business_clients(original_prospect_id);
CREATE INDEX IF NOT EXISTS idx_business_clients_sales_rep_id ON business_clients(sales_rep_id);

-- Verify the columns were added by selecting from the table
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'business_clients' 
    AND column_name IN ('conversion_value', 'original_prospect_id')
ORDER BY column_name;

-- Show a success message
SELECT 'Missing columns added to business_clients table successfully!' as status;
