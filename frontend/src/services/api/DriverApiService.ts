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
    return apiClient.get('/driver/dashboard/summary', { params });
  }

  // Transport Task Management APIs - Requirements 8.1, 9.1
  async getTodaysTransportTasks(date?: string): Promise<ApiResponse<TransportTask[]>> {
    try {
      const params = date ? { date } : {};
      console.log('🚛 Making API call to /driver/transport-tasks with params:', params);
      
      const response = await apiClient.get('/driver/transport-tasks', { params });
      console.log('📊 Raw API response:', {
        success: response.success,
        dataType: typeof response.data,
        hasData: !!response.data,
        message: response.message
      });
      
      if (response.success && response.data) {
        // Transform backend response to match TransportTask interface
        const tasks = Array.isArray(response.data) ? response.data.map((task: any) => {
          // ✅ FIX: Don't create fake worker data - leave it empty
          // Worker manifests will be loaded separately via getWorkerManifests API
          const totalWorkers = task.totalWorkers || task.passengers || 0;
          const checkedInWorkers = task.checkedInWorkers || 0;

          return {
            taskId: task.taskId,
            route: `${task.pickupLocation} → ${task.dropLocation}`,
            pickupLocations: [{
              locationId: task.taskId * 100, // Generate unique location ID
              name: task.pickupLocation || 'Pickup Location',
              address: task.pickupLocation || '',
              coordinates: {
                latitude: 0, // TODO: Get from backend
                longitude: 0
              },
              workerManifest: [],  // ✅ Empty - will be loaded via getWorkerManifests
              estimatedPickupTime: task.startTime,
              actualPickupTime: undefined
            }],
            dropoffLocation: {
              name: task.dropLocation || 'Drop Location',
              address: task.dropLocation || '',
              coordinates: {
                latitude: 0, // TODO: Get from backend
                longitude: 0
              },
              estimatedArrival: task.endTime,
              actualArrival: undefined
            },
            status: this.mapBackendStatus(task.status),
            totalWorkers: totalWorkers,
            checkedInWorkers: checkedInWorkers
          };
        }) : [];
        
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

  // Helper method to map backend status to frontend status
  private mapBackendStatus(backendStatus: string): TransportTask['status'] {
    const statusMap: Record<string, TransportTask['status']> = {
      'PLANNED': 'pending',
      'ONGOING': 'en_route_pickup',
      'PICKUP_COMPLETE': 'pickup_complete',
      'EN_ROUTE_DROPOFF': 'en_route_dropoff',
      'COMPLETED': 'completed',
      'CANCELLED': 'completed'
    };
    return statusMap[backendStatus] || 'pending';
  }

  async getTransportTaskDetails(taskId: number): Promise<ApiResponse<TransportTask>> {
    return apiClient.get(`/driver/transport-tasks/${taskId}`);
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
    
    return apiClient.put(`/driver/transport-tasks/${taskId}/status`, payload);
  }

  // Route Management APIs - Requirement 9.1
  // Basic route management only - no optimization features

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
    return apiClient.get(`/driver/transport-tasks/${taskId}/navigation`);
  }

  // Worker Pickup/Dropoff Management APIs - Requirements 9.1, 9.2, 9.3
  async getWorkerManifests(taskId: number): Promise<ApiResponse<WorkerManifest[]>> {
    return apiClient.get(`/driver/transport-tasks/${taskId}/manifests`);
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
    
    return apiClient.uploadFile(`/driver/transport-tasks/locations/${locationId}/checkin`, formData);
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
    return apiClient.post(`/driver/transport-tasks/locations/${locationId}/checkout`, {
      workerId,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: location.timestamp.toISOString(),
      },
    });
  }

  // Enhanced pickup completion with validation
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
    validationResults: {
      timeWindowValid: boolean;
      geofenceValid: boolean;
      workerCountValid: boolean;
    };
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
    
    return apiClient.uploadFile(`/driver/transport-tasks/${taskId}/pickup-complete`, formData);
  }

  // Enhanced dropoff completion with validation
  async confirmDropoffComplete(
    taskId: number, 
    location: GeoLocation,
    workerCount: number,
    notes?: string,
    photo?: File,
    workerIds?: number[]  // ✅ NEW: Array of worker IDs to drop
  ): Promise<ApiResponse<{
    success: boolean;
    message: string;
    dropoffTime: string;
    workersDroppedOff: number;
    validationResults: {
      geofenceValid: boolean;
      workerCountValid: boolean;
    };
    tripCompleted: boolean;
    moduleIntegration: ModuleIntegration;
  }>> {
    const formData = new FormData();
    formData.append('workerCount', workerCount.toString());
    formData.append('latitude', location.latitude.toString());
    formData.append('longitude', location.longitude.toString());
    formData.append('accuracy', location.accuracy.toString());
    formData.append('timestamp', location.timestamp.toISOString());
    
    // ✅ NEW: Send workerIds array if provided
    if (workerIds && workerIds.length > 0) {
      formData.append('workerIds', JSON.stringify(workerIds));
    }
    
    if (notes) {
      formData.append('notes', notes);
    }
    
    if (photo) {
      formData.append('photo', photo);
    }
    
    return apiClient.uploadFile(`/driver/transport-tasks/${taskId}/dropoff-complete`, formData);
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
    date: string;
  }>> {
    try {
      const response = await apiClient.get('/driver/attendance/today');
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: 'Today\'s attendance retrieved successfully'
        };
      }
      
      // Fallback to default if no data
      return {
        success: true,
        data: {
          session: 'NOT_LOGGED_IN',
          checkInTime: null,
          checkOutTime: null,
          assignedVehicle: null,
          totalHours: 0,
          date: new Date().toISOString().split('T')[0]
        },
        message: 'No attendance data for today'
      };
    } catch (error: any) {
      console.error('❌ getTodaysAttendance error:', error);
      throw error;
    }
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
      tripsCompleted: number;
    }>;
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }>> {
    try {
      const response = await apiClient.get('/driver/attendance/history', { params });
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: 'Attendance history retrieved successfully'
        };
      }
      
      // No data found, return empty
      return {
        success: true,
        data: {
          records: [],
          pagination: {
            total: 0,
            limit: params?.limit || 20,
            offset: params?.offset || 0,
            hasMore: false
          }
        },
        message: 'No attendance history found'
      };
    } catch (error: any) {
      console.error('❌ getAttendanceHistory error:', error);
      throw error;
    }
  }

  // Vehicle Information and Management APIs - Requirements 12.1, 12.2, 12.3
  async getAssignedVehicle(): Promise<ApiResponse<VehicleInfo>> {
    try {
      const response = await apiClient.get<any>('/driver/dashboard/vehicle');
      
      if (response.success && response.vehicle) {
        console.log('✅ Vehicle info loaded successfully:', response.vehicle);
        return {
          success: true,
          data: response.vehicle,
          message: response.message || 'Vehicle loaded successfully'
        };
      }
      
      console.log('⚠️ No vehicle assigned');
      return {
        success: false,
        data: {} as VehicleInfo,
        message: response.message || 'No vehicle assigned'
      };
      
    } catch (error: any) {
      console.error('❌ getAssignedVehicle error:', error);
      throw error;
    }
  }
  /**
   * Get maintenance alerts for the driver's assigned vehicle
   */
  async getMaintenanceAlerts(): Promise<ApiResponse<MaintenanceAlert[]>> {
    try {
      console.log('🔧 Fetching maintenance alerts...');

      const response = await apiClient.get<MaintenanceAlert[]>('/driver/vehicle/maintenance-alerts');

      console.log('✅ Maintenance alerts response:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching maintenance alerts:', error);
      throw error;
    }
  }

  // Fuel Log Management APIs - Requirement 12.4
  async submitFuelLog(fuelData: {
    vehicleId: number;
    amount: number;
    cost: number;
    mileage: number;
    location: string;
    receiptPhoto?: string;
    gpsLocation?: { latitude: number; longitude: number };
  }): Promise<ApiResponse<any>> {
    try {
      console.log('⛽ Submitting fuel log:', fuelData);

      const response = await apiClient.post('/driver/vehicle/fuel-log', {
        vehicleId: fuelData.vehicleId,
        date: new Date().toISOString(),
        amount: fuelData.amount,
        cost: fuelData.cost,
        mileage: fuelData.mileage,
        location: fuelData.location,
        receiptPhoto: fuelData.receiptPhoto || null,
        gpsLocation: fuelData.gpsLocation || { latitude: null, longitude: null }
      });

      console.log('✅ Fuel log submitted successfully:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error submitting fuel log:', error);
      throw error;
    }
  }

  async getFuelLogHistory(vehicleId?: number, limit: number = 10): Promise<ApiResponse<any>> {
    try {
      const params: any = { limit };
      if (vehicleId) {
        params.vehicleId = vehicleId;
      }

      const response = await apiClient.get('/driver/vehicle/fuel-log', { params });
      return response;
    } catch (error: any) {
      console.error('❌ Error getting fuel log history:', error);
      throw error;
    }
  }

  async getVehicleFuelLog(vehicleId: number, limit: number = 5): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get(`/driver/vehicle/${vehicleId}/fuel-log`, {
        params: { limit }
      });
      return response;
    } catch (error: any) {
      console.error('❌ Error getting vehicle fuel log:', error);
      throw error;
    }
  }

  // Vehicle Issue Reporting APIs - Requirement 12.5
  async reportVehicleIssue(issueData: {
    vehicleId: number;
    category: 'mechanical' | 'electrical' | 'safety' | 'other';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    location?: { latitude: number; longitude: number; address?: string };
    photos?: string[];
    immediateAssistance?: boolean;
  }): Promise<ApiResponse<any>> {
    try {
      console.log('🔧 Reporting vehicle issue:', issueData);

      const response = await apiClient.post('/driver/vehicle/report-issue', issueData);

      console.log('✅ Vehicle issue reported successfully:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error reporting vehicle issue:', error);
      throw error;
    }
  }

  async getVehicleIssues(vehicleId?: number, status?: string, limit: number = 10): Promise<ApiResponse<any>> {
    try {
      const params: any = { limit };
      if (vehicleId) {
        params.vehicleId = vehicleId;
      }
      if (status) {
        params.status = status;
      }

      const response = await apiClient.get('/driver/vehicle/issues', { params });
      return response;
    } catch (error: any) {
      console.error('❌ Error getting vehicle issues:', error);
      throw error;
    }
  }

  // Vehicle Inspection (Pre-Check) APIs - Requirement 12.5
  async submitVehicleInspection(inspectionData: {
    vehicleId: number;
    checklist: {
      tires: { status: 'pass' | 'fail' | 'needs_attention'; notes?: string; photos?: string[] };
      lights: { status: 'pass' | 'fail' | 'needs_attention'; notes?: string; photos?: string[] };
      brakes: { status: 'pass' | 'fail' | 'needs_attention'; notes?: string; photos?: string[] };
      steering: { status: 'pass' | 'fail' | 'needs_attention'; notes?: string; photos?: string[] };
      fluids: { status: 'pass' | 'fail' | 'needs_attention'; notes?: string; photos?: string[] };
      mirrors: { status: 'pass' | 'fail' | 'needs_attention'; notes?: string; photos?: string[] };
      seatbelts: { status: 'pass' | 'fail' | 'needs_attention'; notes?: string; photos?: string[] };
      horn: { status: 'pass' | 'fail' | 'needs_attention'; notes?: string; photos?: string[] };
      wipers: { status: 'pass' | 'fail' | 'needs_attention'; notes?: string; photos?: string[] };
      emergencyEquipment: { status: 'pass' | 'fail' | 'needs_attention'; notes?: string; photos?: string[] };
      interior: { status: 'pass' | 'fail' | 'needs_attention'; notes?: string; photos?: string[] };
      exterior: { status: 'pass' | 'fail' | 'needs_attention'; notes?: string; photos?: string[] };
    };
    odometerReading: number;
    location?: { latitude: number; longitude: number; address?: string };
    signature?: string;
    inspectionType?: 'pre_trip' | 'post_trip' | 'scheduled';
  }): Promise<ApiResponse<any>> {
    try {
      console.log('🔍 Submitting vehicle inspection:', {
        vehicleId: inspectionData.vehicleId,
        odometerReading: inspectionData.odometerReading,
        hasSignature: !!inspectionData.signature
      });

      const response = await apiClient.post('/driver/vehicle/inspection', inspectionData);

      console.log('✅ Vehicle inspection submitted successfully:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error submitting vehicle inspection:', error);
      throw error;
    }
  }

  async getVehicleInspections(vehicleId?: number, limit: number = 5): Promise<ApiResponse<any>> {
    try {
      const params: any = { limit };
      if (vehicleId) {
        params.vehicleId = vehicleId;
      }

      const response = await apiClient.get('/driver/vehicle/inspections', { params });
      return response;
    } catch (error: any) {
      console.error('❌ Error getting vehicle inspections:', error);
      throw error;
    }
  }

  async getVehicleInspectionDetails(inspectionId: number): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get(`/driver/vehicle/inspection/${inspectionId}`);
      return response;
    } catch (error: any) {
      console.error('❌ Error getting vehicle inspection details:', error);
      throw error;
    }
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

  // Submit completed trip data
  async submitTrip(tripData: {
    tripId: number;
    completedAt: Date;
    [key: string]: any;
  }): Promise<ApiResponse<any>> {
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
      companyName: string;
      employmentStatus: string;
    };
    driverInfo: {
      licenseNumber: string;
      licenseClass: string;
      licenseIssueDate: string | null;
      licenseExpiry: string;
      licenseIssuingAuthority: string;
      licensePhotoUrl: string | null;
      yearsOfExperience: number;
      specializations: string[];
    };
    emergencyContact: {
      name: string | null;
      relationship: string | null;
      phone: string | null;
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
          companyName: string;
          employmentStatus: string;
        };
        driverInfo: {
          licenseNumber: string;
          licenseClass: string;
          licenseIssueDate: string | null;
          licenseExpiry: string;
          licenseIssuingAuthority: string;
          licensePhotoUrl: string | null;
          yearsOfExperience: number;
          specializations: string[];
        };
        emergencyContact: {
          name: string | null;
          relationship: string | null;
          phone: string | null;
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
        // Return the data directly from response.data
        return {
          success: true,
          data: response.data,
          message: response.message
        };
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
    emergencyContact?: {
      name?: string | null;
      relationship?: string | null;
      phone?: string | null;
    };
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    updatedFields: string[];
  }>> {
    return apiClient.put('/driver/profile', profileData);
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
  async changePassword(passwordData: {
    oldPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.put('/driver/profile/password', passwordData);
      return response;
    } catch (error: any) {
      console.error('❌ changePassword error:', error);
      throw error;
    }
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

  // ==============================
  // GPS Navigation & Route Deviation APIs
  // ==============================
  
  /**
   * Get GPS navigation links for a transport task
   * @param taskId - Transport task ID
   * @param locationId - Optional specific location ID
   */
  async getNavigationLinks(taskId: string | number, locationId?: string): Promise<ApiResponse<{
    googleMaps: string;
    waze: string;
    appleMaps: string;
    location: {
      id?: string | null;
      name: string;
      address: string;
      type: string;
      latitude: number;
      longitude: number;
    };
  }>> {
    const params = locationId ? { locationId } : {};
    return apiClient.get(`/driver/transport-tasks/${taskId}/navigation-links`, { params });
  }

  /**
   * Report route deviation during transport
   * @param taskId - Transport task ID
   * @param deviationData - Deviation details
   */
  async reportRouteDeviation(taskId: string | number, deviationData: {
    currentLocation: {
      latitude: number;
      longitude: number;
    };
    plannedRoute?: {
      currentWaypoint: {
        latitude: number;
        longitude: number;
      };
    };
    deviationDistance: number;
    reason?: string;
    autoDetected?: boolean;
  }): Promise<ApiResponse<{
    deviationId: number;
    logged: boolean;
    supervisorNotified: boolean;
    allowedDeviation: boolean;
    requiresApproval: boolean;
    estimatedDelay: number;
  }>> {
    return apiClient.post(`/driver/transport-tasks/${taskId}/route-deviation`, deviationData);
  }

  /**
   * Get route deviation history for a transport task
   * @param taskId - Transport task ID
   */
  async getRouteDeviationHistory(taskId: string | number): Promise<ApiResponse<Array<{
    deviationId: number;
    timestamp: Date;
    driverId: number;
    driverName: string;
    currentLocation: {
      latitude: number;
      longitude: number;
    };
    plannedLocation: {
      latitude: number;
      longitude: number;
    };
    deviationDistance: number;
    reason: string;
    autoDetected: boolean;
    supervisorNotified: boolean;
    estimatedDelay: number;
    resolved: boolean;
    resolvedAt?: Date;
  }>>> {
    return apiClient.get(`/driver/transport-tasks/${taskId}/route-deviations`);
  }

  // ==============================
  // Transport Delay & Attendance Impact APIs
  // ==============================

  /**
   * Get transport attendance impact for a task
   * @param taskId - Transport task ID
   */
  async getTransportAttendanceImpact(taskId: string | number): Promise<ApiResponse<{
    taskId: number;
    taskCode: string;
    projectName: string;
    summary: {
      totalDeviations: number;
      totalEstimatedDelay: number;
      workersAffected: number;
      workersLinkedToDelay: number;
      supervisorNotifications: number;
    };
    transportDelays: Array<{
      delayId: number;
      timestamp: Date;
      duration: number;
      reason: string;
      location: {
        latitude: number;
        longitude: number;
      };
    }>;
    affectedWorkers: Array<{
      workerId: string;
      name: string;
      employeeId: string;
      expectedCheckIn: Date;
      actualCheckIn: Date;
      lateMinutes: number;
      linkedToTransportDelay: boolean;
      attendanceStatus: string;
    }>;
    supervisorNotifications: Array<{
      notificationId: string;
      sentAt: Date;
      message: string;
    }>;
    timeline: Array<{
      time: Date;
      event: string;
      type: string;
      severity?: string;
    }>;
  }>> {
    return apiClient.get(`/driver/transport-tasks/${taskId}/attendance-impact`);
  }

  /**
   * Link transport delay to worker attendance records
   * @param taskId - Transport task ID
   * @param data - Link data
   */
  async linkDelayToAttendance(taskId: string | number, data: {
    workerIds: number[];
    delayId?: number;
    delayReason?: string;
  }): Promise<ApiResponse<{
    updatedCount: number;
    deviationId: number;
    workerIds: number[];
  }>> {
    return apiClient.post(`/driver/transport-tasks/${taskId}/link-attendance`, data);
  }

  /**
   * Get delay audit trail (alias for getTransportAttendanceImpact)
   * @param taskId - Transport task ID
   */
  async getDelayAuditTrail(taskId: string | number): Promise<ApiResponse<any>> {
    return apiClient.get(`/driver/transport-tasks/${taskId}/delay-audit`);
  }

  // ==============================
  // Photo Upload APIs
  // ==============================

  /**
   * Upload pickup photo
   * @param taskId - Transport task ID
   * @param locationId - Pickup location ID
   * @param photoFormData - FormData with photo and metadata
   */
  async uploadPickupPhoto(
    taskId: number,
    locationId: number,
    photoFormData: FormData
  ): Promise<ApiResponse<{
    success: boolean;
    message: string;
    photoUrl: string;
    photoId: number;
  }>> {
    try {
      console.log('📤 Uploading pickup photo for task:', taskId, 'location:', locationId);

      // Add task and location IDs to FormData
      photoFormData.append('taskId', taskId.toString());
      photoFormData.append('locationId', locationId.toString());

      return apiClient.uploadFile(
        `/driver/transport-tasks/${taskId}/pickup-photo`,
        photoFormData
      );
    } catch (error: any) {
      console.error('❌ Upload pickup photo error:', error);
      throw error;
    }
  }

  /**
   * Upload dropoff photo
   * @param taskId - Transport task ID
   * @param photoFormData - FormData with photo and metadata
   */
  async uploadDropoffPhoto(
    taskId: number,
    photoFormData: FormData
  ): Promise<ApiResponse<{
    success: boolean;
    message: string;
    photoUrl: string;
    photoId: number;
  }>> {
    try {
      console.log('📤 Uploading dropoff photo for task:', taskId);

      // Add task ID to FormData
      photoFormData.append('taskId', taskId.toString());

      return apiClient.uploadFile(
        `/driver/transport-tasks/${taskId}/dropoff-photo`,
        photoFormData
      );
    } catch (error: any) {
      console.error('❌ Upload dropoff photo error:', error);
      throw error;
    }
  }

  // ==============================
  // GEOFENCE VIOLATION LOGGING
  // ==============================
  async logGeofenceViolation(violationData: {
    taskId: number;
    locationId: number;
    locationType: 'pickup' | 'dropoff' | 'start_route';
    driverLocation: GeoLocation;
    expectedLocation: { latitude: number; longitude: number };
    distance: number;
    timestamp: Date;
    notifyAdmin?: boolean;
  }): Promise<ApiResponse<{
    violationId: number;
    distance: number;
    locationType: string;
    adminNotified: boolean;
  }>> {
    return apiClient.post(`/driver/transport-tasks/${violationData.taskId}/geofence-violation`, {
      locationId: violationData.locationId,
      locationType: violationData.locationType,
      driverLocation: {
        latitude: violationData.driverLocation.latitude,
        longitude: violationData.driverLocation.longitude,
        accuracy: violationData.driverLocation.accuracy,
      },
      expectedLocation: violationData.expectedLocation,
      distance: violationData.distance,
      timestamp: violationData.timestamp.toISOString(),
      notifyAdmin: violationData.notifyAdmin || false,
    });
  }

  // ==============================
  // WORKER MISMATCH SUBMISSION
  // ==============================
  async submitWorkerMismatch(mismatchData: {
    taskId: number;
    expectedCount: number;
    actualCount: number;
    mismatches: Array<{
      workerId: number;
      workerName: string;
      reason: 'absent' | 'shifted' | 'medical' | 'other';
      remarks: string;
    }>;
    timestamp: Date;
    location: GeoLocation;
  }): Promise<ApiResponse<{
    mismatchId: number;
    expectedCount: number;
    actualCount: number;
    missingCount: number;
    attendanceUpdatedCount: number;
    supervisorsNotified: boolean;
  }>> {
    return apiClient.post(`/driver/transport-tasks/${mismatchData.taskId}/worker-mismatch`, {
      expectedCount: mismatchData.expectedCount,
      actualCount: mismatchData.actualCount,
      mismatches: mismatchData.mismatches,
      timestamp: mismatchData.timestamp.toISOString(),
      location: {
        latitude: mismatchData.location.latitude,
        longitude: mismatchData.location.longitude,
        accuracy: mismatchData.location.accuracy,
      },
    });
  }

  // Report delay with grace period auto-application
  async reportDelay(
    taskId: number,
    delayData: {
      reason: string;
      estimatedDelay: number;
      location?: { latitude: number; longitude: number };
      description?: string;
      photoUrls?: string[];
    }
  ): Promise<ApiResponse<{
    incidentId: number;
    incidentType: string;
    delayReason: string;
    estimatedDelay: number;
    status: string;
    reportedAt: string;
    affectedWorkers: number;
    graceAppliedCount: number;
    graceMinutes: number;
  }>> {
    try {
      console.log('⏰ Reporting delay for task:', taskId);

      const response = await apiClient.post(
        `/driver/transport-tasks/${taskId}/delay`,
        {
          delayReason: delayData.reason,
          estimatedDelay: delayData.estimatedDelay,
          currentLocation: delayData.location,
          description: delayData.description,
          photoUrls: delayData.photoUrls || []
        }
      );

      console.log('✅ Delay reported successfully');
      return response;
    } catch (error: any) {
      console.error('❌ Report delay error:', error);
      throw error;
    }
  }

  // Report breakdown
  async reportBreakdown(
    taskId: number,
    breakdownData: {
      breakdownType: string;
      severity: string;
      requiresAssistance: boolean;
      location?: { latitude: number; longitude: number };
      description?: string;
      photoUrls?: string[];
    }
  ): Promise<ApiResponse<{
    incidentId: number;
    incidentType: string;
    breakdownType: string;
    severity: string;
    status: string;
    reportedAt: string;
  }>> {
    try {
      console.log('🔧 Reporting breakdown for task:', taskId);

      const response = await apiClient.post(
        `/driver/transport-tasks/${taskId}/breakdown`,
        {
          breakdownType: breakdownData.breakdownType,
          severity: breakdownData.severity,
          requiresAssistance: breakdownData.requiresAssistance,
          currentLocation: breakdownData.location,
          description: breakdownData.description,
          photoUrls: breakdownData.photoUrls || []
        }
      );

      console.log('✅ Breakdown reported successfully');
      return response;
    } catch (error: any) {
      console.error('❌ Report breakdown error:', error);
      throw error;
    }
  }

  // Request alternate vehicle
  async requestAlternateVehicle(
    taskId: number,
    vehicleRequest: {
      requestType: 'replacement' | 'additional' | 'emergency';
      reason: string;
      urgency: 'low' | 'medium' | 'high' | 'critical';
      currentLocation?: { latitude: number; longitude: number };
    }
  ): Promise<ApiResponse<{
    requestId: number;
    status: string;
    estimatedResponse: string;
    emergencyContact?: string;
  }>> {
    try {
      console.log('🚗 Requesting alternate vehicle for task:', taskId);

      const response = await apiClient.post(
        `/driver/transport-tasks/${taskId}/vehicle-request`,
        {
          requestType: vehicleRequest.requestType,
          reason: vehicleRequest.reason,
          urgency: vehicleRequest.urgency,
          currentLocation: vehicleRequest.currentLocation
        }
      );

      console.log('✅ Vehicle request submitted successfully');
      return response;
    } catch (error: any) {
      console.error('❌ Vehicle request error:', error);
      throw error;
    }
  }

  // Optimize route for pickup locations
  async optimizeRoute(taskId: number): Promise<ApiResponse<{
    optimizedPickupOrder: any[];
    timeSaved: number;
    distanceSaved: number;
    fuelSaved: number;
    optimizationMethod: string;
  }>> {
    try {
      console.log('🗺️ Optimizing route for task:', taskId);

      const response = await apiClient.post(
        `/driver/transport-tasks/${taskId}/optimize-route`,
        {}
      );

      console.log('✅ Route optimized successfully');
      return response;
    } catch (error: any) {
      console.error('❌ Route optimization error:', error);
      throw error;
    }
  }

}

export const driverApiService = new DriverApiService();
