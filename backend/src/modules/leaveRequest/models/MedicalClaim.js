import mongoose from 'mongoose';

const medicalClaimSchema = new mongoose.Schema({
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
  claimType: {
    type: String,
    enum: ['MEDICAL_REIMBURSEMENT', 'DENTAL_CLAIM', 'OPTICAL_CLAIM', 'HEALTH_SCREENING', 'EMERGENCY_TREATMENT'],
    required: true
  },
  claimAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'SGD'
  },
  treatmentDate: {
    type: Date,
    required: true
  },
  treatmentType: {
    type: String,
    required: true,
    trim: true
  },
  hospitalClinic: {
    type: String,
    required: true,
    trim: true
  },
  doctorName: {
    type: String,
    trim: true
  },
  diagnosis: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
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
    default: 'PAYROLL'
  },
  receipts: [{
    fileName: String,
    filePath: String,
    fileType: String,
    amount: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  medicalReports: [{
    fileName: String,
    filePath: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  remarks: {
    type: String,
    trim: true
  },
  isWorkRelated: {
    type: Boolean,
    default: false
  },
  workIncidentId: {
    type: Number
  },
  createdBy: {
    type: Number,
    required: true
  }
}, {
  timestamps: true,
  collection: 'medicalClaims'
});

// Indexes for efficient querying
medicalClaimSchema.index({ companyId: 1, employeeId: 1 });
medicalClaimSchema.index({ companyId: 1, status: 1 });
medicalClaimSchema.index({ companyId: 1, claimType: 1 });
medicalClaimSchema.index({ treatmentDate: -1 });
medicalClaimSchema.index({ createdAt: -1 });

export default mongoose.model('MedicalClaim', medicalClaimSchema);