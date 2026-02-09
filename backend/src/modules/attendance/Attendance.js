import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true,
    },
    checkIn: {
      type: Date,
      default: null,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    lunchStartTime: {
      type: Date,
      default: null,
    },
    lunchEndTime: {
      type: Date,
      default: null,
    },
    overtimeStartTime: {
      type: Date,
      default: null,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },
    regularHours: {
      type: Number,
      default: 0,
    },
    pendingCheckout: {
      type: Boolean,
      default: false,
    },
    // Absence tracking
    absenceReason: {
      type: String,
      enum: ['LEAVE_APPROVED', 'LEAVE_NOT_INFORMED', 'MEDICAL', 'UNAUTHORIZED', 'PRESENT', null],
      default: null,
    },
    absenceNotes: {
      type: String,
      default: '',
    },
    absenceMarkedBy: {
      type: Number, // Supervisor ID
      default: null,
    },
    absenceMarkedAt: {
      type: Date,
      default: null,
    },
    insideGeofenceAtCheckin: {
      type: Boolean,
      default: false,
    },
    insideGeofenceAtCheckout: {
      type: Boolean,
      default: false,
    },
    // Optional: store last known location
    lastLatitude: {
      type: Number,
    },
    lastLongitude: {
      type: Number,
    },
    // Manual override support
    manualOverrides: [{
      supervisorId: {
        type: Number,
        required: true
      },
      overrideType: {
        type: String,
        enum: ['CHECK_IN', 'CHECK_OUT', 'FULL_DAY', 'CORRECTION'],
        required: true
      },
      reason: {
        type: String,
        required: true
      },
      notes: {
        type: String,
        default: ''
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      originalCheckIn: {
        type: Date,
        default: null
      },
      originalCheckOut: {
        type: Date,
        default: null
      }
    }],
    // Transport delay linking
    linkedToTransportDelay: {
      type: Boolean,
      default: false
    },
    linkedDelayId: {
      type: Number,
      default: null
    },
    delayReason: {
      type: String,
      default: ''
    },
    lateMinutes: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['present', 'late', 'absent', 'late_excused', 'on_leave'],
      default: 'present'
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'attendance',
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

export default mongoose.model('Attendance', attendanceSchema);