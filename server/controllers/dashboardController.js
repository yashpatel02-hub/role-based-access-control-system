const User = require('../models/User');
const Project = require('../models/Project');
const Role = require('../models/Role');
const ProjectMember = require('../models/ProjectMember');
const AuditLog = require('../models/AuditLog');

// @desc    Get dashboard statistics, counts, and recent activities
// @route   GET /api/dashboard/stats
// @access  Private (dashboard.view)
const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const inactiveUsers = await User.countDocuments({ status: 'inactive' });
    const totalProjects = await Project.countDocuments();
    const activeProjects = await Project.countDocuments({ status: 'active' });
    const totalRoles = await Role.countDocuments();
    const totalMemberships = await ProjectMember.countDocuments();

    // Expiring soon count (< 7 days)
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringSoonCount = await ProjectMember.countDocuments({
      accessExpiresAt: { $gt: now, $lte: in7Days },
    });
    const expiredCount = await ProjectMember.countDocuments({
      accessExpiresAt: { $lte: now },
    });

    // Recent 5 users
    const recentUsers = await User.find()
      .populate('roles', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent 5 projects
    const recentProjects = await Project.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent 8 audit activities
    const recentActivities = await AuditLog.find()
      .populate('user', 'name email username profileImage')
      .sort({ createdAt: -1 })
      .limit(8);

    // Role distribution
    const roles = await Role.find();
    const roleDistribution = await Promise.all(
      roles.map(async (role) => {
        const count = await User.countDocuments({ roles: role._id });
        return {
          roleId: role._id,
          name: role.name,
          userCount: count,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        counts: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          totalProjects,
          activeProjects,
          totalRoles,
          totalMemberships,
          expiringSoonCount,
          expiredCount,
        },
        recentUsers,
        recentProjects,
        recentActivities,
        roleDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
