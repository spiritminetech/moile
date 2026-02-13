import mongoose from 'mongoose';

const checklistItemSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ['pass', 'fail', 'needs_attention'],
    comment: 'Inspection result for this item'
  },
  notes: {
    type: String,
    default: '',
    trim: true,
    comment: 'Additional notes or observations'
  },
  photos: {
    type: [String],
    default: [],
    comment: 'Array of photo URLs for this item'
  }
}, { _id: false });

const vehicleInspectionSchema = new mongoose.Schema({
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
  inspectionType: {
    type: String,
    required: true,
    enum: ['pre_trip', 'post_trip', 'scheduled'],
    default: 'pre_trip',
    comment: 'Type of inspection'
  },
  inspectionDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  // 12-point checklist
  checklist: {
    tires: {
      type: checklistItemSchema,
      required: true
    },
    lights: {
      type: checklistItemSchema,
      required: true
    },
    brakes: {
      type: checklistItemSchema,
      required: true
    },
    steering: {
      type: checklistItemSchema,
      required: true
    },
    fluids: {
      type: checklistItemSchema,
      required: true
    },
    mirrors: {
      type: checklistItemSchema,
      required: true
    },
    seatbelts: {
      type: checklistItemSchema,
      required: true
    },
    horn: {
      type: checklistItemSchema,
      required: true
    },
    wipers: {
      type: checklistItemSchema,
      required: true
    },
    emergencyEquipment: {
      type: checklistItemSchema,
      required: true
    },
    interior: {
      type: checklistItemSchema,
      required: true
    },
    exterior: {
      type: checklistItemSchema,
      required: true
    }
  },
  odometerReading: {
    type: Number,
    required: true,
    min: 0,
    comment: 'Vehicle odometer reading at inspection time'
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
      default: ''
    }
  },
  signature: {
    type: String,
    default: null,
    comment: 'Digital signature data URL'
  },
  overallStatus: {
    type: String,
    required: true,
    enum: ['pass', 'conditional_pass', 'fail'],
    comment: 'Overall inspection result'
  },
  issuesFound: {
    type: [{
      item: String,
      severity: {
        type: String,
        enum: ['minor', 'major', 'critical']
      },
      description: String
    }],
    default: []
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
  collection: 'vehicleInspections'
});

// Indexes for efficient queries
vehicleInspectionSchema.index({ vehicleId: 1, inspectionDate: -1 });
vehicleInspectionSchema.index({ driverId: 1, inspectionDate: -1 });
vehicleInspectionSchema.index({ companyId: 1, overallStatus: 1, inspectionDate: -1 });
vehicleInspectionSchema.index({ overallStatus: 1, inspectionDate: -1 });

// Update timestamp before saving
vehicleInspectionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const VehicleInspection = mongoose.model('VehicleInspection', vehicleInspectionSchema, 'vehicleInspections');

export default VehicleInspection;
