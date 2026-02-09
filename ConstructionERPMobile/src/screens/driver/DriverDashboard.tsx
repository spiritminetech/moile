import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  RefreshControl,
  Linking 
} from 'react-native';
import { useAuth } from '../../store/context/AuthContext';
import { useLocation } from '../../store/context/LocationContext';
import { driverApiService } from '../../services/api/DriverApiService';
import { 
  TransportTask, 
  VehicleInfo, 
  DriverDashboardResponse,
  GeoLocation 
} from '../../types';

// Import driver-specific components
import TransportTaskCard from '../../components/driver/TransportTaskCard';
import RouteMapCard from '../../components/driver/RouteMapCard';
import WorkerManifestCard from '../../components/driver/WorkerManifestCard';
import VehicleStatusCard from '../../components/driver/VehicleStatusCard';

// Import common components
import { 
  ConstructionButton, 
  ConstructionCard, 
  ConstructionLoadingIndicator,
  ErrorDisplay 
} from '../../components/common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

const DriverDashboard: React.FC = () => {
  const { state: authState, logout } = useAuth();
  const { state: locationState, getCurrentLocation } = useLocation();

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState<DriverDashboardResponse | null>(null);
  const [transportTasks, setTransportTasks] = useState<TransportTask[]>([]);
  const [assignedVehicle, setAssignedVehicle] = useState<VehicleInfo | null>(null);
  const [activeTask, setActiveTask] = useState<TransportTask | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Track total checked-in workers for today
  const [totalCheckedInToday, setTotalCheckedInToday] = useState(0);
  const [totalWorkersToday, setTotalWorkersToday] = useState(0);

  // Load dashboard data
  const loadDashboardData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      console.log('🚛 Loading driver dashboard data...');

      // Load dashboard overview
      const dashboardResponse = await driverApiService.getDashboardData();
      console.log('📊 Full dashboard response:', dashboardResponse);
      
      if (dashboardResponse.success) {
        // The response structure is: { success: true, message: "...", summary: {...} }
        // Access summary directly from the response (not from a nested data field)
        const summary = (dashboardResponse as any).summary;
        
        console.log('📊 Extracted summary:', summary);
        
        if (summary !== null && summary !== undefined) {
          // Transform backend response to match frontend expectations
          const transformedData: DriverDashboardResponse = {
            todaysTransportTasks: [], // Will be loaded separately
            assignedVehicle: summary.currentVehicle ? {
              id: summary.currentVehicle.id,
              plateNumber: summary.currentVehicle.registrationNo,
              model: summary.currentVehicle.vehicleType || 'Unknown',
              capacity: summary.currentVehicle.capacity || 0,
              fuelLevel: 75, // Default value
              maintenanceStatus: 'good' as const
            } : {
              id: 0,
              plateNumber: 'N/A',
              model: 'Not Assigned',
              capacity: 0,
              fuelLevel: 0,
              maintenanceStatus: 'good' as const
            },
            performanceMetrics: {
              onTimePerformance: 95, // Default values - will be loaded separately
              completedTrips: summary.completedTrips || 0,
              totalDistance: 0,
              fuelEfficiency: 0
            }
          };
          
          setDashboardData(transformedData);
          console.log('✅ Dashboard data loaded and transformed:', transformedData);
        } else {
          console.warn('⚠️ Dashboard response missing summary data');
        }
      } else {
        console.warn('⚠️ Dashboard API call failed');
        console.warn('⚠️ Message:', dashboardResponse.message);
      }

      // Load transport tasks
      const tasksResponse = await driverApiService.getTodaysTransportTasks();
      if (tasksResponse.success && tasksResponse.data) {
        // Load real worker manifest data for each task
        const tasksWithManifests = await Promise.all(
          tasksResponse.data.map(async (task) => {
            try {
              const manifestResponse = await driverApiService.getWorkerManifests(task.taskId);
              if (manifestResponse.success && manifestResponse.data) {
                // Transform manifest data to match expected structure
                const workerManifest = manifestResponse.data.map((worker: any) => ({
                  workerId: worker.workerId,
                  name: worker.workerName,
                  phone: worker.contactNumber || '',
                  checkedIn: worker.status === 'checked-in',
                  checkInTime: worker.status === 'checked-in' ? new Date().toISOString() : undefined,
                }));
                
                // Count checked-in workers
                const checkedInCount = workerManifest.filter(w => w.checkedIn).length;
                
                return {
                  ...task,
                  pickupLocations: [{
                    locationId: task.taskId * 100,
                    name: task.pickupLocations[0]?.name || 'Pickup Location',
                    address: task.pickupLocations[0]?.address || '',
                    coordinates: task.pickupLocations[0]?.coordinates || { latitude: 0, longitude: 0 },
                    workerManifest: workerManifest,
                    estimatedPickupTime: task.pickupLocations[0]?.estimatedPickupTime || new Date().toISOString(),
                    actualPickupTime: task.pickupLocations[0]?.actualPickupTime
                  }],
                  totalWorkers: workerManifest.length,
                  checkedInWorkers: checkedInCount
                };
              }
              return task;
            } catch (error) {
              console.warn(`⚠️ Failed to load manifest for task ${task.taskId}:`, error);
              return task;
            }
          })
        );
        
        setTransportTasks(tasksWithManifests);
        
        // Calculate totals for today
        const totalWorkers = tasksWithManifests.reduce((sum, task) => sum + (task.totalWorkers || 0), 0);
        const totalCheckedIn = tasksWithManifests.reduce((sum, task) => sum + (task.checkedInWorkers || 0), 0);
        setTotalWorkersToday(totalWorkers);
        setTotalCheckedInToday(totalCheckedIn);
        
        // Update dashboardData with transport tasks
        setDashboardData(prev => prev ? {
          ...prev,
          todaysTransportTasks: tasksWithManifests
        } : null);
        
        // Set active task (first non-completed task)
        const activeTask = tasksWithManifests.find(task => 
          task.status !== 'completed'
        );
        setActiveTask(activeTask || null);
        
        // Log summary for debugging
        console.log('✅ Transport tasks with manifests loaded:', tasksWithManifests.length);
        console.log('📊 Total workers:', totalWorkers, '| Checked in:', totalCheckedIn);
      }

      // Load assigned vehicle
      const vehicleResponse = await driverApiService.getAssignedVehicle();
      if (vehicleResponse.success && vehicleResponse.data) {
        setAssignedVehicle(vehicleResponse.data);
        
        // Update dashboardData with vehicle info
        setDashboardData(prev => prev ? {
          ...prev,
          assignedVehicle: vehicleResponse.data
        } : null);
        
        console.log('✅ Vehicle info loaded:', vehicleResponse.data.plateNumber);
      } else {
        console.warn('⚠️ No vehicle assigned or failed to load vehicle');
      }

      setLastUpdated(new Date());

    } catch (error: any) {
      console.error('❌ Dashboard loading error:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadDashboardData(false);
  }, [loadDashboardData]);

  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        }
      ]
    );
  };

  // Transport task handlers
  const handleStartRoute = useCallback(async (taskId: number) => {
    try {
      const response = await driverApiService.updateTransportTaskStatus(
        taskId, 
        'en_route_pickup',
        locationState.currentLocation || undefined,
        'Route started from dashboard'
      );

      if (response.success) {
        Alert.alert('Success', 'Route started successfully!');
        // Refresh tasks to get updated status
        const tasksResponse = await driverApiService.getTodaysTransportTasks();
        if (tasksResponse.success && tasksResponse.data) {
          setTransportTasks(tasksResponse.data);
          const updatedActiveTask = tasksResponse.data.find(task => task.taskId === taskId);
          setActiveTask(updatedActiveTask || null);
        }
      }
    } catch (error: any) {
      console.error('❌ Start route error:', error);
      Alert.alert('Error', error.message || 'Failed to start route');
    }
  }, [locationState.currentLocation]);

  const handleViewRoute = useCallback((task: TransportTask) => {
    setActiveTask(task);
    // Could navigate to a detailed route screen here
    Alert.alert('Route Details', `Viewing route details for ${task.route}`);
  }, []);

  const handleUpdateTaskStatus = useCallback(async (taskId: number, status: string) => {
    try {
      const response = await driverApiService.updateTransportTaskStatus(
        taskId, 
        status as TransportTask['status'],
        locationState.currentLocation || undefined,
        `Status updated to ${status} from dashboard`
      );

      if (response.success) {
        Alert.alert('Success', 'Task status updated successfully!');
        // Refresh tasks
        const tasksResponse = await driverApiService.getTodaysTransportTasks();
        if (tasksResponse.success && tasksResponse.data) {
          setTransportTasks(tasksResponse.data);
          const updatedActiveTask = tasksResponse.data.find(task => task.taskId === taskId);
          setActiveTask(updatedActiveTask || null);
        }
      }
    } catch (error: any) {
      console.error('❌ Update task status error:', error);
      Alert.alert('Error', error.message || 'Failed to update task status');
    }
  }, [locationState.currentLocation]);

  // Navigation handlers
  const handleNavigateToLocation = useCallback((coordinates: { latitude: number; longitude: number }, name: string) => {
    const url = `https://maps.google.com/?q=${coordinates.latitude},${coordinates.longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open navigation app');
    });
  }, []);

  // Worker manifest handlers
  const handleCheckInWorker = useCallback(async (workerId: number, locationId: number) => {
    try {
      if (!locationState.currentLocation) {
        Alert.alert('Error', 'Location not available. Please enable GPS.');
        return;
      }

      const response = await driverApiService.checkInWorker(
        locationId,
        workerId,
        locationState.currentLocation
      );

      if (response.success) {
        Alert.alert('Success', `Worker checked in successfully!`);
        
        // Immediately update local state
        if (activeTask) {
          const updatedTask = {
            ...activeTask,
            pickupLocations: activeTask.pickupLocations.map(loc => {
              if (loc.locationId === locationId) {
                return {
                  ...loc,
                  workerManifest: loc.workerManifest.map(worker => {
                    if (worker.workerId === workerId) {
                      return {
                        ...worker,
                        checkedIn: true,
                        checkInTime: new Date().toISOString()
                      };
                    }
                    return worker;
                  })
                };
              }
              return loc;
            }),
            checkedInWorkers: (activeTask.checkedInWorkers || 0) + 1
          };
          setActiveTask(updatedTask);
          
          // Update tasks list
          setTransportTasks(prev =>
            prev.map(task =>
              task.taskId === activeTask.taskId ? updatedTask : task
            )
          );
        }
        
        // Refresh tasks in background to sync with server
        handleRefresh();
      }
    } catch (error: any) {
      console.error('❌ Check in worker error:', error);
      Alert.alert('Error', error.message || 'Failed to check in worker');
    }
  }, [locationState.currentLocation, handleRefresh, activeTask]);

  const handleCheckOutWorker = useCallback(async (workerId: number, locationId: number) => {
    try {
      if (!locationState.currentLocation) {
        Alert.alert('Error', 'Location not available. Please enable GPS.');
        return;
      }

      const response = await driverApiService.checkOutWorker(
        locationId,
        workerId,
        locationState.currentLocation
      );

      if (response.success) {
        Alert.alert('Success', `Worker checked out successfully!`);
        
        // Immediately update local state
        if (activeTask) {
          const updatedTask = {
            ...activeTask,
            pickupLocations: activeTask.pickupLocations.map(loc => {
              if (loc.locationId === locationId) {
                return {
                  ...loc,
                  workerManifest: loc.workerManifest.map(worker => {
                    if (worker.workerId === workerId) {
                      return {
                        ...worker,
                        checkedIn: false,
                        checkInTime: undefined
                      };
                    }
                    return worker;
                  })
                };
              }
              return loc;
            }),
            checkedInWorkers: Math.max((activeTask.checkedInWorkers || 0) - 1, 0)
          };
          setActiveTask(updatedTask);
          
          // Update tasks list
          setTransportTasks(prev =>
            prev.map(task =>
              task.taskId === activeTask.taskId ? updatedTask : task
            )
          );
        }
        
        // Refresh tasks in background to sync with server
        handleRefresh();
      }
    } catch (error: any) {
      console.error('❌ Check out worker error:', error);
      Alert.alert('Error', error.message || 'Failed to check out worker');
    }
  }, [locationState.currentLocation, handleRefresh, activeTask]);

  const handleCallWorker = useCallback((phone: string, name: string) => {
    const url = `tel:${phone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open phone app');
    });
  }, []);

  const handleViewTripHistory = useCallback(() => {
    Alert.alert('Trip History', 'Trip history feature coming soon!');
  }, []);

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Driver Dashboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ConstructionLoadingIndicator 
            message="Loading driver dashboard..."
            size="large"
          />
        </View>
      </View>
    );
  }

  // Render error state
  if (error && !dashboardData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Driver Dashboard</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <ErrorDisplay 
            error={error}
            onRetry={() => loadDashboardData()}
            showRetry={true}
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
          <Text style={styles.title}>Driver Dashboard</Text>
          <Text style={styles.subtitle}>
            Welcome, {authState.user?.name || 'Driver'}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
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
        {/* Quick stats summary */}
        {dashboardData && (
          <ConstructionCard variant="elevated" style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>📊 Today's Overview</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {dashboardData.todaysTransportTasks?.length || 0}
                </Text>
                <Text style={styles.summaryLabel}>Transport Tasks</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {totalCheckedInToday}
                </Text>
                <Text style={styles.summarySubValue}>
                  of {totalWorkersToday}
                </Text>
                <Text style={styles.summaryLabel}>Checked In Today</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {assignedVehicle?.plateNumber || dashboardData.assignedVehicle?.plateNumber || 'N/A'}
                </Text>
                <Text style={styles.summaryLabel}>Vehicle</Text>
              </View>
            </View>
          </ConstructionCard>
        )}

        {/* Transport Tasks */}
        {transportTasks.length > 0 ? (
          transportTasks.map((task) => (
            <TransportTaskCard
              key={task.taskId}
              task={task}
              onStartRoute={handleStartRoute}
              onViewRoute={handleViewRoute}
              onUpdateStatus={handleUpdateTaskStatus}
            />
          ))
        ) : (
          <ConstructionCard variant="outlined" style={styles.noTasksCard}>
            <Text style={styles.noTasksText}>🚛 No transport tasks today</Text>
            <Text style={styles.noTasksSubtext}>Check back later or contact dispatch</Text>
          </ConstructionCard>
        )}

        {/* Route Map */}
        <RouteMapCard
          task={activeTask}
          currentLocation={locationState.currentLocation}
          onNavigateToLocation={handleNavigateToLocation}
          onRefreshLocation={getCurrentLocation}
          isLocationEnabled={locationState.isLocationEnabled}
        />

        {/* Worker Manifest */}
        <WorkerManifestCard
          task={activeTask}
          onCheckInWorker={handleCheckInWorker}
          onCheckOutWorker={handleCheckOutWorker}
          onCallWorker={handleCallWorker}
        />

        {/* Vehicle Status */}
        <VehicleStatusCard
          vehicle={assignedVehicle}
        />

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
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.md,
  },
  logoutButtonText: {
    color: ConstructionTheme.colors.onPrimary,
    ...ConstructionTheme.typography.labelLarge,
    fontWeight: 'bold',
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
  summaryCard: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  summaryTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.lg,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
    paddingVertical: ConstructionTheme.spacing.lg,
    paddingHorizontal: ConstructionTheme.spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: ConstructionTheme.colors.outline,
    marginHorizontal: ConstructionTheme.spacing.md,
  },
  noTasksCard: {
    marginBottom: ConstructionTheme.spacing.lg,
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
    height: 100, // Increased to ensure all content is visible above bottom navigation
  },
});

export default DriverDashboard;