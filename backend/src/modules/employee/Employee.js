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
  jobTitle: {
    type: String,
    trim: true
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
  licenseExpiry: {
    type: Date,
    default: null
  },
  licensePhotoUrl: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;
