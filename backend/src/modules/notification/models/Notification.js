import mongoose from 'mongoose';
import SecurityUtil from '../../../utils/securityUtil.js';

/**
 * Notification Model
 * Stores all worker notifications with priority, delivery status, and audit trail
 * Implements Requirements 9.3 (encryption for notification content)
 */
const NotificationSchema = new mongoose.Schema({
  id: { 
    type: Number, 
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['TASK_UPDATE', 'SITE_CHANGE', 'ATTENDANCE_ALERT', 'APPROVAL_STATUS', 'HEALTH_CHECK'],
    index: true
  },
  priority: {
    type: String,
    required: true,
    enum: ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'],
    default: 'NORMAL',
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  },
  // Encrypted content storage (Requirements 9.3)
  encryptedTitle: {
    encrypted: String,
    iv: String,
    authTag: String
  },
  encryptedMessage: {
    encrypted: String,
    iv: String,
    authTag: String
  },
  isEncrypted: {
    type: Boolean,
    default: false
  },
  senderId: {
    type: Number,
    required: true,
    index: true
  },
  recipientId: {
    type: Number,
    required: true,
    index: true
  },
  actionData: {
    taskId: String,
    projectId: String,
    actionUrl: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  scheduledAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date
  },
  requiresAcknowledgment: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'ACKNOWLEDGED', 'FAILED', 'EXPIRED'],
    default: 'PENDING',
    index: true
  },
  deliveryAttempts: {
    type: Number,
    default: 0
  },
  lastAttemptAt: {
    type: Date
  },
  readAt: {
    type: Date
  },
  acknowledgedAt: {
    type: Date
  },
  // Escalation fields for critical notification escalation (Requirement 6.2)
  escalated: {
    type: Boolean,
    default: false,
    index: true
  },
  escalatedAt: {
    type: Date
  },
  escalationStatus: {
    type: String,
    enum: ['SUCCESS', 'FAILED']
  },
  escalationReason: {
    type: String
  },
  // Language support for localization
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'zh', 'ms', 'ta'] // English, Chinese, Malay, Tamil for Singapore
  },
  // Content hash for audit integrity
  contentHash: {
    type: String
  }
}, {
  collection: 'workerNotifications',
  timestamps: true
});

// Indexes for performance and queries
NotificationSchema.index({ recipientId: 1, status: 1 });
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, priority: 1 });
NotificationSchema.index({ scheduledAt: 1, status: 1 });
NotificationSchema.index({ priority: 1, status: 1, createdAt: 1 }); // For escalation queries
NotificationSchema.index({ escalated: 1, priority: 1, createdAt: 1 }); // For escalation processing
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Auto-increment ID
NotificationSchema.pre('save', async function(next) {
  if (this.isNew && !this.id) {
    try {
      const lastNotification = await this.constructor.findOne({}, {}, { sort: { id: -1 } });
      this.id = lastNotification ? lastNotification.id + 1 : 1;
      console.log('Generated Notification ID:', this.id);
    } catch (error) {
      console.error('Error generating Notification ID:', error);
      return next(error);
    }
  }
  next();
});

// Generate content hash before saving
NotificationSchema.pre('save', function(next) {
  if (this.isNew || this.isModified(['title', 'message', 'type', 'priority'])) {
    import('crypto').then(crypto => {
      const content = `${this.type}:${this.priority}:${this.title}:${this.message}`;
      this.contentHash = crypto.createHash('sha256').update(content).digest('hex');
      next();
    }).catch(next);
  } else {
    next();
  }
});

// Encryption middleware - encrypt sensitive content before saving
NotificationSchema.pre('save', function(next) {
  try {
    // Only encrypt if content has changed and encryption is enabled
    if ((this.isNew || this.isModified(['title', 'message'])) && 
        process.env.NOTIFICATION_ENCRYPTION_ENABLED === 'true') {
      
      // Encrypt title
      if (this.title) {
        this.encryptedTitle = SecurityUtil.encrypt(this.title);
      }
      
      // Encrypt message
      if (this.message) {
        this.encryptedMessage = SecurityUtil.encrypt(this.message);
      }
      
      this.isEncrypted = true;
      
      // Clear plaintext content after encryption
      this.title = '[ENCRYPTED]';
      this.message = '[ENCRYPTED]';
    }
    
    next();
  } catch (error) {
    console.error('Encryption error in notification pre-save:', error);
    next(error);
  }
});

// Instance methods
NotificationSchema.methods.isExpired = function() {
  return this.expiresAt && Date.now() >= this.expiresAt.getTime();
};

NotificationSchema.methods.getDecryptedContent = function() {
  try {
    if (!this.isEncrypted) {
      return {
        title: this.title,
        message: this.message
      };
    }

    let decryptedTitle = this.title;
    let decryptedMessage = this.message;

    if (this.encryptedTitle && this.encryptedTitle.encrypted) {
      decryptedTitle = SecurityUtil.decrypt(this.encryptedTitle);
    }

    if (this.encryptedMessage && this.encryptedMessage.encrypted) {
      decryptedMessage = SecurityUtil.decrypt(this.encryptedMessage);
    }

    return {
      title: decryptedTitle,
      message: decryptedMessage
    };
  } catch (error) {
    console.error('Decryption error:', error);
    return {
      title: '[DECRYPTION_ERROR]',
      message: '[DECRYPTION_ERROR]'
    };
  }
};

NotificationSchema.methods.toSecureJSON = function() {
  const obj = this.toObject();
  
  // Remove encrypted content from response
  delete obj.encryptedTitle;
  delete obj.encryptedMessage;
  delete obj.contentHash;
  
  // If encrypted, provide decrypted content
  if (this.isEncrypted) {
    const decrypted = this.getDecryptedContent();
    obj.title = decrypted.title;
    obj.message = decrypted.message;
  }
  
  return obj;
};

NotificationSchema.methods.markAsRead = function() {
  if (this.status === 'DELIVERED' || this.status === 'SENT') {
    this.status = 'READ';
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

NotificationSchema.methods.markAsAcknowledged = function() {
  if (this.requiresAcknowledgment && this.status === 'READ') {
    this.status = 'ACKNOWLEDGED';
    this.acknowledgedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

NotificationSchema.methods.incrementDeliveryAttempt = function() {
  this.deliveryAttempts += 1;
  this.lastAttemptAt = new Date();
  return this.save();
};

NotificationSchema.methods.markAsDelivered = function() {
  this.status = 'DELIVERED';
  return this.save();
};

NotificationSchema.methods.markAsFailed = function() {
  this.status = 'FAILED';
  return this.save();
};

// Static methods
NotificationSchema.statics.findByRecipient = function(recipientId, filters = {}) {
  const query = { recipientId, ...filters };
  return this.find(query).sort({ createdAt: -1 });
};

NotificationSchema.statics.findUnreadByRecipient = function(recipientId) {
  return this.find({
    recipientId,
    status: { $in: ['SENT', 'DELIVERED'] }
  }).sort({ createdAt: -1 });
};

NotificationSchema.statics.findCriticalUnacknowledged = function() {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  return this.find({
    priority: 'CRITICAL',
    requiresAcknowledgment: true,
    status: { $in: ['SENT', 'DELIVERED', 'READ'] },
    createdAt: { $lt: twoHoursAgo }
  });
};

NotificationSchema.statics.findCriticalUnreadForEscalation = function(timeoutMs = 2 * 60 * 60 * 1000) {
  const escalationCutoff = new Date(Date.now() - timeoutMs);
  return this.find({
    priority: 'CRITICAL',
    status: { $in: ['SENT', 'DELIVERED'] }, // Unread statuses
    createdAt: { $lt: escalationCutoff },
    // Ensure we haven't already escalated this notification
    $or: [
      { escalated: { $exists: false } },
      { escalated: false }
    ]
  });
};

NotificationSchema.statics.countDailyNotifications = function(recipientId, date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.countDocuments({
    recipientId,
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });
};

NotificationSchema.statics.cleanupExpired = function() {
  return this.updateMany(
    { 
      expiresAt: { $lt: new Date() },
      status: { $ne: 'EXPIRED' }
    },
    { status: 'EXPIRED' }
  );
};

const WorkerNotification = mongoose.model('WorkerNotification', NotificationSchema);

export default WorkerNotification;