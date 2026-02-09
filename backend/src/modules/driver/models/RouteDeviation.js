import mongoose from 'mongoose';

const routeDeviationSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  taskId: {
    type: Number,
    required: true,
    index: true
  },
  driverId: {
    type: Number,
    required: true,
    index: true
  },
  companyId: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  currentLocation: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  plannedLocation: {
    latitude: Number,
    longitude: Number
  },
  deviationDistance: {
    type: Number, // meters
    required: true
  },
  reason: {
    type: String,
    default: ''
  },
  autoDetected: {
    type: Boolean,
    default: false
  },
  supervisorNotified: {
    type: Boolean,
    default: false
  },
  notificationId: {
    type: Number
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date
  },
  estimatedDelay: {
    type: Number // minutes
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
  timestamps: true
});

// Indexes for better query performance
routeDeviationSchema.index({ taskId: 1, timestamp: -1 });
routeDeviationSchema.index({ driverId: 1, timestamp: -1 });
routeDeviationSchema.index({ companyId: 1, timestamp: -1 });

const RouteDeviation = mongoose.model('RouteDeviation', routeDeviationSchema);

export default RouteDeviation;
