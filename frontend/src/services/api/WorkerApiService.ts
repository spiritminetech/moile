// Worker API Service - Handles all worker-specific API endpoints
// Requirements: 10.1, 10.2, 10.3

import { Platform } from 'react-native';
import * as Device from 'expo-device';
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
  InstructionReadStatus,
  PerformanceMetrics,
  DeviceInfo,
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
    // 🔧 CACHE BUSTING: Add timestamp to force fresh data
    const cacheBuster = Date.now();
    const params = date ? { date, _t: cacheBuster } : { _t: cacheBuster };
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
    return apiClient.get(`/projects/${projectId}`);
  }

  // Task Management APIs
  async getTodaysTasks(date?: string): Promise<ApiResponse<TaskAssignment[]>> {
    try {
      // 🔧 CACHE BUSTING: Add timestamp to force fresh data
      const cacheBuster = Date.now();
      const params = date ? { date, _t: cacheBuster } : { _t: cacheBuster };
      console.log('🚀 Making API call to /worker/tasks/today with params:', params);
      
      // First try to get dashboard data which includes tasks
      const response = await this.getDashboardData(date);
      console.log('📊 Dashboard API response:', {
        success: response.success,
        hasData: !!response.data,
        hasTasks: !!(response.data?.tasks),
        tasksLength: response.data?.tasks?.length || 0,
        message: response.message
      });
      
      if (response.success && response.data && response.data.tasks) {
        const rawTasks = response.data.tasks;
        console.log('📋 Found tasks in dashboard:', rawTasks.length);
        
        // Map API response to TaskAssignment interface
        const mappedTasks: TaskAssignment[] = rawTasks.map((task: any) => {
          const mappedTask: TaskAssignment = {
            assignmentId: task.assignmentId || task.id || 0,
            projectId: response.data.project?.id || 1,
            projectName: response.data.project?.name || 'Unknown Project',
            projectCode: response.data.project?.code || undefined,
            clientName: response.data.project?.clientName || undefined,
            siteName: response.data.project?.siteName || undefined,
            natureOfWork: response.data.project?.natureOfWork || undefined,
            taskName: task.taskName || task.name || 'Unknown Task',
            description: task.description || '',
            dependencies: task.dependencies || [],
            sequence: task.sequence || 0,
            status: this.mapTaskStatus(task.status),
            priority: task.priority || 'medium',
            workArea: task.workArea || undefined,
            floor: task.floor || undefined,
            zone: task.zone || undefined,
            trade: task.trade || undefined,
            activity: task.activity || undefined,
            workType: task.workType || undefined,
            requiredTools: task.requiredTools || [],
            requiredMaterials: task.requiredMaterials || [],
            location: {
              latitude: response.data.project?.geofence?.latitude || 0,
              longitude: response.data.project?.geofence?.longitude || 0,
              accuracy: 0,
              timestamp: new Date()
            },
            projectGeofence: response.data.project?.geofence ? {
              latitude: response.data.project.geofence.latitude,
              longitude: response.data.project.geofence.longitude,
              radius: response.data.project.geofence.radius || 100
            } : undefined,
            // Map supervisor information from task-level fields (backend provides per-task)
            supervisorName: task.supervisorName || response.data.supervisor?.name || undefined,
            supervisorContact: task.supervisorContact || response.data.supervisor?.phone || undefined,
            supervisorEmail: task.supervisorEmail || response.data.supervisor?.email || undefined,
            estimatedHours: task.timeEstimate?.estimated ? task.timeEstimate.estimated / 60 : 8,
            actualHours: task.timeEstimate?.elapsed ? task.timeEstimate.elapsed / 60 : undefined,
            actualOutput: task.progress?.completed || undefined,
            dailyTarget: task.dailyTarget ? {
              description: task.dailyTarget.description || '',
              quantity: task.dailyTarget.quantity || 0,
              unit: task.dailyTarget.unit || '',
              targetCompletion: task.dailyTarget.targetCompletion || 100,
              // Enhanced daily target fields
              targetType: task.dailyTarget.targetType || undefined,
              areaLevel: task.dailyTarget.areaLevel || undefined,
              startTime: task.dailyTarget.startTime || undefined,
              expectedFinish: task.dailyTarget.expectedFinish || undefined,
              progressToday: task.dailyTarget.progressToday || undefined
            } : undefined,
            progress: task.progress ? {
              percentage: task.progress.percentage || 0,
              completed: task.progress.completed || 0,
              remaining: task.progress.remaining || 0,
              lastUpdated: task.progress.lastUpdated || null
            } : undefined,
            timeEstimate: task.timeEstimate ? {
              estimated: task.timeEstimate.estimated || 0,
              elapsed: task.timeEstimate.elapsed || 0,
              remaining: task.timeEstimate.remaining || 0
            } : undefined,
            supervisorInstructions: task.supervisorInstructions || undefined,
            instructionAttachments: task.instructionAttachments || [],
            instructionsLastUpdated: task.instructionsLastUpdated || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: task.progress?.lastUpdated || new Date().toISOString(),
            startedAt: task.startTime || undefined,
            completedAt: task.status === 'completed' ? task.estimatedEndTime : undefined
          };
          
          return mappedTask;
        });
        
        console.log('✅ Mapped tasks successfully:', mappedTasks.length);
        console.log('📋 Sample mapped task:', mappedTasks[0]);
        
        return {
          success: true,
          data: mappedTasks,
          message: response.message || 'Tasks loaded successfully'
        };
      }
      
      // If no tasks found, return empty array with success
      console.log('📋 No tasks found, returning empty array');
      return {
        success: true,
        data: [],
        message: 'No tasks assigned for today'
      };
      
    } catch (error: any) {
      console.error('❌ getTodaysTasks error:', error);
      
      // Handle specific error cases
      if (error.response?.data?.error === 'NO_TASKS_ASSIGNED' || 
          error.message?.includes('NO_TASKS_ASSIGNED')) {
        return {
          success: true,
          data: [],
          message: 'No tasks assigned for today'
        };
      }
      
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
  private mapTaskStatus(apiStatus: string): 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'paused' {
    switch (apiStatus?.toLowerCase()) {
      case 'queued':
        return 'pending';
      case 'in_progress':
        return 'in_progress';
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      case 'paused':
        return 'paused';
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

  async pauseTask(taskId: number): Promise<ApiResponse<{
    assignmentId: number;
    status: string;
    pausedAt: string;
    previousStatus: string;
  }>> {
    return apiClient.post(`/worker/tasks/${taskId}/pause`, {});
  }

  async resumeTask(taskId: number, location: GeoLocation): Promise<ApiResponse<{
    assignmentId: number;
    status: string;
    resumedAt: string;
    previousStatus: string;
  }>> {
    return apiClient.post(`/worker/tasks/${taskId}/resume`, {
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      },
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
      projectId: number;
      projectName: string;
      projectCode: string;
      status: string;
      sequence: number;
      startTime: string;
      completedAt: string;
      progressPercent: number;
      timeSpent: number;
      workArea: string;
      date: string;
      projectGeofence: {
        latitude: number;
        longitude: number;
        radius: number;
        strictMode: boolean;
        allowedVariance: number;
      } | null;
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
    session: 'NOT_LOGGED_IN' | 'CHECKED_IN' | 'CHECKED_OUT' | 'ON_LUNCH';
    checkInTime: string | null;
    checkOutTime: string | null;
    lunchStartTime: string | null;
    lunchEndTime: string | null;
    overtimeStartTime: string | null;
    isOnLunchBreak: boolean;
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

  /**
   * Request attendance regularization from supervisor
   */
  async requestAttendanceRegularization(data: {
    workerId: string;
    projectId: string;
    requestType: 'forgotten_checkout' | 'late_login' | 'early_logout';
    originalTime?: string;
    requestedTime?: string;
    reason: string;
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    requestId: string;
  }>> {
    console.log('📝 Requesting attendance regularization:', data);
    return apiClient.post('/attendance/request-regularization', data);
  }

  async getCurrentAttendanceStatus(): Promise<ApiResponse<{
    currentStatus: 'NOT_LOGGED_IN' | 'CHECKED_IN' | 'CHECKED_OUT' | 'ON_LUNCH';
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

  // Work Instructions APIs
  async getWorkInstructions(date?: string): Promise<ApiResponse<Array<{
    id: number;
    type: 'work_instruction' | 'safety_message' | 'supervisor_instruction' | 'transport_instruction' | 'warning' | 'reminder';
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    timestamp: string;
    isRead: boolean;
    source: 'admin' | 'manager' | 'supervisor' | 'system';
    sourceName?: string;
  }>>> {
    const params = date ? { date } : {};
    return apiClient.get('/worker/instructions', { params });
  }

  async markInstructionAsRead(instructionId: number): Promise<ApiResponse<{
    success: boolean;
    message: string;
  }>> {
    return apiClient.post(`/worker/instructions/${instructionId}/read`);
  }

  async getInstructionDetails(instructionId: number): Promise<ApiResponse<{
    id: number;
    type: string;
    title: string;
    message: string;
    priority: string;
    timestamp: string;
    isRead: boolean;
    source: string;
    sourceName?: string;
    attachments?: Array<{
      id: number;
      filename: string;
      url: string;
      size: number;
    }>;
  }>> {
    return apiClient.get(`/worker/instructions/${instructionId}`);
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
    employeeCode?: string;
    nationality?: string;
    jobTitle?: string;
    department?: string;
    companyName?: string;
    certifications: Array<{
      id: number;
      name: string;
      type?: string;
      certificationType?: string;
      ownership?: string;
      issuer: string;
      issueDate: string;
      expiryDate: string;
      certificateNumber: string;
      status: 'active' | 'expired' | 'expiring_soon';
      documentPath?: string;
    }>;
    workPass: {
      id: number;
      passNumber: string;
      finNumber?: string;
      workPassType?: string;
      issueDate: string;
      expiryDate: string;
      status: 'active' | 'expired' | 'suspended' | 'new' | 'renewal' | 'under_renewal';
      applicationDoc?: string;
      medicalDoc?: string;
      issuanceDoc?: string;
      momDoc?: string;
    };
    salaryInfo?: {
      basicSalary: number;
      allowances: number;
      totalEarnings: number;
      currency: string;
    };
  }>> {
    try {
      console.log('🔍 [PROFILE] Fetching worker profile from /worker/profile...');
      const response = await apiClient.get('/worker/profile');
      
      console.log('📥 [PROFILE] Raw API response:', JSON.stringify({
        success: response.success,
        hasData: !!response.data,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : null,
        hasProfile: !!(response as any).profile,
        responseKeys: Object.keys(response),
        message: response.message
      }, null, 2));
      
      // Extract profile data from various possible response structures
      let profile = null;
      
      // Priority 1: Check response.data (most common)
      if (response.data && typeof response.data === 'object') {
        // Check if data has user info directly
        if (response.data.name || response.data.email || response.data.id || response.data.employeeId) {
          profile = response.data;
          console.log('✅ [PROFILE] Found profile in response.data (direct)');
        }
        // Check if data has a nested profile object
        else if ((response.data as any).profile) {
          profile = (response.data as any).profile;
          console.log('✅ [PROFILE] Found profile in response.data.profile');
        }
        // Check if data has a nested user object
        else if ((response.data as any).user) {
          profile = (response.data as any).user;
          console.log('✅ [PROFILE] Found profile in response.data.user');
        }
      }
      
      // Priority 2: Check response.profile (legacy format)
      if (!profile && (response as any).profile) {
        profile = (response as any).profile;
        console.log('✅ [PROFILE] Found profile in response.profile (legacy)');
      }
      
      // Priority 3: Check if entire response is the profile
      if (!profile && (response.name || response.email || response.id)) {
        profile = response;
        console.log('✅ [PROFILE] Using entire response as profile');
      }
      
      console.log('🔍 [PROFILE] Extracted profile:', JSON.stringify({
        hasProfile: !!profile,
        profileKeys: profile ? Object.keys(profile) : null,
        name: profile?.name || profile?.fullName,
        email: profile?.email,
        id: profile?.id,
        employeeId: profile?.employeeId,
        employeeCode: profile?.employeeCode
      }, null, 2));
      
      if (!profile) {
        console.error('❌ [PROFILE] No profile data found in any expected location');
        return {
          success: false,
          data: undefined as any,
          message: 'Profile data not found in server response. Please contact support.'
        };
      }
      
      // Map the API response to the expected format with comprehensive fallbacks
      const mappedData = {
        user: {
          id: profile.id || profile.userId || profile.employeeId || 0,
          name: profile.name || profile.fullName || profile.userName || 'Unknown User',
          email: profile.email || profile.emailAddress || 'no-email@example.com',
          phone: profile.phoneNumber || profile.phone || profile.mobile || 'No phone',
          profileImage: profile.photoUrl || profile.profileImage || profile.profilePicture || profile.avatar || undefined,
          employeeId: String(profile.employeeId || profile.employeeCode || profile.id || 'N/A')
        },
        employeeCode: profile.employeeCode || String(profile.employeeId || ''),
        nationality: profile.nationality || undefined,
        jobTitle: profile.jobTitle || profile.designation || profile.position || profile.role || undefined,
        department: profile.department || profile.departmentName || undefined,
        companyName: profile.companyName || profile.company || profile.organization || undefined,
        certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
        workPass: profile.workPass || {
          id: profile.workPassId || 0,
          passNumber: profile.workPassNumber || profile.passNumber || profile.workPermitNumber || 'N/A',
          finNumber: profile.finNumber || profile.fin || undefined,
          workPassType: profile.workPassType || profile.passType || 'WORK_PERMIT',
          issueDate: profile.workPassIssueDate || profile.passIssueDate || new Date().toISOString(),
          expiryDate: profile.workPassExpiryDate || profile.passExpiryDate || new Date().toISOString(),
          status: (profile.workPassStatus || profile.passStatus || 'active') as 'active' | 'expired' | 'suspended' | 'new' | 'renewal' | 'under_renewal',
          applicationDoc: profile.applicationDoc || undefined,
          medicalDoc: profile.medicalDoc || undefined,
          issuanceDoc: profile.issuanceDoc || undefined,
          momDoc: profile.momDoc || undefined
        },
        salaryInfo: profile.salaryInfo || profile.salary || undefined
      };
      
      console.log('✅ [PROFILE] Successfully mapped profile data:', JSON.stringify({
        userId: mappedData.user.id,
        userName: mappedData.user.name,
        userEmail: mappedData.user.email,
        employeeId: mappedData.user.employeeId,
        hasProfileImage: !!mappedData.user.profileImage,
        certificationsCount: mappedData.certifications.length,
        hasWorkPass: !!mappedData.workPass,
        hasSalaryInfo: !!mappedData.salaryInfo
      }, null, 2));
      
      return {
        success: true,
        data: mappedData,
        message: response.message || 'Profile loaded successfully'
      };
      
    } catch (error: any) {
      console.error('❌ [PROFILE] Error fetching profile:', {
        error: error,
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        code: error?.code
      });
      
      // Provide detailed, actionable error messages
      let errorMessage = 'Failed to load profile data';
      let errorDetails = '';
      
      if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
        errorMessage = 'Cannot connect to server';
        errorDetails = 'Please check:\n• Internet connection\n• Server is running\n• Correct server address';
      } else if (error?.code === 'ECONNREFUSED' || error?.message?.includes('ECONNREFUSED')) {
        errorMessage = 'Server connection refused';
        errorDetails = 'Backend server may not be running. Please contact support.';
      } else if (error?.code === 'TIMEOUT' || error?.message?.includes('timeout')) {
        errorMessage = 'Request timed out';
        errorDetails = 'Server is taking too long to respond. Please try again.';
      } else if (error?.response?.status === 401 || error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
        errorMessage = 'Session expired';
        errorDetails = 'Please log out and log in again.';
      } else if (error?.response?.status === 403 || error?.message?.includes('403') || error?.message?.includes('Forbidden')) {
        errorMessage = 'Access denied';
        errorDetails = 'You do not have permission to view this profile.';
      } else if (error?.response?.status === 404 || error?.message?.includes('404')) {
        errorMessage = 'Profile not found';
        errorDetails = 'Your profile data could not be found. Please contact support.';
      } else if (error?.response?.status >= 500 || error?.message?.includes('500')) {
        errorMessage = 'Server error';
        errorDetails = 'The server encountered an error. Please try again later.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      const fullMessage = errorDetails ? `${errorMessage}\n\n${errorDetails}` : errorMessage;
      
      console.error('❌ [PROFILE] Final error message:', fullMessage);
      
      return {
        success: false,
        data: undefined as any,
        message: fullMessage
      };
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
      
      if (response.success) {
        // The backend now returns data as a flat array
        const alerts = response.data || [];
        
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
    try {
      const formData = new FormData();
      formData.append('photo', photo);
      
      const response = await apiClient.uploadFile('/worker/profile/photo', formData);
      
      // Handle the response structure from backend
      if (response.success) {
        return {
          success: true,
          data: {
            success: response.success,
            message: response.message,
            worker: response.worker,
            photoUrl: response.photoUrl
          },
          message: response.message,
          photoUrl: response.photoUrl // Add this for backward compatibility
        } as any;
      }
      
      return response;
    } catch (error) {
      console.error('❌ uploadProfilePhoto error:', error);
      throw error;
    }
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

  // Today's Task Critical Features - New Methods

  /**
   * Mark supervisor instructions as read
   */
  async markInstructionsAsRead(
    assignmentId: number,
    location?: GeoLocation
  ): Promise<ApiResponse<{ readAt: Date; acknowledged: boolean }>> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      
      const response = await apiClient.post(
        `/worker/tasks/${assignmentId}/instructions/read`,
        {
          location,
          deviceInfo
        }
      );
      
      return response;
    } catch (error) {
      console.error('Error marking instructions as read:', error);
      throw error;
    }
  }

  /**
   * Acknowledge understanding of supervisor instructions
   */
  async acknowledgeInstructions(
    assignmentId: number,
    notes?: string,
    location?: GeoLocation
  ): Promise<ApiResponse<InstructionReadStatus>> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      
      const response = await apiClient.post(
        `/worker/tasks/${assignmentId}/instructions/acknowledge`,
        {
          notes,
          location,
          deviceInfo
        }
      );
      
      return response;
    } catch (error) {
      console.error('Error acknowledging instructions:', error);
      throw error;
    }
  }

  /**
   * Get worker performance metrics
   */
  async getPerformanceMetrics(): Promise<ApiResponse<PerformanceMetrics>> {
    try {
      const response = await apiClient.get('/worker/performance');
      return response;
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get device information for audit trail
   */
  private async getDeviceInfo(): Promise<DeviceInfo> {
    return {
      platform: Platform.OS,
      version: String(Platform.Version),
      model: Device.modelName || 'Unknown',
      manufacturer: Device.manufacturer || 'Unknown'
    };
  }
}

// Export singleton instance
export const workerApiService = new WorkerApiService();
export default workerApiService;