const User = require('../models/User');

// Middleware to ensure user is authenticated via session
const requireAuth = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const user = await User.findById(req.session.userId).populate({
      path: 'roles',
      populate: {
        path: 'permissions',
        model: 'Permission',
      },
    });

    if (!user) {
      req.session.destroy();
      return res.status(401).json({
        success: false,
        message: 'User account not found. Please log in again.',
      });
    }

    if (user.status !== 'active') {
      req.session.destroy();
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.',
      });
    }

    // Extract role names and permission names
    const roleNames = [];
    const permissionNames = new Set();
    let isSuperAdmin = false;

    if (user.roles && Array.isArray(user.roles)) {
      user.roles.forEach((r) => {
        if (r && r.name) {
          roleNames.push(r.name);
          if (r.name === 'Super Admin') {
            isSuperAdmin = true;
          }
          if (r.permissions && Array.isArray(r.permissions)) {
            r.permissions.forEach((p) => {
              if (p && p.name) {
                permissionNames.add(p.name);
              }
            });
          }
        }
      });
    }

    req.user = user;
    req.userRoles = roleNames;
    req.userPermissions = Array.from(permissionNames);
    req.isSuperAdmin = isSuperAdmin;

    next();
  } catch (error) {
    console.error('requireAuth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication check.',
    });
  }
};

// Middleware to check if user has one of the allowed roles
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (req.isSuperAdmin) {
      return next();
    }

    const hasRequiredRole = allowedRoles.some((role) => req.userRoles.includes(role));
    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        message: 'You do not have the required role to perform this action.',
      });
    }

    next();
  };
};

// Middleware to check if user has the specified permission
const requirePermission = (permissionName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    // Super Admin has all permissions
    if (req.isSuperAdmin) {
      return next();
    }

    if (!req.userPermissions.includes(permissionName)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Missing required permission [${permissionName}]`,
      });
    }

    next();
  };
};

module.exports = {
  requireAuth,
  requireRole,
  requirePermission,
};
