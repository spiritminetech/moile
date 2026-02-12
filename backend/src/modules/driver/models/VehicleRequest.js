import mongoose from 'mongoose';

const vehicleRequestSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  fleetTaskId: {
    type: Number,
    required: true,
    ref: 'FleetTask'
  },
  driverId: {
    type: Number,
    required: true,
    ref: 'Employee'
  },
  companyId: {
    type: Number,
    required: true,
    ref: 'Company'
  },
  requestType: {
    type: String,
    enum: ['replacement', 'additional', 'emergency'],
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'assigned', 'rejected', 'cancelled'],
    default: 'pending'
  },
  currentLocation: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    address: {
      type: String,
      trim: true,
      default: null
    }
  },
  alternateVehicleId: {
    type: Number,
    ref: 'FleetVehicle',
    default: null
  },
  alternateDriverId: {
    type: Number,
    ref: 'Employee',
    default: null
  },
  estimatedArrival: {
    type: Date,
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    trim: true,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    default: null
  },
  requestedAt: {
    type: Date,
    default: Date.now
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

// Update `updatedAt` before saving
vehicleRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const VehicleRequest = mongoose.model('VehicleRequest', vehicleRequestSchema, 'vehicleRequests');

export default VehicleRequest;
