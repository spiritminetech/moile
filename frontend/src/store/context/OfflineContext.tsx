// Offline Context Provider - Manages network state and data synchronization
// Requirements: 9.1, 9.2, 9.3, 9.4

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../utils/constants';
import {
  OfflineState,
  QueuedAction,
  CachedData,
  TaskAssignment,
  AttendanceRecord,
} from '../../types';

// Offline State Interface
interface OfflineContextState extends OfflineState {
  isLoading: boolean;
  syncError: string | null;
}

// Action Types
type OfflineAction =
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SYNC_ERROR'; payload: string | null }
  | { type: 'SET_LAST_SYNC_TIME'; payload: Date }
  | { type: 'ADD_QUEUED_ACTION'; payload: QueuedAction }
  | { type: 'REMOVE_QUEUED_ACTION'; payload: string }
  | { type: 'UPDATE_CACHED_DATA'; payload: Partial<CachedData> }
  | { type: 'CLEAR_QUEUED_ACTIONS' }
  | { type: 'INCREMENT_RETRY_COUNT'; payload: string };

// Initial State
const initialState: OfflineContextState = {
  isOnline: true,
  lastSyncTime: null,
  queuedActions: [],
  cachedData: {
    tasks: [],
    attendance: [],
    lastUpdated: new Date(),
  },
  isLoading: false,
  syncError: null,
};

// Reducer
const offlineReducer = (state: OfflineContextState, action: OfflineAction): OfflineContextState => {
  switch (action.type) {
    case 'SET_ONLINE_STATUS':
      return { ...state, isOnline: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_SYNC_ERROR':
      return { ...state, syncError: action.payload };
    
    case 'SET_LAST_SYNC_TIME':
      return { ...state, lastSyncTime: action.payload };
    
    case 'ADD_QUEUED_ACTION':
      return {
        ...state,
        queuedActions: [...state.queuedActions, action.payload],
      };
    
    case 'REMOVE_QUEUED_ACTION':
      return {
        ...state,
        queuedActions: state.queuedActions.filter(a => a.id !== action.payload),
      };
    
    case 'UPDATE_CACHED_DATA':
      return {
        ...state,
        cachedData: {
          ...state.cachedData,
          ...action.payload,
          lastUpdated: new Date(),
        },
      };
    
    case 'CLEAR_QUEUED_ACTIONS':
      return { ...state, queuedActions: [] };
    
    case 'INCREMENT_RETRY_COUNT':
      return {
        ...state,
        queuedActions: state.queuedActions.map(action =>
          action.id === action.payload
            ? { ...action, retryCount: action.retryCount + 1 }
            : action
        ),
      };
    
    default:
      return state;
  }
};

// Context Interface
interface OfflineContextValue {
  state: OfflineContextState;
  // Network status
  isOnline: boolean;
  isOffline: boolean;
  // Data caching
  cacheData: (type: 'tasks' | 'attendance', data: any[]) => Promise<void>;
  getCachedData: (type: 'tasks' | 'attendance') => any[];
  // Action queuing
  queueAction: (type: string, payload: any) => Promise<void>;
  // Synchronization
  syncQueuedActions: () => Promise<void>;
  clearSyncError: () => void;
  // Data freshness
  getDataFreshness: () => {
    lastSyncTime: Date | null;
    isStale: boolean;
    staleDuration: string;
  };
}

// Create Context
const OfflineContext = createContext<OfflineContextValue | undefined>(undefined);

// Provider Component
export const OfflineProvider: React.FC<{ 
  children: React.ReactNode;
  initialOfflineState?: boolean;
}> = ({ children, initialOfflineState }) => {
  const [state, dispatch] = useReducer(offlineReducer, {
    ...initialState,
    isOnline: initialOfflineState !== undefined ? !initialOfflineState : initialState.isOnline,
  });

  // Initialize offline state from storage
  useEffect(() => {
    const initializeOfflineState = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });

        // Load cached data
        const cachedTasks = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_TASKS);
        const cachedAttendance = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_ATTENDANCE);
        const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);

        if (cachedTasks || cachedAttendance) {
          dispatch({
            type: 'UPDATE_CACHED_DATA',
            payload: {
              tasks: cachedTasks ? JSON.parse(cachedTasks) : [],
              attendance: cachedAttendance ? JSON.parse(cachedAttendance) : [],
            },
          });
        }

        if (lastSync) {
          dispatch({
            type: 'SET_LAST_SYNC_TIME',
            payload: new Date(lastSync),
          });
        }

        // Load queued actions
        const queuedActionsJson = await AsyncStorage.getItem('@construction_erp:queued_actions');
        if (queuedActionsJson) {
          const queuedActions = JSON.parse(queuedActionsJson);
          queuedActions.forEach((action: QueuedAction) => {
            dispatch({ type: 'ADD_QUEUED_ACTION', payload: action });
          });
        }
      } catch (error) {
        console.error('Failed to initialize offline state:', error);
        dispatch({ type: 'SET_SYNC_ERROR', payload: 'Failed to load offline data' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeOfflineState();
  }, []);

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(netState => {
      const isConnected = netState.isConnected && netState.isInternetReachable;
      dispatch({ type: 'SET_ONLINE_STATUS', payload: isConnected ?? false });

      // Auto-sync when coming back online
      if (isConnected && state.queuedActions.length > 0) {
        syncQueuedActions();
      }
    });

    return unsubscribe;
  }, [state.queuedActions.length]);

  // Cache data function
  const cacheData = useCallback(async (
    type: 'tasks' | 'attendance',
    data: any[]
  ) => {
    try {
      const storageKey = type === 'tasks' 
        ? STORAGE_KEYS.CACHED_TASKS 
        : STORAGE_KEYS.CACHED_ATTENDANCE;

      await AsyncStorage.setItem(storageKey, JSON.stringify(data));
      
      dispatch({
        type: 'UPDATE_CACHED_DATA',
        payload: { [type]: data },
      });
    } catch (error) {
      console.error(`Failed to cache ${type} data:`, error);
    }
  }, []);

  // Get cached data function
  const getCachedData = useCallback((type: 'tasks' | 'attendance') => {
    return state.cachedData[type] || [];
  }, [state.cachedData]);

  // Queue action function
  const queueAction = useCallback(async (type: string, payload: any) => {
    const queuedAction: QueuedAction = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: new Date(),
      retryCount: 0,
    };

    dispatch({ type: 'ADD_QUEUED_ACTION', payload: queuedAction });

    // Persist queued actions
    try {
      const updatedQueue = [...state.queuedActions, queuedAction];
      await AsyncStorage.setItem(
        '@construction_erp:queued_actions',
        JSON.stringify(updatedQueue)
      );
    } catch (error) {
      console.error('Failed to persist queued action:', error);
    }
  }, [state.queuedActions]);

  // Sync queued actions function
  const syncQueuedActions = useCallback(async () => {
    if (!state.isOnline || state.queuedActions.length === 0) {
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_SYNC_ERROR', payload: null });

    const maxRetries = 3;
    const actionsToSync = [...state.queuedActions];

    for (const action of actionsToSync) {
      try {
        // Skip actions that have exceeded retry limit
        if (action.retryCount >= maxRetries) {
          console.warn(`Skipping action ${action.id} - max retries exceeded`);
          dispatch({ type: 'REMOVE_QUEUED_ACTION', payload: action.id });
          continue;
        }

        // Execute the queued action based on type
        await executeQueuedAction(action);
        
        // Remove successful action from queue
        dispatch({ type: 'REMOVE_QUEUED_ACTION', payload: action.id });
        
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);
        
        // Increment retry count
        dispatch({ type: 'INCREMENT_RETRY_COUNT', payload: action.id });
        
        // Set sync error for user feedback
        dispatch({
          type: 'SET_SYNC_ERROR',
          payload: `Failed to sync ${action.type}. Will retry when online.`,
        });
      }
    }

    // Update last sync time
    const now = new Date();
    dispatch({ type: 'SET_LAST_SYNC_TIME', payload: now });
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, now.toISOString());

    // Persist updated queue
    try {
      await AsyncStorage.setItem(
        '@construction_erp:queued_actions',
        JSON.stringify(state.queuedActions)
      );
    } catch (error) {
      console.error('Failed to persist updated queue:', error);
    }

    dispatch({ type: 'SET_LOADING', payload: false });
  }, [state.isOnline, state.queuedActions]);

  // Execute individual queued action
  const executeQueuedAction = async (action: QueuedAction) => {
    // Import API services dynamically to avoid circular dependencies
    const { workerApiService } = await import('../../services/api/WorkerApiService');

    switch (action.type) {
      case 'CLOCK_IN':
        await workerApiService.clockIn({ 
          projectId: action.payload.projectId,
          location: action.payload.location
        });
        break;
      
      case 'CLOCK_OUT':
        await workerApiService.clockOut({ 
          projectId: action.payload.projectId,
          location: action.payload.location
        });
        break;
      
      case 'START_TASK':
        await workerApiService.startTask(action.payload.taskId, action.payload.location);
        break;
      
      case 'UPDATE_TASK_PROGRESS':
        await workerApiService.updateTaskProgress(
          action.payload.taskId,
          action.payload.progressPercent,
          action.payload.description,
          action.payload.location
        );
        break;
      
      case 'SUBMIT_DAILY_REPORT':
        await workerApiService.createDailyReport(action.payload);
        break;
      
      case 'SUBMIT_REQUEST':
        // Handle different request types
        switch (action.payload.requestType) {
          case 'leave':
            await workerApiService.submitLeaveRequest(action.payload.data);
            break;
          case 'material':
            await workerApiService.submitMaterialRequest(action.payload.data);
            break;
          case 'tool':
            await workerApiService.submitToolRequest(action.payload.data);
            break;
          case 'reimbursement':
            await workerApiService.submitReimbursementRequest(action.payload.data);
            break;
          case 'advance_payment':
            await workerApiService.submitAdvancePaymentRequest(action.payload.data);
            break;
        }
        break;
      
      default:
        console.warn(`Unknown queued action type: ${action.type}`);
    }
  };

  // Clear sync error function
  const clearSyncError = useCallback(() => {
    dispatch({ type: 'SET_SYNC_ERROR', payload: null });
  }, []);

  // Get data freshness function
  const getDataFreshness = useCallback(() => {
    const now = new Date();
    const lastSync = state.lastSyncTime;
    
    if (!lastSync) {
      return {
        lastSyncTime: null,
        isStale: true,
        staleDuration: 'Never synced',
      };
    }

    const diffMs = now.getTime() - lastSync.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    let staleDuration: string;
    if (diffMinutes < 1) {
      staleDuration = 'Just now';
    } else if (diffMinutes < 60) {
      staleDuration = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      staleDuration = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      staleDuration = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }

    // Consider data stale if older than 30 minutes
    const isStale = diffMinutes > 30;

    return {
      lastSyncTime: lastSync,
      isStale,
      staleDuration,
    };
  }, [state.lastSyncTime]);

  // Context value
  const contextValue: OfflineContextValue = {
    state,
    isOnline: state.isOnline,
    isOffline: !state.isOnline,
    cacheData,
    getCachedData,
    queueAction,
    syncQueuedActions,
    clearSyncError,
    getDataFreshness,
  };

  return (
    <OfflineContext.Provider value={contextValue}>
      {children}
    </OfflineContext.Provider>
  );
};

// Hook to use offline context
export const useOffline = (): OfflineContextValue => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

export default OfflineProvider;