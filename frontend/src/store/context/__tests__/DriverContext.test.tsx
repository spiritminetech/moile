// Unit tests for DriverContext
// Tests driver-specific state management and operations

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DriverProvider, useDriver } from '../DriverContext';
import { STORAGE_KEYS } from '../../../utils/constants';
import { TransportTask, VehicleInfo, TripRecord, DriverPerformance } from '../../../types';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('DriverContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <DriverProvider>{children}</DriverProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock AsyncStorage
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
  });

  describe('Initial State', () => {
    it('should initialize with default driver state', () => {
      const { result } = renderHook(() => useDriver(), { wrapper });

      expect(result.current.state.transport.todaysTasks).toEqual([]);
      expect(result.current.state.transport.activeTask).toBeNull();
      expect(result.current.state.vehicle.assignedVehicle).toBeNull();
      expect(result.current.state.trips.currentTrip).toBeNull();
      expect(result.current.state.trips.tripHistory).toEqual([]);
      expect(result.current.state.performance.metrics).toBeNull();
      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.error).toBeNull();
    });

    it('should load cached data from storage on initialization', async () => {
      const cachedTasks: TransportTask[] = [{
        taskId: 1,
        route: 'Route A',
        pickupLocations: [],
        dropoffLocation: {
          name: 'Site A',
          address: '123 Main St',
          coordinates: { latitude: 1.3521, longitude: 103.8198 },
          estimatedArrival: '2024-01-01T10:00:00Z',
        },
        status: 'pending',
        totalWorkers: 5,
        checkedInWorkers: 0,
      }];

      const cachedVehicle: VehicleInfo = {
        id: 1,
        plateNumber: 'ABC123',
        model: 'Toyota Hiace',
        year: 2020,
        capacity: 15,
        currentMileage: 50000,
        fuelLevel: 80,
        maintenanceSchedule: [],
        fuelLog: [],
      };

      mockAsyncStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case STORAGE_KEYS.DRIVER_TRANSPORT_TASKS:
            return Promise.resolve(JSON.stringify(cachedTasks));
          case STORAGE_KEYS.DRIVER_VEHICLE_INFO:
            return Promise.resolve(JSON.stringify(cachedVehicle));
          default:
            return Promise.resolve(null);
        }
      });

      const { result } = renderHook(() => useDriver(), { wrapper });

      // Wait for initialization to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.state.transport.todaysTasks).toEqual(cachedTasks);
      expect(result.current.state.vehicle.assignedVehicle).toEqual(cachedVehicle);
    });
  });

  describe('Transport Task Management', () => {
    it('should set active transport task', () => {
      const { result } = renderHook(() => useDriver(), { wrapper });
      
      const task: TransportTask = {
        taskId: 1,
        route: 'Route A',
        pickupLocations: [],
        dropoffLocation: {
          name: 'Site A',
          address: '123 Main St',
          coordinates: { latitude: 1.3521, longitude: 103.8198 },
          estimatedArrival: '2024-01-01T10:00:00Z',
        },
        status: 'pending',
        totalWorkers: 5,
        checkedInWorkers: 0,
      };

      act(() => {
        result.current.setActiveTransportTask(task);
      });

      expect(result.current.state.transport.activeTask).toEqual(task);
    });

    it('should update transport task status', async () => {
      const { result } = renderHook(() => useDriver(), { wrapper });
      
      // First set some tasks
      const tasks: TransportTask[] = [{
        taskId: 1,
        route: 'Route A',
        pickupLocations: [],
        dropoffLocation: {
          name: 'Site A',
          address: '123 Main St',
          coordinates: { latitude: 1.3521, longitude: 103.8198 },
          estimatedArrival: '2024-01-01T10:00:00Z',
        },
        status: 'pending',
        totalWorkers: 5,
        checkedInWorkers: 0,
      }];

      act(() => {
        result.current.dispatch({ type: 'SET_TRANSPORT_TASKS', payload: tasks });
      });

      // Update task status
      await act(async () => {
        await result.current.updateTransportTaskStatus(1, 'en_route_pickup');
      });

      expect(result.current.state.transport.todaysTasks[0].status).toBe('en_route_pickup');
    });
  });

  describe('Worker Manifest Management', () => {
    it('should check in worker', async () => {
      const { result } = renderHook(() => useDriver(), { wrapper });
      
      // Set up worker manifests
      const manifests = [{
        locationId: 1,
        locationName: 'Dormitory A',
        workers: [{
          workerId: 1,
          name: 'John Doe',
          phone: '12345678',
          checkedIn: false,
        }],
        totalWorkers: 1,
        checkedInWorkers: 0,
      }];

      act(() => {
        result.current.dispatch({ type: 'SET_WORKER_MANIFESTS', payload: manifests });
      });

      // Check in worker
      await act(async () => {
        await result.current.checkInWorker(1, 1);
      });

      const updatedManifest = result.current.state.transport.workerManifests[0];
      expect(updatedManifest.workers[0].checkedIn).toBe(true);
      expect(updatedManifest.checkedInWorkers).toBe(1);
    });

    it('should check out worker', async () => {
      const { result } = renderHook(() => useDriver(), { wrapper });
      
      // Set up worker manifests with checked in worker
      const manifests = [{
        locationId: 1,
        locationName: 'Dormitory A',
        workers: [{
          workerId: 1,
          name: 'John Doe',
          phone: '12345678',
          checkedIn: true,
          checkInTime: '2024-01-01T10:00:00Z',
        }],
        totalWorkers: 1,
        checkedInWorkers: 1,
      }];

      act(() => {
        result.current.dispatch({ type: 'SET_WORKER_MANIFESTS', payload: manifests });
      });

      // Check out worker
      await act(async () => {
        await result.current.checkOutWorker(1, 1);
      });

      const updatedManifest = result.current.state.transport.workerManifests[0];
      expect(updatedManifest.workers[0].checkedIn).toBe(false);
      expect(updatedManifest.workers[0].checkInTime).toBeUndefined();
      expect(updatedManifest.checkedInWorkers).toBe(0);
    });
  });

  describe('Vehicle Management', () => {
    it('should add fuel log entry', async () => {
      const { result } = renderHook(() => useDriver(), { wrapper });
      
      const fuelData = {
        amount: 50,
        cost: 75.50,
        mileage: 50100,
        location: 'Shell Station',
      };

      await act(async () => {
        await result.current.addFuelLog(fuelData);
      });

      expect(result.current.state.vehicle.fuelLogs).toHaveLength(1);
      expect(result.current.state.vehicle.fuelLogs[0]).toMatchObject(fuelData);
      expect(result.current.state.vehicle.fuelLogs[0].date).toBeDefined();
    });
  });

  describe('Trip Management', () => {
    it('should start trip', async () => {
      const { result } = renderHook(() => useDriver(), { wrapper });
      
      const transportTask: TransportTask = {
        taskId: 1,
        route: 'Route A',
        pickupLocations: [{
          locationId: 1,
          name: 'Dormitory A',
          address: '123 Main St',
          coordinates: { latitude: 1.3521, longitude: 103.8198 },
          workerManifest: [],
          estimatedPickupTime: '2024-01-01T09:00:00Z',
        }],
        dropoffLocation: {
          name: 'Site A',
          address: '456 Work St',
          coordinates: { latitude: 1.3521, longitude: 103.8198 },
          estimatedArrival: '2024-01-01T10:00:00Z',
        },
        status: 'pending',
        totalWorkers: 5,
        checkedInWorkers: 0,
      };

      await act(async () => {
        await result.current.startTrip(transportTask);
      });

      expect(result.current.state.trips.currentTrip).toBeDefined();
      expect(result.current.state.trips.currentTrip?.route).toBe('Route A');
      expect(result.current.state.trips.currentTrip?.totalWorkers).toBe(5);
    });

    it('should end trip and add to history', async () => {
      const { result } = renderHook(() => useDriver(), { wrapper });
      
      // First start a trip
      const currentTrip: TripRecord = {
        tripId: 1,
        date: new Date(),
        route: 'Route A',
        pickupLocations: ['Dormitory A'],
        dropoffLocation: 'Site A',
        totalWorkers: 5,
        actualPickupTime: new Date(),
        actualDropoffTime: new Date(),
        totalDistance: 15.5,
        fuelUsed: 2.5,
        delays: [],
        status: 'completed',
      };

      act(() => {
        result.current.dispatch({ type: 'SET_CURRENT_TRIP', payload: currentTrip });
      });

      // End the trip
      await act(async () => {
        await result.current.endTrip({
          totalDistance: 15.5,
          fuelUsed: 2.5,
        });
      });

      expect(result.current.state.trips.currentTrip).toBeNull();
      expect(result.current.state.trips.tripHistory).toHaveLength(1);
      expect(result.current.state.trips.tripHistory[0].totalDistance).toBe(15.5);
      expect(result.current.state.trips.tripHistory[0].fuelUsed).toBe(2.5);
    });
  });

  describe('Data Persistence', () => {
    it('should save driver data to storage', async () => {
      const { result } = renderHook(() => useDriver(), { wrapper });
      
      // Set some data
      const tasks: TransportTask[] = [{
        taskId: 1,
        route: 'Route A',
        pickupLocations: [],
        dropoffLocation: {
          name: 'Site A',
          address: '123 Main St',
          coordinates: { latitude: 1.3521, longitude: 103.8198 },
          estimatedArrival: '2024-01-01T10:00:00Z',
        },
        status: 'pending',
        totalWorkers: 5,
        checkedInWorkers: 0,
      }];

      act(() => {
        result.current.dispatch({ type: 'SET_TRANSPORT_TASKS', payload: tasks });
      });

      await act(async () => {
        await result.current.saveDriverData();
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.DRIVER_TRANSPORT_TASKS,
        JSON.stringify(tasks)
      );
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.DRIVER_LAST_SYNC,
        expect.any(String)
      );
    });

    it('should clear driver data from storage', async () => {
      const { result } = renderHook(() => useDriver(), { wrapper });

      await act(async () => {
        await result.current.clearDriverData();
      });

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.DRIVER_TRANSPORT_TASKS);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.DRIVER_VEHICLE_INFO);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.DRIVER_TRIP_HISTORY);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.DRIVER_PERFORMANCE);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.DRIVER_MAINTENANCE_ALERTS);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.DRIVER_LAST_SYNC);

      expect(result.current.state.transport.todaysTasks).toEqual([]);
      expect(result.current.state.vehicle.assignedVehicle).toBeNull();
      expect(result.current.state.trips.tripHistory).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));
      
      const { result } = renderHook(() => useDriver(), { wrapper });

      // Should not throw error
      await act(async () => {
        await result.current.saveDriverData();
      });

      // State should remain consistent
      expect(result.current.state.isLoading).toBe(false);
    });

    it('should handle load errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Load error'));
      
      const { result } = renderHook(() => useDriver(), { wrapper });

      await act(async () => {
        await result.current.loadDriverData();
      });

      // Should not crash and should have default state
      expect(result.current.state.transport.todaysTasks).toEqual([]);
      expect(result.current.state.isLoading).toBe(false);
    });
  });

  describe('Hook Usage', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useDriver());
      }).toThrow('useDriver must be used within a DriverProvider');
      
      consoleSpy.mockRestore();
    });
  });
});