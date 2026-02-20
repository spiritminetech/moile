// Time validation utilities for attendance controls
import { WORK_HOURS_CONFIG } from './constants';

export interface TimeValidationResult {
  isValid: boolean;
  message: string;
  canProceed: boolean;
  isGracePeriod?: boolean;
}

export interface OvertimeApprovalStatus {
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
}

export class TimeValidator {
  /**
   * Validate morning login time (before 8:00 AM with grace period)
   */
  static validateMorningLogin(): TimeValidationResult {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    const cutoffTimeInMinutes = WORK_HOURS_CONFIG.MORNING_LOGIN_CUTOFF * 60;
    const graceTimeInMinutes = cutoffTimeInMinutes + WORK_HOURS_CONFIG.MORNING_GRACE_PERIOD;
    
    if (currentTimeInMinutes <= cutoffTimeInMinutes) {
      return {
        isValid: true,
        message: 'On time for morning login',
        canProceed: true,
      };
    } else if (currentTimeInMinutes <= graceTimeInMinutes) {
      return {
        isValid: true,
        message: `Late login (${currentTimeInMinutes - cutoffTimeInMinutes} minutes past 8:00 AM)`,
        canProceed: true,
        isGracePeriod: true,
      };
    } else {
      return {
        isValid: false,
        message: `Morning login window closed. Login allowed until ${WORK_HOURS_CONFIG.MORNING_LOGIN_CUTOFF}:${WORK_HOURS_CONFIG.MORNING_GRACE_PERIOD.toString().padStart(2, '0')} AM`,
        canProceed: false,
      };
    }
  }

  /**
   * Validate lunch break timing (12:00 noon - 1:00 PM with grace period)
   */
  static validateLunchTiming(action: 'start' | 'end'): TimeValidationResult {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    if (action === 'start') {
      const lunchStartTime = WORK_HOURS_CONFIG.LUNCH_START_TIME * 60;
      const lunchStartGrace = lunchStartTime + WORK_HOURS_CONFIG.LUNCH_GRACE_PERIOD;
      
      if (currentTimeInMinutes >= lunchStartTime && currentTimeInMinutes <= lunchStartGrace) {
        return {
          isValid: true,
          message: 'Lunch break started on time',
          canProceed: true,
        };
      } else if (currentTimeInMinutes < lunchStartTime) {
        return {
          isValid: false,
          message: `Lunch break starts at ${WORK_HOURS_CONFIG.LUNCH_START_TIME}:00 PM`,
          canProceed: false,
        };
      } else {
        return {
          isValid: true,
          message: `Late lunch start (${currentTimeInMinutes - lunchStartTime} minutes past 12:00 PM)`,
          canProceed: true,
          isGracePeriod: true,
        };
      }
    } else {
      const lunchEndTime = WORK_HOURS_CONFIG.LUNCH_END_TIME * 60;
      const lunchEndGrace = lunchEndTime + WORK_HOURS_CONFIG.LUNCH_GRACE_PERIOD;
      
      if (currentTimeInMinutes >= lunchEndTime && currentTimeInMinutes <= lunchEndGrace) {
        return {
          isValid: true,
          message: 'Lunch break ended on time',
          canProceed: true,
        };
      } else if (currentTimeInMinutes < lunchEndTime) {
        return {
          isValid: false,
          message: `Lunch break ends at ${WORK_HOURS_CONFIG.LUNCH_END_TIME}:00 PM`,
          canProceed: false,
        };
      } else {
        return {
          isValid: true,
          message: `Late lunch end (${currentTimeInMinutes - lunchEndTime} minutes past 1:00 PM)`,
          canProceed: true,
          isGracePeriod: true,
        };
      }
    }
  }

  /**
   * Validate evening logout time (5:00 PM or 7:00 PM with grace period)
   */
  static validateEveningLogout(isExtendedShift: boolean = false): TimeValidationResult {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    const logoutTime = isExtendedShift 
      ? WORK_HOURS_CONFIG.EVENING_LOGOUT_EXTENDED * 60
      : WORK_HOURS_CONFIG.EVENING_LOGOUT_NORMAL * 60;
    const graceTime = logoutTime + WORK_HOURS_CONFIG.EVENING_GRACE_PERIOD;
    
    const logoutHour = isExtendedShift 
      ? WORK_HOURS_CONFIG.EVENING_LOGOUT_EXTENDED
      : WORK_HOURS_CONFIG.EVENING_LOGOUT_NORMAL;
    
    if (currentTimeInMinutes >= logoutTime && currentTimeInMinutes <= graceTime) {
      return {
        isValid: true,
        message: 'On time for evening logout',
        canProceed: true,
      };
    } else if (currentTimeInMinutes < logoutTime) {
      return {
        isValid: true,
        message: `Early logout (before ${logoutHour}:00 ${logoutHour >= 12 ? 'PM' : 'AM'})`,
        canProceed: true,
      };
    } else {
      return {
        isValid: true,
        message: `Late logout (${currentTimeInMinutes - logoutTime} minutes past ${logoutHour}:00 ${logoutHour >= 12 ? 'PM' : 'AM'})`,
        canProceed: true,
        isGracePeriod: true,
      };
    }
  }

  /**
   * Check if current time is within working hours
   */
  static isWithinWorkingHours(): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour >= WORK_HOURS_CONFIG.WORK_START_HOUR && 
           currentHour <= WORK_HOURS_CONFIG.EVENING_LOGOUT_EXTENDED;
  }

  /**
   * Get current time status for display
   */
  static getCurrentTimeStatus(): string {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    
    const currentHour = now.getHours();
    let period = '';
    
    if (currentHour < WORK_HOURS_CONFIG.WORK_START_HOUR) {
      period = 'Before Work Hours';
    } else if (currentHour < WORK_HOURS_CONFIG.LUNCH_START_TIME) {
      period = 'Morning Work Period';
    } else if (currentHour < WORK_HOURS_CONFIG.LUNCH_END_TIME) {
      period = 'Lunch Period';
    } else if (currentHour < WORK_HOURS_CONFIG.EVENING_LOGOUT_NORMAL) {
      period = 'Afternoon Work Period';
    } else if (currentHour < WORK_HOURS_CONFIG.EVENING_LOGOUT_EXTENDED) {
      period = 'Extended Work Period';
    } else {
      period = 'After Work Hours';
    }
    
    return `${timeString} - ${period}`;
  }

  /**
   * Check if worker has been checked in for too long (potential forgotten checkout)
   */
  static checkForForgottenCheckout(checkInTime: string): {
    isForgotten: boolean;
    hoursCheckedIn: number;
    message: string;
    requiresRegularization: boolean;
  } {
    const checkIn = new Date(checkInTime);
    const now = new Date();
    const hoursCheckedIn = (now.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    
    // Consider forgotten if checked in for more than 12 hours
    const isForgotten = hoursCheckedIn > 12;
    const requiresRegularization = hoursCheckedIn > 10;
    
    let message = '';
    if (isForgotten) {
      message = `Checked in for ${Math.floor(hoursCheckedIn)} hours. Please contact supervisor for checkout regularization.`;
    } else if (requiresRegularization) {
      message = `Long work session (${Math.floor(hoursCheckedIn)} hours). Consider checking out or contact supervisor.`;
    } else {
      message = `Active session: ${Math.floor(hoursCheckedIn)} hours`;
    }
    
    return {
      isForgotten,
      hoursCheckedIn,
      message,
      requiresRegularization,
    };
  }
}

/**
 * Mock overtime approval status - in real implementation, this would come from API
 */
export class OvertimeManager {
  static async checkOvertimeApproval(workerId: number, projectId: number): Promise<OvertimeApprovalStatus> {
    // This would be replaced with actual API call
    // For now, return mock data
    return {
      isApproved: false,
      status: 'pending',
      message: 'Overtime requires supervisor approval. Please wait for approval or contact your supervisor.',
    };
  }

  static async requestOvertimeApproval(workerId: number, projectId: number, reason: string): Promise<boolean> {
    // This would be replaced with actual API call
    console.log('🕐 Requesting overtime approval:', { workerId, projectId, reason });
    return true;
  }
}