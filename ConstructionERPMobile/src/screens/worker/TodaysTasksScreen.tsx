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

const TodaysTasksScreen = ({ navigation }: any) => {
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiCallInProgress, setIsApiCallInProgress] = useState(false); // Prevent multiple calls
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);
  const hasInitiallyLoaded = useRef(false); // Track if we've loaded once

  const { state: locationState, checkGPSAccuracy } = useLocation();
  const { currentLocation, isLocationEnabled, hasLocationPermission } = locationState;
  const { isOffline, getCachedData, cacheData } = useOffline();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [loadingTimeout]);

  // Debug authentication status
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

  // Load tasks data with request deduplication
  const loadTasks = useCallback(async (showLoading = true) => {
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

      console.log('🔄 Loading tasks...', { isOffline, showLoading });

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
        console.log('📋 Sample task data:', tasksData[0]);
        setTasks(tasksData);
        // Cache the data for offline use
        await cacheData('tasks', tasksData);
        
        // Clear any previous errors
        setError(null);
      } else {
        const errorMsg = response.message || 'Failed to load tasks';
        console.log('❌ API returned error:', errorMsg);
        setError(errorMsg);
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
      } else if (err.message?.includes('timeout') || err.code === 'ECONNABORTED') {
        setError('Request timed out. The server may be slow or unavailable.');
      } else if (err.message?.includes('401') || err.code === 'UNAUTHORIZED') {
        setError('Authentication failed. Please log in again.');
      } else {
        setError(`Connection error: ${errorMessage}`);
      }
      
      // Try to load cached data on error
      const cachedTasks = getCachedData('tasks') as TaskAssignment[];
      if (cachedTasks.length > 0) {
        console.log('📦 Using cached tasks as fallback:', cachedTasks.length);
        setTasks(cachedTasks);
        setError('Using cached data - please check your connection');
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
    if (!currentLocation) {
      Alert.alert(
        'Location Required',
        'Please enable location services to start a task.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!hasLocationPermission || !isLocationEnabled) {
      Alert.alert(
        'Location Permission Required',
        'Location access is required to start tasks. Please enable location services.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const response = await workerApiService.startTask(taskId, currentLocation);
      
      if (response.success) {
        Alert.alert(
          'Task Started',
          response.message || 'Task has been started successfully.',
          [{ text: 'OK' }]
        );
        
        // Refresh tasks to get updated status
        loadTasks(false);
      } else {
        Alert.alert(
          'Cannot Start Task',
          response.message || 'Failed to start task. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (err: any) {
      console.error('Error starting task:', err);
      Alert.alert(
        'Error',
        err.message || 'Failed to start task. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    }
  }, [currentLocation, hasLocationPermission, isLocationEnabled, loadTasks]);

  // Handle task progress update
  const handleUpdateProgress = useCallback((taskId: number, progress: number) => {
    navigation.navigate('TaskProgress', { taskId, currentProgress: progress });
  }, [navigation]);

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

  // Render task item
  const renderTaskItem = ({ item }: { item: TaskAssignment }) => {
    console.log('🎯 Rendering task item:', {
      assignmentId: item.assignmentId,
      taskName: item.taskName,
      status: item.status,
      canStart: canStartTask(item)
    });
    
    return (
      <TaskCard
        task={item}
        onStartTask={handleStartTask}
        onUpdateProgress={handleUpdateProgress}
        onViewLocation={handleViewLocation}
        canStart={canStartTask(item)}
        isOffline={isOffline}
      />
    );
  };

  // Render empty state
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
    tasksCount: tasks.length,
    isLoading,
    error,
    isOffline
  });

  return (
    <View style={styles.container}>
      <OfflineIndicator />
      
      {/* Debug info - remove in production */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Tasks: {tasks.length} | Loading: {isLoading.toString()} | Error: {error ? 'Yes' : 'No'}
          </Text>
        </View>
      )}
      
      {error && !tasks.length ? (
        renderErrorState()
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => `task-${item.assignmentId}-${item.updatedAt}`}
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
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContainer: {
    padding: 16,
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
    margin: 16,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  debugText: {
    fontSize: 12,
    color: '#856404',
    fontFamily: 'monospace',
  },
});

export default TodaysTasksScreen;