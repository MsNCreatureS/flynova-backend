const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const checkVARole = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const { vaId } = req.params;
      const userId = req.user.id;
      
      const db = require('../config/database');
      const [members] = await db.query(
        'SELECT role FROM va_members WHERE user_id = ? AND va_id = ? AND status = "active"',
        [userId, vaId]
      );

      if (members.length === 0) {
        return res.status(403).json({ error: 'Not a member of this Virtual Airline' });
      }

      const userRole = members[0].role;
      
      // Case-insensitive role comparison
      if (allowedRoles.length > 0 && !allowedRoles.some(role => role.toLowerCase() === userRole.toLowerCase())) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.vaRole = userRole;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

// Super Admin middleware
const checkSuperAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const db = require('../config/database');
    
    const [users] = await db.query(
      'SELECT is_super_admin FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0 || !users[0].is_super_admin) {
      return res.status(403).json({ error: 'Super Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Super Admin check error:', error);
    return res.status(500).json({ error: 'Permission check failed' });
  }
};

module.exports = { authMiddleware, checkVARole, checkSuperAdmin };
