// Model for tracking when workers read and acknowledge supervisor instructions

import mongoose from 'mongoose';

const instructionReadConfirmationSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  workerTaskAssignmentId: {
    type: Number,
    required: true,
    index: true
  },
  employeeId: {
    type: Number,
    required: true,
    index: true
  },
  projectId: {
    type: Number,
    required: true
  },
  taskId: {
    type: Number,
    required: true
  },
  readAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  acknowledgedAt: {
    type: Date,
    default: null
  },
  acknowledged: {
    type: Boolean,
    default: false
  },
  deviceInfo: {
    platform: String,
    version: String,
    ipAddress: String
  },
  location: {
    latitude: Number,
    longitude: Number
  },
  instructionVersion: {
    type: String,
    default: '1.0'
  },
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
instructionReadConfirmationSchema.index({ workerTaskAssignmentId: 1, employeeId: 1 });
instructionReadConfirmationSchema.index({ employeeId: 1, readAt: -1 });
instructionReadConfirmationSchema.index({ projectId: 1, taskId: 1 });

// Auto-increment id
instructionReadConfirmationSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const lastConfirmation = await this.constructor.findOne().sort({ id: -1 });
      this.id = lastConfirmation ? lastConfirmation.id + 1 : 1;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

export default mongoose.model('InstructionReadConfirmation', instructionReadConfirmationSchema);
