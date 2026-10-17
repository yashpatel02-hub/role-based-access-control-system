const AuditLog = require('../models/AuditLog');

const logAudit = async ({ req, user, action, targetType = '', targetId = '', description = '' }) => {
  try {
    const userId = user ? (user._id || user) : (req?.session?.userId || null);
    const ipAddress = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || '';

    await AuditLog.create({
      user: userId,
      action,
      targetType,
      targetId: targetId ? targetId.toString() : '',
      description,
      ipAddress,
    });
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
  }
};

module.exports = {
  logAudit,
};
