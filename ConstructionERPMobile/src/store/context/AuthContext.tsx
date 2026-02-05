import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User, Company, UserRole, SupervisorContextData, DriverContextData } from '../../types';
import { authService, LoginCredentials } from '../../services/api/AuthService';
import { STORAGE_KEYS } from '../../utils/constants';

// Initial state
const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  company: null,
  token: null,
  refreshToken: null,
  tokenExpiry: null,
  permissions: [],
  isLoading: false,
  error: null,
  requiresCompanySelection: false,
  availableCompanies: [],
  supervisorContext: undefined,
  driverContext: undefined,
};

// Action types
export type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; company: Company; token: string; refreshToken: string; tokenExpiry: Date; permissions: string[] } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'COMPANY_SELECTION_REQUIRED'; payload: { companies: Company[]; userId: number } }
  | { type: 'LOGOUT' }
  | { type: 'TOKEN_REFRESH'; payload: { token: string; tokenExpiry: Date } }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'RESTORE_AUTH'; payload: { user: User; company: Company; token: string; refreshToken: string; tokenExpiry: Date; permissions: string[] } }
  | { type: 'SET_SUPERVISOR_CONTEXT'; payload: SupervisorContextData }
  | { type: 'UPDATE_SUPERVISOR_CONTEXT'; payload: Partial<SupervisorContextData> }
  | { type: 'CLEAR_SUPERVISOR_CONTEXT' }
  | { type: 'SET_DRIVER_CONTEXT'; payload: DriverContextData }
  | { type: 'UPDATE_DRIVER_CONTEXT'; payload: Partial<DriverContextData> }
  | { type: 'CLEAR_DRIVER_CONTEXT' }
  | { type: 'SET_ROLE_PERMISSIONS'; payload: { role: UserRole; permissions: string[] } };

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null, requiresCompanySelection: false, availableCompanies: [] };
    case 'LOGIN_SUCCESS':
      return { 
        ...state, 
        isAuthenticated: true, 
        ...action.payload, 
        isLoading: false, 
        error: null, 
        requiresCompanySelection: false, 
        availableCompanies: [],
        // Clear role-specific contexts on new login
        supervisorContext: undefined,
        driverContext: undefined,
      };
    case 'LOGIN_FAILURE':
      return { 
        ...state, 
        isAuthenticated: false, 
        user: null, 
        company: null, 
        token: null, 
        refreshToken: null, 
        tokenExpiry: null, 
        permissions: [], 
        isLoading: false, 
        error: action.payload, 
        requiresCompanySelection: false, 
        availableCompanies: [],
        supervisorContext: undefined,
        driverContext: undefined,
      };
    case 'COMPANY_SELECTION_REQUIRED':
      return { ...state, isLoading: false, error: null, requiresCompanySelection: true, availableCompanies: action.payload.companies };
    case 'LOGOUT':
      return { ...initialAuthState, isLoading: false };
    case 'TOKEN_REFRESH':
      return { ...state, token: action.payload.token, tokenExpiry: action.payload.tokenExpiry };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    case 'RESTORE_AUTH':
      return { ...state, isAuthenticated: true, ...action.payload, isLoading: false, error: null, requiresCompanySelection: false, availableCompanies: [] };
    case 'SET_SUPERVISOR_CONTEXT':
      return { ...state, supervisorContext: action.payload };
    case 'UPDATE_SUPERVISOR_CONTEXT':
      return { 
        ...state, 
        supervisorContext: state.supervisorContext 
          ? { ...state.supervisorContext, ...action.payload }
          : action.payload as SupervisorContextData
      };
    case 'CLEAR_SUPERVISOR_CONTEXT':
      return { ...state, supervisorContext: undefined };
    case 'SET_DRIVER_CONTEXT':
      return { ...state, driverContext: action.payload };
    case 'UPDATE_DRIVER_CONTEXT':
      return { 
        ...state, 
        driverContext: state.driverContext 
          ? { ...state.driverContext, ...action.payload }
          : action.payload as DriverContextData
      };
    case 'CLEAR_DRIVER_CONTEXT':
      return { ...state, driverContext: undefined };
    case 'SET_ROLE_PERMISSIONS':
      return { 
        ...state, 
        permissions: action.payload.permissions
      };
    default:
      return state;
  }
};

// Context type
interface AuthContextType {
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
  login: (credentials: LoginCredentials) => Promise<void>;
  selectCompany: (companyId: number) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: (token: string, tokenExpiry: Date) => void;
  updateUser: (user: User) => void;
  restoreAuthState: () => Promise<void>;
  
  // Role-based permission methods
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  canAccessFeature: (feature: string) => boolean;
  
  // Role-specific context management
  setSupervisorContext: (context: SupervisorContextData) => void;
  updateSupervisorContext: (updates: Partial<SupervisorContextData>) => void;
  clearSupervisorContext: () => void;
  setDriverContext: (context: DriverContextData) => void;
  updateDriverContext: (updates: Partial<DriverContextData>) => void;
  clearDriverContext: () => void;
  
  // Role-specific data persistence
  saveSupervisorData: () => Promise<void>;
  loadSupervisorData: () => Promise<void>;
  saveDriverData: () => Promise<void>;
  loadDriverData: () => Promise<void>;
  clearRoleSpecificData: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props
interface AuthProviderProps { children: ReactNode; }

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Restore auth on mount
  useEffect(() => { restoreAuthState(); }, []);

  // Load role-specific data when user role changes
  useEffect(() => {
    if (state.isAuthenticated && state.user?.role) {
      loadRoleSpecificData(state.user.role);
    }
  }, [state.isAuthenticated, state.user?.role]);

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await authService.login(credentials);
      
      if (response.success && response.user && response.company && response.token) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.user,
            company: response.company,
            token: response.token,
            refreshToken: response.refreshToken || response.token,
            tokenExpiry: new Date(Date.now() + (response.expiresIn || 3600) * 1000),
            permissions: response.permissions || [],
          },
        });
      } else if (response.companies && response.companies.length > 1) {
        // Multi-company user needs to select company
        dispatch({
          type: 'COMPANY_SELECTION_REQUIRED',
          payload: {
            companies: response.companies,
            userId: response.userId || 0,
          },
        });
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const selectCompany = async (companyId: number) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      // Get userId from available companies context (you might need to store this)
      const userId = 1; // This should come from the previous login response
      
      const response = await authService.selectCompany(userId, companyId);
      
      if (response.success && response.user && response.company && response.token) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.user,
            company: response.company,
            token: response.token,
            refreshToken: response.refreshToken || response.token,
            tokenExpiry: new Date(Date.now() + (response.expiresIn || 3600) * 1000),
            permissions: response.permissions || [],
          },
        });
      } else {
        throw new Error('Company selection failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Company selection failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      await clearRoleSpecificData();
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const restoreAuthState = async () => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (isAuthenticated) {
        const [user, company, tokens, permissions] = await Promise.all([
          authService.getStoredUser(),
          authService.getStoredCompany(),
          authService.getStoredTokens(),
          authService.getStoredPermissions(),
        ]);
        
        if (user && company && tokens.token && tokens.tokenExpiry) {
          dispatch({
            type: 'RESTORE_AUTH',
            payload: {
              user,
              company,
              token: tokens.token,
              refreshToken: tokens.refreshToken || tokens.token,
              tokenExpiry: tokens.tokenExpiry,
              permissions,
            },
          });
          
          // Load role-specific data after restoring auth
          await loadRoleSpecificData(user.role || company.role);
        }
      }
    } catch (error) {
      console.warn('Failed to restore auth state:', error);
      dispatch({ type: 'LOGOUT' });
    }
  };

  const refreshToken = (token: string, tokenExpiry: Date) => { 
    dispatch({ type: 'TOKEN_REFRESH', payload: { token, tokenExpiry } }); 
  };
  
  const updateUser = (user: User) => { 
    dispatch({ type: 'UPDATE_USER', payload: user }); 
  };

  // Role-based permission methods
  const hasPermission = (permission: string): boolean => {
    return state.permissions.includes(permission);
  };

  const hasRole = (role: UserRole): boolean => {
    return state.user?.role === role || state.company?.role === role;
  };

  const canAccessFeature = (feature: string): boolean => {
    const userRole = state.user?.role || state.company?.role;
    
    // Define role-based feature access
    const roleFeatures: Record<UserRole, string[]> = {
      Worker: [
        'attendance',
        'tasks',
        'daily_reports',
        'requests',
        'profile',
        'task_history',
        'help_support',
      ],
      Supervisor: [
        'attendance',
        'tasks',
        'daily_reports',
        'requests',
        'profile',
        'team_management',
        'attendance_monitoring',
        'task_assignment',
        'progress_reports',
        'approvals',
        'materials_tools',
      ],
      Driver: [
        'attendance',
        'profile',
        'transport_tasks',
        'trip_updates',
        'driver_attendance',
        'vehicle_info',
      ],
    };

    if (!userRole) return false;
    
    return roleFeatures[userRole]?.includes(feature) || false;
  };

  // Role-specific context management
  const setSupervisorContext = (context: SupervisorContextData) => {
    dispatch({ type: 'SET_SUPERVISOR_CONTEXT', payload: context });
  };

  const updateSupervisorContext = (updates: Partial<SupervisorContextData>) => {
    dispatch({ type: 'UPDATE_SUPERVISOR_CONTEXT', payload: updates });
  };

  const clearSupervisorContext = () => {
    dispatch({ type: 'CLEAR_SUPERVISOR_CONTEXT' });
  };

  const setDriverContext = (context: DriverContextData) => {
    dispatch({ type: 'SET_DRIVER_CONTEXT', payload: context });
  };

  const updateDriverContext = (updates: Partial<DriverContextData>) => {
    dispatch({ type: 'UPDATE_DRIVER_CONTEXT', payload: updates });
  };

  const clearDriverContext = () => {
    dispatch({ type: 'CLEAR_DRIVER_CONTEXT' });
  };

  // Role-specific data persistence
  const saveSupervisorData = async () => {
    if (!state.supervisorContext) return;
    
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.SUPERVISOR_TEAM_MEMBERS, JSON.stringify(state.supervisorContext.teamMembers)),
        AsyncStorage.setItem(STORAGE_KEYS.SUPERVISOR_PENDING_APPROVALS, JSON.stringify(state.supervisorContext.pendingApprovals)),
        AsyncStorage.setItem(STORAGE_KEYS.SUPERVISOR_DAILY_REPORTS, JSON.stringify(state.supervisorContext.dailyReports)),
        AsyncStorage.setItem(STORAGE_KEYS.SUPERVISOR_MATERIAL_REQUESTS, JSON.stringify(state.supervisorContext.materialRequests)),
        AsyncStorage.setItem(STORAGE_KEYS.SUPERVISOR_TOOL_ALLOCATIONS, JSON.stringify(state.supervisorContext.toolAllocations)),
        AsyncStorage.setItem(STORAGE_KEYS.SUPERVISOR_LAST_SYNC, new Date().toISOString()),
      ]);
    } catch (error) {
      console.warn('Failed to save supervisor data:', error);
    }
  };

  const loadSupervisorData = async () => {
    try {
      const [
        teamMembers,
        pendingApprovals,
        dailyReports,
        materialRequests,
        toolAllocations,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SUPERVISOR_TEAM_MEMBERS),
        AsyncStorage.getItem(STORAGE_KEYS.SUPERVISOR_PENDING_APPROVALS),
        AsyncStorage.getItem(STORAGE_KEYS.SUPERVISOR_DAILY_REPORTS),
        AsyncStorage.getItem(STORAGE_KEYS.SUPERVISOR_MATERIAL_REQUESTS),
        AsyncStorage.getItem(STORAGE_KEYS.SUPERVISOR_TOOL_ALLOCATIONS),
      ]);

      const supervisorContext: SupervisorContextData = {
        assignedProjects: [], // Will be loaded from API
        teamMembers: teamMembers ? JSON.parse(teamMembers) : [],
        pendingApprovals: pendingApprovals ? JSON.parse(pendingApprovals) : [],
        dailyReports: dailyReports ? JSON.parse(dailyReports) : [],
        materialRequests: materialRequests ? JSON.parse(materialRequests) : [],
        toolAllocations: toolAllocations ? JSON.parse(toolAllocations) : [],
      };

      dispatch({ type: 'SET_SUPERVISOR_CONTEXT', payload: supervisorContext });
    } catch (error) {
      console.warn('Failed to load supervisor data:', error);
    }
  };

  const saveDriverData = async () => {
    if (!state.driverContext) return;
    
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.DRIVER_TRANSPORT_TASKS, JSON.stringify(state.driverContext.todaysRoutes)),
        AsyncStorage.setItem(STORAGE_KEYS.DRIVER_VEHICLE_INFO, JSON.stringify(state.driverContext.assignedVehicle)),
        AsyncStorage.setItem(STORAGE_KEYS.DRIVER_TRIP_HISTORY, JSON.stringify(state.driverContext.tripHistory)),
        AsyncStorage.setItem(STORAGE_KEYS.DRIVER_PERFORMANCE, JSON.stringify(state.driverContext.performanceMetrics)),
        AsyncStorage.setItem(STORAGE_KEYS.DRIVER_MAINTENANCE_ALERTS, JSON.stringify(state.driverContext.maintenanceAlerts)),
        AsyncStorage.setItem(STORAGE_KEYS.DRIVER_LAST_SYNC, new Date().toISOString()),
      ]);
    } catch (error) {
      console.warn('Failed to save driver data:', error);
    }
  };

  const loadDriverData = async () => {
    try {
      const [
        transportTasks,
        vehicleInfo,
        tripHistory,
        performanceMetrics,
        maintenanceAlerts,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.DRIVER_TRANSPORT_TASKS),
        AsyncStorage.getItem(STORAGE_KEYS.DRIVER_VEHICLE_INFO),
        AsyncStorage.getItem(STORAGE_KEYS.DRIVER_TRIP_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.DRIVER_PERFORMANCE),
        AsyncStorage.getItem(STORAGE_KEYS.DRIVER_MAINTENANCE_ALERTS),
      ]);

      // Create a mock VehicleInfo if none exists
      const defaultVehicleInfo = {
        id: 0,
        plateNumber: '',
        model: '',
        year: 0,
        capacity: 0,
        currentMileage: 0,
        fuelLevel: 0,
        maintenanceSchedule: [],
        fuelLog: [],
      };

      // Create a mock DriverPerformance if none exists
      const defaultPerformanceMetrics = {
        onTimePerformance: 0,
        totalTripsCompleted: 0,
        totalDistance: 0,
        averageFuelEfficiency: 0,
        safetyScore: 0,
        customerRating: 0,
        incidentCount: 0,
      };

      const driverContext: DriverContextData = {
        assignedVehicle: vehicleInfo ? JSON.parse(vehicleInfo) : defaultVehicleInfo,
        todaysRoutes: transportTasks ? JSON.parse(transportTasks) : [],
        tripHistory: tripHistory ? JSON.parse(tripHistory) : [],
        performanceMetrics: performanceMetrics ? JSON.parse(performanceMetrics) : defaultPerformanceMetrics,
        maintenanceAlerts: maintenanceAlerts ? JSON.parse(maintenanceAlerts) : [],
      };

      dispatch({ type: 'SET_DRIVER_CONTEXT', payload: driverContext });
    } catch (error) {
      console.warn('Failed to load driver data:', error);
    }
  };

  const clearRoleSpecificData = async () => {
    try {
      // Clear supervisor data
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.SUPERVISOR_TEAM_MEMBERS),
        AsyncStorage.removeItem(STORAGE_KEYS.SUPERVISOR_PENDING_APPROVALS),
        AsyncStorage.removeItem(STORAGE_KEYS.SUPERVISOR_DAILY_REPORTS),
        AsyncStorage.removeItem(STORAGE_KEYS.SUPERVISOR_MATERIAL_REQUESTS),
        AsyncStorage.removeItem(STORAGE_KEYS.SUPERVISOR_TOOL_ALLOCATIONS),
        AsyncStorage.removeItem(STORAGE_KEYS.SUPERVISOR_LAST_SYNC),
      ]);

      // Clear driver data
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.DRIVER_TRANSPORT_TASKS),
        AsyncStorage.removeItem(STORAGE_KEYS.DRIVER_VEHICLE_INFO),
        AsyncStorage.removeItem(STORAGE_KEYS.DRIVER_TRIP_HISTORY),
        AsyncStorage.removeItem(STORAGE_KEYS.DRIVER_PERFORMANCE),
        AsyncStorage.removeItem(STORAGE_KEYS.DRIVER_MAINTENANCE_ALERTS),
        AsyncStorage.removeItem(STORAGE_KEYS.DRIVER_LAST_SYNC),
      ]);

      // Clear contexts
      dispatch({ type: 'CLEAR_SUPERVISOR_CONTEXT' });
      dispatch({ type: 'CLEAR_DRIVER_CONTEXT' });
    } catch (error) {
      console.warn('Failed to clear role-specific data:', error);
    }
  };

  // Helper function to load role-specific data
  const loadRoleSpecificData = async (role?: UserRole) => {
    if (!role) return;

    try {
      switch (role) {
        case 'Supervisor':
          await loadSupervisorData();
          break;
        case 'Driver':
          await loadDriverData();
          break;
        case 'Worker':
          // Worker data is handled by existing contexts
          break;
      }
    } catch (error) {
      console.warn(`Failed to load ${role} data:`, error);
    }
  };

  // Auto-save role-specific data when contexts change
  useEffect(() => {
    if (state.supervisorContext) {
      saveSupervisorData();
    }
  }, [state.supervisorContext]);

  useEffect(() => {
    if (state.driverContext) {
      saveDriverData();
    }
  }, [state.driverContext]);

  return (
    <AuthContext.Provider 
      value={{ 
        state, 
        dispatch, 
        login, 
        selectCompany, 
        logout, 
        refreshToken, 
        updateUser, 
        restoreAuthState,
        hasPermission,
        hasRole,
        canAccessFeature,
        setSupervisorContext,
        updateSupervisorContext,
        clearSupervisorContext,
        setDriverContext,
        updateDriverContext,
        clearDriverContext,
        saveSupervisorData,
        loadSupervisorData,
        saveDriverData,
        loadDriverData,
        clearRoleSpecificData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
