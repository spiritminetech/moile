// Worker API Service - Handles all worker-specific API endpoints
// Requirements: 10.1, 10.2, 10.3

import { apiClient } from './client';
import { attendanceApiService } from './AttendanceApiService';
import {
  ApiResponse,
  TaskAssignment,
  AttendanceRecord,
  DailyJobReport,
  WorkerRequest,
  GeofenceValidation,
  GeoLocation,
  Project,
  RequestType,
  CreateDailyReportRequest,
  CreateDailyReportResponse,
  UploadReportPhotosRequest,
  UploadReportPhotosResponse,
  SubmitDailyReportRequest,
  SubmitDailyReportResponse,
  GetDailyReportsResponse,
} from '../../types';

export class WorkerApiService {
  // Dashboard and Overview APIs - Updated to match documentation
  async getDashboardData(date?: string): Promise<ApiResponse<{
    project: {
      id: number;
      name: string;
      code: string;
      location: string;
      geofence: {
        latitude: number;
        longitude: number;
        radius: number;
      };
    };
    supervisor: {
      id: number;
      name: string;
      phone: string;
      email: string;
    };
    worker: {
      id: number;
      name: string;
      role: string;
      checkInStatus: string;
      currentLocation: {
        latitude: number;
        longitude: number;
        insideGeofence: boolean;
        lastUpdated: string;
      };
    };
    tasks: Array<{
      assignmentId: number;
      taskId: number;
      taskName: string;
      taskType: string;
      description: string;
      workArea: string;
      floor: string;
      zone: string;
      status: string;
      priority: string;
      sequence: number;
      dailyTarget: {
        description: string;
        quantity: number;
        unit: string;
        targetCompletion: number;
      };
      progress: {
        percentage: number;
        completed: number;
        remaining: number;
        lastUpdated: string;
      };
      timeEstimate: {
        estimated: number;
        elapsed: number;
        remaining: number;
      };
      supervisorInstructions: string;
      startTime: string;
      estimatedEndTime: string;
      canStart: boolean;
      canStartMessage: string | null;
      dependencies: number[];
    }>;
    toolsAndMaterials: {
      tools: Array<{
        id: number;
        name: string;
        quantity: number;
        unit: string;
        allocated: boolean;
        location: string;
      }>;
      materials: Array<{
        id: number;
        name: string;
        quantity: number;
        unit: string;
        allocated: number;
        used: number;
        remaining: number;
        location: string;
      }>;
    };
    dailySummary: {
      totalTasks: number;
      completedTasks: number;
      inProgressTasks: number;
      queuedTasks: number;
      errorTasks: number;
      totalHoursWorked: number;
      remainingHours: number;
      overallProgress: number;
    };
  }>> {
    const params = date ? { date } : {};
    return apiClient.get('/worker/tasks/today', { params });
  }

  async getProjectInfo(projectId: number): Promise<ApiResponse<{
    id: number;
    projectName: string;
    projectCode: string;
    description: string;
    address: string;
    companyId: number;
    status: string;
    startDate: string;
    endDate: string;
    budget: number;
    currency: string;
    geofence: {
      center: {
        latitude: number;
        longitude: number;
      };
      radius: number;
      strictMode: boolean;
      allowedVariance: number;
    };
    latitude: number;
    longitude: number;
    geofenceRadius: number;
    projectManager: {
      id: number;
      name: string;
      email: string;
      phone: string;
    };
    createdAt: string;
    updatedAt: string;
  }>> {
    return apiClient.get(`/project/${projectId}`);
  }

  // Task Management APIs
  async getTodaysTasks(date?: string): Promise<ApiResponse<TaskAssignment[]>> {
    try {
      const params = date ? { date } : {};
      console.log('🚀 Making API call to /worker/tasks/today with params:', params);
      
      const response = await apiClient.get('/worker/tasks/today', { params });
      console.log('📊 Raw API response:', {
        success: response.success,
        dataType: typeof response.data,
        hasData: !!response.data,
        message: response.message
      });
      
      // Handle different response structures
      if (response.success && response.data) {
        let rawTasks: any[] = [];
        const data = response.data as any; // Type assertion for flexibility
        
        // Check if response.data has tasks array (dashboard format)
        if (data.tasks && Array.isArray(data.tasks)) {
          console.log('📋 Found tasks in dashboard format:', data.tasks.length);
          rawTasks = data.tasks;
        }
        // Check if response.data is directly an array of tasks
        else if (Array.isArray(data)) {
          console.log('📋 Found tasks as direct array:', data.length);
          rawTasks = data;
        }
        
        // Map API response to TaskAssignment interface
        const mappedTasks: TaskAssignment[] = rawTasks.map((task: any) => {
          // Map API response fields to TaskAssignment interface
          const mappedTask: TaskAssignment = {
            assignmentId: task.assignmentId || task.id || 0,
            projectId: data.project?.id || 1, // Get from project data
            taskName: task.taskName || task.name || 'Unknown Task',
            description: task.description || '',
            dependencies: task.dependencies || [],
            sequence: task.sequence || 0,
            status: this.mapTaskStatus(task.status),
            location: {
              latitude: 0,
              longitude: 0,
              accuracy: 0,
              timestamp: new Date()
            }, // Default location - will be updated when task starts
            estimatedHours: task.timeEstimate?.estimated ? task.timeEstimate.estimated / 60 : 8, // Convert minutes to hours
            actualHours: task.timeEstimate?.elapsed ? task.timeEstimate.elapsed / 60 : undefined,
            createdAt: new Date().toISOString(), // Default since API doesn't provide
            updatedAt: task.progress?.lastUpdated || new Date().toISOString(),
            startedAt: task.startTime || undefined,
            completedAt: undefined // API doesn't provide this field
          };
          
          return mappedTask;
        });
        
        console.log('✅ Mapped tasks successfully:', mappedTasks.length);
        console.log('📋 Sample mapped task:', mappedTasks[0]);
        
        return {
          success: true,
          data: mappedTasks,
          message: response.message
        };
      }
      
      // Handle empty or unexpected format
      console.log('⚠️ Unexpected response format, returning empty array');
      return {
        success: true,
        data: [],
        message: 'No tasks found'
      };
      
    } catch (error: any) {
      console.error('❌ getTodaysTasks error:', error);
      
      // If it's a 401 error, provide more specific guidance
      if (error.message?.includes('401') || error.code === 'UNAUTHORIZED') {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      // If it's a network error, provide guidance
      if (error.message?.includes('Network Error') || error.code === 'NETWORK_ERROR') {
        throw new Error('Network connection failed. Please check your internet connection.');
      }
      
      throw error;
    }
  }

  // Helper method to map API task status to TaskAssignment status
  private mapTaskStatus(apiStatus: string): 'pending' | 'in_progress' | 'completed' | 'cancelled' {
    switch (apiStatus?.toLowerCase()) {
      case 'queued':
        return 'pending';
      case 'in_progress':
        return 'in_progress';
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  async getTaskDetails(taskId: number): Promise<ApiResponse<{
    assignmentId: number;
    taskId: number;
    taskName: string;
    taskType: string;
    description: string;
    workArea: string;
    floor: string;
    zone: string;
    status: string;
    priority: string;
    sequence: number;
    project: {
      id: number;
      name: string;
      location: string;
    };
    supervisor: {
      id: number;
      name: string;
      phone: string;
    };
    dailyTarget: {
      description: string;
      quantity: number;
      unit: string;
      targetCompletion: number;
    };
    progress: {
      percentage: number;
      completed: number;
      remaining: number;
      lastUpdated: string | null;
    };
    timeEstimate: {
      estimated: number;
      elapsed: number;
      remaining: number;
    };
    startTime: string | null;
    estimatedEndTime: string | null;
    canStart: boolean;
    canStartMessage: string | null;
    dependencies: number[];
    photos: string[];
  }>> {
    return apiClient.get(`/worker/tasks/${taskId}`);
  }

  async startTask(taskId: number, location: GeoLocation): Promise<ApiResponse<{
    assignmentId: number;
    status: string;
    startTime: string;
    estimatedEndTime: string;
    geofenceValidation: {
      insideGeofence: boolean;
      distance: number;
      validated: boolean;
      validatedAt: string;
    };
  }>> {
    return apiClient.post(`/worker/tasks/${taskId}/start`, {
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      },
    });
  }

  async updateTaskProgress(
    taskId: number,
    progressPercent: number,
    description: string,
    location: GeoLocation,
    options?: {
      notes?: string;
      completedQuantity?: number;
      issuesEncountered?: string[];
    }
  ): Promise<ApiResponse<{
    progressId: number;
    assignmentId: number;
    progressPercent: number;
    submittedAt: string;
    status: string;
    nextAction: string;
    taskStatus: string;
    previousProgress: number;
    progressDelta: number;
  }>> {
    return apiClient.put(`/worker/tasks/${taskId}/progress`, {
      progressPercent,
      description,
      notes: options?.notes,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp.toISOString(),
      },
      completedQuantity: options?.completedQuantity,
      issuesEncountered: options?.issuesEncountered || [],
    });
  }

  async completeTask(
    taskId: number, 
    location: GeoLocation,
    options?: {
      completionNotes?: string;
      finalPhotos?: string[];
      actualQuantityCompleted?: number;
      qualityCheck?: {
        passed: boolean;
        notes: string;
      };
    }
  ): Promise<ApiResponse<{
    assignmentId: number;
    status: string;
    completedAt: string;
    totalTimeSpent: number;
    finalProgress: number;
    nextTask?: {
      assignmentId: number;
      taskName: string;
      canStart: boolean;
    };
  }>> {
    return apiClient.post(`/worker/tasks/${taskId}/complete`, {
      completionNotes: options?.completionNotes,
      finalPhotos: options?.finalPhotos || [],
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp.toISOString(),
      },
      actualQuantityCompleted: options?.actualQuantityCompleted,
      qualityCheck: options?.qualityCheck,
    });
  }

  async getTaskHistory(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    status?: 'queued' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
    projectId?: number;
  }): Promise<ApiResponse<{
    tasks: Array<{
      assignmentId: number;
      taskId: number;
      taskName: string;
      taskType: string;
      projectName: string;
      status: string;
      startTime: string;
      completedAt: string;
      progressPercent: number;
      timeSpent: number;
      workArea: string;
      date: string;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalTasks: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
    summary: {
      totalCompleted: number;
      totalInProgress: number;
      totalHoursWorked: number;
      averageTaskTime: number;
    };
  }>> {
    return apiClient.get('/worker/tasks/history', { params });
  }

  // Attendance APIs - Now using both combined and dedicated endpoints
  async clockIn(data: {
    projectId: string;
    location: GeoLocation;
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    checkInTime: string;
    session: 'CHECKED_IN';
  }>> {
    console.log('⏰ Clock In API call:', data);
    // Use dedicated worker clock-in endpoint
    return attendanceApiService.workerClockIn({
      projectId: parseInt(data.projectId),
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      accuracy: data.location.accuracy,
    });
  }

  async clockOut(data: {
    projectId: string;
    location: GeoLocation;
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    checkOutTime: string;
    session: 'CHECKED_OUT';
    totalHours: number;
  }>> {
    console.log('⏰ Clock Out API call:', data);
    // Use dedicated worker clock-out endpoint
    return attendanceApiService.workerClockOut({
      projectId: parseInt(data.projectId),
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      accuracy: data.location.accuracy,
    });
  }

  async getTodaysAttendance(): Promise<ApiResponse<{
    session: 'NOT_LOGGED_IN' | 'CHECKED_IN' | 'CHECKED_OUT';
    checkInTime: string | null;
    checkOutTime: string | null;
    lunchStartTime: string | null;
    lunchEndTime: string | null;
    overtimeStartTime: string | null;
    date: string;
    projectId?: string;
  }>> {
    return attendanceApiService.getTodaysAttendance();
  }

  async validateGeofence(data: {
    projectId: string;
    location: GeoLocation;
  }): Promise<ApiResponse<{
    insideGeofence: boolean;
    distance: number;
    canProceed: boolean;
    message: string;
    accuracy: number | null;
  }>> {
    return attendanceApiService.validateGeofence({
      projectId: data.projectId,
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      accuracy: data.location.accuracy,
    });
  }

  async startLunchBreak(data: {
    projectId: string;
    location: GeoLocation;
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    lunchStartTime: string;
  }>> {
    console.log('🍽️ Starting lunch break API call:', data);
    return attendanceApiService.startLunchBreak({
      projectId: parseInt(data.projectId),
      latitude: data.location.latitude,
      longitude: data.location.longitude,
    });
  }

  async endLunchBreak(data: {
    projectId: string;
    location: GeoLocation;
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    lunchEndTime: string;
    lunchDuration: number;
  }>> {
    console.log('🍽️ Ending lunch break API call:', data);
    return attendanceApiService.endLunchBreak({
      projectId: parseInt(data.projectId),
      latitude: data.location.latitude,
      longitude: data.location.longitude,
    });
  }

  async sendOvertimeAlert(data: {
    workerId: string;
    overtimeInfo: any;
    overtimeType: 'START' | 'END';
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    result: any;
  }>> {
    return attendanceApiService.sendOvertimeAlert(data);
  }

  async getCurrentAttendanceStatus(): Promise<ApiResponse<{
    currentStatus: 'NOT_LOGGED_IN' | 'CHECKED_IN' | 'CHECKED_OUT';
    checkInTime: string | null;
    checkOutTime: string | null;
    lunchStartTime: string | null;
    lunchEndTime: string | null;
    isOnLunchBreak: boolean;
    hoursWorked: number;
    projectId: number | null;
    date: string;
  }>> {
    return attendanceApiService.getWorkerAttendanceStatus();
  }

  async getAttendanceHistory(params: {
    projectId?: string;
  }): Promise<ApiResponse<{
    records: Array<{
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
    }>;
  }>> {
    return attendanceApiService.getAttendanceHistory(params.projectId);
  }

  async logLocation(data: {
    projectId: string;
    location: GeoLocation;
  }): Promise<ApiResponse<{
    insideGeofence: boolean;
  }>> {
    return attendanceApiService.logLocation({
      projectId: data.projectId,
      latitude: data.location.latitude,
      longitude: data.location.longitude,
    });
  }

  async checkAttendanceAlerts(): Promise<ApiResponse<{
    success: boolean;
    message: string;
    results: any;
  }>> {
    return attendanceApiService.checkAlerts();
  }

  // Daily Job Reporting APIs - Updated to match exact API specification
  async createDailyReport(reportData: CreateDailyReportRequest): Promise<ApiResponse<CreateDailyReportResponse['data']>> {
    return apiClient.post('/worker/reports/daily', reportData);
  }

  async uploadReportPhotos(
    reportId: string,
    photosData: UploadReportPhotosRequest
  ): Promise<ApiResponse<UploadReportPhotosResponse['data']>> {
    const formData = new FormData();
    
    // Add photos to form data
    photosData.photos.forEach((photo, index) => {
      formData.append('photos', photo);
    });
    
    // Add other fields
    formData.append('category', photosData.category);
    formData.append('description', photosData.description);
    if (photosData.taskId) {
      formData.append('taskId', photosData.taskId.toString());
    }

    return apiClient.uploadFile(`/worker/reports/${reportId}/photos`, formData);
  }

  async deleteReportPhoto(
    reportId: string,
    photoId: string
  ): Promise<ApiResponse<{
    success: boolean;
    message: string;
    data: {
      deletedPhotoId: string;
      remainingPhotos: number;
    };
  }>> {
    return apiClient.delete(`/worker/reports/${reportId}/photos/${photoId}`);
  }

  async submitDailyReport(
    reportId: string, 
    submitData: SubmitDailyReportRequest
  ): Promise<ApiResponse<SubmitDailyReportResponse['data']>> {
    return apiClient.post(`/worker/reports/${reportId}/submit`, submitData);
  }

  async getDailyReports(params?: {
    date?: string;
    status?: 'draft' | 'submitted' | 'approved';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<GetDailyReportsResponse['data']>> {
    return apiClient.get('/worker/reports/daily', { params });
  }

  async getDailyReport(reportId: string): Promise<ApiResponse<DailyJobReport>> {
    return apiClient.get(`/worker/reports/daily/${reportId}`);
  }

  // Request Management APIs - Updated to match exact API specification
  async submitLeaveRequest(requestData: {
    leaveType: 'ANNUAL' | 'MEDICAL' | 'EMERGENCY';
    fromDate: Date;
    toDate: Date;
    reason: string;
    attachments?: File[];
  }): Promise<ApiResponse<{
    message: string;
    requestId: number;
    requestType: string;
  }>> {
    const formData = new FormData();
    
    // Add main payload
    formData.append('leaveType', requestData.leaveType);
    formData.append('fromDate', requestData.fromDate.toISOString());
    formData.append('toDate', requestData.toDate.toISOString());
    formData.append('reason', requestData.reason);
    
    // Add attachments if provided
    if (requestData.attachments && requestData.attachments.length > 0) {
      requestData.attachments.forEach((file, index) => {
        formData.append('attachments', file);
      });
    }

    return apiClient.uploadFile('/worker/requests/leave', formData);
  }

  async submitMaterialRequest(requestData: {
    projectId: number;
    itemName: string;
    itemCategory: 'concrete' | 'steel' | 'wood' | 'electrical' | 'plumbing' | 'finishing' | 'hardware' | 'other';
    quantity: number;
    unit: string;
    urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    requiredDate: Date;
    purpose: string;
    justification: string;
    specifications?: string;
    estimatedCost?: number;
    attachments?: File[];
  }): Promise<ApiResponse<{
    message: string;
    requestId: number;
    requestType: string;
  }>> {
    const formData = new FormData();
    
    // Add main payload
    formData.append('projectId', requestData.projectId.toString());
    formData.append('itemName', requestData.itemName);
    formData.append('itemCategory', requestData.itemCategory);
    formData.append('quantity', requestData.quantity.toString());
    formData.append('unit', requestData.unit);
    formData.append('urgency', requestData.urgency);
    formData.append('requiredDate', requestData.requiredDate.toISOString());
    formData.append('purpose', requestData.purpose);
    formData.append('justification', requestData.justification);
    
    if (requestData.specifications) {
      formData.append('specifications', requestData.specifications);
    }
    if (requestData.estimatedCost) {
      formData.append('estimatedCost', requestData.estimatedCost.toString());
    }
    
    // Add attachments if provided
    if (requestData.attachments && requestData.attachments.length > 0) {
      requestData.attachments.forEach((file, index) => {
        formData.append('attachments', file);
      });
    }

    return apiClient.uploadFile('/worker/requests/material', formData);
  }

  async submitToolRequest(requestData: {
    projectId: number;
    itemName: string;
    itemCategory: 'power_tools' | 'hand_tools' | 'safety_equipment' | 'measuring_tools' | 'other';
    quantity: number;
    unit: string;
    urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    requiredDate: Date;
    purpose: string;
    justification: string;
    specifications?: string;
    estimatedCost?: number;
    attachments?: File[];
  }): Promise<ApiResponse<{
    message: string;
    requestId: number;
    requestType: string;
  }>> {
    const formData = new FormData();
    
    // Add main payload
    formData.append('projectId', requestData.projectId.toString());
    formData.append('itemName', requestData.itemName);
    formData.append('itemCategory', requestData.itemCategory);
    formData.append('quantity', requestData.quantity.toString());
    formData.append('unit', requestData.unit);
    formData.append('urgency', requestData.urgency);
    formData.append('requiredDate', requestData.requiredDate.toISOString());
    formData.append('purpose', requestData.purpose);
    formData.append('justification', requestData.justification);
    
    if (requestData.specifications) {
      formData.append('specifications', requestData.specifications);
    }
    if (requestData.estimatedCost) {
      formData.append('estimatedCost', requestData.estimatedCost.toString());
    }
    
    // Add attachments if provided
    if (requestData.attachments && requestData.attachments.length > 0) {
      requestData.attachments.forEach((file, index) => {
        formData.append('attachments', file);
      });
    }

    return apiClient.uploadFile('/worker/requests/tool', formData);
  }

  async submitReimbursementRequest(requestData: {
    amount: number;
    currency: string;
    description: string;
    category: 'TRANSPORT' | 'MEALS' | 'ACCOMMODATION' | 'MATERIALS' | 'OTHER';
    urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    requiredDate: Date;
    justification: string;
    attachments?: File[];
  }): Promise<ApiResponse<{
    message: string;
    requestId: number;
    requestType: string;
  }>> {
    const formData = new FormData();
    
    // Add main payload
    formData.append('amount', requestData.amount.toString());
    formData.append('currency', requestData.currency);
    formData.append('description', requestData.description);
    formData.append('category', requestData.category);
    formData.append('urgency', requestData.urgency);
    formData.append('requiredDate', requestData.requiredDate.toISOString());
    formData.append('justification', requestData.justification);
    
    // Add attachments if provided
    if (requestData.attachments && requestData.attachments.length > 0) {
      requestData.attachments.forEach((file, index) => {
        formData.append('attachments', file);
      });
    }

    return apiClient.uploadFile('/worker/requests/reimbursement', formData);
  }

  async submitAdvancePaymentRequest(requestData: {
    amount: number;
    currency: string;
    description: string;
    category: 'ADVANCE';
    urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    requiredDate: Date;
    justification: string;
    attachments?: File[];
  }): Promise<ApiResponse<{
    message: string;
    requestId: number;
    requestType: string;
  }>> {
    const formData = new FormData();
    
    // Add main payload
    formData.append('amount', requestData.amount.toString());
    formData.append('currency', requestData.currency);
    formData.append('description', requestData.description);
    formData.append('category', requestData.category);
    formData.append('urgency', requestData.urgency);
    formData.append('requiredDate', requestData.requiredDate.toISOString());
    formData.append('justification', requestData.justification);
    
    // Add attachments if provided
    if (requestData.attachments && requestData.attachments.length > 0) {
      requestData.attachments.forEach((file, index) => {
        formData.append('attachments', file);
      });
    }

    return apiClient.uploadFile('/worker/requests/advance-payment', formData);
  }

  async uploadRequestAttachments(
    requestId: number,
    requestType: 'leave' | 'material' | 'tool' | 'reimbursement' | 'advance-payment',
    attachments: File[]
  ): Promise<ApiResponse<{
    message: string;
    attachments: Array<{
      fileName: string;
      filePath: string;
    }>;
  }>> {
    const formData = new FormData();
    
    // Add request type
    formData.append('requestType', requestType);
    
    // Add attachments (max 5 files)
    attachments.slice(0, 5).forEach((file, index) => {
      formData.append('attachments', file);
    });

    return apiClient.uploadFile(`/worker/requests/${requestId}/attachments`, formData);
  }

  async getRequests(params?: {
    type?: 'leave' | 'material' | 'tool' | 'reimbursement' | 'advance-payment';
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    fromDate?: string;
    toDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    requests: Array<{
      id: number;
      requestType: string;
      leaveType?: string;
      fromDate?: string;
      toDate?: string;
      reason?: string;
      status: string;
      createdAt: string;
    }>;
    total: number;
    limit: number;
    offset: number;
  }>> {
    return apiClient.get('/worker/requests', { params });
  }

  async getRequest(requestId: number): Promise<ApiResponse<{
    id: number;
    requestType: string;
    leaveType?: string;
    fromDate?: string;
    toDate?: string;
    reason?: string;
    status: string;
    companyId: number;
    employeeId: number;
    createdAt: string;
    updatedAt: string;
  }>> {
    return apiClient.get(`/worker/requests/${requestId}`);
  }

  async cancelRequest(requestId: number, reason?: string): Promise<ApiResponse<{
    message: string;
    requestId: number;
    requestType: string;
  }>> {
    const payload: any = {};
    if (reason) {
      payload.reason = reason;
    }
    return apiClient.post(`/worker/requests/${requestId}/cancel`, payload);
  }

  // Profile and Certification APIs
  async getProfile(): Promise<ApiResponse<{
    user: {
      id: number;
      name: string;
      email: string;
      phone: string;
      profileImage?: string;
      employeeId: string;
    };
    certifications: Array<{
      id: number;
      name: string;
      issuer: string;
      issueDate: string;
      expiryDate: string;
      certificateNumber: string;
      status: 'active' | 'expired' | 'expiring_soon';
    }>;
    workPass: {
      id: number;
      passNumber: string;
      issueDate: string;
      expiryDate: string;
      status: 'active' | 'expired' | 'suspended';
    };
    salaryInfo?: {
      basicSalary: number;
      allowances: number;
      totalEarnings: number;
      currency: string;
    };
  }>> {
    try {
      const response = await apiClient.get('/worker/profile');
      
      if (response.success) {
        // The API returns profile data directly in response, not in response.data
        const responseData = response as any;
        const profile = responseData.profile;
        
        if (profile) {
          // Map the API response to the expected format
          const mappedData = {
            user: {
              id: profile.id || profile.employeeId,
              name: profile.name,
              email: profile.email,
              phone: profile.phoneNumber,
              profileImage: profile.photoUrl,
              employeeId: profile.employeeCode || profile.employeeId?.toString() || profile.id?.toString()
            },
            certifications: profile.certifications || [], // Default to empty array if not provided
            workPass: profile.workPass || {
              id: 0,
              passNumber: 'N/A',
              issueDate: new Date().toISOString(),
              expiryDate: new Date().toISOString(),
              status: 'active' as const
            }, // Default work pass if not provided
            salaryInfo: profile.salaryInfo // Optional field
          };
          
          return {
            success: true,
            data: mappedData,
            message: response.message
          };
        }
      }
      
      // Return error if profile data is not in expected format
      return {
        success: false,
        data: undefined as any,
        message: 'Invalid profile data format'
      };
    } catch (error) {
      console.error('❌ getProfile error:', error);
      throw error;
    }
  }

  async getCertificationExpiryAlerts(): Promise<ApiResponse<Array<{
    certificationId: number;
    name: string;
    expiryDate: string;
    daysUntilExpiry: number;
    alertLevel: 'warning' | 'urgent' | 'expired';
  }>>> {
    try {
      const response = await apiClient.get('/worker/profile/certification-alerts');
      
      // Handle case where API returns empty or no data
      if (response.success) {
        // The API returns alerts data directly in response, not in response.data
        const responseData = response as any;
        let alerts: any[] = [];
        
        // Check if response has alerts object with expiringSoon and expired arrays
        if (responseData.alerts) {
          const alertsData = responseData.alerts;
          
          // Combine expiringSoon and expired arrays
          const expiringSoon = alertsData.expiringSoon || [];
          const expired = alertsData.expired || [];
          
          // Map to expected format
          alerts = [
            ...expiringSoon.map((alert: any) => ({
              certificationId: alert.id,
              name: alert.name,
              expiryDate: alert.expiryDate,
              daysUntilExpiry: alert.daysUntilExpiry,
              alertLevel: alert.daysUntilExpiry <= 7 ? 'urgent' : 'warning'
            })),
            ...expired.map((alert: any) => ({
              certificationId: alert.id,
              name: alert.name,
              expiryDate: alert.expiryDate,
              daysUntilExpiry: alert.daysUntilExpiry,
              alertLevel: 'expired' as const
            }))
          ];
        }
        // Check if response is directly an array
        else if (Array.isArray(responseData)) {
          alerts = responseData;
        }
        
        return {
          success: true,
          data: alerts,
          message: response.message
        };
      }
      
      return {
        success: false,
        data: [],
        message: response.message || 'Failed to get certification alerts'
      };
    } catch (error) {
      console.error('❌ getCertificationExpiryAlerts error:', error);
      // Return empty array instead of failing
      return {
        success: true,
        data: [],
        message: 'No certification alerts available'
      };
    }
  }

  async changePassword(passwordData: {
    oldPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
  }>> {
    return apiClient.put('/worker/profile/password', passwordData);
  }

  async uploadProfilePhoto(photo: File): Promise<ApiResponse<{
    success: boolean;
    message: string;
    worker: {
      id: number;
      name: string;
      email: string;
      phone: string;
      profileImage: string;
      employeeId: string;
    };
    photoUrl: string;
  }>> {
    const formData = new FormData();
    formData.append('photo', photo);
    
    return apiClient.uploadFile('/worker/profile/photo', formData);
  }

  // Help and Support APIs
  async submitIssueReport(issueData: {
    title: string;
    description: string;
    category: 'technical' | 'safety' | 'equipment' | 'other';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    location?: GeoLocation;
    attachments?: string[];
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    ticketId: string;
  }>> {
    const payload: any = { ...issueData };
    if (issueData.location) {
      payload.location = {
        latitude: issueData.location.latitude,
        longitude: issueData.location.longitude,
        accuracy: issueData.location.accuracy,
        timestamp: issueData.location.timestamp.toISOString(),
      };
    }
    return apiClient.post('/worker/support/issue-report', payload);
  }

  async submitSafetyIncident(incidentData: {
    title: string;
    description: string;
    severity: 'minor' | 'moderate' | 'major' | 'critical';
    location: GeoLocation;
    injuryInvolved: boolean;
    witnessNames?: string[];
    immediateActions: string;
    photos?: string[];
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    incidentId: string;
  }>> {
    return apiClient.post('/worker/support/safety-incident', {
      ...incidentData,
      location: {
        latitude: incidentData.location.latitude,
        longitude: incidentData.location.longitude,
        accuracy: incidentData.location.accuracy,
        timestamp: incidentData.location.timestamp.toISOString(),
      },
    });
  }

  async getEmergencyContacts(): Promise<ApiResponse<Array<{
    id: number;
    name: string;
    role: string;
    phone: string;
    email?: string;
    isEmergency: boolean;
  }>>> {
    return apiClient.get('/worker/support/emergency-contacts');
  }

  async getFAQs(): Promise<ApiResponse<Array<{
    id: number;
    question: string;
    answer: string;
    category: string;
  }>>> {
    return apiClient.get('/worker/support/faqs');
  }
}

// Export singleton instance
export const workerApiService = new WorkerApiService();
export default workerApiService;