// TransportTaskCard Component - Display transport task with route and worker information
// Requirements: 8.1, 8.2, 8.3, 8.4, 8.5

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { TransportTask } from '../../types';
import { ConstructionButton, ConstructionCard } from '../common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface TransportTaskCardProps {
  task: TransportTask;
  onStartRoute: (taskId: number) => void;
  onViewRoute: (task: TransportTask) => void;
  onUpdateStatus: (taskId: number, status: string) => void;
  hasActiveTask?: boolean;  // Indicates if another task is already active
}

const TransportTaskCard: React.FC<TransportTaskCardProps> = ({
  task,
  onStartRoute,
  onViewRoute,
  onUpdateStatus,
  hasActiveTask = false,
}) => {
  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return ConstructionTheme.colors.warning;
      case 'en_route_pickup':
        return ConstructionTheme.colors.info;
      case 'pickup_complete':
        return ConstructionTheme.colors.secondary;
      case 'en_route_dropoff':
        return ConstructionTheme.colors.primary;
      case 'completed':
        return ConstructionTheme.colors.success;
      default:
        return ConstructionTheme.colors.neutral;
    }
  };

  // Get status text
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending':
        return '⏳ Ready to Start';
      case 'en_route_pickup':
        return '🚛 En Route to Pickup';
      case 'pickup_complete':
        return '✅ Pickup Complete';
      case 'en_route_dropoff':
        return '🚛 En Route to Site';
      case 'completed':
        return '✅ Trip Complete';
      default:
        return 'Unknown Status';
    }
  };

  // Get next status text for subtitle
  const getNextStatusText = (status: string): string => {
    switch (status) {
      case 'en_route_pickup':
        return 'Mark pickup complete';
      case 'pickup_complete':
        return 'Start to dropoff';
      case 'en_route_dropoff':
        return 'Complete trip';
      default:
        return '';
    }
  };

  // Handle start route - Direct action without confirmation popup
  const handleStartRoute = () => {
    onStartRoute(task.taskId);
  };

  // Handle view route
  const handleViewRoute = () => {
    onViewRoute(task);
  };

  // Handle status update
  const handleStatusUpdate = () => {
    // Determine next status based on current status
    let nextStatus = '';
    let confirmMessage = '';

    switch (task.status) {
      case 'pending':
        nextStatus = 'en_route_pickup';
        confirmMessage = 'Mark as en route to pickup locations?';
        break;
      case 'en_route_pickup':
        nextStatus = 'pickup_complete';
        confirmMessage = 'Mark pickup as complete?';
        break;
      case 'pickup_complete':
        nextStatus = 'en_route_dropoff';
        confirmMessage = 'Mark as en route to dropoff location?';
        break;
      case 'en_route_dropoff':
        nextStatus = 'completed';
        confirmMessage = 'Mark trip as completed?';
        break;
      default:
        return;
    }

    Alert.alert(
      'Update Status',
      confirmMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => onUpdateStatus(task.taskId, nextStatus) },
      ]
    );
  };

  // Format time
  const formatTime = (timeString: string): string => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Worker summary - ENHANCED with progress bar
  const workerProgress = task.totalWorkers > 0 
    ? (task.checkedInWorkers / task.totalWorkers) * 100 
    : 0;

  return (
    <ConstructionCard
      variant="elevated"
      style={styles.container}
    >
      {/* Header with status */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.routeName}>🚛 {task.route}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
          <Text style={styles.statusText}>{getStatusText(task.status)}</Text>
        </View>
      </View>

      {/* Progress bar for worker check-in */}
      {task.status !== 'completed' && task.totalWorkers > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${workerProgress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {task.checkedInWorkers}/{task.totalWorkers} workers checked in
          </Text>
        </View>
      )}

      {/* Worker summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryIcon}>👥</Text>
          <Text style={styles.summaryValue}>{task.totalWorkers}</Text>
          <Text style={styles.summaryLabel}>Workers</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryIcon}>✅</Text>
          <Text style={styles.summaryValue}>{task.checkedInWorkers}</Text>
          <Text style={styles.summaryLabel}>Checked In</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryIcon}>📍</Text>
          <Text style={styles.summaryValue}>{task.pickupLocations?.length || 0}</Text>
          <Text style={styles.summaryLabel}>Locations</Text>
        </View>
      </View>

      {/* Action buttons - SIMPLIFIED: Only essential buttons */}
      <View style={styles.actionsContainer}>
        {task.status === 'pending' && (
          <>
            <ConstructionButton
              title="Start Route & Navigate"
              subtitle="Opens Google Maps directions"
              onPress={handleStartRoute}
              variant="success"
              size="large"
              style={styles.primaryActionButton}
              disabled={hasActiveTask}
            />
            {hasActiveTask && (
              <Text style={styles.disabledHint}>
                ⚠️ Complete current task first
              </Text>
            )}
          </>
        )}
        
        {/* REMOVED: Update Status button - not necessary, status updates automatically */}
        
        {task.status !== 'pending' && task.status !== 'completed' && (
          <ConstructionButton
            title="View Route Details"
            subtitle="Workers & locations"
            onPress={handleViewRoute}
            variant="primary"
            size="large"
            style={styles.primaryActionButton}
          />
        )}
      </View>
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
  routeName: {
    ...ConstructionTheme.typography.headlineMedium, // ENHANCED: Larger text
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.md, // ENHANCED: More padding
    borderRadius: ConstructionTheme.borderRadius.lg,
    minWidth: 120,
    alignItems: 'center',
  },
  statusText: {
    color: ConstructionTheme.colors.onPrimary,
    ...ConstructionTheme.typography.labelLarge, // ENHANCED: Larger text
    fontWeight: '700',
  },
  progressContainer: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
    overflow: 'hidden',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: ConstructionTheme.colors.success,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  progressText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: ConstructionTheme.spacing.lg,
    paddingVertical: ConstructionTheme.spacing.lg, // ENHANCED: More padding
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.md,
    paddingHorizontal: ConstructionTheme.spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryIcon: {
    fontSize: 32, // ENHANCED: Larger icons
    marginBottom: 4,
  },
  summaryLabel: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginTop: 4,
    fontWeight: '600',
  },
  summaryValue: {
    ...ConstructionTheme.typography.headlineLarge, // ENHANCED: Larger numbers
    color: ConstructionTheme.colors.primary,
    fontWeight: '700',
  },
  actionsContainer: {
    flexDirection: 'column',
    gap: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  primaryActionButton: {
    width: '100%',
    minHeight: ConstructionTheme.spacing.extraLargeTouch, // 72px for gloves
  },
  secondaryActionButton: {
    width: '100%',
    minHeight: ConstructionTheme.spacing.largeTouch, // 60px
  },
  disabledHint: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.warning,
    textAlign: 'center',
    marginTop: ConstructionTheme.spacing.xs,
    fontStyle: 'italic',
    width: '100%',
  },
});

export default TransportTaskCard;