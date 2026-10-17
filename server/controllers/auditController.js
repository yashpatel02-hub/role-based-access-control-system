const AuditLog = require('../models/AuditLog');

// @desc    Get audit logs with search, action filter, and pagination
// @route   GET /api/audit-logs
// @access  Private (audit.view)
const getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const { search, action, targetType } = req.query;
    const query = {};

    if (action && action !== 'all') {
      query.action = action;
    }

    if (targetType && targetType !== 'all') {
      query.targetType = targetType;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ description: searchRegex }, { action: searchRegex }, { ipAddress: searchRegex }];
    }

    const totalItems = await AuditLog.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit) || 1;

    const logs = await AuditLog.find(query)
      .populate('user', 'name email username profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: logs,
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

module.exports = {
  getAuditLogs,
};
