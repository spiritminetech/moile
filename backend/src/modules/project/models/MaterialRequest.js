import mongoose from 'mongoose';

const materialRequestSchema = new mongoose.Schema({
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
  projectId: {
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
    enum: ['MATERIAL', 'TOOL'],
    required: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  itemCategory: {
    type: String,
    enum: ['concrete', 'steel', 'wood', 'electrical', 'plumbing', 'finishing', 'hardware', 'power_tools', 'hand_tools', 'safety_equipment', 'measuring_tools', 'other'],
    default: 'other'
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    required: true,
    default: 'pieces'
  },
  urgency: {
    type: String,
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    default: 'NORMAL'
  },
  requiredDate: {
    type: Date,
    required: true
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  justification: {
    type: String,
    trim: true
  },
  specifications: {
    type: String,
    trim: true
  },
  estimatedCost: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'FULFILLED', 'CANCELLED'],
    default: 'PENDING'
  },
  approvedQuantity: {
    type: Number,
    min: 0
  },
  approverId: {
    type: Number
  },
  approvedAt: {
    type: Date
  },
  fulfilledAt: {
    type: Date
  },
  pickupLocation: {
    type: String,
    trim: true
  },
  pickupInstructions: {
    type: String,
    trim: true
  },
  pickupContactPerson: {
    type: String,
    trim: true
  },
  pickupContactPhone: {
    type: String,
    trim: true
  },
  actualCost: {
    type: Number,
    min: 0
  },
  supplier: {
    type: String,
    trim: true
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
  collection: 'materialRequests'
});

// Indexes for efficient querying
materialRequestSchema.index({ companyId: 1, projectId: 1 });
materialRequestSchema.index({ companyId: 1, employeeId: 1 });
materialRequestSchema.index({ companyId: 1, status: 1 });
materialRequestSchema.index({ companyId: 1, requestType: 1 });
materialRequestSchema.index({ requiredDate: 1 });
materialRequestSchema.index({ createdAt: -1 });

export default mongoose.model('MaterialRequest', materialRequestSchema);