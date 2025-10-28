-- Migration 010: Add text color customization to virtual_airlines
-- These colors will be used for various text elements throughout the VA dashboard

ALTER TABLE virtual_airlines 
ADD COLUMN navbar_title_color VARCHAR(7) DEFAULT '#1e293b' COMMENT 'Color for navbar title text',
ADD COLUMN heading_color VARCHAR(7) DEFAULT '#0f172a' COMMENT 'Color for main headings/titles (h1, h2)',
ADD COLUMN subheading_color VARCHAR(7) DEFAULT '#334155' COMMENT 'Color for secondary headings (h3, h4)',
ADD COLUMN text_color VARCHAR(7) DEFAULT '#475569' COMMENT 'Color for general body text';
