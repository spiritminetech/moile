import mongoose from "mongoose";

const ProjectDailyProgressSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true
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

    date: {
      type: Date,
      required: true,
      index: true
    },

    overallProgress: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },

    remarks: {
      type: String,
      trim: true
    },

    issues: {
      type: String,
      trim: true
    },

    submittedAt: {
      type: Date,
      default: Date.now
    },

    /* 🔐 Manager Approval Fields (NEW) */

    approvalStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true
    },

    approvedBy: {
      type: Number, // Manager userId
      index: true,
      default: null
    },

    approvedAt: {
      type: Date,
      default: null
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: null
    }
  },
  
  {
    collection: "projectDailyProgress",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
  }
);

export default mongoose.model(
  "ProjectDailyProgress",
  ProjectDailyProgressSchema
);