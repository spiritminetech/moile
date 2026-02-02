import express from 'express';
import supervisorNotificationController from './supervisorNotificationController.js';
import {
  verifyNotificationToken,
  authorizeNotificationOperation,
  addSecurityHeaders,
  sanitizeNotificationInput,
  securityAuditLogger,
  enforceCompanyAccess,
  notificationRateLimit
} from '../../middleware/notificationAuthMiddleware.js';

const router = express.Router();

/**
 * Supervisor Notification Management Routes
 * Implements Requirements 6.2, 10.4 (escalated notification handling, audit report generation)
 * All routes require supervisor or admin role
 */

// Apply security headers to all routes
router.use(addSecurityHeaders);

// Apply authentication middleware
router.use(verifyNotificationToken);

// Apply security audit logging
router.use(securityAuditLogger);

// Apply company-based access control
router.use(enforceCompanyAccess);

// Apply rate limiting
router.use(notificationRateLimit(50, 15 * 60 * 1000)); // 50 requests per 15 minutes

// Ensure only supervisors and admins can access these routes
router.use((req, res, next) => {
  console.log('🔍 Router Role Check Debug:', {
    userRole: req.user?.role,
    userId: req.user?.id,
    companyId: req.user?.companyId
  });
  
  const userRole = req.user.role?.toLowerCase(); // Convert to lowercase for comparison
  console.log('🔍 Normalized user role:', userRole);
  
  if (!['supervisor', 'admin', 'company_admin'].includes(userRole)) {
    console.log('❌ Router role check failed:', {
      userRole,
      allowedRoles: ['supervisor', 'admin', 'company_admin']
    });
    return res.status(403).json({
      success: false,
      error: 'ACCESS_DENIED',
      message: 'Only supervisors and administrators can access notification management features'
    });
  }
  
  console.log('✅ Router role check passed');
  next();
});

/**
 * @route   GET /api/supervisor/notifications/overview
 * @desc    Get notification overview for supervisor dashboard
 * @access  Private (Supervisors, Admins)
 * @query   { projectId, days }
 */
router.get('/overview',
  authorizeNotificationOperation('VIEW_SUPERVISOR_DASHBOARD', ['supervisor', 'admin', 'company_admin']),
  supervisorNotificationController.getNotificationOverview
);

/**
 * @route   GET /api/supervisor/notifications/escalated
 * @desc    Get escalated notifications requiring supervisor attention
 * @access  Private (Supervisors, Admins)
 * @query   { projectId, status, limit, offset, sortBy, sortOrder }
 */
router.get('/escalated',
  authorizeNotificationOperation('VIEW_ESCALATED_NOTIFICATIONS', ['supervisor', 'admin', 'company_admin']),
  supervisorNotificationController.getEscalatedNotifications
);

/**
 * @route   POST /api/supervisor/notifications/escalated/:id/handle
 * @desc    Handle escalated notification (acknowledge, reassign, resolve, escalate further)
 * @access  Private (Supervisors, Admins)
 * @param   id - Notification ID
 * @body    { action, notes, reassignTo }
 */
router.post('/escalated/:id/handle',
  authorizeNotificationOperation('HANDLE_ESCALATED_NOTIFICATIONS', ['supervisor', 'admin', 'company_admin']),
  sanitizeNotificationInput,
  supervisorNotificationController.handleEscalatedNotification
);

/**
 * @route   GET /api/supervisor/notifications/audit-report
 * @desc    Generate audit report for supervisor's notifications
 * @access  Private (Supervisors, Admins)
 * @query   { projectId, workerId, startDate, endDate, reportType, format, includeAuditTrail }
 */
router.get('/audit-report',
  authorizeNotificationOperation('GENERATE_AUDIT_REPORTS', ['supervisor', 'admin', 'company_admin']),
  supervisorNotificationController.generateAuditReport
);

/**
 * @route   GET /api/supervisor/notifications/statistics
 * @desc    Get notification statistics for supervisor dashboard
 * @access  Private (Supervisors, Admins)
 * @query   { projectId, period }
 */
router.get('/statistics',
  authorizeNotificationOperation('VIEW_NOTIFICATION_STATISTICS', ['supervisor', 'admin', 'company_admin']),
  supervisorNotificationController.getNotificationStatistics
);

export default router;