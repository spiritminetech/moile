import NotificationService from './NotificationService.js';
import Employee from '../../employee/Employee.js';
import Project from '../../project/models/Project.js';
import Attendance from '../../attendance/Attendance.js';
import WorkerTaskAssignment from '../../worker/models/WorkerTaskAssignment.js';

/**
 * AttendanceNotificationService
 * Handles attendance alert notification triggers for worker mobile notifications
 * Implements Requirements 3.1, 3.2, 3.3, 3.4, 3.5 (login/logout alerts, geofence violations, break reminders)
 */
class AttendanceNotificationService {
  constructor() {
    this.notificationService = NotificationService;
  }

  /**
   * Send notification when worker misses login time
   * Implements Requirement 3.1: Alert within 15 minutes of scheduled start time
   * @param {number} workerId - Worker employee ID
   * @param {Object} scheduleInfo - Schedule information
   * @param {number} supervisorId - Supervisor ID for contact info
   * @returns {Promise<Object>} Notification creation result
   */
  async notifyMissedLogin(workerId, scheduleInfo, supervisorId) {
    try {
      // Get worker and supervisor information
      const [worker, supervisor] = await Promise.all([
        Employee.findOne({ id: workerId }),
        Employee.findOne({ id: supervisorId })
      ]);

      if (!worker) {
        throw new Error(`Worker with ID ${workerId} not found`);
      }

      // Get project information if available
      const project = scheduleInfo.projectId 
        ? await Project.findOne({ id: scheduleInfo.projectId })
        : null;

      const supervisorContact = supervisor ? {
        name: supervisor.fullName,
        phone: supervisor.phone || 'N/A',
        email: supervisor.email || 'N/A'
      } : {
        name: 'Supervisor',
        phone: 'N/A',
        email: 'N/A'
      };

      // Create notification content
      const title = 'Missed Login Alert';
      const scheduledTime = scheduleInfo.scheduledStartTime || '8:00 AM';
      const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const message = `You missed your scheduled login time (${scheduledTime}). Current time: ${currentTime}. Please check in immediately to avoid attendance issues.`;

      // Prepare action data with required fields (Requirement 3.1)
      const actionData = {
        alertType: 'MISSED_LOGIN',
        timestamp: new Date().toISOString(),
        scheduledStartTime: scheduleInfo.scheduledStartTime,
        currentTime: currentTime,
        projectId: scheduleInfo.projectId,
        projectName: project?.projectName || 'N/A',
        supervisorContact: supervisorContact,
        actionUrl: '/worker/attendance'
      };

      // Create high-priority notification
      const notificationResult = await this.notificationService.createNotification({
        type: 'ATTENDANCE_ALERT',
        priority: 'HIGH', // High priority for missed login
        title: title,
        message: message,
        senderId: supervisorId || 1, // Use supervisor ID or default to 1 for system notifications
        recipients: [workerId],
        actionData: actionData,
        requiresAcknowledgment: true, // Require acknowledgment for attendance issues
        language: 'en'
      });

      return {
        success: true,
        message: 'Missed login notification sent',
        notificationResult: notificationResult
      };

    } catch (error) {
      console.error('❌ Error in AttendanceNotificationService.notifyMissedLogin:', error);
      throw error;
    }
  }

  /**
   * Send notification when worker fails to logout
   * Implements Requirement 3.2: Reminder 30 minutes after scheduled end time
   * @param {number} workerId - Worker employee ID
   * @param {Object} scheduleInfo - Schedule information
   * @param {number} supervisorId - Supervisor ID for contact info
   * @returns {Promise<Object>} Notification creation result
   */
  async notifyMissedLogout(workerId, scheduleInfo, supervisorId) {
    try {
      // Get worker and supervisor information
      const [worker, supervisor] = await Promise.all([
        Employee.findOne({ id: workerId }),
        Employee.findOne({ id: supervisorId })
      ]);

      if (!worker) {
        throw new Error(`Worker with ID ${workerId} not found`);
      }

      // Get project information if available
      const project = scheduleInfo.projectId 
        ? await Project.findOne({ id: scheduleInfo.projectId })
        : null;

      const supervisorContact = supervisor ? {
        name: supervisor.fullName,
        phone: supervisor.phone || 'N/A',
        email: supervisor.email || 'N/A'
      } : {
        name: 'Supervisor',
        phone: 'N/A',
        email: 'N/A'
      };

      // Create notification content
      const title = 'Logout Reminder';
      const scheduledEndTime = scheduleInfo.scheduledEndTime || '5:00 PM';
      const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const message = `You haven't logged out yet. Scheduled end time was ${scheduledEndTime}. Current time: ${currentTime}. Please log out to complete your attendance.`;

      // Prepare action data with required fields (Requirement 3.2)
      const actionData = {
        alertType: 'MISSED_LOGOUT',
        timestamp: new Date().toISOString(),
        scheduledEndTime: scheduleInfo.scheduledEndTime,
        currentTime: currentTime,
        projectId: scheduleInfo.projectId,
        projectName: project?.projectName || 'N/A',
        supervisorContact: supervisorContact,
        actionUrl: '/worker/attendance'
      };

      // Create high-priority notification
      const notificationResult = await this.notificationService.createNotification({
        type: 'ATTENDANCE_ALERT',
        priority: 'HIGH', // High priority for missed logout
        title: title,
        message: message,
        senderId: supervisorId || 1, // Use supervisor ID or default to 1 for system notifications
        recipients: [workerId],
        actionData: actionData,
        requiresAcknowledgment: true, // Require acknowledgment for attendance issues
        language: 'en'
      });

      return {
        success: true,
        message: 'Missed logout notification sent',
        notificationResult: notificationResult
      };

    } catch (error) {
      console.error('❌ Error in AttendanceNotificationService.notifyMissedLogout:', error);
      throw error;
    }
  }

  /**
   * Send notification for lunch break timing
   * Implements Requirement 3.3: Reminder 10 minutes before break time
   * @param {number} workerId - Worker employee ID
   * @param {Object} breakInfo - Break timing information
   * @param {number} supervisorId - Supervisor ID for contact info
   * @returns {Promise<Object>} Notification creation result
   */
  async notifyLunchBreakReminder(workerId, breakInfo, supervisorId) {
    try {
      // Get worker and supervisor information
      const [worker, supervisor] = await Promise.all([
        Employee.findOne({ id: workerId }),
        Employee.findOne({ id: supervisorId })
      ]);

      if (!worker) {
        throw new Error(`Worker with ID ${workerId} not found`);
      }

      // Get project information if available
      const project = breakInfo.projectId 
        ? await Project.findOne({ id: breakInfo.projectId })
        : null;

      const supervisorContact = supervisor ? {
        name: supervisor.fullName,
        phone: supervisor.phone || 'N/A',
        email: supervisor.email || 'N/A'
      } : {
        name: 'Supervisor',
        phone: 'N/A',
        email: 'N/A'
      };

      // Create notification content
      const title = 'Lunch Break Reminder';
      const breakTime = breakInfo.lunchBreakTime || '12:00 PM';
      const duration = breakInfo.breakDuration || '1 hour';
      
      const message = `Lunch break starts in 10 minutes at ${breakTime}. Duration: ${duration}. Remember to log your break time.`;

      // Prepare action data with required fields (Requirement 3.3)
      const actionData = {
        alertType: 'LUNCH_BREAK_REMINDER',
        timestamp: new Date().toISOString(),
        lunchBreakTime: breakInfo.lunchBreakTime,
        breakDuration: breakInfo.breakDuration,
        projectId: breakInfo.projectId,
        projectName: project?.projectName || 'N/A',
        supervisorContact: supervisorContact,
        actionUrl: '/worker/attendance'
      };

      // Create normal priority notification for break reminders
      const notificationResult = await this.notificationService.createNotification({
        type: 'ATTENDANCE_ALERT',
        priority: 'NORMAL', // Normal priority for break reminders
        title: title,
        message: message,
        senderId: supervisorId || 1, // Use supervisor ID or default to 1 for system notifications
        recipients: [workerId],
        actionData: actionData,
        requiresAcknowledgment: false, // No acknowledgment required for reminders
        language: 'en'
      });

      return {
        success: true,
        message: 'Lunch break reminder sent',
        notificationResult: notificationResult
      };

    } catch (error) {
      console.error('❌ Error in AttendanceNotificationService.notifyLunchBreakReminder:', error);
      throw error;
    }
  }

  /**
   * Send notification for overtime periods
   * Implements Requirement 3.4: Overtime start/end notifications with time tracking instructions
   * @param {number} workerId - Worker employee ID
   * @param {Object} overtimeInfo - Overtime information
   * @param {string} overtimeType - 'START' or 'END'
   * @param {number} supervisorId - Supervisor ID for contact info
   * @returns {Promise<Object>} Notification creation result
   */
  async notifyOvertimeAlert(workerId, overtimeInfo, overtimeType, supervisorId) {
    try {
      // Get worker and supervisor information
      const [worker, supervisor] = await Promise.all([
        Employee.findOne({ id: workerId }),
        Employee.findOne({ id: supervisorId })
      ]);

      if (!worker) {
        throw new Error(`Worker with ID ${workerId} not found`);
      }

      // Get project information if available
      const project = overtimeInfo.projectId 
        ? await Project.findOne({ id: overtimeInfo.projectId })
        : null;

      const supervisorContact = supervisor ? {
        name: supervisor.fullName,
        phone: supervisor.phone || 'N/A',
        email: supervisor.email || 'N/A'
      } : {
        name: 'Supervisor',
        phone: 'N/A',
        email: 'N/A'
      };

      // Create notification content based on overtime type
      let title, message;
      if (overtimeType === 'START') {
        title = 'Overtime Period Started';
        message = `Your overtime period has started. Please ensure proper time tracking. Expected duration: ${overtimeInfo.expectedDuration || 'TBD'}.`;
      } else if (overtimeType === 'END') {
        title = 'Overtime Period Ended';
        message = `Your overtime period has ended. Please log out and submit your overtime hours for approval.`;
      } else {
        throw new Error(`Invalid overtime type: ${overtimeType}`);
      }

      // Prepare action data with required fields (Requirement 3.4)
      const actionData = {
        alertType: `OVERTIME_${overtimeType}`,
        timestamp: new Date().toISOString(),
        overtimeStartTime: overtimeInfo.startTime,
        overtimeEndTime: overtimeInfo.endTime,
        expectedDuration: overtimeInfo.expectedDuration,
        overtimeReason: overtimeInfo.reason,
        projectId: overtimeInfo.projectId,
        projectName: project?.projectName || 'N/A',
        supervisorContact: supervisorContact,
        actionUrl: '/worker/attendance'
      };

      // Create normal priority notification for overtime alerts
      const notificationResult = await this.notificationService.createNotification({
        type: 'ATTENDANCE_ALERT',
        priority: 'NORMAL', // Normal priority for overtime notifications
        title: title,
        message: message,
        senderId: supervisorId || 1, // Use supervisor ID or default to 1 for system notifications
        recipients: [workerId],
        actionData: actionData,
        requiresAcknowledgment: false, // No acknowledgment required for overtime alerts
        language: 'en'
      });

      return {
        success: true,
        message: `Overtime ${overtimeType.toLowerCase()} notification sent`,
        notificationResult: notificationResult
      };

    } catch (error) {
      console.error(`❌ Error in AttendanceNotificationService.notifyOvertimeAlert (${overtimeType}):`, error);
      throw error;
    }
  }

  /**
   * Send notification for geofence violations
   * Implements Requirement 3.5: Immediate alerts for geofence violations with location details
   * @param {number} workerId - Worker employee ID
   * @param {Object} violationInfo - Geofence violation information
   * @param {number} supervisorId - Supervisor ID for contact info
   * @returns {Promise<Object>} Notification creation result
   */
  async notifyGeofenceViolation(workerId, violationInfo, supervisorId) {
    try {
      // Get worker and supervisor information
      const [worker, supervisor] = await Promise.all([
        Employee.findOne({ id: workerId }),
        Employee.findOne({ id: supervisorId })
      ]);

      if (!worker) {
        throw new Error(`Worker with ID ${workerId} not found`);
      }

      // Get project information
      const project = violationInfo.projectId 
        ? await Project.findOne({ id: violationInfo.projectId })
        : null;

      const supervisorContact = supervisor ? {
        name: supervisor.fullName,
        phone: supervisor.phone || 'N/A',
        email: supervisor.email || 'N/A'
      } : {
        name: 'Supervisor',
        phone: 'N/A',
        email: 'N/A'
      };

      // Create notification content
      const title = 'Geofence Violation Alert';
      const distance = violationInfo.distance ? Math.round(violationInfo.distance) : 'Unknown';
      const projectName = project?.projectName || 'work site';
      
      const message = `You are outside the authorized work area for ${projectName}. Distance: ${distance}m. Please return to the designated area immediately.`;

      // Prepare action data with required fields (Requirement 3.5)
      const actionData = {
        alertType: 'GEOFENCE_VIOLATION',
        timestamp: new Date().toISOString(),
        currentLocation: {
          latitude: violationInfo.currentLatitude,
          longitude: violationInfo.currentLongitude,
          accuracy: violationInfo.accuracy
        },
        projectLocation: {
          latitude: violationInfo.projectLatitude,
          longitude: violationInfo.projectLongitude,
          radius: violationInfo.geofenceRadius
        },
        distance: violationInfo.distance,
        projectId: violationInfo.projectId,
        projectName: project?.projectName || 'N/A',
        supervisorContact: supervisorContact,
        actionUrl: '/worker/attendance'
      };

      // Create high-priority notification for geofence violations
      const notificationResult = await this.notificationService.createNotification({
        type: 'ATTENDANCE_ALERT',
        priority: 'HIGH', // High priority for geofence violations
        title: title,
        message: message,
        senderId: supervisorId || 1, // Use supervisor ID or default to 1 for system notifications
        recipients: [workerId],
        actionData: actionData,
        requiresAcknowledgment: true, // Require acknowledgment for violations
        language: 'en'
      });

      // Also send notification to supervisor
      const supervisorNotificationResult = await this.notificationService.createNotification({
        type: 'ATTENDANCE_ALERT',
        priority: 'HIGH',
        title: 'Worker Geofence Violation',
        message: `${worker.fullName} is outside the authorized work area for ${projectName}. Distance: ${distance}m.`,
        senderId: workerId, // Use worker ID as sender for supervisor notification
        recipients: [supervisorId],
        actionData: {
          ...actionData,
          workerName: worker.fullName,
          workerId: workerId,
          actionUrl: '/supervisor/worker-tracking'
        },
        requiresAcknowledgment: false,
        language: 'en'
      });

      return {
        success: true,
        message: 'Geofence violation notifications sent to worker and supervisor',
        workerNotification: notificationResult,
        supervisorNotification: supervisorNotificationResult
      };

    } catch (error) {
      console.error('❌ Error in AttendanceNotificationService.notifyGeofenceViolation:', error);
      throw error;
    }
  }

  /**
   * Check for workers who should receive attendance alerts based on their schedule
   * This method can be called by a scheduled job to proactively send alerts
   * @param {Date} currentTime - Current time for checking schedules
   * @returns {Promise<Object>} Results of attendance checks and notifications sent
   */
  async checkAndNotifyAttendanceAlerts(currentTime = new Date()) {
    try {
      const results = {
        missedLoginAlerts: [],
        missedLogoutAlerts: [],
        lunchBreakReminders: [],
        overtimeAlerts: [],
        totalNotificationsSent: 0
      };

      // Get today's date string
      const today = currentTime.toISOString().split('T')[0];

      // Find all task assignments for today
      const todayAssignments = await WorkerTaskAssignment.find({
        date: today
      }).populate('project');

      // Check each assignment for attendance alerts
      for (const assignment of todayAssignments) {
        try {
          // Check for missed login (15 minutes after scheduled start)
          const scheduledStart = new Date(`${today}T08:00:00`); // Default 8 AM start
          const loginCheckTime = new Date(scheduledStart.getTime() + 15 * 60 * 1000); // 15 minutes later
          
          if (currentTime >= loginCheckTime) {
            // Check if worker has logged in today
            const todayAttendance = await Attendance.findOne({
              employeeId: assignment.employeeId,
              projectId: assignment.projectId,
              date: today
            });

            if (!todayAttendance || !todayAttendance.checkIn) {
              // Send missed login alert
              const result = await this.notifyMissedLogin(
                assignment.employeeId,
                {
                  scheduledStartTime: '8:00 AM',
                  projectId: assignment.projectId
                },
                assignment.supervisorId || 0
              );
              results.missedLoginAlerts.push({
                workerId: assignment.employeeId,
                projectId: assignment.projectId,
                result: result
              });
              results.totalNotificationsSent++;
            }
          }

          // Check for missed logout (30 minutes after scheduled end)
          const scheduledEnd = new Date(`${today}T17:00:00`); // Default 5 PM end
          const logoutCheckTime = new Date(scheduledEnd.getTime() + 30 * 60 * 1000); // 30 minutes later
          
          if (currentTime >= logoutCheckTime) {
            // Check if worker has logged out today
            const todayAttendance = await Attendance.findOne({
              employeeId: assignment.employeeId,
              projectId: assignment.projectId,
              date: today
            });

            if (todayAttendance && todayAttendance.checkIn && !todayAttendance.checkOut) {
              // Send missed logout alert
              const result = await this.notifyMissedLogout(
                assignment.employeeId,
                {
                  scheduledEndTime: '5:00 PM',
                  projectId: assignment.projectId
                },
                assignment.supervisorId || 0
              );
              results.missedLogoutAlerts.push({
                workerId: assignment.employeeId,
                projectId: assignment.projectId,
                result: result
              });
              results.totalNotificationsSent++;
            }
          }

          // Check for lunch break reminder (10 minutes before 12 PM)
          const lunchTime = new Date(`${today}T12:00:00`); // 12 PM lunch
          const lunchReminderTime = new Date(lunchTime.getTime() - 10 * 60 * 1000); // 10 minutes before
          
          if (Math.abs(currentTime.getTime() - lunchReminderTime.getTime()) < 5 * 60 * 1000) { // Within 5 minutes
            // Send lunch break reminder
            const result = await this.notifyLunchBreakReminder(
              assignment.employeeId,
              {
                lunchBreakTime: '12:00 PM',
                breakDuration: '1 hour',
                projectId: assignment.projectId
              },
              assignment.supervisorId || 0
            );
            results.lunchBreakReminders.push({
              workerId: assignment.employeeId,
              projectId: assignment.projectId,
              result: result
            });
            results.totalNotificationsSent++;
          }

        } catch (assignmentError) {
          console.error(`❌ Error processing attendance alerts for assignment ${assignment.id}:`, assignmentError);
        }
      }

      return {
        success: true,
        message: `Processed attendance alerts for ${todayAssignments.length} assignments`,
        timestamp: currentTime.toISOString(),
        results: results
      };

    } catch (error) {
      console.error('❌ Error in AttendanceNotificationService.checkAndNotifyAttendanceAlerts:', error);
      throw error;
    }
  }

  /**
   * Batch process multiple attendance notifications
   * Useful for bulk attendance alert processing
   * @param {Array} notifications - Array of notification requests
   * @returns {Promise<Array>} Results of batch processing
   */
  async batchNotifyAttendanceAlerts(notifications) {
    const results = [];
    
    for (const notificationRequest of notifications) {
      try {
        let result;
        
        switch (notificationRequest.type) {
          case 'MISSED_LOGIN':
            result = await this.notifyMissedLogin(
              notificationRequest.workerId,
              notificationRequest.scheduleInfo,
              notificationRequest.supervisorId
            );
            break;
            
          case 'MISSED_LOGOUT':
            result = await this.notifyMissedLogout(
              notificationRequest.workerId,
              notificationRequest.scheduleInfo,
              notificationRequest.supervisorId
            );
            break;
            
          case 'LUNCH_BREAK_REMINDER':
            result = await this.notifyLunchBreakReminder(
              notificationRequest.workerId,
              notificationRequest.breakInfo,
              notificationRequest.supervisorId
            );
            break;
            
          case 'OVERTIME_ALERT':
            result = await this.notifyOvertimeAlert(
              notificationRequest.workerId,
              notificationRequest.overtimeInfo,
              notificationRequest.overtimeType,
              notificationRequest.supervisorId
            );
            break;
            
          case 'GEOFENCE_VIOLATION':
            result = await this.notifyGeofenceViolation(
              notificationRequest.workerId,
              notificationRequest.violationInfo,
              notificationRequest.supervisorId
            );
            break;
            
          default:
            throw new Error(`Unknown attendance notification type: ${notificationRequest.type}`);
        }
        
        results.push({ ...notificationRequest, result, success: true });
      } catch (error) {
        console.error(`❌ Batch attendance notification failed for ${notificationRequest.type}:`, error);
        results.push({ ...notificationRequest, success: false, error: error.message });
      }
    }
    
    return results;
  }
}

export default new AttendanceNotificationService();