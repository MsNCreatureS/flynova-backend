-- Migration: Add bug_reports table
-- Description: Create table to store bug reports submitted by users

CREATE TABLE IF NOT EXISTS `bug_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL COMMENT 'User who submitted the bug (NULL for non-logged users)',
  `username` varchar(100) NOT NULL COMMENT 'Username or name of person reporting',
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `image_url` varchar(500) DEFAULT NULL COMMENT 'Screenshot or image URL',
  `status` enum('pending','in_progress','resolved','closed') DEFAULT 'pending',
  `admin_notes` text DEFAULT NULL COMMENT 'Notes from admin reviewing the bug',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `bug_reports_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index for efficient queries
CREATE INDEX `idx_status_created` ON `bug_reports` (`status`, `created_at` DESC);
