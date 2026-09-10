import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

export const protectAdmin = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dr_vinish_admin_jwt_secret_key_2026_secure');

      const admin = await Admin.findById(decoded.id).select('-password');

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Account not found'
        });
      }

      const normalizedRole = (admin.role === 'Administrator' || admin.role === 'admin') ? 'admin' : 'doctor';
      admin.role = normalizedRole;

      req.admin = admin;
      req.user = admin;

      next();
    } catch (error) {
      console.error('JWT Auth Error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed or expired'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role || req.admin?.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Role (${userRole}) is not authorized to access this route`
      });
    }
    next();
  };
};

