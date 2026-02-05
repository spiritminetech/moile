// Worker List Component for Supervisor Team Management
// Requirements: 3.1, 3.2, 3.3

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { TeamMember } from '../../types';
import ConstructionCard from '../common/ConstructionCard';
import ConstructionInput from '../common/ConstructionInput';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface WorkerListComponentProps {
  workers: TeamMember[];
  isLoading: boolean;
  onRefresh?: () => void;
  onWorkerPress?: (worker: TeamMember) => void;
  onViewLocation?: (worker: TeamMember) => void;
  onContactWorker?: (worker: TeamMember) => void;
  showSearch?: boolean;
  showFilters?: boolean;
}

const WorkerListComponent: React.FC<WorkerListComponentProps> = ({
  workers,
  isLoading,
  onRefresh,
  onWorkerPress,
  onViewLocation,
  onContactWorker,
  showSearch = true,
  showFilters = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getStatusColor = (status: TeamMember['attendanceStatus']): string => {
    switch (status) {
      case 'present':
        return ConstructionTheme.colors.success;
      case 'absent':
        return ConstructionTheme.colors.error;
      case 'late':
        return ConstructionTheme.colors.warning;
      case 'on_break':
        return ConstructionTheme.colors.info;
      default:
        return ConstructionTheme.colors.neutral;
    }
  };

  const getStatusIcon = (status: TeamMember['attendanceStatus']): string => {
    switch (status) {
      case 'present':
        return '✅';
      case 'absent':
        return '❌';
      case 'late':
        return '⚠️';
      case 'on_break':
        return '☕';
      default:
        return '❓';
    }
  };

  const getCertificationStatusIcon = (status: 'active' | 'expiring' | 'expired'): string => {
    switch (status) {
      case 'active':
        return '✅';
      case 'expiring':
        return '⚠️';
      case 'expired':
        return '❌';
      default:
        return '❓';
    }
  };

  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         worker.role.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || worker.attendanceStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleWorkerPress = (worker: TeamMember) => {
    if (onWorkerPress) {
      onWorkerPress(worker);
    } else {
      // Default action - show worker details
      Alert.alert(
        `${worker.name}`,
        `Role: ${worker.role}\nStatus: ${worker.attendanceStatus}\nCurrent Task: ${worker.currentTask?.name || 'None'}`,
        [
          { text: 'Cancel', style: 'cancel' },
          ...(onViewLocation ? [{ text: 'View Location', onPress: () => onViewLocation(worker) }] : []),
          ...(onContactWorker ? [{ text: 'Contact', onPress: () => onContactWorker(worker) }] : []),
        ]
      );
    }
  };

  const renderWorkerItem = ({ item: worker }: { item: TeamMember }) => {
    const hasExpiredCerts = worker.certifications.some(cert => cert.status === 'expired');
    const hasExpiringCerts = worker.certifications.some(cert => cert.status === 'expiring');

    return (
      <ConstructionCard
        style={styles.workerCard}
        variant={hasExpiredCerts ? 'error' : hasExpiringCerts ? 'warning' : 'default'}
      >
        <TouchableOpacity
          style={styles.workerContent}
          onPress={() => handleWorkerPress(worker)}
          activeOpacity={0.7}
        >
          {/* Worker Header */}
          <View style={styles.workerHeader}>
            <View style={styles.workerInfo}>
              <Text style={styles.workerName}>{worker.name}</Text>
              <Text style={styles.workerRole}>{worker.role}</Text>
            </View>
            
            <View style={styles.statusContainer}>
              <Text style={styles.statusIcon}>
                {getStatusIcon(worker.attendanceStatus)}
              </Text>
              <Text style={[
                styles.statusText,
                { color: getStatusColor(worker.attendanceStatus) }
              ]}>
                {worker.attendanceStatus.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Current Task */}
          {worker.currentTask && (
            <View style={styles.taskContainer}>
              <Text style={styles.taskLabel}>Current Task:</Text>
              <Text style={styles.taskName}>{worker.currentTask.name}</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${worker.currentTask.progress}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>{worker.currentTask.progress}%</Text>
              </View>
            </View>
          )}

          {/* Location Status */}
          <View style={styles.locationContainer}>
            <Text style={styles.locationIcon}>
              {worker.location.insideGeofence ? '📍' : '⚠️'}
            </Text>
            <Text style={[
              styles.locationText,
              { color: worker.location.insideGeofence ? ConstructionTheme.colors.success : ConstructionTheme.colors.warning }
            ]}>
              {worker.location.insideGeofence ? 'On Site' : 'Outside Geofence'}
            </Text>
            <Text style={styles.locationTime}>
              Updated: {new Date(worker.location.lastUpdated).toLocaleTimeString()}
            </Text>
          </View>

          {/* Certifications Status */}
          {worker.certifications.length > 0 && (
            <View style={styles.certificationsContainer}>
              <Text style={styles.certificationsLabel}>Certifications:</Text>
              <View style={styles.certificationsRow}>
                {worker.certifications.slice(0, 3).map((cert, index) => (
                  <View key={index} style={styles.certificationItem}>
                    <Text style={styles.certificationIcon}>
                      {getCertificationStatusIcon(cert.status)}
                    </Text>
                    <Text style={styles.certificationName}>{cert.name}</Text>
                  </View>
                ))}
                {worker.certifications.length > 3 && (
                  <Text style={styles.moreCertifications}>
                    +{worker.certifications.length - 3} more
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {onViewLocation && (
              <TouchableOpacity
                style={[styles.actionButton, styles.locationButton]}
                onPress={() => onViewLocation(worker)}
              >
                <Text style={styles.actionButtonText}>📍 Location</Text>
              </TouchableOpacity>
            )}
            
            {onContactWorker && (
              <TouchableOpacity
                style={[styles.actionButton, styles.contactButton]}
                onPress={() => onContactWorker(worker)}
              >
                <Text style={styles.actionButtonText}>📞 Contact</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </ConstructionCard>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>👥</Text>
      <Text style={styles.emptyStateTitle}>No Workers Found</Text>
      <Text style={styles.emptyStateMessage}>
        {searchQuery || statusFilter !== 'all' 
          ? 'Try adjusting your search or filters'
          : 'No team members assigned to your projects'
        }
      </Text>
    </View>
  );

  const statusOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Present', value: 'present' },
    { label: 'Absent', value: 'absent' },
    { label: 'Late', value: 'late' },
    { label: 'On Break', value: 'on_break' },
  ];

  return (
    <View style={styles.container}>
      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <View style={styles.filtersContainer}>
          {showSearch && (
            <ConstructionInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search workers..."
              icon="🔍"
              style={styles.searchInput}
            />
          )}
          
          {showFilters && (
            <View style={styles.statusFilters}>
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterButton,
                    statusFilter === option.value && styles.activeFilterButton
                  ]}
                  onPress={() => setStatusFilter(option.value)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    statusFilter === option.value && styles.activeFilterButtonText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Workers List */}
      <FlatList
        data={filteredWorkers}
        renderItem={renderWorkerItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isLoading}
              onRefresh={onRefresh}
              colors={[ConstructionTheme.colors.primary]}
            />
          ) : undefined
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* Summary */}
      {filteredWorkers.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            Showing {filteredWorkers.length} of {workers.length} workers
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.surface,
  },
  searchInput: {
    marginBottom: ConstructionTheme.spacing.sm,
  },
  statusFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ConstructionTheme.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.md,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.neutral,
  },
  activeFilterButton: {
    backgroundColor: ConstructionTheme.colors.primary,
    borderColor: ConstructionTheme.colors.primary,
  },
  filterButtonText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  activeFilterButtonText: {
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: '600',
  },
  listContent: {
    padding: ConstructionTheme.spacing.md,
  },
  workerCard: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  workerContent: {
    padding: ConstructionTheme.spacing.md,
  },
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ConstructionTheme.spacing.md,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  workerRole: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: ConstructionTheme.dimensions.iconMedium,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  statusText: {
    ...ConstructionTheme.typography.labelSmall,
    fontWeight: '600',
  },
  taskContainer: {
    marginBottom: ConstructionTheme.spacing.md,
    padding: ConstructionTheme.spacing.sm,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  taskLabel: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  taskName: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: ConstructionTheme.colors.neutral,
    borderRadius: 4,
    marginRight: ConstructionTheme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: ConstructionTheme.colors.primary,
    borderRadius: 4,
  },
  progressText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    minWidth: 40,
    textAlign: 'right',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.md,
  },
  locationIcon: {
    fontSize: ConstructionTheme.dimensions.iconSmall,
    marginRight: ConstructionTheme.spacing.sm,
  },
  locationText: {
    ...ConstructionTheme.typography.bodyMedium,
    fontWeight: '600',
    marginRight: ConstructionTheme.spacing.sm,
  },
  locationTime: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  certificationsContainer: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  certificationsLabel: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  certificationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  certificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  certificationIcon: {
    fontSize: ConstructionTheme.dimensions.iconSmall,
    marginRight: ConstructionTheme.spacing.xs,
  },
  certificationName: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurface,
  },
  moreCertifications: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: ConstructionTheme.spacing.sm,
    paddingHorizontal: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    alignItems: 'center',
  },
  locationButton: {
    backgroundColor: ConstructionTheme.colors.info + '20',
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.info,
  },
  contactButton: {
    backgroundColor: ConstructionTheme.colors.success + '20',
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.success,
  },
  actionButtonText: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ConstructionTheme.spacing.xl * 2,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: ConstructionTheme.spacing.lg,
  },
  emptyStateTitle: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  emptyStateMessage: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: ConstructionTheme.spacing.lg,
  },
  summary: {
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    alignItems: 'center',
  },
  summaryText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
});

export default WorkerListComponent;