-- Migration: Add live flight tracking table
-- This table stores real-time position data for flights in progress
-- Data is automatically cleaned up when flight ends

CREATE TABLE IF NOT EXISTS `flight_live_tracking` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `flight_id` INT(11) NOT NULL,
  `user_id` INT(11) NOT NULL,
  `va_id` INT(11) NOT NULL,
  
  -- Current position
  `latitude` DECIMAL(10,6) NOT NULL,
  `longitude` DECIMAL(10,6) NOT NULL,
  `altitude` INT(11) NOT NULL COMMENT 'Altitude in feet',
  `heading` DECIMAL(5,2) DEFAULT NULL COMMENT 'Heading in degrees (0-360)',
  `ground_speed` DECIMAL(6,2) DEFAULT NULL COMMENT 'Ground speed in knots',
  `vertical_speed` DECIMAL(7,2) DEFAULT NULL COMMENT 'Vertical speed in feet per minute',
  
  -- Flight info (denormalized for performance)
  `flight_number` VARCHAR(20) DEFAULT NULL,
  `departure_icao` VARCHAR(4) DEFAULT NULL,
  `arrival_icao` VARCHAR(4) DEFAULT NULL,
  `aircraft_registration` VARCHAR(20) DEFAULT NULL,
  `aircraft_type` VARCHAR(50) DEFAULT NULL,
  
  -- Pilot info (denormalized for performance)
  `pilot_username` VARCHAR(100) DEFAULT NULL,
  `pilot_avatar_url` VARCHAR(255) DEFAULT NULL,
  
  -- VA info (denormalized for performance)
  `va_name` VARCHAR(255) DEFAULT NULL,
  `va_callsign` VARCHAR(10) DEFAULT NULL,
  `va_logo_url` VARCHAR(255) DEFAULT NULL,
  
  -- Timestamps
  `last_update` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `flight_started_at` TIMESTAMP NULL DEFAULT NULL,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_flight_tracking` (`flight_id`),
  KEY `idx_last_update` (`last_update`),
  KEY `idx_user` (`user_id`),
  KEY `idx_va` (`va_id`),
  KEY `idx_position` (`latitude`, `longitude`),
  
  CONSTRAINT `flight_live_tracking_ibfk_1` FOREIGN KEY (`flight_id`) REFERENCES `flights` (`id`) ON DELETE CASCADE,
  CONSTRAINT `flight_live_tracking_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `flight_live_tracking_ibfk_3` FOREIGN KEY (`va_id`) REFERENCES `virtual_airlines` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Real-time flight tracking data - auto-cleaned when flight ends';

-- Index for quickly finding stale tracking data (not updated in last 30 minutes)
CREATE INDEX `idx_stale_tracking` ON `flight_live_tracking` (`last_update`);

-- Event to automatically clean up stale tracking data (flights not updated in 30 minutes)
-- This runs every hour
DELIMITER $$
CREATE EVENT IF NOT EXISTS `cleanup_stale_tracking`
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
  DELETE FROM `flight_live_tracking`
  WHERE `last_update` < DATE_SUB(NOW(), INTERVAL 30 MINUTE);
END$$
DELIMITER ;

-- Event to clean up tracking data for completed/cancelled flights
-- This runs every 5 minutes
DELIMITER $$
CREATE EVENT IF NOT EXISTS `cleanup_completed_flight_tracking`
ON SCHEDULE EVERY 5 MINUTE
DO
BEGIN
  DELETE flt FROM `flight_live_tracking` flt
  INNER JOIN `flights` f ON flt.flight_id = f.id
  WHERE f.status IN ('completed', 'cancelled');
END$$
DELIMITER ;
