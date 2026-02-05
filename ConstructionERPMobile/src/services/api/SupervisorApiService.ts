// Supervisor API Service - Enhanced to work with existing backend APIs
// Requirements: 2.1, 3.1, 4.1, 5.1, 6.1, 7.1

import { apiClient } from './client';
import {
  ApiResponse,
  GeoLocation,
  SupervisorDashboardResponse,
  TeamMember,
  TaskAssignmentRequest,
  ProgressReport,
  PendingApproval,
  MaterialRequest,
  ToolAllocation,
  SupervisorReport,
} from '../../types';

export class SupervisorApiService {
  // Enhanced methods to work with existing backend APIs

  /**
   * Get supervisor projects - uses existing /api/supervisor/projects endpoint
   */
  async getSupervisorProjects(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/supervisor/projects');
  }

  /**
   * Get checked-in workers for a project - uses existing endpoint
   */
  async getCheckedInWorkers(projectId: number): Promise<ApiResponse<any[]>> {
    return apiClient.get(`/supervisor/checked-in-workers/${projectId}`);
  }

  /**
   * Get project tasks - uses existing endpoint
   */
  async getProjectTasks(projectId: number): Promise<ApiResponse<any[]>> {
    return apiClient.get(`/supervisor/projects/${projectId}/tasks`);
  }

  /**
   * Get active tasks for a project - uses existing endpoint
   */
  async getActiveTasks(projectId: number): Promise<ApiResponse<any>> {
    return apiClient.get(`/supervisor/active-tasks/${projectId}`);
  }

  /**
   * Get worker tasks for a specific date - uses existing endpoint
   */
  async getWorkerTasks(params: { employeeId: number; date: string }): Promise<ApiResponse<any>> {
    return apiClient.get('/supervisor/worker-tasks', { params });
  }

  /**
   * Assign task to worker - uses existing endpoint
   */
  async assignTask(taskData: {
    employeeId: number;
    projectId: number;
    taskIds: number[];
    date: string;
  }): Promise<ApiResponse<any>> {
    return apiClient.post('/supervisor/assign-task', taskData);
  }

  /**
   * Update task assignment - uses existing endpoint
   */
  async updateTaskAssignment(updateData: {
    assignmentId: number;
    changes: any;
  }): Promise<ApiResponse<any>> {
    return apiClient.put('/supervisor/update-assignment', updateData);
  }

  /**
   * Remove queued task - uses existing endpoint
   */
  async removeQueuedTask(data: { assignmentId: number }): Promise<ApiResponse<any>> {
    return apiClient.delete('/supervisor/remove-queued-task', { data });
  }

  /**
   * Get attendance monitoring data - uses existing endpoint
   */
  async getAttendanceMonitoring(params?: {
    projectId?: string;
    date?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<{
    workers: Array<{
      employeeId: number;
      workerName: string;
      role: string;
      phone?: string;
      email?: string;
      projectId: number;
      projectName: string;
      status: 'CHECKED_IN' | 'CHECKED_OUT' | 'ABSENT';
      checkInTime: string | null;
      checkOutTime: string | null;
      workingHours: number;
      isLate: boolean;
      minutesLate: number;
      insideGeofence: boolean;
      taskAssigned: string;
      lastLocationUpdate: string | null;
    }>;
    summary: {
      totalWorkers: number;
      checkedIn: number;
      checkedOut: number;
      absent: number;
      late: number;
      onTime: number;
      lastUpdated: string;
      date: string;
    };
  }>> {
    return apiClient.get('/supervisor/attendance-monitoring', { params });
  }

  /**
   * Get geofence violations - uses existing endpoint
   */
  async getGeofenceViolations(params?: {
    projectId?: string;
    timeRange?: string;
    status?: string;
  }): Promise<ApiResponse<{
    violations: Array<{
      id: number;
      employeeId: number;
      workerName: string;
      violationTime: string;
      isActive: boolean;
      duration: number;
      distance: number;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
    summary: any;
  }>> {
    return apiClient.get('/supervisor/geofence-violations', { params });
  }

  /**
   * Get late and absent workers - uses existing endpoint
   */
  async getLateAbsentWorkers(params?: {
    projectId?: string;
    date?: string;
  }): Promise<ApiResponse<{
    lateWorkers: any[];
    absentWorkers: any[];
    summary: any;
  }>> {
    return apiClient.get('/supervisor/late-absent-workers', { params });
  }

  /**
   * Send attendance alert - uses existing endpoint
   */
  async sendAttendanceAlert(data: {
    workerIds: number[];
    message: string;
    projectId: number;
  }): Promise<ApiResponse<any>> {
    return apiClient.post('/supervisor/send-attendance-alert', data);
  }

  /**
   * Get manual attendance workers - uses existing endpoint
   */
  async getManualAttendanceWorkers(params?: {
    projectId?: string;
    date?: string;
  }): Promise<ApiResponse<any>> {
    return apiClient.get('/supervisor/manual-attendance-workers', { params });
  }

  /**
   * Submit manual attendance override - uses existing endpoint
   */
  async submitManualAttendanceOverride(data: {
    employeeId: number;
    projectId: number;
    date: string;
    overrideType: string;
    checkInTime?: string;
    checkOutTime?: string;
    reason: string;
    notes?: string;
  }): Promise<ApiResponse<any>> {
    return apiClient.post('/supervisor/manual-attendance-override', data);
  }

  /**
   * Send overtime instructions - uses existing endpoint
   */
  async sendOvertimeInstructions(data: {
    workerIds: number[];
    projectId: number;
    overtimeDetails: any;
  }): Promise<ApiResponse<any>> {
    return apiClient.post('/supervisor/overtime-instructions', data);
  }

  /**
   * Update daily targets - uses existing endpoint
   */
  async updateDailyTargets(data: {
    assignmentUpdates: Array<{
      assignmentId: number;
      dailyTarget: any;
    }>;
  }): Promise<ApiResponse<any>> {
    return apiClient.put('/supervisor/daily-targets', data);
  }

  // Keep existing comprehensive methods for future use
  
  /**
   * Get supervisor dashboard data with team overview and key metrics
   */
  async getDashboardData(date?: string): Promise<ApiResponse<SupervisorDashboardResponse>> {
    const params = date ? { date } : {};
    return apiClient.get('/supervisor/dashboard', { params });
  }

  /**
   * Get team members assigned to supervisor with real-time status
   */
  async getTeamMembers(projectId?: number): Promise<ApiResponse<{
    members: TeamMember[];
    summary: {
      totalMembers: number;
      presentToday: number;
      absentToday: number;
      lateToday: number;
      onBreak: number;
    };
  }>> {
    const params = projectId ? { projectId } : {};
    return apiClient.get('/supervisor/team/members', { params });
  }

  /**
   * Get detailed worker information including current status and performance
   */
  async getWorkerDetails(workerId: number): Promise<ApiResponse<{
    worker: TeamMember;
    currentTask: {
      assignmentId: number;
      taskName: string;
      progress: number;
      startTime: string;
      estimatedCompletion: string;
    } | null;
    todaysAttendance: {
      checkInTime: string | null;
      checkOutTime: string | null;
      lunchStartTime: string | null;
      lunchEndTime: string | null;
      hoursWorked: number;
      status: 'present' | 'absent' | 'late' | 'on_break';
    };
    recentPerformance: {
      tasksCompleted: number;
      averageTaskTime: number;
      attendanceRate: number;
      qualityScore: number;
    };
  }>> {
    return apiClient.get(`/supervisor/team/workers/${workerId}`);
  }

  /**
   * Approve or reject manual attendance corrections
   */
  async approveAttendanceCorrection(correctionId: number, decision: {
    action: 'approve' | 'reject';
    notes?: string;
    correctedTime?: string;
  }): Promise<ApiResponse<{
    correctionId: number;
    status: 'approved' | 'rejected';
    processedAt: string;
    message: string;
  }>> {
    return apiClient.post(`/supervisor/attendance/corrections/${correctionId}/approve`, decision);
  }

  /**
   * Get all task assignments with filtering and status
   */
  async getTaskAssignments(params?: {
    projectId?: number;
    workerId?: number;
    status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<{
    assignments: Array<{
      assignmentId: number;
      taskId: number;
      taskName: string;
      workerId: number;
      workerName: string;
      status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
      priority: 'low' | 'normal' | 'high' | 'urgent';
      progress: number;
      assignedAt: string;
      startedAt: string | null;
      completedAt: string | null;
      estimatedHours: number;
      actualHours: number | null;
      dependencies: number[];
      canStart: boolean;
    }>;
    summary: {
      totalTasks: number;
      pendingTasks: number;
      inProgressTasks: number;
      completedTasks: number;
      overdueTasks: number;
    };
  }>> {
    return apiClient.get('/supervisor/tasks/assignments', { params });
  }

  /**
   * Monitor task progress across all assigned workers
   */
  async getTaskProgress(params?: {
    projectId?: number;
    timeframe?: 'today' | 'week' | 'month';
  }): Promise<ApiResponse<{
    progressData: Array<{
      taskId: number;
      taskName: string;
      workerId: number;
      workerName: string;
      progress: number;
      lastUpdated: string;
      estimatedCompletion: string;
      issues: Array<{
        type: 'delay' | 'quality' | 'resource' | 'safety';
        description: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        reportedAt: string;
      }>;
    }>;
    overallMetrics: {
      averageProgress: number;
      onScheduleTasks: number;
      delayedTasks: number;
      completionRate: number;
      productivityIndex: number;
    };
  }>> {
    return apiClient.get('/supervisor/tasks/progress', { params });
  }

  /**
   * Reassign task to different worker
   */
  async reassignTask(assignmentId: number, reassignmentData: {
    newWorkerId: number;
    reason: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    instructions?: string;
  }): Promise<ApiResponse<{
    newAssignmentId: number;
    oldAssignmentId: number;
    newWorkerId: number;
    reassignedAt: string;
    message: string;
  }>> {
    return apiClient.post(`/supervisor/tasks/assignments/${assignmentId}/reassign`, reassignmentData);
  }

  /**
   * Update task priority and instructions
   */
  async updateTaskPriority(assignmentId: number, updateData: {
    priority: 'low' | 'normal' | 'high' | 'urgent';
    instructions?: string;
    estimatedHours?: number;
  }): Promise<ApiResponse<{
    assignmentId: number;
    updatedAt: string;
    message: string;
  }>> {
    return apiClient.put(`/supervisor/tasks/assignments/${assignmentId}/priority`, updateData);
  }

  /**
   * Create daily progress report
   */
  async createProgressReport(reportData: {
    date: string;
    projectId: number;
    summary: string;
    manpowerUtilization: {
      totalWorkers: number;
      activeWorkers: number;
      productivity: number;
      efficiency: number;
    };
    progressMetrics: {
      overallProgress: number;
      milestonesCompleted: number;
      tasksCompleted: number;
      hoursWorked: number;
    };
    issues: Array<{
      type: 'safety' | 'quality' | 'delay' | 'resource';
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      status: 'open' | 'in_progress' | 'resolved';
    }>;
    materialConsumption: Array<{
      materialId: number;
      name: string;
      consumed: number;
      remaining: number;
      unit: string;
    }>;
  }): Promise<ApiResponse<{
    reportId: string;
    date: string;
    status: 'draft';
    createdAt: string;
    message: string;
  }>> {
    return apiClient.post('/supervisor/reports/progress', reportData);
  }

  /**
   * Upload photos for progress report
   */
  async uploadProgressReportPhotos(
    reportId: string,
    photosData: {
      photos: File[];
      category: 'progress' | 'issue' | 'completion';
      description: string;
      taskId?: number;
    }
  ): Promise<ApiResponse<{
    uploadedPhotos: Array<{
      photoId: string;
      filename: string;
      url: string;
      category: 'progress' | 'issue' | 'completion';
      uploadedAt: string;
    }>;
    totalPhotos: number;
  }>> {
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

    return apiClient.uploadFile(`/supervisor/reports/${reportId}/photos`, formData);
  }

  /**
   * Submit progress report for approval
   */
  async submitProgressReport(
    reportId: string,
    submitData: {
      finalNotes: string;
      managerNotification: boolean;
    }
  ): Promise<ApiResponse<{
    reportId: string;
    status: 'submitted';
    submittedAt: string;
    managerNotified: boolean;
    message: string;
  }>> {
    return apiClient.post(`/supervisor/reports/${reportId}/submit`, submitData);
  }

  /**
   * Get progress reports with filtering
   */
  async getProgressReports(params?: {
    projectId?: number;
    date?: string;
    status?: 'draft' | 'submitted' | 'approved';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    reports: SupervisorReport[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }>> {
    return apiClient.get('/supervisor/reports/progress', { params });
  }

  /**
   * Get specific progress report details
   */
  async getProgressReport(reportId: string): Promise<ApiResponse<SupervisorReport>> {
    return apiClient.get(`/supervisor/reports/progress/${reportId}`);
  }

  /**
   * Get pending approvals for supervisor review
   */
  async getPendingApprovals(params?: {
    type?: 'leave' | 'material' | 'tool' | 'reimbursement' | 'advance_payment';
    urgency?: 'low' | 'normal' | 'high' | 'urgent';
    projectId?: number;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    approvals: PendingApproval[];
    summary: {
      totalPending: number;
      urgentCount: number;
      overdueCount: number;
      byType: {
        leave: number;
        material: number;
        tool: number;
        reimbursement: number;
        advance_payment: number;
      };
    };
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }>> {
    return apiClient.get('/supervisor/approvals/pending', { params });
  }

  /**
   * Get detailed approval request information
   */
  async getApprovalDetails(approvalId: number): Promise<ApiResponse<{
    approval: PendingApproval;
    requestDetails: any;
    requesterInfo: {
      id: number;
      name: string;
      role: string;
      department: string;
      recentPerformance: {
        attendanceRate: number;
        taskCompletionRate: number;
        qualityScore: number;
      };
    };
    approvalHistory: Array<{
      action: 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'escalated';
      by: string;
      timestamp: string;
      notes?: string;
    }>;
    attachments: Array<{
      filename: string;
      url: string;
      uploadedAt: string;
    }>;
  }>> {
    return apiClient.get(`/supervisor/approvals/${approvalId}`);
  }

  /**
   * Approve or reject a request
   */
  async processApproval(approvalId: number, decision: {
    action: 'approve' | 'reject' | 'request_more_info';
    notes?: string;
    conditions?: string[];
    escalate?: boolean;
  }): Promise<ApiResponse<{
    approvalId: number;
    status: 'approved' | 'rejected' | 'pending_info' | 'escalated';
    processedAt: string;
    message: string;
    nextSteps?: string;
  }>> {
    return apiClient.post(`/supervisor/approvals/${approvalId}/process`, decision);
  }

  /**
   * Batch process multiple approvals
   */
  async batchProcessApprovals(decisions: Array<{
    approvalId: number;
    action: 'approve' | 'reject';
    notes?: string;
  }>): Promise<ApiResponse<{
    processed: number;
    successful: number;
    failed: number;
    results: Array<{
      approvalId: number;
      status: 'success' | 'failed';
      message: string;
    }>;
  }>> {
    return apiClient.post('/supervisor/approvals/batch-process', { decisions });
  }

  /**
   * Get approval history and audit trail
   */
  async getApprovalHistory(params?: {
    requesterId?: number;
    type?: 'leave' | 'material' | 'tool' | 'reimbursement' | 'advance_payment';
    status?: 'approved' | 'rejected' | 'escalated';
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    approvals: Array<{
      id: number;
      requestType: string;
      requesterName: string;
      requestDate: string;
      processedDate: string;
      status: string;
      approverNotes: string;
      amount?: number;
    }>;
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }>> {
    return apiClient.get('/supervisor/approvals/history', { params });
  }

  /**
   * Get material requests for supervisor review
   */
  async getMaterialRequests(params?: {
    projectId?: number;
    status?: 'pending' | 'approved' | 'rejected' | 'delivered';
    urgency?: 'low' | 'normal' | 'high' | 'urgent';
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    requests: MaterialRequest[];
    summary: {
      totalRequests: number;
      pendingCount: number;
      approvedCount: number;
      totalEstimatedCost: number;
      urgentCount: number;
    };
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }>> {
    return apiClient.get('/supervisor/materials/requests', { params });
  }

  /**
   * Approve or reject material request
   */
  async processMaterialRequest(requestId: number, decision: {
    action: 'approve' | 'reject' | 'modify';
    notes?: string;
    approvedQuantity?: number;
    approvedCost?: number;
    deliveryDate?: string;
    supplier?: string;
  }): Promise<ApiResponse<{
    requestId: number;
    status: 'approved' | 'rejected' | 'modified';
    processedAt: string;
    message: string;
  }>> {
    return apiClient.post(`/supervisor/materials/requests/${requestId}/process`, decision);
  }

  /**
   * Get tool allocations and assignments
   */
  async getToolAllocations(params?: {
    projectId?: number;
    toolId?: number;
    workerId?: number;
    status?: 'allocated' | 'returned' | 'overdue' | 'damaged';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    allocations: ToolAllocation[];
    summary: {
      totalAllocations: number;
      activeAllocations: number;
      overdueReturns: number;
      damagedTools: number;
    };
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }>> {
    return apiClient.get('/supervisor/tools/allocations', { params });
  }

  /**
   * Allocate tool to worker
   */
  async allocateTool(allocationData: {
    toolId: number;
    workerId: number;
    projectId: number;
    expectedReturnDate: string;
    purpose: string;
    instructions?: string;
  }): Promise<ApiResponse<{
    allocationId: number;
    toolId: number;
    workerId: number;
    allocatedAt: string;
    expectedReturnDate: string;
    message: string;
  }>> {
    return apiClient.post('/supervisor/tools/allocate', allocationData);
  }

  /**
   * Process tool return and condition assessment
   */
  async processToolReturn(allocationId: number, returnData: {
    returnedAt: string;
    condition: 'good' | 'fair' | 'needs_maintenance' | 'damaged';
    notes?: string;
    maintenanceRequired?: boolean;
    photos?: File[];
  }): Promise<ApiResponse<{
    allocationId: number;
    returnedAt: string;
    condition: string;
    maintenanceScheduled: boolean;
    message: string;
  }>> {
    const formData = new FormData();
    
    // Add return data
    formData.append('returnedAt', returnData.returnedAt);
    formData.append('condition', returnData.condition);
    if (returnData.notes) {
      formData.append('notes', returnData.notes);
    }
    if (returnData.maintenanceRequired !== undefined) {
      formData.append('maintenanceRequired', returnData.maintenanceRequired.toString());
    }
    
    // Add photos if provided
    if (returnData.photos && returnData.photos.length > 0) {
      returnData.photos.forEach((photo, index) => {
        formData.append('photos', photo);
      });
    }

    return apiClient.uploadFile(`/supervisor/tools/allocations/${allocationId}/return`, formData);
  }

  /**
   * Get material consumption and inventory status
   */
  async getMaterialInventory(params?: {
    projectId?: number;
    category?: string;
    lowStock?: boolean;
  }): Promise<ApiResponse<{
    inventory: Array<{
      materialId: number;
      name: string;
      category: string;
      currentStock: number;
      allocatedStock: number;
      availableStock: number;
      unit: string;
      reorderLevel: number;
      isLowStock: boolean;
      lastUpdated: string;
    }>;
    alerts: Array<{
      materialId: number;
      materialName: string;
      alertType: 'low_stock' | 'out_of_stock' | 'overdue_delivery';
      message: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
  }>> {
    return apiClient.get('/supervisor/materials/inventory', { params });
  }

  /**
   * Update material allocation and usage
   */
  async updateMaterialAllocation(allocationData: {
    materialId: number;
    projectId: number;
    workerId: number;
    allocatedQuantity: number;
    purpose: string;
    expectedUsageDate: string;
  }): Promise<ApiResponse<{
    allocationId: number;
    materialId: number;
    allocatedQuantity: number;
    allocatedAt: string;
    message: string;
  }>> {
    return apiClient.post('/supervisor/materials/allocate', allocationData);
  }

  // Progress Reporting and Documentation APIs - Requirements: 5.1

  /**
   * Create daily progress report
   */
  async createProgressReport(reportData: {
    date: string;
    projectId: number;
    summary: string;
    manpowerUtilization: {
      totalWorkers: number;
      activeWorkers: number;
      productivity: number;
      efficiency: number;
    };
    progressMetrics: {
      overallProgress: number;
      milestonesCompleted: number;
      tasksCompleted: number;
      hoursWorked: number;
    };
    issues: Array<{
      type: 'safety' | 'quality' | 'delay' | 'resource';
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      status: 'open' | 'in_progress' | 'resolved';
    }>;
    materialConsumption: Array<{
      materialId: number;
      name: string;
      consumed: number;
      remaining: number;
      unit: string;
    }>;
  }): Promise<ApiResponse<{
    reportId: string;
    date: string;
    status: 'draft';
    createdAt: string;
    message: string;
  }>> {
    return apiClient.post('/supervisor/reports/progress', reportData);
  }

  /**
   * Upload photos for progress report
   */
  async uploadProgressReportPhotos(
    reportId: string,
    photosData: {
      photos: File[];
      category: 'progress' | 'issue' | 'completion';
      description: string;
      taskId?: number;
    }
  ): Promise<ApiResponse<{
    uploadedPhotos: Array<{
      photoId: string;
      filename: string;
      url: string;
      category: 'progress' | 'issue' | 'completion';
      uploadedAt: string;
    }>;
    totalPhotos: number;
  }>> {
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

    return apiClient.uploadFile(`/supervisor/reports/${reportId}/photos`, formData);
  }

  /**
   * Submit progress report for approval
   */
  async submitProgressReport(
    reportId: string,
    submitData: {
      finalNotes: string;
      managerNotification: boolean;
    }
  ): Promise<ApiResponse<{
    reportId: string;
    status: 'submitted';
    submittedAt: string;
    managerNotified: boolean;
    message: string;
  }>> {
    return apiClient.post(`/supervisor/reports/${reportId}/submit`, submitData);
  }

  /**
   * Get progress reports with filtering
   */
  async getProgressReports(params?: {
    projectId?: number;
    date?: string;
    status?: 'draft' | 'submitted' | 'approved';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    reports: SupervisorReport[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }>> {
    return apiClient.get('/supervisor/reports/progress', { params });
  }

  /**
   * Get specific progress report details
   */
  async getProgressReport(reportId: string): Promise<ApiResponse<SupervisorReport>> {
    return apiClient.get(`/supervisor/reports/progress/${reportId}`);
  }
  // Approval Workflow and Request Management APIs - Requirements: 6.1

  /**
   * Get pending approvals for supervisor review
   */
  async getPendingApprovals(params?: {
    type?: 'leave' | 'material' | 'tool' | 'reimbursement' | 'advance_payment';
    urgency?: 'low' | 'normal' | 'high' | 'urgent';
    projectId?: number;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    approvals: PendingApproval[];
    summary: {
      totalPending: number;
      urgentCount: number;
      overdueCount: number;
      byType: {
        leave: number;
        material: number;
        tool: number;
        reimbursement: number;
        advance_payment: number;
      };
    };
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }>> {
    return apiClient.get('/supervisor/approvals/pending', { params });
  }

  /**
   * Get detailed approval request information
   */
  async getApprovalDetails(approvalId: number): Promise<ApiResponse<{
    approval: PendingApproval;
    requestDetails: any;
    requesterInfo: {
      id: number;
      name: string;
      role: string;
      department: string;
      recentPerformance: {
        attendanceRate: number;
        taskCompletionRate: number;
        qualityScore: number;
      };
    };
    approvalHistory: Array<{
      action: 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'escalated';
      by: string;
      timestamp: string;
      notes?: string;
    }>;
    attachments: Array<{
      filename: string;
      url: string;
      uploadedAt: string;
    }>;
  }>> {
    return apiClient.get(`/supervisor/approvals/${approvalId}`);
  }

  /**
   * Approve or reject a request
   */
  async processApproval(approvalId: number, decision: {
    action: 'approve' | 'reject' | 'request_more_info';
    notes?: string;
    conditions?: string[];
    escalate?: boolean;
  }): Promise<ApiResponse<{
    approvalId: number;
    status: 'approved' | 'rejected' | 'pending_info' | 'escalated';
    processedAt: string;
    message: string;
    nextSteps?: string;
  }>> {
    return apiClient.post(`/supervisor/approvals/${approvalId}/process`, decision);
  }

  /**
   * Batch process multiple approvals
   */
  async batchProcessApprovals(decisions: Array<{
    approvalId: number;
    action: 'approve' | 'reject';
    notes?: string;
  }>): Promise<ApiResponse<{
    processed: number;
    successful: number;
    failed: number;
    results: Array<{
      approvalId: number;
      status: 'success' | 'failed';
      message: string;
    }>;
  }>> {
    return apiClient.post('/supervisor/approvals/batch-process', { decisions });
  }

  /**
   * Get approval history and audit trail
   */
  async getApprovalHistory(params?: {
    requesterId?: number;
    type?: 'leave' | 'material' | 'tool' | 'reimbursement' | 'advance_payment';
    status?: 'approved' | 'rejected' | 'escalated';
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    approvals: Array<{
      id: number;
      requestType: string;
      requesterName: string;
      requestDate: string;
      processedDate: string;
      status: string;
      approverNotes: string;
      amount?: number;
    }>;
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }>> {
    return apiClient.get('/supervisor/approvals/history', { params });
  }
  // Material and Tool Management APIs - Requirements: 7.1

  /**
   * Get material requests for supervisor review
   */
  async getMaterialRequests(params?: {
    projectId?: number;
    status?: 'pending' | 'approved' | 'rejected' | 'delivered';
    urgency?: 'low' | 'normal' | 'high' | 'urgent';
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    requests: MaterialRequest[];
    summary: {
      totalRequests: number;
      pendingCount: number;
      approvedCount: number;
      totalEstimatedCost: number;
      urgentCount: number;
    };
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }>> {
    return apiClient.get('/supervisor/materials/requests', { params });
  }

  /**
   * Approve or reject material request
   */
  async processMaterialRequest(requestId: number, decision: {
    action: 'approve' | 'reject' | 'modify';
    notes?: string;
    approvedQuantity?: number;
    approvedCost?: number;
    deliveryDate?: string;
    supplier?: string;
  }): Promise<ApiResponse<{
    requestId: number;
    status: 'approved' | 'rejected' | 'modified';
    processedAt: string;
    message: string;
  }>> {
    return apiClient.post(`/supervisor/materials/requests/${requestId}/process`, decision);
  }

  /**
   * Get tool allocations and assignments
   */
  async getToolAllocations(params?: {
    projectId?: number;
    toolId?: number;
    workerId?: number;
    status?: 'allocated' | 'returned' | 'overdue' | 'damaged';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    allocations: ToolAllocation[];
    summary: {
      totalAllocations: number;
      activeAllocations: number;
      overdueReturns: number;
      damagedTools: number;
    };
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }>> {
    return apiClient.get('/supervisor/tools/allocations', { params });
  }

  /**
   * Allocate tool to worker
   */
  async allocateTool(allocationData: {
    toolId: number;
    workerId: number;
    projectId: number;
    expectedReturnDate: string;
    purpose: string;
    instructions?: string;
  }): Promise<ApiResponse<{
    allocationId: number;
    toolId: number;
    workerId: number;
    allocatedAt: string;
    expectedReturnDate: string;
    message: string;
  }>> {
    return apiClient.post('/supervisor/tools/allocate', allocationData);
  }

  /**
   * Process tool return and condition assessment
   */
  async processToolReturn(allocationId: number, returnData: {
    returnedAt: string;
    condition: 'good' | 'fair' | 'needs_maintenance' | 'damaged';
    notes?: string;
    maintenanceRequired?: boolean;
    photos?: File[];
  }): Promise<ApiResponse<{
    allocationId: number;
    returnedAt: string;
    condition: string;
    maintenanceScheduled: boolean;
    message: string;
  }>> {
    const formData = new FormData();
    
    // Add return data
    formData.append('returnedAt', returnData.returnedAt);
    formData.append('condition', returnData.condition);
    if (returnData.notes) {
      formData.append('notes', returnData.notes);
    }
    if (returnData.maintenanceRequired !== undefined) {
      formData.append('maintenanceRequired', returnData.maintenanceRequired.toString());
    }
    
    // Add photos if provided
    if (returnData.photos && returnData.photos.length > 0) {
      returnData.photos.forEach((photo, index) => {
        formData.append('photos', photo);
      });
    }

    return apiClient.uploadFile(`/supervisor/tools/allocations/${allocationId}/return`, formData);
  }

  /**
   * Get material consumption and inventory status
   */
  async getMaterialInventory(params?: {
    projectId?: number;
    category?: string;
    lowStock?: boolean;
  }): Promise<ApiResponse<{
    inventory: Array<{
      materialId: number;
      name: string;
      category: string;
      currentStock: number;
      allocatedStock: number;
      availableStock: number;
      unit: string;
      reorderLevel: number;
      isLowStock: boolean;
      lastUpdated: string;
    }>;
    alerts: Array<{
      materialId: number;
      materialName: string;
      alertType: 'low_stock' | 'out_of_stock' | 'overdue_delivery';
      message: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
  }>> {
    return apiClient.get('/supervisor/materials/inventory', { params });
  }

  /**
   * Update material allocation and usage
   */
  async updateMaterialAllocation(allocationData: {
    materialId: number;
    projectId: number;
    workerId: number;
    allocatedQuantity: number;
    purpose: string;
    expectedUsageDate: string;
  }): Promise<ApiResponse<{
    allocationId: number;
    materialId: number;
    allocatedQuantity: number;
    allocatedAt: string;
    message: string;
  }>> {
    return apiClient.post('/supervisor/materials/allocate', allocationData);
  }
}

// Export singleton instance
export const supervisorApiService = new SupervisorApiService();
export default supervisorApiService;