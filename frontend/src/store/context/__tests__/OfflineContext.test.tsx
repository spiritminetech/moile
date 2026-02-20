// Unit tests for OfflineContext
// Tests offline state management and data synchronization

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { OfflineProvider, useOffline } from '../OfflineContext';
import { STORAGE_KEYS } from '../../../utils/constants';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');
jest.mock('../../../services/api/WorkerApiService');

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;

describe('OfflineContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <OfflineProvider>{children}</OfflineProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock NetInfo
    mockNetInfo.addEventListener.mockReturnValue(() => {});
    
    // Mock AsyncStorage
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.multiRemove.mockResolvedValue();
  });

  describe('Initial State', () => {
    it('should initialize with default offline state', () => {
      const { result } = renderHook(() => useOffline(), { wrapper });

      expect(result.current.isOnline).toBe(true);
      expect(result.current.isOffline).toBe(false);
      expect(result.current.state.queuedActions).toEqual([]);
      expect(result.current.state.cachedData.tasks).toEqual([]);
      expect(result.current.state.lastSyncTime).toBeNull();
    });

    it('should load cached data from storage on initialization', async () => {
      const cachedTasks = [{ assignmentId: 1, taskName: 'Test Task' }];
      const cachedAttendance = [{ id: 1, loginTime: '2024-01-01T10:00:00Z' }];
      const lastSync = '2024-01-01T09:00:00Z';

      mockAsyncStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case STORAGE_KEYS.CACHED_TASKS:
            return Promise.resolve(JSON.stringify(cachedTasks));
          case STORAGE_KEYS.CACHED_ATTENDANCE:
            return Promise.resolve(JSON.stringify(cachedAttendance));
          case STORAGE_KEYS.LAST_SYNC:
            return Promise.resolve(lastSync);
          default:
            return Promise.resolve(null);
        }
      });

      const { result } = renderHook(() => useOffline(), { wrapper });

      // Wait for initialization to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.state.cachedData.tasks).toEqual(cachedTasks);
      expect(result.current.state.cachedData.attendance).toEqual(cachedAttendance);
      expect(result.current.state.lastSyncTime).toEqual(new Date(lastSync));
    });
  });

  describe('Network Status Management', () => {
    it('should update online status when network changes', () => {
      let networkCallback: (state: any) => void = () => {};
      
      mockNetInfo.addEventListener.mockImplementation((callback) => {
        networkCallback = callback;
        return () => {};
      });

      const { result } = renderHook(() => useOffline(), { wrapper });

      // Simulate going offline
      act(() => {
        networkCallback({
          isConnected: false,
          isInternetReachable: false,
        });
      });

      expect(result.current.isOnline).toBe(false);
      expect(result.current.isOffline).toBe(true);

      // Simulate coming back online
      act(() => {
        networkCallback({
          isConnected: true,
          isInternetReachable: true,
        });
      });

      expect(result.current.isOnline).toBe(true);
      expect(result.current.isOffline).toBe(false);
    });
  });

  describe('Data Caching', () => {
    it('should cache tasks data', async () => {
      const { result } = renderHook(() => useOffline(), { wrapper });
      const tasksData = [
        { assignmentId: 1, taskName: 'Task 1' },
        { assignmentId: 2, taskName: 'Task 2' },
      ];

      await act(async () => {
        await result.current.cacheData('tasks', tasksData);
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.CACHED_TASKS,
        JSON.stringify(tasksData)
      );
      expect(result.current.getCachedData('tasks')).toEqual(tasksData);
    });

    it('should cache attendance data', async () => {
      const { result } = renderHook(() => useOffline(), { wrapper });
      const attendanceData = [
        { id: 1, loginTime: '2024-01-01T10:00:00Z' },
        { id: 2, loginTime: '2024-01-01T11:00:00Z' },
      ];

      await act(async () => {
        await result.current.cacheData('attendance', attendanceData);
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.CACHED_ATTENDANCE,
        JSON.stringify(attendanceData)
      );
      expect(result.current.getCachedData('attendance')).toEqual(attendanceData);
    });

    it('should return empty array for non-existent cached data', () => {
      const { result } = renderHook(() => useOffline(), { wrapper });

      expect(result.current.getCachedData('tasks')).toEqual([]);
      expect(result.current.getCachedData('attendance')).toEqual([]);
      expect(result.current.getCachedData('notifications')).toEqual([]);
    });
  });

  describe('Action Queuing', () => {
    it('should queue actions for offline sync', async () => {
      const { result } = renderHook(() => useOffline(), { wrapper });

      await act(async () => {
        await result.current.queueAction('CLOCK_IN', {
          location: { latitude: 1.3521, longitude: 103.8198 },
          sessionType: 'regular',
        });
      });

      expect(result.current.state.queuedActions).toHaveLength(1);
      expect(result.current.state.queuedActions[0].type).toBe('CLOCK_IN');
      expect(result.current.state.queuedActions[0].payload).toEqual({
        location: { latitude: 1.3521, longitude: 103.8198 },
        sessionType: 'regular',
      });
    });

    it('should persist queued actions to storage', async () => {
      const { result } = renderHook(() => useOffline(), { wrapper });

      await act(async () => {
        await result.current.queueAction('START_TASK', {
          taskId: 1,
          location: { latitude: 1.3521, longitude: 103.8198 },
        });
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@construction_erp:queued_actions',
        expect.stringContaining('START_TASK')
      );
    });

    it('should generate unique IDs for queued actions', async () => {
      const { result } = renderHook(() => useOffline(), { wrapper });

      await act(async () => {
        await result.current.queueAction('CLOCK_IN', { test: 1 });
        await result.current.queueAction('CLOCK_OUT', { test: 2 });
      });

      const actions = result.current.state.queuedActions;
      expect(actions).toHaveLength(2);
      expect(actions[0].id).not.toBe(actions[1].id);
      expect(actions[0].id).toMatch(/^CLOCK_IN_\d+_[a-z0-9]+$/);
      expect(actions[1].id).toMatch(/^CLOCK_OUT_\d+_[a-z0-9]+$/);
    });
  });

  describe('Data Freshness', () => {
    it('should indicate data is stale when never synced', () => {
      const { result } = renderHook(() => useOffline(), { wrapper });

      const freshness = result.current.getDataFreshness();

      expect(freshness.lastSyncTime).toBeNull();
      expect(freshness.isStale).toBe(true);
      expect(freshness.staleDuration).toBe('Never synced');
    });

    it('should calculate correct staleness for recent sync', () => {
      const { result } = renderHook(() => useOffline(), { wrapper });
      const recentSync = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

      act(() => {
        // Simulate setting last sync time
        result.current.state.lastSyncTime = recentSync;
      });

      const freshness = result.current.getDataFreshness();

      expect(freshness.lastSyncTime).toEqual(recentSync);
      expect(freshness.isStale).toBe(false); // Less than 30 minutes
      expect(freshness.staleDuration).toMatch(/\d+ minutes? ago/);
    });

    it('should indicate data is stale when older than 30 minutes', () => {
      const { result } = renderHook(() => useOffline(), { wrapper });
      const oldSync = new Date(Date.now() - 45 * 60 * 1000); // 45 minutes ago

      act(() => {
        // Simulate setting last sync time
        result.current.state.lastSyncTime = oldSync;
      });

      const freshness = result.current.getDataFreshness();

      expect(freshness.isStale).toBe(true); // More than 30 minutes
      expect(freshness.staleDuration).toMatch(/\d+ minutes? ago/);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));
      
      const { result } = renderHook(() => useOffline(), { wrapper });

      // Should not throw error
      await act(async () => {
        await result.current.cacheData('tasks', [{ id: 1 }]);
      });

      // State should remain consistent
      expect(result.current.state.cachedData.tasks).toEqual([{ id: 1 }]);
    });

    it('should clear sync errors', () => {
      const { result } = renderHook(() => useOffline(), { wrapper });

      // Simulate sync error
      act(() => {
        result.current.state.syncError = 'Test error';
      });

      act(() => {
        result.current.clearSyncError();
      });

      expect(result.current.state.syncError).toBeNull();
    });
  });
});