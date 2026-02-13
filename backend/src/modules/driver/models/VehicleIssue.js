import mongoose from 'mongoose';

const vehicleIssueSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
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
  companyId: {
    type: Number,
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['mechanical', 'electrical', 'safety', 'other'],
    comment: 'Type of issue'
  },
  description: {
    type: String,
    required: true,
    trim: true,
    comment: 'Detailed description of the issue'
  },
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    comment: 'Severity level of the issue'
  },
  reportedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  location: {
    latitude: {
      type: Number,
      default: null,
      required: false
    },
    longitude: {
      type: Number,
      default: null,
      required: false
    },
    address: {
      type: String,
      default: '',
      required: false
    }
  },
  photos: {
    type: [String],
    default: [],
    comment: 'Array of photo URLs/paths'
  },
  immediateAssistance: {
    type: Boolean,
    default: false,
    comment: 'Whether immediate assistance is needed'
  },
  status: {
    type: String,
    enum: ['reported', 'acknowledged', 'in_progress', 'resolved', 'closed'],
    default: 'reported',
    index: true
  },
  acknowledgedBy: {
    type: Number,
    default: null,
    required: false,
    comment: 'User ID who acknowledged the issue'
  },
  acknowledgedAt: {
    type: Date,
    default: null,
    required: false
  },
  resolvedBy: {
    type: Number,
    default: null,
    required: false,
    comment: 'User ID who resolved the issue'
  },
  resolvedAt: {
    type: Date,
    default: null,
    required: false
  },
  resolutionNotes: {
    type: String,
    default: '',
    required: false,
    comment: 'Notes about how the issue was resolved'
  },
  vehicleStatus: {
    type: String,
    enum: ['operational', 'needs_repair', 'out_of_service'],
    default: 'operational',
    comment: 'Current vehicle status after issue report'
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
  collection: 'vehicleIssues'
});

// Indexes for efficient queries
vehicleIssueSchema.index({ vehicleId: 1, reportedAt: -1 });
vehicleIssueSchema.index({ driverId: 1, reportedAt: -1 });
vehicleIssueSchema.index({ companyId: 1, status: 1, reportedAt: -1 });
vehicleIssueSchema.index({ status: 1, severity: 1 });

// Update timestamp before saving
vehicleIssueSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const VehicleIssue = mongoose.model('VehicleIssue', vehicleIssueSchema, 'vehicleIssues');

export default VehicleIssue;
