// Issue Escalation Model - For general site issues escalated to managers
// Requirements: 5.3 - Escalate Issues to Manager

import mongoose from 'mongoose';

const issueEscalationSchema = new mongoose.Schema({
  // Issue identification
  issueType: {
    type: String,
    enum: [
      'MANPOWER_SHORTAGE',
      'SAFETY_INCIDENT',
      'MATERIAL_DELAY',
      'MATERIAL_DAMAGE',
      'WORKER_MISCONDUCT',
      'EQUIPMENT_BREAKDOWN',
      'SITE_INSTRUCTION_CHANGE',
      'OTHER'
    ],
    required: true,
  },
  
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true,
    default: 'MEDIUM',
  },
  
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  
  // Escalation details
  escalateTo: {
    type: String,
    enum: ['MANAGER', 'ADMIN', 'BOSS'],
    required: true,
  },
  
  immediateActionRequired: {
    type: Boolean,
    default: false,
  },
  
  estimatedImpact: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  
  suggestedSolution: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  
  // Project and supervisor info
  projectId: {
    type: Number,
    required: true,
    ref: 'Project',
  },
  
  projectName: {
    type: String,
  },
  
  supervisorId: {
    type: Number,
    required: true,
    ref: 'Employee',
  },
  
  supervisorName: {
    type: String,
    required: true,
  },
  
  // Supporting documentation
  photos: [{
    type: String, // URLs or file paths
  }],
  
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'],
    default: 'PENDING',
  },
  
  // Response tracking
  acknowledgedAt: {
    type: Date,
  },
  
  acknowledgedBy: {
    type: Number,
    ref: 'User',
  },
  
  acknowledgedByName: {
    type: String,
  },
  
  resolvedAt: {
    type: Date,
  },
  
  resolvedBy: {
    type: Number,
    ref: 'User',
  },
  
  resolvedByName: {
    type: String,
  },
  
  resolution: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  
  // Audit trail
  statusHistory: [{
    status: String,
    changedBy: Number,
    changedByName: String,
    changedAt: Date,
    notes: String,
  }],
  
  // Notifications sent
  notificationsSent: [{
    recipient: String,
    recipientId: Number,
    sentAt: Date,
    type: String, // 'EMAIL', 'PUSH', 'SMS'
  }],
  
}, {
  timestamps: true,
  collection: 'issue_escalations',
});

// Indexes for efficient queries
issueEscalationSchema.index({ projectId: 1, status: 1 });
issueEscalationSchema.index({ supervisorId: 1, createdAt: -1 });
issueEscalationSchema.index({ severity: 1, status: 1 });
issueEscalationSchema.index({ issueType: 1 });
issueEscalationSchema.index({ escalateTo: 1, status: 1 });

// Virtual for age of escalation
issueEscalationSchema.virtual('ageInHours').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60));
});

// Method to check if escalation is overdue
issueEscalationSchema.methods.isOverdue = function() {
  const ageInHours = this.ageInHours;
  
  switch (this.severity) {
    case 'CRITICAL':
      return ageInHours > 2; // 2 hours for critical
    case 'HIGH':
      return ageInHours > 8; // 8 hours for high
    case 'MEDIUM':
      return ageInHours > 24; // 24 hours for medium
    case 'LOW':
      return ageInHours > 72; // 72 hours for low
    default:
      return false;
  }
};

// Method to add status change to history
issueEscalationSchema.methods.addStatusChange = function(newStatus, changedBy, changedByName, notes) {
  this.statusHistory.push({
    status: newStatus,
    changedBy,
    changedByName,
    changedAt: new Date(),
    notes: notes || '',
  });
  
  this.status = newStatus;
  
  // Update resolution tracking
  if (newStatus === 'ACKNOWLEDGED' && !this.acknowledgedAt) {
    this.acknowledgedAt = new Date();
    this.acknowledgedBy = changedBy;
    this.acknowledgedByName = changedByName;
  } else if (newStatus === 'RESOLVED' && !this.resolvedAt) {
    this.resolvedAt = new Date();
    this.resolvedBy = changedBy;
    this.resolvedByName = changedByName;
  }
};

// Static method to get escalation statistics
issueEscalationSchema.statics.getStatistics = async function(projectId, dateRange) {
  const query = { projectId };
  
  if (dateRange) {
    query.createdAt = {
      $gte: new Date(dateRange.from),
      $lte: new Date(dateRange.to),
    };
  }
  
  const [
    total,
    bySeverity,
    byType,
    byStatus,
  ] = await Promise.all([
    this.countDocuments(query),
    this.aggregate([
      { $match: query },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]),
    this.aggregate([
      { $match: query },
      { $group: { _id: '$issueType', count: { $sum: 1 } } },
    ]),
    this.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);
  
  return {
    total,
    bySeverity: bySeverity.reduce((acc, item) => {
      acc[item._id.toLowerCase()] = item.count;
      return acc;
    }, {}),
    byType: byType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    byStatus: byStatus.reduce((acc, item) => {
      acc[item._id.toLowerCase()] = item.count;
      return acc;
    }, {}),
  };
};

const IssueEscalation = mongoose.model('IssueEscalation', issueEscalationSchema);

export default IssueEscalation;
