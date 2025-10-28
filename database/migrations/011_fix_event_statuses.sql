-- Migration 011: Fix truncated event statuses
-- Date: 2025-10-28
-- Description: Fix events with truncated status 'upcomin' to 'upcoming'

-- Fix truncated statuses
UPDATE events 
SET status = 'upcoming' 
WHERE status = 'upcomin';

-- Update event statuses based on current date/time
UPDATE events 
SET status = CASE
  WHEN end_date < NOW() AND status != 'cancelled' THEN 'completed'
  WHEN start_date <= NOW() AND end_date >= NOW() AND status != 'cancelled' THEN 'active'
  WHEN start_date > NOW() AND status != 'cancelled' THEN 'upcoming'
  ELSE status
END;

-- Verify results
SELECT id, name, start_date, end_date, status 
FROM events 
ORDER BY start_date DESC;
