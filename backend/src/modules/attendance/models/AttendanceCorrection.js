import mongoose from 'mongoose';

const attendanceCorrectionSchema = new mongoose.Schema({
  correctionId: {
    type: Number,
    unique: true,
    required: true
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
  attendanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance'
  },
  requestType: {
    type: String,
    enum: ['check_in', 'check_out', 'lunch_start', 'lunch_end', 'full_day'],
    required: true
  },
  originalTime: {
    type: Date
  },
  requestedTime: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  requestedBy: {
    type: Number, // Employee ID who requested
    required: true
  },
  reviewedBy: {
    type: Number // Supervisor ID who reviewed
  },
  reviewNotes: {
    type: String
  },
  reviewedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
attendanceCorrectionSchema.index({ employeeId: 1, status: 1 });
attendanceCorrectionSchema.index({ projectId: 1, status: 1 });
attendanceCorrectionSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('AttendanceCorrection', attendanceCorrectionSchema);
