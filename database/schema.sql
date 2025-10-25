-- FlyNova Database Schema
-- Virtual Airline Management Platform

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    status ENUM('active', 'suspended', 'inactive') DEFAULT 'active',
    is_super_admin BOOLEAN DEFAULT FALSE,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_super_admin (is_super_admin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Virtual Airlines Table
CREATE TABLE IF NOT EXISTS virtual_airlines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    callsign VARCHAR(10) NOT NULL UNIQUE,
    icao_code VARCHAR(4) UNIQUE,
    iata_code VARCHAR(3) UNIQUE,
    owner_id INT NOT NULL,
    logo_url VARCHAR(255),
    description TEXT,
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'suspended', 'inactive') DEFAULT 'active',
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_owner (owner_id),
    INDEX idx_callsign (callsign)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- VA Members (User-VA relationship with roles and points)
CREATE TABLE IF NOT EXISTS va_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    va_id INT NOT NULL,
    role ENUM('Owner', 'Admin', 'Pilot', 'Member') DEFAULT 'Member',
    points INT DEFAULT 0,
    total_flights INT DEFAULT 0,
    total_hours DECIMAL(10, 2) DEFAULT 0.00,
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'suspended', 'left') DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (va_id) REFERENCES virtual_airlines(id) ON DELETE CASCADE,
    UNIQUE KEY unique_membership (user_id, va_id),
    INDEX idx_user (user_id),
    INDEX idx_va (va_id),
    INDEX idx_points (points DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Aircraft Database (from OpenFlights)
CREATE TABLE IF NOT EXISTS aircraft (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    iata_code VARCHAR(3),
    icao_code VARCHAR(4),
    INDEX idx_icao (icao_code),
    INDEX idx_iata (iata_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Airports Database (from OpenFlights)
CREATE TABLE IF NOT EXISTS airports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255),
    country VARCHAR(255),
    iata_code VARCHAR(3) UNIQUE,
    icao_code VARCHAR(4) UNIQUE,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    altitude INT,
    timezone_offset DECIMAL(4, 2),
    dst VARCHAR(1),
    timezone VARCHAR(100),
    INDEX idx_iata (iata_code),
    INDEX idx_icao (icao_code),
    INDEX idx_country (country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- VA Fleet
CREATE TABLE IF NOT EXISTS va_fleet (
    id INT AUTO_INCREMENT PRIMARY KEY,
    va_id INT NOT NULL,
    registration VARCHAR(20) NOT NULL,
    aircraft_type VARCHAR(50) NOT NULL,
    aircraft_name VARCHAR(255) NOT NULL,
    home_airport VARCHAR(4),
    status ENUM('active', 'maintenance', 'retired') DEFAULT 'active',
    total_flights INT DEFAULT 0,
    total_hours DECIMAL(10, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (va_id) REFERENCES virtual_airlines(id) ON DELETE CASCADE,
    UNIQUE KEY unique_registration (va_id, registration),
    INDEX idx_va (va_id),
    INDEX idx_status (status),
    INDEX idx_home_airport (home_airport)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- VA Routes
CREATE TABLE IF NOT EXISTS va_routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    va_id INT NOT NULL,
    flight_number VARCHAR(20) NOT NULL,
    route_type ENUM('Civil', 'Cargo', 'Private') DEFAULT 'Civil',
    departure_icao VARCHAR(4),
    departure_name VARCHAR(255),
    arrival_icao VARCHAR(4),
    arrival_name VARCHAR(255),
    aircraft_type VARCHAR(50),
    status ENUM('active', 'inactive', 'seasonal') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (va_id) REFERENCES virtual_airlines(id) ON DELETE CASCADE,
    UNIQUE KEY unique_flight (va_id, flight_number),
    INDEX idx_va (va_id),
    INDEX idx_route_type (route_type),
    INDEX idx_departure_icao (departure_icao),
    INDEX idx_arrival_icao (arrival_icao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Flights
CREATE TABLE IF NOT EXISTS flights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    va_id INT NOT NULL,
    route_id INT NOT NULL,
    fleet_id INT,
    flight_number VARCHAR(20),
    status ENUM('reserved', 'in_progress', 'completed', 'cancelled') DEFAULT 'reserved',
    departure_time TIMESTAMP NULL,
    arrival_time TIMESTAMP NULL,
    reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    simbrief_ofp_id VARCHAR(50) NULL COMMENT 'SimBrief OFP ID for flight plan',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (va_id) REFERENCES virtual_airlines(id) ON DELETE CASCADE,
    FOREIGN KEY (route_id) REFERENCES va_routes(id) ON DELETE RESTRICT,
    FOREIGN KEY (fleet_id) REFERENCES va_fleet(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_va (va_id),
    INDEX idx_status (status),
    INDEX idx_departure_time (departure_time),
    INDEX idx_simbrief (simbrief_ofp_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Flight Reports (Telemetry and Validation)
CREATE TABLE IF NOT EXISTS flight_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flight_id INT NOT NULL UNIQUE,
    validation_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    admin_id INT NULL,
    admin_notes TEXT,
    
    -- Flight Data
    actual_departure_time TIMESTAMP NULL,
    actual_arrival_time TIMESTAMP NULL,
    flight_duration INT COMMENT 'Duration in minutes',
    distance_flown DECIMAL(10, 2),
    fuel_used DECIMAL(10, 2),
    landing_rate DECIMAL(6, 2) COMMENT 'Landing rate in fpm',
    
    -- Telemetry JSON
    telemetry_data JSON COMMENT 'Full flight telemetry data',
    
    -- Points awarded
    points_awarded INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validated_at TIMESTAMP NULL,
    
    FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_flight (flight_id),
    INDEX idx_status (validation_status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Events (Focus Airports, Challenges, etc.)
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    va_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_type ENUM('focus_airport', 'route_challenge', 'special_event', 'competition') DEFAULT 'special_event',
    cover_image VARCHAR(255),
    focus_airport_id INT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    bonus_points INT DEFAULT 0,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('upcoming', 'active', 'completed', 'cancelled') DEFAULT 'upcoming',
    FOREIGN KEY (va_id) REFERENCES virtual_airlines(id) ON DELETE CASCADE,
    FOREIGN KEY (focus_airport_id) REFERENCES airports(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_va (va_id),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Downloads (Liveries, Tracker Software, etc.)
CREATE TABLE IF NOT EXISTS downloads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    va_id INT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_type ENUM('livery', 'tracker', 'document', 'other') DEFAULT 'other',
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    file_size INT,
    download_count INT DEFAULT 0,
    aircraft_id INT NULL COMMENT 'For liveries',
    uploaded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'archived') DEFAULT 'active',
    FOREIGN KEY (va_id) REFERENCES virtual_airlines(id) ON DELETE CASCADE,
    FOREIGN KEY (aircraft_id) REFERENCES aircraft(id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_va (va_id),
    INDEX idx_type (file_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    criteria JSON COMMENT 'Achievement criteria as JSON',
    points INT DEFAULT 0,
    badge_color VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    va_id INT NULL COMMENT 'VA-specific achievement',
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    FOREIGN KEY (va_id) REFERENCES virtual_airlines(id) ON DELETE CASCADE,
    UNIQUE KEY unique_achievement (user_id, achievement_id, va_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user (user_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- STORED PROCEDURES AND EVENTS
-- ========================================

-- Procedure to automatically update event statuses based on dates
DELIMITER $$

DROP PROCEDURE IF EXISTS update_event_statuses$$

CREATE PROCEDURE update_event_statuses()
BEGIN
    -- Set status to 'active' for events that should be active now
    UPDATE events 
    SET status = 'active'
    WHERE start_date <= NOW() 
      AND end_date >= NOW()
      AND status = 'upcoming';
    
    -- Set status to 'completed' for events that have ended
    UPDATE events 
    SET status = 'completed'
    WHERE end_date < NOW()
      AND status IN ('active', 'upcoming');
END$$

DELIMITER ;

-- Enable event scheduler
SET GLOBAL event_scheduler = ON;

-- Schedule the procedure to run every minute
DROP EVENT IF EXISTS auto_update_event_statuses;

CREATE EVENT auto_update_event_statuses
ON SCHEDULE EVERY 1 MINUTE
DO
  CALL update_event_statuses();
