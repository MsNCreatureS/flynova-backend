-- ============================================
-- FlyNova VA Color Branding Migrations
-- Execute all these commands in your database
-- ============================================

-- Migration 007: Add background_color
ALTER TABLE virtual_airlines 
ADD COLUMN IF NOT EXISTS background_color VARCHAR(7) DEFAULT '#f8fafc' COMMENT 'Page background color';

-- Migration 008: Add navbar_color
ALTER TABLE virtual_airlines
ADD COLUMN IF NOT EXISTS navbar_color VARCHAR(7) DEFAULT '#1e293b' COMMENT 'Navigation bar background color';

-- Migration 009: Add card_background_color
ALTER TABLE virtual_airlines 
ADD COLUMN IF NOT EXISTS card_background_color VARCHAR(7) DEFAULT '#ffffff' COMMENT 'Background color for cards/panels';

-- Migration 010: Add text color customization
ALTER TABLE virtual_airlines 
ADD COLUMN IF NOT EXISTS navbar_title_color VARCHAR(7) DEFAULT '#1e293b' COMMENT 'Color for navbar title text',
ADD COLUMN IF NOT EXISTS heading_color VARCHAR(7) DEFAULT '#0f172a' COMMENT 'Color for main headings/titles (h1, h2)',
ADD COLUMN IF NOT EXISTS subheading_color VARCHAR(7) DEFAULT '#334155' COMMENT 'Color for secondary headings (h3, h4)',
ADD COLUMN IF NOT EXISTS text_color VARCHAR(7) DEFAULT '#475569' COMMENT 'Color for general body text';

-- ============================================
-- Verify the changes
-- ============================================
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'virtual_airlines' 
    AND TABLE_SCHEMA = DATABASE()
    AND COLUMN_NAME LIKE '%color%'
ORDER BY ORDINAL_POSITION;
