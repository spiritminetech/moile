// DriverDynamicDataService - Centralized service for fetching dynamic driver data
// Uses driver credentials: driver1@gmail.com / Anbu24@
// Automatically fetches driverId and employeeId from login response

import { authService } from './AuthService';
import { driverApiService } from './DriverApiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../utils/constants';
import {
  TransportTask,
  VehicleInfo,
  DriverPerformance,
  DriverDashboardResponse,
  TripRecord,
  MaintenanceAlert,
} from '../../types';

interface DriverCredentials {
  email: string;
  password: string;
}

interface DriverSessionData {
  driverId: number;
  employeeId: number;
  token: string;
  name: string;
  email: string;
}

class DriverDynamicDataService {
  private static instance: DriverDynamicDataService;
  private driverSession: DriverSessionData | null = null;

  // Default driver credentials
  private readonly DEFAULT_CREDENTIALS: DriverCredentials = {
    email: 'driver1@gmail.com',
    password: 'Anbu24@',
  };

  private constructor() {}

  public static getInstance(): DriverDynamicDataService {
    if (!DriverDynamicDataService.instance) {
      DriverDynamicDataService.instance = new DriverDynamicDataService();
    }
    return DriverDynamicDataService.instance;
  }

  /**
   * Initialize driver session with authentication
   * Automatically extracts driverId and employeeId from login response
   */
  async initializeDriverSession(credentials?: DriverCredentials): Promise<DriverSessionData> {
    try {
      const creds = credentials || this.DEFAULT_CREDENTIALS;
      
      console.log('🔐 Initializing driver session with credentials:', creds.email);

      // Login with driver credentials
      const loginResponse = await authService.login(creds);

      if (!loginResponse.success || !loginResponse.user) {
        throw new Error('Driver authentication failed');
      }

      // Extract driver information from login response
      const driverId = loginResponse.user.id;
      const employeeId = loginResponse.employeeId || loginResponse.user.id;

      this.driverSession = {
        driverId,
        employeeId,
        token: loginResponse.token || '',
        name: loginResponse.user.name,
        email: loginResponse.user.email,
      };

      // Store driver session data
      await AsyncStorage.setItem(
        STORAGE_KEYS.DRIVER_SESSION,
        JSON.stringify(this.driverSession)
      );

      console.log('✅ Driver session initialized:', {
        driverId: this.driverSession.driverId,
        employeeId: this.driverSession.employeeId,
        name: this.driverSession.name,
      });

      return this.driverSession;
    } catch (error: any) {
      console.error('❌ Driver session initialization failed:', error);
      throw new Error(`Failed to initialize driver session: ${error.message}`);
    }
  }

  /**
   * Get current driver session data
   * Loads from storage if not in memory
   */
  async getDriverSession(): Promise<DriverSessionData> {
    if (this.driverSession) {
      return this.driverSession;
    }

    // Try to load from storage
    try {
      const storedSession = await AsyncStorage.getItem(STORAGE_KEYS.DRIVER_SESSION);
      if (storedSession) {
        this.driverSession = JSON.parse(storedSession);
        return this.driverSession!;
      }
    } catch (error) {
      console.warn('⚠️ Failed to load driver session from storage');
    }

    // Initialize new session if not found
    return await this.initializeDriverSession();
  }

  /**
   * Get driver ID dynamically
   */
  async getDriverId(): Promise<number> {
    const session = await this.getDriverSession();
    return session.driverId;
  }

  /**
   * Get employee ID dynamically
   */
  async getEmployeeId(): Promise<number> {
    const session = await this.getDriverSession();
    return session.employeeId;
  }

  /**
   * Clear driver session
   */
  async clearDriverSession(): Promise<void> {
    this.driverSession = null;
    await AsyncStorage.removeItem(STORAGE_KEYS.DRIVER_SESSION);
    console.log('🗑️ Driver session cleared');
  }

  // ==========================================
  // DASHBOARD DATA - Dynamic Fetching
  // ==========================================

  /**
   * Get complete dashboard data with dynamic driver ID
   */
  async getDashboardData(date?: string): Promise<DriverDashboardResponse> {
    try {
      await this.getDriverSession(); // Ensure session is initialized

      console.log('📊 Fetching dashboard data for driver...');

      const response = await driverApiService.getDashboardData(date);

      if (response.success) {
        const summary = (response as any).summary;
        
        return {
          todaysTransportTasks: [],
          assignedVehicle: summary?.currentVehicle ? {
            id: summary.currentVehicle.id,
            plateNumber: summary.currentVehicle.registrationNo,
            model: summary.currentVehicle.vehicleType || 'Unknown',
            capacity: summary.currentVehicle.capacity || 0,
            fuelLevel: 75,
            maintenanceStatus: 'good' as const
          } : null,
          performanceMetrics: {
            onTimePerformance: 95,
            completedTrips: summary?.completedTrips || 0,
            totalDistance: 0,
            fuelEfficiency: 0
          }
        };
      }

      throw new Error('Failed to fetch dashboard data');
    } catch (error: any) {
      console.error('❌ Dashboard data fetch error:', error);
      throw error;
    }
  }

  /**
   * Get today's transport tasks with dynamic driver ID
   */
  async getTodaysTransportTasks(date?: string): Promise<TransportTask[]> {
    try {
      await this.getDriverSession();

      console.log('🚛 Fetching transport tasks for driver...');

      const response = await driverApiService.getTodaysTransportTasks(date);

      if (response.success && response.data) {
        return response.data;
      }

      return [];
    } catch (error: any) {
      console.error('❌ Transport tasks fetch error:', error);
      throw error;
    }
  }

  /**
   * Get assigned vehicle with dynamic driver ID
   */
  async getAssignedVehicle(): Promise<VehicleInfo | null> {
    try {
      await this.getDriverSession();

      console.log('🚗 Fetching assigned vehicle for driver...');

      const response = await driverApiService.getAssignedVehicle();

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error: any) {
      console.error('❌ Vehicle fetch error:', error);
      return null;
    }
  }

  /**
   * Get performance metrics with dynamic driver ID
   */
  async getPerformanceMetrics(period?: 'week' | 'month' | 'quarter'): Promise<DriverPerformance | null> {
    try {
      await this.getDriverSession();

      console.log('📈 Fetching performance metrics for driver...');

      const response = await driverApiService.getPerformanceMetrics(period);

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error: any) {
      console.error('❌ Performance metrics fetch error:', error);
      return null;
    }
  }

  // ==========================================
  // ATTENDANCE DATA - Dynamic Fetching
  // ==========================================

  /**
   * Get today's attendance with dynamic driver ID
   */
  async getTodaysAttendance() {
    try {
      await this.getDriverSession();

      console.log('⏰ Fetching today\'s attendance for driver...');

      return await driverApiService.getTodaysAttendance();
    } catch (error: any) {
      console.error('❌ Attendance fetch error:', error);
      throw error;
    }
  }

  /**
   * Get attendance history with dynamic driver ID
   */
  async getAttendanceHistory(params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      await this.getDriverSession();

      console.log('📅 Fetching attendance history for driver...');

      return await driverApiService.getAttendanceHistory(params);
    } catch (error: any) {
      console.error('❌ Attendance history fetch error:', error);
      throw error;
    }
  }

  // ==========================================
  // TRIP HISTORY - Dynamic Fetching
  // ==========================================

  /**
   * Get trip history with dynamic driver ID
   */
  async getTripHistory(params?: {
    startDate?: string;
    endDate?: string;
    status?: 'completed' | 'cancelled' | 'incident';
    limit?: number;
    offset?: number;
  }) {
    try {
      await this.getDriverSession();

      console.log('🗺️ Fetching trip history for driver...');

      return await driverApiService.getTripHistory(params);
    } catch (error: any) {
      console.error('❌ Trip history fetch error:', error);
      throw error;
    }
  }

  // ==========================================
  // VEHICLE INFO - Dynamic Fetching
  // ==========================================

  /**
   * Get maintenance alerts with dynamic driver ID
   */
  async getMaintenanceAlerts(): Promise<MaintenanceAlert[]> {
    try {
      await this.getDriverSession();

      console.log('🔧 Fetching maintenance alerts for driver...');

      const response = await driverApiService.getMaintenanceAlerts();

      if (response.success && response.data) {
        return response.data;
      }

      return [];
    } catch (error: any) {
      console.error('❌ Maintenance alerts fetch error:', error);
      return [];
    }
  }

  // ==========================================
  // PROFILE DATA - Dynamic Fetching
  // ==========================================

  /**
   * Get driver profile with dynamic driver ID
   */
  async getDriverProfile() {
    try {
      await this.getDriverSession();

      console.log('👤 Fetching driver profile...');

      return await driverApiService.getDriverProfile();
    } catch (error: any) {
      console.error('❌ Driver profile fetch error:', error);
      throw error;
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Check if driver session is active
   */
  isSessionActive(): boolean {
    return this.driverSession !== null;
  }

  /**
   * Get current driver info
   */
  getCurrentDriverInfo(): DriverSessionData | null {
    return this.driverSession;
  }

  /**
   * Refresh driver session
   */
  async refreshSession(): Promise<DriverSessionData> {
    await this.clearDriverSession();
    return await this.initializeDriverSession();
  }
}

// Export singleton instance
export const driverDynamicDataService = DriverDynamicDataService.getInstance();
export default driverDynamicDataService;
