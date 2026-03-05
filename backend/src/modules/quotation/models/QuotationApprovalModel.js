import mongoose from 'mongoose';

const quotationApprovalSchema = new mongoose.Schema({
  quotationId: {
    type: Number,
    index: true,
    required: true
  },

  version: {
    type: Number,
    required: true
  },

  approverId: {
    type: Number,
   
  },

  approverRole: {
    type: String,
    default: 'Unknown'
  },

  action: {
    type: String,
    enum: ['Approved', 'Rejected'],
    required: true
  },

  remarks: {
    type: String,
    default: ''
  },

  actionAt: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true
});

// Add compound index for efficient queries
quotationApprovalSchema.index({ quotationId: 1, actionAt: -1 });
quotationApprovalSchema.index({ quotationId: 1, version: 1 });

export default mongoose.model('QuotationApproval', quotationApprovalSchema);