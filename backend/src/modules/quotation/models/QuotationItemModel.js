import mongoose from 'mongoose';

const quotationItemSchema = new mongoose.Schema({
  quotationId: {
    type: Number,
    required: true,
    index: true
  },

  category: {
    type: String,
    enum: [
      'Manpower',
      'Material',
      'Tool',
      'Transport',
      'Warranty',
      'Certification'
    ],
    required: true,
    index: true
  },

  trade: String,          // For manpower
  itemName: String,       // Material / Tool name
  description: String,

  quantity: {
    type: Number,
    default: 1
  },

  unit: String,           // Day, Month, Nos, Lot, etc.

  unitRate: {
    type: Number,
    default: 0
  },

  totalAmount: {
    type: Number,
    default: 0
  },

  meta: {
    type: Object,
    default: {}
  }

}, {
  timestamps: true
});

quotationItemSchema.index({ quotationId: 1, category: 1 });

export default mongoose.model('QuotationItem', quotationItemSchema);