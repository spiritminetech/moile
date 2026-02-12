import mongoose from 'mongoose';

const approvedLocationSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  companyId: {
    type: Number,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['depot', 'dormitory', 'yard', 'office', 'other'],
    required: true
  },
  address: {
    type: String,
    trim: true
  },
  center: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },
  radius: {
    type: Number,
    required: true,
    min: 10,
    max: 1000,
    default: 100  // meters
  },
  active: {
    type: Boolean,
    default: true
  },
  allowedForClockIn: {
    type: Boolean,
    default: true
  },
  allowedForRouteStart: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt before saving
approvedLocationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
approvedLocationSchema.index({ companyId: 1, active: 1 });
approvedLocationSchema.index({ companyId: 1, allowedForClockIn: 1 });

const ApprovedLocation = mongoose.model('ApprovedLocation', approvedLocationSchema, 'approvedLocations');

export default ApprovedLocation;
