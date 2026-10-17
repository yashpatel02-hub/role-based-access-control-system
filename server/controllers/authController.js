const User = require('../models/User');
const Role = require('../models/Role');
const { logAudit } = require('../services/auditService');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, username, password } = req.body;

    if (!name || !email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, username, password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check duplicate email or username
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (existingUser) {
      const field = existingUser.email.toLowerCase() === email.toLowerCase() ? 'Email' : 'Username';
      return res.status(400).json({
        success: false,
        message: `${field} is already in use`,
      });
    }

    // Assign default role: 'Viewer'
    const defaultRole = await Role.findOne({ name: 'Viewer' });
    const roles = defaultRole ? [defaultRole._id] : [];

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password,
      roles,
      status: 'active',
    });

    // Automatically set session
    req.session.userId = user._id;

    await logAudit({
      req,
      user: user._id,
      action: 'USER_CREATED',
      targetType: 'User',
      targetId: user._id,
      description: `New user self-registered: ${user.email}`,
    });

    await logAudit({
      req,
      user: user._id,
      action: 'LOGIN',
      targetType: 'Auth',
      targetId: user._id,
      description: `User logged in upon registration: ${user.email}`,
    });

    const populatedUser = await User.findById(user._id).populate({
      path: 'roles',
      populate: { path: 'permissions' },
    });

    const roleNames = populatedUser.roles.map((r) => r.name);
    const permissionNames = new Set();
    populatedUser.roles.forEach((r) => {
      if (r.permissions) {
        r.permissions.forEach((p) => permissionNames.add(p.name));
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        _id: populatedUser._id,
        name: populatedUser.name,
        email: populatedUser.email,
        username: populatedUser.username,
        profileImage: populatedUser.profileImage,
        about: populatedUser.about,
        status: populatedUser.status,
        roles: roleNames,
        permissions: Array.from(permissionNames),
        isSuperAdmin: roleNames.includes('Super Admin'),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log in an existing user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate({
        path: 'roles',
        populate: { path: 'permissions' },
      });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact an administrator.',
      });
    }

    // Set session
    req.session.userId = user._id;

    await logAudit({
      req,
      user: user._id,
      action: 'LOGIN',
      targetType: 'Auth',
      targetId: user._id,
      description: `User successfully logged in: ${user.email}`,
    });

    const roleNames = user.roles.map((r) => r.name);
    const permissionNames = new Set();
    user.roles.forEach((r) => {
      if (r.permissions) {
        r.permissions.forEach((p) => permissionNames.add(p.name));
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        profileImage: user.profileImage,
        about: user.about,
        status: user.status,
        roles: roleNames,
        permissions: Array.from(permissionNames),
        isSuperAdmin: roleNames.includes('Super Admin'),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log out current user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    const userId = req.session ? req.session.userId : null;

    if (userId) {
      await logAudit({
        req,
        user: userId,
        action: 'LOGOUT',
        targetType: 'Auth',
        targetId: userId,
        description: 'User logged out',
      });
    }

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Could not log out, please try again.',
        });
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile & permissions
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        profileImage: user.profileImage,
        about: user.about,
        status: user.status,
        createdAt: user.createdAt,
        roles: req.userRoles,
        permissions: req.userPermissions,
        isSuperAdmin: req.isSuperAdmin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile info
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, about } = req.body;
    const user = req.user;

    if (name) user.name = name.trim();
    if (about !== undefined) user.about = about.trim();

    await user.save();

    await logAudit({
      req,
      user: user._id,
      action: 'USER_UPDATED',
      targetType: 'User',
      targetId: user._id,
      description: `User updated profile information: ${user.name}`,
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        profileImage: user.profileImage,
        about: user.about,
        status: user.status,
        roles: req.userRoles,
        permissions: req.userPermissions,
        isSuperAdmin: req.isSuperAdmin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new passwords',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match records',
      });
    }

    user.password = newPassword;
    await user.save();

    await logAudit({
      req,
      user: user._id,
      action: 'USER_UPDATED',
      targetType: 'User',
      targetId: user._id,
      description: `User successfully changed their password`,
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload profile avatar
// @route   POST /api/auth/avatar
// @access  Private
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select an image file to upload',
      });
    }

    const user = req.user;
    // Remove old image file if it was a local upload
    if (user.profileImage && user.profileImage.startsWith('/uploads/profiles/')) {
      const oldPath = path.join(__dirname, '..', user.profileImage);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          console.warn('Could not remove old profile image:', e.message);
        }
      }
    }

    const imagePath = `/uploads/profiles/${req.file.filename}`;
    user.profileImage = imagePath;
    await user.save();

    await logAudit({
      req,
      user: user._id,
      action: 'USER_UPDATED',
      targetType: 'User',
      targetId: user._id,
      description: 'User updated profile avatar image',
    });

    return res.status(200).json({
      success: true,
      message: 'Profile image updated successfully',
      profileImage: imagePath,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  uploadAvatar,
};
