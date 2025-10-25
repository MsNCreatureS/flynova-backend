-- Migration: Add contact fields to virtual_airlines table
-- Date: 2025-10-25
-- Description: Add email and Discord contact information for Virtual Airlines

-- Add contact email field
ALTER TABLE virtual_airlines 
ADD COLUMN contact_email VARCHAR(255) NULL AFTER website;

-- Add Discord contact field (for server invite link or Discord ID)
ALTER TABLE virtual_airlines 
ADD COLUMN contact_discord VARCHAR(255) NULL AFTER contact_email;

-- Add general contact info field (for other platforms like Telegram, WhatsApp, etc.)
ALTER TABLE virtual_airlines 
ADD COLUMN contact_other TEXT NULL AFTER contact_discord;
