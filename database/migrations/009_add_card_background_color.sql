-- Migration 009: Add card_background_color to virtual_airlines
-- This color will be used for card/panel backgrounds throughout the VA dashboard

ALTER TABLE virtual_airlines 
ADD COLUMN card_background_color VARCHAR(7) DEFAULT '#ffffff' COMMENT 'Background color for cards/panels';
