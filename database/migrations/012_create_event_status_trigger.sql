-- Migration 012: Create trigger to auto-update event status
-- Date: 2025-10-28
-- Description: Automatically set event status based on dates when inserting or updating

DELIMITER $$

-- Stored Procedure to update all event statuses
DROP PROCEDURE IF EXISTS update_all_event_statuses$$
CREATE PROCEDURE update_all_event_statuses()
BEGIN
    UPDATE events 
    SET status = CASE
        WHEN end_date < NOW() AND status != 'cancelled' THEN 'completed'
        WHEN start_date <= NOW() AND end_date >= NOW() AND status != 'cancelled' THEN 'active'
        WHEN start_date > NOW() AND status != 'cancelled' THEN 'upcoming'
        ELSE status
    END
    WHERE status != 'cancelled';
END$$

-- Trigger BEFORE INSERT
DROP TRIGGER IF EXISTS event_status_before_insert$$
CREATE TRIGGER event_status_before_insert
BEFORE INSERT ON events
FOR EACH ROW
BEGIN
    -- Only update if status is not 'cancelled'
    IF NEW.status != 'cancelled' THEN
        IF NEW.end_date < NOW() THEN
            SET NEW.status = 'completed';
        ELSEIF NEW.start_date <= NOW() AND NEW.end_date >= NOW() THEN
            SET NEW.status = 'active';
        ELSE
            SET NEW.status = 'upcoming';
        END IF;
    END IF;
END$$

-- Trigger BEFORE UPDATE
DROP TRIGGER IF EXISTS event_status_before_update$$
CREATE TRIGGER event_status_before_update
BEFORE UPDATE ON events
FOR EACH ROW
BEGIN
    -- Only update if status is not being set to 'cancelled' and was not already 'cancelled'
    IF NEW.status != 'cancelled' AND OLD.status != 'cancelled' THEN
        IF NEW.end_date < NOW() THEN
            SET NEW.status = 'completed';
        ELSEIF NEW.start_date <= NOW() AND NEW.end_date >= NOW() THEN
            SET NEW.status = 'active';
        ELSE
            SET NEW.status = 'upcoming';
        END IF;
    END IF;
END$$

DELIMITER ;

-- Update existing events to have correct status
CALL update_all_event_statuses();

-- Verify triggers and procedure were created
SHOW TRIGGERS LIKE 'events';
SHOW PROCEDURE STATUS WHERE Db = DATABASE() AND Name = 'update_all_event_statuses';

