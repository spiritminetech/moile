import { apiClient } from './client';
import { ApiResponse, GeoLocation, AttendanceRecord } from '../../types';

export interface GeofenceValidationRequest {
  projectId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GeofenceValidationResponse {
  insideGeofence: boolean;
  distance: number;
  canProceed: boolean;
  message: string;
  accuracy: number | null;
}

export interface AttendanceSubmitRequest {
  projectId: string;
  session: 'checkin' | 'checkout';
  latitude: number;
  longitude: number;
}

export interface AttendanceSubmitResponse {
  message: string;
}

export interface TodaysAttendanceResponse {
  session: 'NOT_LOGGED_IN' | 'CHECKED_IN' | 'CHECKED_OUT' | 'ON_LUNCH';
  checkInTime: string | null;
  checkOutTime: string | null;
  lunchStartTime: string | null;
  lunchEndTime: string | null;
  overtimeStartTime: string | null;
  isOnLunchBreak: boolean;
  date: string;
  projectId?: string;
  // Duration fields from backend API (in minutes)
  workDuration?: number;
  lunchDuration?: number;
}

export interface LunchReminderRequest {
  workerId: string;
  projectId: string;
}

export interface LunchReminderResponse {
  success: boolean;
  message: string;
  result: any;
}

export interface OvertimeAlertRequest {
  workerId: string;
  overtimeInfo: any;
  overtimeType: 'START' | 'END';
}

export interface OvertimeAlertResponse {
  success: boolean;
  message: string;
  result: any;
}

export interface LocationLogRequest {
  projectId: string;
  latitude: number;
  longitude: number;
}

export interface LocationLogResponse {
  insideGeofence: boolean;
}

export interface CheckAlertsResponse {
  success: boolean;
  message: string;
  results: any;
}

export interface AttendanceHistoryRecord {
  employeeId: string;
  projectId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  lunchStartTime: string | null;
  lunchEndTime: string | null;
  overtimeStartTime: string | null;
  insideGeofenceAtCheckin: boolean;
  insideGeofenceAtCheckout: boolean;
  pendingCheckout: boolean;
}

export interface AttendanceHistoryResponse {
  records: AttendanceHistoryRecord[];
}

export interface ClockInRequest {
  projectId: number;
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface ClockInResponse {
  success: boolean;
  message: string;
  checkInTime: string;
  session: 'CHECKED_IN';
}

export interface ClockOutRequest {
  projectId: number;
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface ClockOutResponse {
  success: boolean;
  message: string;
  checkOutTime: string;
  session: 'CHECKED_OUT';
  totalHours: number;
}

export interface LunchStartRequest {
  projectId: number;
  latitude: number;
  longitude: number;
}

export interface LunchStartResponse {
  success: boolean;
  message: string;
  lunchStartTime: string;
}

export interface LunchEndRequest {
  projectId: number;
  latitude: number;
  longitude: number;
}

export interface LunchEndResponse {
  success: boolean;
  message: string;
  lunchEndTime: string;
  lunchDuration: number;
}

export interface WorkerAttendanceStatusResponse {
  currentStatus: 'NOT_LOGGED_IN' | 'CHECKED_IN' | 'CHECKED_OUT' | 'ON_LUNCH';
  checkInTime: string | null;
  checkOutTime: string | null;
  lunchStartTime: string | null;
  lunchEndTime: string | null;
  isOnLunchBreak: boolean;
  hoursWorked: number;
  projectId: number | null;
  date: string;
}

export class AttendanceApiService {
  /**
   * 1. POST /worker/attendance/validate-location - Geofence validation
   */
  async validateGeofence(request: GeofenceValidationRequest): Promise<ApiResponse<GeofenceValidationResponse>> {
    console.log('🔍 Validating geofence:', request);
    return apiClient.post('/worker/attendance/validate-location', request);
  }

  /**
   * 2. POST /worker/attendance/clock-in - Dedicated Clock in
   */
  async workerClockIn(request: ClockInRequest): Promise<ApiResponse<ClockInResponse>> {
    console.log('⏰ Worker clock in:', request);
    return apiClient.post('/worker/attendance/clock-in', request);
  }

  /**
   * 3. POST /worker/attendance/clock-out - Dedicated Clock out
   */
  async workerClockOut(request: ClockOutRequest): Promise<ApiResponse<ClockOutResponse>> {
    console.log('⏰ Worker clock out:', request);
    return apiClient.post('/worker/attendance/clock-out', request);
  }

  /**
   * 4. GET /worker/attendance/today - Today's attendance records
   */
  async getTodaysAttendance(): Promise<ApiResponse<TodaysAttendanceResponse>> {
    console.log('📅 Getting today\'s attendance');
    return apiClient.get('/worker/attendance/today');
  }

  /**
   * 5. POST /worker/attendance/lunch-start - Start lunch break
   */
  async startLunchBreak(request: LunchStartRequest): Promise<ApiResponse<LunchStartResponse>> {
    console.log('🍽️ Starting lunch break:', request);
    return apiClient.post('/worker/attendance/lunch-start', request);
  }

  /**
   * 6. POST /worker/attendance/lunch-end - End lunch break
   */
  async endLunchBreak(request: LunchEndRequest): Promise<ApiResponse<LunchEndResponse>> {
    console.log('🍽️ Ending lunch break:', request);
    return apiClient.post('/worker/attendance/lunch-end', request);
  }

  /**
   * 7. GET /worker/attendance/status - Current attendance status
   */
  async getWorkerAttendanceStatus(): Promise<ApiResponse<WorkerAttendanceStatusResponse>> {
    console.log('📊 Getting worker attendance status');
    return apiClient.get('/worker/attendance/status');
  }

  /**
   * 8. GET /worker/attendance/history - Attendance history with filtering
   */
  async getAttendanceHistory(projectId?: string): Promise<ApiResponse<AttendanceHistoryResponse>> {
    console.log('📚 Getting attendance history for project:', projectId);
    const params = projectId ? { projectId } : {};
    return apiClient.get('/worker/attendance/history', { params });
  }

  /**
   * Additional: POST /api/attendance/log-location - Location logging
   */
  async logLocation(request: LocationLogRequest): Promise<ApiResponse<LocationLogResponse>> {
    console.log('📍 Logging location:', request);
    return apiClient.post('/attendance/log-location', request);
  }

  /**
   * Additional: POST /api/attendance/check-alerts - Check attendance alerts
   */
  async checkAlerts(): Promise<ApiResponse<CheckAlertsResponse>> {
    console.log('🔔 Checking attendance alerts');
    return apiClient.post('/attendance/check-alerts');
  }

  /**
   * Additional: POST /api/attendance/send-lunch-reminder - Lunch reminder system
   */
  async sendLunchReminder(request: LunchReminderRequest): Promise<ApiResponse<LunchReminderResponse>> {
    console.log('🍽️ Sending lunch reminder:', request);
    return apiClient.post('/attendance/send-lunch-reminder', request);
  }

  /**
   * Additional: POST /api/attendance/send-overtime-alert - Overtime alerts
   */
  async sendOvertimeAlert(request: OvertimeAlertRequest): Promise<ApiResponse<OvertimeAlertResponse>> {
    console.log('⏰ Sending overtime alert:', request);
    return apiClient.post('/attendance/send-overtime-alert', request);
  }

  // Legacy methods for backward compatibility
  async submitAttendance(request: AttendanceSubmitRequest): Promise<ApiResponse<AttendanceSubmitResponse>> {
    console.log('📝 Submitting attendance (legacy):', request);
    return apiClient.post('/attendance/submit', request);
  }

  async getAttendanceStatus(): Promise<ApiResponse<TodaysAttendanceResponse>> {
    console.log('📊 Getting attendance status (legacy)');
    return apiClient.get('/attendance/status');
  }
}

export const attendanceApiService = new AttendanceApiService();
export default attendanceApiService;