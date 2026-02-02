import WorkerNotification from '../models/Notification.js';
import NotificationAudit from '../models/NotificationAudit.js';
import DeviceToken from '../models/DeviceToken.js';
import appConfig from '../../../config/app.config.js';

/**
 * NotificationSyncService
 * Handles notification synchronization, read receipt processing, and conflict resolution
 * Implements Requirements 8.5 - Read receipt and status synchronization with offline changes
 */
class NotificationSyncService {
  constructor() {
    this.config = appConfig.notification;
    this.syncBatchSize = 50;
    this.maxConflictResolutionAttempts = 3;
  }

  /**
   * Synchronize notification status changes from offline queue
   * @param {number} workerId - Worker ID requesting synchronization
   * @param {Array} statusUpdates - Array of status update objects from offline queue
   * @returns {Promise<Object>} Synchronization results with conflicts and resolutions
   */
  async synchronizeStatusUpdates(workerId, statusUpdates) {
    try {
      const results = {
        success: true,
        processed: 0,
        conflicts: 0,
        resolved: 0,
        failed: 0,
        errors: [],
        conflictResolutions: []
      };

      // Process updates in batches to avoid overwhelming the database
      for (let i = 0; i < statusUpdates.length; i += this.syncBatchSize) {
        const batch = statusUpdates.slice(i, i + this.syncBatchSize);
        const batchResults = await this.processSyncBatch(workerId, batch);
        
        // Aggregate results
        results.processed += batchResults.processed;
        results.conflicts += batchResults.conflicts;
        results.resolved += batchResults.resolved;
        results.failed += batchResults.failed;
        results.errors.push(...batchResults.errors);
        results.conflictResolutions.push(...batchResults.conflictResolutions);
      }

      // Create audit record for synchronization
      await NotificationAudit.createAuditRecord({
        notificationId: 0, // Special ID for sync operations
        workerId,
        event: 'SYNC_COMPLETED',
        ipAddress: '127.0.0.1', // Internal sync
        userAgent: 'NotificationSyncService',
        metadata: {
          totalUpdates: statusUpdates.length,
          processed: results.processed,
          conflicts: results.conflicts,
          resolved: results.resolved,
          failed: results.failed,
          syncType: 'STATUS_UPDATES'
        }
      });

      appConfig.log(`Notification sync completed for worker ${workerId}:`, results);
      return results;

    } catch (error) {
      appConfig.error('Error in synchronizeStatusUpdates:', error);
      throw error;
    }
  }

  /**
   * Process a batch of status updates
   * @param {number} workerId - Worker ID
   * @param {Array} batch - Batch of status updates
   * @returns {Promise<Object>} Batch processing results
   */
  async processSyncBatch(workerId, batch) {
    const results = {
      processed: 0,
      conflicts: 0,
      resolved: 0,
      failed: 0,
      errors: [],
      conflictResolutions: []
    };

    for (const update of batch) {
      try {
        const syncResult = await this.processSingleStatusUpdate(workerId, update);
        
        results.processed++;
        
        if (syncResult.hadConflict) {
          results.conflicts++;
          
          if (syncResult.resolved) {
            results.resolved++;
            results.conflictResolutions.push({
              notificationId: update.notificationId,
              conflictType: syncResult.conflictType,
              resolution: syncResult.resolution,
              finalStatus: syncResult.finalStatus
            });
          }
        }

      } catch (error) {
        results.failed++;
        results.errors.push({
          notificationId: update.notificationId,
          error: error.message,
          update: update
        });
        
        appConfig.error(`Failed to process status update for notification ${update.notificationId}:`, error);
      }
    }

    return results;
  }

  /**
   * Process a single status update with conflict resolution
   * @param {number} workerId - Worker ID
   * @param {Object} update - Status update object
   * @returns {Promise<Object>} Processing result
   */
  async processSingleStatusUpdate(workerId, update) {
    const {
      notificationId,
      status,
      timestamp,
      clientTimestamp,
      updateType, // 'READ', 'ACKNOWLEDGED', 'DISMISSED'
      deviceInfo,
      offlineQueueId
    } = update;

    // Fetch current notification state
    const notification = await WorkerNotification.findOne({
      id: notificationId,
      recipientId: workerId
    });

    if (!notification) {
      throw new Error(`Notification ${notificationId} not found for worker ${workerId}`);
    }

    // Check for conflicts
    const conflictAnalysis = this.analyzeConflict(notification, update);
    
    if (!conflictAnalysis.hasConflict) {
      // No conflict, apply update directly
      return await this.applyStatusUpdate(notification, update, conflictAnalysis);
    }

    // Handle conflict resolution
    return await this.resolveConflict(notification, update, conflictAnalysis);
  }

  /**
   * Analyze potential conflicts between current state and update
   * @param {Object} notification - Current notification from database
   * @param {Object} update - Incoming status update
   * @returns {Object} Conflict analysis result
   */
  analyzeConflict(notification, update) {
    const analysis = {
      hasConflict: false,
      conflictType: null,
      serverTimestamp: null,
      clientTimestamp: new Date(update.timestamp),
      currentStatus: notification.status,
      requestedStatus: update.status,
      canResolve: true,
      resolution: null
    };

    // Get relevant server timestamp based on update type
    switch (update.updateType) {
      case 'READ':
        analysis.serverTimestamp = notification.readAt;
        break;
      case 'ACKNOWLEDGED':
        analysis.serverTimestamp = notification.acknowledgedAt;
        break;
      default:
        analysis.serverTimestamp = notification.updatedAt;
    }

    // Check for timestamp conflicts
    if (analysis.serverTimestamp && analysis.serverTimestamp > analysis.clientTimestamp) {
      analysis.hasConflict = true;
      analysis.conflictType = 'TIMESTAMP_CONFLICT';
      
      // Determine if we can resolve based on status progression
      analysis.canResolve = this.canResolveStatusConflict(
        analysis.currentStatus,
        analysis.requestedStatus
      );
      
      if (analysis.canResolve) {
        analysis.resolution = this.determineConflictResolution(
          analysis.currentStatus,
          analysis.requestedStatus,
          analysis.serverTimestamp,
          analysis.clientTimestamp
        );
      }
    }

    // Check for status progression conflicts
    if (!analysis.hasConflict && !this.isValidStatusTransition(notification.status, update.status)) {
      analysis.hasConflict = true;
      analysis.conflictType = 'INVALID_STATUS_TRANSITION';
      analysis.canResolve = false; // Invalid transitions cannot be resolved
    }

    return analysis;
  }

  /**
   * Determine if a status conflict can be resolved
   * @param {string} currentStatus - Current notification status
   * @param {string} requestedStatus - Requested status from update
   * @returns {boolean} True if conflict can be resolved
   */
  canResolveStatusConflict(currentStatus, requestedStatus) {
    // Define resolvable status conflicts
    const resolvableConflicts = {
      'DELIVERED': ['READ', 'ACKNOWLEDGED'],
      'READ': ['ACKNOWLEDGED'],
      'SENT': ['READ', 'ACKNOWLEDGED']
    };

    return resolvableConflicts[currentStatus]?.includes(requestedStatus.toLowerCase()) || false;
  }

  /**
   * Determine conflict resolution strategy
   * @param {string} currentStatus - Current status
   * @param {string} requestedStatus - Requested status
   * @param {Date} serverTimestamp - Server timestamp
   * @param {Date} clientTimestamp - Client timestamp
   * @returns {string} Resolution strategy
   */
  determineConflictResolution(currentStatus, requestedStatus, serverTimestamp, clientTimestamp) {
    // Use "last write wins" with status progression validation
    if (this.isValidStatusTransition(currentStatus, requestedStatus)) {
      return 'APPLY_CLIENT_UPDATE';
    }
    
    // If client update is more recent but invalid transition, keep server state
    if (clientTimestamp > serverTimestamp) {
      return 'KEEP_SERVER_STATE_LOG_CONFLICT';
    }
    
    return 'KEEP_SERVER_STATE';
  }

  /**
   * Check if status transition is valid
   * @param {string} fromStatus - Current status
   * @param {string} toStatus - Target status
   * @returns {boolean} True if transition is valid
   */
  isValidStatusTransition(fromStatus, toStatus) {
    const validTransitions = {
      'PENDING': ['SENT', 'FAILED', 'EXPIRED'],
      'SENT': ['DELIVERED', 'READ', 'FAILED', 'EXPIRED'],
      'DELIVERED': ['READ', 'ACKNOWLEDGED', 'EXPIRED'],
      'READ': ['ACKNOWLEDGED', 'EXPIRED'],
      'ACKNOWLEDGED': ['EXPIRED'],
      'FAILED': ['SENT'], // Allow retry
      'EXPIRED': [] // Terminal state
    };

    return validTransitions[fromStatus]?.includes(toStatus) || false;
  }

  /**
   * Resolve conflict and apply appropriate update
   * @param {Object} notification - Notification document
   * @param {Object} update - Status update
   * @param {Object} conflictAnalysis - Conflict analysis result
   * @returns {Promise<Object>} Resolution result
   */
  async resolveConflict(notification, update, conflictAnalysis) {
    const result = {
      hadConflict: true,
      conflictType: conflictAnalysis.conflictType,
      resolved: false,
      resolution: null,
      finalStatus: notification.status
    };

    if (!conflictAnalysis.canResolve) {
      // Log unresolvable conflict
      await NotificationAudit.createAuditRecord({
        notificationId: notification.id,
        workerId: notification.recipientId,
        event: 'SYNC_CONFLICT_UNRESOLVABLE',
        ipAddress: '127.0.0.1',
        userAgent: 'NotificationSyncService',
        metadata: {
          conflictType: conflictAnalysis.conflictType,
          currentStatus: conflictAnalysis.currentStatus,
          requestedStatus: conflictAnalysis.requestedStatus,
          serverTimestamp: conflictAnalysis.serverTimestamp,
          clientTimestamp: conflictAnalysis.clientTimestamp,
          offlineQueueId: update.offlineQueueId
        }
      });

      return result;
    }

    // Apply resolution strategy
    switch (conflictAnalysis.resolution) {
      case 'APPLY_CLIENT_UPDATE':
        const updateResult = await this.applyStatusUpdate(notification, update, conflictAnalysis);
        result.resolved = true;
        result.resolution = 'CLIENT_UPDATE_APPLIED';
        result.finalStatus = updateResult.finalStatus;
        break;

      case 'KEEP_SERVER_STATE_LOG_CONFLICT':
        await NotificationAudit.createAuditRecord({
          notificationId: notification.id,
          workerId: notification.recipientId,
          event: 'SYNC_CONFLICT_RESOLVED',
          ipAddress: '127.0.0.1',
          userAgent: 'NotificationSyncService',
          metadata: {
            conflictType: conflictAnalysis.conflictType,
            resolution: 'SERVER_STATE_PRESERVED',
            clientTimestamp: conflictAnalysis.clientTimestamp,
            serverTimestamp: conflictAnalysis.serverTimestamp,
            offlineQueueId: update.offlineQueueId
          }
        });
        
        result.resolved = true;
        result.resolution = 'SERVER_STATE_PRESERVED';
        break;

      case 'KEEP_SERVER_STATE':
      default:
        result.resolved = true;
        result.resolution = 'SERVER_STATE_KEPT';
        break;
    }

    return result;
  }

  /**
   * Apply status update to notification
   * @param {Object} notification - Notification document
   * @param {Object} update - Status update
   * @param {Object} conflictAnalysis - Conflict analysis (optional)
   * @returns {Promise<Object>} Update result
   */
  async applyStatusUpdate(notification, update, conflictAnalysis = null) {
    const updateTimestamp = new Date(update.timestamp);
    let statusChanged = false;

    // Apply update based on type
    switch (update.updateType) {
      case 'READ':
        if (!notification.readAt || (conflictAnalysis?.resolution === 'APPLY_CLIENT_UPDATE')) {
          notification.readAt = updateTimestamp;
          if (notification.status === 'DELIVERED' || notification.status === 'SENT') {
            notification.status = 'READ';
            statusChanged = true;
          }
        }
        break;

      case 'ACKNOWLEDGED':
        if (notification.requiresAcknowledgment && 
            (!notification.acknowledgedAt || (conflictAnalysis?.resolution === 'APPLY_CLIENT_UPDATE'))) {
          notification.acknowledgedAt = updateTimestamp;
          notification.status = 'ACKNOWLEDGED';
          statusChanged = true;
          
          // Ensure readAt is also set if not already
          if (!notification.readAt) {
            notification.readAt = updateTimestamp;
          }
        }
        break;

      default:
        // Direct status update
        if (this.isValidStatusTransition(notification.status, update.status)) {
          notification.status = update.status;
          statusChanged = true;
        }
    }

    // Save changes
    await notification.save();

    // Create audit record for the update
    await NotificationAudit.createAuditRecord({
      notificationId: notification.id,
      workerId: notification.recipientId,
      event: update.updateType === 'READ' ? 'READ' : 
             update.updateType === 'ACKNOWLEDGED' ? 'ACKNOWLEDGED' : 'STATUS_UPDATED',
      ipAddress: '127.0.0.1',
      userAgent: 'NotificationSyncService',
      metadata: {
        syncUpdate: true,
        originalTimestamp: update.timestamp,
        clientTimestamp: update.clientTimestamp,
        deviceInfo: update.deviceInfo,
        offlineQueueId: update.offlineQueueId,
        hadConflict: !!conflictAnalysis?.hasConflict,
        conflictResolution: conflictAnalysis?.resolution,
        statusChanged
      }
    });

    return {
      hadConflict: !!conflictAnalysis?.hasConflict,
      resolved: true,
      finalStatus: notification.status,
      statusChanged
    };
  }

  /**
   * Synchronize read receipts from offline queue
   * @param {number} workerId - Worker ID
   * @param {Array} readReceipts - Array of read receipt objects
   * @returns {Promise<Object>} Synchronization results
   */
  async synchronizeReadReceipts(workerId, readReceipts) {
    try {
      const results = {
        success: true,
        processed: 0,
        duplicates: 0,
        failed: 0,
        errors: []
      };

      for (const receipt of readReceipts) {
        try {
          const notification = await WorkerNotification.findOne({
            id: receipt.notificationId,
            recipientId: workerId
          });

          if (!notification) {
            results.failed++;
            results.errors.push({
              notificationId: receipt.notificationId,
              error: 'Notification not found'
            });
            continue;
          }

          // Check if already processed
          if (notification.readAt && notification.readAt <= new Date(receipt.readAt)) {
            results.duplicates++;
            continue;
          }

          // Apply read receipt
          notification.readAt = new Date(receipt.readAt);
          if (notification.status === 'DELIVERED' || notification.status === 'SENT') {
            notification.status = 'READ';
          }
          
          await notification.save();

          // Create audit record
          await NotificationAudit.createAuditRecord({
            notificationId: notification.id,
            workerId,
            event: 'READ',
            ipAddress: '127.0.0.1',
            userAgent: 'NotificationSyncService',
            metadata: {
              syncedReadReceipt: true,
              originalReadAt: receipt.readAt,
              deviceInfo: receipt.deviceInfo,
              offlineQueueId: receipt.offlineQueueId
            }
          });

          results.processed++;

        } catch (error) {
          results.failed++;
          results.errors.push({
            notificationId: receipt.notificationId,
            error: error.message
          });
        }
      }

      appConfig.log(`Read receipt sync completed for worker ${workerId}:`, results);
      return results;

    } catch (error) {
      appConfig.error('Error in synchronizeReadReceipts:', error);
      throw error;
    }
  }

  /**
   * Get notifications that need synchronization for a worker
   * @param {number} workerId - Worker ID
   * @param {Date} lastSyncTimestamp - Last synchronization timestamp
   * @returns {Promise<Array>} Notifications that changed since last sync
   */
  async getNotificationsForSync(workerId, lastSyncTimestamp) {
    try {
      const query = {
        recipientId: workerId,
        updatedAt: { $gt: lastSyncTimestamp }
      };

      const notifications = await WorkerNotification.find(query)
        .sort({ updatedAt: 1 })
        .limit(this.syncBatchSize);

      return notifications.map(notification => ({
        id: notification.id,
        status: notification.status,
        readAt: notification.readAt,
        acknowledgedAt: notification.acknowledgedAt,
        updatedAt: notification.updatedAt,
        version: notification.__v // Mongoose version for optimistic locking
      }));

    } catch (error) {
      appConfig.error('Error in getNotificationsForSync:', error);
      throw error;
    }
  }

  /**
   * Clean up old sync audit records
   * @param {number} daysToKeep - Number of days to keep sync records
   * @returns {Promise<number>} Number of records cleaned up
   */
  async cleanupSyncAuditRecords(daysToKeep = 30) {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      
      const result = await NotificationAudit.deleteMany({
        event: { $in: ['SYNC_COMPLETED', 'SYNC_CONFLICT_RESOLVED', 'SYNC_CONFLICT_UNRESOLVABLE'] },
        createdAt: { $lt: cutoffDate }
      });

      appConfig.log(`Cleaned up ${result.deletedCount} old sync audit records`);
      return result.deletedCount;

    } catch (error) {
      appConfig.error('Error cleaning up sync audit records:', error);
      throw error;
    }
  }
}

export default new NotificationSyncService();