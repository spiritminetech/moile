import express from 'express';
import notificationController from './notificationController.js';
import {
  verifyNotificationToken,
  authorizeNotificationOperation,
  validateNotificationAccess,
  notificationRateLimit,
  addSecurityHeaders,
  sanitizeNotificationInput,
  securityAuditLogger,
  enforceCompanyAccess
} from '../../middleware/notificationAuthMiddleware.js';

const router = express.Router();

/**
 * Notification Routes with Enhanced Security
 * All routes require JWT authentication and implement permission-based access control
 * Implements Requirements 9.1, 9.2, 9.4 (JWT validation, permission-based filtering, access control)
 */

// Apply security headers to all notification routes
router.use(addSecurityHeaders);

// Apply authentication middleware to all routes
router.use(verifyNotificationToken);

// Apply security audit logging
router.use(securityAuditLogger);

// Apply company-based access control
router.use(enforceCompanyAccess);

// Apply rate limiting to prevent abuse
router.use(notificationRateLimit(
  parseInt(process.env.NOTIFICATION_RATE_LIMIT_REQUESTS) || 100, 
  parseInt(process.env.NOTIFICATION_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000
));

/**
 * @route   POST /api/notifications
 * @desc    Create a new notification
 * @access  Private (Supervisors, Admins)
 * @body    { type, priority, recipients, title, message, actionData, expiresAt, requiresAcknowledgment, language }
 */
router.post('/', 
  authorizeNotificationOperation('CREATE_NOTIFICATION', ['supervisor', 'admin', 'company_admin']),
  sanitizeNotificationInput,
  notificationController.createNotification
);

/**
 * @route   GET /api/notifications
 * @desc    Get notifications for authenticated worker
 * @access  Private (Workers, Supervisors, Admins)
 * @query   { status, type, priority, limit, offset, startDate, endDate }
 */
router.get('/', 
  authorizeNotificationOperation('READ_NOTIFICATIONS'),
  notificationController.getNotifications
);

/**
 * @route   GET /api/notifications/history
 * @desc    Get notification history with enhanced filtering and search
 * @access  Private (Workers, Supervisors, Admins)
 * @query   { workerId, status, type, priority, limit, offset, startDate, endDate, readStatus, search, sortBy, sortOrder }
 */
router.get('/history', 
  authorizeNotificationOperation('READ_NOTIFICATIONS'),
  notificationController.getNotificationHistory
);

/**
 * @route   GET /api/notifications/audit
 * @desc    Get notification audit records with search and filtering
 * @access  Private (Supervisors, Admins)
 * @query   { workerId, notificationId, event, startDate, endDate, limit, offset, sortBy, sortOrder }
 */
router.get('/audit', 
  authorizeNotificationOperation('READ_AUDIT_RECORDS', ['supervisor', 'admin', 'company_admin']),
  notificationController.getNotificationAudit
);

/**
 * @route   GET /api/notifications/stats
 * @desc    Get notification statistics for authenticated worker
 * @access  Private (Workers, Supervisors, Admins)
 * @query   { days }
 */
router.get('/stats', 
  authorizeNotificationOperation('READ_NOTIFICATIONS'),
  notificationController.getNotificationStats
);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private (Workers, Supervisors, Admins)
 * @param   id - Notification ID
 */
router.put('/:id/read', 
  validateNotificationAccess,
  notificationController.markAsRead
);

/**
 * @route   PUT /api/notifications/:id/acknowledge
 * @desc    Acknowledge notification (for critical notifications)
 * @access  Private (Workers, Supervisors, Admins)
 * @param   id - Notification ID
 */
router.put('/:id/acknowledge', 
  validateNotificationAccess,
  notificationController.acknowledgeNotification
);

/**
 * @route   POST /api/notifications/register-device
 * @desc    Register device token for push notifications with enhanced validation
 * @access  Private (Workers, Supervisors, Admins)
 * @body    { deviceToken, platform, appVersion, osVersion, deviceId, notificationSettings }
 */
router.post('/register-device', 
  authorizeNotificationOperation('MANAGE_DEVICES'),
  sanitizeNotificationInput,
  notificationController.registerDevice
);

/**
 * @route   GET /api/notifications/availability
 * @desc    Check notification availability for authenticated worker
 * @access  Private (Workers, Supervisors, Admins)
 * @query   { priority }
 */
router.get('/availability', 
  authorizeNotificationOperation('READ_NOTIFICATIONS'),
  notificationController.checkNotificationAvailability
);

/**
 * @route   GET /api/notifications/limits/stats
 * @desc    Get daily notification limit statistics
 * @access  Private (Supervisors, Admins)
 * @query   { workerIds }
 */
router.get('/limits/stats', 
  authorizeNotificationOperation('VIEW_LIMIT_STATS', ['supervisor', 'admin', 'company_admin']),
  notificationController.getDailyLimitStats
);

/**
 * @route   GET /api/notifications/limits/enforcement/:workerId?
 * @desc    Check daily limit enforcement for a worker
 * @access  Private (Workers can check own, Supervisors/Admins can check others)
 * @param   workerId - Worker ID (optional, defaults to authenticated user)
 */
router.get('/limits/enforcement/:workerId?', 
  authorizeNotificationOperation('READ_NOTIFICATIONS'),
  notificationController.checkDailyLimitEnforcement
);

/**
 * @route   GET /api/notifications/health
 * @desc    Get FCM service health status
 * @access  Private (Admins, Supervisors)
 */
router.get('/health', 
  authorizeNotificationOperation('VIEW_HEALTH_STATUS', ['supervisor', 'admin', 'company_admin']),
  notificationController.getServiceHealth
);

/**
 * @route   GET /api/notifications/devices
 * @desc    Get worker's registered device tokens
 * @access  Private (Workers, Supervisors, Admins)
 */
router.get('/devices', 
  authorizeNotificationOperation('MANAGE_DEVICES'),
  notificationController.getWorkerDevices
);

/**
 * @route   DELETE /api/notifications/devices/:token
 * @desc    Deactivate a specific device token
 * @access  Private (Workers, Supervisors, Admins)
 * @param   token - Device token to deactivate
 */
router.delete('/devices/:token', 
  authorizeNotificationOperation('MANAGE_DEVICES'),
  notificationController.deactivateDevice
);

/**
 * @route   POST /api/notifications/sync/status
 * @desc    Synchronize notification status updates from offline queue
 * @access  Private (Workers, Supervisors, Admins)
 * @body    { statusUpdates, lastSyncTimestamp }
 */
router.post('/sync/status', 
  authorizeNotificationOperation('SYNC_NOTIFICATIONS'),
  sanitizeNotificationInput,
  notificationController.synchronizeStatusUpdates
);

/**
 * @route   POST /api/notifications/sync/read-receipts
 * @desc    Synchronize read receipts from offline queue
 * @access  Private (Workers, Supervisors, Admins)
 * @body    { readReceipts }
 */
router.post('/sync/read-receipts', 
  authorizeNotificationOperation('SYNC_NOTIFICATIONS'),
  sanitizeNotificationInput,
  notificationController.synchronizeReadReceipts
);

/**
 * @route   GET /api/notifications/sync/updates
 * @desc    Get notifications updated since last sync
 * @access  Private (Workers, Supervisors, Admins)
 * @query   { lastSyncTimestamp }
 */
router.get('/sync/updates', 
  authorizeNotificationOperation('SYNC_NOTIFICATIONS'),
  notificationController.getNotificationUpdates
);

/**
 * @route   GET /api/notifications/escalation/stats
 * @desc    Get escalation statistics
 * @access  Private (Supervisors, Admins)
 * @query   { days }
 */
router.get('/escalation/stats', 
  authorizeNotificationOperation('VIEW_ESCALATION_STATS', ['supervisor', 'admin', 'company_admin']),
  notificationController.getEscalationStats
);

/**
 * @route   POST /api/notifications/escalation/trigger
 * @desc    Manually trigger escalation check
 * @access  Private (Admins)
 */
router.post('/escalation/trigger', 
  authorizeNotificationOperation('TRIGGER_ESCALATION', ['admin', 'company_admin']),
  notificationController.triggerEscalationCheck
);

/**
 * @route   POST /api/notifications/escalation/force/:id
 * @desc    Force escalation of a specific notification
 * @access  Private (Admins)
 * @param   id - Notification ID to escalate
 */
router.post('/escalation/force/:id', 
  authorizeNotificationOperation('TRIGGER_ESCALATION', ['admin', 'company_admin']),
  notificationController.forceEscalateNotification
);

/**
 * @route   GET /api/notifications/escalation/status
 * @desc    Get escalation service status
 * @access  Private (Supervisors, Admins)
 */
router.get('/escalation/status', 
  authorizeNotificationOperation('VIEW_ESCALATION_STATUS', ['supervisor', 'admin', 'company_admin']),
  notificationController.getEscalationServiceStatus
);

/**
 * Performance Monitoring Routes
 * Implements Requirements 11.1, 11.2, 11.3, 11.4 (performance monitoring and optimization)
 */

/**
 * @route   GET /api/notifications/performance/metrics
 * @desc    Get performance metrics and system status
 * @access  Private (Supervisors, Admins)
 * @query   { hours }
 */
router.get('/performance/metrics', 
  authorizeNotificationOperation('VIEW_PERFORMANCE_METRICS', ['supervisor', 'admin', 'company_admin']),
  notificationController.getPerformanceMetrics
);

/**
 * @route   GET /api/notifications/performance/load
 * @desc    Get system load status for 1000+ concurrent workers
 * @access  Private (Supervisors, Admins)
 */
router.get('/performance/load', 
  authorizeNotificationOperation('VIEW_PERFORMANCE_METRICS', ['supervisor', 'admin', 'company_admin']),
  notificationController.getSystemLoad
);

/**
 * @route   GET /api/notifications/performance/uptime
 * @desc    Get uptime statistics for business hours monitoring
 * @access  Private (Supervisors, Admins)
 * @query   { days }
 */
router.get('/performance/uptime', 
  authorizeNotificationOperation('VIEW_PERFORMANCE_METRICS', ['supervisor', 'admin', 'company_admin']),
  notificationController.getUptimeStats
);

/**
 * @route   GET /api/notifications/performance/delivery-times
 * @desc    Get notification delivery time analytics
 * @access  Private (Supervisors, Admins)
 * @query   { hours, priority, type }
 */
router.get('/performance/delivery-times', 
  authorizeNotificationOperation('VIEW_PERFORMANCE_METRICS', ['supervisor', 'admin', 'company_admin']),
  notificationController.getDeliveryTimeAnalytics
);

/**
 * @route   POST /api/notifications/performance/optimize
 * @desc    Trigger performance optimization
 * @access  Private (Admins only)
 */
router.post('/performance/optimize', 
  authorizeNotificationOperation('TRIGGER_OPTIMIZATION', ['admin']),
  notificationController.triggerPerformanceOptimization
);

/**
 * @route   GET /api/notifications/performance/alerts
 * @desc    Get performance alerts and system warnings
 * @access  Private (Supervisors, Admins)
 * @query   { hours, severity }
 */
router.get('/performance/alerts', 
  authorizeNotificationOperation('VIEW_PERFORMANCE_METRICS', ['supervisor', 'admin', 'company_admin']),
  notificationController.getPerformanceAlerts
);

/**
 * Error Handling Routes
 * Implements Requirements 12.1, 12.2, 12.3, 12.4 (comprehensive error handling system)
 */

/**
 * @route   GET /api/notifications/error-handling/status
 * @desc    Get error handling system status and statistics
 * @access  Private (Supervisors, Admins)
 * @query   { hours }
 */
router.get('/error-handling/status', 
  authorizeNotificationOperation('VIEW_ERROR_HANDLING', ['supervisor', 'admin', 'company_admin']),
  notificationController.getErrorHandlingStatus
);

/**
 * @route   GET /api/notifications/error-handling/circuit-breakers
 * @desc    Get circuit breaker statuses for all services
 * @access  Private (Supervisors, Admins)
 */
router.get('/error-handling/circuit-breakers', 
  authorizeNotificationOperation('VIEW_ERROR_HANDLING', ['supervisor', 'admin', 'company_admin']),
  notificationController.getCircuitBreakerStatus
);

/**
 * @route   POST /api/notifications/error-handling/circuit-breakers/:serviceName/reset
 * @desc    Reset circuit breaker for a specific service
 * @access  Private (Admins only)
 * @param   serviceName - Name of the service to reset
 */
router.post('/error-handling/circuit-breakers/:serviceName/reset', 
  authorizeNotificationOperation('RESET_CIRCUIT_BREAKER', ['admin']),
  notificationController.resetCircuitBreaker
);

/**
 * @route   GET /api/notifications/error-handling/admin-alerts
 * @desc    Get admin alerts from error handling system
 * @access  Private (Supervisors, Admins)
 * @query   { limit, severity }
 */
router.get('/error-handling/admin-alerts', 
  authorizeNotificationOperation('VIEW_ERROR_HANDLING', ['supervisor', 'admin', 'company_admin']),
  notificationController.getAdminAlerts
);

/**
 * @route   PUT /api/notifications/error-handling/admin-alerts/:alertId/acknowledge
 * @desc    Acknowledge admin alert
 * @access  Private (Supervisors, Admins)
 * @param   alertId - Alert ID to acknowledge
 */
router.put('/error-handling/admin-alerts/:alertId/acknowledge', 
  authorizeNotificationOperation('ACKNOWLEDGE_ADMIN_ALERT', ['supervisor', 'admin', 'company_admin']),
  notificationController.acknowledgeAdminAlert
);

export default router;