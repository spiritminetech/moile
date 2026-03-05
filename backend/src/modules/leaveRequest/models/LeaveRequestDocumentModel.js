import mongoose from 'mongoose';

const leaveRequestDocumentSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  leaveRequestId: {
    type: Number,
    required: true,
    ref: 'LeaveRequest'
  },
  documentType: {
    type: String,
    enum: ['MEDICAL_CERT', 'SUPPORTING_DOC'],
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  uploadedBy: {
    type: Number,
    ref: 'User'
  }
});

leaveRequestDocumentSchema.index({ leaveRequestId: 1 });



export default mongoose.model('LeaveRequestDocument', leaveRequestDocumentSchema);