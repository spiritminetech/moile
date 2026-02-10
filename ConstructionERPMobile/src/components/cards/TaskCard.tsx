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
import AttachmentViewer from '../common/AttachmentViewer';

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
  // Get priority color and icon
  const getPriorityColor = (priority: string): string => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return '#D32F2F';
      case 'high':
        return '#FF5722';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#4CAF50';
      default:
        return '#757575';
    }
  };

  const getPriorityIcon = (priority: string): string => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return '🚨';
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const getPriorityText = (priority: string): string => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'Critical';
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return 'Normal';
    }
  };

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

  // Render enhanced dependency indicators with visual connections
  const renderDependencies = () => {
    if (!task.dependencies || task.dependencies.length === 0) {
      return null;
    }

    return (
      <View style={styles.dependenciesContainer}>
        <View style={styles.dependenciesHeader}>
          <Text style={styles.dependenciesLabel}>🔗 Dependencies:</Text>
          <Text style={styles.dependenciesCount}>({task.dependencies.length})</Text>
        </View>
        <View style={styles.dependenciesList}>
          {task.dependencies.map((depId, index) => (
            <View key={depId} style={styles.dependencyItem}>
              <View style={styles.dependencyTag}>
                <Text style={styles.dependencyIcon}>📋</Text>
                <Text style={styles.dependencyText}>Task #{depId}</Text>
              </View>
              {index < task.dependencies.length - 1 && (
                <View style={styles.dependencyConnector}>
                  <Text style={styles.connectorText}>→</Text>
                </View>
              )}
            </View>
          ))}
        </View>
        {!canStart && (
          <View style={styles.dependencyWarning}>
            <Text style={styles.dependencyWarningIcon}>⚠️</Text>
            <Text style={styles.dependencyWarningText}>
              Complete dependencies before starting this task
            </Text>
          </View>
        )}
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
      {/* Header with status and priority */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.taskName}>{task.taskName}</Text>
            <View style={styles.priorityIndicator}>
              <Text style={styles.priorityIcon}>{getPriorityIcon(task.priority || 'medium')}</Text>
              <Text style={[styles.priorityText, { color: getPriorityColor(task.priority || 'medium') }]}>
                {getPriorityText(task.priority || 'medium')}
              </Text>
            </View>
          </View>
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
          <Text style={styles.detailLabel}>Project:</Text>
          <Text style={styles.detailValue}>{task.projectName || `Project ${task.projectId}`}</Text>
        </View>
        {task.clientName && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Client:</Text>
            <Text style={styles.detailValue}>{task.clientName}</Text>
          </View>
        )}
        {task.workArea && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Work Area:</Text>
            <Text style={styles.detailValue}>{task.workArea}</Text>
          </View>
        )}
        {task.dailyTarget && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Daily Target:</Text>
            <Text style={styles.detailValue}>
              {task.dailyTarget.quantity} {task.dailyTarget.unit}
            </Text>
          </View>
        )}
      </View>

      {/* Dependencies */}
      {renderDependencies()}

      {/* Supervisor Instructions with Attachments */}
      {(task.supervisorInstructions || (task.instructionAttachments && task.instructionAttachments.length > 0)) && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>📋 Supervisor Instructions</Text>
          {task.supervisorInstructions && (
            <Text style={styles.instructionsText}>{task.supervisorInstructions}</Text>
          )}
          {task.instructionAttachments && task.instructionAttachments.length > 0 && (
            <AttachmentViewer 
              attachments={task.instructionAttachments}
              title="Instruction Attachments"
            />
          )}
          {task.instructionsLastUpdated && (
            <Text style={styles.instructionsUpdated}>
              Last updated: {new Date(task.instructionsLastUpdated).toLocaleDateString()}
            </Text>
          )}
        </View>
      )}

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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  priorityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
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
  dependenciesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  dependenciesCount: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginLeft: 4,
  },
  dependencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dependencyConnector: {
    marginHorizontal: 8,
  },
  connectorText: {
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontSize: 16,
  },
  dependencyIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  dependencyWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: ConstructionTheme.colors.warning + '20',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: ConstructionTheme.colors.warning,
  },
  dependencyWarningIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  dependencyWarningText: {
    ...ConstructionTheme.typography.bodySmall,
    color: '#E65100',
    flex: 1,
  },
  dependenciesLabel: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  dependenciesList: {
    flexDirection: 'column',
  },
  dependencyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ConstructionTheme.colors.primaryLight + '20',
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: 6,
    borderRadius: ConstructionTheme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: ConstructionTheme.colors.primary,
  },
  dependencyText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.primary,
    fontWeight: '500',
  },
  instructionsContainer: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant + '30',
    borderRadius: ConstructionTheme.borderRadius.md,
    padding: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.primary,
  },
  instructionsTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  instructionsText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: ConstructionTheme.spacing.md,
  },
  instructionsUpdated: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    textAlign: 'right',
    marginTop: ConstructionTheme.spacing.sm,
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