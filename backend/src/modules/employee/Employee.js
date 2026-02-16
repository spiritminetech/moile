import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
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
  userId: {
    type: Number,
    ref: 'User'
  },
  employeeCode: {
    type: String,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: null
  },
  jobTitle: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true,
    default: 'Construction'
  },
  nationality: {
    type: String,
    trim: true,
    default: null
  },
  photoUrl: {  // New field
    type: String,
    default: null
  },
  currentProject: {  // Add currentProject field
    type: {
      id: Number,
      name: String,
      code: String
    },
    default: null
  },
  // Driving License Fields (for drivers)
  drivingLicenseNumber: {
    type: String,
    trim: true,
    default: null
  },
  licenseType: {
    type: String,
    trim: true,
    default: null
  },
  licenseClass: {
    type: String,
    trim: true,
    default: null
  },
  licenseIssueDate: {
    type: Date,
    default: null
  },
  licenseExpiry: {
    type: Date,
    default: null
  },
  licenseIssuingAuthority: {
    type: String,
    trim: true,
    default: null
  },
  licensePhotoUrl: {
    type: String,
    default: null
  },
  yearsOfExperience: {
    type: Number,
    default: 0
  },
  specializations: {
    type: [String],
    default: []
  },
  // Emergency Contact
  emergencyContact: {
    name: {
      type: String,
      trim: true,
      default: null
    },
    relationship: {
      type: String,
      trim: true,
      default: null
    },
    phone: {
      type: String,
      trim: true,
      default: null
    }
  },
  // Certifications
  certifications: {
    type: [{
      id: Number,
      name: String,
      issuer: String,
      issueDate: Date,
      expiryDate: Date,
      status: {
        type: String,
        enum: ['active', 'expired', 'expiring_soon'],
        default: 'active'
      }
    }],
    default: []
  },
  // Performance Metrics
  safetyScore: {
    type: Number,
    default: 95,
    min: 0,
    max: 100
  },
  customerRating: {
    type: Number,
    default: 4.5,
    min: 0,
    max: 5
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'LEFT'],
    default: 'ACTIVE'
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

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;
