import mongoose from 'mongoose';

const quotationTermSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
    required: true
  },

  quotationId: {
    type: mongoose.Schema.Types.Mixed, // Allow both Number and ObjectId
    index: true,
    required: true
  },

  termType: {
    type: String,
    enum: [
      'Payment',
      'Warranty',
      'Delivery',
      'Validity',
      'General'
    ],
    required: true
  },

  title: String,

  description: {
    type: String,
    required: true
  },

  sortOrder: {
    type: Number,
    default: 0
  }

}, {
  timestamps: true
});

// Generate sequential ID before saving
quotationTermSchema.pre('save', async function(next) {
  if (this.isNew && !this.id) {
    try {
      const lastTerm = await this.constructor.findOne().sort({ id: -1 });
      this.id = lastTerm ? lastTerm.id + 1 : 1;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

quotationTermSchema.index({ quotationId: 1, sortOrder: 1 });

export default mongoose.model('QuotationTerm', quotationTermSchema);