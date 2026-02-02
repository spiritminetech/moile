import mongoose from 'mongoose';

const paymentRequestSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
    required: true
  },
  companyId: {
    type: Number,
    required: true,
    index: true
  },
  employeeId: {
    type: Number,
    required: true,
    index: true
  },
  requestType: {
    type: String,
    enum: ['ADVANCE_PAYMENT', 'EXPENSE_REIMBURSEMENT', 'OVERTIME_PAYMENT', 'BONUS_REQUEST'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'SGD'
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  urgency: {
    type: String,
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    default: 'NORMAL'
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED', 'CANCELLED'],
    default: 'PENDING'
  },
  approvedAmount: {
    type: Number,
    min: 0
  },
  approverId: {
    type: Number
  },
  approvedAt: {
    type: Date
  },
  processedAt: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['BANK_TRANSFER', 'CASH', 'CHEQUE', 'PAYROLL'],
    default: 'BANK_TRANSFER'
  },
  bankDetails: {
    accountNumber: String,
    bankName: String,
    accountHolderName: String
  },
  remarks: {
    type: String,
    trim: true
  },
  attachments: [{
    fileName: String,
    filePath: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: Number,
    required: true
  }
}, {
  timestamps: true,
  collection: 'paymentRequests'
});

// Indexes for efficient querying
paymentRequestSchema.index({ companyId: 1, employeeId: 1 });
paymentRequestSchema.index({ companyId: 1, status: 1 });
paymentRequestSchema.index({ companyId: 1, requestType: 1 });
paymentRequestSchema.index({ createdAt: -1 });

export default mongoose.model('PaymentRequest', paymentRequestSchema);