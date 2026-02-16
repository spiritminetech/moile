// models/Task.js
import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
    required: true
  },
  companyId: {
    type: Number,
    required: true
  },
  projectId: {
    type: Number,
    required: true
  },
  taskType: {
    type: String,
    required: true,
    enum: [
      'WORK', 'TRANSPORT', 'MATERIAL', 'TOOL', 'INSPECTION',
      'MAINTENANCE', 'ADMIN', 'TRAINING', 'OTHER','Deployment','Work Progress','Deliver Material','Inspection'
    ]
  },
   assignedBy: {
    type: Number
  },
  taskName: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  // Detailed nature of work breakdown
  trade: {
    type: String,
    trim: true,
    default: null
  },
  activity: {
    type: String,
    trim: true,
    default: null
  },
  workType: {
    type: String,
    trim: true,
    default: null
  },
  // Required tools and materials
  requiredTools: {
    type: [String],
    default: []
  },
  requiredMaterials: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    default: 'PLANNED',
    enum: ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  notes: {
    type: String
  },
  createdBy: {
    type: Number
  },
  additionalData: {
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

// Change this line from module.exports to export default
export default mongoose.model('Task', taskSchema); 