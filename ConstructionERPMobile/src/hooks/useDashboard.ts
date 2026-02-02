import { useState, useEffect, useCallback, useRef } from 'react';
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
      totalHours: apiData.dailySummary.totalHoursWorked,
    },
    supervisor: apiData.supervisor,
    worker: apiData.worker,
    toolsAndMaterials: apiData.toolsAndMaterials,
    dailySummary: apiData.dailySummary,
  };
};

export const useDashboard = (): UseDashboardReturn => {
  const [data, setData] = useState<DashboardData>({
    project: null,
    todaysTasks: [],
    attendanceStatus: null,
    workingHours: {
      currentSessionDuration: 0,
      totalHours: 0,
    },
    supervisor: null,
    worker: null,
    toolsAndMaterials: null,
    dailySummary: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await workerApiService.getDashboardData();
      
      if (response.success) {
        const transformedData = transformDashboardData(response.data);
        setData(transformedData);
        setLastRefresh(new Date());
      } else {
        setError(response.message || 'Failed to load dashboard data');
      }
    } catch (err: any) {
      // Handle specific "NO_TASKS_ASSIGNED" case as valid empty state
      if (err.response?.data?.error === 'NO_TASKS_ASSIGNED') {
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
            overallProgress: 0,
          },
        });
        setLastRefresh(new Date());
        setError(null); // Clear any previous errors
      } else {
        setError(err.message || 'Network error occurred');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const handleManualRefresh = useCallback(async () => {
    await refreshData(true);
  }, [refreshData]);

  // Initial data load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Set up automatic refresh interval
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      refreshData();
    }, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshData]);

  // Clear interval when component unmounts
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
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