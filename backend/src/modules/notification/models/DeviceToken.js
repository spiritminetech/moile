import mongoose from 'mongoose';

/**
 * DeviceToken Model
 * Stores FCM device tokens for push notification delivery
 */
const DeviceTokenSchema = new mongoose.Schema({
  id: { 
    type: Number, 
    unique: true, 
    required: true 
  },
  workerId: {
    type: Number,
    required: true,
    index: true
  },
  deviceToken: {
    type: String,
    required: true,
    unique: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['ios', 'android'],
    index: true
  },
  appVersion: {
    type: String,
    required: true
  },
  osVersion: {
    type: String,
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastSeenAt: {
    type: Date,
    default: Date.now
  },
  notificationSettings: {
    pushEnabled: {
      type: Boolean,
      default: true
    },
    quietHoursStart: {
      type: String,
      default: '22:00',
      match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    quietHoursEnd: {
      type: String,
      default: '07:00',
      match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    criticalBypassQuietHours: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'zh', 'ms', 'ta']
    }
  },
  // Delivery statistics
  deliveryStats: {
    totalSent: {
      type: Number,
      default: 0
    },
    totalDelivered: {
      type: Number,
      default: 0
    },
    totalFailed: {
      type: Number,
      default: 0
    },
    lastDeliveryAt: Date,
    lastFailureAt: Date,
    consecutiveFailures: {
      type: Number,
      default: 0
    }
  }
}, {
  collection: 'deviceTokens',
  timestamps: true
});

// Indexes for performance
DeviceTokenSchema.index({ workerId: 1, isActive: 1 });
DeviceTokenSchema.index({ deviceToken: 1 }, { unique: true });
DeviceTokenSchema.index({ platform: 1, isActive: 1 });
DeviceTokenSchema.index({ lastSeenAt: 1 });
DeviceTokenSchema.index({ 'deliveryStats.consecutiveFailures': 1 });

// Auto-increment ID
DeviceTokenSchema.pre('save', async function(next) {
  if (this.isNew && !this.id) {
    try {
      const lastToken = await DeviceToken.findOne({}, {}, { sort: { id: -1 } });
      this.id = lastToken ? lastToken.id + 1 : 1;
      console.log('Generated DeviceToken ID:', this.id);
    } catch (error) {
      console.error('Error generating DeviceToken ID:', error);
      return next(error);
    }
  }
  next();
});

// Instance methods
DeviceTokenSchema.methods.updateLastSeen = function() {
  this.lastSeenAt = new Date();
  return this.save();
};

DeviceTokenSchema.methods.recordDeliverySuccess = function() {
  this.deliveryStats.totalSent += 1;
  this.deliveryStats.totalDelivered += 1;
  this.deliveryStats.lastDeliveryAt = new Date();
  this.deliveryStats.consecutiveFailures = 0;
  return this.save();
};

DeviceTokenSchema.methods.recordDeliveryFailure = function() {
  this.deliveryStats.totalSent += 1;
  this.deliveryStats.totalFailed += 1;
  this.deliveryStats.lastFailureAt = new Date();
  this.deliveryStats.consecutiveFailures += 1;
  
  // Deactivate token after 5 consecutive failures
  if (this.deliveryStats.consecutiveFailures >= 5) {
    this.isActive = false;
  }
  
  return this.save();
};

DeviceTokenSchema.methods.isInQuietHours = function() {
  if (!this.notificationSettings.pushEnabled) return true;
  
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const start = this.notificationSettings.quietHoursStart;
  const end = this.notificationSettings.quietHoursEnd;
  
  // Handle overnight quiet hours (e.g., 22:00 to 07:00)
  if (start > end) {
    return currentTime >= start || currentTime <= end;
  }
  
  // Handle same-day quiet hours (e.g., 12:00 to 14:00)
  return currentTime >= start && currentTime <= end;
};

DeviceTokenSchema.methods.canReceiveNotification = function(priority = 'NORMAL') {
  if (!this.isActive || !this.notificationSettings.pushEnabled) {
    return false;
  }
  
  // Critical notifications bypass quiet hours if enabled
  if (priority === 'CRITICAL' && this.notificationSettings.criticalBypassQuietHours) {
    return true;
  }
  
  return !this.isInQuietHours();
};

// Static methods
DeviceTokenSchema.statics.findActiveByWorker = function(workerId) {
  return this.find({
    workerId,
    isActive: true
  }).sort({ lastSeenAt: -1 });
};

DeviceTokenSchema.statics.findByToken = function(deviceToken) {
  return this.findOne({ deviceToken, isActive: true });
};

DeviceTokenSchema.statics.registerOrUpdateToken = function(tokenData) {
  return this.findOneAndUpdate(
    { deviceToken: tokenData.deviceToken },
    {
      ...tokenData,
      isActive: true,
      lastSeenAt: new Date()
    },
    { 
      upsert: true, 
      new: true,
      setDefaultsOnInsert: true
    }
  );
};

DeviceTokenSchema.statics.deactivateOldTokensForWorker = function(workerId, currentToken) {
  return this.updateMany(
    {
      workerId,
      deviceToken: { $ne: currentToken },
      isActive: true
    },
    { isActive: false }
  );
};

DeviceTokenSchema.statics.cleanupInactiveTokens = function(daysInactive = 30) {
  const cutoffDate = new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000);
  return this.deleteMany({
    $or: [
      { isActive: false },
      { lastSeenAt: { $lt: cutoffDate } },
      { 'deliveryStats.consecutiveFailures': { $gte: 10 } }
    ]
  });
};

DeviceTokenSchema.statics.getDeliveryStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$platform',
        totalTokens: { $sum: 1 },
        activeTokens: {
          $sum: { $cond: ['$isActive', 1, 0] }
        },
        avgDeliveryRate: {
          $avg: {
            $cond: [
              { $gt: ['$deliveryStats.totalSent', 0] },
              { $divide: ['$deliveryStats.totalDelivered', '$deliveryStats.totalSent'] },
              0
            ]
          }
        }
      }
    }
  ]);
};

const DeviceToken = mongoose.model('DeviceToken', DeviceTokenSchema);

export default DeviceToken;