-- Migration: Add Pilot Tours System
-- Description: Allows VAs to create multi-leg tours with special awards for completion
-- Created: 2025-10-27

-- Table 1: Tours (main tour information)
CREATE TABLE IF NOT EXISTS va_tours (
  id INT AUTO_INCREMENT PRIMARY KEY,
  va_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  banner_image VARCHAR(500) DEFAULT NULL COMMENT 'Banner image URL',
  award_badge VARCHAR(500) DEFAULT NULL COMMENT 'Award badge icon/image URL',
  award_title VARCHAR(255) DEFAULT NULL COMMENT 'Title of the award given upon completion',
  award_description TEXT COMMENT 'Description of the award',
  status ENUM('draft', 'active', 'completed', 'cancelled') DEFAULT 'draft',
  start_date TIMESTAMP NULL DEFAULT NULL,
  end_date TIMESTAMP NULL DEFAULT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (va_id) REFERENCES virtual_airlines(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_va_id (va_id),
  INDEX idx_status (status),
  INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2: Tour Legs (individual flight legs in a tour)
CREATE TABLE IF NOT EXISTS va_tour_legs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tour_id INT NOT NULL,
  leg_number INT NOT NULL COMMENT 'Order of this leg in the tour (1, 2, 3...)',
  departure_icao VARCHAR(4) NOT NULL,
  departure_name VARCHAR(255) DEFAULT NULL,
  arrival_icao VARCHAR(4) NOT NULL,
  arrival_name VARCHAR(255) DEFAULT NULL,
  required_aircraft VARCHAR(100) DEFAULT NULL COMMENT 'Optional: specific aircraft type required',
  min_flight_time INT DEFAULT NULL COMMENT 'Minimum flight time in minutes',
  notes TEXT COMMENT 'Special notes or requirements for this leg',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (tour_id) REFERENCES va_tours(id) ON DELETE CASCADE,
  
  INDEX idx_tour_id (tour_id),
  INDEX idx_leg_number (tour_id, leg_number),
  UNIQUE KEY unique_leg (tour_id, leg_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3: Tour Progress (tracks pilot progress through tours)
CREATE TABLE IF NOT EXISTS va_tour_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tour_id INT NOT NULL,
  user_id INT NOT NULL,
  va_id INT NOT NULL,
  current_leg INT DEFAULT 1 COMMENT 'Current leg number the pilot is on',
  completed_legs JSON DEFAULT NULL COMMENT 'Array of completed leg IDs with timestamps',
  status ENUM('not_started', 'in_progress', 'completed', 'abandoned') DEFAULT 'not_started',
  started_at TIMESTAMP NULL DEFAULT NULL,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  award_claimed TINYINT(1) DEFAULT 0,
  
  FOREIGN KEY (tour_id) REFERENCES va_tours(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (va_id) REFERENCES virtual_airlines(id) ON DELETE CASCADE,
  
  INDEX idx_tour_user (tour_id, user_id),
  INDEX idx_user_va (user_id, va_id),
  INDEX idx_status (status),
  UNIQUE KEY unique_user_tour (tour_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 4: Tour Awards (earned awards displayed on pilot profile)
CREATE TABLE IF NOT EXISTS va_tour_awards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  tour_id INT NOT NULL,
  va_id INT NOT NULL,
  award_title VARCHAR(255) NOT NULL,
  award_description TEXT,
  award_badge VARCHAR(500) DEFAULT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tour_id) REFERENCES va_tours(id) ON DELETE CASCADE,
  FOREIGN KEY (va_id) REFERENCES virtual_airlines(id) ON DELETE CASCADE,
  
  INDEX idx_user (user_id),
  INDEX idx_tour (tour_id),
  INDEX idx_earned (earned_at DESC),
  UNIQUE KEY unique_user_tour_award (user_id, tour_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
