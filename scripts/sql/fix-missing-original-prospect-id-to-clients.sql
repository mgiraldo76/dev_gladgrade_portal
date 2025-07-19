-- Update business_clients with original_prospect_id using priority matching
-- Priority: 1) business_name + email, 2) business_name only, 3) business_name + time proximity

-- First, let's see what we're working with
SELECT 
    'Business clients without prospect ID' as category,
    COUNT(*) as count
FROM business_clients 
WHERE original_prospect_id IS NULL;

SELECT 
    'Total prospects available for matching' as category,
    COUNT(*) as count
FROM prospects;

-- Create a temporary table to track our updates
CREATE TEMP TABLE prospect_matches AS
SELECT 
    bc.id as client_id,
    bc.business_name as client_name,
    bc.contact_email as client_email,
    bc.created_at as client_created,
    NULL::INTEGER as matched_prospect_id,
    NULL::TEXT as match_method,
    NULL::TEXT as prospect_name,
    NULL::TEXT as prospect_email,
    NULL::TIMESTAMP as prospect_created
FROM business_clients bc
WHERE bc.original_prospect_id IS NULL;

-- PRIORITY 1: Match by business_name + contact_email (exact matches)
UPDATE prospect_matches pm
SET 
    matched_prospect_id = p.id,
    match_method = 'business_name + email',
    prospect_name = p.business_name,
    prospect_email = p.contact_email,
    prospect_created = p.created_at
FROM prospects p
WHERE pm.matched_prospect_id IS NULL
    AND LOWER(TRIM(pm.client_name)) = LOWER(TRIM(p.business_name))
    AND LOWER(TRIM(pm.client_email)) = LOWER(TRIM(p.contact_email))
    AND pm.client_email IS NOT NULL 
    AND p.contact_email IS NOT NULL;

-- PRIORITY 2: Match by business_name only (for remaining unmatched)
-- We'll pick the most recent prospect if multiple matches exist
UPDATE prospect_matches pm
SET 
    matched_prospect_id = p.id,
    match_method = 'business_name only',
    prospect_name = p.business_name,
    prospect_email = p.contact_email,
    prospect_created = p.created_at
FROM prospects p
WHERE pm.matched_prospect_id IS NULL
    AND LOWER(TRIM(pm.client_name)) = LOWER(TRIM(p.business_name))
    AND p.id = (
        -- Get the most recent prospect with this business name
        SELECT p2.id 
        FROM prospects p2 
        WHERE LOWER(TRIM(p2.business_name)) = LOWER(TRIM(p.business_name))
        ORDER BY p2.created_at DESC 
        LIMIT 1
    );

-- PRIORITY 3: Match by business_name + time proximity (within 30 days)
-- For remaining unmatched, find prospects created within 30 days before the client
UPDATE prospect_matches pm
SET 
    matched_prospect_id = p.id,
    match_method = 'business_name + time proximity',
    prospect_name = p.business_name,
    prospect_email = p.contact_email,
    prospect_created = p.created_at
FROM prospects p
WHERE pm.matched_prospect_id IS NULL
    AND LOWER(TRIM(pm.client_name)) = LOWER(TRIM(p.business_name))
    AND p.created_at <= pm.client_created
    AND p.created_at >= (pm.client_created - INTERVAL '30 days')
    AND p.id = (
        -- Get the prospect closest in time to the client creation
        SELECT p2.id 
        FROM prospects p2 
        WHERE LOWER(TRIM(p2.business_name)) = LOWER(TRIM(p.business_name))
            AND p2.created_at <= pm.client_created
            AND p2.created_at >= (pm.client_created - INTERVAL '30 days')
        ORDER BY ABS(EXTRACT(EPOCH FROM (pm.client_created - p2.created_at)))
        LIMIT 1
    );

-- Show matching results before applying
SELECT 
    match_method,
    COUNT(*) as matches_found
FROM prospect_matches 
WHERE matched_prospect_id IS NOT NULL
GROUP BY match_method
ORDER BY 
    CASE match_method
        WHEN 'business_name + email' THEN 1
        WHEN 'business_name only' THEN 2
        WHEN 'business_name + time proximity' THEN 3
    END;

-- Show detailed matches for review
SELECT 
    pm.client_id,
    pm.client_name,
    pm.client_email,
    pm.client_created,
    pm.matched_prospect_id,
    pm.match_method,
    pm.prospect_name,
    pm.prospect_email,
    pm.prospect_created,
    CASE 
        WHEN pm.client_created > pm.prospect_created 
        THEN EXTRACT(EPOCH FROM (pm.client_created - pm.prospect_created))/86400 
        ELSE 0 
    END as days_between
FROM prospect_matches pm
WHERE pm.matched_prospect_id IS NOT NULL
ORDER BY pm.match_method, pm.client_name;

-- Show unmatched clients
SELECT 
    'Unmatched clients' as status,
    client_name,
    client_email,
    client_created
FROM prospect_matches 
WHERE matched_prospect_id IS NULL
ORDER BY client_name;

-- APPLY THE UPDATES (uncomment the next section to execute)

-- Update business_clients with the matched prospect IDs
UPDATE business_clients bc
SET 
    original_prospect_id = pm.matched_prospect_id,
    updated_at = CURRENT_TIMESTAMP
FROM prospect_matches pm
WHERE bc.id = pm.client_id 
    AND pm.matched_prospect_id IS NOT NULL;

-- Report final results
SELECT 
    'Clients updated with prospect IDs' as result,
    COUNT(*) as count
FROM business_clients 
WHERE original_prospect_id IS NOT NULL;

SELECT 'Prospect ID matching completed successfully!' as status;


-- Instructions for execution:
SELECT '
REVIEW THE MATCHES ABOVE FIRST!
If the matches look correct, uncomment the final UPDATE section and run again.
The matches are currently in the temporary table but not yet applied to business_clients.
' as instructions;

