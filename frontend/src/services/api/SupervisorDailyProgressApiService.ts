// Supervisor Daily Progress API Service - Fixed URLs to match backend
// Backend URLs: /api/supervisor/daily-progress/*

import { apiClient } from './client';
import { ApiResponse } from '../../types';

export class SupervisorDailyProgressApiService {
  
  /**
   * Submit daily progress report
   * POST /api/supervisor/daily-progress
   */
  async submitDailyProgress(data: {
    projectId: number;
    remarks?: string;
    issues?: string;
  }): Promise<ApiResponse<any>> {
    return apiClient.post('/supervisor/daily-progress', data);
  }

  /**
   * Upload photos for daily progress
   * POST /api/supervisor/daily-progress/photos
   */
  async uploadProgressPhotos(data: {
    projectId: number;
    dailyProgressId?: number;
    remarks?: string;
    issues?: string;
    photos: File[];
  }): Promise<ApiResponse<any>> {
    const formData = new FormData();
    
    formData.append('projectId', data.projectId.toString());
    if (data.dailyProgressId) {
      formData.append('dailyProgressId', data.dailyProgressId.toString());
    }
    if (data.remarks) {
      formData.append('remarks', data.remarks);
    }
    if (data.issues) {
      formData.append('issues', data.issues);
    }
    
    // Add photos
    data.photos.forEach((photo) => {
      formData.append('photos', photo);
    });

    return apiClient.uploadFile('/supervisor/daily-progress/photos', formData);
  }

  /**
   * Track manpower usage (NEW)
   * POST /api/supervisor/daily-progress/manpower
   */
  async trackManpowerUsage(data: {
    projectId: number;
    date?: string;
    totalWorkers: number;
    activeWorkers: number;
    productivity: number;
    efficiency: number;
    overtimeHours?: number;
    absentWorkers?: number;
    lateWorkers?: number;
    workerBreakdown?: Array<{
      role: string;
      planned: number;
      actual: number;
      hoursWorked: number;
    }>;
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    data: {
      dailyProgressId: number;
      projectId: number;
      date: string;
      manpower: {
        totalWorkers: number;
        activeWorkers: number;
        productivity: number;
        efficiency: number;
        overtimeHours: number;
        absentWorkers: number;
        lateWorkers: number;
        utilizationRate: number;
        workerBreakdown: any[];
      };
    };
  }>> {
    return apiClient.post('/supervisor/daily-progress/manpower', data);
  }

  /**
   * Log issues and safety observations (NEW)
   * POST /api/supervisor/daily-progress/issues
   */
  async logIssuesAndSafety(data: {
    projectId: number;
    dailyProgressId?: number;
    date?: string;
    issues: Array<{
      type: 'safety' | 'quality' | 'delay' | 'resource';
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      status: 'open' | 'in_progress' | 'resolved';
      location?: string;
      reportedBy?: string;
      actionTaken?: string;
    }>;
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    data: {
      dailyProgressId: number;
      issuesRecorded: number;
      criticalIssues: number;
      highSeverity: number;
      issues: any[];
    };
  }>> {
    return apiClient.post('/supervisor/daily-progress/issues', data);
  }

  /**
   * Track material consumption (NEW)
   * POST /api/supervisor/daily-progress/materials
   */
  async trackMaterialConsumption(data: {
    projectId: number;
    dailyProgressId?: number;
    date?: string;
    materials: Array<{
      materialId?: number;
      materialName: string;
      consumed: number;
      remaining: number;
      unit: string;
      plannedConsumption?: number;
      wastage?: number;
      notes?: string;
    }>;
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    data: {
      dailyProgressId: number;
      materialsTracked: number;
      totalWastage: number;
      overConsumption: number;
      lowStockAlerts: string[];
      materials: any[];
    };
  }>> {
    return apiClient.post('/supervisor/daily-progress/materials', data);
  }

  /**
   * Get daily progress by date
   * GET /api/supervisor/daily-progress/:projectId/:date
   */
  async getDailyProgressByDate(projectId: number, date: string): Promise<ApiResponse<{
    projectId: string;
    date: string;
    overallProgress: number;
    remarks: string;
    issues: string;
    photos: string[];
    submittedAt: string;
  }>> {
    return apiClient.get(`/supervisor/daily-progress/${projectId}/${date}`);
  }

  /**
   * Get daily progress reports (date range)
   * GET /api/supervisor/daily-progress/:projectId?from=&to=
   */
  async getDailyProgressRange(
    projectId: number,
    params: {
      from: string;
      to: string;
    }
  ): Promise<ApiResponse<{
    projectId: string;
    count: number;
    data: any[];
  }>> {
    return apiClient.get(`/supervisor/daily-progress/${projectId}`, { params });
  }
}

// Export singleton instance
export const supervisorDailyProgressApiService = new SupervisorDailyProgressApiService();
export default supervisorDailyProgressApiService;
