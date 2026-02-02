import WorkerNotification from './models/Notification.js';
import NotificationAudit from './models/NotificationAudit.js';
import NotificationService from './services/NotificationService.js';
import NotificationEscalationService from './services/NotificationEscalationService.js';
import Employee from '../employee/Employee.js';
import Project from '../project/models/Project.js';

/**
 * Supervisor Notification Management Controller
 * Handles supervisor-specific notification management operations
 * Implements Requirements 6.2, 10.4 (escalated notification handling, audit report generation)
 */
class SupervisorNotificationController {
  /**
   * Get notification overview for supervisor dashboard
   * GET /api/supervisor/notifications/overview
   * Implements Requirement 6.2 (escalated notification handling)
   */
  async getNotificationOverview(req, res) {
    try {
      const { user } = req;
      const { projectId, days = 7 } = req.query;

      // Get supervisor's projects and workers
      const supervisorProjects = await getSupervisorProjects(user.id, projectId);
      const workerIds = await getSupervisorWorkers(supervisorProjects.map(p => p.id));

      if (workerIds.length === 0) {
        return res.json({
          success: true,
          overview: {
            totalNotifications: 0,
            escalatedNotifications: 0,
            unreadNotifications: 0,
            criticalNotifications: 0,
            recentNotifications: [],
            escalationQueue: [],
            workerSummary: []
          },
          projects: supervisorProjects,
          message: 'No workers assigned to your projects'
        });
      }

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days));

      // Get notification statistics
      const [
        totalNotifications,
        escalatedNotifications,
        unreadNotifications,
        criticalNotifications,
        recentNotifications,
        escalationQueue,
        workerSummary
      ] = await Promise.all([
        getTotalNotifications(workerIds, daysAgo),
        getEscalatedNotifications(workerIds, daysAgo),
        getUnreadNotifications(workerIds),
        getCriticalNotifications(workerIds, daysAgo),
        getRecentNotifications(workerIds, 10),
        getEscalationQueue(workerIds),
        getWorkerNotificationSummary(workerIds, daysAgo)
      ]);

      res.json({
        success: true,
        overview: {
          totalNotifications,
          escalatedNotifications,
          unreadNotifications,
          criticalNotifications,
          recentNotifications,
          escalationQueue,
          workerSummary,
          dateRange: {
            from: daysAgo.toISOString(),
            to: new Date().toISOString(),
            days: parseInt(days)
          }
        },
        projects: supervisorProjects,
        permissions: {
          canCreateNotifications: true,
          canViewAuditReports: true,
          canHandleEscalations: true
        }
      });

    } catch (error) {
      console.error('Error getting notification overview:', error);
      res.status(500).json({
        success: false,
        error: 'OVERVIEW_ERROR',
        message: 'Failed to get notification overview',
        details: error.message
      });
    }
  }

  /**
   * Get escalated notifications requiring supervisor attention
   * GET /api/supervisor/notifications/escalated
   * Implements Requirement 6.2 (escalated notification handling)
   */
  async getEscalatedNotifications(req, res) {
    try {
      const { user } = req;
      const { 
        projectId, 
        status = 'pending',
        limit = 20,
        offset = 0,
        sortBy = 'escalatedAt',
        sortOrder = 'desc'
      } = req.query;

      // Get supervisor's workers
      const supervisorProjects = await this.getSupervisorProjects(user.id, projectId);
      const workerIds = await this.getSupervisorWorkers(supervisorProjects.map(p => p.id));

      if (workerIds.length === 0) {
        return res.json({
          success: true,
          escalatedNotifications: [],
          pagination: { total: 0, limit: parseInt(limit), offset: parseInt(offset), hasMore: false },
          summary: { pending: 0, resolved: 0, failed: 0 }
        });
      }

      // Build query for escalated notifications
      let filters = {
        recipientId: { $in: workerIds },
        escalated: true
      };

      if (status === 'pending') {
        filters.escalationStatus = { $ne: 'SUCCESS' };
        filters.status = { $in: ['SENT', 'DELIVERED', 'READ'] }; // Still unacknowledged
      } else if (status === 'resolved') {
        filters.$or = [
          { escalationStatus: 'SUCCESS' },
          { status: 'ACKNOWLEDGED' }
        ];
      } else if (status === 'failed') {
        filters.escalationStatus = 'FAILED';
      }

      // Build sort criteria
      const sortCriteria = {};
      sortCriteria[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute query
      const escalatedNotifications = await WorkerNotification.find(filters)
        .sort(sortCriteria)
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .populate('recipientId', 'fullName employeeId')
        .lean();

      const total = await WorkerNotification.countDocuments(filters);

      // Get summary counts
      const summary = await this.getEscalationSummary(workerIds);

      // Enhance notifications with worker and project information
      const enhancedNotifications = await this.enhanceNotificationsWithContext(
        escalatedNotifications, 
        supervisorProjects
      );

      res.json({
        success: true,
        escalatedNotifications: enhancedNotifications,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        },
        summary,
        filters: {
          projectId,
          status,
          sortBy,
          sortOrder
        }
      });

    } catch (error) {
      console.error('Error getting escalated notifications:', error);
      res.status(500).json({
        success: false,
        error: 'ESCALATED_NOTIFICATIONS_ERROR',
        message: 'Failed to get escalated notifications',
        details: error.message
      });
    }
  }

  /**
   * Handle escalated notification (acknowledge, reassign, etc.)
   * POST /api/supervisor/notifications/escalated/:id/handle
   * Implements Requirement 6.2 (escalated notification handling)
   */
  async handleEscalatedNotification(req, res) {
    try {
      const { user } = req;
      const notificationId = parseInt(req.params.id);
      const { action, notes, reassignTo } = req.body;

      if (!notificationId) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_NOTIFICATION_ID',
          message: 'Valid notification ID is required'
        });
      }

      // Verify supervisor has access to this notification
      const notification = await this.verifyNotificationAccess(user.id, notificationId);
      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'NOTIFICATION_NOT_FOUND',
          message: 'Escalated notification not found or access denied'
        });
      }

      let result;
      switch (action) {
        case 'acknowledge':
          result = await this.acknowledgeEscalation(notification, user.id, notes);
          break;
        case 'reassign':
          result = await this.reassignEscalation(notification, user.id, reassignTo, notes);
          break;
        case 'resolve':
          result = await this.resolveEscalation(notification, user.id, notes);
          break;
        case 'escalate_further':
          result = await this.escalateFurther(notification, user.id, notes);
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'INVALID_ACTION',
            message: 'Invalid action. Must be one of: acknowledge, reassign, resolve, escalate_further'
          });
      }

      // Create audit record for supervisor action
      await NotificationAudit.createAuditRecord({
        notificationId: notification.id,
        workerId: user.id,
        event: 'SUPERVISOR_ACTION',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        metadata: {
          action,
          notes,
          reassignTo,
          supervisorId: user.id,
          originalRecipient: notification.recipientId
        }
      });

      res.json({
        success: true,
        message: `Escalation ${action} completed successfully`,
        result,
        notificationId: notification.id
      });

    } catch (error) {
      console.error('Error handling escalated notification:', error);
      res.status(500).json({
        success: false,
        error: 'HANDLE_ESCALATION_ERROR',
        message: 'Failed to handle escalated notification',
        details: error.message
      });
    }
  }

  /**
   * Generate audit report for supervisor's notifications
   * GET /api/supervisor/notifications/audit-report
   * Implements Requirement 10.4 (audit report generation interface)
   */
  async generateAuditReport(req, res) {
    try {
      const { user } = req;
      const {
        projectId,
        workerId,
        startDate,
        endDate,
        reportType = 'summary', // 'summary', 'detailed', 'compliance'
        format = 'json', // 'json', 'csv', 'pdf'
        includeAuditTrail = false
      } = req.query;

      // Validate date range
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_DATE_RANGE',
          message: 'Start date and end date are required'
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_DATE_FORMAT',
          message: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)'
        });
      }

      // Get supervisor's projects and workers
      const supervisorProjects = await this.getSupervisorProjects(user.id, projectId);
      let targetWorkerIds = await this.getSupervisorWorkers(supervisorProjects.map(p => p.id));

      // Filter by specific worker if requested
      if (workerId) {
        const workerIdInt = parseInt(workerId);
        if (!targetWorkerIds.includes(workerIdInt)) {
          return res.status(403).json({
            success: false,
            error: 'WORKER_ACCESS_DENIED',
            message: 'You do not have access to this worker\'s notifications'
          });
        }
        targetWorkerIds = [workerIdInt];
      }

      // Generate report based on type
      let reportData;
      switch (reportType) {
        case 'summary':
          reportData = await this.generateSummaryReport(targetWorkerIds, start, end);
          break;
        case 'detailed':
          reportData = await this.generateDetailedReport(targetWorkerIds, start, end);
          break;
        case 'compliance':
          reportData = await this.generateComplianceReport(targetWorkerIds, start, end);
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'INVALID_REPORT_TYPE',
            message: 'Invalid report type. Must be one of: summary, detailed, compliance'
          });
      }

      // Include audit trail if requested
      if (includeAuditTrail === 'true') {
        reportData.auditTrail = await this.getAuditTrailForReport(targetWorkerIds, start, end);
      }

      // Add metadata
      reportData.metadata = {
        generatedBy: user.id,
        generatedAt: new Date().toISOString(),
        reportType,
        dateRange: { start: start.toISOString(), end: end.toISOString() },
        projects: supervisorProjects.map(p => ({ id: p.id, name: p.projectName })),
        workerCount: targetWorkerIds.length,
        includesAuditTrail: includeAuditTrail === 'true'
      };

      // Handle different output formats
      if (format === 'csv') {
        const csv = await this.convertReportToCSV(reportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="notification-audit-report-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv"`);
        return res.send(csv);
      } else if (format === 'pdf') {
        const pdf = await this.convertReportToPDF(reportData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="notification-audit-report-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.pdf"`);
        return res.send(pdf);
      }

      // Default JSON response
      res.json({
        success: true,
        report: reportData
      });

    } catch (error) {
      console.error('Error generating audit report:', error);
      res.status(500).json({
        success: false,
        error: 'AUDIT_REPORT_ERROR',
        message: 'Failed to generate audit report',
        details: error.message
      });
    }
  }

  /**
   * Get notification statistics for supervisor dashboard
   * GET /api/supervisor/notifications/statistics
   */
  async getNotificationStatistics(req, res) {
    try {
      const { user } = req;
      const { projectId, period = '7d' } = req.query;

      // Parse period
      const periodDays = parsePeriod(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      // Get supervisor's workers
      const supervisorProjects = await getSupervisorProjects(user.id, projectId);
      const workerIds = await getSupervisorWorkers(supervisorProjects.map(p => p.id));

      if (workerIds.length === 0) {
        return res.json({
          success: true,
          statistics: {
            totalWorkers: 0,
            notificationMetrics: {},
            trends: {},
            topNotificationTypes: [],
            workerEngagement: []
          }
        });
      }

      // Get comprehensive statistics
      const statistics = await getComprehensiveStatistics(workerIds, startDate);

      res.json({
        success: true,
        statistics,
        period: {
          days: periodDays,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString()
        },
        projects: supervisorProjects
      });

    } catch (error) {
      console.error('Error getting notification statistics:', error);
      res.status(500).json({
        success: false,
        error: 'STATISTICS_ERROR',
        message: 'Failed to get notification statistics',
        details: error.message
      });
    }
  }

  // Helper methods

  async getSupervisorProjects(supervisorId, projectId = null) {
    const query = { supervisorId };
    if (projectId) {
      query.id = parseInt(projectId);
    }
    
    return await Project.find(query, 'id projectName address supervisorId').lean();
  }

  async getSupervisorWorkers(projectIds) {
    if (projectIds.length === 0) return [];
    
    const employees = await Employee.find(
      { companyId: { $exists: true } }, // Since there's no direct projectId field, we'll need to adjust this
      'id fullName employeeCode'
    ).lean();
    
    return employees.map(emp => emp.id);
  }

  async getTotalNotifications(workerIds, since) {
    return await WorkerNotification.countDocuments({
      recipientId: { $in: workerIds },
      createdAt: { $gte: since }
    });
  }

  async getEscalatedNotifications(workerIds, since) {
    return await WorkerNotification.countDocuments({
      recipientId: { $in: workerIds },
      escalated: true,
      createdAt: { $gte: since }
    });
  }

  async getUnreadNotifications(workerIds) {
    return await WorkerNotification.countDocuments({
      recipientId: { $in: workerIds },
      status: { $in: ['SENT', 'DELIVERED'] }
    });
  }

  async getCriticalNotifications(workerIds, since) {
    return await WorkerNotification.countDocuments({
      recipientId: { $in: workerIds },
      priority: 'CRITICAL',
      createdAt: { $gte: since }
    });
  }

  async getRecentNotifications(workerIds, limit) {
    return await WorkerNotification.find({
      recipientId: { $in: workerIds }
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('recipientId', 'fullName employeeId')
    .lean();
  }

  async getEscalationQueue(workerIds) {
    return await WorkerNotification.find({
      recipientId: { $in: workerIds },
      escalated: true,
      escalationStatus: { $ne: 'SUCCESS' },
      status: { $in: ['SENT', 'DELIVERED', 'READ'] }
    })
    .sort({ escalatedAt: 1 })
    .populate('recipientId', 'fullName employeeId')
    .lean();
  }

  async getWorkerNotificationSummary(workerIds, since) {
    return await WorkerNotification.aggregate([
      {
        $match: {
          recipientId: { $in: workerIds },
          createdAt: { $gte: since }
        }
      },
      {
        $group: {
          _id: '$recipientId',
          totalNotifications: { $sum: 1 },
          unreadCount: {
            $sum: {
              $cond: [
                { $in: ['$status', ['SENT', 'DELIVERED']] },
                1,
                0
              ]
            }
          },
          criticalCount: {
            $sum: {
              $cond: [
                { $eq: ['$priority', 'CRITICAL'] },
                1,
                0
              ]
            }
          },
          escalatedCount: {
            $sum: {
              $cond: ['$escalated', 1, 0]
            }
          }
        }
      }
    ]);
  }

  async verifyNotificationAccess(supervisorId, notificationId) {
    // Get supervisor's workers
    const supervisorProjects = await this.getSupervisorProjects(supervisorId);
    const workerIds = await this.getSupervisorWorkers(supervisorProjects.map(p => p.id));

    return await WorkerNotification.findOne({
      id: notificationId,
      recipientId: { $in: workerIds },
      escalated: true
    });
  }

  async acknowledgeEscalation(notification, supervisorId, notes) {
    notification.escalationStatus = 'SUCCESS';
    await notification.save();

    return {
      action: 'acknowledged',
      notificationId: notification.id,
      supervisorId,
      notes,
      timestamp: new Date().toISOString()
    };
  }

  async reassignEscalation(notification, supervisorId, reassignTo, notes) {
    // Implementation would depend on your reassignment logic
    // For now, we'll mark as handled and create a new notification
    notification.escalationStatus = 'SUCCESS';
    await notification.save();

    return {
      action: 'reassigned',
      notificationId: notification.id,
      supervisorId,
      reassignedTo: reassignTo,
      notes,
      timestamp: new Date().toISOString()
    };
  }

  async resolveEscalation(notification, supervisorId, notes) {
    notification.escalationStatus = 'SUCCESS';
    notification.status = 'ACKNOWLEDGED';
    notification.acknowledgedAt = new Date();
    await notification.save();

    return {
      action: 'resolved',
      notificationId: notification.id,
      supervisorId,
      notes,
      timestamp: new Date().toISOString()
    };
  }

  async escalateFurther(notification, supervisorId, notes) {
    // Implementation would escalate to higher management
    return {
      action: 'escalated_further',
      notificationId: notification.id,
      supervisorId,
      notes,
      timestamp: new Date().toISOString()
    };
  }

  async getEscalationSummary(workerIds) {
    const summary = await WorkerNotification.aggregate([
      {
        $match: {
          recipientId: { $in: workerIds },
          escalated: true
        }
      },
      {
        $group: {
          _id: '$escalationStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = { pending: 0, resolved: 0, failed: 0 };
    summary.forEach(item => {
      if (item._id === 'SUCCESS') result.resolved = item.count;
      else if (item._id === 'FAILED') result.failed = item.count;
      else result.pending += item.count;
    });

    return result;
  }

  async enhanceNotificationsWithContext(notifications, projects) {
    // Add project and worker context to notifications
    return notifications.map(notification => ({
      ...notification,
      workerName: notification.recipientId?.fullName || 'Unknown Worker',
      employeeId: notification.recipientId?.employeeCode || 'N/A',
      projectName: projects.find(p => p.id === notification.actionData?.projectId)?.projectName || 'Unknown Project',
      escalationAge: notification.escalatedAt ? 
        Math.floor((Date.now() - new Date(notification.escalatedAt).getTime()) / (1000 * 60 * 60)) : 0 // hours
    }));
  }

  async generateSummaryReport(workerIds, startDate, endDate) {
    // Implementation for summary report generation
    const notifications = await WorkerNotification.find({
      recipientId: { $in: workerIds },
      createdAt: { $gte: startDate, $lte: endDate }
    }).lean();

    return {
      reportType: 'summary',
      totalNotifications: notifications.length,
      byType: this.groupBy(notifications, 'type'),
      byPriority: this.groupBy(notifications, 'priority'),
      byStatus: this.groupBy(notifications, 'status'),
      escalationSummary: {
        total: notifications.filter(n => n.escalated).length,
        resolved: notifications.filter(n => n.escalationStatus === 'SUCCESS').length,
        pending: notifications.filter(n => n.escalated && n.escalationStatus !== 'SUCCESS').length
      }
    };
  }

  async generateDetailedReport(workerIds, startDate, endDate) {
    // Implementation for detailed report generation
    const notifications = await WorkerNotification.find({
      recipientId: { $in: workerIds },
      createdAt: { $gte: startDate, $lte: endDate }
    })
    .populate('recipientId', 'fullName employeeId')
    .lean();

    return {
      reportType: 'detailed',
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        priority: n.priority,
        title: n.title,
        status: n.status,
        workerName: n.recipientId?.fullName,
        employeeId: n.recipientId?.employeeId,
        createdAt: n.createdAt,
        readAt: n.readAt,
        acknowledgedAt: n.acknowledgedAt,
        escalated: n.escalated,
        escalatedAt: n.escalatedAt,
        escalationStatus: n.escalationStatus
      }))
    };
  }

  async generateComplianceReport(workerIds, startDate, endDate) {
    // Implementation for compliance report generation
    const auditRecords = await NotificationAudit.find({
      workerId: { $in: workerIds },
      timestamp: { $gte: startDate, $lte: endDate }
    }).lean();

    return {
      reportType: 'compliance',
      auditRecords: auditRecords.length,
      complianceMetrics: {
        deliverySuccess: auditRecords.filter(r => r.event === 'DELIVERED').length,
        readReceipts: auditRecords.filter(r => r.event === 'READ').length,
        acknowledgments: auditRecords.filter(r => r.event === 'ACKNOWLEDGED').length,
        failures: auditRecords.filter(r => r.event === 'FAILED').length
      },
      retentionCompliance: {
        oldestRecord: auditRecords.length > 0 ? 
          Math.min(...auditRecords.map(r => new Date(r.timestamp).getTime())) : null,
        recordsCount: auditRecords.length
      }
    };
  }

  async getAuditTrailForReport(workerIds, startDate, endDate) {
    return await NotificationAudit.find({
      workerId: { $in: workerIds },
      timestamp: { $gte: startDate, $lte: endDate }
    })
    .sort({ timestamp: -1 })
    .limit(1000) // Limit for performance
    .lean();
  }

  async convertReportToCSV(reportData) {
    // Basic CSV conversion - would need proper CSV library for production
    const headers = Object.keys(reportData.notifications?.[0] || {});
    const rows = reportData.notifications?.map(notification => 
      headers.map(header => `"${notification[header] || ''}"`).join(',')
    ) || [];
    
    return [headers.join(','), ...rows].join('\n');
  }

  async convertReportToPDF(reportData) {
    // PDF conversion would require a PDF library like puppeteer or jsPDF
    // For now, return a placeholder
    return Buffer.from('PDF report generation not implemented');
  }

  parsePeriod(period) {
    const match = period.match(/^(\d+)([dwmy])$/);
    if (!match) return 7; // default to 7 days

    const [, num, unit] = match;
    const number = parseInt(num);

    switch (unit) {
      case 'd': return number;
      case 'w': return number * 7;
      case 'm': return number * 30;
      case 'y': return number * 365;
      default: return 7;
    }
  }

  async getComprehensiveStatistics(workerIds, startDate) {
    // Implementation for comprehensive statistics
    const notifications = await WorkerNotification.find({
      recipientId: { $in: workerIds },
      createdAt: { $gte: startDate }
    }).lean();

    return {
      totalWorkers: workerIds.length,
      notificationMetrics: {
        total: notifications.length,
        byType: this.groupBy(notifications, 'type'),
        byPriority: this.groupBy(notifications, 'priority'),
        byStatus: this.groupBy(notifications, 'status')
      },
      trends: {
        dailyAverage: notifications.length / Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
        escalationRate: (notifications.filter(n => n.escalated).length / notifications.length * 100).toFixed(2),
        readRate: (notifications.filter(n => n.readAt).length / notifications.length * 100).toFixed(2)
      },
      topNotificationTypes: Object.entries(this.groupBy(notifications, 'type'))
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5),
      workerEngagement: await this.calculateWorkerEngagement(workerIds, startDate)
    };
  }

  async calculateWorkerEngagement(workerIds, startDate) {
    return await WorkerNotification.aggregate([
      {
        $match: {
          recipientId: { $in: workerIds },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$recipientId',
          totalNotifications: { $sum: 1 },
          readNotifications: {
            $sum: {
              $cond: [{ $ne: ['$readAt', null] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          workerId: '$_id',
          totalNotifications: 1,
          readNotifications: 1,
          engagementRate: {
            $multiply: [
              { $divide: ['$readNotifications', '$totalNotifications'] },
              100
            ]
          }
        }
      },
      {
        $sort: { engagementRate: -1 }
      }
    ]);
  }

  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key] || 'Unknown';
      groups[group] = (groups[group] || 0) + 1;
      return groups;
    }, {});
  }
}

// Helper functions (moved outside class to avoid 'this' binding issues)
async function getSupervisorProjects(supervisorId, projectId = null) {
  const query = { supervisorId };
  if (projectId) {
    query.id = parseInt(projectId);
  }
  
  return await Project.find(query, 'id projectName address supervisorId').lean();
}

async function getSupervisorWorkers(projectIds) {
  if (projectIds.length === 0) return [];
  
  const employees = await Employee.find(
    { companyId: { $exists: true } }, // Since there's no direct projectId field, we'll need to adjust this
    'id fullName employeeCode'
  ).lean();
  
  return employees.map(emp => emp.id);
}

async function getTotalNotifications(workerIds, since) {
  return await WorkerNotification.countDocuments({
    recipientId: { $in: workerIds },
    createdAt: { $gte: since }
  });
}

async function getEscalatedNotifications(workerIds, since) {
  return await WorkerNotification.countDocuments({
    recipientId: { $in: workerIds },
    escalated: true,
    createdAt: { $gte: since }
  });
}

async function getUnreadNotifications(workerIds) {
  return await WorkerNotification.countDocuments({
    recipientId: { $in: workerIds },
    status: { $in: ['SENT', 'DELIVERED'] }
  });
}

async function getCriticalNotifications(workerIds, since) {
  return await WorkerNotification.countDocuments({
    recipientId: { $in: workerIds },
    priority: 'CRITICAL',
    createdAt: { $gte: since }
  });
}

async function getRecentNotifications(workerIds, limit) {
  return await WorkerNotification.find({
    recipientId: { $in: workerIds }
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('recipientId', 'fullName employeeId')
  .lean();
}

async function getEscalationQueue(workerIds) {
  return await WorkerNotification.find({
    recipientId: { $in: workerIds },
    escalated: true,
    escalationStatus: { $ne: 'SUCCESS' },
    status: { $in: ['SENT', 'DELIVERED', 'READ'] }
  })
  .sort({ escalatedAt: 1 })
  .populate('recipientId', 'fullName employeeId')
  .lean();
}

async function getWorkerNotificationSummary(workerIds, since) {
  return await WorkerNotification.aggregate([
    {
      $match: {
        recipientId: { $in: workerIds },
        createdAt: { $gte: since }
      }
    },
    {
      $group: {
        _id: '$recipientId',
        totalNotifications: { $sum: 1 },
        unreadCount: {
          $sum: {
            $cond: [
              { $in: ['$status', ['SENT', 'DELIVERED']] },
              1,
              0
            ]
          }
        },
        criticalCount: {
          $sum: {
            $cond: [
              { $eq: ['$priority', 'CRITICAL'] },
              1,
              0
            ]
          }
        },
        escalatedCount: {
          $sum: {
            $cond: ['$escalated', 1, 0]
          }
        }
      }
    }
  ]);
}

function parsePeriod(period) {
  const match = period.match(/^(\d+)([dwmy])$/);
  if (!match) return 7; // default to 7 days

  const [, num, unit] = match;
  const number = parseInt(num);

  switch (unit) {
    case 'd': return number;
    case 'w': return number * 7;
    case 'm': return number * 30;
    case 'y': return number * 365;
    default: return 7;
  }
}

async function getComprehensiveStatistics(workerIds, startDate) {
  // Implementation for comprehensive statistics
  const notifications = await WorkerNotification.find({
    recipientId: { $in: workerIds },
    createdAt: { $gte: startDate }
  }).lean();

  return {
    totalWorkers: workerIds.length,
    notificationMetrics: {
      total: notifications.length,
      byType: groupBy(notifications, 'type'),
      byPriority: groupBy(notifications, 'priority'),
      byStatus: groupBy(notifications, 'status')
    },
    trends: {
      dailyAverage: notifications.length / Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      escalationRate: (notifications.filter(n => n.escalated).length / notifications.length * 100).toFixed(2),
      readRate: (notifications.filter(n => n.readAt).length / notifications.length * 100).toFixed(2)
    },
    topNotificationTypes: Object.entries(groupBy(notifications, 'type'))
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5),
    workerEngagement: await calculateWorkerEngagement(workerIds, startDate)
  };
}

async function calculateWorkerEngagement(workerIds, startDate) {
  return await WorkerNotification.aggregate([
    {
      $match: {
        recipientId: { $in: workerIds },
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$recipientId',
        totalNotifications: { $sum: 1 },
        readNotifications: {
          $sum: {
            $cond: [{ $ne: ['$readAt', null] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        workerId: '$_id',
        totalNotifications: 1,
        readNotifications: 1,
        engagementRate: {
          $multiply: [
            { $divide: ['$readNotifications', '$totalNotifications'] },
            100
          ]
        }
      }
    },
    {
      $sort: { engagementRate: -1 }
    }
  ]);
}

function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const group = item[key] || 'Unknown';
    groups[group] = (groups[group] || 0) + 1;
    return groups;
  }, {});
}

export default new SupervisorNotificationController();