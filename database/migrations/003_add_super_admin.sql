-- Add super_admin field to users table
ALTER TABLE users 
ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE AFTER status;

-- Add index for quick super admin checks
CREATE INDEX idx_super_admin ON users(is_super_admin);
