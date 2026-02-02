import AttendanceNotificationService from '../notification/services/AttendanceNotificationService.js';
import WorkerTaskAssignment from '../worker/models/WorkerTaskAssignment.js';
import Attendance from './Attendance.js';
import Employee from '../employee/Employee.js';

/**
 * AttendanceScheduler
 * Handles scheduled attendance alert checks and notifications
 * Implements automatic checking for missed login/logout times
 */
class AttendanceScheduler {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.checkIntervalMinutes = 15; // Check every 15 minutes
  }

  /**
   * Start the attendance scheduler
   * @param {number} intervalMinutes - Check interval in minutes (default: 15)
   */
  start(intervalMinutes = 15) {
    if (this.isRunning) {
      console.log('⚠️ Attendance scheduler is already running');
      return;
    }

    this.checkIntervalMinutes = intervalMinutes;
    const intervalMs = intervalMinutes * 60 * 1000;

    console.log(`🕐 Starting attendance scheduler - checking every ${intervalMinutes} minutes`);
    
    // Run initial check
    this.performScheduledCheck();

    // Set up recurring checks
    this.intervalId = setInterval(() => {
      this.performScheduledCheck();
    }, intervalMs);

    this.isRunning = true;
  }

  /**
   * Stop the attendance scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Attendance scheduler is not running');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('🛑 Attendance scheduler stopped');
  }

  /**
   * Perform a scheduled attendance check
   */
  async performScheduledCheck() {
    try {
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();

      console.log(`🔍 Performing scheduled attendance check at ${currentTime.toLocaleTimeString()}`);

      // Check for missed login alerts (after 8:15 AM)
      if (currentHour >= 8 && (currentHour > 8 || currentMinute >= 15)) {
        await this.checkMissedLogins(currentTime);
      }

      // Check for missed logout alerts (after 5:30 PM)
      if (currentHour >= 17 && (currentHour > 17 || currentMinute >= 30)) {
        await this.checkMissedLogouts(currentTime);
      }

      // Send lunch break reminders (at 11:50 AM)
      if (currentHour === 11 && currentMinute >= 50 && currentMinute <= 55) {
        await this.sendLunchBreakReminders(currentTime);
      }

      // Check for overtime alerts (after 6:00 PM)
      if (currentHour >= 18) {
        await this.checkOvertimeAlerts(currentTime);
      }

    } catch (error) {
      console.error('❌ Error in scheduled attendance check:', error);
    }
  }

  /**
   * Check for workers who missed their login time
   * @param {Date} currentTime - Current time
   */
  async checkMissedLogins(currentTime) {
    try {
      const today = currentTime.toISOString().split('T')[0];
      
      // Find all task assignments for today
      const todayAssignments = await WorkerTaskAssignment.find({
        date: today
      });

      let alertsSent = 0;

      for (const assignment of todayAssignments) {
        try {
          // Check if worker has logged in today
          const todayAttendance = await Attendance.findOne({
            employeeId: assignment.employeeId,
            projectId: assignment.projectId,
            date: today
          });

          // If no attendance record or no check-in, send alert
          if (!todayAttendance || !todayAttendance.checkIn) {
            await AttendanceNotificationService.notifyMissedLogin(
              assignment.employeeId,
              {
                scheduledStartTime: '8:00 AM',
                projectId: assignment.projectId
              },
              assignment.supervisorId || 1
            );
            alertsSent++;
          }
        } catch (assignmentError) {
          console.error(`❌ Error checking missed login for assignment ${assignment.id}:`, assignmentError);
        }
      }

      if (alertsSent > 0) {
        console.log(`📱 Sent ${alertsSent} missed login alerts`);
      }

    } catch (error) {
      console.error('❌ Error checking missed logins:', error);
    }
  }

  /**
   * Check for workers who missed their logout time
   * @param {Date} currentTime - Current time
   */
  async checkMissedLogouts(currentTime) {
    try {
      const today = currentTime.toISOString().split('T')[0];
      
      // Find all attendance records for today where worker checked in but not out
      const pendingLogouts = await Attendance.find({
        date: today,
        checkIn: { $exists: true, $ne: null },
        checkOut: { $exists: false }
      });

      let alertsSent = 0;

      for (const attendance of pendingLogouts) {
        try {
          // Get assignment to find supervisor
          const assignment = await WorkerTaskAssignment.findOne({
            employeeId: attendance.employeeId,
            projectId: attendance.projectId,
            date: today
          });

          await AttendanceNotificationService.notifyMissedLogout(
            attendance.employeeId,
            {
              scheduledEndTime: '5:00 PM',
              projectId: attendance.projectId
            },
            assignment?.supervisorId || 1
          );
          alertsSent++;
        } catch (attendanceError) {
          console.error(`❌ Error checking missed logout for attendance ${attendance.id}:`, attendanceError);
        }
      }

      if (alertsSent > 0) {
        console.log(`📱 Sent ${alertsSent} missed logout alerts`);
      }

    } catch (error) {
      console.error('❌ Error checking missed logouts:', error);
    }
  }

  /**
   * Send lunch break reminders to all active workers
   * @param {Date} currentTime - Current time
   */
  async sendLunchBreakReminders(currentTime) {
    try {
      const today = currentTime.toISOString().split('T')[0];
      
      // Find all attendance records for today where worker is checked in but not out
      const activeWorkers = await Attendance.find({
        date: today,
        checkIn: { $exists: true, $ne: null },
        checkOut: { $exists: false }
      });

      let remindersSent = 0;

      for (const attendance of activeWorkers) {
        try {
          // Get assignment to find supervisor
          const assignment = await WorkerTaskAssignment.findOne({
            employeeId: attendance.employeeId,
            projectId: attendance.projectId,
            date: today
          });

          await AttendanceNotificationService.notifyLunchBreakReminder(
            attendance.employeeId,
            {
              lunchBreakTime: '12:00 PM',
              breakDuration: '1 hour',
              projectId: attendance.projectId
            },
            assignment?.supervisorId || 1
          );
          remindersSent++;
        } catch (attendanceError) {
          console.error(`❌ Error sending lunch reminder for attendance ${attendance.id}:`, attendanceError);
        }
      }

      if (remindersSent > 0) {
        console.log(`🍽️ Sent ${remindersSent} lunch break reminders`);
      }

    } catch (error) {
      console.error('❌ Error sending lunch break reminders:', error);
    }
  }

  /**
   * Check for overtime alerts
   * @param {Date} currentTime - Current time
   */
  async checkOvertimeAlerts(currentTime) {
    try {
      const today = currentTime.toISOString().split('T')[0];
      const currentHour = currentTime.getHours();
      
      // Find workers still checked in after 6 PM (overtime territory)
      const overtimeWorkers = await Attendance.find({
        date: today,
        checkIn: { $exists: true, $ne: null },
        checkOut: { $exists: false }
      });

      let overtimeAlertsSent = 0;

      for (const attendance of overtimeWorkers) {
        try {
          // Get assignment to find supervisor
          const assignment = await WorkerTaskAssignment.findOne({
            employeeId: attendance.employeeId,
            projectId: attendance.projectId,
            date: today
          });

          // Send overtime start notification at 6 PM
          if (currentHour === 18) {
            await AttendanceNotificationService.notifyOvertimeAlert(
              attendance.employeeId,
              {
                startTime: '6:00 PM',
                projectId: attendance.projectId,
                reason: 'Extended work hours detected'
              },
              'START',
              assignment?.supervisorId || 1
            );
            overtimeAlertsSent++;
          }
        } catch (attendanceError) {
          console.error(`❌ Error sending overtime alert for attendance ${attendance.id}:`, attendanceError);
        }
      }

      if (overtimeAlertsSent > 0) {
        console.log(`⏰ Sent ${overtimeAlertsSent} overtime alerts`);
      }

    } catch (error) {
      console.error('❌ Error checking overtime alerts:', error);
    }
  }

  /**
   * Get scheduler status
   * @returns {Object} Scheduler status information
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkIntervalMinutes: this.checkIntervalMinutes,
      nextCheckIn: this.intervalId ? `${this.checkIntervalMinutes} minutes` : 'Not scheduled'
    };
  }

  /**
   * Perform a manual attendance check (for testing or immediate execution)
   * @returns {Promise<Object>} Check results
   */
  async performManualCheck() {
    console.log('🔧 Performing manual attendance check...');
    await this.performScheduledCheck();
    return {
      success: true,
      message: 'Manual attendance check completed',
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export default new AttendanceScheduler();