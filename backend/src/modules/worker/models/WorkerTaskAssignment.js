import mongoose from 'mongoose';

const WorkerTaskAssignmentSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  projectId: {
    type: Number,
    required: true
  },
  employeeId: {
    type: Number,
    required: true
  },
  supervisorId: {
    type: Number,
    
  },
  vehicleId: {
    type: Number,
    default: null
  },
  taskId: {
    type: Number,
    default: null
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  status: {
    type: String,
    default: 'queued',
    enum: ['queued', 'in_progress', 'paused', 'completed']
  },
  companyId: {
    type: Number,
    
  },
  createdAt: {
    type: Date,
    default: Date.now
  }, 
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },

  // New fields for mobile app
  dailyTarget: {
    description: String,
    quantity: Number,
    unit: String,
    targetCompletion: { type: Number, default: 100 },
    // Enhanced daily target fields
    targetType: String, // e.g., "Quantity Based", "Time Based", "Area Based"
    areaLevel: String, // e.g., "Tower A – Level 5", "Main Corridor – Ground Floor"
    startTime: String, // e.g., "8:00 AM"
    expectedFinish: String, // e.g., "5:00 PM"
    progressToday: {
      completed: { type: Number, default: 0 },
      total: Number,
      percentage: { type: Number, default: 0 }
    }
  },
  
  // Detailed nature of work (can override task defaults)
  trade: String,
  activity: String,
  workType: String,
  
  // Required tools and materials (can override task defaults)
  requiredTools: [String],
  requiredMaterials: [String],
  
  workArea: String,
  floor: String,
  zone: String,
  
  timeEstimate: {
    estimated: Number, // minutes
    elapsed: Number,
    remaining: Number
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  sequence: Number,
  
  dependencies: [Number], // Array of assignment IDs
  
  geofenceValidation: {
    required: { type: Boolean, default: true },
    lastValidated: Date,
    validationLocation: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Supervisor instructions with attachments
  supervisorInstructions: {
    text: String,
    attachments: [{
      type: {
        type: String,
        enum: ['photo', 'document', 'drawing', 'video'],
        required: true
      },
      filename: String,
      url: String,
      uploadedAt: { type: Date, default: Date.now },
      uploadedBy: Number, // supervisor ID
      description: String,
      fileSize: Number, // in bytes
      mimeType: String
    }],
    lastUpdated: { type: Date, default: Date.now },
    updatedBy: Number // supervisor ID
  }
}, {
  collection: 'workerTaskAssignment',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Add indexes for better query performance
WorkerTaskAssignmentSchema.index({ projectId: 1, date: 1 }); // For team size queries
WorkerTaskAssignmentSchema.index({ employeeId: 1, date: 1 }); // For worker queries
WorkerTaskAssignmentSchema.index({ supervisorId: 1 }); // For supervisor queries

export default mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);