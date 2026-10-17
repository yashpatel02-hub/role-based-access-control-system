const Role = require('../models/Role');
const User = require('../models/User');
const Permission = require('../models/Permission');
const { logAudit } = require('../services/auditService');

// @desc    Get all roles with user count and populated permissions
// @route   GET /api/roles
// @access  Private (roles.view)
const getRoles = async (req, res, next) => {
  try {
    const roles = await Role.find().populate('permissions').sort({ isSystem: -1, createdAt: 1 });

    // Aggregate user counts per role
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const userCount = await User.countDocuments({ roles: role._id });
        return {
          ...role.toJSON(),
          userCount,
          permissionCount: role.permissions.length,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: rolesWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get role by ID
// @route   GET /api/roles/:id
// @access  Private (roles.view)
const getRoleById = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id).populate('permissions');
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    const userCount = await User.countDocuments({ roles: role._id });

    return res.status(200).json({
      success: true,
      data: {
        ...role.toJSON(),
        userCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new role
// @route   POST /api/roles
// @access  Private (roles.create)
const createRole = async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Role name is required' });
    }

    const existing = await Role.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A role with this name already exists' });
    }

    // Verify permission IDs
    let validPermissionIds = [];
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      const foundPerms = await Permission.find({ _id: { $in: permissions } });
      validPermissionIds = foundPerms.map((p) => p._id);
    }

    const newRole = await Role.create({
      name: name.trim(),
      description: description || '',
      permissions: validPermissionIds,
      isSystem: false,
    });

    await logAudit({
      req,
      user: req.user._id,
      action: 'ROLE_CREATED',
      targetType: 'Role',
      targetId: newRole._id,
      description: `Created new custom role: ${newRole.name} with ${validPermissionIds.length} permissions`,
    });

    const populatedRole = await Role.findById(newRole._id).populate('permissions');

    return res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: {
        ...populatedRole.toJSON(),
        userCount: 0,
        permissionCount: validPermissionIds.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a role
// @route   PUT /api/roles/:id
// @access  Private (roles.edit)
const updateRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    const { name, description, permissions } = req.body;

    // Super Admin role protection
    if (role.name === 'Super Admin') {
      if (!req.isSuperAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only Super Administrators can edit the Super Admin role',
        });
      }
      // Super Admin name cannot be changed
      if (name && name.trim() !== 'Super Admin') {
        return res.status(400).json({
          success: false,
          message: 'Cannot rename the Super Admin system role',
        });
      }
    } else {
      if (name && name.trim() !== role.name) {
        const existing = await Role.findOne({ name: name.trim() });
        if (existing) {
          return res.status(400).json({ success: false, message: 'Another role with this name already exists' });
        }
        role.name = name.trim();
      }
    }

    if (description !== undefined) role.description = description.trim();

    if (permissions && Array.isArray(permissions)) {
      const foundPerms = await Permission.find({ _id: { $in: permissions } });
      role.permissions = foundPerms.map((p) => p._id);
    }

    await role.save();

    await logAudit({
      req,
      user: req.user._id,
      action: 'ROLE_UPDATED',
      targetType: 'Role',
      targetId: role._id,
      description: `Updated role: ${role.name}`,
    });

    const updatedRole = await Role.findById(role._id).populate('permissions');
    const userCount = await User.countDocuments({ roles: role._id });

    return res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: {
        ...updatedRole.toJSON(),
        userCount,
        permissionCount: updatedRole.permissions.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a role
// @route   DELETE /api/roles/:id
// @access  Private (roles.delete)
const deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (role.isSystem) {
      return res.status(400).json({
        success: false,
        message: 'Default system roles cannot be deleted',
      });
    }

    // Check if any users are assigned to this role
    const assignedUsers = await User.countDocuments({ roles: role._id });
    if (assignedUsers > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role. It is currently assigned to ${assignedUsers} user(s). Reassign them first.`,
      });
    }

    await Role.findByIdAndDelete(role._id);

    await logAudit({
      req,
      user: req.user._id,
      action: 'ROLE_DELETED',
      targetType: 'Role',
      targetId: role._id,
      description: `Deleted custom role: ${role.name}`,
    });

    return res.status(200).json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};
