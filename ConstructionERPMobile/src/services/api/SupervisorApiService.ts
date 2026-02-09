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
   * Get assigned sites (alias for projects) - mobile app compatibility
   */
  async getAssignedSites(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/supervisor/assigned-sites');
  }

  /**
   * Get team list (alias for workers-assigned) - mobile app compatibility
   */
  async getTeamList(projectId: number, date?: string): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    params.append('projectId', projectId.toString());
    if (date) params.append('date', date);
    return apiClient.get(`/supervisor/team-list?${params.toString()}`);
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
   * Assign task to worker - uses existing endpoint
   * Body: { employeeId, projectId, taskIds, date }
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
   * Create and assign a new task to a worker (convenience method for mobile app)
   * Body: { taskName, description, employeeId, projectId, priority, estimatedHours, instructions, date }
   */
  async createAndAssignTask(taskData: {
    taskName: string;
    description?: string;
    employeeId: number;
    projectId: number;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    estimatedHours?: number;
    instructions?: string;
    date?: string;
    // NEW FIELDS
    trade?: string;
    siteLocation?: string;
    toolsRequired?: string;
    materialsRequired?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<ApiResponse<{
    taskId: number;
    assignmentId: number;
    taskName: string;
    sequence: number;
  }>> {
    return apiClient.post('/supervisor/create-and-assign-task', taskData);
  }

  /**
   * NEW: Create and assign a task to multiple workers (group assignment)
   * Body: { taskName, description, employeeIds, projectId, priority, estimatedHours, instructions, date, ... }
   */
  async createAndAssignTaskGroup(taskData: {
    taskName: string;
    description?: string;
    employeeIds: number[];
    projectId: number;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    estimatedHours?: number;
    instructions?: string;
    date?: string;
    trade?: string;
    siteLocation?: string;
    toolsRequired?: string;
    materialsRequired?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<ApiResponse<{
    taskId: number;
    assignmentIds: number[];
    taskName: string;
    workersAssigned: number;
  }>> {
    return apiClient.post('/supervisor/create-and-assign-task-group', taskData);
  }

  /**
   * NEW: Verify task completion by supervisor
   * POST /api/supervisor/verify-task-completion/:assignmentId
   */
  async verifyTaskCompletion(assignmentId: number): Promise<ApiResponse<{
    assignmentId: number;
    verifiedAt: string;
    verifiedBy: number;
  }>> {
    return apiClient.post(`/supervisor/verify-task-completion/${assignmentId}`, {});
  }

  /**
   * Update task assignment - uses existing endpoint
   * Body: { assignmentId, changes }
   */
  async updateTaskAssignment(updateData: {
    assignmentId: number;
    changes: any;
  }): Promise<ApiResponse<any>> {
    return apiClient.put('/supervisor/update-assignment', updateData);
  }

  /**
   * Update daily targets - uses existing endpoint
   * Body: { assignmentUpdates: [{ assignmentId, dailyTarget }] }
   */
  async updateDailyTargets(data: {
    assignmentUpdates: Array<{
      assignmentId: number;
      dailyTarget: any;
    }>;
  }): Promise<ApiResponse<any>> {
    return apiClient.put('/supervisor/daily-targets', data);
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
   * Get pending attendance corrections for review
   */
  async getPendingAttendanceCorrections(params?: {
    projectId?: string;
    status?: string;
  }): Promise<ApiResponse<{
    data: Array<{
      correctionId: number;
      workerId: number;
      workerName: string;
      requestType: 'check_in' | 'check_out' | 'lunch_start' | 'lunch_end';
      originalTime: string;
      requestedTime: string;
      reason: string;
      requestedAt: string;
      status: 'pending' | 'approved' | 'rejected';
    }>;
    count: number;
  }>> {
    return apiClient.get('/supervisor/pending-attendance-corrections', { params });
  }

  /**
   * Approve or reject attendance correction
   */
  async approveAttendanceCorrection(
    correctionId: number,
    data: {
      action: 'approve' | 'reject';
      notes?: string;
      correctedTime?: string;
    }
  ): Promise<ApiResponse<any>> {
    return apiClient.post(`/supervisor/attendance-correction/${correctionId}/review`, data);
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
   * Get workers assigned to a project - uses existing endpoint
   * Returns today's workforce count and worker details
   * GET /api/supervisor/workers-assigned
   */
  async getWorkersAssigned(params: {
    projectId: string;
    date?: string;
    search?: string;
  }): Promise<ApiResponse<{
    workers: Array<{
      employeeId: number;
      workerName: string;
      role: string;
      checkIn: string;
      checkOut: string;
      status: string;
    }>;
  }>> {
    return apiClient.get('/supervisor/workers-assigned', { params });
  }

  /**
   * Get pending approvals summary for dashboard
   * Returns counts of pending leave, advance, material, and tool requests
   * GET /api/supervisor/pending-approvals
   */
  async getPendingApprovalsSummary(): Promise<ApiResponse<{
    approvals: any[];
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
    return apiClient.get('/supervisor/pending-approvals');
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

  // ========================================
  // COMPREHENSIVE METHODS FOR FUTURE USE
  // ========================================
  // These methods are kept for future implementation
  // but are not currently used by the mobile app
  
  /**
   * Get supervisor dashboard data with team overview and key metrics
   * This is the OPTIMIZED single-call endpoint that replaces multiple N+1 queries
   * Returns all dashboard data in one response
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
   * Get supervisor profile data
   */
  async getSupervisorProfile(): Promise<ApiResponse<{
    user: {
      id: number;
      name: string;
      email: string;
      phone: string;
      profileImage?: string;
      employeeId: string;
      role: string;
    };
    supervisorInfo: {
      approvalLevel: 'basic' | 'advanced' | 'senior';
      specializations: string[];
      yearsOfExperience: number;
      department: string;
      joinDate: string;
    };
    teamAssignments: Array<{
      projectId: number;
      projectName: string;
      projectCode: string;
      location: string;
      teamSize: number;
      startDate: string;
      status: 'active' | 'completed' | 'on_hold';
      role: 'lead_supervisor' | 'assistant_supervisor' | 'site_supervisor';
    }>;
    projectResponsibilities: Array<{
      projectId: number;
      projectName: string;
      responsibilities: string[];
      budget: number;
      currency: string;
      completionPercentage: number;
    }>;
    certifications: Array<{
      id: number;
      name: string;
      issuer: string;
      issueDate: string;
      expiryDate: string;
      certificateNumber: string;
      status: 'active' | 'expired' | 'expiring_soon';
      category: 'safety' | 'technical' | 'management' | 'regulatory';
    }>;
    performanceMetrics: {
      projectsCompleted: number;
      averageProjectRating: number;
      teamSatisfactionScore: number;
      safetyRecord: {
        incidentFreeMonths: number;
        safetyTrainingsCompleted: number;
        safetyAuditsScore: number;
      };
      approvalMetrics: {
        averageApprovalTime: number;
        approvalAccuracy: number;
        totalApprovalsProcessed: number;
      };
      teamPerformance: {
        averageTaskCompletion: number;
        teamProductivity: number;
        workerRetentionRate: number;
      };
    };
    achievements: Array<{
      id: number;
      title: string;
      description: string;
      dateAchieved: string;
      category: 'safety' | 'productivity' | 'quality' | 'leadership' | 'innovation';
      icon: string;
    }>;
  }>> {
    return apiClient.get('/supervisor/profile');
  }

  /**
   * Update supervisor profile
   */
  async updateSupervisorProfile(profileData: {
    phoneNumber?: string;
    emergencyContact?: {
      name: string;
      relationship: string;
      phone: string;
    };
    preferences?: any;
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
  }>> {
    return apiClient.put('/supervisor/profile', profileData);
  }

  /**
   * Change supervisor password
   */
  async changeSupervisorPassword(passwordData: {
    oldPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
  }>> {
    return apiClient.put('/supervisor/profile/password', passwordData);
  }

  /**
   * Upload supervisor profile photo
   */
  async uploadProfilePhoto(photo: File): Promise<ApiResponse<{
    success: boolean;
    message: string;
    photoUrl?: string;
  }>> {
    try {
      console.log('📤 Uploading supervisor profile photo...');
      
      const formData = new FormData();
      formData.append('photo', photo);
      
      const response = await apiClient.uploadFile('/supervisor/profile/photo', formData);
      
      // Handle the response structure from backend
      console.log('📥 Supervisor photo upload response:', {
        success: response.success,
        hasData: !!response.data,
        hasPhotoUrl: !!(response.data?.photoUrl || response.photoUrl)
      });
      
      return response;
    } catch (error) {
      console.error('❌ uploadProfilePhoto error:', error);
      throw error;
    }
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

  // ========================================
  // PROGRESS REPORTING APIs
  // ========================================

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

  // ========================================
  // APPROVAL WORKFLOW APIs
  // ========================================

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

  // ========================================
  // APPROVAL WORKFLOW APIs
  // ========================================

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

  /**
   * Get task assignments with filtering
   * Returns list of task assignments for workers
   */
  async getTaskAssignments(params?: {
    projectId?: number;
    status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    workerId?: number;
    limit?: number;
    offset?: number;
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
      instructions?: string;
    }>;
    summary: {
      totalAssignments: number;
      pending: number;
      inProgress: number;
      completed: number;
      cancelled: number;
    };
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }>> {
    return apiClient.get('/supervisor/task-assignments', { params });
  }

  /**
   * Reassign task to a different worker
   */
  async reassignTask(assignmentId: number, data: {
    newWorkerId: number;
    reason: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    instructions: string;
  }): Promise<ApiResponse<{
    assignmentId: number;
    newWorkerId: number;
    reassignedAt: string;
    message: string;
  }>> {
    return apiClient.post(`/supervisor/task-assignments/${assignmentId}/reassign`, data);
  }

  /**
   * Update task priority
   */
  async updateTaskPriority(assignmentId: number, data: {
    priority: 'low' | 'normal' | 'high' | 'urgent';
    instructions: string;
    estimatedHours: number;
  }): Promise<ApiResponse<{
    assignmentId: number;
    priority: string;
    updatedAt: string;
    message: string;
  }>> {
    return apiClient.put(`/supervisor/task-assignments/${assignmentId}/priority`, data);
  }

  /**
   * Mark absence reason for a worker
   */
  async markAbsenceReason(data: {
    employeeId: number;
    projectId: number;
    date: string;
    reason: 'LEAVE_APPROVED' | 'LEAVE_NOT_INFORMED' | 'MEDICAL' | 'UNAUTHORIZED' | 'PRESENT';
    notes?: string;
  }): Promise<ApiResponse<{
    attendanceId: number;
    absenceReason: string;
    absenceNotes: string;
  }>> {
    return apiClient.post('/supervisor/mark-absence-reason', data);
  }

  /**
   * Create attendance escalation
   */
  async createEscalation(data: {
    employeeId: number;
    projectId: number;
    escalationType: 'REPEATED_LATE' | 'REPEATED_ABSENCE' | 'GEOFENCE_VIOLATION' | 'UNAUTHORIZED_ABSENCE' | 'OTHER';
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    occurrenceCount?: number;
    dateRange: {
      from: string;
      to: string;
    };
    escalatedTo: 'ADMIN' | 'MANAGER' | 'HR';
    notes?: string;
    relatedAttendanceIds?: number[];
  }): Promise<ApiResponse<{
    escalationId: number;
    employeeName: string;
    escalationType: string;
    severity: string;
    status: string;
  }>> {
    return apiClient.post('/supervisor/create-escalation', data);
  }

  /**
   * Get escalations for a project
   */
  async getEscalations(params: {
    projectId: number;
    status?: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
    employeeId?: number;
  }): Promise<ApiResponse<Array<{
    id: number;
    employeeId: number;
    employeeName: string;
    escalationType: string;
    severity: string;
    description: string;
    occurrenceCount: number;
    dateRange: {
      from: string;
      to: string;
    };
    escalatedTo: string;
    status: string;
    notes: string;
    createdAt: string;
  }>>> {
    return apiClient.get('/supervisor/escalations', { params });
  }

  /**
   * Export attendance report
   */
  async exportAttendanceReport(params: {
    projectId: number;
    date?: string;
    format?: 'json' | 'csv';
  }): Promise<ApiResponse<{
    summary: {
      projectName: string;
      date: string;
      totalWorkers: number;
      present: number;
      absent: number;
      totalRegularHours: string;
      totalOTHours: string;
      generatedAt: string;
    };
    data: Array<{
      employeeId: number;
      employeeName: string;
      role: string;
      phone: string;
      status: string;
      checkIn: string;
      checkOut: string;
      lunchStart: string;
      lunchEnd: string;
      regularHours: string;
      otHours: string;
      totalHours: string;
      absenceReason: string;
      insideGeofence: string;
      taskAssigned: string;
    }>;
  }>> {
    return apiClient.get('/supervisor/export-attendance-report', { params });
  }

  /**
   * Create general issue escalation to manager
   * For material delays, equipment breakdowns, site instruction changes, etc.
   */
  async createIssueEscalation(data: {
    issueType: 'MANPOWER_SHORTAGE' | 'SAFETY_INCIDENT' | 'MATERIAL_DELAY' | 
                'MATERIAL_DAMAGE' | 'WORKER_MISCONDUCT' | 'EQUIPMENT_BREAKDOWN' | 
                'SITE_INSTRUCTION_CHANGE' | 'OTHER';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    description: string;
    escalateTo: 'MANAGER' | 'ADMIN' | 'BOSS';
    photos: string[];
    projectId: number;
    notes: string;
    immediateActionRequired: boolean;
    estimatedImpact?: string;
    suggestedSolution?: string;
    supervisorId: number;
    supervisorName: string;
    timestamp: string;
  }): Promise<ApiResponse<{
    escalationId: number;
    issueType: string;
    severity: string;
    status: string;
    escalatedTo: string;
    createdAt: string;
    message: string;
  }>> {
    return apiClient.post('/supervisor/issue-escalation', data);
  }

  /**
   * Get issue escalations for a project
   */
  async getIssueEscalations(params: {
    projectId?: number;
    status?: 'PENDING' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
    issueType?: string;
    severity?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    escalations: Array<{
      id: number;
      issueType: string;
      severity: string;
      title: string;
      description: string;
      escalateTo: string;
      status: string;
      projectId: number;
      projectName: string;
      supervisorId: number;
      supervisorName: string;
      immediateActionRequired: boolean;
      estimatedImpact: string;
      suggestedSolution: string;
      photos: string[];
      notes: string;
      createdAt: string;
      acknowledgedAt?: string;
      acknowledgedBy?: string;
      resolvedAt?: string;
      resolvedBy?: string;
      resolution?: string;
    }>;
    summary: {
      total: number;
      pending: number;
      acknowledged: number;
      inProgress: number;
      resolved: number;
      bySeverity: {
        critical: number;
        high: number;
        medium: number;
        low: number;
      };
      byType: Record<string, number>;
    };
  }>> {
    return apiClient.get('/supervisor/issue-escalations', { params });
  }

  /**
   * Update issue escalation status (for managers/admin)
   */
  async updateIssueEscalation(escalationId: number, data: {
    status: 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
    notes?: string;
    resolution?: string;
  }): Promise<ApiResponse<{
    escalationId: number;
    status: string;
    updatedAt: string;
    message: string;
  }>> {
    return apiClient.put(`/supervisor/issue-escalation/${escalationId}`, data);
  }

  // ========================================
  // MATERIALS & TOOLS MANAGEMENT
  // ========================================

  /**
   * Request materials for a project
   * POST /api/supervisor/request-materials
   */
  async requestMaterials(data: {
    projectId: number;
    requestType: 'MATERIAL' | 'TOOL';
    itemName: string;
    itemCategory?: string;
    quantity: number;
    unit?: string;
    urgency?: 'NORMAL' | 'HIGH' | 'URGENT';
    requiredDate: Date;
    purpose: string;
    justification?: string;
    specifications?: string;
    estimatedCost?: number;
  }): Promise<ApiResponse<{
    requestId: number;
    itemName: string;
    status: string;
    message: string;
  }>> {
    return apiClient.post('/supervisor/request-materials', data);
  }

  /**
   * Allocate tool to worker
   * POST /api/supervisor/allocate-tool
   */
  async allocateTool(data: {
    toolId: number;
    toolName: string;
    allocatedTo: number;
    allocatedToName: string;
    allocationDate: Date;
    expectedReturnDate: Date;
    condition: string;
    location: string;
  }): Promise<ApiResponse<{
    allocationId: number;
    toolName: string;
    allocatedTo: string;
    message: string;
  }>> {
    return apiClient.post('/supervisor/allocate-tool', data);
  }

  /**
   * Return tool from worker
   * POST /api/supervisor/return-tool/:allocationId
   */
  async returnTool(allocationId: number, condition: string, notes?: string): Promise<ApiResponse<{
    allocationId: number;
    returnedAt: string;
    condition: string;
    message: string;
  }>> {
    return apiClient.post(`/supervisor/return-tool/${allocationId}`, { condition, notes });
  }

  /**
   * Get materials and tools data
   * GET /api/supervisor/materials-tools
   */
  async getMaterialsAndTools(projectId?: number): Promise<ApiResponse<{
    materialRequests: MaterialRequest[];
    toolAllocations: ToolAllocation[];
  }>> {
    const queryString = projectId ? `?projectId=${projectId}` : '';
    return apiClient.get(`/supervisor/materials-tools${queryString}`);
  }

  /**
   * Acknowledge material/tool delivery
   * POST /api/supervisor/acknowledge-delivery/:requestId
   */
  async acknowledgeDelivery(requestId: number, data: {
    deliveredQuantity?: number;
    deliveryCondition?: 'good' | 'partial' | 'damaged' | 'wrong';
    receivedBy?: string;
    deliveryNotes?: string;
    deliveryPhotos?: string[];
  }): Promise<ApiResponse<{
    requestId: number;
    deliveredQuantity: number;
    deliveryCondition: string;
    message: string;
  }>> {
    return apiClient.post(`/supervisor/acknowledge-delivery/${requestId}`, data);
  }

  /**
   * Return materials to store
   * POST /api/supervisor/return-materials
   */
  async returnMaterials(data: {
    requestId: number;
    returnQuantity: number;
    returnReason: 'excess' | 'defect' | 'scope_change' | 'completion';
    returnCondition?: 'unused' | 'damaged';
    returnNotes?: string;
    returnPhotos?: string[];
  }): Promise<ApiResponse<{
    requestId: number;
    returnQuantity: number;
    returnCondition: string;
    message: string;
  }>> {
    return apiClient.post('/supervisor/return-materials', data);
  }

  /**
   * Get tool usage log
   * GET /api/supervisor/tool-usage-log
   */
  async getToolUsageLog(params?: {
    projectId?: number;
    toolId?: number;
    status?: string;
  }): Promise<ApiResponse<{
    tools: Array<{
      toolId: number;
      toolName: string;
      category: string;
      totalQuantity: number;
      status: string;
      condition: string;
      location: string;
      allocated: boolean;
      serialNumber?: string;
      lastMaintenanceDate?: string;
      nextMaintenanceDate?: string;
      allocationHistory: Array<{
        requestId: number;
        employeeId: number;
        quantity: number;
        requestedDate: string;
        approvedDate?: string;
        fulfilledDate?: string;
        status: string;
        purpose: string;
      }>;
      updatedAt: string;
    }>;
    count: number;
    projectId: number | string;
  }>> {
    return apiClient.get('/supervisor/tool-usage-log', { params });
  }

  /**
   * Log tool usage (check-out/check-in)
   * POST /api/supervisor/log-tool-usage
   */
  async logToolUsage(data: {
    toolId: number;
    action: 'check_out' | 'check_in';
    employeeId: number;
    quantity?: number;
    condition?: 'good' | 'fair' | 'needs_maintenance' | 'damaged';
    location?: string;
    notes?: string;
  }): Promise<ApiResponse<{
    action: string;
    toolId: number;
    toolName: string;
    employeeName: string;
    quantity: number;
    condition?: string;
    message: string;
  }>> {
    return apiClient.post('/supervisor/log-tool-usage', data);
  }

  /**
   * Get material inventory
   * GET /api/supervisor/materials/inventory
   */
  async getMaterialInventory(params?: {
    projectId?: number;
    lowStock?: boolean;
  }): Promise<ApiResponse<{
    inventory: Array<{
      id: number;
      type: 'MATERIAL' | 'TOOL';
      name: string;
      category: string;
      quantity: number;
      unit: string;
      allocated: number;
      available: number;
      status: string;
      projectId: number;
      projectName: string;
      location?: string;
      minQuantity: number;
      isLowStock: boolean;
      lastUpdated: string;
    }>;
    alerts: Array<{
      type: string;
      itemType: string;
      itemId: number;
      itemName: string;
      projectName: string;
      currentQuantity?: number;
      minQuantity?: number;
      condition?: string;
      message: string;
    }>;
    summary: {
      totalMaterials: number;
      totalTools: number;
      lowStockItems: number;
      maintenanceRequired: number;
    };
  }>> {
    return apiClient.get('/supervisor/materials/inventory', { params });
  }

  /**
   * Get material returns history
   * GET /api/supervisor/material-returns
   */
  async getMaterialReturns(params?: {
    projectId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<{
    returns: Array<{
      id: number;
      requestId: number;
      itemName: string;
      returnQuantity: number;
      returnReason: string;
      returnCondition: string;
      returnDate: string;
      returnedBy: string;
      status: string;
      notes?: string;
    }>;
    count: number;
  }>> {
    return apiClient.get('/supervisor/material-returns', { params });
  }
}

// Export singleton instance
export const supervisorApiService = new SupervisorApiService();
export default supervisorApiService;