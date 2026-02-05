// TransportTasksScreen - Route planning and optimization interface for drivers
// Requirements: 9.1, 9.2, 9.3, 9.4, 9.5

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useAuth } from '../../store/context/AuthContext';
import { useLocation } from '../../store/context/LocationContext';
import { useOffline } from '../../store/context/OfflineContext';
import { driverApiService } from '../../services/api/DriverApiService';
import { 
  TransportTask, 
  GeoLocation, 
  RouteData,
  WorkerManifest 
} from '../../types';

// Import driver-specific components
import RouteNavigationComponent from '../../components/driver/RouteNavigationComponent';
import WorkerCheckInForm from '../../components/driver/WorkerCheckInForm';

// Import common components
import { 
  ConstructionButton, 
  ConstructionCard, 
  ConstructionLoadingIndicator,
  ErrorDisplay,
  OfflineIndicator 
} from '../../components/common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface RouteOptimizationData {
  originalRoute: TransportTask;
  optimizedRoute: TransportTask;
  timeSaved: number;
  distanceSaved: number;
  fuelSaved: number;
}

const TransportTasksScreen: React.FC = () => {
  const { state: authState } = useAuth();
  const { state: locationState, getCurrentLocation } = useLocation();
  const { isOffline } = useOffline();

  // Transport tasks state
  const [transportTasks, setTransportTasks] = useState<TransportTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<TransportTask | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [routeOptimization, setRouteOptimization] = useState<RouteOptimizationData | null>(null);
  const [workerManifests, setWorkerManifests] = useState<WorkerManifest[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeView, setActiveView] = useState<'tasks' | 'navigation' | 'workers'>('tasks');

  // Route optimization state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<RouteOptimizationData | null>(null);

  // Load transport tasks
  const loadTransportTasks = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      console.log('🚛 Loading transport tasks...');

      const response = await driverApiService.getTodaysTransportTasks();
      if (response.success && response.data) {
        setTransportTasks(response.data);
        
        // Auto-select first active task
        const activeTask = response.data.find(task => 
          task.status !== 'completed'
        );
        if (activeTask && !selectedTask) {
          setSelectedTask(activeTask);
        }
        
        console.log('✅ Transport tasks loaded:', response.data.length);
      }

      setLastUpdated(new Date());

    } catch (error: any) {
      console.error('❌ Transport tasks loading error:', error);
      setError(error.message || 'Failed to load transport tasks');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedTask]);

  // Load worker manifests for selected task
  const loadWorkerManifests = useCallback(async (taskId: number) => {
    try {
      console.log('👥 Loading worker manifests for task:', taskId);
      
      const response = await driverApiService.getWorkerManifests(taskId);
      if (response.success && response.data) {
        setWorkerManifests(response.data);
        console.log('✅ Worker manifests loaded:', response.data.length);
      }
    } catch (error: any) {
      console.error('❌ Worker manifests loading error:', error);
      Alert.alert('Error', 'Failed to load worker manifests');
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadTransportTasks();
  }, [loadTransportTasks]);

  // Load worker manifests when task is selected
  useEffect(() => {
    if (selectedTask) {
      loadWorkerManifests(selectedTask.taskId);
    }
  }, [selectedTask, loadWorkerManifests]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadTransportTasks(false);
  }, [loadTransportTasks]);

  // Handle task selection
  const handleTaskSelection = useCallback((task: TransportTask) => {
    setSelectedTask(task);
    setSelectedLocationId(null);
    setActiveView('navigation');
  }, []);

  // Handle route optimization
  const handleRouteOptimization = useCallback(async () => {
    if (!selectedTask) {
      Alert.alert('Error', 'Please select a transport task first');
      return;
    }

    try {
      setIsOptimizing(true);
      console.log('🗺️ Optimizing route for task:', selectedTask.taskId);

      const response = await driverApiService.optimizeRoute(selectedTask.taskId);
      if (response.success && response.data) {
        // Create optimization comparison data
        const optimizationData: RouteOptimizationData = {
          originalRoute: selectedTask,
          optimizedRoute: {
            ...selectedTask,
            pickupLocations: response.data.optimizedPickupOrder || selectedTask.pickupLocations,
          },
          timeSaved: response.data.timeSaved || 0,
          distanceSaved: response.data.distanceSaved || 0,
          fuelSaved: response.data.fuelSaved || 0,
        };

        setOptimizationResults(optimizationData);
        
        Alert.alert(
          'Route Optimization Complete',
          `Optimized route will save:\n• ${optimizationData.timeSaved} minutes\n• ${optimizationData.distanceSaved.toFixed(1)} km\n• ${optimizationData.fuelSaved.toFixed(1)}L fuel\n\nApply optimization?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Apply Optimization',
              onPress: () => {
                setSelectedTask(optimizationData.optimizedRoute);
                Alert.alert('Success', 'Route optimization applied!');
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ Route optimization error:', error);
      Alert.alert('Error', error.message || 'Failed to optimize route');
    } finally {
      setIsOptimizing(false);
    }
  }, [selectedTask]);

  // Handle emergency reroute
  const handleEmergencyReroute = useCallback(async () => {
    if (!selectedTask) {
      Alert.alert('Error', 'Please select a transport task first');
      return;
    }

    Alert.alert(
      'Emergency Reroute',
      'Request emergency reroute due to road closure, accident, or other incident?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Reroute',
          style: 'destructive',
          onPress: async () => {
            try {
              // This would typically call a backend service for emergency rerouting
              console.log('🚨 Requesting emergency reroute for task:', selectedTask.taskId);
              
              Alert.alert(
                'Emergency Reroute Requested',
                'Dispatch has been notified. You will receive updated route instructions shortly.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Refresh tasks to get updated route
                      handleRefresh();
                    },
                  },
                ]
              );
            } catch (error: any) {
              console.error('❌ Emergency reroute error:', error);
              Alert.alert('Error', 'Failed to request emergency reroute');
            }
          },
        },
      ]
    );
  }, [selectedTask, handleRefresh]);

  // Handle navigation start
  const handleNavigationStart = useCallback((locationId: number) => {
    setSelectedLocationId(locationId);
    setActiveView('workers');
  }, []);

  // Handle worker check-in
  const handleWorkerCheckIn = useCallback(async (workerId: number, checkInData: any) => {
    if (!selectedTask || !selectedLocationId) {
      Alert.alert('Error', 'Invalid task or location selection');
      return;
    }

    try {
      console.log('✅ Checking in worker:', workerId, 'at location:', selectedLocationId);
      
      const response = await driverApiService.checkInWorker(
        selectedLocationId,
        workerId,
        locationState.currentLocation || {
          latitude: 0,
          longitude: 0,
          accuracy: 0,
          timestamp: new Date(),
        }
      );

      if (response.success) {
        // Update local task data
        const updatedTask = { ...selectedTask };
        const location = updatedTask.pickupLocations.find(loc => loc.locationId === selectedLocationId);
        if (location) {
          const worker = location.workerManifest.find(w => w.workerId === workerId);
          if (worker) {
            worker.checkedIn = true;
            worker.checkInTime = new Date().toISOString();
          }
        }
        setSelectedTask(updatedTask);
        
        // Update tasks list
        const updatedTasks = transportTasks.map(task => 
          task.taskId === selectedTask.taskId ? updatedTask : task
        );
        setTransportTasks(updatedTasks);
      }
    } catch (error: any) {
      console.error('❌ Worker check-in error:', error);
      throw error; // Re-throw to let the form handle the error
    }
  }, [selectedTask, selectedLocationId, locationState.currentLocation, transportTasks]);

  // Handle worker check-out
  const handleWorkerCheckOut = useCallback(async (workerId: number) => {
    if (!selectedTask || !selectedLocationId) {
      Alert.alert('Error', 'Invalid task or location selection');
      return;
    }

    try {
      console.log('❌ Checking out worker:', workerId, 'at location:', selectedLocationId);
      
      const response = await driverApiService.checkOutWorker(
        selectedLocationId,
        workerId,
        locationState.currentLocation || {
          latitude: 0,
          longitude: 0,
          accuracy: 0,
          timestamp: new Date(),
        }
      );

      if (response.success) {
        // Update local task data
        const updatedTask = { ...selectedTask };
        const location = updatedTask.pickupLocations.find(loc => loc.locationId === selectedLocationId);
        if (location) {
          const worker = location.workerManifest.find(w => w.workerId === workerId);
          if (worker) {
            worker.checkedIn = false;
            worker.checkInTime = undefined;
          }
        }
        setSelectedTask(updatedTask);
        
        // Update tasks list
        const updatedTasks = transportTasks.map(task => 
          task.taskId === selectedTask.taskId ? updatedTask : task
        );
        setTransportTasks(updatedTasks);
      }
    } catch (error: any) {
      console.error('❌ Worker check-out error:', error);
      throw error; // Re-throw to let the form handle the error
    }
  }, [selectedTask, selectedLocationId, locationState.currentLocation, transportTasks]);

  // Handle pickup completion
  const handleCompletePickup = useCallback(async (locationId: number) => {
    if (!selectedTask) {
      Alert.alert('Error', 'No task selected');
      return;
    }

    try {
      const location = selectedTask.pickupLocations.find(loc => loc.locationId === locationId);
      if (!location) {
        Alert.alert('Error', 'Location not found');
        return;
      }

      const checkedInWorkers = location.workerManifest.filter(w => w.checkedIn).length;
      
      console.log('🚌 Completing pickup for location:', locationId, 'with', checkedInWorkers, 'workers');
      
      const response = await driverApiService.confirmPickupComplete(
        selectedTask.taskId,
        locationId,
        locationState.currentLocation || {
          latitude: location.coordinates.latitude,
          longitude: location.coordinates.longitude,
          accuracy: 10,
          timestamp: new Date(),
        },
        checkedInWorkers,
        `Pickup completed with ${checkedInWorkers} workers`
      );

      if (response.success) {
        Alert.alert(
          'Pickup Complete',
          `Successfully completed pickup at ${location.name} with ${checkedInWorkers} workers.`,
          [
            {
              text: 'Continue',
              onPress: () => {
                // Move to next location or navigation view
                setActiveView('navigation');
                setSelectedLocationId(null);
                // Refresh tasks to get updated status
                handleRefresh();
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ Complete pickup error:', error);
      Alert.alert('Error', error.message || 'Failed to complete pickup');
    }
  }, [selectedTask, locationState.currentLocation, handleRefresh]);

  // Handle task status update
  const handleTaskStatusUpdate = useCallback(async (taskId: number, status: TransportTask['status']) => {
    try {
      console.log('📊 Updating task status:', taskId, 'to', status);
      
      const response = await driverApiService.updateTransportTaskStatus(
        taskId,
        status,
        locationState.currentLocation || undefined,
        `Status updated to ${status} from transport tasks screen`
      );

      if (response.success) {
        // Update local task data
        const updatedTasks = transportTasks.map(task => 
          task.taskId === taskId ? { ...task, status } : task
        );
        setTransportTasks(updatedTasks);
        
        if (selectedTask && selectedTask.taskId === taskId) {
          setSelectedTask({ ...selectedTask, status });
        }
        
        Alert.alert('Success', `Task status updated to ${status.replace('_', ' ')}`);
      }
    } catch (error: any) {
      console.error('❌ Task status update error:', error);
      Alert.alert('Error', error.message || 'Failed to update task status');
    }
  }, [transportTasks, selectedTask, locationState.currentLocation]);

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Transport Tasks</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ConstructionLoadingIndicator 
            message="Loading transport tasks..."
            size="large"
          />
        </View>
      </View>
    );
  }

  // Render error state
  if (error && transportTasks.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Transport Tasks</Text>
        </View>
        <View style={styles.errorContainer}>
          <ErrorDisplay 
            error={error}
            onRetry={() => loadTransportTasks()}
            showRetry={!isOffline}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Transport Tasks</Text>
          <Text style={styles.subtitle}>
            Route Planning & Management
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          <Text style={styles.refreshButtonText}>
            {isRefreshing ? '⟳' : '↻'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Offline indicator */}
      {isOffline && <OfflineIndicator />}

      {/* View Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, activeView === 'tasks' && styles.toggleButtonActive]}
          onPress={() => setActiveView('tasks')}
        >
          <Text style={[styles.toggleButtonText, activeView === 'tasks' && styles.toggleButtonTextActive]}>
            📋 Tasks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, activeView === 'navigation' && styles.toggleButtonActive]}
          onPress={() => setActiveView('navigation')}
          disabled={!selectedTask}
        >
          <Text style={[
            styles.toggleButtonText, 
            activeView === 'navigation' && styles.toggleButtonTextActive,
            !selectedTask && styles.toggleButtonTextDisabled
          ]}>
            🗺️ Navigation
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, activeView === 'workers' && styles.toggleButtonActive]}
          onPress={() => setActiveView('workers')}
          disabled={!selectedTask || !selectedLocationId}
        >
          <Text style={[
            styles.toggleButtonText, 
            activeView === 'workers' && styles.toggleButtonTextActive,
            (!selectedTask || !selectedLocationId) && styles.toggleButtonTextDisabled
          ]}>
            👥 Workers
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[ConstructionTheme.colors.primary]}
            tintColor={ConstructionTheme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Tasks View */}
        {activeView === 'tasks' && (
          <View style={styles.tasksView}>
            {transportTasks.length > 0 ? (
              transportTasks.map((task) => (
                <ConstructionCard
                  key={task.taskId}
                  variant={selectedTask?.taskId === task.taskId ? 'success' : 'outlined'}
                  style={styles.taskCard}
                >
                  <TouchableOpacity
                    onPress={() => handleTaskSelection(task)}
                    style={styles.taskCardContent}
                  >
                    <View style={styles.taskHeader}>
                      <Text style={styles.taskRoute}>🚛 {task.route}</Text>
                      <Text style={[styles.taskStatus, { color: getStatusColor(task.status) }]}>
                        {task.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                    
                    <View style={styles.taskInfo}>
                      <Text style={styles.taskDetail}>
                        📍 {task.pickupLocations.length} pickup locations
                      </Text>
                      <Text style={styles.taskDetail}>
                        👥 {task.totalWorkers} workers ({task.checkedInWorkers} checked in)
                      </Text>
                      <Text style={styles.taskDetail}>
                        🏗️ Drop-off: {task.dropoffLocation.name}
                      </Text>
                    </View>

                    {/* Quick Actions */}
                    <View style={styles.taskActions}>
                      <ConstructionButton
                        title="🗺️ Navigate"
                        onPress={() => handleTaskSelection(task)}
                        variant="primary"
                        size="small"
                        style={styles.taskActionButton}
                      />
                      <ConstructionButton
                        title="📊 Update Status"
                        onPress={() => {
                          const nextStatus = getNextStatus(task.status);
                          if (nextStatus) {
                            handleTaskStatusUpdate(task.taskId, nextStatus);
                          }
                        }}
                        variant="secondary"
                        size="small"
                        style={styles.taskActionButton}
                      />
                    </View>
                  </TouchableOpacity>
                </ConstructionCard>
              ))
            ) : (
              <ConstructionCard variant="outlined" style={styles.noTasksCard}>
                <Text style={styles.noTasksText}>🚛 No transport tasks today</Text>
                <Text style={styles.noTasksSubtext}>Check back later or contact dispatch</Text>
              </ConstructionCard>
            )}
          </View>
        )}

        {/* Navigation View */}
        {activeView === 'navigation' && selectedTask && (
          <RouteNavigationComponent
            transportTask={selectedTask}
            currentLocation={locationState.currentLocation}
            onNavigationStart={handleNavigationStart}
            onRouteOptimization={handleRouteOptimization}
            onEmergencyReroute={handleEmergencyReroute}
          />
        )}

        {/* Workers View */}
        {activeView === 'workers' && selectedTask && selectedLocationId && (
          <WorkerCheckInForm
            transportTask={selectedTask}
            selectedLocationId={selectedLocationId}
            onWorkerCheckIn={handleWorkerCheckIn}
            onWorkerCheckOut={handleWorkerCheckOut}
            onCompletePickup={handleCompletePickup}
            isLoading={false}
          />
        )}

        {/* Route Optimization Results */}
        {optimizationResults && (
          <ConstructionCard title="Route Optimization Results" variant="success" style={styles.optimizationCard}>
            <Text style={styles.optimizationTitle}>🎯 Optimization Benefits</Text>
            <View style={styles.optimizationStats}>
              <Text style={styles.optimizationStat}>⏱️ Time Saved: {optimizationResults.timeSaved} minutes</Text>
              <Text style={styles.optimizationStat}>📏 Distance Saved: {optimizationResults.distanceSaved.toFixed(1)} km</Text>
              <Text style={styles.optimizationStat}>⛽ Fuel Saved: {optimizationResults.fuelSaved.toFixed(1)} L</Text>
            </View>
          </ConstructionCard>
        )}

        {/* Last updated info */}
        {lastUpdated && (
          <View style={styles.lastUpdatedContainer}>
            <Text style={styles.lastUpdatedText}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Text>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

// Helper functions
const getStatusColor = (status: TransportTask['status']): string => {
  switch (status) {
    case 'pending':
      return ConstructionTheme.colors.warning;
    case 'en_route_pickup':
      return ConstructionTheme.colors.primary;
    case 'pickup_complete':
      return ConstructionTheme.colors.secondary;
    case 'en_route_dropoff':
      return ConstructionTheme.colors.primary;
    case 'completed':
      return ConstructionTheme.colors.success;
    default:
      return ConstructionTheme.colors.onSurfaceVariant;
  }
};

const getNextStatus = (currentStatus: TransportTask['status']): TransportTask['status'] | null => {
  switch (currentStatus) {
    case 'pending':
      return 'en_route_pickup';
    case 'en_route_pickup':
      return 'pickup_complete';
    case 'pickup_complete':
      return 'en_route_dropoff';
    case 'en_route_dropoff':
      return 'completed';
    case 'completed':
      return null;
    default:
      return null;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingTop: ConstructionTheme.spacing.xl,
    paddingBottom: ConstructionTheme.spacing.lg,
    backgroundColor: ConstructionTheme.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  subtitle: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onPrimary + 'CC',
    marginTop: 4,
  },
  refreshButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.md,
  },
  refreshButtonText: {
    color: ConstructionTheme.colors.onPrimary,
    ...ConstructionTheme.typography.headlineSmall,
    fontWeight: 'bold',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: ConstructionTheme.colors.surface,
    marginHorizontal: ConstructionTheme.spacing.lg,
    marginTop: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.md,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: ConstructionTheme.spacing.sm,
    paddingHorizontal: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: ConstructionTheme.colors.primary,
  },
  toggleButtonText: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  toggleButtonTextActive: {
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  toggleButtonTextDisabled: {
    color: ConstructionTheme.colors.onSurfaceVariant + '66',
  },
  content: {
    flex: 1,
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingTop: ConstructionTheme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ConstructionTheme.spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ConstructionTheme.spacing.lg,
  },
  tasksView: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  taskCard: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  taskCardContent: {
    // No additional styles needed, TouchableOpacity handles the press
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  taskRoute: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    flex: 1,
  },
  taskStatus: {
    ...ConstructionTheme.typography.labelLarge,
    fontWeight: 'bold',
  },
  taskInfo: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  taskDetail: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskActionButton: {
    flex: 1,
    marginHorizontal: ConstructionTheme.spacing.xs,
  },
  noTasksCard: {
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.xl,
  },
  noTasksText: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  noTasksSubtext: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  optimizationCard: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  optimizationTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSuccessContainer,
    marginBottom: ConstructionTheme.spacing.md,
    textAlign: 'center',
  },
  optimizationStats: {
    alignItems: 'center',
  },
  optimizationStat: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSuccessContainer,
    marginBottom: ConstructionTheme.spacing.sm,
    fontWeight: 'bold',
  },
  lastUpdatedContainer: {
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.md,
    marginTop: ConstructionTheme.spacing.lg,
  },
  lastUpdatedText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: ConstructionTheme.spacing.xl,
  },
});

export default TransportTasksScreen;