const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    targetType: {
      type: String,
      trim: true,
      default: '',
    },
    targetId: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
