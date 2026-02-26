import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../store/context/AuthContext';
import { workerApiService } from '../services/api/WorkerApiService';
import { 
  Project, 
  TaskAssignment, 
  AttendanceRecord, 
  DashboardApiResponse 
} from '../types';

export interface DashboardData {
  project: Project | null;
  todaysTasks: TaskAssignment[];
  attendanceStatus: AttendanceRecord | null;
  workingHours: {
    currentSessionDuration: number;
    totalHours: number;
    overtimeApproved?: boolean;
    overtimeHours?: number;
    shiftType?: 'morning' | 'afternoon' | 'overtime';
  };
  // New fields from API documentation
  supervisor: {
    id: number;
    name: string;
    phone: string;
    email: string;
  } | null;
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
  } | null;
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
  } | null;
  dailySummary: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    queuedTasks: number;
    errorTasks: number;
    totalHoursWorked: number;
    remainingHours: number;
    overallProgress: number;
  } | null;
}

export interface UseDashboardReturn {
  data: DashboardData;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  lastRefresh: Date | null;
  isRefreshing: boolean;
}

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const CURRENT_SESSION_UPDATE_INTERVAL = 60 * 1000; // 1 minute for current session updates

// Helper function to transform API response to internal format
const transformDashboardData = (apiData: DashboardApiResponse): DashboardData => {
  // Transform project data
  const project: Project = {
    id: apiData.project.id,
    name: apiData.project.name,
    description: '', // Not provided in API response
    location: {
      address: apiData.project.location,
      coordinates: {
        latitude: apiData.project.geofence.latitude,
        longitude: apiData.project.geofence.longitude,
        accuracy: 0,
        timestamp: new Date(),
      },
      landmarks: [],
      accessInstructions: '',
    },
    geofence: {
      center: {
        latitude: apiData.project.geofence.latitude,
        longitude: apiData.project.geofence.longitude,
        accuracy: 0,
        timestamp: new Date(),
      },
      radius: apiData.project.geofence.radius,
      allowedAccuracy: 10,
    },
    startDate: new Date(),
    endDate: new Date(),
    status: 'active',
    supervisor: apiData.supervisor,
  };

  // Transform tasks data
  const todaysTasks: TaskAssignment[] = apiData.tasks.map(task => ({
    assignmentId: task.assignmentId,
    projectId: apiData.project.id,
    taskName: task.taskName,
    description: task.description,
    dependencies: task.dependencies,
    sequence: task.sequence,
    status: task.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
    location: {
      latitude: apiData.project.geofence.latitude,
      longitude: apiData.project.geofence.longitude,
      accuracy: 0,
      timestamp: new Date(),
    },
    estimatedHours: task.timeEstimate.estimated / 60, // Convert minutes to hours
    actualHours: task.timeEstimate.elapsed / 60,
    createdAt: task.startTime,
    updatedAt: task.progress.lastUpdated,
    startedAt: task.startTime,
    completedAt: task.status === 'completed' ? task.estimatedEndTime : undefined,
  }));

  return {
    project,
    todaysTasks,
    attendanceStatus: null, // Not provided in this API
    workingHours: {
      currentSessionDuration: 0, // Calculate from dailySummary if needed
      totalHours: apiData.dailySummary?.totalHoursWorked || 0,
    },
    supervisor: apiData.supervisor || null,
    worker: apiData.worker || null,
    toolsAndMaterials: apiData.toolsAndMaterials || { tools: [], materials: [] },
    dailySummary: apiData.dailySummary ? {
      totalTasks: apiData.dailySummary.totalTasks || 0,
      completedTasks: apiData.dailySummary.completedTasks || 0,
      inProgressTasks: apiData.dailySummary.inProgressTasks || 0,
      queuedTasks: apiData.dailySummary.queuedTasks || 0,
      errorTasks: apiData.dailySummary.errorTasks || 0,
      totalHoursWorked: apiData.dailySummary.totalHoursWorked || 0,
      remainingHours: apiData.dailySummary.remainingHours || 8,
      overallProgress: apiData.dailySummary.overallProgress || 0,
    } : {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      queuedTasks: 0,
      errorTasks: 0,
      totalHoursWorked: 0,
      remainingHours: 8,
      overallProgress: 0,
    },
  };
};

export const useDashboard = (): UseDashboardReturn => {
  const { state: authState } = useAuth();
  const [data, setData] = useState<DashboardData>({
    project: null,
    todaysTasks: [],
    attendanceStatus: null,
    workingHours: {
      currentSessionDuration: 0,
      totalHours: 0,
      overtimeApproved: false,
      overtimeHours: 0,
      shiftType: 'morning',
    },
    supervisor: null,
    worker: null,
    toolsAndMaterials: {
      tools: [],
      materials: [],
    },
    dailySummary: {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      queuedTasks: 0,
      errorTasks: 0,
      totalHoursWorked: 0,
      remainingHours: 8,
      overallProgress: 0,
    },
    workingHours: {
      currentSessionDuration: 0,
      totalHours: 0,
      overtimeApproved: false,
      overtimeHours: 0,
      shiftType: 'morning',
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentSessionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshData = useCallback(async (isManualRefresh = false) => {
    // Skip if user is not authenticated
    if (!authState.isAuthenticated || !authState.token) {
      console.log('ℹ️ useDashboard: Skipping data fetch - user not authenticated');
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Fetch both dashboard data and attendance status
      const [dashboardResponse, attendanceResponse] = await Promise.all([
        workerApiService.getDashboardData(),
        workerApiService.getCurrentAttendanceStatus().catch(err => {
          console.warn('Failed to fetch attendance status:', err);
          return null; // Don't fail the entire dashboard if attendance fails
        })
      ]);
      
      if (dashboardResponse.success) {
        const transformedData = transformDashboardData(dashboardResponse.data);
        
        // Add attendance data if available
        if (attendanceResponse?.success) {
          const attendanceData = attendanceResponse.data;
          
          // Transform attendance status to match AttendanceRecord interface
          const attendanceRecord: AttendanceRecord | null = attendanceData.session !== 'NOT_LOGGED_IN' ? {
            id: Date.now(), // Generate a temporary ID
            workerId: transformedData.worker?.id || 0,
            projectId: parseInt(attendanceData.projectId?.toString() || '0'),
            loginTime: attendanceData.checkInTime || '',
            logoutTime: attendanceData.checkOutTime || undefined,
            sessionType: attendanceData.isOnLunchBreak ? 'lunch' : 'regular',
            location: {
              latitude: 0,
              longitude: 0,
              accuracy: 0,
              timestamp: new Date()
            }
          } : null;

          // Use the duration data directly from the API response (in minutes)
          const currentSessionDuration = attendanceData.session === 'CHECKED_IN' || attendanceData.session === 'ON_LUNCH' 
            ? (attendanceData.workDuration || 0) 
            : 0;
          
          const totalHours = attendanceData.workDuration || 0; // Total work duration for today

          // Determine shift type and overtime status
          const now = new Date();
          const currentHour = now.getHours();
          let shiftType: 'morning' | 'afternoon' | 'overtime' = 'morning';
          let overtimeApproved = false;
          let overtimeHours = 0;

          if (currentHour >= 19) { // After 7 PM
            shiftType = 'overtime';
            overtimeApproved = true; // In real app, this would come from API
            overtimeHours = Math.max(0, totalHours - (8 * 60)); // Hours beyond 8 hours
          } else if (currentHour >= 13) { // After 1 PM
            shiftType = 'afternoon';
          }

          transformedData.attendanceStatus = attendanceRecord;
          transformedData.workingHours = {
            currentSessionDuration, // Duration in minutes
            totalHours, // Total duration in minutes
            overtimeApproved,
            overtimeHours,
            shiftType,
          };
        }

        // Fix progress calculation if backend returns incorrect value
        if (transformedData.dailySummary) {
          const { totalTasks, completedTasks } = transformedData.dailySummary;
          
          // Calculate correct progress percentage
          const correctProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          
          // Use calculated progress if backend progress is incorrect or 0 when it shouldn't be
          if (transformedData.dailySummary.overallProgress === 0 && completedTasks > 0) {
            console.log('🔧 Fixing progress calculation:', {
              backendProgress: transformedData.dailySummary.overallProgress,
              calculatedProgress: correctProgress,
              totalTasks,
              completedTasks
            });
            
            transformedData.dailySummary.overallProgress = correctProgress;
          }
        }
        
        setData(transformedData);
        setLastRefresh(new Date());
      } else {
        setError(dashboardResponse.message || 'Failed to load dashboard data');
      }
    } catch (err: any) {
      console.log('🔍 Dashboard error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });

      // Handle specific "NO_TASKS_ASSIGNED" case as valid empty state
      if (err.response?.data?.error === 'NO_TASKS_ASSIGNED' || 
          err.message?.includes('No tasks assigned for today')) {
        console.log('📋 No tasks assigned - setting empty state');
        // Set empty data state instead of error
        setData({
          project: null,
          todaysTasks: [],
          attendanceStatus: null,
          workingHours: {
            currentSessionDuration: 0,
            totalHours: 0,
          },
          supervisor: null,
          worker: null,
          toolsAndMaterials: {
            tools: [],
            materials: [],
          },
          dailySummary: {
            totalTasks: 0,
            completedTasks: 0,
            inProgressTasks: 0,
            queuedTasks: 0,
            errorTasks: 0,
            totalHoursWorked: 0,
            remainingHours: 8, // Default work day
            overallProgress: 0, // 0% is correct when no tasks
          },
          workingHours: {
            currentSessionDuration: 0,
            totalHours: 0,
            overtimeApproved: false,
            overtimeHours: 0,
            shiftType: 'morning',
          },
        });
        setLastRefresh(new Date());
        setError(null); // Clear any previous errors
      } else {
        console.error('❌ Dashboard error:', err);
        setError(err.message || 'Network error occurred');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [authState.isAuthenticated, authState.token]);

  const handleManualRefresh = useCallback(async () => {
    // 🗑️ CLEAR STATE AND CACHE immediately on manual refresh
    console.log('🗑️ Dashboard: Clearing state and cache on manual refresh');
    
    // Clear state immediately
    setData({
      project: null,
      todaysTasks: [],
      attendanceStatus: null,
      workingHours: {
        currentSessionDuration: 0,
        totalHours: 0,
      },
      supervisor: null,
      worker: null,
      toolsAndMaterials: {
        tools: [],
        materials: [],
      },
      dailySummary: {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        queuedTasks: 0,
        errorTasks: 0,
        totalHoursWorked: 0,
        remainingHours: 8,
        overallProgress: 0,
      },
      workingHours: {
        currentSessionDuration: 0,
        totalHours: 0,
        overtimeApproved: false,
        overtimeHours: 0,
        shiftType: 'morning',
      },
    });
    
    // Clear cache
    try {
      await AsyncStorage.removeItem('dashboard_data');
      await AsyncStorage.removeItem('offline_tasks');
      await AsyncStorage.removeItem('tasks');
    } catch (error) {
      console.error('⚠️ Dashboard: Error clearing cache:', error);
    }
    
    // Then fetch fresh data
    await refreshData(true);
  }, [refreshData]);

  // Function to update current session duration in real-time
  const updateCurrentSessionDuration = useCallback(() => {
    setData(prevData => {
      // Only update if worker is actively checked in and has a check-in time
      if (prevData.attendanceStatus?.loginTime && !prevData.attendanceStatus?.logoutTime) {
        const checkInTime = new Date(prevData.attendanceStatus.loginTime);
        const now = new Date();
        const currentSessionMinutes = Math.floor((now.getTime() - checkInTime.getTime()) / (1000 * 60));
        
        return {
          ...prevData,
          workingHours: {
            ...prevData.workingHours,
            currentSessionDuration: currentSessionMinutes,
            totalHours: Math.max(prevData.workingHours.totalHours, currentSessionMinutes), // Update total if current session is longer
          }
        };
      }
      return prevData;
    });
  }, []);

  // Initial data load - only if authenticated
  useEffect(() => {
    if (authState.isAuthenticated && authState.token) {
      refreshData();
    }
  }, [authState.isAuthenticated, authState.token, refreshData]);

  // Set up automatic refresh interval - only if authenticated
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.token) {
      return;
    }

    intervalRef.current = setInterval(() => {
      refreshData();
    }, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [authState.isAuthenticated, authState.token, refreshData]);

  // Set up current session update interval
  useEffect(() => {
    // Start current session updates if worker is checked in
    if (data.attendanceStatus?.loginTime && !data.attendanceStatus?.logoutTime) {
      currentSessionIntervalRef.current = setInterval(() => {
        updateCurrentSessionDuration();
      }, CURRENT_SESSION_UPDATE_INTERVAL);
    } else {
      // Clear interval if worker is not checked in
      if (currentSessionIntervalRef.current) {
        clearInterval(currentSessionIntervalRef.current);
        currentSessionIntervalRef.current = null;
      }
    }

    return () => {
      if (currentSessionIntervalRef.current) {
        clearInterval(currentSessionIntervalRef.current);
      }
    };
  }, [data.attendanceStatus?.loginTime, data.attendanceStatus?.logoutTime, updateCurrentSessionDuration]);

  // Clear intervals when component unmounts
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (currentSessionIntervalRef.current) {
        clearInterval(currentSessionIntervalRef.current);
      }
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    refreshData: handleManualRefresh,
    lastRefresh,
    isRefreshing,
  };
};