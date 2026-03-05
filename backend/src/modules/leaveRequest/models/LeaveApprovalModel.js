import mongoose from 'mongoose';

const leaveApprovalSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  leaveRequestId: {
    type: Number,
    required: true,
    ref: 'LeaveRequest'
  },
  approverId: {
    type: Number,
    required: true,
    ref: 'User'
  },
  approverRole: {
    type: String,
    enum: ['SUPERVISOR', 'MANAGER', 'ADMIN', 'BOSS'],
    required: true
  },
  action: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  remarks: {
    type: String,
    trim: true
  },
  actionAt: {
    type: Date
  }
}, { timestamps: true });

leaveApprovalSchema.index({ leaveRequestId: 1 });
leaveApprovalSchema.index({ approverId: 1 });



export default mongoose.model('LeaveApproval', leaveApprovalSchema);