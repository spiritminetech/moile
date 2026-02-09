import mongoose from 'mongoose';

const fleetVehicleSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  companyId: {
    type: Number,
    required: true,
    ref: 'Company'
  },
  vehicleCode: {
    type: String,
    required: true,
    trim: true
  },
  registrationNo: {
    type: String,
    unique: true,
    trim: true
  },
  vehicleType: {
    type: String,
    trim: true
  },
  capacity: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'IN_SERVICE', 'MAINTENANCE'],
    default: 'AVAILABLE'
  },
  insuranceExpiry: {
    type: Date
  },
  lastServiceDate: {
    type: Date
  },
  odometer: {
    type: Number,
    min: 0
  },
  // Predefined route assignment fields
  assignedRoute: {
    routeName: {
      type: String,
      trim: true,
      default: null
    },
    routeCode: {
      type: String,
      trim: true,
      default: null
    },
    pickupLocations: {
      type: [String],
      default: []
    },
    dropoffLocation: {
      type: String,
      trim: true,
      default: null
    },
    estimatedDistance: {
      type: Number, // in kilometers
      min: 0,
      default: null
    },
    estimatedDuration: {
      type: Number, // in minutes
      min: 0,
      default: null
    }
  },
  fuelType: {
    type: String,
    enum: ['Diesel', 'Petrol', 'Electric', 'Hybrid', 'CNG'],
    default: 'Diesel'
  },
  fuelLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 75 // Percentage
  },
  year: {
    type: Number,
    min: 1900,
    max: 2100
  },
  insurancePolicyNumber: {
    type: String,
    trim: true
  },
  insuranceProvider: {
    type: String,
    trim: true
  },
  roadTaxExpiry: {
    type: Date
  },
  nextServiceDate: {
    type: Date
  },
  assignedDriverId: {
    type: Number,
    ref: 'Employee'
  },
  assignedDriverName: {
    type: String,
    trim: true
  },
  meta: {
    type: Object,
    default: {}
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
fleetVehicleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Third argument sets the collection name explicitly
const FleetVehicle = mongoose.model('FleetVehicle', fleetVehicleSchema, 'fleetVehicles');

export default FleetVehicle;
