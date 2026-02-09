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
}

const TransportTaskCard: React.FC<TransportTaskCardProps> = ({
  task,
  onStartRoute,
  onViewRoute,
  onUpdateStatus,
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
        return 'Ready to Start';
      case 'en_route_pickup':
        return 'En Route to Pickup';
      case 'pickup_complete':
        return 'Pickup Complete';
      case 'en_route_dropoff':
        return 'En Route to Site';
      case 'completed':
        return 'Trip Complete';
      default:
        return 'Unknown Status';
    }
  };

  // Handle start route
  const handleStartRoute = () => {
    Alert.alert(
      'Start Route',
      `Are you sure you want to start route "${task.route}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start', onPress: () => onStartRoute(task.taskId) },
      ]
    );
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

  return (
    <ConstructionCard
      variant="elevated"
      style={styles.container}
    >
      {/* Header with status */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.routeName}>{task.route}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
          <Text style={styles.statusText}>{getStatusText(task.status)}</Text>
        </View>
      </View>

      {/* Worker summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Workers:</Text>
          <Text style={styles.summaryValue}>{task.totalWorkers}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Checked In:</Text>
          <Text style={styles.summaryValue}>{task.checkedInWorkers}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Pickup Locations:</Text>
          <Text style={styles.summaryValue}>{task.pickupLocations?.length || 0}</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionsContainer}>
        {task.status === 'pending' && (
          <ConstructionButton
            title="Start Route"
            onPress={handleStartRoute}
            variant="success"
            size="medium"
            icon="🚗"
            style={styles.actionButton}
          />
        )}
        
        {['en_route_pickup', 'pickup_complete', 'en_route_dropoff'].includes(task.status) && (
          <ConstructionButton
            title="Update Status"
            onPress={handleStatusUpdate}
            variant="primary"
            size="medium"
            icon="📍"
            style={styles.actionButton}
          />
        )}
        
        <ConstructionButton
          title="View Route"
          onPress={handleViewRoute}
          variant="neutral"
          size="medium"
          icon="🗺️"
          style={styles.actionButton}
        />
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
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: 4,
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
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ConstructionTheme.spacing.lg,
    paddingVertical: ConstructionTheme.spacing.sm,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
    paddingHorizontal: ConstructionTheme.spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  summaryValue: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.primary,
    fontWeight: '700',
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
});

export default TransportTaskCard;