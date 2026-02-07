import mongoose from 'mongoose';

const tripIncidentSchema = new mongoose.Schema({
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
  incidentType: {
    type: String,
    enum: ['DELAY', 'BREAKDOWN', 'ACCIDENT', 'OTHER'],
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  location: {
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
  reportedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['REPORTED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
    default: 'REPORTED'
  },
  photoUrls: {
    type: [String],
    default: []
  },
  requiresAssistance: {
    type: Boolean,
    default: false
  },
  estimatedDelay: {
    type: Number, // in minutes
    default: null
  },
  delayReason: {
    type: String,
    trim: true,
    default: null
  },
  breakdownType: {
    type: String,
    trim: true,
    default: null
  },
  notes: {
    type: String,
    trim: true,
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
});

// Update `updatedAt` before saving
tripIncidentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const TripIncident = mongoose.model('TripIncident', tripIncidentSchema, 'tripIncidents');

export default TripIncident;
