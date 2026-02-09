import mongoose from 'mongoose';

const attendanceEscalationSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
    },
    employeeId: {
      type: Number,
      required: true,
    },
    projectId: {
      type: Number,
      required: true,
    },
    escalationType: {
      type: String,
      enum: ['REPEATED_LATE', 'REPEATED_ABSENCE', 'GEOFENCE_VIOLATION', 'UNAUTHORIZED_ABSENCE', 'OTHER'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    description: {
      type: String,
      required: true,
    },
    occurrenceCount: {
      type: Number,
      default: 1,
    },
    dateRange: {
      from: {
        type: Date,
        required: true,
      },
      to: {
        type: Date,
        required: true,
      },
    },
    escalatedBy: {
      type: Number, // Supervisor ID
      required: true,
    },
    escalatedTo: {
      type: String,
      enum: ['ADMIN', 'MANAGER', 'HR'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'],
      default: 'PENDING',
    },
    notes: {
      type: String,
      default: '',
    },
    actionTaken: {
      type: String,
      default: '',
    },
    resolvedBy: {
      type: Number,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    relatedAttendanceIds: [{
      type: Number,
    }],
  },
  {
    collection: 'attendance_escalations',
    timestamps: true,
  }
);

// Auto-increment ID
attendanceEscalationSchema.pre('save', async function (next) {
  if (!this.id) {
    const lastEscalation = await this.constructor.findOne().sort({ id: -1 });
    this.id = lastEscalation ? lastEscalation.id + 1 : 1;
  }
  next();
});

export default mongoose.model('AttendanceEscalation', attendanceEscalationSchema);
