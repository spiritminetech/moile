// Application constants

// Application constants

import { Platform } from 'react-native';

// Dynamic API URL based on platform and environment
const getApiBaseUrl = (): string => {
  // If you have a custom environment variable, use it
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  // Development URLs
  if (__DEV__) {
    if (Platform.OS === 'android') {
      // Android emulator uses 10.0.2.2 to reach host machine
      return 'http://10.0.2.2:5002/api';
    } else if (Platform.OS === 'ios') {
      // iOS simulator can use localhost, but physical device needs actual IP
      return 'http://192.168.1.8:5002/api';  // Your computer's IP
    } else {
      // Web or other platforms - use your actual IP
      return 'http://192.168.1.8:5002/api';  // Your computer's IP
    }
  }

  // Production URL (replace with your actual production API)
  return 'https://your-production-api.com/api';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 15000, // Reduced from 30000 to 15000 (15 seconds)
  RETRY_ATTEMPTS: 3,
  // Mock mode for development when backend is not available
  MOCK_MODE: false, // Set to true when you don't have a backend
} as const;

export const GPS_CONFIG = {
  REQUIRED_ACCURACY: 10, // meters
  LOCATION_TIMEOUT: 15000, // milliseconds
  MAXIMUM_AGE: 60000, // milliseconds
  GEOFENCE_BUFFER: 5, // meters buffer for geofence validation
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@construction_erp:auth_token',
  REFRESH_TOKEN: '@construction_erp:refresh_token',
  USER_DATA: '@construction_erp:user_data',
  COMPANY_DATA: '@construction_erp:company_data',
  PERMISSIONS: '@construction_erp:permissions',
  TOKEN_EXPIRY: '@construction_erp:token_expiry',
  CACHED_TASKS: '@construction_erp:cached_tasks',
  CACHED_ATTENDANCE: '@construction_erp:cached_attendance',
  LAST_SYNC: '@construction_erp:last_sync',
  // Driver-specific storage keys
  DRIVER_TRANSPORT_TASKS: '@construction_erp:driver_transport_tasks',
  DRIVER_VEHICLE_INFO: '@construction_erp:driver_vehicle_info',
  DRIVER_TRIP_HISTORY: '@construction_erp:driver_trip_history',
  DRIVER_PERFORMANCE: '@construction_erp:driver_performance',
  DRIVER_MAINTENANCE_ALERTS: '@construction_erp:driver_maintenance_alerts',
  DRIVER_LAST_SYNC: '@construction_erp:driver_last_sync',
  // Supervisor-specific storage keys
  SUPERVISOR_TEAM_MEMBERS: '@construction_erp:supervisor_team_members',
  SUPERVISOR_PENDING_APPROVALS: '@construction_erp:supervisor_pending_approvals',
  SUPERVISOR_DAILY_REPORTS: '@construction_erp:supervisor_daily_reports',
  SUPERVISOR_MATERIAL_REQUESTS: '@construction_erp:supervisor_material_requests',
  SUPERVISOR_TOOL_ALLOCATIONS: '@construction_erp:supervisor_tool_allocations',
  SUPERVISOR_LAST_SYNC: '@construction_erp:supervisor_last_sync',
} as const;

// Notification types removed - notification features not needed

export const USER_ROLES = {
  WORKER: 'Worker',
  SUPERVISOR: 'Supervisor',
  DRIVER: 'Driver',
} as const;

export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export const REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

export const ATTENDANCE_SESSION_TYPES = {
  REGULAR: 'regular',
  OVERTIME: 'overtime',
  LUNCH: 'lunch',
} as const;

export const UI_CONSTANTS = {
  LARGE_BUTTON_HEIGHT: 60,
  TOUCH_TARGET_SIZE: 44,
  BORDER_RADIUS: 8,
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32,
  },
} as const;

export const COLORS = {
  PRIMARY: '#2196F3',
  SECONDARY: '#FF9800',
  SUCCESS: '#4CAF50',
  WARNING: '#FFC107',
  ERROR: '#F44336',
  BACKGROUND: '#F5F5F5',
  SURFACE: '#FFFFFF',
  TEXT_PRIMARY: '#212121',
  TEXT_SECONDARY: '#757575',
  BORDER: '#E0E0E0',
} as const;