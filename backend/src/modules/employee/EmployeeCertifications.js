import mongoose from 'mongoose';

const employeeCertificationsSchema = new mongoose.Schema({
  id: {
    type: Number,
    // required: true,
    // unique: true
  },
  employeeId: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['training', 'professional cert', 'new', 'renewal']
  },
  certificationType: {
    type: String,
    enum: ['NEW', 'RENEWAL'],
    default: 'NEW'
  },
  ownership: {
    type: String,
    enum: ['employee', 'company']
  },
  issueDate: {
    type: Date
  },
  expiryDate: {
    type: Date
  },
  documentPath: {
    type: String,
    trim: true
  }
}, {
  collection: 'employeeCertifications',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

const EmployeeCertifications = mongoose.model('employeeCertifications', employeeCertificationsSchema);

export default EmployeeCertifications;