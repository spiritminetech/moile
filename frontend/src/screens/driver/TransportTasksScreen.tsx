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
  SafeAreaView,
  StatusBar,
  Image,
  AppState,
  AppStateStatus,
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
import { showPhotoOptions, PhotoResult, preparePhotoForUpload } from '../../utils/photoCapture';

// Import driver-specific components
import RouteNavigationComponent from '../../components/driver/RouteNavigationComponent';
import WorkerCheckInForm from '../../components/driver/WorkerCheckInForm';

// Import common components
import { 
  ConstructionButton, 
  ConstructionCard, 
  ConstructionLoadingIndicator,
  ErrorDisplay,
  OfflineIndicator,
  Toast
} from '../../components/common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

const TransportTasksScreen: React.FC = () => {
  const { state: authState } = useAuth();
  const { state: locationState, getCurrentLocation } = useLocation();
  const { isOffline } = useOffline();

  // Transport tasks state
  const [transportTasks, setTransportTasks] = useState<TransportTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<TransportTask | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [workerManifests, setWorkerManifests] = useState<WorkerManifest[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeView, setActiveView] = useState<'tasks' | 'navigation' | 'workers'>('tasks');

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  // Show toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

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
        // ✅ NEW: Pre-load worker manifests for all tasks to eliminate loading delay
        const tasksWithManifests = await Promise.all(
          response.data.map(async (task) => {
            try {
              // Only load manifests for active tasks (not completed)
              if (task.status !== 'completed' && task.status !== 'COMPLETED') {
                console.log(`📦 Pre-loading worker manifest for task ${task.taskId}`);
                const manifestResponse = await driverApiService.getWorkerManifests(task.taskId);
                
                if (manifestResponse.success && manifestResponse.data) {
                  const workers = manifestResponse.data.map((worker: any) => ({
                    workerId: worker.workerId,
                    name: worker.workerName,
                    phone: worker.contactNumber || '',
                    checkedIn: worker.pickupStatus === 'confirmed',
                    checkInTime: worker.pickupConfirmedAt || undefined,
                    trade: worker.trade || 'General Labor',
                    supervisorName: worker.supervisorName || 'N/A',
                    dropStatus: worker.dropStatus || 'pending',
                    wasPickedUp: worker.pickupStatus === 'confirmed',
                  }));
                  
                  // Update pickup locations with cached worker manifest
                  const updatedPickupLocations = task.pickupLocations.map(loc => ({
                    ...loc,
                    workerManifest: workers,
                  }));
                  
                  const totalWorkers = workers.length;
                  const checkedInWorkers = workers.filter(w => w.checkedIn).length;
                  
                  return {
                    ...task,
                    pickupLocations: updatedPickupLocations,
                    totalWorkers,
                    checkedInWorkers,
                  };
                }
              }
              return task;
            } catch (error) {
              console.warn(`⚠️ Failed to pre-load manifest for task ${task.taskId}:`, error);
              return task; // Return task without manifest on error
            }
          })
        );
        
        setTransportTasks(tasksWithManifests);
        
        // Auto-select first active task only on initial load
        const activeTask = tasksWithManifests.find(task => 
          task.status !== 'completed'
        );
        if (activeTask && !selectedTask && showLoading) {
          setSelectedTask(activeTask);
        }
        
        console.log('✅ Transport tasks loaded with cached manifests:', tasksWithManifests.length);
        
        // ✅ REMOVED: No toast for task loading (too many messages)
        // Users can see the tasks appear immediately
      }

      setLastUpdated(new Date());

    } catch (error: any) {
      console.error('❌ Transport tasks loading error:', error);
      setError(error.message || 'Failed to load transport tasks');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []); // Remove selectedTask dependency to prevent infinite loop

  // Load worker manifests for selected task
  const loadWorkerManifests = useCallback(async (taskId: number) => {
    try {
      console.log('👥 Loading worker manifests for task:', taskId);
      
      const response = await driverApiService.getWorkerManifests(taskId);
      if (response.success && response.data) {
        console.log('📦 RAW BACKEND RESPONSE:', JSON.stringify(response.data, null, 2));
        
        setWorkerManifests(response.data);
        console.log('✅ Worker manifests loaded:', response.data.length);
        
        // Update selected task with worker manifest data
        setSelectedTask(prevTask => {
          if (!prevTask || prevTask.taskId !== taskId) return prevTask;
          
          // ✅ FIX: Determine if we're at pickup or dropoff phase based on task status
          const isAtPickupPhase = prevTask.status === 'en_route_pickup' || 
                                  prevTask.status === 'ONGOING' ||
                                  prevTask.status === 'pending' ||
                                  prevTask.status === 'PLANNED';
          
          const isAtDropoffPhase = prevTask.status === 'pickup_complete' || 
                                   prevTask.status === 'PICKUP_COMPLETE' ||
                                   prevTask.status === 'en_route_dropoff' || 
                                   prevTask.status === 'ENROUTE_DROPOFF' ||
                                   prevTask.status === 'completed' ||
                                   prevTask.status === 'COMPLETED';
          
          console.log('📊 Task phase:', {
            status: prevTask.status,
            isAtPickupPhase,
            isAtDropoffPhase
          });
          
          // Transform worker manifests to match the expected structure
          const workers = response.data.map((worker: any) => {
            console.log(`👤 Worker ${worker.workerId} (${worker.workerName}):`, {
              pickupStatus: worker.pickupStatus,
              dropStatus: worker.dropStatus,
              pickupConfirmedAt: worker.pickupConfirmedAt,
              taskStatus: prevTask.status,
            });
            
            // ✅ FIX: During active pickup phase (BEFORE completion), ALWAYS show checkboxes
            // Only trust backend data AFTER pickup is completed
            const isActivePickupPhase = prevTask.status === 'ONGOING' || 
                                       prevTask.status === 'PLANNED' ||
                                       prevTask.status === 'pending' ||
                                       prevTask.status === 'en_route_pickup';
            
            const checkedInValue = isActivePickupPhase ? false : (worker.pickupStatus === 'confirmed');
            
            console.log(`👤 Worker ${worker.workerId} transformation:`, {
              name: worker.workerName,
              pickupStatus: worker.pickupStatus,
              dropStatus: worker.dropStatus,
              isActivePickupPhase,
              forcedCheckedIn: checkedInValue,
              taskStatus: prevTask.status,
            });
            
            return {
              workerId: worker.workerId,
              name: worker.workerName,
              phone: worker.contactNumber || '',
              // ✅ FIX: Force unchecked during active pickup, use backend data after completion
              checkedIn: checkedInValue,
              checkInTime: worker.pickupConfirmedAt || undefined,
              trade: worker.trade || 'General Labor',
              supervisorName: worker.supervisorName || 'N/A',
              // ✅ NEW: Track dropStatus for display at dropoff completion
              dropStatus: worker.dropStatus || 'pending',  // 'pending', 'confirmed', 'missed'
              wasPickedUp: worker.pickupStatus === 'confirmed',  // Track if worker was picked up
            };
          });
          
          console.log('👥 Workers loaded:', workers.map(w => ({
            id: w.workerId,
            name: w.name,
            checkedIn: w.checkedIn
          })));
          
          // Update pickup locations with worker manifest
          const updatedPickupLocations = prevTask.pickupLocations.map(loc => ({
            ...loc,
            workerManifest: workers,
          }));
          
          // ✅ FIX: Calculate correct worker counts based on phase
          const totalWorkers = workers.length;
          const checkedInWorkers = workers.filter(w => w.checkedIn).length;
          
          console.log('📊 Updated worker counts:', {
            totalWorkers,
            checkedInWorkers,
            phase: isAtDropoffPhase ? 'dropoff' : 'pickup',
            status: prevTask.status
          });
          
          return {
            ...prevTask,
            pickupLocations: updatedPickupLocations,
            totalWorkers,
            checkedInWorkers,
          };
        });
      }
    } catch (error: any) {
      console.error('❌ Worker manifests loading error:', error);
      console.warn('⚠️ Continuing without worker manifests');
    }
  }, []); // ✅ Empty dependency - function doesn't depend on any state

  // Initial load - only run once on mount
  useEffect(() => {
    loadTransportTasks();
  }, []); // Empty dependency array - run only once

  // ✅ NEW: Auto-refresh when app regains focus (after returning from Google Maps)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('📱 App became active - refreshing transport tasks...');
        loadTransportTasks(false); // Refresh without loading spinner
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [loadTransportTasks]);

  // ✅ NEW: Auto-refresh every 15 seconds when there are active tasks
  // BUT stop auto-refresh when navigation screen is active to prevent disruption
  useEffect(() => {
    const hasActiveTasks = transportTasks.some(task => 
      task.status !== 'completed' && task.status !== 'pending'
    );

    // ✅ Stop auto-refresh when navigation screen is active
    if (!hasActiveTasks || activeView === 'navigation') {
      return; // No auto-refresh if no active tasks or on navigation screen
    }

    console.log('🔄 Starting auto-refresh interval (15s) for active tasks');
    const autoRefreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing transport tasks...');
      loadTransportTasks(false); // Refresh without loading spinner
    }, 15000); // 15 seconds

    return () => {
      console.log('🛑 Stopping auto-refresh interval');
      clearInterval(autoRefreshInterval);
    };
  }, [transportTasks, loadTransportTasks, activeView]); // ✅ Added activeView dependency

  // Load worker manifests when task is selected - use taskId to prevent infinite loop
  useEffect(() => {
    if (selectedTask?.taskId) {
      const hasWorkerData = selectedTask.pickupLocations?.[0]?.workerManifest?.length > 0;
      
      console.log('🔍 useEffect manifest check:', {
        taskId: selectedTask.taskId,
        status: selectedTask.status,
        hasWorkerData
      });
      
      // ✅ OPTIMIZED: Only load if worker data is missing (should rarely happen now)
      // Worker manifests are pre-cached during task loading
      if (!hasWorkerData) {
        console.log('⚠️ Worker data missing - loading now (fallback)');
        loadWorkerManifests(selectedTask.taskId);
      } else {
        console.log('✅ Using pre-cached worker data');
      }
    }
  }, [selectedTask?.taskId, loadWorkerManifests]); // ✅ Include loadWorkerManifests to prevent stale closure

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadTransportTasks(false);
  }, [loadTransportTasks]);

  // Handle task selection
  const handleTaskSelection = useCallback((task: TransportTask) => {
    // ✅ FIX: Only clear worker manifest data during ACTIVE pickup phase IF data exists
    // This prevents the brief "No workers found" error while loading
    const isActivePickupPhase = task.status === 'ONGOING' || 
                               task.status === 'PLANNED' ||
                               task.status === 'pending' ||
                               task.status === 'en_route_pickup';
    
    const isCompleted = task.status === 'completed' || 
                       task.status === 'COMPLETED' ||
                       task.status === 'pickup_complete' ||
                       task.status === 'PICKUP_COMPLETE' ||
                       task.status === 'en_route_dropoff' ||
                       task.status === 'ENROUTE_DROPOFF';
    
    const hasWorkerData = task.pickupLocations?.[0]?.workerManifest?.length > 0;
    
    console.log('🎯 Task selection:', {
      taskId: task.taskId,
      status: task.status,
      isActivePickupPhase,
      isCompleted,
      hasWorkerData,
      willClearManifests: false,  // ✅ Never clear - let useEffect handle loading
      workerCount: task.pickupLocations?.[0]?.workerManifest?.length || 0,
      sampleWorkerName: task.pickupLocations?.[0]?.workerManifest?.[0]?.name || 'N/A'
    });
    
    // ✅ FIX: Don't clear manifests - just set the task as-is
    // The useEffect will handle loading if needed, but we keep existing data to avoid flicker
    setSelectedTask(task);
    setSelectedLocationId(null);
    setActiveView('navigation');
  }, []);

  // Handle emergency reroute
  // Handle navigation start
  const handleNavigationStart = useCallback((locationId: number) => {
      setSelectedLocationId(locationId);
      setActiveView('workers');

      // ✅ OPTIMIZED: Worker data is now pre-cached, no need to reload
      if (selectedTask) {
        const hasWorkerData = selectedTask.pickupLocations?.[0]?.workerManifest?.length > 0;
        
        if (hasWorkerData) {
          console.log('✅ Using pre-cached worker data - instant display');
        } else {
          console.log('⚠️ No cached worker data - loading now');
          loadWorkerManifests(selectedTask.taskId);
        }
      }
    }, [selectedTask, loadWorkerManifests]);

  // Handle worker check-in
  const handleWorkerCheckIn = useCallback(async (workerId: number, checkInData: any) => {
    if (!selectedTask || !selectedLocationId) {
      Alert.alert('Error', 'Invalid task or location selection');
      return;
    }

    try {
      console.log('✅ Checking in worker:', {
        workerId,
        locationId: selectedLocationId,
        taskId: selectedTask.taskId,
        checkInData
      });
      
      // ✅ FIX: Ensure we have valid location data
      const location = locationState.currentLocation || checkInData.location || {
        latitude: 0,
        longitude: 0,
        accuracy: 10,
        timestamp: new Date(),
      };
      
      console.log('📍 Check-in location:', location);
      
      const response = await driverApiService.checkInWorker(
        selectedLocationId,
        workerId,
        location
      );

      console.log('📦 Check-in response:', response);

      if (response.success) {
        console.log('✅ Worker checked in successfully');
        
        // Update local task data
        const updatedTask = { ...selectedTask };
        const locationData = updatedTask.pickupLocations.find(loc => loc.locationId === selectedLocationId);
        if (locationData) {
          const worker = locationData.workerManifest.find(w => w.workerId === workerId);
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
        
        // ✅ REMOVED: No toast notification for individual check-ins (too irritating)
      } else {
        console.error('❌ Check-in failed:', response);
        throw new Error(response.message || 'Failed to check in worker');
      }
    } catch (error: any) {
      console.error('❌ Worker check-in error:', {
        error,
        workerId,
        locationId: selectedLocationId,
        response: error.response?.data
      });
      // Provide user-friendly error message
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to check in worker. Please try again.';
      
      // Check if it's a network error
      if (errorMessage.includes('network') || errorMessage.includes('Network') || !navigator.onLine) {
        showToast('⚠️ Network error - check-in saved offline', 'warning');
      } else {
        showToast(`❌ ${errorMessage}`, 'error');
      }
      throw new Error(errorMessage); // Re-throw with friendly message
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

  // Handle report issue
  const handleReportIssue = useCallback(() => {
    if (!selectedTask) {
      Alert.alert('Error', 'No task selected');
      return;
    }

    Alert.alert(
      '🚨 Report Issue',
      'What type of issue would you like to report?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: '🚦 Traffic Delay',
          onPress: () => handleReportDelay()
        },
        {
          text: '🔧 Vehicle Breakdown',
          onPress: () => handleReportBreakdown()
        },
        {
          text: '⚠️ Other Issue',
          onPress: () => {
            Alert.alert(
              'Report Other Issue',
              'Please contact dispatch for other issues.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  }, [selectedTask]);

  // Handle report delay
  const handleReportDelay = useCallback(async () => {
    if (!selectedTask) return;

    // Delay reasons
    const delayReasons = [
      'Heavy Traffic',
      'Road Closure',
      'Accident on Route',
      'Weather Conditions',
      'Construction Work',
      'Other'
    ];

    // Show reason selection
    Alert.alert(
      '🚦 Report Traffic Delay',
      'Select delay reason:',
      [
        { text: 'Cancel', style: 'cancel' },
        ...delayReasons.map(reason => ({
          text: reason,
          onPress: () => promptDelayDetails(reason)
        }))
      ]
    );
  }, [selectedTask]);

  // Prompt for delay details
  const promptDelayDetails = useCallback(async (reason: string) => {
    if (!selectedTask) return;

    // Estimated delay options
    const delayOptions = [
      { label: '15 minutes', value: 15 },
      { label: '30 minutes', value: 30 },
      { label: '45 minutes', value: 45 },
      { label: '1 hour', value: 60 },
      { label: '1.5 hours', value: 90 },
      { label: '2+ hours', value: 120 }
    ];

    Alert.alert(
      '⏰ Estimated Delay',
      'How long do you expect the delay?',
      [
        { text: 'Cancel', style: 'cancel' },
        ...delayOptions.map(option => ({
          text: option.label,
          onPress: () => submitDelayReport(reason, option.value)
        }))
      ]
    );
  }, [selectedTask]);

  // Submit delay report
  const submitDelayReport = useCallback(async (reason: string, estimatedDelay: number) => {
    if (!selectedTask) return;

    try {
      console.log('📝 Submitting delay report:', { reason, estimatedDelay });

      const response = await driverApiService.reportDelay(selectedTask.taskId, {
        reason,
        estimatedDelay,
        location: locationState.currentLocation || undefined,
        description: `Driver reported ${reason} causing ${estimatedDelay} minute delay`,
      });

      if (response.success) {
        console.log('✅ Delay report submitted:', response.data);
        
        Alert.alert(
          '✅ Delay Reported',
          `Your delay report has been submitted successfully.\n\n` +
          `Reason: ${reason}\n` +
          `Estimated Delay: ${estimatedDelay} minutes\n` +
          `Incident ID: ${response.data?.incidentId}\n\n` +
          `Dispatch and supervisors have been notified.`,
          [{ text: 'OK' }]
        );

        // Refresh tasks to get updated status
        setTimeout(() => {
          loadTransportTasks(false);
        }, 500);
      }
    } catch (error: any) {
      console.error('❌ Delay report error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to submit delay report. Please try again or contact dispatch.'
      );
    }
  }, [selectedTask, locationState.currentLocation, loadTransportTasks]);

  // Handle report breakdown
  const handleReportBreakdown = useCallback(async () => {
    if (!selectedTask) return;

    // Breakdown reasons
    const breakdownReasons = [
      'Engine Problem',
      'Flat Tire',
      'Battery Dead',
      'Overheating',
      'Brake Issue',
      'Transmission Problem',
      'Other Mechanical Issue'
    ];

    Alert.alert(
      '🔧 Report Vehicle Breakdown',
      'Select breakdown type:',
      [
        { text: 'Cancel', style: 'cancel' },
        ...breakdownReasons.map(reason => ({
          text: reason,
          onPress: () => promptBreakdownSeverity(reason)
        }))
      ]
    );
  }, [selectedTask]);

  // Prompt for breakdown severity
  const promptBreakdownSeverity = useCallback(async (breakdownType: string) => {
    if (!selectedTask) return;

    Alert.alert(
      '⚠️ Breakdown Severity',
      'How severe is the breakdown?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Minor - Can continue slowly',
          onPress: () => submitBreakdownReport(breakdownType, 'minor')
        },
        {
          text: 'Moderate - Need assistance soon',
          onPress: () => submitBreakdownReport(breakdownType, 'moderate')
        },
        {
          text: 'Severe - Cannot continue',
          style: 'destructive',
          onPress: () => submitBreakdownReport(breakdownType, 'severe')
        }
      ]
    );
  }, [selectedTask]);

  // Submit breakdown report
  const submitBreakdownReport = useCallback(async (breakdownType: string, severity: string) => {
    if (!selectedTask) return;

    try {
      console.log('📝 Submitting breakdown report:', { breakdownType, severity });

      const response = await driverApiService.reportBreakdown(selectedTask.taskId, {
        breakdownType,
        severity,
        requiresAssistance: severity === 'moderate' || severity === 'severe',
        location: locationState.currentLocation || undefined,
        description: `Driver reported ${breakdownType} with ${severity} severity`,
      });

      if (response.success) {
        console.log('✅ Breakdown report submitted:', response.data);
        
        Alert.alert(
          '✅ Breakdown Reported',
          `Your breakdown report has been submitted successfully.\n\n` +
          `Issue: ${breakdownType}\n` +
          `Severity: ${severity.toUpperCase()}\n` +
          `Incident ID: ${response.data?.incidentId}\n\n` +
          `${severity === 'severe' ? 'Emergency assistance has been requested. ' : ''}Dispatch will contact you shortly.`,
          [{ text: 'OK' }]
        );

        // Refresh tasks to get updated status
        setTimeout(() => {
          loadTransportTasks(false);
        }, 500);
      }
    } catch (error: any) {
      console.error('❌ Breakdown report error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to submit breakdown report. Please call dispatch immediately.'
      );
    }
  }, [selectedTask, locationState.currentLocation, loadTransportTasks]);

  // Handle pickup completion
  const handleCompletePickup = useCallback(async (locationId: number, selectedWorkerIds?: number[], providedPhoto?: PhotoResult) => {
    console.log('🔍 handleCompletePickup called:', {
      locationId,
      selectedWorkerIds,
      hasProvidedPhoto: !!providedPhoto,
      providedPhotoFileName: providedPhoto?.fileName,
    });
    
    if (!selectedTask) {
      Alert.alert('Error', 'No task selected');
      return;
    }

    // Check if this is a dropoff (locationId === -1)
    if (locationId === -1) {
      console.log('🔄 Redirecting to handleCompleteDropoff with photo:', !!providedPhoto);
      return handleCompleteDropoff(locationId, selectedWorkerIds, providedPhoto);
    }

    try {
      const location = selectedTask.pickupLocations.find(loc => loc.locationId === locationId);
      if (!location) {
        Alert.alert('Error', 'Location not found');
        return;
      }

      const checkedInWorkers = location.workerManifest.filter(w => w.checkedIn).length;
      const totalWorkers = location.workerManifest.length;
      
      // ✅ FIX: Require at least 1 worker checked in
      if (checkedInWorkers === 0) {
        Alert.alert(
          '❌ No Workers Checked In',
          'You must check in at least one worker before completing pickup.\n\nPlease check in workers first.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Step 1: Verify worker count
      if (checkedInWorkers < totalWorkers) {
        const uncheckedCount = totalWorkers - checkedInWorkers;
        const proceed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            '⚠️ Incomplete Check-in',
            `${uncheckedCount} worker(s) not checked in.\n\nChecked in: ${checkedInWorkers}/${totalWorkers}\n\nContinue with pickup?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Continue Anyway', style: 'destructive', onPress: () => resolve(true) }
            ]
          );
        });
        
        if (!proceed) return;
      }
      
      // Step 2: Use provided photo (no popup asking for photo)
      let capturedPhoto: PhotoResult | null = providedPhoto ? providedPhoto : null;
      
      console.log('📸 Photo check in handleCompletePickup:', {
        providedPhoto,
        providedPhotoExists: !!providedPhoto,
        capturedPhoto,
        capturedPhotoExists: !!capturedPhoto,
      });
      
      // ✅ REMOVED: No photo popup at all
      // User already had the option to take photo inline
      // If they didn't take it, they don't want it
      console.log(capturedPhoto ? '✅ Using photo from form' : 'ℹ️ No photo provided - user chose not to take photo');
      
      // Step 3: Final confirmation
      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          '✅ Complete Pickup',
          `Confirm pickup completion:\n\n` +
          `Location: ${location.name}\n` +
          `Workers: ${checkedInWorkers}/${totalWorkers}\n` +
          `Photo: ${capturedPhoto ? 'Attached ✓' : 'Not attached'}\n` +
          `GPS: ${locationState.currentLocation ? 'Available ✓' : 'Unavailable'}`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Confirm Pickup', onPress: () => resolve(true) }
          ]
        );
      });
      
      if (!confirmed) return;
      
      console.log('🚌 Completing pickup for location:', locationId, 'with', checkedInWorkers, 'workers');
      
      // Upload photo in background (non-blocking)
      let photoUploadPromise: Promise<any> | null = null;
      if (capturedPhoto) {
        console.log('📤 Starting background photo upload...');
        const photoFormData = preparePhotoForUpload(capturedPhoto);
        
        // Start upload but don't wait for it
        photoUploadPromise = driverApiService.uploadPickupPhoto(
          selectedTask.taskId,
          locationId,
          photoFormData
        ).then(uploadResponse => {
          if (uploadResponse.success) {
            console.log('✅ Pickup photo uploaded successfully:', uploadResponse.data?.photoUrl);
          } else {
            console.warn('⚠️ Photo upload failed (non-critical):', uploadResponse.message);
          }
          return uploadResponse;
        }).catch(uploadError => {
          console.error('❌ Photo upload error (non-critical):', uploadError.message || uploadError);
          // ✅ Don't show error to user - photo is optional
          // Backend endpoint might not be implemented yet
          return { success: false, error: uploadError };
        });
      }
      
      // Complete pickup immediately (don't wait for photo)
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
        console.log('✅ Pickup completed successfully');
        
        // ✅ FIX: Immediately update local state with new status FIRST
        const newStatus = response.data?.status || 'PICKUP_COMPLETE';
        
        // Calculate checked-in workers from current state
        const checkedInWorkers = location.workerManifest.filter(w => w.checkedIn).length;
        
        // Update selected task immediately
        if (selectedTask) {
          const updatedTask = {
            ...selectedTask,
            status: newStatus,
            checkedInWorkers: checkedInWorkers,  // ✅ Update count immediately
            totalWorkers: location.workerManifest.length,
            pickupLocations: selectedTask.pickupLocations.map(loc =>
              loc.locationId === locationId
                ? { 
                    ...loc, 
                    completed: true, 
                    actualPickupTime: new Date().toISOString(),
                    workerManifest: location.workerManifest  // ✅ Use location data (correct status)
                  }
                : loc
            ),
          };
          setSelectedTask(updatedTask);
          
          // Update tasks list
          setTransportTasks(prev =>
            prev.map(task =>
              task.taskId === selectedTask.taskId
                ? updatedTask
                : task
            )
          );
        }
        
        // ✅ NEW: Immediately refresh task list from backend to sync status
        console.log('🔄 Refreshing task list immediately after pickup completion...');
        setTimeout(() => {
          loadTransportTasks(false); // Refresh without loading spinner
        }, 500); // Small delay to allow backend to process
        
        // ✅ FIX: DON'T reload worker manifests - keep the correct data we just set
        // The backend might return incorrect data, so we trust our local state
        console.log('✅ Pickup state updated, NOT reloading manifests to preserve correct data');
        
        console.log('✅ State updated, showing success message');
        
        // Move to next location or navigation view
        setActiveView('navigation');
        setSelectedLocationId(null);
        
        // ✅ REMOVED: No toast for pickup complete (too many messages)
        // The UI already shows completion status clearly
        console.log(`✅ Pickup complete at ${location.name} - ${checkedInWorkers} workers picked up`);
        
        // Wait for photo upload to complete in background (optional)
        if (photoUploadPromise) {
          photoUploadPromise.then(result => {
            if (result.success) {
              console.log('✅ Background photo upload completed');
              // ✅ REMOVED: No toast for photo upload (silent background operation)
            } else {
              console.warn('⚠️ Background photo upload failed, but pickup is already complete');
              // ✅ REMOVED: Don't show warning toast - photo is optional and backend might not support it yet
            }
          });
        }
      }
    } catch (error: any) {
      console.error('❌ Complete pickup error:', error);
      
      // Check if it's a network error
      if (error.message?.includes('network') || error.message?.includes('Network') || !navigator.onLine) {
        showToast('⚠️ Network error - pickup saved offline and will sync later', 'warning');
      } else {
        Alert.alert('Error', error.message || 'Failed to complete pickup');
      }
    }
  }, [selectedTask, locationState.currentLocation, handleRefresh, handleCompleteDropoff]);

  // Handle complete dropoff
  const handleCompleteDropoff = useCallback(async (locationId: number, selectedWorkerIds?: number[], providedPhoto?: PhotoResult) => {
    console.log('🔍 handleCompleteDropoff called:', {
      locationId,
      selectedWorkerIds,
      hasProvidedPhoto: !!providedPhoto,
      providedPhotoFileName: providedPhoto?.fileName,
    });
    
    if (!selectedTask) {
      Alert.alert('Error', 'No task selected');
      return;
    }

    try {
      const location = selectedTask.dropoffLocation;
      if (!location) {
        Alert.alert('Error', 'Dropoff location not found');
        return;
      }

      // ✅ FIX: Use selectedWorkerIds if provided, otherwise get all checked-in workers
      const checkedInWorkers = selectedTask.pickupLocations.flatMap(loc => 
        (loc.workerManifest || []).filter(w => w.checkedIn)
      );
      
      // If specific workers selected, use those; otherwise use all checked-in workers
      const workerIds = selectedWorkerIds && selectedWorkerIds.length > 0
        ? selectedWorkerIds
        : checkedInWorkers.map(w => w.workerId);
      
      const totalWorkers = workerIds.length;
      
      console.log('🚌 Dropoff worker selection:', {
        selectedWorkerIds,
        totalCheckedIn: checkedInWorkers.length,
        droppingOff: totalWorkers,
        workerIds
      });
      
      // Step 1: Verify worker count
      if (totalWorkers === 0) {
        Alert.alert('Error', 'No workers selected for dropoff. Please select workers or check in workers first.');
        return;
      }
      
      // Step 2: Verify geofence (location check)
      const isWithinGeofence = locationState.currentLocation ? true : false; // Simplified check
      
      if (!isWithinGeofence) {
        Alert.alert(
          '⚠️ Location Warning',
          'GPS location not available. Ensure you are at the drop location.',
          [{ text: 'OK' }]
        );
      }
      
      // Step 3: Use provided photo (no popup asking for photo)
      let capturedPhoto: PhotoResult | null = providedPhoto ? providedPhoto : null;
      
      console.log('📸 Photo check in handleCompleteDropoff:', {
        providedPhoto,
        providedPhotoExists: !!providedPhoto,
        capturedPhoto,
        capturedPhotoExists: !!capturedPhoto,
      });
      
      // ✅ REMOVED: No photo popup at all
      // User already had the option to take photo inline
      // If they didn't take it, they don't want it
      console.log(capturedPhoto ? '✅ Using photo from form' : 'ℹ️ No photo provided - user chose not to take photo');
      
      // Step 4: Final confirmation
      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          '✅ Complete Drop-off',
          `Confirm drop-off completion:\n\n` +
          `Location: ${location.name}\n` +
          `Workers: ${totalWorkers}\n` +
          `Photo: ${capturedPhoto ? 'Attached ✓' : 'Not attached'}\n` +
          `GPS: ${locationState.currentLocation ? 'Within geofence ✓' : 'Location unavailable'}`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Confirm Drop-off', onPress: () => resolve(true) }
          ]
        );
      });
      
      if (!confirmed) return;
      
      console.log('🏗️ Completing dropoff at:', location.name);
      console.log('   Total workers on vehicle:', totalWorkers);
      console.log('   Worker IDs:', workerIds);
      
      // Upload photo in background (non-blocking) - same as pickup flow
      let photoUploadPromise: Promise<any> | null = null;
      if (capturedPhoto) {
        console.log('📤 Starting background photo upload...');
        const photoFormData = preparePhotoForUpload(capturedPhoto);
        
        // Start upload but don't wait for it
        photoUploadPromise = driverApiService.uploadDropoffPhoto(
          selectedTask.taskId,
          photoFormData
        ).then(uploadResponse => {
          if (uploadResponse.success) {
            console.log('✅ Dropoff photo uploaded successfully:', uploadResponse.data?.photoUrl);
          } else {
            console.warn('⚠️ Photo upload failed (non-critical):', uploadResponse.message);
          }
          return uploadResponse;
        }).catch(uploadError => {
          console.error('❌ Photo upload error (non-critical):', uploadError.message || uploadError);
          // ✅ Don't show error to user - photo is optional
          return { success: false, error: uploadError };
        });
      }
      
      // Complete dropoff immediately (don't wait for photo)
      const response = await driverApiService.confirmDropoffComplete(
        selectedTask.taskId,
        locationState.currentLocation || {
          latitude: location.coordinates.latitude,
          longitude: location.coordinates.longitude,
          accuracy: 10,
          timestamp: new Date(),
        },
        totalWorkers,
        `Dropoff completed with ${totalWorkers} workers`,
        undefined,  // photo
        workerIds   // ✅ NEW: Send worker IDs
      );

      if (response.success) {
        console.log('✅ Dropoff completed successfully');
        
        // ✅ FIX: Immediately update local state with new status FIRST
        const newStatus = response.data?.status || 'COMPLETED';
        
        // Update selected task immediately
        if (selectedTask) {
          // ✅ FIX: Update worker manifests with dropStatus
          const updatedPickupLocations = selectedTask.pickupLocations.map(loc => ({
            ...loc,
            workerManifest: loc.workerManifest.map(w => {
              const newDropStatus = workerIds && workerIds.includes(w.workerId) ? 'confirmed' : w.dropStatus || 'pending';
              console.log(`👤 Updating worker ${w.workerId} (${w.name}):`, {
                oldDropStatus: w.dropStatus,
                newDropStatus,
                isInWorkerIds: workerIds?.includes(w.workerId),
                workerIds
              });
              return {
                ...w,
                // ✅ Set dropStatus based on whether worker was in the workerIds list
                dropStatus: newDropStatus,
              };
            })
          }));
          
          const updatedTask = {
            ...selectedTask,
            status: newStatus,
            checkedInWorkers: totalWorkers,  // ✅ Update count immediately
            totalWorkers: totalWorkers,
            pickupLocations: updatedPickupLocations,  // ✅ Update with dropStatus
            dropoffLocation: {
              ...location,
              actualArrival: new Date().toISOString(),
            },
          };
          
          console.log('📊 Updated task with dropStatus:', {
            workerIds,
            updatedWorkers: updatedPickupLocations[0]?.workerManifest?.map(w => ({
              id: w.workerId,
              name: w.name,
              dropStatus: w.dropStatus,
            }))
          });
          
          setSelectedTask(updatedTask);
          
          // Update tasks list
          setTransportTasks(prev =>
            prev.map(task =>
              task.taskId === selectedTask.taskId
                ? updatedTask
                : task
            )
          );
        }
        
        // ✅ NEW: Immediately refresh task list from backend to sync status
        console.log('🔄 Refreshing task list immediately after dropoff completion...');
        setTimeout(() => {
          loadTransportTasks(false); // Refresh without loading spinner
        }, 500); // Small delay to allow backend to process
        
        // ✅ FIX: DON'T reload worker manifests - keep the correct data we just set
        // The backend might return incorrect data, so we trust our local state
        console.log('✅ Dropoff state updated, NOT reloading manifests to preserve correct data');
        
        console.log('✅ State updated, showing success message');
        
        // Return to tasks view
        setActiveView('tasks');
        setSelectedLocationId(null);
        setSelectedTask(null);
        
        // ✅ REMOVED: No toast for dropoff complete (too many messages)
        // The UI already shows completion status clearly
        console.log(`✅ Drop-off complete at ${location.name} - ${totalWorkers} workers delivered`);
        
        // Wait for photo upload to complete in background (optional)
        if (photoUploadPromise) {
          photoUploadPromise.then(result => {
            if (result.success) {
              console.log('✅ Background photo upload completed');
              // ✅ REMOVED: No toast for photo upload (silent background operation)
            } else {
              console.warn('⚠️ Background photo upload failed, but dropoff is already complete');
              // ✅ REMOVED: Don't show warning toast - photo is optional
            }
          });
        }
      }
    } catch (error: any) {
      console.error('❌ Complete dropoff error:', error);
      
      // Check if it's a network error
      if (error.message?.includes('network') || error.message?.includes('Network') || !navigator.onLine) {
        showToast('⚠️ Network error - dropoff saved offline and will sync later', 'warning');
      } else {
        Alert.alert('Error', error.message || 'Failed to complete dropoff');
      }
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
        
        // ✅ REMOVED: No toast for status update (too many messages)
        console.log(`✅ Task status updated to ${status.replace('_', ' ')}`);
      }
    } catch (error: any) {
      console.error('❌ Task status update error:', error);
      
      // Check if it's a network error
      if (error.message?.includes('network') || error.message?.includes('Network') || !navigator.onLine) {
        showToast('⚠️ Network error - status update will sync when online', 'warning');
      } else {
        showToast(`❌ ${error.message || 'Failed to update task status'}`, 'error');
      }
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
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
            onCompletePickup={handleCompletePickup}
            onCompleteDropoff={handleCompleteDropoff}
            onUpdateTaskStatus={(status) => handleTaskStatusUpdate(selectedTask.taskId, status)}
            onReportIssue={handleReportIssue}
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

      {/* Toast Notification */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onDismiss={() => setToastVisible(false)}
        duration={3000}
      />
    </SafeAreaView>
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