-- =====================================================
-- GladGrade Content Moderation Schema - V3 (Corrected)
-- =====================================================

-- 1. Create ModerationStatuses Table (corp database)
CREATE TABLE IF NOT EXISTS corp.moderation_statuses (
    id SERIAL PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_visible_to_users BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default statuses
INSERT INTO corp.moderation_statuses (id, status_name, description, is_visible_to_users) VALUES
(1, 'pending', 'Awaiting moderation review', TRUE),
(2, 'approved', 'Content approved and visible', TRUE),
(3, 'flagged', 'Content flagged for review', FALSE),
(4, 'deleted', 'Content marked for deletion', FALSE),
(5, 'rejected', 'Content rejected and hidden', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Index for moderation statuses
CREATE INDEX IF NOT EXISTS idx_moderation_statuses_visible ON corp.moderation_statuses(is_visible_to_users);

-- =====================================================
-- 2. Add moderation fields to gg.imageURLs
-- =====================================================
DO $$ 
BEGIN
    -- Add moderation_status_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'gg' AND table_name = 'imageurls' AND column_name = 'moderation_status_id') THEN
        ALTER TABLE gg.imageURLs ADD COLUMN moderation_status_id INTEGER DEFAULT 1;
    END IF;
    
    -- Add moderated_by_employee_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'gg' AND table_name = 'imageurls' AND column_name = 'moderated_by_employee_id') THEN
        ALTER TABLE gg.imageURLs ADD COLUMN moderated_by_employee_id INTEGER;
    END IF;
    
    -- Add moderation_notes column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'gg' AND table_name = 'imageurls' AND column_name = 'moderation_notes') THEN
        ALTER TABLE gg.imageURLs ADD COLUMN moderation_notes TEXT;
    END IF;
    
    -- Add moderated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'gg' AND table_name = 'imageurls' AND column_name = 'moderated_at') THEN
        ALTER TABLE gg.imageURLs ADD COLUMN moderated_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Indexes for gg.imageURLs
CREATE INDEX IF NOT EXISTS idx_imageURLs_moderation_status ON gg.imageURLs(moderation_status_id);
CREATE INDEX IF NOT EXISTS idx_imageURLs_moderated_by ON gg.imageURLs(moderated_by_employee_id);
CREATE INDEX IF NOT EXISTS idx_imageURLs_moderated_at ON gg.imageURLs(moderated_at);
CREATE INDEX IF NOT EXISTS idx_imageURLs_pending_moderation ON gg.imageURLs(moderation_status_id, datecreated) WHERE moderation_status_id = 1;

-- =====================================================
-- 3. Add moderation fields to gg.consumerReviews
-- =====================================================
DO $$ 
BEGIN
    -- Add moderation_status_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'gg' AND table_name = 'consumerreviews' AND column_name = 'moderation_status_id') THEN
        ALTER TABLE gg.consumerReviews ADD COLUMN moderation_status_id INTEGER DEFAULT 1;
    END IF;
    
    -- Add moderated_by_employee_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'gg' AND table_name = 'consumerreviews' AND column_name = 'moderated_by_employee_id') THEN
        ALTER TABLE gg.consumerReviews ADD COLUMN moderated_by_employee_id INTEGER;
    END IF;
    
    -- Add moderation_notes column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'gg' AND table_name = 'consumerreviews' AND column_name = 'moderation_notes') THEN
        ALTER TABLE gg.consumerReviews ADD COLUMN moderation_notes TEXT;
    END IF;
    
    -- Add moderated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'gg' AND table_name = 'consumerreviews' AND column_name = 'moderated_at') THEN
        ALTER TABLE gg.consumerReviews ADD COLUMN moderated_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Indexes for gg.consumerReviews
CREATE INDEX IF NOT EXISTS idx_consumerReviews_moderation_status ON gg.consumerReviews(moderation_status_id);
CREATE INDEX IF NOT EXISTS idx_consumerReviews_moderated_by ON gg.consumerReviews(moderated_by_employee_id);
CREATE INDEX IF NOT EXISTS idx_consumerReviews_moderated_at ON gg.consumerReviews(moderated_at);
CREATE INDEX IF NOT EXISTS idx_consumerReviews_pending_moderation ON gg.consumerReviews(moderation_status_id, datecreated) WHERE moderation_status_id = 1;

-- =====================================================
-- 4. Add moderation fields to gg.ads and missing columns
-- =====================================================
DO $$ 
BEGIN
    -- Add userId column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'gg' AND table_name = 'ads' AND column_name = 'userid') THEN
        ALTER TABLE gg.ads ADD COLUMN userId INTEGER DEFAULT 0;
    END IF;
    
    -- Add businessId column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'gg' AND table_name = 'ads' AND column_name = 'businessid') THEN
        ALTER TABLE gg.ads ADD COLUMN businessId INTEGER;
    END IF;
    
    -- Add moderation_status_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'gg' AND table_name = 'ads' AND column_name = 'moderation_status_id') THEN
        ALTER TABLE gg.ads ADD COLUMN moderation_status_id INTEGER DEFAULT 1;
    END IF;
    
    -- Add moderated_by_employee_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'gg' AND table_name = 'ads' AND column_name = 'moderated_by_employee_id') THEN
        ALTER TABLE gg.ads ADD COLUMN moderated_by_employee_id INTEGER;
    END IF;
    
    -- Add moderation_notes column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'gg' AND table_name = 'ads' AND column_name = 'moderation_notes') THEN
        ALTER TABLE gg.ads ADD COLUMN moderation_notes TEXT;
    END IF;
    
    -- Add moderated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'gg' AND table_name = 'ads' AND column_name = 'moderated_at') THEN
        ALTER TABLE gg.ads ADD COLUMN moderated_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Indexes for gg.ads
CREATE INDEX IF NOT EXISTS idx_ads_userId ON gg.ads(userId);
CREATE INDEX IF NOT EXISTS idx_ads_businessId ON gg.ads(businessId);
CREATE INDEX IF NOT EXISTS idx_ads_moderation_status ON gg.ads(moderation_status_id);
CREATE INDEX IF NOT EXISTS idx_ads_moderated_by ON gg.ads(moderated_by_employee_id);
CREATE INDEX IF NOT EXISTS idx_ads_moderated_at ON gg.ads(moderated_at);
CREATE INDEX IF NOT EXISTS idx_ads_pending_moderation ON gg.ads(moderation_status_id, datecreated) WHERE moderation_status_id = 1;

-- =====================================================
-- 5. Add new message categories for client-user communications
-- =====================================================
-- Insert new message categories if they don't exist
INSERT INTO gg.messageCategories (id, name) VALUES 
(8, 'Review Response'),
(9, 'Complaint'),
(10, 'Inquiry')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 6. Create Client-User Communications Table
-- =====================================================
CREATE TABLE IF NOT EXISTS gg.client_user_communications (
    id SERIAL PRIMARY KEY,
    client_id INTEGER, -- Business owner/client (references gg.users)
    user_id INTEGER,   -- Mobile app user (references gg.users)
    business_id INTEGER, -- Business (references gg.businesses)
    consumer_review_id INTEGER, -- Related review (references gg.consumerReviews)
    consumer_rating_id INTEGER, -- Related rating (references gg.consumerRatings)
    message_from_client TEXT,
    message_from_user TEXT,
    message_category_id INTEGER REFERENCES gg.messageCategories(id), -- Using existing messageCategories table
    moderation_status_id INTEGER DEFAULT 1,
    moderated_by_employee_id INTEGER,
    moderation_notes TEXT,
    moderated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for client_user_communications
CREATE INDEX IF NOT EXISTS idx_client_user_comms_client_id ON gg.client_user_communications(client_id);
CREATE INDEX IF NOT EXISTS idx_client_user_comms_user_id ON gg.client_user_communications(user_id);
CREATE INDEX IF NOT EXISTS idx_client_user_comms_business_id ON gg.client_user_communications(business_id);
CREATE INDEX IF NOT EXISTS idx_client_user_comms_review_id ON gg.client_user_communications(consumer_review_id);
CREATE INDEX IF NOT EXISTS idx_client_user_comms_message_category ON gg.client_user_communications(message_category_id);
CREATE INDEX IF NOT EXISTS idx_client_user_comms_moderation_status ON gg.client_user_communications(moderation_status_id);
CREATE INDEX IF NOT EXISTS idx_client_user_comms_pending ON gg.client_user_communications(moderation_status_id, created_at) WHERE moderation_status_id = 1;

-- =====================================================
-- 7. Update existing records to have default moderation status
-- =====================================================

-- Update existing imageURLs to pending status
UPDATE gg.imageURLs SET moderation_status_id = 1 WHERE moderation_status_id IS NULL;

-- Update existing consumerReviews to pending status  
UPDATE gg.consumerReviews SET moderation_status_id = 1 WHERE moderation_status_id IS NULL;

-- Update existing ads to pending status
UPDATE gg.ads SET moderation_status_id = 1 WHERE moderation_status_id IS NULL;

-- =====================================================
-- 8. Create views for easy moderation queries
-- =====================================================

-- View for pending moderation items (using corrected column references)
CREATE OR REPLACE VIEW gg.v_pending_moderation AS
SELECT 
    'image' as content_type,
    i.id,
    i.imageurl as content,
    i.datecreated as created_at,
    i.moderation_status_id,
    i.moderated_by_employee_id,
    i.moderation_notes,
    i.moderated_at,
    u.firstname || ' ' || u.lastname as user_name,
    b.businessname as business_name,
    (SELECT placeId FROM gg.consumerRatings WHERE id = i.consumerRatingId) as placeid
FROM gg.imageURLs i
LEFT JOIN gg.users u ON i.userid = u.id
LEFT JOIN gg.businesses b ON (SELECT placeId FROM gg.consumerRatings WHERE id = i.consumerRatingId) = b.placeid
WHERE i.moderation_status_id = 1

UNION ALL

SELECT 
    'review' as content_type,
    r.id,
    r.review as content,
    r.datecreated as created_at,
    r.moderation_status_id,
    r.moderated_by_employee_id,
    r.moderation_notes,
    r.moderated_at,
    u.firstname || ' ' || u.lastname as user_name,
    b.businessname as business_name,
    r.placeid
FROM gg.consumerReviews r
LEFT JOIN gg.users u ON r.userid = u.id
LEFT JOIN gg.businesses b ON r.placeid = b.placeid
WHERE r.moderation_status_id = 1

UNION ALL

SELECT 
    'ad' as content_type,
    a.id,
    a.imageurl as content,
    a.datecreated as created_at,
    a.moderation_status_id,
    a.moderated_by_employee_id,
    a.moderation_notes,
    a.moderated_at,
    u.firstname || ' ' || u.lastname as user_name,
    b.businessname as business_name,
    b.placeid
FROM gg.ads a
LEFT JOIN gg.users u ON a.userid = u.id
LEFT JOIN gg.businesses b ON a.businessid = b.id
WHERE a.moderation_status_id = 1

UNION ALL

SELECT 
    'communication' as content_type,
    c.id,
    COALESCE(c.message_from_client, c.message_from_user) as content,
    c.created_at,
    c.moderation_status_id,
    c.moderated_by_employee_id,
    c.moderation_notes,
    c.moderated_at,
    CASE 
        WHEN c.message_from_client IS NOT NULL THEN client_u.firstname || ' ' || client_u.lastname
        ELSE user_u.firstname || ' ' || user_u.lastname
    END as user_name,
    b.businessname as business_name,
    b.placeid
FROM gg.client_user_communications c
LEFT JOIN gg.users client_u ON c.client_id = client_u.id
LEFT JOIN gg.users user_u ON c.user_id = user_u.id
LEFT JOIN gg.businesses b ON c.business_id = b.id
LEFT JOIN gg.messageCategories mc ON c.message_category_id = mc.id
WHERE c.moderation_status_id = 1

ORDER BY created_at DESC;

-- =====================================================
-- Success message
-- =====================================================
DO $$ 
BEGIN
    RAISE NOTICE '✅ Content Moderation schema created successfully!';
    RAISE NOTICE '📊 Tables updated: imageURLs, consumerReviews, ads, client_user_communications';
    RAISE NOTICE '🔍 Moderation statuses: 1=pending, 2=approved, 3=flagged, 4=deleted, 5=rejected';
    RAISE NOTICE '👀 View created: gg.v_pending_moderation for easy querying';
    RAISE NOTICE '📋 Message categories added: Review Response, Complaint, Inquiry';
END $$;
