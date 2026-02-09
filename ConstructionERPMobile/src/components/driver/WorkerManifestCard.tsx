// WorkerManifestCard Component - Display worker manifest for passenger management
// Requirements: 8.1, 8.2, 8.3, 8.4, 8.5

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { TransportTask } from '../../types';
import { ConstructionButton, ConstructionCard } from '../common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface WorkerManifestCardProps {
  task: TransportTask | null;
  onCheckInWorker: (workerId: number, locationId: number) => void;
  onCheckOutWorker: (workerId: number, locationId: number) => void;
  onCallWorker: (phone: string, name: string) => void;
}

const WorkerManifestCard: React.FC<WorkerManifestCardProps> = ({
  task,
  onCheckInWorker,
  onCheckOutWorker,
  onCallWorker,
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);

  // Handle worker check-in
  const handleCheckIn = (workerId: number, locationId: number, workerName: string) => {
    Alert.alert(
      'Check In Worker',
      `Confirm check-in for ${workerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Check In', onPress: () => onCheckInWorker(workerId, locationId) },
      ]
    );
  };

  // Handle worker check-out
  const handleCheckOut = (workerId: number, locationId: number, workerName: string) => {
    Alert.alert(
      'Check Out Worker',
      `Confirm check-out for ${workerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Check Out', onPress: () => onCheckOutWorker(workerId, locationId) },
      ]
    );
  };

  // Format time
  const formatTime = (timeString: string): string => {
    if (!timeString) return 'Not set';
    
    try {
      const date = new Date(timeString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Not set';
      }
      
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Not set';
    }
  };

  // Render basic worker item (requirements only)
  const renderWorkerItem = (
    worker: {
      workerId: number;
      name: string;
      phone: string;
      checkedIn: boolean;
      checkInTime?: string;
      trade: string;
      supervisorName: string;
    },
    locationId: number
  ) => {
    return (
      <View key={`${locationId}-${worker.workerId}`} style={styles.workerItem}>
        <View style={styles.workerHeader}>
          <View style={styles.workerInfo}>
            <Text style={styles.workerName}>{worker.name}</Text>
            <Text style={styles.workerDetails}>Trade: {worker.trade}</Text>
            <Text style={styles.supervisorInfo}>Supervisor: {worker.supervisorName}</Text>
            {worker.phone && (
              <Text style={styles.workerPhone}>{worker.phone}</Text>
            )}
            {worker.checkedIn && worker.checkInTime && (
              <Text style={styles.checkInTime}>
                Checked in: {formatTime(worker.checkInTime)}
              </Text>
            )}
          </View>
          
          <View style={styles.workerStatus}>
            <View style={[
              styles.statusIndicator,
              worker.checkedIn ? styles.checkedIn : styles.notCheckedIn
            ]}>
              <Text style={styles.statusText}>
                {worker.checkedIn ? '✅ IN' : '⏳ WAITING'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.workerActions}>
          {!worker.checkedIn ? (
            <>
              <ConstructionButton
                title="Check In"
                onPress={() => handleCheckIn(worker.workerId, locationId, worker.name)}
                variant="primary"
                size="small"
                style={styles.actionButton}
              />
              {worker.phone && (
                <ConstructionButton
                  title="Call"
                  onPress={() => onCallWorker(worker.phone, worker.name)}
                  variant="outlined"
                  size="small"
                  style={styles.actionButton}
                />
              )}
            </>
          ) : (
            <>
              <ConstructionButton
                title="Check Out"
                onPress={() => handleCheckOut(worker.workerId, locationId, worker.name)}
                variant="secondary"
                size="small"
                style={styles.actionButton}
              />
              {worker.phone && (
                <ConstructionButton
                  title="Call"
                  onPress={() => onCallWorker(worker.phone, worker.name)}
                  variant="outlined"
                  size="small"
                  style={styles.actionButton}
                />
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  // Render location section
  const renderLocationSection = (location: {
    locationId: number;
    name: string;
    address: string;
    workerManifest: Array<{
      workerId: number;
      name: string;
      phone: string;
      checkedIn: boolean;
      checkInTime?: string;
      trade: string;
      supervisorName: string;
    }>;
    estimatedPickupTime: string;
    actualPickupTime?: string;
  }) => {
    const checkedInCount = location.workerManifest.filter(w => w.checkedIn).length;
    const totalCount = location.workerManifest.length;
    const isCompleted = !!location.actualPickupTime;

    return (
      <View key={location.locationId} style={styles.locationSection}>
        <TouchableOpacity 
          style={styles.locationHeader}
          onPress={() => setSelectedLocationId(
            selectedLocationId === location.locationId ? null : location.locationId
          )}
        >
          <View style={styles.locationInfo}>
            <Text style={styles.locationName}>{location.name}</Text>
            <Text style={styles.locationAddress}>{location.address}</Text>
            <Text style={styles.pickupTime}>
              {isCompleted 
                ? `Completed: ${formatTime(location.actualPickupTime!)}`
                : `Pickup: ${formatTime(location.estimatedPickupTime)}`
              }
            </Text>
          </View>
          <View style={styles.locationStats}>
            <Text style={styles.workerCount}>
              {checkedInCount}/{totalCount}
            </Text>
            <Text style={styles.workerCountLabel}>Workers</Text>
            {isCompleted && (
              <Text style={styles.completedBadge}>✅ Done</Text>
            )}
            <Text style={styles.expandIcon}>
              {selectedLocationId === location.locationId ? '▼' : '▶'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: `${totalCount > 0 ? (checkedInCount / totalCount) * 100 : 0}%` }
            ]}
          />
        </View>

        {selectedLocationId === location.locationId && (
          <View style={styles.locationDetails}>
            <View style={styles.workersContainer}>
              {location.workerManifest.map((worker: any) => 
                renderWorkerItem(worker, location.locationId)
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  // Render summary stats
  const renderSummaryStats = () => {
    if (!task || !task.pickupLocations) return null;

    const totalWorkers = task.totalWorkers;
    const checkedInWorkers = task.checkedInWorkers;
    const completedLocations = task.pickupLocations.filter(loc => loc.actualPickupTime).length;
    const totalLocations = task.pickupLocations.length;

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{checkedInWorkers}/{totalWorkers}</Text>
          <Text style={styles.summaryLabel}>Workers</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{completedLocations}/{totalLocations}</Text>
          <Text style={styles.summaryLabel}>Locations</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {totalWorkers > 0 ? Math.round((checkedInWorkers / totalWorkers) * 100) : 0}%
          </Text>
          <Text style={styles.summaryLabel}>Complete</Text>
        </View>
      </View>
    );
  };

  if (!task) {
    return (
      <ConstructionCard
        variant="outlined"
        style={styles.container}
      >
        <View style={styles.noTaskContainer}>
          <Text style={styles.noTaskText}>👥 No worker manifest</Text>
          <Text style={styles.noTaskSubtext}>Select a transport task to view worker manifest</Text>
        </View>
      </ConstructionCard>
    );
  }

  if (!task.pickupLocations || task.pickupLocations.length === 0) {
    return (
      <ConstructionCard
        variant="outlined"
        style={styles.container}
      >
        <View style={styles.noTaskContainer}>
          <Text style={styles.noTaskText}>👥 No pickup locations</Text>
          <Text style={styles.noTaskSubtext}>This transport task has no pickup locations assigned</Text>
        </View>
      </ConstructionCard>
    );
  }

  return (
    <ConstructionCard
      variant="elevated"
      style={styles.container}
    >
      <Text style={styles.cardTitle}>👥 Worker Manifest</Text>
      
      {/* Summary stats */}
      {renderSummaryStats()}

      {/* Pickup locations */}
      <View style={styles.locationsContainer}>
        {task.pickupLocations.map(location => renderLocationSection(location))}
      </View>
    </ConstructionCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  cardTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.lg,
    textAlign: 'center',
  },
  noTaskContainer: {
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.xl,
  },
  noTaskText: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  noTaskSubtext: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
    paddingVertical: ConstructionTheme.spacing.md,
    paddingHorizontal: ConstructionTheme.spacing.lg,
    marginBottom: ConstructionTheme.spacing.lg,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: ConstructionTheme.colors.outline,
    marginHorizontal: ConstructionTheme.spacing.md,
  },
  locationsContainer: {
    marginBottom: ConstructionTheme.spacing.sm,
  },
  locationSection: {
    marginBottom: ConstructionTheme.spacing.lg,
    paddingBottom: ConstructionTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ConstructionTheme.spacing.md,
  },
  locationInfo: {
    flex: 1,
    marginRight: ConstructionTheme.spacing.md,
  },
  locationName: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationAddress: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  pickupTime: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.primary,
    fontWeight: '600',
  },
  locationStats: {
    alignItems: 'center',
  },
  workerCount: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.primary,
    fontWeight: '700',
  },
  workerCountLabel: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  completedBadge: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.success,
    fontWeight: '600',
  },
  expandIcon: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: ConstructionTheme.colors.outline,
    borderRadius: 3,
    marginBottom: ConstructionTheme.spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ConstructionTheme.colors.success,
    borderRadius: 3,
  },
  locationDetails: {
    marginTop: ConstructionTheme.spacing.md,
  },
  workersContainer: {
    marginBottom: ConstructionTheme.spacing.sm,
  },
  workerItem: {
    backgroundColor: ConstructionTheme.colors.surface,
    borderRadius: ConstructionTheme.borderRadius.sm,
    padding: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.md,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
  },
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ConstructionTheme.spacing.md,
  },
  workerInfo: {
    flex: 1,
    marginRight: ConstructionTheme.spacing.md,
  },
  workerName: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
    marginBottom: 4,
  },
  workerDetails: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  supervisorInfo: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.secondary,
    marginBottom: 2,
  },
  workerPhone: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  checkInTime: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.success,
    fontWeight: '500',
  },
  workerStatus: {
    alignItems: 'center',
  },
  statusIndicator: {
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: 4,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  checkedIn: {
    backgroundColor: ConstructionTheme.colors.success + '20',
  },
  notCheckedIn: {
    backgroundColor: ConstructionTheme.colors.warning + '20',
  },
  statusText: {
    ...ConstructionTheme.typography.bodySmall,
    fontWeight: '600',
  },
  workerActions: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    minWidth: 80,
  },
});

export default WorkerManifestCard;