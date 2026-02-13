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
import { useFocusEffect } from '@react-navigation/native';
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
// ✅ REMOVED: WorkerManifestCard - No longer needed in dashboard
import VehicleStatusCard from '../../components/driver/VehicleStatusCard';
import TripTrackingStatusCard from '../../components/driver/TripTrackingStatusCard';

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
  
  // Trip tracking state - Track per task ID
  const [tripTrackingData, setTripTrackingData] = useState<Record<number, {
    startTime: Date;
    logId: string;
    isTracking: boolean;
  }>>({});
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);
  
  // ✅ NEW: Show/hide completed trips section
  const [showCompletedTrips, setShowCompletedTrips] = useState(false);

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
                // ✅ FIX: Use same logic as TransportTasksScreen for consistency
                const workers = manifestResponse.data.map((worker: any) => ({
                  workerId: worker.workerId,
                  name: worker.workerName,
                  phone: worker.contactNumber || '',
                  // ✅ FIX: Check pickupStatus, not status
                  checkedIn: worker.pickupStatus === 'confirmed',
                  checkInTime: worker.pickupConfirmedAt || undefined,
                  trade: worker.trade || 'General Labor',
                  supervisorName: worker.supervisorName || 'N/A',
                  dropStatus: worker.dropStatus || 'pending',
                  wasPickedUp: worker.pickupStatus === 'confirmed',
                }));
                
                // ✅ FIX: For completed tasks, count workers who were picked up
                // For active tasks, count currently checked-in workers
                const isCompleted = task.status === 'completed' || task.status === 'COMPLETED' || task.status === 'en_route_dropoff';
                const checkedInCount = isCompleted 
                  ? workers.filter(w => w.wasPickedUp).length  // Completed: count picked up
                  : workers.filter(w => w.checkedIn).length;   // Active: count checked in
                
                console.log(`📊 Task ${task.taskId} worker counts:`, {
                  status: task.status,
                  isCompleted,
                  totalWorkers: workers.length,
                  checkedInCount,
                  workers: workers.map(w => ({
                    name: w.name,
                    pickupStatus: w.wasPickedUp ? 'confirmed' : 'pending',
                    dropStatus: w.dropStatus
                  }))
                });
                
                return {
                  ...task,
                  pickupLocations: [{
                    locationId: task.taskId * 100,
                    name: task.pickupLocations[0]?.name || 'Pickup Location',
                    address: task.pickupLocations[0]?.address || '',
                    coordinates: task.pickupLocations[0]?.coordinates || { latitude: 0, longitude: 0 },
                    workerManifest: workers,
                    estimatedPickupTime: task.pickupLocations[0]?.estimatedPickupTime || new Date().toISOString(),
                    actualPickupTime: task.pickupLocations[0]?.actualPickupTime
                  }],
                  totalWorkers: workers.length,
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

  // ✅ NEW: Refresh dashboard when screen comes into focus (after completing pickup/dropoff)
  useFocusEffect(
    useCallback(() => {
      console.log('📱 Dashboard focused - refreshing data...');
      loadDashboardData(false); // Refresh without loading spinner
    }, [loadDashboardData])
  );

  // Auto-refresh dashboard every 30 seconds
  useEffect(() => {
    const autoRefreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard...');
      loadDashboardData(false); // Refresh without showing loading spinner
    }, 30000); // 30 seconds

    return () => {
      clearInterval(autoRefreshInterval);
    };
  }, [loadDashboardData]);

  // Location tracking effect - Update location every 5 seconds when any trip is tracking
  useEffect(() => {
    let locationInterval: NodeJS.Timeout | null = null;

    // Check if any trip is being tracked
    const hasActiveTracking = Object.values(tripTrackingData).some(trip => trip.isTracking);

    if (hasActiveTracking) {
      locationInterval = setInterval(async () => {
        try {
          await getCurrentLocation();
          setLastLocationUpdate(new Date());
          console.log('📍 Location updated (background tracking)');
        } catch (error) {
          console.error('❌ Background location update error:', error);
        }
      }, 5000); // Update every 5 seconds
    }

    return () => {
      if (locationInterval) {
        clearInterval(locationInterval);
      }
    };
  }, [tripTrackingData, getCurrentLocation]);

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

  // Transport task handlers - ENHANCED: Start route with automatic navigation
  const handleStartRoute = useCallback(async (taskId: number) => {
    console.log('🚀 START ROUTE CLICKED - Task ID:', taskId);
    
    try {
      // Find the task
      const task = transportTasks.find(t => t.taskId === taskId);
      if (!task) {
        Alert.alert('Error', 'Task not found');
        return;
      }

      // Capture start time and location
      const startTime = new Date();
      console.log('⏰ Start time:', startTime.toISOString());
      
      // Get current location first with timeout
      console.log('📍 Getting current location...');
      
      // ✅ FIX: Try to get location quickly, but don't wait long
      const locationPromise = getCurrentLocation();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Location timeout')), 3000) // 3 second timeout
      );
      
      let currentLocation;
      try {
        currentLocation = await Promise.race([locationPromise, timeoutPromise]);
        console.log('📍 Got real location:', currentLocation);
      } catch (locationError) {
        console.log('⚠️ Location timeout, using default location');
        
        // ✅ FIX: Automatically use default location (no popup!)
        currentLocation = {
          latitude: 25.2048,  // Dubai default
          longitude: 55.2708,
          accuracy: 100,
          timestamp: new Date(),
        };
        console.log('📍 Using default location:', currentLocation);
      }
      
      setLastLocationUpdate(startTime);
      
      console.log('📍 Current location:', currentLocation);
      
      if (!currentLocation) {
        console.log('❌ No location available');
        Alert.alert(
          'Location Required',
          'Please enable GPS to start the route.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      console.log('📡 Calling API to update status to en_route_pickup...');
      const response = await driverApiService.updateTransportTaskStatus(
        taskId, 
        'en_route_pickup',
        currentLocation,
        'Route started from dashboard'
      );
      
      console.log('📡 API Response:', response);

      if (response.success) {
        console.log('✅ Route started successfully');
        
        // Generate trip log ID (use taskId and timestamp)
        const logId = `TRIP-${taskId}-${startTime.getTime()}`;
        
        // Store trip tracking data for this specific task
        setTripTrackingData(prev => ({
          ...prev,
          [taskId]: {
            startTime: startTime,
            logId: logId,
            isTracking: true
          }
        }));
        
        // ✅ NEW: Automatically open Google Maps DIRECTIONS (not just location)
        const pickupLocation = task.pickupLocations[0];
        console.log('📍 Pickup location data:', {
          hasPickupLocation: !!pickupLocation,
          locationName: pickupLocation?.name,
          locationAddress: pickupLocation?.address,
          hasCoordinates: !!pickupLocation?.coordinates,
          latitude: pickupLocation?.coordinates?.latitude,
          longitude: pickupLocation?.coordinates?.longitude,
        });
        
        if (pickupLocation) {
          const { coordinates, name, address } = pickupLocation;
          
          // ✅ FIX: Check if coordinates are valid (not 0,0)
          const hasValidCoordinates = coordinates && 
                                     coordinates.latitude !== 0 && 
                                     coordinates.longitude !== 0;
          
          if (hasValidCoordinates) {
            // Use coordinates for precise navigation
            const { latitude, longitude } = coordinates;
            const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
            console.log('🗺️ Opening Google Maps with coordinates:', navUrl);
            console.log('📍 Destination:', `${latitude}, ${longitude}`);
            
            try {
              await Linking.openURL(navUrl);
              console.log('✅ Google Maps directions opened successfully');
            } catch (navError) {
              console.error('❌ Failed to open Google Maps:', navError);
              Alert.alert(
                'Navigation Error',
                'Could not open Google Maps. Please navigate manually.',
                [{ text: 'OK' }]
              );
            }
          } else {
            // ✅ BETTER: Use address/name for Google Maps search
            console.log('⚠️ No valid coordinates, using address search instead');
            
            // Create search query from address or name
            const searchQuery = address || name || 'Dubai, UAE';
            const encodedQuery = encodeURIComponent(searchQuery);
            const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
            
            console.log('🗺️ Opening Google Maps with address search:', searchUrl);
            console.log('📍 Searching for:', searchQuery);
            
            try {
              await Linking.openURL(searchUrl);
              console.log('✅ Google Maps search opened successfully');
              
              // Show helpful message
              Alert.alert(
                '📍 Navigation Started',
                `Google Maps opened with search for:\n\n"${searchQuery}"\n\nPlease select the correct location from the search results.`,
                [{ text: 'OK' }]
              );
            } catch (navError) {
              console.error('❌ Failed to open Google Maps:', navError);
              
              // Fallback: Show address so driver can navigate manually
              Alert.alert(
                '📍 Navigate to Pickup Location',
                `Location: ${name}\n\nAddress:\n${address || 'Address not available'}\n\nPlease navigate manually using your preferred navigation app.`,
                [
                  { text: 'Copy Address', onPress: () => {
                    // In a real app, copy to clipboard
                    console.log('📋 Address copied to clipboard');
                  }},
                  { text: 'OK' }
                ]
              );
            }
          }
        } else {
          console.error('❌ No pickup location available');
          Alert.alert(
            '⚠️ Location Not Available',
            'Pickup location information is not available. Please contact dispatch for directions.',
            [{ text: 'OK' }]
          );
        }
        
        // ✅ REMOVED: No blocking alert for route started (too many popups)
        // The UI already shows the updated status
        console.log(`✅ Route started at ${startTime.toLocaleTimeString()}`);
        
        console.log('🔄 Refreshing tasks silently...');
        // Refresh tasks to get updated status (silent, no loading indicator)
        const tasksResponse = await driverApiService.getTodaysTransportTasks();
        console.log('📋 Tasks response:', tasksResponse);
        
        if (tasksResponse.success && tasksResponse.data) {
          setTransportTasks(tasksResponse.data);
          const updatedActiveTask = tasksResponse.data.find(task => task.taskId === taskId);
          setActiveTask(updatedActiveTask || null);
          console.log('✅ Tasks refreshed silently, active task:', updatedActiveTask);
        }
      } else {
        console.log('❌ API returned success: false', response);
        Alert.alert(
          'Failed to Start Route',
          response.message || 'Could not start route. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('❌ Start route error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      // Handle specific error types with user-friendly messages
      let errorTitle = 'Cannot Start Route';
      let errorMessage = 'Please try again.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle specific error codes
        if (errorData.error === 'ATTENDANCE_REQUIRED') {
          errorTitle = 'Clock In Required';
          errorMessage = 'Please clock in before starting your route.';
        } else if (errorData.error === 'ROUTE_START_LOCATION_NOT_APPROVED') {
          errorTitle = 'Wrong Location';
          errorMessage = errorData.details?.message || 'You must be at the depot to start the route.';
        } else if (errorData.error === 'INVALID_STATUS_TRANSITION') {
          errorTitle = 'Route Already Started';
          errorMessage = errorData.hint || 'This route has already been started.';
        } else if (errorData.error === 'INVALID_ENDPOINT_FOR_STATUS') {
          errorTitle = 'Action Not Allowed';
          errorMessage = 'Please use the correct button for this action.';
        } else {
          errorMessage = errorData.message || error.message || 'Failed to start route';
        }
      } else {
        errorMessage = error.message || 'Failed to start route';
      }
      
      Alert.alert(errorTitle, errorMessage, [{ text: 'OK' }]);
    }
  }, [getCurrentLocation, transportTasks]);

  const handleViewRoute = useCallback((task: TransportTask) => {
    setActiveTask(task);
    // Could navigate to a detailed route screen here
    Alert.alert('Route Details', `Viewing route details for ${task.route}`);
  }, []);

  const handleUpdateTaskStatus = useCallback(async (taskId: number, status: string) => {
    try {
      // Get current location and update timestamp
      const currentLocation = await getCurrentLocation();
      setLastLocationUpdate(new Date());
      
      const response = await driverApiService.updateTransportTaskStatus(
        taskId, 
        status as TransportTask['status'],
        currentLocation || undefined,
        `Status updated to ${status} from dashboard`
      );

      if (response.success) {
        Alert.alert('Success', 'Task status updated successfully!');
        
        // If completing trip, remove tracking for this task
        if (status === 'completed') {
          setTripTrackingData(prev => {
            const updated = { ...prev };
            delete updated[taskId];
            return updated;
          });
        }
        
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
  }, [getCurrentLocation]);

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

      // Update last location timestamp
      setLastLocationUpdate(new Date());

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
          
          // ✅ FIX: Also update transportTasks to refresh dashboard summary
          setTransportTasks(prev => prev.map(task => 
            task.taskId === activeTask.taskId ? updatedTask : task
          ));
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

      // Update last location timestamp
      setLastLocationUpdate(new Date());

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
          
          // ✅ FIX: Also update transportTasks to refresh dashboard summary
          setTransportTasks(prev => prev.map(task => 
            task.taskId === activeTask.taskId ? updatedTask : task
          ));
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
        {/* Quick stats summary - FIXED: Show correct counts */}
        {dashboardData && (
          <ConstructionCard variant="elevated" style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>📊 Today's Overview</Text>
              {Object.keys(tripTrackingData).length > 0 && (
                <View style={styles.trackingBadge}>
                  <View style={styles.trackingDot} />
                  <Text style={styles.trackingText}>
                    {Object.keys(tripTrackingData).length} Trip{Object.keys(tripTrackingData).length > 1 ? 's' : ''} Active
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {transportTasks.filter(t => t.status !== 'completed').length}
                </Text>
                <Text style={styles.summaryLabel}>Active Tasks</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {(() => {
                    // Calculate ONLY from active (non-completed) tasks
                    const activeTasks = transportTasks.filter(t => t.status !== 'completed');
                    const totalChecked = activeTasks.reduce((sum, task) => {
                      const checkedCount = task.pickupLocations
                        ?.flatMap(loc => loc.workerManifest || [])
                        .filter(w => w.checkedIn).length || 0;
                      return sum + checkedCount;
                    }, 0);
                    return totalChecked;
                  })()}
                </Text>
                <Text style={styles.summarySubValue}>
                  of {(() => {
                    const activeTasks = transportTasks.filter(t => t.status !== 'completed');
                    return activeTasks.reduce((sum, task) => sum + (task.totalWorkers || 0), 0);
                  })()}
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

        {/* Active Transport Tasks */}
        {transportTasks.filter(task => task.status !== 'completed').length > 0 ? (
          (() => {
            // Filter out completed tasks
            const activeTasks = transportTasks.filter(task => task.status !== 'completed');
            
            // Check if any task is currently active (not pending and not completed)
            const hasActiveTask = activeTasks.some(task => 
              task.status === 'en_route_pickup' || 
              task.status === 'pickup_complete' || 
              task.status === 'en_route_dropoff'
            );

            return activeTasks.map((task) => (
              <TransportTaskCard
                key={task.taskId}
                task={task}
                onStartRoute={handleStartRoute}
                onViewRoute={handleViewRoute}
                onUpdateStatus={handleUpdateTaskStatus}
                hasActiveTask={hasActiveTask && task.status === 'pending'}
              />
            ));
          })()
        ) : (
          <ConstructionCard variant="outlined" style={styles.noTasksCard}>
            <Text style={styles.noTasksText}>🚛 No active transport tasks</Text>
            <Text style={styles.noTasksSubtext}>All tasks completed or check back later</Text>
          </ConstructionCard>
        )}

        {/* ✅ NEW: Completed Trips Section */}
        {(() => {
          const completedTasks = transportTasks.filter(task => task.status === 'completed');
          
          if (completedTasks.length === 0) return null;
          
          return (
            <ConstructionCard variant="outlined" style={styles.completedSection}>
              <TouchableOpacity 
                style={styles.completedHeader}
                onPress={() => setShowCompletedTrips(!showCompletedTrips)}
              >
                <Text style={styles.completedTitle}>
                  ✅ Completed Today ({completedTasks.length})
                </Text>
                <Text style={styles.expandIcon}>
                  {showCompletedTrips ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
              
              {showCompletedTrips && (
                <View style={styles.completedList}>
                  {completedTasks.map((task) => {
                    // Get worker manifest from pickup locations
                    const workers = task.pickupLocations?.[0]?.workerManifest || [];
                    const pickedUpWorkers = workers.filter(w => w.wasPickedUp || w.checkedIn);
                    
                    return (
                      <View key={task.taskId} style={styles.completedTaskItem}>
                        <View style={styles.completedTaskHeader}>
                          <Text style={styles.completedTaskRoute}>
                            🚛 {task.route}
                          </Text>
                          <Text style={styles.completedBadge}>COMPLETED</Text>
                        </View>
                        <View style={styles.completedTaskDetails}>
                          <Text style={styles.completedTaskDetail}>
                            👥 {pickedUpWorkers.length}/{workers.length} workers transported
                          </Text>
                          <Text style={styles.completedTaskDetail}>
                            📍 {task.pickupLocations.length} pickup{task.pickupLocations.length > 1 ? 's' : ''}
                          </Text>
                        </View>
                        
                        {/* ✅ NEW: Show worker list like Transport screen */}
                        {workers.length > 0 && (
                          <View style={styles.workerListContainer}>
                            <Text style={styles.workerListTitle}>Workers:</Text>
                            {workers.map((worker, index) => (
                              <View key={worker.workerId} style={styles.workerListItem}>
                                <Text style={styles.workerListText}>
                                  {index + 1}. {worker.name}
                                  {worker.wasPickedUp || worker.checkedIn ? ' ✅' : ' ⏭️ (Not picked up)'}
                                </Text>
                                {worker.trade && (
                                  <Text style={styles.workerListSubtext}>
                                    {worker.trade}
                                  </Text>
                                )}
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </ConstructionCard>
          );
        })()}

        {/* Trip Tracking Status - Show ALL active trips */}
        {transportTasks
          .filter(task => 
            task.status !== 'pending' && 
            task.status !== 'completed' &&
            tripTrackingData[task.taskId]
          )
          .map(task => {
            const trackingData = tripTrackingData[task.taskId];
            return (
              <TripTrackingStatusCard
                key={task.taskId}
                task={task}
                currentLocation={locationState.currentLocation}
                isLocationTracking={trackingData.isTracking}
                lastLocationUpdate={lastLocationUpdate}
                tripStartTime={trackingData.startTime}
                tripLogId={trackingData.logId}
              />
            );
          })
        }

        {/* Route Map */}
        <RouteMapCard
          task={activeTask}
          currentLocation={locationState.currentLocation}
          onNavigateToLocation={handleNavigateToLocation}
          onRefreshLocation={() => {
            getCurrentLocation();
            setLastLocationUpdate(new Date());
          }}
          isLocationEnabled={locationState.isLocationEnabled}
        />

        {/* ✅ REMOVED: Worker Manifest Card
            This section showed workers with Check-in/Call buttons in the dashboard.
            
            REMOVED BECAUSE:
            1. Duplicate functionality - Workers are checked in through Transport Tasks screen
            2. Confusing workflow - Proper flow is: Start Route → Navigate → Pickup → Check-in
            3. "Waiting" status was unclear and confusing
            4. Check-in should happen at pickup location, not from dashboard
        */}

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
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.lg,
  },
  summaryTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    flex: 1,
  },
  trackingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ConstructionTheme.colors.success + '20',
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.md,
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ConstructionTheme.colors.success,
    marginRight: ConstructionTheme.spacing.sm,
  },
  trackingText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.success,
    fontWeight: '600',
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
  summarySubValue: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.primary,
    fontWeight: '600',
    marginBottom: 2,
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
  // ✅ NEW: Completed trips section styles
  completedSection: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  completedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.md,
  },
  completedTitle: {
    ...ConstructionTheme.typography.titleMedium,
    color: ConstructionTheme.colors.success,
    fontWeight: '600',
  },
  expandIcon: {
    ...ConstructionTheme.typography.titleMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  completedList: {
    marginTop: ConstructionTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline,
    paddingTop: ConstructionTheme.spacing.md,
  },
  completedTaskItem: {
    paddingVertical: ConstructionTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline + '40',
  },
  completedTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  completedTaskRoute: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '500',
    flex: 1,
  },
  completedBadge: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.success,
    backgroundColor: ConstructionTheme.colors.success + '20',
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: 4,
    borderRadius: ConstructionTheme.borderRadius.sm,
    fontWeight: '600',
  },
  completedTaskDetails: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.md,
  },
  completedTaskDetail: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  workerListContainer: {
    marginTop: ConstructionTheme.spacing.md,
    paddingTop: ConstructionTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline,
  },
  workerListTitle: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  workerListItem: {
    marginBottom: ConstructionTheme.spacing.xs,
  },
  workerListText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurface,
  },
  workerListSubtext: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginLeft: ConstructionTheme.spacing.md,
    fontSize: 11,
  },
});

export default DriverDashboard;