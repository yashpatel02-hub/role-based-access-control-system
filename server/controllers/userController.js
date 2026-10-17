const User = require('../models/User');
const Role = require('../models/Role');
const ProjectMember = require('../models/ProjectMember');
const { logAudit } = require('../services/auditService');

// @desc    Get all users with search, role/status filter, and pagination
// @route   GET /api/users
// @access  Private (users.view)
const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { search, role, status } = req.query;

    const query = {};

    // Search filter
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }, { username: searchRegex }];
    }

    // Status filter
    if (status && ['active', 'inactive'].includes(status)) {
      query.status = status;
    }

    // Role filter
    if (role && role !== 'all') {
      const targetRole = await Role.findOne({
        $or: [{ name: role }, { _id: role.match(/^[0-9a-fA-F]{24}$/) ? role : null }],
      });
      if (targetRole) {
        query.roles = targetRole._id;
      }
    }

    const totalItems = await User.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit) || 1;

    const users = await User.find(query)
      .populate('roles', 'name description isSystem')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private (users.view)
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('roles', 'name description permissions isSystem');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get user's project memberships
    const memberships = await ProjectMember.find({ user: user._id })
      .populate('project', 'name status')
      .populate('role', 'name');

    return res.status(200).json({
      success: true,
      data: {
        ...user.toJSON(),
        memberships,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new user
// @route   POST /api/users
// @access  Private (users.create)
const createUser = async (req, res, next) => {
  try {
    const { name, email, username, password, roles, status, about } = req.body;

    if (!name || !email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, username, and password',
      });
    }

    // Check duplicate
    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: existing.email.toLowerCase() === email.toLowerCase() ? 'Email already in use' : 'Username already in use',
      });
    }

    // Check role assignment security: only Super Admin can assign Super Admin role
    let assignedRoleIds = [];
    if (roles && Array.isArray(roles) && roles.length > 0) {
      const foundRoles = await Role.find({ _id: { $in: roles } });
      const hasSuperAdminRole = foundRoles.some((r) => r.name === 'Super Admin');

      if (hasSuperAdminRole && !req.isSuperAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only Super Administrators can assign the Super Admin role',
        });
      }
      assignedRoleIds = foundRoles.map((r) => r._id);
    } else {
      const defaultRole = await Role.findOne({ name: 'Viewer' });
      if (defaultRole) assignedRoleIds.push(defaultRole._id);
    }

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      username: username.toLowerCase().trim(),
      password,
      roles: assignedRoleIds,
      status: status || 'active',
      about: about || '',
    });

    await logAudit({
      req,
      user: req.user._id,
      action: 'USER_CREATED',
      targetType: 'User',
      targetId: newUser._id,
      description: `Created new user ${newUser.email} with ${assignedRoleIds.length} role(s)`,
    });

    const populatedUser = await User.findById(newUser._id).populate('roles', 'name description');

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: populatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private (users.edit)
const updateUser = async (req, res, next) => {
  try {
    const userToUpdate = await User.findById(req.params.id).populate('roles');

    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const targetIsSuperAdmin = userToUpdate.roles.some((r) => r.name === 'Super Admin');

    // Admin cannot modify Super Admin unless user is Super Admin
    if (targetIsSuperAdmin && !req.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify a Super Administrator account',
      });
    }

    const { name, email, username, about, roles, status, password } = req.body;

    if (name) userToUpdate.name = name.trim();
    if (about !== undefined) userToUpdate.about = about.trim();

    if (email && email.toLowerCase() !== userToUpdate.email) {
      const duplicateEmail = await User.findOne({ email: email.toLowerCase() });
      if (duplicateEmail) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
      userToUpdate.email = email.toLowerCase().trim();
    }

    if (username && username.toLowerCase() !== userToUpdate.username) {
      const duplicateUsername = await User.findOne({ username: username.toLowerCase() });
      if (duplicateUsername) {
        return res.status(400).json({ success: false, message: 'Username already in use' });
      }
      userToUpdate.username = username.toLowerCase().trim();
    }

    if (password && password.trim().length >= 6) {
      userToUpdate.password = password.trim();
    }

    if (status && ['active', 'inactive'].includes(status)) {
      // Prevent deactivating own account
      if (userToUpdate._id.toString() === req.user._id.toString() && status === 'inactive') {
        return res.status(400).json({
          success: false,
          message: 'You cannot deactivate your own account',
        });
      }
      userToUpdate.status = status;
    }

    if (roles && Array.isArray(roles)) {
      const foundRoles = await Role.find({ _id: { $in: roles } });
      const willHaveSuperAdmin = foundRoles.some((r) => r.name === 'Super Admin');

      if (willHaveSuperAdmin && !req.isSuperAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only Super Administrators can grant Super Admin role',
        });
      }
      userToUpdate.roles = foundRoles.map((r) => r._id);
    }

    await userToUpdate.save();

    await logAudit({
      req,
      user: req.user._id,
      action: 'USER_UPDATED',
      targetType: 'User',
      targetId: userToUpdate._id,
      description: `Updated details for user ${userToUpdate.email}`,
    });

    const updatedUser = await User.findById(userToUpdate._id).populate('roles', 'name description');

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (users.delete)
const deleteUser = async (req, res, next) => {
  try {
    const userToDelete = await User.findById(req.params.id).populate('roles');

    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Cannot delete yourself
    if (userToDelete._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    const isTargetSuperAdmin = userToDelete.roles.some((r) => r.name === 'Super Admin');

    // Nobody can delete Super Admin except if another Super Admin, but best practice: protect primary Super Admin!
    if (isTargetSuperAdmin) {
      if (!req.isSuperAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Admins cannot delete Super Administrators',
        });
      }
      // Check if this is the last Super Admin
      const superAdminRole = await Role.findOne({ name: 'Super Admin' });
      const superAdminCount = await User.countDocuments({
        roles: superAdminRole._id,
      });
      if (superAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the only Super Administrator in the system',
        });
      }
    }

    // Clean up project memberships for this user
    await ProjectMember.deleteMany({ user: userToDelete._id });
    await User.findByIdAndDelete(userToDelete._id);

    await logAudit({
      req,
      user: req.user._id,
      action: 'USER_DELETED',
      targetType: 'User',
      targetId: userToDelete._id,
      description: `Deleted user ${userToDelete.name} (${userToDelete.email})`,
    });

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change user status (active / inactive)
// @route   PATCH /api/users/:id/status
// @access  Private (users.status)
const changeUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be active or inactive',
      });
    }

    const userToUpdate = await User.findById(req.params.id).populate('roles');
    if (!userToUpdate) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (userToUpdate._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot change your own active status' });
    }

    const isTargetSuperAdmin = userToUpdate.roles.some((r) => r.name === 'Super Admin');
    if (isTargetSuperAdmin && !req.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You cannot change the status of a Super Administrator',
      });
    }

    userToUpdate.status = status;
    await userToUpdate.save();

    await logAudit({
      req,
      user: req.user._id,
      action: status === 'active' ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      targetType: 'User',
      targetId: userToUpdate._id,
      description: `Changed status of ${userToUpdate.email} to ${status}`,
    });

    return res.status(200).json({
      success: true,
      message: `User status updated to ${status}`,
      status: userToUpdate.status,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user roles
// @route   PATCH /api/users/:id/roles
// @access  Private (roles.edit)
const updateUserRoles = async (req, res, next) => {
  try {
    const { roles } = req.body;
    if (!Array.isArray(roles)) {
      return res.status(400).json({ success: false, message: 'Roles must be an array of role IDs' });
    }

    const targetUser = await User.findById(req.params.id).populate('roles');
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const foundRoles = await Role.find({ _id: { $in: roles } });
    const hasSuperAdmin = foundRoles.some((r) => r.name === 'Super Admin');

    if (hasSuperAdmin && !req.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only Super Administrators can assign the Super Admin role',
      });
    }

    targetUser.roles = foundRoles.map((r) => r._id);
    await targetUser.save();

    await logAudit({
      req,
      user: req.user._id,
      action: 'ROLE_CHANGED',
      targetType: 'User',
      targetId: targetUser._id,
      description: `Updated roles for ${targetUser.email} to [${foundRoles.map((r) => r.name).join(', ')}]`,
    });

    const updated = await User.findById(targetUser._id).populate('roles', 'name description');

    return res.status(200).json({
      success: true,
      message: 'Roles updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changeUserStatus,
  updateUserRoles,
};
