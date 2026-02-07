// Daily Progress API Service - Fixed to match backend endpoints
// Backend URLs: /api/supervisor/daily-progress/*

import { apiClient } from './client';
import { ApiResponse } from '../../types';

export class DailyProgressApiService {
  /**
   * Submit daily progress report
   * POST /api/supervisor/daily-progress
   */
  async submitDailyProgress(reportData: {
    projectId: number;
    remarks?: string;
    issues?: string;
  }): Promise<ApiResponse<{
    message: string;
    dailyProgress: any;
  }>> {
    return apiClient.post('/supervisor/daily-progress', reportData);
  }

  /**
   * Track manpower usage
   * POST /api/supervisor/daily-progress/manpower
   */
  async trackManpowerUsage(manpowerData: {
    projectId: number;
    dailyProgressId?: number;
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
      id: number;
      utilizationRate: number;
      productivityScore: number;
      manpowerUsage: any;
    };
  }>> {
    return apiClient.post('/supervisor/daily-progress/manpower', manpowerData);
  }

  /**
   * Log issues and safety observations
   * POST /api/supervisor/daily-progress/issues
   */
  async logIssues(issuesData: {
    projectId: number;
    dailyProgressId?: number;
    date?: string;
    issues: Array<{
      type: 'safety' | 'quality' | 'delay' | 'resource';
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      status?: 'open' | 'in_progress' | 'resolved';
      location?: string;
      reportedBy?: string;
      actionTaken?: string;
    }>;
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    data: {
      issuesRecorded: number;
      criticalIssues: number;
      highSeverity: number;
      dailyProgressId: number;
    };
  }>> {
    return apiClient.post('/supervisor/daily-progress/issues', issuesData);
  }

  /**
   * Track material consumption
   * POST /api/supervisor/daily-progress/materials
   */
  async trackMaterialConsumption(materialsData: {
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
      materialsTracked: number;
      totalWastage: number;
      overConsumption: number;
      lowStockAlerts: Array<{
        materialName: string;
        remaining: number;
        unit: string;
      }>;
      materials: any[];
    };
  }>> {
    return apiClient.post('/supervisor/daily-progress/materials', materialsData);
  }

  /**
   * Upload photos for progress report
   * POST /api/supervisor/daily-progress/photos
   */
  async uploadPhotos(photosData: {
    projectId: number;
    dailyProgressId?: number;
    remarks?: string;
    issues?: string;
    photos: File[];
  }): Promise<ApiResponse<{
    message: string;
    dailyProgress: any;
    count: number;
    photos: any[];
  }>> {
    const formData = new FormData();
    
    // Add photos to form data
    photosData.photos.forEach((photo) => {
      formData.append('photos', photo);
    });
    
    // Add other fields
    formData.append('projectId', photosData.projectId.toString());
    if (photosData.dailyProgressId) {
      formData.append('dailyProgressId', photosData.dailyProgressId.toString());
    }
    if (photosData.remarks) {
      formData.append('remarks', photosData.remarks);
    }
    if (photosData.issues) {
      formData.append('issues', photosData.issues);
    }

    return apiClient.uploadFile('/supervisor/daily-progress/photos', formData);
  }

  /**
   * Get progress report by date
   * GET /api/supervisor/daily-progress/:projectId/:date
   */
  async getProgressReportByDate(projectId: number, date: string): Promise<ApiResponse<{
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
   * Get progress reports (date range)
   * GET /api/supervisor/daily-progress/:projectId?from=&to=
   */
  async getProgressReports(params: {
    projectId: number;
    from?: string;
    to?: string;
  }): Promise<ApiResponse<{
    projectId: string;
    count: number;
    data: any[];
  }>> {
    const { projectId, from, to } = params;
    const queryParams: any = {};
    if (from) queryParams.from = from;
    if (to) queryParams.to = to;
    
    return apiClient.get(`/supervisor/daily-progress/${projectId}`, { params: queryParams });
  }
}

// Export singleton instance
export const dailyProgressApiService = new DailyProgressApiService();
export default dailyProgressApiService;
