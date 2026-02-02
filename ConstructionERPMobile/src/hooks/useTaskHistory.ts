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
  filterTasks: (filter: 'all' | 'completed' | 'in_progress' | 'cancelled') => void;
  currentFilter: 'all' | 'completed' | 'in_progress' | 'cancelled';
}

export const useTaskHistory = (): UseTaskHistoryReturn => {
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [currentFilter, setCurrentFilter] = useState<'all' | 'completed' | 'in_progress' | 'cancelled'>('all');

  const refreshData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await workerApiService.getTaskHistory();
      
      if (response.success) {
        // Sort tasks by completion date or last updated date (most recent first)
        const sortedTasks = response.data.tasks.sort((a: any, b: any) => {
          const dateA = new Date(a.completedAt || a.date);
          const dateB = new Date(b.completedAt || b.date);
          return dateB.getTime() - dateA.getTime();
        });
        
        // Map API response to TaskAssignment interface
        const mappedTasks: TaskAssignment[] = sortedTasks.map((task: any) => ({
          assignmentId: task.assignmentId,
          projectId: task.projectId || 1, // Use project ID from API response or fallback
          taskName: task.taskName,
          description: task.taskType,
          dependencies: [],
          sequence: 0,
          status: task.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
          location: { latitude: 0, longitude: 0, accuracy: 0, timestamp: new Date() },
          estimatedHours: 8, // Default
          actualHours: task.timeSpent,
          createdAt: task.date,
          updatedAt: task.date,
          startedAt: task.startTime,
          completedAt: task.completedAt,
        }));
        
        setTasks(mappedTasks);
        setLastRefresh(new Date());
        
        // Apply current filter to new data
        applyFilter(mappedTasks, currentFilter);
      } else {
        setError(response.message || 'Failed to load task history');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentFilter]);

  const applyFilter = useCallback((taskList: TaskAssignment[], filter: string) => {
    let filtered = taskList;
    
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