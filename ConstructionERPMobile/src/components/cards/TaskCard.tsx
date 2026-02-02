// TaskCard Component - Display individual task with actions and dependency indicators
// Requirements: 4.1, 4.2, 4.3, 4.6

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { TaskAssignment } from '../../types';
import { ConstructionButton, ConstructionCard } from '../common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface TaskCardProps {
  task: TaskAssignment;
  onStartTask: (taskId: number) => void;
  onUpdateProgress: (taskId: number, progress: number) => void;
  onViewLocation: (task: TaskAssignment) => void;
  canStart: boolean;
  isOffline: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStartTask,
  onUpdateProgress,
  onViewLocation,
  canStart,
  isOffline,
}) => {
  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'in_progress':
        return '#2196F3';
      case 'completed':
        return '#4CAF50';
      default:
        return '#757575';
    }
  };

  // Get status text
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  // Handle start task with confirmation
  const handleStartTask = () => {
    if (isOffline) {
      Alert.alert(
        'Offline Mode',
        'Cannot start tasks while offline. Please connect to internet.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!canStart) {
      Alert.alert(
        'Cannot Start Task',
        'This task has dependencies that must be completed first.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Start Task',
      `Are you sure you want to start "${task.taskName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start', onPress: () => onStartTask(task.assignmentId) },
      ]
    );
  };

  // Handle progress update
  const handleUpdateProgress = () => {
    if (isOffline) {
      Alert.alert(
        'Offline Mode',
        'Cannot update progress while offline. Please connect to internet.',
        [{ text: 'OK' }]
      );
      return;
    }

    onUpdateProgress(task.assignmentId, task.actualHours || 0);
  };

  // Handle view location
  const handleViewLocation = () => {
    onViewLocation(task);
  };

  // Render dependency indicators
  const renderDependencies = () => {
    if (!task.dependencies || task.dependencies.length === 0) {
      return null;
    }

    return (
      <View style={styles.dependenciesContainer}>
        <Text style={styles.dependenciesLabel}>Dependencies:</Text>
        <View style={styles.dependenciesList}>
          {task.dependencies.map((depId, index) => (
            <View key={depId} style={styles.dependencyTag}>
              <Text style={styles.dependencyText}>#{depId}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render action buttons
  const renderActionButtons = () => {
    const buttons = [];

    // Start button for pending tasks
    if (task.status === 'pending') {
      buttons.push(
        <ConstructionButton
          key="start"
          title={canStart ? 'Start Task' : 'Dependencies Required'}
          onPress={handleStartTask}
          variant={canStart ? 'success' : 'neutral'}
          size="medium"
          disabled={!canStart || isOffline}
          icon="▶️"
          style={styles.actionButton}
        />
      );
    }

    // Progress button for in-progress tasks
    if (task.status === 'in_progress') {
      buttons.push(
        <ConstructionButton
          key="progress"
          title="Update Progress"
          onPress={handleUpdateProgress}
          variant="primary"
          size="medium"
          disabled={isOffline}
          icon="📊"
          style={styles.actionButton}
        />
      );
    }

    // Location button for all tasks
    buttons.push(
      <ConstructionButton
        key="location"
        title="View Location"
        onPress={handleViewLocation}
        variant="neutral"
        size="medium"
        icon="📍"
        style={styles.locationButton}
      />
    );

    return (
      <View style={styles.actionsContainer}>
        {buttons}
      </View>
    );
  };

  return (
    <ConstructionCard
      variant="elevated"
      style={styles.container}
    >
      {/* Header with status */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.taskName}>{task.taskName}</Text>
          <Text style={styles.sequence}>#{task.sequence}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
          <Text style={styles.statusText}>{getStatusText(task.status)}</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description}>{task.description}</Text>

      {/* Task details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Estimated Hours:</Text>
          <Text style={styles.detailValue}>{task.estimatedHours}h</Text>
        </View>
        {task.actualHours !== undefined && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Actual Hours:</Text>
            <Text style={styles.detailValue}>{task.actualHours}h</Text>
          </View>
        )}
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Project ID:</Text>
          <Text style={styles.detailValue}>#{task.projectId}</Text>
        </View>
      </View>

      {/* Dependencies */}
      {renderDependencies()}

      {/* Action buttons */}
      {renderActionButtons()}

      {/* Offline indicator */}
      {isOffline && (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>⚠️ Limited functionality while offline</Text>
        </View>
      )}
    </ConstructionCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ConstructionTheme.spacing.md,
  },
  titleContainer: {
    flex: 1,
    marginRight: ConstructionTheme.spacing.md,
  },
  taskName: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: 4,
  },
  sequence: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.lg,
  },
  statusText: {
    color: ConstructionTheme.colors.onPrimary,
    ...ConstructionTheme.typography.labelMedium,
    textTransform: 'uppercase',
  },
  description: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurfaceVariant,
    lineHeight: 22,
    marginBottom: ConstructionTheme.spacing.lg,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: ConstructionTheme.spacing.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: ConstructionTheme.spacing.lg,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  detailLabel: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginRight: 6,
  },
  detailValue: {
    ...ConstructionTheme.typography.bodyMedium,
    fontWeight: '600',
    color: ConstructionTheme.colors.onSurface,
  },
  dependenciesContainer: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  dependenciesLabel: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  dependenciesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dependencyTag: {
    backgroundColor: ConstructionTheme.colors.primaryLight + '20',
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: 4,
    borderRadius: ConstructionTheme.borderRadius.md,
    marginRight: ConstructionTheme.spacing.sm,
    marginBottom: 4,
  },
  dependencyText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.primary,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ConstructionTheme.spacing.sm,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    minWidth: 120,
  },
  locationButton: {
    flex: 1,
    minWidth: 120,
  },
  offlineIndicator: {
    marginTop: ConstructionTheme.spacing.md,
    padding: ConstructionTheme.spacing.sm,
    backgroundColor: ConstructionTheme.colors.warning + '20',
    borderRadius: ConstructionTheme.borderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.warning,
  },
  offlineText: {
    ...ConstructionTheme.typography.bodySmall,
    color: '#E65100',
    fontWeight: '500',
  },
});

export default TaskCard;