// Task History Screen - Display worker's completed and historical tasks
// Requirements: 4.1, 4.2, 4.3, 4.6

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { TaskAssignment } from '../../types';
import { useTaskHistory } from '../../hooks/useTaskHistory';
import { useOffline } from '../../store/context/OfflineContext';
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

  // Handle task view details
  const handleViewTaskDetails = useCallback((task: TaskAssignment) => {
    const formatDate = (dateString?: string) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString();
    };

    Alert.alert(
      'Task Details',
      `Task: ${task.taskName}\nStatus: ${task.status}\nProject ID: ${task.projectId}\nEstimated Hours: ${task.estimatedHours}h\nActual Hours: ${task.actualHours || 'N/A'}h\nCreated: ${formatDate(task.createdAt)}\nCompleted: ${formatDate(task.completedAt)}\n\nDescription:\n${task.description}`,
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

  // Get filter button style
  const getFilterButtonStyle = (filter: string) => [
    styles.filterButton,
    currentFilter === filter && styles.filterButtonActive
  ];

  const getFilterTextStyle = (filter: string) => [
    styles.filterButtonText,
    currentFilter === filter && styles.filterButtonTextActive
  ];

  // Render filter buttons
  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={getFilterButtonStyle('all')}
        onPress={() => filterTasks('all')}
      >
        <Text style={getFilterTextStyle('all')}>All ({tasks.length})</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={getFilterButtonStyle('completed')}
        onPress={() => filterTasks('completed')}
      >
        <Text style={getFilterTextStyle('completed')}>
          Completed ({tasks.filter(t => t.status === 'completed').length})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={getFilterButtonStyle('in_progress')}
        onPress={() => filterTasks('in_progress')}
      >
        <Text style={getFilterTextStyle('in_progress')}>
          In Progress ({tasks.filter(t => t.status === 'in_progress').length})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={getFilterButtonStyle('cancelled')}
        onPress={() => filterTasks('cancelled')}
      >
        <Text style={getFilterTextStyle('cancelled')}>
          Cancelled ({tasks.filter(t => t.status === 'cancelled').length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render task item with historical context
  const renderTaskItem = ({ item }: { item: TaskAssignment }) => (
    <TouchableOpacity onPress={() => handleViewTaskDetails(item)}>
      <TaskCard
        task={item}
        onStartTask={handleStartTask}
        onUpdateProgress={handleUpdateProgress}
        onViewLocation={handleViewLocation}
        canStart={false}
        isOffline={isOffline}
      />
    </TouchableOpacity>
  );

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
    <View style={styles.container}>
      <OfflineIndicator />
      
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
            data={filteredTasks}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.background,
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