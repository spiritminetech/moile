// Today's Tasks Screen - Display and manage worker's daily task assignments
// Requirements: 4.1, 4.2, 4.3, 4.6

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { TaskAssignment, GeoLocation } from '../../types';
import { workerApiService } from '../../services/api/WorkerApiService';
import { useLocation } from '../../store/context/LocationContext';
import { useOffline } from '../../store/context/OfflineContext';
import { STORAGE_KEYS } from '../../utils/constants';
import TaskCard from '../../components/cards/TaskCard';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import OfflineIndicator from '../../components/common/OfflineIndicator';

const TodaysTasksScreen = ({ navigation, route }: any) => {
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiCallInProgress, setIsApiCallInProgress] = useState(false); // Prevent multiple calls
  const [loadingTimeout, setLoadingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null); // Track expanded task
  const hasInitiallyLoaded = useRef(false); // Track if we've loaded once

  const { state: locationState, checkGPSAccuracy, requestLocationPermissions, getCurrentLocation } = useLocation();
  const { currentLocation, isLocationEnabled, hasLocationPermission } = locationState;
  const { isOffline, getCachedData, cacheData } = useOffline();

  // Debug location state - PRODUCTION MODE LOGGING (always visible)
  useEffect(() => {
    console.log('='.repeat(80));
    console.log('📍 PRODUCTION MODE - LOCATION STATE DEBUG');
    console.log('='.repeat(80));
    console.log('Current Location:', currentLocation);
    console.log('  - Has Location:', !!currentLocation);
    if (currentLocation) {
      console.log('  - Latitude:', currentLocation.latitude);
      console.log('  - Longitude:', currentLocation.longitude);
      console.log('  - Accuracy:', currentLocation.accuracy);
    } else {
      console.log('  ⚠️ NO LOCATION AVAILABLE');
    }
    console.log('Location Permission:', hasLocationPermission);
    console.log('Location Enabled:', isLocationEnabled);
    console.log('Location Error:', locationState.locationError);
    console.log('Development Mode (__DEV__):', __DEV__);
    console.log('='.repeat(80));
  }, [currentLocation, hasLocationPermission, isLocationEnabled, locationState]);

  // Handle refresh parameter from navigation
  useEffect(() => {
    if (route.params?.refresh) {
      console.log('🔄 Refresh requested from navigation params');
      hasInitiallyLoaded.current = false; // Reset to allow reload
      loadTasks();
      // Clear the refresh parameter to prevent repeated refreshes
      navigation.setParams({ refresh: undefined });
    }
  }, [route.params?.refresh, navigation]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [loadingTimeout]);

  // Debug authentication status and task count
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        const tokenExpiry = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
        
        console.log('🔐 Auth Debug in TodaysTasksScreen:', {
          hasToken: !!token,
          tokenLength: token?.length,
          tokenPreview: token?.substring(0, 30) + '...',
          hasUserData: !!userData,
          userData: userData ? JSON.parse(userData) : null,
          tokenExpiry: tokenExpiry,
          isExpired: tokenExpiry ? new Date(tokenExpiry) < new Date() : 'unknown'
        });
        
        if (!token) {
          console.log('❌ No auth token found - user may not be logged in');
          setError('Authentication required. Please log in again.');
        } else if (tokenExpiry && new Date(tokenExpiry) < new Date()) {
          console.log('❌ Auth token expired');
          setError('Session expired. Please log in again.');
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };
    
    checkAuth();
  }, []);

  // Debug task count updates
  useEffect(() => {
    console.log('📊 TodaysTasksScreen - Tasks updated:', {
      tasksLength: tasks.length,
      tasksArray: tasks,
      isLoading,
      error
    });
  }, [tasks, isLoading, error]);

  // Calculate total daily targets
  const calculateDailyTargetSummary = useCallback(() => {
    if (!tasks || tasks.length === 0) return null;
    
    const tasksWithTargets = tasks.filter(t => t.dailyTarget);
    if (tasksWithTargets.length === 0) return null;
    
    // Group by unit
    const targetsByUnit: { [unit: string]: { total: number; achieved: number; count: number } } = {};
    
    tasksWithTargets.forEach(task => {
      if (task.dailyTarget) {
        const unit = task.dailyTarget.unit;
        if (!targetsByUnit[unit]) {
          targetsByUnit[unit] = { total: 0, achieved: 0, count: 0 };
        }
        targetsByUnit[unit].total += task.dailyTarget.quantity;
        targetsByUnit[unit].achieved += task.actualOutput || 0;
        targetsByUnit[unit].count += 1;
      }
    });
    
    return targetsByUnit;
  }, [tasks]);

  const dailyTargetSummary = calculateDailyTargetSummary();

  // Load tasks data with request deduplication and cache management
  const loadTasks = useCallback(async (showLoading = true, forceClearCache = false) => {
    // Prevent multiple simultaneous API calls
    if (isApiCallInProgress) {
      console.log('🚫 API call already in progress, skipping...');
      return;
    }

    try {
      setIsApiCallInProgress(true);
      if (showLoading) setIsLoading(true);
      setError(null);

      // Set a timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        console.log('⏰ Loading timeout reached');
        setIsLoading(false);
        setIsRefreshing(false);
        setIsApiCallInProgress(false);
        setError('Loading timed out. Please try again.');
      }, 20000); // 20 second timeout
      
      setLoadingTimeout(timeout);

      console.log('🔄 Loading tasks...', { isOffline, showLoading, forceClearCache });

      // Only clear cache if explicitly requested via forceClearCache parameter
      if (forceClearCache) {
        console.log('🗑️ Force clearing cache (explicit request)...');
        try {
          await AsyncStorage.removeItem('offline_tasks');
          await AsyncStorage.removeItem('tasks');
          await cacheData('tasks', []);
          setTasks([]);
        } catch (cacheError) {
          console.error('⚠️ Error clearing cache:', cacheError);
        }
      }

      if (isOffline) {
        console.log('📱 App is offline, loading cached data');
        const cachedTasks = getCachedData('tasks') as TaskAssignment[];
        console.log('📦 Cached tasks found:', cachedTasks.length);
        setTasks(cachedTasks);
        clearTimeout(timeout);
        return;
      }

      console.log('🌐 Making API call to getTodaysTasks...');
      const startTime = Date.now();
      
      const response = await workerApiService.getTodaysTasks();
      
      // Clear timeout on successful response
      clearTimeout(timeout);
      
      const duration = Date.now() - startTime;
      console.log(`⏱️ API call completed in ${duration}ms`);
      console.log('📊 API Response:', {
        success: response.success,
        dataType: typeof response.data,
        dataLength: Array.isArray(response.data) ? response.data.length : 'not array',
        message: response.message
      });
      
      if (response.success) {
        const tasksData = Array.isArray(response.data) ? response.data : [];
        console.log('✅ Tasks loaded successfully:', tasksData.length);
        
        // Update state with fresh data
        setTasks(tasksData);
        
        // Cache the fresh data for offline use (always update cache with latest data)
        if (tasksData.length === 0) {
          console.log('📋 API returned 0 tasks - caching empty state');
          await cacheData('tasks', []);
        } else {
          console.log('📋 Caching', tasksData.length, 'tasks for offline use');
          await cacheData('tasks', tasksData);
        }
        
        setError(null);
      } else {
        const errorMsg = response.message || 'Failed to load tasks';
        console.log('❌ API returned error:', errorMsg);
        setError(errorMsg);
        // Set empty array on API error and clear cache
        setTasks([]);
        await cacheData('tasks', []);
      }
    } catch (err: any) {
      // Clear timeout on error
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      
      console.error('💥 Error loading tasks:', {
        message: err.message,
        code: err.code,
        stack: err.stack?.substring(0, 200)
      });
      
      const errorMessage = err.message || 'Failed to load tasks';
      
      // Check for specific error types
      if (err.message?.includes('Network Error') || err.code === 'NETWORK_ERROR') {
        setError('Network connection failed. Please check your internet connection and server availability.');
        // Don't use cached data on network error - show error instead
        setTasks([]);
      } else if (err.message?.includes('timeout') || err.code === 'ECONNABORTED') {
        setError('Request timed out. The server may be slow or unavailable.');
        setTasks([]);
      } else if (err.message?.includes('401') || err.code === 'UNAUTHORIZED') {
        setError('Authentication failed. Please log in again.');
        setTasks([]);
        // Clear cache on auth error
        await cacheData('tasks', []);
      } else {
        setError(`Connection error: ${errorMessage}`);
        // Try to load cached data on error ONLY if we have valid cached data
        const cachedTasks = getCachedData('tasks') as TaskAssignment[];
        if (cachedTasks.length > 0) {
          console.log('📦 Using cached tasks as fallback:', cachedTasks.length);
          setTasks(cachedTasks);
          setError('Using cached data - please check your connection');
        } else {
          setTasks([]);
        }
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsApiCallInProgress(false);
      setLoadingTimeout(null);
      console.log('🏁 loadTasks completed');
    }
  }, [isOffline, getCachedData, cacheData, isApiCallInProgress, loadingTimeout]);

  // Load tasks when screen focuses with debouncing
  useFocusEffect(
    useCallback(() => {
      // Only load if not already loading and haven't loaded initially
      if (!isApiCallInProgress && !hasInitiallyLoaded.current) {
        console.log('📱 Screen focused - loading tasks for first time');
        hasInitiallyLoaded.current = true;
        loadTasks();
      } else {
        console.log('📱 Screen focused - skipping load (already loaded or in progress)');
      }
    }, [loadTasks, isApiCallInProgress])
  );

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    if (!isOffline && !isApiCallInProgress) {
      console.log('🔄 Manual refresh triggered');
      setIsRefreshing(true);
      hasInitiallyLoaded.current = false; // Allow reload
      loadTasks(false);
    }
  }, [isOffline, loadTasks, isApiCallInProgress]);

  // Handle task start
  const handleStartTask = useCallback(async (taskId: number) => {
    console.log('🎯 Starting task - Location state debug:');
    console.log('  currentLocation:', !!currentLocation);
    console.log('  hasLocationPermission:', hasLocationPermission);
    console.log('  isLocationEnabled:', isLocationEnabled);
    console.log('  locationState:', locationState);
    
    if (!currentLocation) {
      console.log('❌ No current location available');
      Alert.alert(
        'Location Required',
        'Please enable location services to start a task.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!hasLocationPermission || (!isLocationEnabled && !__DEV__)) {
      console.log('❌ Location permission or services check failed');
      console.log('  hasLocationPermission:', hasLocationPermission);
      console.log('  isLocationEnabled:', isLocationEnabled);
      console.log('  __DEV__:', __DEV__);
      
      // In development mode, allow if we have any location (including fallback)
      if (__DEV__ && currentLocation) {
        console.log('🔧 Development mode: proceeding with available location (fallback allowed)');
        // Continue with task start using available location
      } else {
        Alert.alert(
          'Location Permission Required',
          isLocationEnabled 
            ? 'Location access is required to start tasks. Please grant location permission.'
            : 'Location services are disabled. Please enable location services in your device settings.',
          [
            { text: 'Cancel' },
            { 
              text: 'Retry', 
              onPress: async () => {
                console.log('🔄 Retrying location permission...');
                try {
                  const hasPermission = await requestLocationPermissions();
                  if (hasPermission) {
                    const location = await getCurrentLocation();
                    console.log('✅ Location permission refreshed, retrying task start');
                    // Retry the task start
                    handleStartTask(taskId);
                  } else {
                    Alert.alert('Permission Denied', 'Location permission is required to start tasks.');
                  }
                } catch (error) {
                  console.error('❌ Failed to refresh location:', error);
                  Alert.alert('Error', 'Failed to get location permission. Please check your device settings.');
                }
              }
            }
          ]
        );
        return;
      }
    }

    try {
      const response = await workerApiService.startTask(taskId, currentLocation);
      
      // DEBUG: Log the response to see what we're getting
      console.log('🔍 START TASK RESPONSE:', JSON.stringify(response, null, 2));
      console.log('   success:', response.success);
      console.log('   error:', response.error);
      console.log('   message:', response.message);
      console.log('   data:', response.data);
      
      if (response.success) {
        Alert.alert(
          'Task Started',
          response.message || 'Task has been started successfully.',
          [{ text: 'OK' }]
        );
        
        // Refresh tasks to get updated status
        loadTasks(false);
      } else {
        // Handle specific error cases
        if (response.error === 'ATTENDANCE_REQUIRED') {
          Alert.alert(
            'Attendance Required',
            'You must check in before starting tasks. Please log your attendance first.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Check In', 
                onPress: () => {
                  // Navigate to attendance screen
                  navigation.navigate('Attendance');
                }
              }
            ]
          );
        } else if (response.error === 'ANOTHER_TASK_ACTIVE') {
          // Show pause and start dialog
          Alert.alert(
            'Another Task Active',
            `You are working on ${response.data?.activeTaskName || 'another task'}. Pause and start this task?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Confirm', 
                onPress: async () => {
                  try {
                    // Pause the active task
                    const pauseResponse = await workerApiService.pauseTask(response.data.activeTaskId);
                    
                    if (pauseResponse.success) {
                      // Now start the new task
                      const startResponse = await workerApiService.startTask(taskId, currentLocation);
                      
                      if (startResponse.success) {
                        Alert.alert(
                          'Task Started',
                          'Previous task paused. New task started successfully.',
                          [{ text: 'OK' }]
                        );
                        loadTasks(false);
                      } else {
                        Alert.alert('Error', startResponse.message || 'Failed to start task');
                      }
                    } else {
                      Alert.alert('Error', pauseResponse.message || 'Failed to pause active task');
                    }
                  } catch (error) {
                    console.error('Error pausing and starting task:', error);
                    Alert.alert('Error', 'Failed to pause and start task');
                  }
                }
              }
            ]
          );
        } else if (response.error === 'GEOFENCE_VALIDATION_FAILED') {
          Alert.alert(
            'Outside Geo-Fence',
            'You must be inside the assigned site location to start this task.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Cannot Start Task',
            response.message || 'Failed to start task. Please try again.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (err: any) {
      console.error('Error starting task:', err);
      
      // Check if this is the ANOTHER_TASK_ACTIVE error (comes as 400 error)
      if (err.details?.error === 'ANOTHER_TASK_ACTIVE' && err.details?.data) {
        // Store the error data in a variable to avoid closure issues
        const activeTaskData = err.details.data;
        
        // Show pause and start dialog
        Alert.alert(
          'Another Task Active',
          `You are working on ${activeTaskData.activeTaskName || 'another task'}. Pause and start this task?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Confirm', 
              onPress: async () => {
                try {
                  console.log('🔄 Starting pause and start flow...');
                  console.log('   Active task ID:', activeTaskData.activeTaskId);
                  console.log('   New task ID:', taskId);
                  
                  // Pause the active task
                  console.log('⏸️ Step 1: Pausing active task...');
                  const pauseResponse = await workerApiService.pauseTask(activeTaskData.activeTaskId);
                  console.log('   Pause response:', pauseResponse);
                  
                  if (pauseResponse.success) {
                    console.log('✅ Task paused successfully');
                    
                    // Now start the new task
                    console.log('▶️ Step 2: Starting new task...');
                    const startResponse = await workerApiService.startTask(taskId, currentLocation);
                    console.log('   Start response:', startResponse);
                    
                    if (startResponse.success) {
                      console.log('✅ New task started successfully');
                      Alert.alert(
                        'Task Started',
                        'Previous task paused. New task started successfully.',
                        [{ text: 'OK' }]
                      );
                      loadTasks(false);
                    } else {
                      console.error('❌ Failed to start new task:', startResponse.message);
                      Alert.alert('Error', startResponse.message || 'Failed to start task');
                    }
                  } else {
                    console.error('❌ Failed to pause active task:', pauseResponse.message);
                    Alert.alert('Error', pauseResponse.message || 'Failed to pause active task');
                  }
                } catch (pauseError: any) {
                  console.error('❌ Error in pause and start flow:', pauseError);
                  console.error('   Error message:', pauseError.message);
                  console.error('   Error details:', pauseError.details);
                  console.error('   Error code:', pauseError.code);
                  Alert.alert('Error', pauseError.message || 'Failed to pause and start task');
                }
              }
            }
          ]
        );
      } else {
        // Generic error handling
        Alert.alert(
          'Error',
          err.message || 'Failed to start task. Please check your connection and try again.',
          [{ text: 'OK' }]
        );
      }
    }
  }, [currentLocation, hasLocationPermission, isLocationEnabled, loadTasks]);

  // Handle task progress update
  const handleUpdateProgress = useCallback((taskId: number, progress: number) => {
    navigation.navigate('TaskProgress', { taskId, currentProgress: progress });
  }, [navigation]);

  // Handle task resume
  const handleResumeTask = useCallback(async (taskId: number) => {
    console.log('🔄 Resuming task - Location state debug:');
    console.log('  currentLocation:', !!currentLocation);
    console.log('  hasLocationPermission:', hasLocationPermission);
    console.log('  isLocationEnabled:', isLocationEnabled);
    
    if (!currentLocation) {
      console.log('❌ No current location available');
      Alert.alert(
        'Location Required',
        'Please enable location services to resume a task.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!hasLocationPermission || (!isLocationEnabled && !__DEV__)) {
      console.log('❌ Location permission or services check failed');
      
      // In development mode, allow if we have any location (including fallback)
      if (__DEV__ && currentLocation) {
        console.log('🔧 Development mode: proceeding with available location (fallback allowed)');
        // Continue with task resume using available location
      } else {
        Alert.alert(
          'Location Permission Required',
          isLocationEnabled 
            ? 'Location access is required to resume tasks. Please grant location permission.'
            : 'Location services are disabled. Please enable location services in your device settings.',
          [
            { text: 'Cancel' },
            { 
              text: 'Retry', 
              onPress: async () => {
                console.log('🔄 Retrying location permission...');
                try {
                  const hasPermission = await requestLocationPermissions();
                  if (hasPermission) {
                    const location = await getCurrentLocation();
                    console.log('✅ Location permission refreshed, retrying task resume');
                    // Retry the task resume
                    handleResumeTask(taskId);
                  } else {
                    Alert.alert('Permission Denied', 'Location permission is required to resume tasks.');
                  }
                } catch (error) {
                  console.error('❌ Failed to refresh location:', error);
                  Alert.alert('Error', 'Failed to get location permission. Please check your device settings.');
                }
              }
            }
          ]
        );
        return;
      }
    }

    try {
      const response = await workerApiService.resumeTask(taskId, currentLocation);
      
      // DEBUG: Log the response to see what we're getting
      console.log('🔍 RESUME TASK RESPONSE:', JSON.stringify(response, null, 2));
      console.log('   success:', response.success);
      console.log('   error:', response.error);
      console.log('   message:', response.message);
      console.log('   data:', response.data);
      
      if (response.success) {
        Alert.alert(
          'Task Resumed',
          response.message || 'Task has been resumed successfully.',
          [{ text: 'OK' }]
        );
        
        // Refresh tasks to get updated status
        loadTasks(false);
      } else {
        // Handle specific error cases
        if (response.error === 'ANOTHER_TASK_ACTIVE') {
          // Show pause and resume dialog
          Alert.alert(
            'Another Task Active',
            `You are working on ${response.data?.activeTaskName || 'another task'}. Pause and resume this task?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Confirm', 
                onPress: async () => {
                  try {
                    // Pause the active task
                    const pauseResponse = await workerApiService.pauseTask(response.data.activeTaskId);
                    
                    if (pauseResponse.success) {
                      // Now resume the new task
                      const resumeResponse = await workerApiService.resumeTask(taskId, currentLocation);
                      
                      if (resumeResponse.success) {
                        Alert.alert(
                          'Task Resumed',
                          'Previous task paused. Task resumed successfully.',
                          [{ text: 'OK' }]
                        );
                        loadTasks(false);
                      } else {
                        Alert.alert('Error', resumeResponse.message || 'Failed to resume task');
                      }
                    } else {
                      Alert.alert('Error', pauseResponse.message || 'Failed to pause active task');
                    }
                  } catch (error) {
                    console.error('Error pausing and resuming task:', error);
                    Alert.alert('Error', 'Failed to pause and resume task');
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'Cannot Resume Task',
            response.message || 'Failed to resume task. Please try again.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (err: any) {
      console.error('Error resuming task:', err);
      
      // Check if this is the ANOTHER_TASK_ACTIVE error (comes as 400 error)
      if (err.details?.error === 'ANOTHER_TASK_ACTIVE' && err.details?.data) {
        // Store the error data in a variable to avoid closure issues
        const activeTaskData = err.details.data;
        
        // Show pause and resume dialog
        Alert.alert(
          'Another Task Active',
          `You are working on ${activeTaskData.activeTaskName || 'another task'}. Pause and resume this task?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Confirm', 
              onPress: async () => {
                try {
                  console.log('🔄 Starting pause and resume flow...');
                  console.log('   Active task ID:', activeTaskData.activeTaskId);
                  console.log('   New task ID:', taskId);
                  
                  // Pause the active task
                  console.log('⏸️ Step 1: Pausing active task...');
                  const pauseResponse = await workerApiService.pauseTask(activeTaskData.activeTaskId);
                  console.log('   Pause response:', pauseResponse);
                  
                  if (pauseResponse.success) {
                    console.log('✅ Task paused successfully');
                    
                    // Now resume the new task
                    console.log('▶️ Step 2: Resuming new task...');
                    const resumeResponse = await workerApiService.resumeTask(taskId, currentLocation);
                    console.log('   Resume response:', resumeResponse);
                    
                    if (resumeResponse.success) {
                      console.log('✅ New task resumed successfully');
                      Alert.alert(
                        'Task Resumed',
                        'Previous task paused. Task resumed successfully.',
                        [{ text: 'OK' }]
                      );
                      loadTasks(false);
                    } else {
                      console.error('❌ Failed to resume new task:', resumeResponse.message);
                      Alert.alert('Error', resumeResponse.message || 'Failed to resume task');
                    }
                  } else {
                    console.error('❌ Failed to pause active task:', pauseResponse.message);
                    Alert.alert('Error', pauseResponse.message || 'Failed to pause active task');
                  }
                } catch (pauseError: any) {
                  console.error('❌ Error in pause and resume flow:', pauseError);
                  console.error('   Error message:', pauseError.message);
                  console.error('   Error details:', pauseError.details);
                  console.error('   Error code:', pauseError.code);
                  Alert.alert('Error', pauseError.message || 'Failed to pause and resume task');
                }
              }
            }
          ]
        );
      } else {
        // Generic error handling
        Alert.alert(
          'Error',
          err.message || 'Failed to resume task. Please check your connection and try again.',
          [{ text: 'OK' }]
        );
      }
    }
  }, [currentLocation, hasLocationPermission, isLocationEnabled, loadTasks, requestLocationPermissions, getCurrentLocation]);

  // Handle task location view
  const handleViewLocation = useCallback((task: TaskAssignment) => {
    navigation.navigate('TaskLocation', { task });
  }, [navigation]);

  // Check if task can be started
  const canStartTask = useCallback((task: TaskAssignment): boolean => {
    // Task must be pending
    if (task.status !== 'pending') return false;

    // Check dependencies - all dependency tasks must be completed
    const dependencyTasks = tasks.filter(t => task.dependencies.includes(t.assignmentId));
    const allDependenciesCompleted = dependencyTasks.every(t => t.status === 'completed');
    
    return allDependenciesCompleted;
  }, [tasks]);

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Check if worker is inside geofence for a task
  const isInsideGeofence = useCallback((task: TaskAssignment): boolean => {
    // ✅ FIX: In development mode, assume inside geofence if no location
    if (!currentLocation) {
      if (__DEV__) {
        console.log('🔧 Development mode: No location available, assuming inside geofence for testing');
        return true; // Allow in dev mode for testing
      }
      console.log('❌ No location available and not in dev mode');
      return false;
    }

    // If task doesn't have geofence data, allow (backward compatibility)
    if (!task.projectGeofence || !task.projectGeofence.latitude || !task.projectGeofence.longitude) {
      console.log('✅ No geofence configured for task, allowing start');
      return true;
    }

    // Calculate distance from worker to project site
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      task.projectGeofence.latitude,
      task.projectGeofence.longitude
    );

    // Check if within geofence radius (with some tolerance)
    const radius = task.projectGeofence.radius || 50000; // Default 50km for testing
    const tolerance = task.projectGeofence.allowedVariance || 5000; // Default 5km tolerance
    
    const isInside = distance <= (radius + tolerance);
    console.log('📍 Geofence check:', {
      taskName: task.taskName,
      yourLocation: `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`,
      siteLocation: `${task.projectGeofence.latitude.toFixed(6)}, ${task.projectGeofence.longitude.toFixed(6)}`,
      distance: distance.toFixed(2) + 'm',
      radius: radius + 'm',
      tolerance: tolerance + 'm',
      maxAllowed: (radius + tolerance) + 'm',
      isInside: isInside,
      tooFarBy: isInside ? '0m' : (distance - (radius + tolerance)).toFixed(2) + 'm'
    });
    
    return isInside;
  }, [currentLocation]);

  // Handle task expand/collapse
  const handleToggleExpand = useCallback((taskId: number) => {
    setExpandedTaskId(prevId => prevId === taskId ? null : taskId);
  }, []);

  // Render task item
  const renderTaskItem = ({ item }: { item: TaskAssignment }) => {
    const insideGeofence = isInsideGeofence(item);
    const canStartNow = canStartTask(item);
    
    console.log('='.repeat(80));
    console.log('🎯 PRODUCTION MODE - RENDERING TASK ITEM');
    console.log('='.repeat(80));
    console.log('Task Name:', item.taskName);
    console.log('Assignment ID:', item.assignmentId);
    console.log('Task Status:', item.status);
    console.log('---');
    console.log('CAN START CHECKS:');
    console.log('  1. canStartTask (dependencies):', canStartNow);
    console.log('  2. isInsideGeofence:', insideGeofence);
    console.log('  3. Has Current Location:', !!currentLocation);
    console.log('  4. Is Development Mode:', __DEV__);
    console.log('  5. Is Offline:', isOffline);
    console.log('---');
    console.log('GEOFENCE DATA:');
    console.log('  - Has Geofence:', !!item.projectGeofence);
    if (item.projectGeofence) {
      console.log('  - Geofence Lat:', item.projectGeofence.latitude);
      console.log('  - Geofence Lng:', item.projectGeofence.longitude);
      console.log('  - Geofence Radius:', item.projectGeofence.radius);
    }
    console.log('---');
    console.log('BUTTON STATE WILL BE:');
    const willBeEnabled = canStartNow && insideGeofence && !isOffline;
    console.log('  - Enabled:', willBeEnabled);
    if (!willBeEnabled) {
      console.log('  - Reason:');
      if (isOffline) console.log('    ❌ App is offline');
      if (!insideGeofence) console.log('    ❌ Outside geofence');
      if (!canStartNow) console.log('    ❌ Dependencies not met');
    }
    console.log('='.repeat(80));
    
    return (
      <TaskCard
        task={item}
        onStartTask={handleStartTask}
        onUpdateProgress={handleUpdateProgress}
        onResumeTask={handleResumeTask}
        onViewLocation={handleViewLocation}
        canStart={canStartNow}
        isInsideGeofence={insideGeofence}
        isOffline={isOffline}
        navigation={navigation}
        isExpanded={expandedTaskId === item.assignmentId}
        onToggleExpand={() => handleToggleExpand(item.assignmentId)}
      />
    );
  };

  // Render empty state with clear cache option
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No Tasks Today</Text>
      <Text style={styles.emptyMessage}>
        {isOffline 
          ? 'No cached tasks available. Please connect to internet to load tasks.'
          : 'You have no tasks assigned for today. Check back later or contact your supervisor.'
        }
      </Text>
      {!isOffline && (
        <TouchableOpacity 
          style={styles.clearCacheButton} 
          onPress={async () => {
            Alert.alert(
              'Clear Cache',
              'This will clear all cached task data. Are you sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Clear Cache', 
                  style: 'destructive',
                  onPress: async () => {
                    console.log('🗑️ Clearing task cache...');
                    await cacheData('tasks', []);
                    setTasks([]);
                    Alert.alert('Success', 'Cache cleared successfully. Pull down to refresh.');
                  }
                }
              ]
            );
          }}
        >
          <Text style={styles.clearCacheButtonText}>🗑️ Clear Cache & Refresh</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render error state with retry button
  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Unable to Load Tasks</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <View style={styles.errorActions}>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => loadTasks()}
          disabled={isApiCallInProgress}
        >
          {isApiCallInProgress ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.retryButtonText}>Try Again</Text>
          )}
        </TouchableOpacity>
        {tasks.length === 0 && (
          <TouchableOpacity 
            style={styles.offlineButton} 
            onPress={() => {
              const cachedTasks = getCachedData('tasks') as TaskAssignment[];
              if (cachedTasks.length > 0) {
                setTasks(cachedTasks);
                setError('Using cached data - limited functionality');
              }
            }}
          >
            <Text style={styles.offlineButtonText}>Use Cached Data</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return <LoadingOverlay visible={true} message="Loading today's tasks..." />;
  }

  console.log('🎨 Rendering TodaysTasksScreen with:', {
    tasksCount: tasks?.length || 0,
    tasksIsArray: Array.isArray(tasks),
    isLoading,
    error,
    isOffline,
    tasksData: tasks
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <OfflineIndicator />
      
      {error && !tasks.length ? (
        renderErrorState()
      ) : (
        <FlatList
          data={tasks || []}
          renderItem={renderTaskItem}
          keyExtractor={(item) => `task-${item.assignmentId}-${item.updatedAt}`}
          extraData={currentLocation} // Force re-render when location changes
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              enabled={!isOffline}
              colors={['#2196F3']}
              tintColor="#2196F3"
            />
          }
          ListHeaderComponent={
            <>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <Text style={styles.headerTitle} numberOfLines={1}>👷 TODAY'S TASKS</Text>
                  <Text style={styles.headerDate} numberOfLines={1}>
                    Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                  <Text style={styles.headerTaskCount} numberOfLines={1}>
                    Total Tasks Assigned: {tasks?.length || 0}
                  </Text>
                  
                  {/* 🔧 CLEAR CACHE BUTTON */}
                  <TouchableOpacity 
                    style={styles.clearCacheButton}
                    onPress={async () => {
                      try {
                        console.log('🗑️ Manual cache clear requested');
                        Alert.alert(
                          'Clear Cache',
                          'This will clear all cached task data and reload fresh data from the server.',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Clear & Reload',
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  // Clear all cache
                                  await AsyncStorage.removeItem('offline_tasks');
                                  await AsyncStorage.removeItem('tasks');
                                  await cacheData('tasks', []);
                                  setTasks([]);
                                  
                                  // Force reload
                                  hasInitiallyLoaded.current = false;
                                  await loadTasks(true, true);
                                  
                                  Alert.alert('Success', 'Cache cleared and data reloaded!');
                                } catch (error) {
                                  console.error('Error clearing cache:', error);
                                  Alert.alert('Error', 'Failed to clear cache');
                                }
                              }
                            }
                          ]
                        );
                      } catch (error) {
                        console.error('Error in clear cache:', error);
                      }
                    }}
                    disabled={isApiCallInProgress}
                  >
                    <Text style={styles.clearCacheButtonText}>
                      🗑️ Clear Cache & Reload
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Debug info - remove in production */}
              {__DEV__ && (
                <View style={styles.debugInfo}>
                  <Text style={styles.debugText}>
                    Tasks: {tasks?.length || 0} | Loading: {isLoading.toString()} | Error: {error ? 'Yes' : 'No'} | Array: {Array.isArray(tasks) ? 'Yes' : 'No'}
                  </Text>
                </View>
              )}
              
              {/* LOCATION COMPARISON - Show your location vs project locations */}
              <View style={styles.locationComparisonContainer}>
                <Text style={styles.locationComparisonTitle}>📍 LOCATION STATUS</Text>
                
                {/* Your Current Location */}
                <View style={styles.locationSection}>
                  <Text style={styles.locationSectionTitle}>Your Current Location:</Text>
                  {currentLocation ? (
                    <>
                      <Text style={styles.locationText}>
                        📍 Lat: {currentLocation.latitude.toFixed(6)}
                      </Text>
                      <Text style={styles.locationText}>
                        📍 Lng: {currentLocation.longitude.toFixed(6)}
                      </Text>
                      <Text style={styles.locationText}>
                        🎯 Accuracy: {currentLocation.accuracy?.toFixed(0)}m
                      </Text>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>✅ Location Available</Text>
                      </View>
                    </>
                  ) : (
                    <View style={[styles.statusBadge, styles.statusBadgeError]}>
                      <Text style={[styles.statusBadgeText, styles.statusBadgeTextError]}>
                        ⚠️ NO LOCATION - Cannot Start Tasks
                      </Text>
                    </View>
                  )}
                </View>

                {/* Project Locations */}
                {tasks && tasks.length > 0 && (
                  <View style={styles.locationSection}>
                    <Text style={styles.locationSectionTitle}>Project Locations:</Text>
                    {tasks.map((task, index) => {
                      if (task.projectGeofence) {
                        const distance = currentLocation 
                          ? calculateDistance(
                              currentLocation.latitude,
                              currentLocation.longitude,
                              task.projectGeofence.latitude,
                              task.projectGeofence.longitude
                            )
                          : null;
                        
                        const radius = task.projectGeofence.radius || 50000; // Default to 50km for testing
                        const tolerance = task.projectGeofence.allowedVariance || 5000; // Default to 5km tolerance
                        const isInside = distance !== null && distance <= (radius + tolerance);
                        
                        return (
                          <View key={`location-${task.assignmentId}`} style={styles.projectLocationCard}>
                            <Text style={styles.projectLocationName}>
                              🏗️ {task.projectName || `Project ${task.projectId}`}
                            </Text>
                            <Text style={styles.projectLocationCoords}>
                              📍 Lat: {task.projectGeofence.latitude.toFixed(6)}
                            </Text>
                            <Text style={styles.projectLocationCoords}>
                              📍 Lng: {task.projectGeofence.longitude.toFixed(6)}
                            </Text>
                            <Text style={styles.projectLocationCoords}>
                              🔵 Radius: {radius}m (±{tolerance}m tolerance)
                            </Text>
                            
                            {distance !== null ? (
                              <>
                                <View style={styles.distanceRow}>
                                  <Text style={[
                                    styles.distanceText,
                                    isInside ? styles.distanceTextInside : styles.distanceTextOutside
                                  ]}>
                                    📏 Distance: {distance.toFixed(0)}m
                                  </Text>
                                  <View style={[
                                    styles.distanceBadge,
                                    isInside ? styles.distanceBadgeInside : styles.distanceBadgeOutside
                                  ]}>
                                    <Text style={[
                                      styles.distanceBadgeText,
                                      isInside ? styles.distanceBadgeTextInside : styles.distanceBadgeTextOutside
                                    ]}>
                                      {isInside ? '✅ INSIDE' : '❌ OUTSIDE'}
                                    </Text>
                                  </View>
                                </View>
                                {!isInside && (
                                  <Text style={styles.distanceWarning}>
                                    ⚠️ You are {(distance - (radius + tolerance)).toFixed(0)}m too far
                                  </Text>
                                )}
                              </>
                            ) : (
                              <Text style={styles.distanceWarning}>
                                ⚠️ Cannot calculate distance - no location
                              </Text>
                            )}
                          </View>
                        );
                      }
                      return null;
                    })}
                  </View>
                )}

                {/* Permission Status */}
                <View style={styles.permissionStatus}>
                  <Text style={styles.permissionStatusTitle}>Permission Status:</Text>
                  <View style={styles.permissionRow}>
                    <Text style={styles.permissionLabel}>Location Permission:</Text>
                    <Text style={hasLocationPermission ? styles.permissionYes : styles.permissionNo}>
                      {hasLocationPermission ? '✅ Granted' : '❌ Denied'}
                    </Text>
                  </View>
                  <View style={styles.permissionRow}>
                    <Text style={styles.permissionLabel}>Location Services:</Text>
                    <Text style={isLocationEnabled ? styles.permissionYes : styles.permissionNo}>
                      {isLocationEnabled ? '✅ Enabled' : '❌ Disabled'}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 0,
  },
  headerContent: {
    width: '100%',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  headerDate: {
    fontSize: 15,
    color: '#000000',
    marginBottom: 4,
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  headerTaskCount: {
    fontSize: 15,
    color: '#000000',
    marginBottom: 4,
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  clearCacheButton: {
    marginTop: 12,
    backgroundColor: '#FF5722',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearCacheButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  targetSummaryContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  targetSummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: 8,
  },
  targetSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  targetSummaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    minWidth: 100,
  },
  targetProgressMini: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  targetProgressMiniFill: {
    height: '100%',
    borderRadius: 4,
  },
  targetPercentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1565C0',
    minWidth: 40,
    textAlign: 'right',
  },
  clientName: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  taskCount: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  taskCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listContainer: {
    paddingBottom: 32,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#D32F2F',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  offlineButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  offlineButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  debugInfo: {
    backgroundColor: '#FFF3CD',
    padding: 8,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  debugText: {
    fontSize: 12,
    color: '#856404',
    fontFamily: 'monospace',
  },
  locationComparisonContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#2196F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationComparisonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: 16,
    textAlign: 'center',
  },
  locationSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  locationSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#424242',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 6,
    fontFamily: 'monospace',
  },
  statusBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  statusBadgeError: {
    backgroundColor: '#F44336',
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusBadgeTextError: {
    color: '#FFFFFF',
  },
  projectLocationCard: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  projectLocationName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  projectLocationCoords: {
    fontSize: 13,
    color: '#424242',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '700',
  },
  distanceTextInside: {
    color: '#2E7D32',
  },
  distanceTextOutside: {
    color: '#D32F2F',
  },
  distanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  distanceBadgeInside: {
    backgroundColor: '#4CAF50',
  },
  distanceBadgeOutside: {
    backgroundColor: '#F44336',
  },
  distanceBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  distanceBadgeTextInside: {
    color: '#FFFFFF',
  },
  distanceBadgeTextOutside: {
    color: '#FFFFFF',
  },
  distanceWarning: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D32F2F',
    marginTop: 6,
  },
  permissionStatus: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  permissionStatusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: 8,
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  permissionLabel: {
    fontSize: 13,
    color: '#424242',
    fontWeight: '500',
  },
  permissionYes: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
  },
  permissionNo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D32F2F',
  },
  locationDebugTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: 8,
  },
  locationDebugText: {
    fontSize: 13,
    color: '#0D47A1',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  clearCacheButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearCacheButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default TodaysTasksScreen;