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
import { useOffline } from '../../store/context/OfflineContext';
import { driverApiService } from '../../services/api/DriverApiService';
import { 
  TransportTask, 
  VehicleInfo, 
  DriverPerformance, 
  DriverDashboardResponse,
  GeoLocation 
} from '../../types';

// Import driver-specific components
import TransportTaskCard from '../../components/driver/TransportTaskCard';
import RouteMapCard from '../../components/driver/RouteMapCard';
import WorkerManifestCard from '../../components/driver/WorkerManifestCard';
import VehicleStatusCard from '../../components/driver/VehicleStatusCard';
import PerformanceMetricsCard from '../../components/driver/PerformanceMetricsCard';

// Import common components
import { 
  ConstructionButton, 
  ConstructionCard, 
  ConstructionLoadingIndicator,
  ErrorDisplay,
  OfflineIndicator 
} from '../../components/common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

const DriverDashboard: React.FC = () => {
  const { state: authState, logout } = useAuth();
  const { state: locationState, getCurrentLocation } = useLocation();
  const { isOffline } = useOffline();

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState<DriverDashboardResponse | null>(null);
  const [transportTasks, setTransportTasks] = useState<TransportTask[]>([]);
  const [assignedVehicle, setAssignedVehicle] = useState<VehicleInfo | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<DriverPerformance | null>(null);
  const [activeTask, setActiveTask] = useState<TransportTask | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
      if (dashboardResponse.success && dashboardResponse.data) {
        setDashboardData(dashboardResponse.data);
        console.log('✅ Dashboard data loaded');
      }

      // Load transport tasks
      const tasksResponse = await driverApiService.getTodaysTransportTasks();
      if (tasksResponse.success && tasksResponse.data) {
        setTransportTasks(tasksResponse.data);
        
        // Set active task (first non-completed task)
        const activeTask = tasksResponse.data.find(task => 
          task.status !== 'completed'
        );
        setActiveTask(activeTask || null);
        
        console.log('✅ Transport tasks loaded:', tasksResponse.data.length);
      }

      // Load assigned vehicle
      const vehicleResponse = await driverApiService.getAssignedVehicle();
      if (vehicleResponse.success && vehicleResponse.data) {
        setAssignedVehicle(vehicleResponse.data);
        console.log('✅ Vehicle info loaded');
      }

      // Load performance metrics
      const performanceResponse = await driverApiService.getPerformanceMetrics();
      if (performanceResponse.success && performanceResponse.data) {
        setPerformanceMetrics(performanceResponse.data);
        console.log('✅ Performance metrics loaded');
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
        // Refresh tasks to update worker status
        handleRefresh();
      }
    } catch (error: any) {
      console.error('❌ Check in worker error:', error);
      Alert.alert('Error', error.message || 'Failed to check in worker');
    }
  }, [locationState.currentLocation, handleRefresh]);

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
        // Refresh tasks to update worker status
        handleRefresh();
      }
    } catch (error: any) {
      console.error('❌ Check out worker error:', error);
      Alert.alert('Error', error.message || 'Failed to check out worker');
    }
  }, [locationState.currentLocation, handleRefresh]);

  const handleCallWorker = useCallback((phone: string, name: string) => {
    const url = `tel:${phone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open phone app');
    });
  }, []);

  // Vehicle handlers
  const handleLogFuel = useCallback(() => {
    Alert.alert('Fuel Log', 'Fuel logging feature coming soon!');
  }, []);

  const handleReportIssue = useCallback(() => {
    Alert.alert('Report Issue', 'Vehicle issue reporting feature coming soon!');
  }, []);

  const handleViewMaintenance = useCallback(() => {
    Alert.alert('Maintenance', 'Vehicle maintenance details coming soon!');
  }, []);

  // Performance handlers
  const handleViewPerformanceDetails = useCallback(() => {
    Alert.alert('Performance Details', 'Detailed performance analytics coming soon!');
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
          <Text style={styles.title}>Driver Dashboard</Text>
          <Text style={styles.subtitle}>
            Welcome, {authState.user?.name || 'Driver'}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Offline indicator */}
      {isOffline && <OfflineIndicator />}

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
                <Text style={styles.summaryValue}>{dashboardData.todaysTransportTasks.length}</Text>
                <Text style={styles.summaryLabel}>Transport Tasks</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {dashboardData.todaysTransportTasks.reduce((sum, task) => sum + task.workerCount, 0)}
                </Text>
                <Text style={styles.summaryLabel}>Workers</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {dashboardData.assignedVehicle?.plateNumber || 'N/A'}
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
              isOffline={isOffline}
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
          isOffline={isOffline}
        />

        {/* Worker Manifest */}
        <WorkerManifestCard
          task={activeTask}
          onCheckInWorker={handleCheckInWorker}
          onCheckOutWorker={handleCheckOutWorker}
          onCallWorker={handleCallWorker}
          isOffline={isOffline}
        />

        {/* Vehicle Status */}
        <VehicleStatusCard
          vehicle={assignedVehicle}
          onLogFuel={handleLogFuel}
          onReportIssue={handleReportIssue}
          onViewMaintenance={handleViewMaintenance}
          isOffline={isOffline}
        />

        {/* Performance Metrics */}
        <PerformanceMetricsCard
          performance={performanceMetrics}
          onViewDetails={handleViewPerformanceDetails}
          onViewHistory={handleViewTripHistory}
          isLoading={false}
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
    height: ConstructionTheme.spacing.xl,
  },
});

export default DriverDashboard;