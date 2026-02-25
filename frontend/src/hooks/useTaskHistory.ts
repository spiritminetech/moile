import { useState, useEffect, useCallback, useRef } from 'react';
import { workerApiService } from '../services/api/WorkerApiService';
import { TaskAssignment } from '../types';

export interface UseTaskHistoryReturn {
  tasks: TaskAssignment[];
  filteredTasks: TaskAssignment[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  lastRefresh: Date | null;
  isRefreshing: boolean;
  filterTasks: (filter: 'all' | 'queued' | 'in_progress' | 'paused' | 'completed' | 'cancelled') => void;
  currentFilter: 'all' | 'queued' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
}

export const useTaskHistory = (): UseTaskHistoryReturn => {
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [currentFilter, setCurrentFilter] = useState<'all' | 'queued' | 'in_progress' | 'paused' | 'completed' | 'cancelled'>('all');

  const refreshData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      console.log('🔄 Fetching task history...');
      const response = await workerApiService.getTaskHistory();
      console.log('📊 Task history response:', {
        success: response.success,
        hasData: !!response.data,
        dataType: typeof response.data,
        message: response.message
      });
      
      if (response.success && response.data) {
        // Handle the response structure properly
        let tasksArray: any[] = [];
        
        // Check if response.data has tasks array
        if (response.data.tasks && Array.isArray(response.data.tasks)) {
          tasksArray = response.data.tasks;
          console.log('📋 Found tasks in response.data.tasks:', tasksArray.length);
        }
        // Check if response.data is directly an array
        else if (Array.isArray(response.data)) {
          tasksArray = response.data;
          console.log('📋 Found tasks as direct array:', tasksArray.length);
        }
        
        console.log('📋 Raw tasks from API:', tasksArray.length);
        console.log('📋 Sample raw task:', tasksArray[0]);
        console.log('📋 Sample raw task projectGeofence:', tasksArray[0]?.projectGeofence);
        
        // Sort tasks by completion date or last updated date (most recent first)
        const sortedTasks = tasksArray.sort((a: any, b: any) => {
          const dateA = new Date(a.completedAt || a.date);
          const dateB = new Date(b.completedAt || b.date);
          return dateB.getTime() - dateA.getTime();
        });
        
        // Map API response to TaskAssignment interface
        const mappedTasks: TaskAssignment[] = sortedTasks.map((task: any) => {
          console.log(`🗺️ Mapping task ${task.assignmentId}:`, {
            hasProjectGeofence: !!task.projectGeofence,
            projectGeofence: task.projectGeofence,
            taskDate: task.date
          });
          
          return {
            assignmentId: task.assignmentId,
            projectId: task.projectId || 1,
            projectName: task.projectName || `Project ${task.projectId || 1}`,
            projectCode: task.projectCode || 'N/A',
            taskName: task.taskName,
            description: task.taskType || task.description || '',
            dependencies: [],
            sequence: task.sequence || 0,
            status: task.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
            location: { latitude: 0, longitude: 0, accuracy: 0, timestamp: new Date() },
            estimatedHours: 8,
            actualHours: task.timeSpent ? task.timeSpent / 60 : undefined, // Convert minutes to hours
            createdAt: task.date,
            updatedAt: task.date,
            startedAt: task.startTime,
            completedAt: task.completedAt,
            date: task.date, // Include task assignment date for date validation
            projectGeofence: task.projectGeofence || null,
          };
        });
        
        console.log('✅ Mapped tasks successfully:', mappedTasks.length);
        console.log('📋 Sample mapped task:', mappedTasks[0]);
        
        setTasks(mappedTasks);
        setLastRefresh(new Date());
        
        // Apply current filter to new data
        applyFilter(mappedTasks, currentFilter);
      } else {
        console.log('⚠️ No tasks in response or API error');
        // Ensure tasks is always an array, even on API failure
        const emptyTasks: TaskAssignment[] = [];
        setTasks(emptyTasks);
        setFilteredTasks(emptyTasks);
        setError(response.message || 'Failed to load task history');
      }
    } catch (err: any) {
      console.error('❌ Task history fetch error:', err);
      // Ensure tasks is always an array, even on error
      const emptyTasks: TaskAssignment[] = [];
      setTasks(emptyTasks);
      setFilteredTasks(emptyTasks);
      setError(err.message || 'Network error occurred');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentFilter]);

  const applyFilter = useCallback((taskList: TaskAssignment[], filter: string) => {
    console.log('🔍 Applying filter:', { filter, taskListLength: taskList.length });
    
    let filtered = taskList;
    
    // Don't filter out queued tasks - show all tasks regardless of status or date
    // The backend already returns relevant tasks, and workers need to see all their assignments
    // including queued tasks from previous days that may need supervisor attention
    
    // Apply the user's selected filter
    switch (filter) {
      case 'completed':
        filtered = taskList.filter(task => task.status === 'completed');
        break;
      case 'in_progress':
        filtered = taskList.filter(task => task.status === 'in_progress');
        break;
      case 'cancelled':
        filtered = taskList.filter(task => task.status === 'cancelled');
        break;
      case 'all':
      default:
        filtered = taskList;
        break;
    }
    
    console.log('🔍 Filter result:', { 
      filter, 
      originalCount: taskList.length, 
      filteredCount: filtered.length,
      statuses: filtered.map(t => t.status)
    });
    
    setFilteredTasks(filtered);
  }, []);

  const filterTasks = useCallback((filter: 'all' | 'completed' | 'in_progress' | 'cancelled') => {
    setCurrentFilter(filter);
    applyFilter(tasks, filter);
  }, [tasks, applyFilter]);

  const handleManualRefresh = useCallback(async () => {
    await refreshData(true);
  }, [refreshData]);

  // Initial data load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Update filtered tasks when tasks array changes
  useEffect(() => {
    if (tasks.length > 0) {
      applyFilter(tasks, currentFilter);
    }
  }, [tasks, currentFilter, applyFilter]);

  return {
    tasks,
    filteredTasks,
    isLoading,
    error,
    refreshData: handleManualRefresh,
    lastRefresh,
    isRefreshing,
    filterTasks,
    currentFilter,
  };
};