import mongoose from 'mongoose';

const quotationSchema = new mongoose.Schema({
  id: {
    type: Number,
    
    
  },

  quotationCode: {
    type: String,
    index: true
  },

  companyId: {
    type: Number,
    index: true,
    required: true
  },
  
  projectId: {
    type: Number,
  },

  clientId: {
    type: Number,
    index: true,
    required: true
  },

  projectName: {
    type: String,
    required: true
  },

  description: String,

  version: {
    type: Number,
    default: 1
  },

  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Approved', 'Rejected', 'Converted'],
    default: 'Draft',
    index: true
  },

  // ===== Cost Summary (Derived from items) =====
  totalManpowerCost: { type: Number, default: 0 },
  totalMaterialCost: { type: Number, default: 0 },
  totalToolCost: { type: Number, default: 0 },
  totalTransportCost: { type: Number, default: 0 },
  totalWarrantyCost: { type: Number, default: 0 },
  totalCertificationCost: { type: Number, default: 0 },

  grandTotal: {
    type: Number,
    default: 0
  },

  validUntil: Date,

  createdBy: {
    type: Number,
    index: true
  },

  approvedBy: Number,
  approvedAt: Date,

  remarks: String

}, {
  timestamps: true
});

// Generate sequential ID before saving
quotationSchema.pre('save', async function(next) {
  if (this.isNew && !this.id) {
    try {
      const lastQuotation = await this.constructor.findOne().sort({ id: -1 });
      this.id = lastQuotation ? lastQuotation.id + 1 : 1;
      
      // Generate quotation code if not provided
      if (!this.quotationCode) {
        this.quotationCode = `QT-${String(this.id).padStart(3, '0')}`;
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

quotationSchema.index({ companyId: 1, clientId: 1 });
quotationSchema.index({ id: 1 });

export default mongoose.model('Quotation', quotationSchema);