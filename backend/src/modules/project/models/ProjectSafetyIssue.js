import mongoose from "mongoose";

const ProjectSafetyIssueSchema = new mongoose.Schema(
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

    type: {
      type: String,
      required: true,
      enum: ["safety", "quality", "delay", "resource"],
      index: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    severity: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "critical"],
      index: true
    },

    status: {
      type: String,
      required: true,
      enum: ["open", "in_progress", "resolved"],
      default: "open",
      index: true
    },

    location: {
      type: String,
      trim: true
    },

    reportedBy: {
      type: String,
      trim: true
    },

    actionTaken: {
      type: String,
      trim: true
    },

    photos: [
      {
        type: String,
        trim: true
      }
    ],

    resolvedAt: {
      type: Date
    },

    resolvedBy: {
      type: String,
      trim: true
    },

    resolutionNotes: {
      type: String,
      trim: true
    },

    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: "projectSafetyIssues",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
  }
);

// Compound indexes for efficient queries
ProjectSafetyIssueSchema.index({ projectId: 1, date: 1 });
ProjectSafetyIssueSchema.index({ supervisorId: 1, date: 1 });
ProjectSafetyIssueSchema.index({ projectId: 1, status: 1 });
ProjectSafetyIssueSchema.index({ severity: 1, status: 1 });

export default mongoose.model(
  "ProjectSafetyIssue",
  ProjectSafetyIssueSchema
);
