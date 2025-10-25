-- Quick test queries for Super Admin system

-- 1. Check if migration was applied
SELECT 
    COLUMN_NAME, 
    COLUMN_TYPE, 
    COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'is_super_admin';

-- 2. List all super admins
SELECT 
    id,
    username,
    email,
    is_super_admin,
    status,
    created_at
FROM users 
WHERE is_super_admin = TRUE;

-- 3. Count users by type
SELECT 
    CASE 
        WHEN is_super_admin = TRUE THEN 'Super Admin'
        ELSE 'Regular User'
    END as user_type,
    COUNT(*) as count
FROM users
GROUP BY is_super_admin;

-- 4. Manually set a user as super admin (replace email)
-- UPDATE users 
-- SET is_super_admin = TRUE 
-- WHERE email = 'your.email@example.com';

-- 5. Remove super admin privileges (replace email)
-- UPDATE users 
-- SET is_super_admin = FALSE 
-- WHERE email = 'your.email@example.com';

-- 6. Get platform statistics (same as dashboard)
SELECT 
    (SELECT COUNT(*) FROM virtual_airlines) as total_vas,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM flights) as total_flights,
    (SELECT COUNT(*) FROM flights WHERE status = 'completed') as completed_flights,
    (SELECT COUNT(DISTINCT va_id) FROM va_members WHERE status = 'active') as active_vas,
    (SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as recent_users;

-- 7. List VAs with owner information
SELECT 
    va.id,
    va.name,
    va.callsign,
    va.status,
    u.username as owner_username,
    u.email as owner_email,
    COUNT(DISTINCT vm.user_id) as member_count
FROM virtual_airlines va
LEFT JOIN users u ON va.owner_id = u.id
LEFT JOIN va_members vm ON va.id = vm.va_id AND vm.status = 'active'
GROUP BY va.id
ORDER BY va.created_at DESC;

-- 8. List users with their VAs count
SELECT 
    u.id,
    u.username,
    u.email,
    u.status,
    u.is_super_admin,
    COUNT(DISTINCT vm.va_id) as va_count,
    COUNT(DISTINCT f.id) as flight_count
FROM users u
LEFT JOIN va_members vm ON u.id = vm.user_id AND vm.status = 'active'
LEFT JOIN flights f ON u.id = f.user_id
GROUP BY u.id
ORDER BY u.created_at DESC;

-- 9. Check for users who cannot be deleted (VA owners)
SELECT 
    u.id,
    u.username,
    u.email,
    COUNT(va.id) as owned_vas
FROM users u
LEFT JOIN virtual_airlines va ON u.id = va.owner_id
GROUP BY u.id
HAVING owned_vas > 0;

-- 10. Recent activities (last 20)
(SELECT 
    'VA Created' as activity_type,
    va.name as entity_name,
    u.username,
    va.created_at as timestamp
FROM virtual_airlines va
JOIN users u ON va.owner_id = u.id
ORDER BY va.created_at DESC
LIMIT 10)

UNION ALL

(SELECT 
    'User Registered' as activity_type,
    u.username as entity_name,
    u.username,
    u.created_at as timestamp
FROM users u
ORDER BY u.created_at DESC
LIMIT 10)

ORDER BY timestamp DESC
LIMIT 20;
