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
  TaskAssignmentRequest,
  ProgressReport,
} from '../../types';

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
          report.reportId === action.payload.reportId ? action.payload : report
        ),
      };
    
    case 'REMOVE_DAILY_REPORT':
      return {
        ...state,
        dailyReports: state.dailyReports.filter(report => report.reportId !== action.payload),
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
  assignTaskToWorker: (request: TaskAssignmentRequest) => Promise<void>;
  reassignTask: (taskId: number, fromWorkerId: number, toWorkerId: number) => Promise<void>;
  
  // Pending approvals and request queue state handling
  loadPendingApprovals: () => Promise<void>;
  approveRequest: (approvalId: number, notes?: string) => Promise<void>;
  rejectRequest: (approvalId: number, notes: string) => Promise<void>;
  escalateRequest: (approvalId: number, reason: string) => Promise<void>;
  
  // Progress tracking and reporting state management
  loadDailyReports: () => Promise<void>;
  createProgressReport: (report: Omit<ProgressReport, 'reportId'>) => Promise<void>;
  updateProgressReport: (reportId: string, updates: Partial<ProgressReport>) => Promise<void>;
  submitProgressReport: (reportId: string, finalNotes?: string) => Promise<void>;
  
  // Material and tool allocation state handling
  loadMaterialsAndTools: () => Promise<void>;
  createMaterialRequest: (request: Omit<MaterialRequest, 'id' | 'status'>) => Promise<void>;
  updateMaterialRequest: (requestId: number, updates: Partial<MaterialRequest>) => Promise<void>;
  allocateTool: (allocation: Omit<ToolAllocation, 'id'>) => Promise<void>;
  returnTool: (allocationId: number, condition: ToolAllocation['condition'], notes?: string) => Promise<void>;
  
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

  // Initialize supervisor data on mount
  useEffect(() => {
    // Only initialize if we have supervisor role
    // This will be called when the supervisor context is mounted
    initializeSupervisorData();
  }, []);

  const initializeSupervisorData = async () => {
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
    try {
      dispatch({ type: 'SET_TEAM_LOADING', payload: true });
      
      // TODO: Replace with actual API calls when SupervisorApiService is implemented
      // For now, using mock data to complete the context structure
      
      // Mock assigned projects
      const mockProjects: Project[] = [
        {
          id: 1,
          name: 'Construction Site Alpha',
          description: 'Main construction project',
          location: {
            address: '123 Construction Ave',
            coordinates: { latitude: 1.3521, longitude: 103.8198, accuracy: 10, timestamp: new Date() },
            landmarks: ['Near MRT Station'],
            accessInstructions: 'Enter through main gate'
          },
          geofence: {
            center: { latitude: 1.3521, longitude: 103.8198, accuracy: 10, timestamp: new Date() },
            radius: 100,
            allowedAccuracy: 20
          },
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          status: 'active',
          supervisor: {
            id: 1,
            name: 'John Supervisor',
            phone: '+65 9123 4567',
            email: 'supervisor@company.com'
          }
        }
      ];

      // Mock team members
      const mockTeamMembers: TeamMember[] = [
        {
          id: 1,
          name: 'Worker One',
          role: 'Construction Worker',
          attendanceStatus: 'present',
          currentTask: {
            id: 1,
            name: 'Foundation Work',
            progress: 75
          },
          location: {
            latitude: 1.3521,
            longitude: 103.8198,
            insideGeofence: true,
            lastUpdated: new Date().toISOString()
          },
          certifications: [
            {
              name: 'Safety Certification',
              status: 'active',
              expiryDate: '2024-12-31'
            }
          ]
        }
      ];

      dispatch({ type: 'SET_ASSIGNED_PROJECTS', payload: mockProjects });
      dispatch({ type: 'SET_TEAM_MEMBERS', payload: mockTeamMembers });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load team data';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_TEAM_LOADING', payload: false });
    }
  }, []);

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

  const assignTaskToWorker = useCallback(async (request: TaskAssignmentRequest) => {
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
      
      // TODO: Replace with actual API calls
      // Mock daily reports
      const mockReports: SupervisorReport[] = [
        {
          reportId: 'report-1',
          date: new Date().toISOString().split('T')[0],
          projectId: 1,
          projectName: 'Construction Site Alpha',
          supervisorId: 1,
          summary: 'Good progress on foundation work',
          manpowerUtilization: {
            totalWorkers: 10,
            activeWorkers: 8,
            productivity: 85,
            efficiency: 90
          },
          progressMetrics: {
            overallProgress: 75,
            milestonesCompleted: 3,
            tasksCompleted: 15,
            hoursWorked: 80
          },
          issues: [],
          status: 'draft',
          createdAt: new Date().toISOString()
        }
      ];

      dispatch({ type: 'SET_DAILY_REPORTS', payload: mockReports });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load daily reports';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_REPORTS_LOADING', payload: false });
    }
  }, []);

  const createProgressReport = useCallback(async (report: Omit<ProgressReport, 'reportId'>) => {
    try {
      // TODO: Replace with actual API call
      const newReport: SupervisorReport = {
        reportId: `report-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        projectId: report.projectId,
        projectName: 'Project Name', // This would come from the API
        supervisorId: 1, // This would come from auth context
        summary: 'Progress report summary',
        manpowerUtilization: report.manpowerUtilization,
        progressMetrics: report.progressMetrics,
        issues: report.issues,
        status: 'draft',
        createdAt: new Date().toISOString()
      };

      dispatch({ type: 'ADD_DAILY_REPORT', payload: newReport });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create progress report';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

  const updateProgressReport = useCallback(async (reportId: string, updates: Partial<ProgressReport>) => {
    try {
      // TODO: Replace with actual API call
      const existingReport = state.dailyReports.find(report => report.reportId === reportId);
      if (existingReport) {
        const updatedReport = { ...existingReport, ...updates };
        dispatch({ type: 'UPDATE_DAILY_REPORT', payload: updatedReport });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update progress report';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.dailyReports]);

  const submitProgressReport = useCallback(async (reportId: string, finalNotes?: string) => {
    try {
      // TODO: Replace with actual API call
      const existingReport = state.dailyReports.find(report => report.reportId === reportId);
      if (existingReport) {
        const updatedReport = { 
          ...existingReport, 
          status: 'submitted' as const,
          submittedAt: new Date().toISOString()
        };
        dispatch({ type: 'UPDATE_DAILY_REPORT', payload: updatedReport });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit progress report';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.dailyReports]);

  // Material and tool allocation state handling
  const loadMaterialsAndTools = useCallback(async () => {
    try {
      dispatch({ type: 'SET_MATERIALS_LOADING', payload: true });
      
      // TODO: Replace with actual API calls
      // Mock material requests
      const mockMaterialRequests: MaterialRequest[] = [
        {
          id: 1,
          projectId: 1,
          requesterId: 1,
          itemName: 'Concrete Mix',
          category: 'Construction Materials',
          quantity: 50,
          unit: 'bags',
          urgency: 'normal',
          requiredDate: new Date('2024-02-10'),
          purpose: 'Foundation work',
          justification: 'Required for next phase of construction',
          estimatedCost: 2500,
          status: 'pending'
        }
      ];

      // Mock tool allocations
      const mockToolAllocations: ToolAllocation[] = [
        {
          id: 1,
          toolId: 1,
          toolName: 'Concrete Mixer',
          allocatedTo: 1,
          allocatedToName: 'Worker One',
          allocationDate: new Date(),
          expectedReturnDate: new Date('2024-02-10'),
          condition: 'good',
          location: 'Site A - Zone 1'
        }
      ];

      dispatch({ type: 'SET_MATERIAL_REQUESTS', payload: mockMaterialRequests });
      dispatch({ type: 'SET_TOOL_ALLOCATIONS', payload: mockToolAllocations });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load materials and tools';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_MATERIALS_LOADING', payload: false });
    }
  }, []);

  const createMaterialRequest = useCallback(async (request: Omit<MaterialRequest, 'id' | 'status'>) => {
    try {
      // TODO: Replace with actual API call
      const newRequest: MaterialRequest = {
        ...request,
        id: Date.now(), // Mock ID generation
        status: 'pending'
      };
      dispatch({ type: 'ADD_MATERIAL_REQUEST', payload: newRequest });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create material request';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
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
      // TODO: Replace with actual API call
      const newAllocation: ToolAllocation = {
        ...allocation,
        id: Date.now() // Mock ID generation
      };
      dispatch({ type: 'ADD_TOOL_ALLOCATION', payload: newAllocation });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to allocate tool';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

  const returnTool = useCallback(async (allocationId: number, condition: ToolAllocation['condition'], notes?: string) => {
    try {
      // TODO: Replace with actual API call
      const existingAllocation = state.toolAllocations.find(allocation => allocation.id === allocationId);
      if (existingAllocation) {
        const updatedAllocation = { 
          ...existingAllocation, 
          condition,
          actualReturnDate: new Date()
        };
        dispatch({ type: 'UPDATE_TOOL_ALLOCATION', payload: updatedAllocation });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to return tool';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.toolAllocations]);

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