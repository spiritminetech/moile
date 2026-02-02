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
    pendingCheckout: {
      type: Boolean,
      default: false,
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