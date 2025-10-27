-- Migration: Add Cabin Announcements table
-- Description: Allows VAs to upload custom cabin announcement audio files for the tracker
-- Created: 2025-10-27

CREATE TABLE IF NOT EXISTS va_cabin_announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  va_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  audio_url VARCHAR(500) NOT NULL,
  announcement_type ENUM('boarding', 'safety', 'takeoff', 'cruise', 'descent', 'landing', 'arrival', 'custom') DEFAULT 'custom',
  duration INT DEFAULT 0 COMMENT 'Duration in seconds',
  file_size INT DEFAULT 0 COMMENT 'File size in bytes',
  uploaded_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (va_id) REFERENCES virtual_airlines(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_va_id (va_id),
  INDEX idx_announcement_type (announcement_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
