const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Permission name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    module: {
      type: String,
      required: [true, 'Module name is required'],
      trim: true,
      lowercase: true,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Permission', permissionSchema);
