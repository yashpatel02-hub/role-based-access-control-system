const Permission = require('../models/Permission');
const Role = require('../models/Role');
const { logAudit } = require('../services/auditService');

// @desc    Get all permissions, optionally grouped by module
// @route   GET /api/permissions
// @access  Private (permissions.view)
const getPermissions = async (req, res, next) => {
  try {
    const permissions = await Permission.find().sort({ module: 1, name: 1 });

    // Also build a grouped structure for clean UI display
    const grouped = permissions.reduce((acc, perm) => {
      const mod = perm.module;
      if (!acc[mod]) {
        acc[mod] = [];
      }
      acc[mod].push(perm);
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: permissions,
      grouped,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new permission
// @route   POST /api/permissions
// @access  Private (permissions.manage)
const createPermission = async (req, res, next) => {
  try {
    const { name, description, module: permModule, action } = req.body;

    if (!name || !permModule || !action) {
      return res.status(400).json({
        success: false,
        message: 'Name, module, and action are required',
      });
    }

    const existing = await Permission.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A permission with this identifier already exists',
      });
    }

    const permission = await Permission.create({
      name: name.trim(),
      description: description || '',
      module: permModule.toLowerCase().trim(),
      action: action.toLowerCase().trim(),
    });

    // Auto-add to Super Admin role
    const superAdminRole = await Role.findOne({ name: 'Super Admin' });
    if (superAdminRole && !superAdminRole.permissions.includes(permission._id)) {
      superAdminRole.permissions.push(permission._id);
      await superAdminRole.save();
    }

    await logAudit({
      req,
      user: req.user._id,
      action: 'PERMISSION_UPDATED',
      targetType: 'Permission',
      targetId: permission._id,
      description: `Created permission: ${permission.name}`,
    });

    return res.status(201).json({
      success: true,
      message: 'Permission created successfully',
      data: permission,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a permission
// @route   PUT /api/permissions/:id
// @access  Private (permissions.manage)
const updatePermission = async (req, res, next) => {
  try {
    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({ success: false, message: 'Permission not found' });
    }

    const { description, module: permModule, action } = req.body;

    if (description !== undefined) permission.description = description.trim();
    if (permModule) permission.module = permModule.toLowerCase().trim();
    if (action) permission.action = action.toLowerCase().trim();

    await permission.save();

    await logAudit({
      req,
      user: req.user._id,
      action: 'PERMISSION_UPDATED',
      targetType: 'Permission',
      targetId: permission._id,
      description: `Updated permission: ${permission.name}`,
    });

    return res.status(200).json({
      success: true,
      message: 'Permission updated successfully',
      data: permission,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a permission
// @route   DELETE /api/permissions/:id
// @access  Private (permissions.manage)
const deletePermission = async (req, res, next) => {
  try {
    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({ success: false, message: 'Permission not found' });
    }

    // Remove from all roles first
    await Role.updateMany({ permissions: permission._id }, { $pull: { permissions: permission._id } });
    await Permission.findByIdAndDelete(permission._id);

    await logAudit({
      req,
      user: req.user._id,
      action: 'PERMISSION_UPDATED',
      targetType: 'Permission',
      targetId: permission._id,
      description: `Deleted permission: ${permission.name}`,
    });

    return res.status(200).json({
      success: true,
      message: 'Permission deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
};
