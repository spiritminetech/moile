// Supervisor Context Provider - Manages supervisor-specific state and operations
// Requirements: 2.1, 3.1, 4.1, 6.1, 7.1

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import {
  SupervisorContextData,
  TeamMember,
  PendingApproval,
  MaterialRequest,
  ToolAllocation,
  SupervisorReport,
  Project,
  TaskAssignment,
} from '../../types';
import { dailyProgressApiService } from '../../services/api/DailyProgressApiService';
import { supervisorApiService } from '../../services/api/SupervisorApiService';
import { useAuth } from './AuthContext';

// Supervisor State Interface
interface SupervisorState extends SupervisorContextData {
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  // Individual loading states for different operations
  teamLoading: boolean;
  approvalsLoading: boolean;
  reportsLoading: boolean;
  materialsLoading: boolean;
}

// Action Types
type SupervisorAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LAST_UPDATED'; payload: Date }
  | { type: 'SET_TEAM_LOADING'; payload: boolean }
  | { type: 'SET_APPROVALS_LOADING'; payload: boolean }
  | { type: 'SET_REPORTS_LOADING'; payload: boolean }
  | { type: 'SET_MATERIALS_LOADING'; payload: boolean }
  // Team management actions
  | { type: 'SET_ASSIGNED_PROJECTS'; payload: Project[] }
  | { type: 'SET_TEAM_MEMBERS'; payload: TeamMember[] }
  | { type: 'UPDATE_TEAM_MEMBER'; payload: TeamMember }
  | { type: 'ADD_TEAM_MEMBER'; payload: TeamMember }
  | { type: 'REMOVE_TEAM_MEMBER'; payload: number }
  // Approval management actions
  | { type: 'SET_PENDING_APPROVALS'; payload: PendingApproval[] }
  | { type: 'ADD_PENDING_APPROVAL'; payload: PendingApproval }
  | { type: 'UPDATE_APPROVAL_STATUS'; payload: { id: number; status: 'approved' | 'rejected'; notes?: string } }
  | { type: 'REMOVE_APPROVAL'; payload: number }
  // Progress reporting actions
  | { type: 'SET_DAILY_REPORTS'; payload: SupervisorReport[] }
  | { type: 'ADD_DAILY_REPORT'; payload: SupervisorReport }
  | { type: 'UPDATE_DAILY_REPORT'; payload: SupervisorReport }
  | { type: 'REMOVE_DAILY_REPORT'; payload: string }
  // Material and tool management actions
  | { type: 'SET_MATERIAL_REQUESTS'; payload: MaterialRequest[] }
  | { type: 'ADD_MATERIAL_REQUEST'; payload: MaterialRequest }
  | { type: 'UPDATE_MATERIAL_REQUEST'; payload: MaterialRequest }
  | { type: 'SET_TOOL_ALLOCATIONS'; payload: ToolAllocation[] }
  | { type: 'ADD_TOOL_ALLOCATION'; payload: ToolAllocation }
  | { type: 'UPDATE_TOOL_ALLOCATION'; payload: ToolAllocation }
  | { type: 'REMOVE_TOOL_ALLOCATION'; payload: number }
  // Reset actions
  | { type: 'RESET_SUPERVISOR_STATE' }
  | { type: 'CLEAR_ERROR' };

// Initial State
const initialState: SupervisorState = {
  assignedProjects: [],
  teamMembers: [],
  pendingApprovals: [],
  dailyReports: [],
  materialRequests: [],
  toolAllocations: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  teamLoading: false,
  approvalsLoading: false,
  reportsLoading: false,
  materialsLoading: false,
};
// Reducer
const supervisorReducer = (state: SupervisorState, action: SupervisorAction): SupervisorState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_LAST_UPDATED':
      return { ...state, lastUpdated: action.payload };
    
    case 'SET_TEAM_LOADING':
      return { ...state, teamLoading: action.payload };
    
    case 'SET_APPROVALS_LOADING':
      return { ...state, approvalsLoading: action.payload };
    
    case 'SET_REPORTS_LOADING':
      return { ...state, reportsLoading: action.payload };
    
    case 'SET_MATERIALS_LOADING':
      return { ...state, materialsLoading: action.payload };
    
    // Team management
    case 'SET_ASSIGNED_PROJECTS':
      return { ...state, assignedProjects: action.payload };
    
    case 'SET_TEAM_MEMBERS':
      return { ...state, teamMembers: action.payload };
    
    case 'UPDATE_TEAM_MEMBER':
      return {
        ...state,
        teamMembers: state.teamMembers.map(member =>
          member.id === action.payload.id ? action.payload : member
        ),
      };
    
    case 'ADD_TEAM_MEMBER':
      return {
        ...state,
        teamMembers: [...state.teamMembers, action.payload],
      };
    
    case 'REMOVE_TEAM_MEMBER':
      return {
        ...state,
        teamMembers: state.teamMembers.filter(member => member.id !== action.payload),
      };
    
    // Approval management
    case 'SET_PENDING_APPROVALS':
      return { ...state, pendingApprovals: action.payload };
    
    case 'ADD_PENDING_APPROVAL':
      return {
        ...state,
        pendingApprovals: [...state.pendingApprovals, action.payload],
      };
    
    case 'UPDATE_APPROVAL_STATUS':
      return {
        ...state,
        pendingApprovals: state.pendingApprovals.map(approval =>
          approval.id === action.payload.id
            ? { ...approval, status: action.payload.status as any }
            : approval
        ),
      };
    
    case 'REMOVE_APPROVAL':
      return {
        ...state,
        pendingApprovals: state.pendingApprovals.filter(approval => approval.id !== action.payload),
      };
    
    // Progress reporting
    case 'SET_DAILY_REPORTS':
      return { ...state, dailyReports: action.payload };
    
    case 'ADD_DAILY_REPORT':
      return {
        ...state,
        dailyReports: [...state.dailyReports, action.payload],
      };
    
    case 'UPDATE_DAILY_REPORT':
      return {
        ...state,
        dailyReports: state.dailyReports.map(report =>
          report.id === action.payload.id ? action.payload : report
        ),
      };
    
    case 'REMOVE_DAILY_REPORT':
      return {
        ...state,
        dailyReports: state.dailyReports.filter(report => report.id !== action.payload),
      };
    
    // Material and tool management
    case 'SET_MATERIAL_REQUESTS':
      return { ...state, materialRequests: action.payload };
    
    case 'ADD_MATERIAL_REQUEST':
      return {
        ...state,
        materialRequests: [...state.materialRequests, action.payload],
      };
    
    case 'UPDATE_MATERIAL_REQUEST':
      return {
        ...state,
        materialRequests: state.materialRequests.map(request =>
          request.id === action.payload.id ? action.payload : request
        ),
      };
    
    case 'SET_TOOL_ALLOCATIONS':
      return { ...state, toolAllocations: action.payload };
    
    case 'ADD_TOOL_ALLOCATION':
      return {
        ...state,
        toolAllocations: [...state.toolAllocations, action.payload],
      };
    
    case 'UPDATE_TOOL_ALLOCATION':
      return {
        ...state,
        toolAllocations: state.toolAllocations.map(allocation =>
          allocation.id === action.payload.id ? action.payload : allocation
        ),
      };
    
    case 'REMOVE_TOOL_ALLOCATION':
      return {
        ...state,
        toolAllocations: state.toolAllocations.filter(allocation => allocation.id !== action.payload),
      };
    
    // Reset actions
    case 'RESET_SUPERVISOR_STATE':
      return initialState;
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
};

// Context Interface
interface SupervisorContextValue {
  state: SupervisorState;
  
  // Team data and worker assignment state management
  loadTeamData: () => Promise<void>;
  refreshTeamMembers: () => Promise<void>;
  updateTeamMemberStatus: (memberId: number, status: TeamMember['attendanceStatus']) => Promise<void>;
  assignTaskToWorker: (request: TaskAssignment) => Promise<void>;
  reassignTask: (taskId: number, fromWorkerId: number, toWorkerId: number) => Promise<void>;
  
  // Pending approvals and request queue state handling
  loadPendingApprovals: () => Promise<void>;
  approveRequest: (approvalId: number, notes?: string) => Promise<void>;
  rejectRequest: (approvalId: number, notes: string) => Promise<void>;
  escalateRequest: (approvalId: number, reason: string) => Promise<void>;
  
  // Progress tracking and reporting state management
  loadDailyReports: () => Promise<void>;
  createProgressReport: (report: Omit<SupervisorReport, 'id'>) => Promise<void>;
  updateProgressReport: (reportId: string, updates: Partial<SupervisorReport>) => Promise<void>;
  submitProgressReport: (reportId: string, finalNotes?: string) => Promise<void>;
  
  // Material and tool allocation state handling
  loadMaterialsAndTools: () => Promise<void>;
  createMaterialRequest: (request: Omit<MaterialRequest, 'id' | 'status'>) => Promise<void>;
  updateMaterialRequest: (requestId: number, updates: Partial<MaterialRequest>) => Promise<void>;
  allocateTool: (allocation: Omit<ToolAllocation, 'id'>) => Promise<void>;
  returnTool: (allocationId: number, condition: ToolAllocation['condition'], notes?: string) => Promise<void>;
  
  // NEW: Materials & Tools - Missing Features
  acknowledgeDelivery: (requestId: number, data: {
    deliveredQuantity?: number;
    deliveryCondition?: 'good' | 'partial' | 'damaged' | 'wrong';
    receivedBy?: string;
    deliveryNotes?: string;
    deliveryPhotos?: string[];
  }) => Promise<void>;
  returnMaterials: (data: {
    requestId: number;
    returnQuantity: number;
    returnReason: 'excess' | 'defect' | 'scope_change' | 'completion';
    returnCondition?: 'unused' | 'damaged';
    returnNotes?: string;
    returnPhotos?: string[];
  }) => Promise<void>;
  getToolUsageLog: (projectId?: number) => Promise<any[]>;
  logToolUsage: (data: {
    toolId: number;
    action: 'check_out' | 'check_in';
    employeeId: number;
    quantity?: number;
    condition?: 'good' | 'fair' | 'needs_maintenance' | 'damaged';
    location?: string;
    notes?: string;
  }) => Promise<void>;
  
  // Utility functions
  refreshAllData: () => Promise<void>;
  clearError: () => void;
  resetSupervisorState: () => void;
  
  // Data getters with computed values
  getTeamSummary: () => {
    totalMembers: number;
    presentMembers: number;
    absentMembers: number;
    lateMembers: number;
    onBreakMembers: number;
  };
  
  getApprovalsSummary: () => {
    totalPending: number;
    urgentCount: number;
    leaveRequests: number;
    materialRequests: number;
    toolRequests: number;
    reimbursementRequests: number;
  };
  
  getProjectProgress: (projectId: number) => {
    overallProgress: number;
    completedTasks: number;
    totalTasks: number;
    activeWorkers: number;
  } | null;
}

// Create Context
const SupervisorContext = createContext<SupervisorContextValue | undefined>(undefined);

// Provider Props
interface SupervisorProviderProps {
  children: ReactNode;
}

// Provider Component
export const SupervisorProvider: React.FC<SupervisorProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(supervisorReducer, initialState);
  const { state: authState } = useAuth();

  // Initialize supervisor data on mount
  useEffect(() => {
    // Only initialize if user is authenticated and has supervisor role
    if (authState.isAuthenticated && authState.user?.role === 'supervisor' && authState.token) {
      initializeSupervisorData();
    }
  }, [authState.isAuthenticated, authState.user?.role, authState.token]);

  const initializeSupervisorData = async () => {
    // Double-check authentication before making API calls
    if (!authState.isAuthenticated || !authState.token || authState.user?.role !== 'supervisor') {
      console.log('⚠️ Skipping supervisor data initialization - not authenticated or not a supervisor');
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      // Load all supervisor data in parallel
      await Promise.all([
        loadTeamData(),
        loadPendingApprovals(),
        loadDailyReports(),
        loadMaterialsAndTools(),
      ]);
      
      dispatch({ type: 'SET_LAST_UPDATED', payload: new Date() });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize supervisor data';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Team data and worker assignment state management
  const loadTeamData = useCallback(async () => {
    // Check authentication before making API calls
    if (!authState.isAuthenticated || !authState.token || authState.user?.role !== 'supervisor') {
      console.log('⚠️ Skipping team data load - not authenticated or not a supervisor');
      return;
    }

    try {
      dispatch({ type: 'SET_TEAM_LOADING', payload: true });
      
      // Import the API service
      const { supervisorApiService } = await import('../../services/api/SupervisorApiService');
      
      // Get assigned projects
      const projectsResponse = await supervisorApiService.getSupervisorProjects();
      let projects: Project[] = [];
      
      if (projectsResponse.success && projectsResponse.data) {
        projects = projectsResponse.data.map((proj: any) => ({
          id: proj.id,
          name: proj.projectName || proj.name,
          description: proj.description || 'Construction project',
          location: {
            address: proj.location || 'Unknown location',
            coordinates: { 
              latitude: proj.latitude || 0, 
              longitude: proj.longitude || 0, 
              accuracy: 10, 
              timestamp: new Date() 
            },
            landmarks: [],
            accessInstructions: 'Enter through main gate'
          },
          geofence: {
            center: { 
              latitude: proj.latitude || 0, 
              longitude: proj.longitude || 0, 
              accuracy: 10, 
              timestamp: new Date() 
            },
            radius: proj.geofenceRadius || 100,
            allowedAccuracy: 20
          },
          startDate: new Date(proj.startDate || '2024-01-01'),
          endDate: new Date(proj.endDate || '2024-12-31'),
          status: 'active',
          supervisor: {
            id: proj.supervisorId || 1,
            name: proj.supervisorName || 'Supervisor',
            phone: proj.supervisorPhone || '',
            email: proj.supervisorEmail || ''
          }
        }));
      }

      // Get attendance monitoring data for team members
      const attendanceResponse = await supervisorApiService.getAttendanceMonitoring({
        date: new Date().toISOString().split('T')[0]
      });
      
      let teamMembers: TeamMember[] = [];
      
      if (attendanceResponse.success && attendanceResponse.data?.workers) {
        teamMembers = attendanceResponse.data.workers.map((worker: any) => ({
          id: worker.employeeId,
          name: worker.workerName,
          role: worker.role || 'Worker',
          attendanceStatus: worker.status === 'CHECKED_IN' ? 'present' : 
                           worker.status === 'ABSENT' ? 'absent' : 
                           worker.isLate ? 'late' : 'present',
          currentTask: worker.taskAssigned && worker.taskAssigned !== 'No task assigned' ? {
            id: worker.employeeId,
            name: worker.taskAssigned,
            progress: Math.floor(Math.random() * 100)
          } : null,
          location: {
            latitude: worker.lastKnownLocation?.latitude || 0,
            longitude: worker.lastKnownLocation?.longitude || 0,
            insideGeofence: worker.insideGeofence || false,
            lastUpdated: worker.lastLocationUpdate || new Date().toISOString()
          },
          certifications: []
        }));
      }

      dispatch({ type: 'SET_ASSIGNED_PROJECTS', payload: projects });
      dispatch({ type: 'SET_TEAM_MEMBERS', payload: teamMembers });
      
    } catch (error) {
      console.error('Error loading team data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load team data';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_TEAM_LOADING', payload: false });
    }
  }, [authState.isAuthenticated, authState.token, authState.user?.role]);

  const refreshTeamMembers = useCallback(async () => {
    await loadTeamData();
  }, [loadTeamData]);

  const updateTeamMemberStatus = useCallback(async (memberId: number, status: TeamMember['attendanceStatus']) => {
    try {
      // TODO: Replace with actual API call
      const updatedMember = state.teamMembers.find(member => member.id === memberId);
      if (updatedMember) {
        const updated = { ...updatedMember, attendanceStatus: status };
        dispatch({ type: 'UPDATE_TEAM_MEMBER', payload: updated });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update team member status';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.teamMembers]);

  const assignTaskToWorker = useCallback(async (request: TaskAssignment) => {
    try {
      // TODO: Replace with actual API call
      console.log('Assigning task to worker:', request);
      // Mock implementation - in real app, this would call the API
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign task to worker';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

  const reassignTask = useCallback(async (taskId: number, fromWorkerId: number, toWorkerId: number) => {
    try {
      // TODO: Replace with actual API call
      console.log('Reassigning task:', { taskId, fromWorkerId, toWorkerId });
      // Mock implementation - in real app, this would call the API
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reassign task';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

  // Pending approvals and request queue state handling
  const loadPendingApprovals = useCallback(async () => {
    try {
      dispatch({ type: 'SET_APPROVALS_LOADING', payload: true });
      
      // TODO: Replace with actual API calls
      // Mock pending approvals
      const mockApprovals: PendingApproval[] = [
        {
          id: 1,
          requestType: 'leave',
          requesterId: 1,
          requesterName: 'Worker One',
          requestDate: new Date(),
          urgency: 'normal',
          details: {
            leaveType: 'sick',
            startDate: '2024-02-05',
            endDate: '2024-02-06',
            reason: 'Medical appointment'
          }
        }
      ];

      dispatch({ type: 'SET_PENDING_APPROVALS', payload: mockApprovals });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load pending approvals';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_APPROVALS_LOADING', payload: false });
    }
  }, []);

  const approveRequest = useCallback(async (approvalId: number, notes?: string) => {
    try {
      // TODO: Replace with actual API call
      dispatch({ type: 'UPDATE_APPROVAL_STATUS', payload: { id: approvalId, status: 'approved', notes } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve request';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

  const rejectRequest = useCallback(async (approvalId: number, notes: string) => {
    try {
      // TODO: Replace with actual API call
      dispatch({ type: 'UPDATE_APPROVAL_STATUS', payload: { id: approvalId, status: 'rejected', notes } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject request';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

  const escalateRequest = useCallback(async (approvalId: number, reason: string) => {
    try {
      // TODO: Replace with actual API call
      console.log('Escalating request:', { approvalId, reason });
      // Mock implementation - in real app, this would call the API
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to escalate request';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

  // Progress tracking and reporting state management
  const loadDailyReports = useCallback(async () => {
    try {
      dispatch({ type: 'SET_REPORTS_LOADING', payload: true });
      
      const projectId = state.assignedProjects[0]?.id || 1;
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const response = await dailyProgressApiService.getProgressReports({
        projectId,
        from: thirtyDaysAgo.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0]
      });

      if (response.success && response.data) {
        console.log('📊 Raw API response data count:', response.data.data?.length);
        
        // Get project name from response or use fallback
        const projectName = response.data.projectName || `Project ${projectId}`;
        
        const reports: SupervisorReport[] = response.data.data.map((item: any) => ({
          id: item.id?.toString() || `report-${Date.now()}`,
          reportId: item.id?.toString() || `report-${Date.now()}`,
          date: new Date(item.date).toISOString().split('T')[0],
          projectId: item.projectId,
          projectName: item.projectName || projectName,
          summary: item.remarks || 'No summary provided',
          status: item.approvalStatus === 'APPROVED' ? 'approved' : 
                  item.approvalStatus === 'REJECTED' ? 'rejected' :
                  item.approvalStatus === 'PENDING' ? 'submitted' : 'draft',
          manpowerUtilization: item.manpowerUsage || {
            totalWorkers: 0,
            activeWorkers: 0,
            productivity: 0,
            efficiency: 0
          },
          progressMetrics: {
            overallProgress: item.overallProgress || 0,
            milestonesCompleted: item.taskMetrics?.completedTasks || 0,
            tasksCompleted: item.taskMetrics?.totalTasks || 0,
            hoursWorked: item.manpowerUsage?.totalWorkers * 8 || 0
          },
          taskMetrics: item.taskMetrics ? {
            totalTasks: item.taskMetrics.totalTasks || 0,
            completedTasks: item.taskMetrics.completedTasks || 0,
            inProgressTasks: item.taskMetrics.inProgressTasks || 0,
            queuedTasks: item.taskMetrics.queuedTasks || 0,
            overdueTasks: item.taskMetrics.overdueTasks || 0,
            onScheduleTasks: item.taskMetrics.onScheduleTasks || 0,
            completionRate: item.taskMetrics.completionRate || 0,
            efficiency: item.taskMetrics.efficiency || 0,
            lastUpdated: item.taskMetrics.lastUpdated || new Date().toISOString()
          } : undefined,
          issues: item.issues ? (typeof item.issues === 'string' ? [{ 
            type: 'general' as const,
            description: item.issues,
            severity: 'medium' as const,
            status: 'open' as const
          }] : []) : [],
          materialConsumption: item.materialConsumption || [],
          photos: []
        }));
        
        console.log('✅ Mapped reports count:', reports.length);
        console.log('📋 Report IDs:', reports.map(r => r.reportId).join(', '));
        
        dispatch({ type: 'SET_DAILY_REPORTS', payload: reports });
      }
    } catch (error) {
      console.error('Failed to load daily reports:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load daily reports';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_REPORTS_LOADING', payload: false });
    }
  }, [state.assignedProjects]);

  const createProgressReport = useCallback(async (report: Omit<SupervisorReport, 'id'>) => {
    try {
      // TODO: Photo upload needs React Native specific implementation
      // Skip for now - File constructor doesn't exist in React Native
      console.log('📸 Skipping photo upload - needs React Native implementation');

      // Submit with manual progress
      if (report.progressMetrics?.overallProgress !== undefined) {
        await dailyProgressApiService.submitDailyProgress({
          projectId: report.projectId,
          remarks: report.date,
          issues: report.issues?.map((i: any) => `[${i.type}] [${i.severity}] ${i.description}`).join('\n') || ''
        });
      }

      // Submit manpower data if provided
      if (report.manpowerUtilization) {
        await dailyProgressApiService.trackManpowerUsage({
          projectId: report.projectId,
          date: report.date,
          totalWorkers: report.manpowerUtilization.totalWorkers || 0,
          activeWorkers: report.manpowerUtilization.activeWorkers || 0,
          productivity: report.manpowerUtilization.productivity || 0,
          efficiency: report.manpowerUtilization.efficiency || 0,
          overtimeHours: report.manpowerUtilization.overtimeHours || 0,
          absentWorkers: report.manpowerUtilization.absentWorkers || 0,
          lateWorkers: report.manpowerUtilization.lateWorkers || 0,
        });
      }

      // Submit issues if provided
      if (report.issues && report.issues.length > 0) {
        await dailyProgressApiService.logIssues({
          projectId: report.projectId,
          date: report.date,
          issues: report.issues.map((issue: any) => ({
            type: issue.type,
            description: issue.description,
            severity: issue.severity,
            status: issue.status || 'open',
            location: issue.location || '',
            actionTaken: issue.actionTaken || '',
          })),
        });
      }

      // Submit material consumption if provided
      if (report.materialConsumption && report.materialConsumption.length > 0) {
        await dailyProgressApiService.trackMaterialConsumption({
          projectId: report.projectId,
          date: report.date,
          materials: report.materialConsumption.map((material: any) => ({
            materialId: material.materialId,
            materialName: material.name,
            consumed: material.consumed || 0,
            remaining: material.remaining || 0,
            unit: material.unit,
            plannedConsumption: material.plannedConsumption || 0,
            wastage: material.wastage || 0,
            notes: material.notes || '',
          })),
        });
      }

      await loadDailyReports();
    } catch (error) {
      console.error('Failed to create progress report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create progress report';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [loadDailyReports]);

  const updateProgressReport = useCallback(async (reportId: string, updates: Partial<SupervisorReport>) => {
    try {
      const existingReport = state.dailyReports.find(report => report.id === reportId);
      if (!existingReport) {
        throw new Error('Report not found');
      }

      if (updates.manpowerUtilization) {
        await dailyProgressApiService.trackManpowerUsage({
          projectId: existingReport.projectId,
          dailyProgressId: parseInt(reportId),
          totalWorkers: updates.manpowerUtilization.totalWorkers,
          activeWorkers: updates.manpowerUtilization.activeWorkers,
          productivity: updates.manpowerUtilization.productivity,
          efficiency: updates.manpowerUtilization.efficiency
        });
      }

      if (updates.issues) {
        await dailyProgressApiService.logIssues({
          projectId: existingReport.projectId,
          dailyProgressId: parseInt(reportId),
          issues: updates.issues
        });
      }

      if (updates.materialConsumption) {
        const materials = updates.materialConsumption.map((m: any) => ({
          materialId: m.materialId,
          materialName: m.name,
          consumed: m.consumed,
          remaining: m.remaining,
          unit: m.unit
        }));
        await dailyProgressApiService.trackMaterialConsumption({
          projectId: existingReport.projectId,
          dailyProgressId: parseInt(reportId),
          materials
        });
      }

      await loadDailyReports();
    } catch (error) {
      console.error('Failed to update progress report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update progress report';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.dailyReports, loadDailyReports]);

  const submitProgressReport = useCallback(async (reportId: string, finalNotes?: string) => {
    try {
      const existingReport = state.dailyReports.find(report => report.id === reportId);
      if (!existingReport) {
        throw new Error('Report not found');
      }

      try {
        await dailyProgressApiService.submitDailyProgress({
          projectId: existingReport.projectId,
          remarks: finalNotes || '',
          issues: existingReport.issues.map((i: any) => `[${i.type}] [${i.severity}] ${i.description}`).join('\n')
        });
      } catch (submitError: any) {
        console.log('Basic submit skipped:', submitError.message);
      }

      await loadDailyReports();
    } catch (error) {
      console.error('Failed to submit progress report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit progress report';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.dailyReports, loadDailyReports]);

  // Material and tool allocation state handling
  const loadMaterialsAndTools = useCallback(async () => {
    try {
      dispatch({ type: 'SET_MATERIALS_LOADING', payload: true });
      
      // Get project ID from assigned projects
      const projectId = state.assignedProjects[0]?.id;
      
      if (projectId) {
        const response = await supervisorApiService.getMaterialsAndTools(projectId);
        
        if (response.success && response.data) {
          dispatch({ type: 'SET_MATERIAL_REQUESTS', payload: response.data.materialRequests || [] });
          dispatch({ type: 'SET_TOOL_ALLOCATIONS', payload: response.data.toolAllocations || [] });
        }
      } else {
        // No project assigned, set empty arrays
        dispatch({ type: 'SET_MATERIAL_REQUESTS', payload: [] });
        dispatch({ type: 'SET_TOOL_ALLOCATIONS', payload: [] });
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load materials and tools';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Error loading materials and tools:', error);
    } finally {
      dispatch({ type: 'SET_MATERIALS_LOADING', payload: false });
    }
  }, [state.assignedProjects]);

  const createMaterialRequest = useCallback(async (request: Omit<MaterialRequest, 'id' | 'status'>) => {
    try {
      dispatch({ type: 'SET_MATERIALS_LOADING', payload: true });
      
      const response = await supervisorApiService.requestMaterials({
        projectId: request.projectId,
        requestType: request.requestType,
        itemName: request.itemName,
        itemCategory: request.itemCategory,
        quantity: request.quantity,
        unit: request.unit,
        urgency: request.urgency,
        requiredDate: request.requiredDate,
        purpose: request.purpose,
        justification: request.justification,
        specifications: request.specifications,
        estimatedCost: request.estimatedCost,
      });
      
      if (response.success && response.data) {
        const newRequest: MaterialRequest = {
          ...request,
          id: response.data.requestId,
          status: 'pending'
        };
        dispatch({ type: 'ADD_MATERIAL_REQUEST', payload: newRequest });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create material request';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_MATERIALS_LOADING', payload: false });
    }
  }, []);

  const updateMaterialRequest = useCallback(async (requestId: number, updates: Partial<MaterialRequest>) => {
    try {
      // TODO: Replace with actual API call
      const existingRequest = state.materialRequests.find(request => request.id === requestId);
      if (existingRequest) {
        const updatedRequest = { ...existingRequest, ...updates };
        dispatch({ type: 'UPDATE_MATERIAL_REQUEST', payload: updatedRequest });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update material request';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.materialRequests]);

  const allocateTool = useCallback(async (allocation: Omit<ToolAllocation, 'id'>) => {
    try {
      dispatch({ type: 'SET_MATERIALS_LOADING', payload: true });
      
      const response = await supervisorApiService.allocateTool({
        toolId: allocation.toolId,
        toolName: allocation.toolName,
        allocatedTo: allocation.allocatedTo,
        allocatedToName: allocation.allocatedToName,
        allocationDate: allocation.allocationDate,
        expectedReturnDate: allocation.expectedReturnDate,
        condition: allocation.condition,
        location: allocation.location,
      });
      
      if (response.success && response.data) {
        const newAllocation: ToolAllocation = {
          ...allocation,
          id: response.data.allocationId
        };
        dispatch({ type: 'ADD_TOOL_ALLOCATION', payload: newAllocation });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to allocate tool';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_MATERIALS_LOADING', payload: false });
    }
  }, []);

  const returnTool = useCallback(async (allocationId: number, condition: ToolAllocation['condition'], notes?: string) => {
    try {
      dispatch({ type: 'SET_MATERIALS_LOADING', payload: true });
      
      const response = await supervisorApiService.returnTool(allocationId, condition, notes);
      
      if (response.success) {
        const existingAllocation = state.toolAllocations.find(allocation => allocation.id === allocationId);
        if (existingAllocation) {
          const updatedAllocation = { 
            ...existingAllocation, 
            condition,
            actualReturnDate: new Date()
          };
          dispatch({ type: 'UPDATE_TOOL_ALLOCATION', payload: updatedAllocation });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to return tool';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_MATERIALS_LOADING', payload: false });
    }
  }, [state.toolAllocations]);

  // NEW: Materials & Tools - Missing Features Implementation
  const acknowledgeDelivery = useCallback(async (requestId: number, data: {
    deliveredQuantity?: number;
    deliveryCondition?: 'good' | 'partial' | 'damaged' | 'wrong';
    receivedBy?: string;
    deliveryNotes?: string;
    deliveryPhotos?: string[];
  }) => {
    try {
      dispatch({ type: 'SET_MATERIALS_LOADING', payload: true });
      
      const response = await supervisorApiService.acknowledgeDelivery(requestId, data);
      
      if (response.success) {
        // Update the material request status to FULFILLED
        const existingRequest = state.materialRequests.find(req => req.id === requestId);
        if (existingRequest) {
          const updatedRequest = {
            ...existingRequest,
            status: 'fulfilled' as const,
            fulfilledAt: new Date()
          };
          dispatch({ type: 'UPDATE_MATERIAL_REQUEST', payload: updatedRequest });
        }
        
        // Reload materials and tools to get updated inventory
        await loadMaterialsAndTools();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to acknowledge delivery';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_MATERIALS_LOADING', payload: false });
    }
  }, [state.materialRequests]);

  const returnMaterials = useCallback(async (data: {
    requestId: number;
    returnQuantity: number;
    returnReason: 'excess' | 'defect' | 'scope_change' | 'completion';
    returnCondition?: 'unused' | 'damaged';
    returnNotes?: string;
    returnPhotos?: string[];
  }) => {
    try {
      dispatch({ type: 'SET_MATERIALS_LOADING', payload: true });
      
      const response = await supervisorApiService.returnMaterials(data);
      
      if (response.success) {
        // Reload materials and tools to get updated inventory
        await loadMaterialsAndTools();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to return materials';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_MATERIALS_LOADING', payload: false });
    }
  }, []);

  const getToolUsageLog = useCallback(async (projectId?: number) => {
    try {
      const params = projectId ? { projectId } : undefined;
      const response = await supervisorApiService.getToolUsageLog(params);
      
      if (response.success && response.data) {
        return response.data.tools || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching tool usage log:', error);
      return [];
    }
  }, []);

  const logToolUsage = useCallback(async (data: {
    toolId: number;
    action: 'check_out' | 'check_in';
    employeeId: number;
    quantity?: number;
    condition?: 'good' | 'fair' | 'needs_maintenance' | 'damaged';
    location?: string;
    notes?: string;
  }) => {
    try {
      dispatch({ type: 'SET_MATERIALS_LOADING', payload: true });
      
      const response = await supervisorApiService.logToolUsage(data);
      
      if (response.success) {
        // Reload materials and tools to get updated tool status
        await loadMaterialsAndTools();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to log tool usage';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_MATERIALS_LOADING', payload: false });
    }
  }, []);

  // Utility functions
  const refreshAllData = useCallback(async () => {
    await initializeSupervisorData();
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const resetSupervisorState = useCallback(() => {
    dispatch({ type: 'RESET_SUPERVISOR_STATE' });
  }, []);

  // Data getters with computed values
  const getTeamSummary = useCallback(() => {
    const totalMembers = state.teamMembers.length;
    const presentMembers = state.teamMembers.filter(member => member.attendanceStatus === 'present').length;
    const absentMembers = state.teamMembers.filter(member => member.attendanceStatus === 'absent').length;
    const lateMembers = state.teamMembers.filter(member => member.attendanceStatus === 'late').length;
    const onBreakMembers = state.teamMembers.filter(member => member.attendanceStatus === 'on_break').length;

    return {
      totalMembers,
      presentMembers,
      absentMembers,
      lateMembers,
      onBreakMembers
    };
  }, [state.teamMembers]);

  const getApprovalsSummary = useCallback(() => {
    const totalPending = state.pendingApprovals.length;
    const urgentCount = state.pendingApprovals.filter(approval => approval.urgency === 'urgent').length;
    const leaveRequests = state.pendingApprovals.filter(approval => approval.requestType === 'leave').length;
    const materialRequests = state.pendingApprovals.filter(approval => approval.requestType === 'material').length;
    const toolRequests = state.pendingApprovals.filter(approval => approval.requestType === 'tool').length;
    const reimbursementRequests = state.pendingApprovals.filter(approval => approval.requestType === 'reimbursement').length;

    return {
      totalPending,
      urgentCount,
      leaveRequests,
      materialRequests,
      toolRequests,
      reimbursementRequests
    };
  }, [state.pendingApprovals]);

  const getProjectProgress = useCallback((projectId: number) => {
    const project = state.assignedProjects.find(p => p.id === projectId);
    if (!project) return null;

    // Mock calculation - in real app, this would be based on actual task data
    const activeWorkers = state.teamMembers.filter(member => 
      member.attendanceStatus === 'present' && member.currentTask
    ).length;

    return {
      overallProgress: 75, // Mock value
      completedTasks: 15,  // Mock value
      totalTasks: 20,      // Mock value
      activeWorkers
    };
  }, [state.assignedProjects, state.teamMembers]);

  // Context value
  const contextValue: SupervisorContextValue = {
    state,
    // Team data and worker assignment state management
    loadTeamData,
    refreshTeamMembers,
    updateTeamMemberStatus,
    assignTaskToWorker,
    reassignTask,
    // Pending approvals and request queue state handling
    loadPendingApprovals,
    approveRequest,
    rejectRequest,
    escalateRequest,
    // Progress tracking and reporting state management
    loadDailyReports,
    createProgressReport,
    updateProgressReport,
    submitProgressReport,
    // Material and tool allocation state handling
    loadMaterialsAndTools,
    createMaterialRequest,
    updateMaterialRequest,
    allocateTool,
    returnTool,
    acknowledgeDelivery,
    returnMaterials,
    getToolUsageLog,
    logToolUsage,
    // Utility functions
    refreshAllData,
    clearError,
    resetSupervisorState,
    // Data getters with computed values
    getTeamSummary,
    getApprovalsSummary,
    getProjectProgress
  };

  return (
    <SupervisorContext.Provider value={contextValue}>
      {children}
    </SupervisorContext.Provider>
  );
};

// Hook to use supervisor context
export const useSupervisorContext = (): SupervisorContextValue => {
  const context = useContext(SupervisorContext);
  if (context === undefined) {
    throw new Error('useSupervisorContext must be used within a SupervisorProvider');
  }
  return context;
};

// Export context for testing
export { SupervisorContext };