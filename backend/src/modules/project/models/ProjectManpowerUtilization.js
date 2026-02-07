import mongoose from "mongoose";

const ProjectManpowerUtilizationSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      index: true
    },

    projectId: {
      type: Number,
      required: true,
      index: true
    },

    supervisorId: {
      type: Number,
      required: true,
      index: true
    },

    dailyProgressId: {
      type: Number,
      index: true
    },

    date: {
      type: Date,
      required: true,
      index: true
    },

    totalWorkers: {
      type: Number,
      required: true,
      min: 0
    },

    activeWorkers: {
      type: Number,
      required: true,
      min: 0
    },

    productivity: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },

    efficiency: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },

    overtimeHours: {
      type: Number,
      min: 0,
      default: 0
    },

    absentWorkers: {
      type: Number,
      min: 0,
      default: 0
    },

    lateWorkers: {
      type: Number,
      min: 0,
      default: 0
    },

    workerBreakdown: [
      {
        role: {
          type: String,
          required: true
        },
        planned: {
          type: Number,
          required: true,
          min: 0
        },
        actual: {
          type: Number,
          required: true,
          min: 0
        },
        hoursWorked: {
          type: Number,
          min: 0,
          default: 0
        }
      }
    ],

    notes: {
      type: String,
      trim: true
    },

    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: "projectManpowerUtilization",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
  }
);

// Compound index for efficient queries
ProjectManpowerUtilizationSchema.index({ projectId: 1, date: 1 });
ProjectManpowerUtilizationSchema.index({ supervisorId: 1, date: 1 });

export default mongoose.model(
  "ProjectManpowerUtilization",
  ProjectManpowerUtilizationSchema
);
