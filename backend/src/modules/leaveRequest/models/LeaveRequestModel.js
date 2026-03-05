import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  companyId: {
    type: Number,
    required: true,
    ref: 'Company'
  },
  employeeId: {
    type: Number,
    required: true,
    ref: 'Employee'
  },
  requestType: {
    type: String,
    enum: ['LEAVE'],
    default: 'LEAVE'
  },
  leaveType: {
    type: String,
    enum: ['ANNUAL', 'MEDICAL', 'EMERGENCY'],
    required: true
  },
  fromDate: {
    type: Date,
    required: true
  },
  toDate: {
    type: Date,
    required: true
  },
  totalDays: {
    type: Number
  },
  reason: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
    default: 'PENDING'
  },
  currentApproverId: {
    type: Number,
    ref: 'User'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: Number,
    ref: 'User'
  }
}, { timestamps: true });

leaveRequestSchema.index({ companyId: 1, employeeId: 1 });
leaveRequestSchema.index({ status: 1 });



export default mongoose.model('LeaveRequest', leaveRequestSchema);