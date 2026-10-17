const mongoose = require('mongoose');

const projectMemberSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    accessExpiresAt: {
      type: Date,
      default: null,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate membership for the same user in the same project
projectMemberSchema.index({ project: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('ProjectMember', projectMemberSchema);
