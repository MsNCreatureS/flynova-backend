-- Add background_color field to virtual_airlines table
ALTER TABLE virtual_airlines 
ADD COLUMN background_color VARCHAR(7) DEFAULT '#f8fafc' 
COMMENT 'Couleur de fond du dashboard (hex)' 
AFTER text_on_primary;
