import mongoose from 'mongoose';

const fuelLogSchema = new mongoose.Schema({
  vehicleId: {
    type: Number,
    required: true,
    index: true
  },
  driverId: {
    type: Number,
    required: true,
    index: true
  },
  driverName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
    comment: 'Fuel amount in liters'
  },
  cost: {
    type: Number,
    required: true,
    min: 0,
    comment: 'Total cost in dollars'
  },
  pricePerLiter: {
    type: Number,
    required: true,
    min: 0,
    comment: 'Calculated price per liter'
  },
  mileage: {
    type: Number,
    required: true,
    min: 0,
    comment: 'Vehicle odometer reading at time of fueling'
  },
  location: {
    type: String,
    required: true,
    trim: true,
    comment: 'Gas station name and location'
  },
  receiptPhoto: {
    type: String,
    default: null,
    comment: 'URL or path to receipt photo'
  },
  gpsLocation: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'reimbursed'],
    default: 'pending'
  },
  approvedBy: {
    type: Number,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  reimbursedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'fuelLogs'
});

// Indexes for efficient queries
fuelLogSchema.index({ vehicleId: 1, date: -1 });
fuelLogSchema.index({ driverId: 1, date: -1 });
fuelLogSchema.index({ status: 1, date: -1 });

// Calculate price per liter before saving
fuelLogSchema.pre('save', function(next) {
  if (this.amount && this.cost) {
    this.pricePerLiter = this.cost / this.amount;
  }
  this.updatedAt = new Date();
  next();
});

const FuelLog = mongoose.model('FuelLog', fuelLogSchema, 'fuelLogs');

export default FuelLog;
