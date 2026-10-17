const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const Role = require('../models/Role');
const { logAudit } = require('../services/auditService');

// @desc    Get all projects with search, status filter, and pagination
// @route   GET /api/projects
// @access  Private (projects.view)
const getProjects = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { search, status } = req.query;
    const query = {};

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { description: searchRegex }];
    }

    if (status && ['active', 'completed', 'archived'].includes(status)) {
      query.status = status;
    }

    // Role-based visibility:
    // If not Super Admin or Admin, and user doesn't have system-wide project view,
    // they can only see projects they are members of:
    if (!req.isSuperAdmin && !req.userRoles.includes('Admin')) {
      const userMemberships = await ProjectMember.find({ user: req.user._id });
      const projectIds = userMemberships.map((m) => m.project);
      query._id = { $in: projectIds };
    }

    const totalItems = await Project.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit) || 1;

    const projects = await Project.find(query)
      .populate('createdBy', 'name email username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate members count for each project
    const projectsWithDetails = await Promise.all(
      projects.map(async (project) => {
        const memberCount = await ProjectMember.countDocuments({ project: project._id });
        return {
          ...project.toJSON(),
          memberCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: projectsWithDetails,
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

// @desc    Get single project by ID with members list
// @route   GET /api/projects/:id
// @access  Private (projects.view)
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('createdBy', 'name email username');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check member access if user is not Super Admin or Admin
    if (!req.isSuperAdmin && !req.userRoles.includes('Admin')) {
      const membership = await ProjectMember.findOne({
        project: project._id,
        user: req.user._id,
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this project',
        });
      }

      // Check if access has expired
      if (membership.accessExpiresAt && new Date(membership.accessExpiresAt) < new Date()) {
        return res.status(403).json({
          success: false,
          message: 'Your access to this project has expired',
        });
      }
    }

    const members = await ProjectMember.find({ project: project._id })
      .populate('user', 'name email username profileImage status')
      .populate('role', 'name description');

    return res.status(200).json({
      success: true,
      data: {
        ...project.toJSON(),
        members,
        memberCount: members.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a project
// @route   POST /api/projects
// @access  Private (projects.create)
const createProject = async (req, res, next) => {
  try {
    const { name, description, status } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Project name is required' });
    }

    const project = await Project.create({
      name: name.trim(),
      description: description || '',
      status: status || 'active',
      createdBy: req.user._id,
    });

    // Automatically add the creator with their highest role
    const creatorRole = req.user.roles[0] || (await Role.findOne({ name: 'Admin' }));
    if (creatorRole) {
      await ProjectMember.create({
        project: project._id,
        user: req.user._id,
        role: creatorRole._id,
        joinedAt: new Date(),
      });
    }

    await logAudit({
      req,
      user: req.user._id,
      action: 'PROJECT_CREATED',
      targetType: 'Project',
      targetId: project._id,
      description: `Created project: ${project.name}`,
    });

    const populated = await Project.findById(project._id).populate('createdBy', 'name email username');

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        ...populated.toJSON(),
        memberCount: 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (projects.edit)
const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const { name, description, status } = req.body;

    if (name) project.name = name.trim();
    if (description !== undefined) project.description = description.trim();
    if (status && ['active', 'completed', 'archived'].includes(status)) {
      project.status = status;
    }

    await project.save();

    await logAudit({
      req,
      user: req.user._id,
      action: 'PROJECT_UPDATED',
      targetType: 'Project',
      targetId: project._id,
      description: `Updated project: ${project.name}`,
    });

    const updated = await Project.findById(project._id).populate('createdBy', 'name email username');
    const memberCount = await ProjectMember.countDocuments({ project: project._id });

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: {
        ...updated.toJSON(),
        memberCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (projects.delete)
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Delete all project memberships
    await ProjectMember.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(project._id);

    await logAudit({
      req,
      user: req.user._id,
      action: 'PROJECT_DELETED',
      targetType: 'Project',
      targetId: project._id,
      description: `Deleted project: ${project.name}`,
    });

    return res.status(200).json({
      success: true,
      message: 'Project and all associated memberships deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
