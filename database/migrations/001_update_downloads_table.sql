-- Migration: Update downloads table to support external URLs
-- Date: 2025-10-25
-- Description: Modify downloads table to support both file uploads and external URLs (especially for liveries)

-- Make file_name and file_size nullable since external URLs won't have these
ALTER TABLE downloads 
MODIFY COLUMN file_name VARCHAR(255) NULL,
MODIFY COLUMN file_size INT NULL;

-- Add a column to indicate if the URL is external or local file
ALTER TABLE downloads 
ADD COLUMN is_external_url BOOLEAN DEFAULT FALSE AFTER file_url;

-- Add comment to clarify usage
ALTER TABLE downloads 
MODIFY COLUMN file_url VARCHAR(500) NOT NULL COMMENT 'Local file path or external URL for downloads';

-- Update existing data: set is_external_url to FALSE for all existing records
UPDATE downloads SET is_external_url = FALSE WHERE is_external_url IS NULL;
