const ProjectMember = require('../models/ProjectMember');
const Project = require('../models/Project');
const User = require('../models/User');
const Role = require('../models/Role');
const { logAudit } = require('../services/auditService');

// Helper to format relative expiration label
const getRelativeExpiration = (date) => {
  if (!date) return 'No expiration';
  const now = new Date();
  const diffMs = new Date(date).getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Expired';
  if (diffDays === 0) return 'Expires today';
  if (diffDays === 1) return 'In 1 day';
  if (diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays <= 30) return `In ${Math.ceil(diffDays / 7)} weeks`;
  if (diffDays <= 365) return `In ${Math.ceil(diffDays / 30)} months`;
  return `In ${Math.round(diffDays / 365)} years`;
};

// @desc    Get members of a specific project OR across all projects
// @route   GET /api/projects/:id/members OR GET /api/members
// @access  Private (members.view)
const getMembers = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.query.project;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { search, role, status, tab, sort } = req.query;

    const matchQuery = {};

    if (projectId && projectId !== 'all') {
      matchQuery.project = projectId;
    }

    // Role filter
    if (role && role !== 'all') {
      const foundRole = await Role.findOne({
        $or: [{ name: role }, { _id: role.match(/^[0-9a-fA-F]{24}$/) ? role : null }],
      });
      if (foundRole) {
        matchQuery.role = foundRole._id;
      }
    }

    // Status filter based on accessExpiresAt
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (status === 'active') {
      matchQuery.$or = [{ accessExpiresAt: null }, { accessExpiresAt: { $gt: now } }];
    } else if (status === 'expiring') {
      matchQuery.accessExpiresAt = { $gt: now, $lte: in7Days };
    } else if (status === 'expired') {
      matchQuery.accessExpiresAt = { $lte: now };
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'account') {
      sortOption = { 'user.name': 1 };
    } else if (sort === 'expiration') {
      sortOption = { accessExpiresAt: 1 };
    } else if (sort === 'newest') {
      sortOption = { joinedAt: -1 };
    }

    // Find and populate
    let query = ProjectMember.find(matchQuery)
      .populate('user', 'name email username profileImage status')
      .populate('role', 'name description')
      .populate('project', 'name status');

    let members = await query.exec();

    // In-memory / regex search on populated user fields
    if (search && search.trim() !== '') {
      const s = search.toLowerCase().trim();
      members = members.filter(
        (m) =>
          (m.user && m.user.name && m.user.name.toLowerCase().includes(s)) ||
          (m.user && m.user.username && m.user.username.toLowerCase().includes(s)) ||
          (m.user && m.user.email && m.user.email.toLowerCase().includes(s))
      );
    }

    // Tab filter: 'Members' vs 'Groups'
    if (tab === 'groups') {
      members = members.filter((m) => m.user && m.user.name && m.user.name.toLowerCase().includes('group'));
    } else if (tab === 'members') {
      members = members.filter((m) => !(m.user && m.user.name && m.user.name.toLowerCase().includes('group')));
    }

    // Sort if requested by user name
    if (sort === 'account') {
      members.sort((a, b) => (a.user?.name || '').localeCompare(b.user?.name || ''));
    } else if (sort === 'expiration') {
      members.sort((a, b) => {
        if (!a.accessExpiresAt) return 1;
        if (!b.accessExpiresAt) return -1;
        return new Date(a.accessExpiresAt) - new Date(b.accessExpiresAt);
      });
    }

    const totalItems = members.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const paginatedMembers = members.slice(skip, skip + limit);

    // Compute additional UI metrics for each member: total projects count & relative expiry label
    const enrichedMembers = await Promise.all(
      paginatedMembers.map(async (m) => {
        const userId = m.user?._id;
        const userProjectCount = userId ? await ProjectMember.countDocuments({ user: userId }) : 1;
        const isExpired = m.accessExpiresAt ? new Date(m.accessExpiresAt) < now : false;
        const isExpiringSoon =
          m.accessExpiresAt && !isExpired ? new Date(m.accessExpiresAt) <= in7Days : false;

        return {
          ...m.toJSON(),
          userProjectCount,
          isExpired,
          isExpiringSoon,
          relativeExpiration: getRelativeExpiration(m.accessExpiresAt),
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: enrichedMembers,
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

// @desc    Add a member to a project
// @route   POST /api/projects/:id/members
// @access  Private (members.add)
const addMember = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.body.projectId;
    const { userId, roleId, accessExpiresAt } = req.body;

    if (!projectId || !userId || !roleId) {
      return res.status(400).json({
        success: false,
        message: 'Project, user, and role are required',
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const targetRole = await Role.findById(roleId);
    if (!targetRole) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    // Role escalation check: Only Super Admin can assign Super Admin role
    if (targetRole.name === 'Super Admin' && !req.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only Super Administrators can assign the Super Admin role',
      });
    }

    const existingMember = await ProjectMember.findOne({
      project: projectId,
      user: userId,
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project',
      });
    }

    const member = await ProjectMember.create({
      project: projectId,
      user: userId,
      role: roleId,
      accessExpiresAt: accessExpiresAt ? new Date(accessExpiresAt) : null,
      joinedAt: new Date(),
    });

    await logAudit({
      req,
      user: req.user._id,
      action: 'MEMBER_ADDED',
      targetType: 'ProjectMember',
      targetId: member._id,
      description: `Added ${targetUser.email} as ${targetRole.name} to project ${project.name}`,
    });

    const populated = await ProjectMember.findById(member._id)
      .populate('user', 'name email username profileImage status')
      .populate('role', 'name description')
      .populate('project', 'name status');

    return res.status(201).json({
      success: true,
      message: 'Member added to project successfully',
      data: {
        ...populated.toJSON(),
        relativeExpiration: getRelativeExpiration(populated.accessExpiresAt),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a project member's role or expiration
// @route   PUT /api/projects/:id/members/:memberId
// @access  Private (members.edit)
const updateMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { roleId, accessExpiresAt } = req.body;

    const member = await ProjectMember.findById(memberId)
      .populate('project')
      .populate('user')
      .populate('role');

    if (!member) {
      return res.status(404).json({ success: false, message: 'Project member not found' });
    }

    if (roleId) {
      const newRole = await Role.findById(roleId);
      if (!newRole) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }

      if (newRole.name === 'Super Admin' && !req.isSuperAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only Super Administrators can assign the Super Admin role',
        });
      }
      member.role = newRole._id;
    }

    if (accessExpiresAt !== undefined) {
      member.accessExpiresAt = accessExpiresAt ? new Date(accessExpiresAt) : null;
    }

    await member.save();

    await logAudit({
      req,
      user: req.user._id,
      action: 'MEMBER_UPDATED',
      targetType: 'ProjectMember',
      targetId: member._id,
      description: `Updated membership for ${member.user?.email || 'user'} in project ${member.project?.name || ''}`,
    });

    const updated = await ProjectMember.findById(member._id)
      .populate('user', 'name email username profileImage status')
      .populate('role', 'name description')
      .populate('project', 'name status');

    return res.status(200).json({
      success: true,
      message: 'Member updated successfully',
      data: {
        ...updated.toJSON(),
        relativeExpiration: getRelativeExpiration(updated.accessExpiresAt),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a member from a project
// @route   DELETE /api/projects/:id/members/:memberId
// @access  Private (members.remove)
const removeMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;

    const member = await ProjectMember.findById(memberId)
      .populate('project')
      .populate('user');

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found in project' });
    }

    await ProjectMember.findByIdAndDelete(memberId);

    await logAudit({
      req,
      user: req.user._id,
      action: 'MEMBER_REMOVED',
      targetType: 'ProjectMember',
      targetId: memberId,
      description: `Removed ${member.user?.email || 'user'} from project ${member.project?.name || ''}`,
    });

    return res.status(200).json({
      success: true,
      message: 'Member removed from project successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMembers,
  addMember,
  updateMember,
  removeMember,
};
