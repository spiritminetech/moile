// Task History Screen - Display worker's completed and historical tasks
// Requirements: 4.1, 4.2, 4.3, 4.6

import React, { useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { TaskAssignment } from '../../types';
import { useTaskHistory } from '../../hooks/useTaskHistory';
import { useOffline } from '../../store/context/OfflineContext';
import { useLocation } from '../../store/context/LocationContext';
import TaskCard from '../../components/cards/TaskCard';
import { 
  LoadingOverlay, 
  ConstructionButton, 
  ConstructionCard,
  ErrorDisplay,
  OfflineIndicator 
} from '../../components/common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface TaskHistoryScreenProps {
  navigation: any;
}

const TaskHistoryScreen: React.FC<TaskHistoryScreenProps> = ({ navigation }) => {
  const { 
    tasks, 
    filteredTasks, 
    isLoading, 
    error, 
    refreshData, 
    isRefreshing, 
    filterTasks, 
    currentFilter 
  } = useTaskHistory();
  const { isOffline } = useOffline();
  const { state: locationState } = useLocation();
  const { currentLocation } = locationState;

  // Refresh data when screen comes into focus to ensure counts are up to date
  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

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
    // In development mode, assume inside geofence if no location
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
      console.log('✅ No geofence configured for task, allowing');
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
    console.log('📍 Task History - Geofence check:', {
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

  // Handle task view details
  const handleViewTaskDetails = useCallback((task: TaskAssignment) => {
    const formatDate = (dateString?: string) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString();
    };

    Alert.alert(
      'Task Details',
      `Task: ${task.taskName}\nStatus: ${task.status}\nProject: ${task.projectName || `Project ${task.projectId}`}\nEstimated Hours: ${task.estimatedHours}h\nActual Hours: ${task.actualHours || 'N/A'}h\nCreated: ${formatDate(task.createdAt)}\nCompleted: ${formatDate(task.completedAt)}\n\nDescription:\n${task.description}`,
      [{ text: 'OK' }]
    );
  }, []);

  // Handle task location view
  const handleViewLocation = useCallback((task: TaskAssignment) => {
    navigation.navigate('TaskLocation', { task });
  }, [navigation]);

  // Dummy handlers for TaskCard (these actions aren't available for historical tasks)
  const handleStartTask = useCallback(() => {
    Alert.alert('Not Available', 'Cannot start historical tasks.', [{ text: 'OK' }]);
  }, []);

  const handleUpdateProgress = useCallback(() => {
    Alert.alert('Not Available', 'Cannot update progress for historical tasks.', [{ text: 'OK' }]);
  }, []);

  const handleResumeTask = useCallback(() => {
    Alert.alert('Not Available', 'Cannot resume historical tasks.', [{ text: 'OK' }]);
  }, []);

  // Get filter button style
  const getFilterButtonStyle = (filter: string) => [
    styles.filterButton,
    currentFilter === filter && styles.filterButtonActive
  ];

  const getFilterTextStyle = (filter: string) => [
    styles.filterButtonText,
    currentFilter === filter && styles.filterButtonTextActive
  ];

  // Calculate task counts safely with memoization
  const taskCounts = useMemo(() => {
    const safeTasks = tasks || [];
    console.log('📊 Calculating task counts from tasks:', safeTasks.length);
    console.log('📋 Sample tasks:', safeTasks.slice(0, 2));
    
    const counts = {
      all: safeTasks.length,
      completed: safeTasks.filter(t => t.status === 'completed').length,
      inProgress: safeTasks.filter(t => t.status === 'in_progress').length,
      cancelled: safeTasks.filter(t => t.status === 'cancelled').length,
    };
    
    console.log('📊 Task counts calculated:', counts);
    return counts;
  }, [tasks]);

  // Debug task counts when they change
  useEffect(() => {
    console.log('📊 TaskHistoryScreen - Task counts updated:', {
      taskCounts,
      tasksLength: tasks?.length || 0,
      tasksIsArray: Array.isArray(tasks),
      filteredTasksLength: filteredTasks?.length || 0,
      currentFilter
    });
  }, [taskCounts, tasks, filteredTasks, currentFilter]);

  // Render filter buttons
  const renderFilterButtons = () => {
    return (
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={getFilterButtonStyle('all')}
          onPress={() => filterTasks('all')}
        >
          <Text style={getFilterTextStyle('all')}>All ({taskCounts?.all || 0})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={getFilterButtonStyle('completed')}
          onPress={() => filterTasks('completed')}
        >
          <Text style={getFilterTextStyle('completed')}>
            Completed ({taskCounts?.completed || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={getFilterButtonStyle('in_progress')}
          onPress={() => filterTasks('in_progress')}
        >
          <Text style={getFilterTextStyle('in_progress')}>
            In Progress ({taskCounts?.inProgress || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={getFilterButtonStyle('cancelled')}
          onPress={() => filterTasks('cancelled')}
        >
          <Text style={getFilterTextStyle('cancelled')}>
            Cancelled ({taskCounts?.cancelled || 0})
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render task item with historical context
  const renderTaskItem = ({ item }: { item: TaskAssignment }) => {
    const insideGeofence = isInsideGeofence(item);
    
    return (
      <TouchableOpacity onPress={() => handleViewTaskDetails(item)}>
        <TaskCard
          task={item}
          onStartTask={handleStartTask}
          onUpdateProgress={handleUpdateProgress}
          onResumeTask={handleResumeTask}
          onViewLocation={handleViewLocation}
          canStart={false}
          isInsideGeofence={insideGeofence}
          isOffline={isOffline}
        />
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>
        {currentFilter === 'all' ? 'No Task History' : `No ${currentFilter.replace('_', ' ')} Tasks`}
      </Text>
      <Text style={styles.emptyMessage}>
        {isOffline 
          ? 'No cached task history available. Please connect to internet to load task history.'
          : currentFilter === 'all'
            ? 'You have no task history yet. Complete some tasks to see them here.'
            : `You have no ${currentFilter.replace('_', ' ')} tasks in your history.`
        }
      </Text>
      {currentFilter !== 'all' && (
        <ConstructionButton
          title="Show All Tasks"
          onPress={() => filterTasks('all')}
          variant="primary"
          size="medium"
          style={styles.showAllButton}
        />
      )}
    </View>
  );

  if (isLoading) {
    return <LoadingOverlay visible={true} message="Loading task history..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <OfflineIndicator />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Task History</Text>
      </View>
      
      {error && !tasks.length ? (
        <ErrorDisplay
          error={error}
          variant="card"
          onRetry={refreshData}
          onDismiss={() => {}}
          title="Unable to Load Task History"
        />
      ) : (
        <>
          {renderFilterButtons()}
          
          {error && tasks.length > 0 && (
            <ConstructionCard variant="warning" style={styles.warningCard}>
              <Text style={styles.warningText}>{error}</Text>
            </ConstructionCard>
          )}
          
          <FlatList
            data={filteredTasks || []}
            renderItem={renderTaskItem}
            keyExtractor={(item) => `${item.assignmentId}-${item.updatedAt}`}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshData}
                enabled={!isOffline}
                colors={[ConstructionTheme.colors.primary]}
                tintColor={ConstructionTheme.colors.primary}
              />
            }
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.background,
  },
  header: {
    backgroundColor: ConstructionTheme.colors.surface,
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingVertical: ConstructionTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
  },
  taskCount: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.primary,
    backgroundColor: ConstructionTheme.colors.primaryContainer,
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: ConstructionTheme.spacing.xs,
    borderRadius: ConstructionTheme.borderRadius.full,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    backgroundColor: ConstructionTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.disabled,
  },
  filterButton: {
    flex: 1,
    paddingVertical: ConstructionTheme.spacing.sm,
    paddingHorizontal: ConstructionTheme.spacing.xs,
    marginHorizontal: 2,
    borderRadius: ConstructionTheme.borderRadius.sm,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: ConstructionTheme.colors.primary,
  },
  filterButtonText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  filterButtonTextActive: {
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: '600',
  },
  warningCard: {
    margin: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  warningText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
  },
  listContainer: {
    padding: ConstructionTheme.spacing.md,
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
    marginBottom: ConstructionTheme.spacing.lg,
  },
  emptyTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
    textAlign: 'center',
  },
  emptyMessage: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: ConstructionTheme.spacing.lg,
  },
  showAllButton: {
    marginTop: ConstructionTheme.spacing.md,
  },
});

export default TaskHistoryScreen;