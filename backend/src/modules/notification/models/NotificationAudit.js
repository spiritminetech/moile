import mongoose from 'mongoose';

/**
 * NotificationAudit Model
 * Immutable audit trail for all notification events
 * Maintains 7-year retention for compliance
 */
const NotificationAuditSchema = new mongoose.Schema({
  id: { 
    type: Number, 
    unique: true
  },
  notificationId: {
    type: Number,
    required: function() {
      // notificationId is not required for device registration events
      return !['DEVICE_REGISTERED', 'DEVICE_DEACTIVATED'].includes(this.event);
    },
    index: true
  },
  workerId: {
    type: Number,
    required: true,
    index: true
  },
  event: {
    type: String,
    required: true,
    enum: ['CREATED', 'SENT', 'DELIVERED', 'READ', 'ACKNOWLEDGED', 'FAILED', 'EXPIRED', 'ESCALATED', 'DEVICE_REGISTERED', 'DEVICE_DEACTIVATED', 'PERFORMANCE_METRIC', 'PERFORMANCE_ALERT', 'PARTIAL_FAILURE'],
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  metadata: {
    deviceToken: String,
    platform: {
      type: String,
      enum: ['ios', 'android', 'web']
    },
    errorCode: String,
    errorMessage: String,
    retryAttempt: Number,
    deliveryMethod: {
      type: String,
      enum: ['PUSH', 'IN_APP', 'SMS', 'EMAIL']
    },
    responseTime: Number, // milliseconds
    fcmMessageId: String,
    smsMessageId: String
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  },
  userAgent: String,
  // Content snapshot for audit integrity
  contentSnapshot: {
    type: String,
    required: true
  },
  // Hash of the audit record for integrity verification
  auditHash: {
    type: String
  }
}, {
  collection: 'notificationAudits',
  timestamps: { createdAt: true, updatedAt: false } // Immutable records
});

// Indexes for performance and compliance queries
NotificationAuditSchema.index({ notificationId: 1, timestamp: 1 });
NotificationAuditSchema.index({ workerId: 1, timestamp: -1 });
NotificationAuditSchema.index({ event: 1, timestamp: -1 });
NotificationAuditSchema.index({ timestamp: 1 }); // For retention queries
NotificationAuditSchema.index({ 'metadata.platform': 1, timestamp: -1 });

// 7-year retention index (7 years = 220752000 seconds)
NotificationAuditSchema.index({ createdAt: 1 }, { expireAfterSeconds: 220752000 });

// Auto-increment ID
NotificationAuditSchema.pre('save', async function(next) {
  if (this.isNew && !this.id) {
    try {
      const lastAudit = await this.constructor.findOne({}, {}, { sort: { id: -1 } });
      this.id = lastAudit ? lastAudit.id + 1 : 1;
      console.log('Generated NotificationAudit ID:', this.id);
    } catch (error) {
      console.error('Error generating NotificationAudit ID:', error);
      return next(error);
    }
  }
  next();
});

// Generate audit hash before saving
NotificationAuditSchema.pre('save', function(next) {
  if (this.isNew) {
    import('crypto').then(crypto => {
      const auditContent = `${this.notificationId}:${this.workerId}:${this.event}:${this.timestamp.toISOString()}:${this.contentSnapshot}`;
      this.auditHash = crypto.createHash('sha256').update(auditContent).digest('hex');
      next();
    }).catch(next);
  } else {
    next();
  }
});

// Prevent updates to audit records (immutable)
NotificationAuditSchema.pre('updateOne', function() {
  throw new Error('Audit records are immutable and cannot be updated');
});

NotificationAuditSchema.pre('updateMany', function() {
  throw new Error('Audit records are immutable and cannot be updated');
});

NotificationAuditSchema.pre('findOneAndUpdate', function() {
  throw new Error('Audit records are immutable and cannot be updated');
});

// Static methods
NotificationAuditSchema.statics.createAuditRecord = function(data) {
  const auditData = {
    ...data,
    contentSnapshot: JSON.stringify({
      notificationId: data.notificationId,
      event: data.event,
      timestamp: data.timestamp || new Date(),
      metadata: data.metadata || {}
    })
  };
  
  return this.create(auditData);
};

NotificationAuditSchema.statics.getNotificationHistory = function(notificationId) {
  return this.find({ notificationId }).sort({ timestamp: 1 });
};

NotificationAuditSchema.statics.getWorkerAuditTrail = function(workerId, startDate, endDate) {
  const query = { workerId };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  return this.find(query).sort({ timestamp: -1 });
};

NotificationAuditSchema.statics.getDeliveryMetrics = function(startDate, endDate) {
  const matchStage = {};
  if (startDate || endDate) {
    matchStage.timestamp = {};
    if (startDate) matchStage.timestamp.$gte = new Date(startDate);
    if (endDate) matchStage.timestamp.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$event',
        count: { $sum: 1 },
        avgResponseTime: { $avg: '$metadata.responseTime' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

NotificationAuditSchema.statics.verifyAuditIntegrity = function(auditId) {
  return this.findOne({ id: auditId }).then(audit => {
    if (!audit) return { valid: false, error: 'Audit record not found' };
    
    return import('crypto').then(crypto => {
      const auditContent = `${audit.notificationId}:${audit.workerId}:${audit.event}:${audit.timestamp.toISOString()}:${audit.contentSnapshot}`;
      const expectedHash = crypto.createHash('sha256').update(auditContent).digest('hex');
      
      return {
        valid: audit.auditHash === expectedHash,
        expectedHash,
        actualHash: audit.auditHash
      };
    });
  });
};

const NotificationAudit = mongoose.model('NotificationAudit', NotificationAuditSchema);

export default NotificationAudit;