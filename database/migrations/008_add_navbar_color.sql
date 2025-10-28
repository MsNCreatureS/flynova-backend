-- Add navbar_color field to virtual_airlines table
ALTER TABLE virtual_airlines 
ADD COLUMN navbar_color VARCHAR(7) DEFAULT '#1e293b' 
COMMENT 'Couleur de la navbar (hex)' 
AFTER background_color;
