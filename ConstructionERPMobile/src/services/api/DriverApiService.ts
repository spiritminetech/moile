// Driver API Service - Handles all driver-specific API endpoints
// Requirements: 8.1, 9.1, 10.1, 11.1, 12.1

import { apiClient } from './client';
import {
  ApiResponse,
  GeoLocation,
  DriverDashboardResponse,
  TransportTask,
  VehicleInfo,
  TripRecord,
  DriverPerformance,
  MaintenanceAlert,
  WorkerManifest,
  RouteData,
} from '../../types';

export class DriverApiService {
  // Dashboard and Overview APIs - Requirement 8.1
  async getDashboardData(date?: string): Promise<ApiResponse<DriverDashboardResponse>> {
    const params = date ? { date } : {};
    return apiClient.get('/driver/dashboard', { params });
  }

  // Transport Task Management APIs - Requirements 8.1, 9.1
  async getTodaysTransportTasks(date?: string): Promise<ApiResponse<TransportTask[]>> {
    try {
      const params = date ? { date } : {};
      console.log('🚛 Making API call to /driver/transport/tasks with params:', params);
      
      const response = await apiClient.get('/driver/transport/tasks', { params });
      console.log('📊 Raw API response:', {
        success: response.success,
        dataType: typeof response.data,
        hasData: !!response.data,
        message: response.message
      });
      
      if (response.success && response.data) {
        const tasks = Array.isArray(response.data) ? response.data : [];
        console.log('✅ Transport tasks loaded successfully:', tasks.length);
        
        return {
          success: true,
          data: tasks,
          message: response.message
        };
      }
      
      console.log('⚠️ No transport tasks found, returning empty array');
      return {
        success: true,
        data: [],
        message: 'No transport tasks found'
      };
      
    } catch (error: any) {
      console.error('❌ getTodaysTransportTasks error:', error);
      
      if (error.message?.includes('401') || error.code === 'UNAUTHORIZED') {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      if (error.message?.includes('Network Error') || error.code === 'NETWORK_ERROR') {
        throw new Error('Network connection failed. Please check your internet connection.');
      }
      
      throw error;
    }
  }

  async getTransportTaskDetails(taskId: number): Promise<ApiResponse<TransportTask>> {
    return apiClient.get(`/driver/transport/tasks/${taskId}`);
  }

  async updateTransportTaskStatus(
    taskId: number, 
    status: TransportTask['status'],
    location?: GeoLocation,
    notes?: string
  ): Promise<ApiResponse<{
    taskId: number;
    status: string;
    updatedAt: string;
    location?: {
      latitude: number;
      longitude: number;
      timestamp: string;
    };
  }>> {
    const payload: any = { status };
    
    if (location) {
      payload.location = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: location.timestamp.toISOString(),
      };
    }
    
    if (notes) {
      payload.notes = notes;
    }
    
    return apiClient.put(`/driver/transport/tasks/${taskId}/status`, payload);
  }

  // Route Management APIs - Requirement 9.1
  async optimizeRoute(taskId: number): Promise<ApiResponse<RouteData>> {
    return apiClient.post(`/driver/transport/tasks/${taskId}/optimize-route`);
  }

  async getRouteNavigation(taskId: number): Promise<ApiResponse<{
    currentLocation: {
      latitude: number;
      longitude: number;
    };
    nextDestination: {
      name: string;
      address: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
      estimatedArrival: string;
      distance: number;
    };
    routeInstructions: Array<{
      instruction: string;
      distance: number;
      duration: number;
    }>;
  }>> {
    return apiClient.get(`/driver/transport/tasks/${taskId}/navigation`);
  }

  // Worker Pickup/Dropoff Management APIs - Requirements 9.1, 9.2, 9.3
  async getWorkerManifests(taskId: number): Promise<ApiResponse<WorkerManifest[]>> {
    return apiClient.get(`/driver/transport/tasks/${taskId}/manifests`);
  }

  async checkInWorker(
    locationId: number, 
    workerId: number, 
    location: GeoLocation,
    photo?: File
  ): Promise<ApiResponse<{
    success: boolean;
    message: string;
    checkInTime: string;
    workerName: string;
    locationName: string;
  }>> {
    const formData = new FormData();
    formData.append('workerId', workerId.toString());
    formData.append('latitude', location.latitude.toString());
    formData.append('longitude', location.longitude.toString());
    formData.append('accuracy', location.accuracy.toString());
    formData.append('timestamp', location.timestamp.toISOString());
    
    if (photo) {
      formData.append('photo', photo);
    }
    
    return apiClient.uploadFile(`/driver/transport/locations/${locationId}/checkin`, formData);
  }

  async checkOutWorker(
    locationId: number, 
    workerId: number, 
    location: GeoLocation
  ): Promise<ApiResponse<{
    success: boolean;
    message: string;
    checkOutTime: string;
    workerName: string;
    locationName: string;
  }>> {
    return apiClient.post(`/driver/transport/locations/${locationId}/checkout`, {
      workerId,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: location.timestamp.toISOString(),
      },
    });
  }

  async confirmPickupComplete(
    taskId: number, 
    locationId: number, 
    location: GeoLocation,
    workerCount: number,
    notes?: string,
    photo?: File
  ): Promise<ApiResponse<{
    success: boolean;
    message: string;
    pickupTime: string;
    workersPickedUp: number;
    nextLocation?: {
      name: string;
      estimatedArrival: string;
    };
  }>> {
    const formData = new FormData();
    formData.append('locationId', locationId.toString());
    formData.append('workerCount', workerCount.toString());
    formData.append('latitude', location.latitude.toString());
    formData.append('longitude', location.longitude.toString());
    formData.append('accuracy', location.accuracy.toString());
    formData.append('timestamp', location.timestamp.toISOString());
    
    if (notes) {
      formData.append('notes', notes);
    }
    
    if (photo) {
      formData.append('photo', photo);
    }
    
    return apiClient.uploadFile(`/driver/transport/tasks/${taskId}/pickup-complete`, formData);
  }

  async confirmDropoffComplete(
    taskId: number, 
    location: GeoLocation,
    workerCount: number,
    notes?: string,
    photo?: File
  ): Promise<ApiResponse<{
    success: boolean;
    message: string;
    dropoffTime: string;
    workersDroppedOff: number;
    tripCompleted: boolean;
  }>> {
    const formData = new FormData();
    formData.append('workerCount', workerCount.toString());
    formData.append('latitude', location.latitude.toString());
    formData.append('longitude', location.longitude.toString());
    formData.append('accuracy', location.accuracy.toString());
    formData.append('timestamp', location.timestamp.toISOString());
    
    if (notes) {
      formData.append('notes', notes);
    }
    
    if (photo) {
      formData.append('photo', photo);
    }
    
    return apiClient.uploadFile(`/driver/transport/tasks/${taskId}/dropoff-complete`, formData);
  }

  // Trip Updates and Reporting APIs - Requirements 10.1, 10.2, 10.3
  async reportDelay(
    taskId: number, 
    delayInfo: {
      reason: string;
      estimatedDelay: number; // in minutes
      location: GeoLocation;
      description: string;
    }
  ): Promise<ApiResponse<{
    success: boolean;
    message: string;
    delayId: string;
    notificationSent: boolean;
  }>> {
    return apiClient.post(`/driver/transport/tasks/${taskId}/delay`, {
      reason: delayInfo.reason,
      estimatedDelay: delayInfo.estimatedDelay,
      description: delayInfo.description,
      location: {
        latitude: delayInfo.location.latitude,
        longitude: delayInfo.location.longitude,
        accuracy: delayInfo.location.accuracy,
        timestamp: delayInfo.location.timestamp.toISOString(),
      },
    });
  }

  async reportBreakdown(
    taskId: number, 
    breakdownInfo: {
      description: string;
      severity: 'minor' | 'major' | 'critical';
      location: GeoLocation;
      assistanceRequired: boolean;
      photos?: File[];
    }
  ): Promise<ApiResponse<{
    success: boolean;
    message: string;
    incidentId: string;
    emergencyContactNotified: boolean;
  }>> {
    const formData = new FormData();
    formData.append('description', breakdownInfo.description);
    formData.append('severity', breakdownInfo.severity);
    formData.append('assistanceRequired', breakdownInfo.assistanceRequired.toString());
    formData.append('latitude', breakdownInfo.location.latitude.toString());
    formData.append('longitude', breakdownInfo.location.longitude.toString());
    formData.append('accuracy', breakdownInfo.location.accuracy.toString());
    formData.append('timestamp', breakdownInfo.location.timestamp.toISOString());
    
    if (breakdownInfo.photos && breakdownInfo.photos.length > 0) {
      breakdownInfo.photos.forEach((photo, index) => {
        formData.append('photos', photo);
      });
    }
    
    return apiClient.uploadFile(`/driver/transport/tasks/${taskId}/breakdown`, formData);
  }

  async uploadTripPhotos(
    taskId: number, 
    photos: File[], 
    category: 'pickup' | 'dropoff' | 'incident' | 'vehicle_check',
    description?: string
  ): Promise<ApiResponse<{
    success: boolean;
    message: string;
    uploadedPhotos: Array<{
      photoId: string;
      filename: string;
      url: string;
      category: string;
      uploadedAt: string;
    }>;
  }>> {
    const formData = new FormData();
    formData.append('category', category);
    
    if (description) {
      formData.append('description', description);
    }
    
    photos.forEach((photo, index) => {
      formData.append('photos', photo);
    });
    
    return apiClient.uploadFile(`/driver/transport/tasks/${taskId}/photos`, formData);
  }

  // Driver Attendance APIs - Requirements 11.1, 11.2, 11.3
  async clockIn(data: {
    vehicleId: number;
    location: GeoLocation;
    preCheckCompleted: boolean;
    mileageReading?: number;
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    checkInTime: string;
    session: 'CHECKED_IN';
    vehicleAssigned: {
      id: number;
      plateNumber: string;
      model: string;
    };
  }>> {
    console.log('⏰ Driver Clock In API call:', data);
    return apiClient.post('/driver/attendance/clock-in', {
      vehicleId: data.vehicleId,
      preCheckCompleted: data.preCheckCompleted,
      mileageReading: data.mileageReading,
      location: {
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        accuracy: data.location.accuracy,
        timestamp: data.location.timestamp.toISOString(),
      },
    });
  }

  async clockOut(data: {
    vehicleId: number;
    location: GeoLocation;
    postCheckCompleted: boolean;
    mileageReading?: number;
    fuelLevel?: number;
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    checkOutTime: string;
    session: 'CHECKED_OUT';
    totalHours: number;
    totalDistance: number;
  }>> {
    console.log('⏰ Driver Clock Out API call:', data);
    return apiClient.post('/driver/attendance/clock-out', {
      vehicleId: data.vehicleId,
      postCheckCompleted: data.postCheckCompleted,
      mileageReading: data.mileageReading,
      fuelLevel: data.fuelLevel,
      location: {
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        accuracy: data.location.accuracy,
        timestamp: data.location.timestamp.toISOString(),
      },
    });
  }

  async getTodaysAttendance(): Promise<ApiResponse<{
    session: 'NOT_LOGGED_IN' | 'CHECKED_IN' | 'CHECKED_OUT';
    checkInTime: string | null;
    checkOutTime: string | null;
    assignedVehicle: {
      id: number;
      plateNumber: string;
      model: string;
    } | null;
    totalHours: number;
    totalDistance: number;
    date: string;
  }>> {
    return apiClient.get('/driver/attendance/today');
  }

  async getAttendanceHistory(params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    records: Array<{
      date: string;
      checkInTime: string | null;
      checkOutTime: string | null;
      vehicleId: number;
      vehiclePlateNumber: string;
      totalHours: number;
      totalDistance: number;
      tripsCompleted: number;
    }>;
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }>> {
    return apiClient.get('/driver/attendance/history', { params });
  }

  // Vehicle Information and Management APIs - Requirements 12.1, 12.2, 12.3
  async getAssignedVehicle(): Promise<ApiResponse<VehicleInfo>> {
    try {
      const response = await apiClient.get<VehicleInfo>('/driver/vehicle/assigned');
      
      if (response.success && response.data) {
        console.log('✅ Vehicle info loaded successfully');
        return response;
      }
      
      console.log('⚠️ No vehicle assigned');
      return {
        success: false,
        data: {} as VehicleInfo,
        message: 'No vehicle assigned'
      };
      
    } catch (error: any) {
      console.error('❌ getAssignedVehicle error:', error);
      throw error;
    }
  }

  async getMaintenanceAlerts(): Promise<ApiResponse<MaintenanceAlert[]>> {
    try {
      const response = await apiClient.get('/driver/vehicle/maintenance-alerts');
      
      if (response.success) {
        const alerts = Array.isArray(response.data) ? response.data : [];
        console.log('✅ Maintenance alerts loaded:', alerts.length);
        
        return {
          success: true,
          data: alerts,
          message: response.message
        };
      }
      
      return {
        success: true,
        data: [],
        message: 'No maintenance alerts'
      };
      
    } catch (error: any) {
      console.error('❌ getMaintenanceAlerts error:', error);
      // Return empty array instead of failing
      return {
        success: true,
        data: [],
        message: 'No maintenance alerts available'
      };
    }
  }

  async addFuelLog(fuelData: {
    vehicleId: number;
    amount: number;
    cost: number;
    mileage: number;
    location: string;
    receiptPhoto?: File;
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    fuelLogId: number;
    currentFuelLevel: number;
  }>> {
    const formData = new FormData();
    formData.append('vehicleId', fuelData.vehicleId.toString());
    formData.append('amount', fuelData.amount.toString());
    formData.append('cost', fuelData.cost.toString());
    formData.append('mileage', fuelData.mileage.toString());
    formData.append('location', fuelData.location);
    
    if (fuelData.receiptPhoto) {
      formData.append('receiptPhoto', fuelData.receiptPhoto);
    }
    
    return apiClient.uploadFile('/driver/vehicle/fuel-log', formData);
  }

  async reportVehicleIssue(issueData: {
    vehicleId: number;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'mechanical' | 'electrical' | 'body' | 'safety' | 'other';
    location: GeoLocation;
    photos?: File[];
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    issueId: string;
    maintenanceRequired: boolean;
  }>> {
    const formData = new FormData();
    formData.append('vehicleId', issueData.vehicleId.toString());
    formData.append('description', issueData.description);
    formData.append('severity', issueData.severity);
    formData.append('category', issueData.category);
    formData.append('latitude', issueData.location.latitude.toString());
    formData.append('longitude', issueData.location.longitude.toString());
    formData.append('accuracy', issueData.location.accuracy.toString());
    formData.append('timestamp', issueData.location.timestamp.toISOString());
    
    if (issueData.photos && issueData.photos.length > 0) {
      issueData.photos.forEach((photo, index) => {
        formData.append('photos', photo);
      });
    }
    
    return apiClient.uploadFile('/driver/vehicle/issue-report', formData);
  }

  async performVehiclePreCheck(checkData: {
    vehicleId: number;
    checkItems: Array<{
      item: string;
      status: 'ok' | 'needs_attention' | 'critical';
      notes?: string;
    }>;
    overallStatus: 'safe_to_drive' | 'needs_attention' | 'unsafe';
    photos?: File[];
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    checkId: string;
    canProceed: boolean;
  }>> {
    const formData = new FormData();
    formData.append('vehicleId', checkData.vehicleId.toString());
    formData.append('checkItems', JSON.stringify(checkData.checkItems));
    formData.append('overallStatus', checkData.overallStatus);
    
    if (checkData.photos && checkData.photos.length > 0) {
      checkData.photos.forEach((photo, index) => {
        formData.append('photos', photo);
      });
    }
    
    return apiClient.uploadFile('/driver/vehicle/pre-check', formData);
  }

  // Trip History and Performance APIs - Requirements 11.1, 12.1
  async getTripHistory(params?: {
    startDate?: string;
    endDate?: string;
    status?: 'completed' | 'cancelled' | 'incident';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    trips: TripRecord[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    summary: {
      totalTrips: number;
      completedTrips: number;
      totalDistance: number;
      totalHours: number;
      averageRating: number;
    };
  }>> {
    return apiClient.get('/driver/trips/history', { params });
  }

  async getPerformanceMetrics(period?: 'week' | 'month' | 'quarter'): Promise<ApiResponse<DriverPerformance>> {
    const params = period ? { period } : {};
    return apiClient.get('/driver/performance/metrics', { params });
  }

  async getMonthlyStats(year?: number): Promise<ApiResponse<Array<{
    month: string;
    tripsCompleted: number;
    onTimePerformance: number;
    fuelEfficiency: number;
    totalDistance: number;
    totalHours: number;
    incidentCount: number;
  }>>> {
    const params = year ? { year } : {};
    return apiClient.get('/driver/performance/monthly-stats', { params });
  }

  async submitTripRecord(tripData: {
    taskId: number;
    completedAt: Date;
    totalDistance: number;
    fuelUsed: number;
    workersTransported: number;
    delays: Array<{
      reason: string;
      duration: number;
      location: string;
    }>;
    notes?: string;
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    tripId: number;
    performanceImpact: {
      onTimePerformance: number;
      fuelEfficiency: number;
    };
  }>> {
    return apiClient.post('/driver/trips/submit', {
      ...tripData,
      completedAt: tripData.completedAt.toISOString(),
    });
  }

  // Profile and Settings APIs - Requirement 15.1
  async getDriverProfile(): Promise<ApiResponse<{
    user: {
      id: number;
      name: string;
      email: string;
      phone: string;
      profileImage?: string;
      employeeId: string;
    };
    driverInfo: {
      licenseNumber: string;
      licenseClass: string;
      licenseExpiry: string;
      yearsOfExperience: number;
      specializations: string[];
    };
    assignedVehicles: Array<{
      id: number;
      plateNumber: string;
      model: string;
      isPrimary: boolean;
    }>;
    certifications: Array<{
      id: number;
      name: string;
      issuer: string;
      issueDate: string;
      expiryDate: string;
      status: 'active' | 'expired' | 'expiring_soon';
    }>;
    performanceSummary: {
      totalTrips: number;
      onTimePerformance: number;
      safetyScore: number;
      customerRating: number;
    };
  }>> {
    try {
      const response = await apiClient.get<{
        user: {
          id: number;
          name: string;
          email: string;
          phone: string;
          profileImage?: string;
          employeeId: string;
        };
        driverInfo: {
          licenseNumber: string;
          licenseClass: string;
          licenseExpiry: string;
          yearsOfExperience: number;
          specializations: string[];
        };
        assignedVehicles: Array<{
          id: number;
          plateNumber: string;
          model: string;
          isPrimary: boolean;
        }>;
        certifications: Array<{
          id: number;
          name: string;
          issuer: string;
          issueDate: string;
          expiryDate: string;
          status: 'active' | 'expired' | 'expiring_soon';
        }>;
        performanceSummary: {
          totalTrips: number;
          onTimePerformance: number;
          safetyScore: number;
          customerRating: number;
        };
      }>('/driver/profile');
      
      if (response.success) {
        console.log('✅ Driver profile loaded successfully');
        return response;
      }
      
      return {
        success: false,
        data: {} as any,
        message: response.message || 'Failed to load driver profile'
      };
    } catch (error) {
      console.error('❌ getDriverProfile error:', error);
      throw error;
    }
  }

  async updateDriverProfile(profileData: {
    phone?: string;
    licenseNumber?: string;
    licenseClass?: string;
    licenseExpiry?: Date;
    specializations?: string[];
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    updatedFields: string[];
  }>> {
    const payload: any = { ...profileData };
    if (profileData.licenseExpiry) {
      payload.licenseExpiry = profileData.licenseExpiry.toISOString();
    }
    
    return apiClient.put('/driver/profile', payload);
  }

  async uploadDriverPhoto(photo: File): Promise<ApiResponse<{
    success: boolean;
    message: string;
    photoUrl: string;
  }>> {
    const formData = new FormData();
    formData.append('photo', photo);
    
    return apiClient.uploadFile('/driver/profile/photo', formData);
  }

  // Emergency and Support APIs
  async getEmergencyContacts(): Promise<ApiResponse<Array<{
    id: number;
    name: string;
    role: string;
    phone: string;
    email?: string;
    isEmergency: boolean;
    category: 'dispatch' | 'maintenance' | 'emergency' | 'supervisor';
  }>>> {
    return apiClient.get('/driver/support/emergency-contacts');
  }

  async requestEmergencyAssistance(assistanceData: {
    type: 'breakdown' | 'accident' | 'medical' | 'security';
    location: GeoLocation;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    vehicleId?: number;
    taskId?: number;
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    assistanceId: string;
    estimatedArrival?: string;
    contactNumber: string;
  }>> {
    return apiClient.post('/driver/support/emergency-assistance', {
      ...assistanceData,
      location: {
        latitude: assistanceData.location.latitude,
        longitude: assistanceData.location.longitude,
        accuracy: assistanceData.location.accuracy,
        timestamp: assistanceData.location.timestamp.toISOString(),
      },
    });
  }
}

// Export singleton instance
export const driverApiService = new DriverApiService();
export default driverApiService;