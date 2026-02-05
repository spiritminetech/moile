// AttendanceMonitoringScreen - Real-time attendance tracking and management for supervisors
// Requirements: 3.1, 3.2, 3.3, 3.4, 3.5

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../store/context/AuthContext';
import { useSupervisorContext } from '../../store/context/SupervisorContext';
import { supervisorApiService } from '../../services/api/SupervisorApiService';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';
import { 
  ConstructionButton, 
  ConstructionCard, 
  ConstructionLoadingIndicator,
  ErrorDisplay 
} from '../../components/common';
import { useErrorHandler } from '../../hooks/useErrorHandler';

// Types for attendance monitoring data
interface AttendanceRecord {
  workerId: number;
  workerName: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  lunchStartTime: string | null;
  lunchEndTime: string | null;
  status: 'present' | 'absent' | 'late' | 'on_break';
  location: {
    latitude: number;
    longitude: number;
    insideGeofence: boolean;
    lastUpdated: string;
  };
  hoursWorked: number;
  issues: Array<{
    type: 'geofence_violation' | 'late_arrival' | 'missing_checkout' | 'extended_break';
    description: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

interface AttendanceMonitoringData {
  attendanceRecords: AttendanceRecord[];
  summary: {
    totalWorkers: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    geofenceViolations: number;
    averageHoursWorked: number;
  };
}

interface AttendanceCorrection {
  correctionId: number;
  workerId: number;
  workerName: string;
  requestType: 'check_in' | 'check_out' | 'lunch_start' | 'lunch_end';
  originalTime: string;
  requestedTime: string;
  reason: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

type FilterStatus = 'all' | 'present' | 'absent' | 'late' | 'issues';
type SortBy = 'name' | 'status' | 'checkIn' | 'hoursWorked';

const AttendanceMonitoringScreen: React.FC = () => {
  const { state: authState } = useAuth();
  const { state: supervisorState } = useSupervisorContext();
  const { handleApiError, clearError, error: errorHandlerError } = useErrorHandler();

  // State management
  const [attendanceData, setAttendanceData] = useState<AttendanceMonitoringData | null>(null);
  const [pendingCorrections, setPendingCorrections] = useState<AttendanceCorrection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Filter and search state
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [searchText, setSearchText] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Modal state
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedCorrection, setSelectedCorrection] = useState<AttendanceCorrection | null>(null);
  const [correctionNotes, setCorrectionNotes] = useState('');

  // Auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      loadAttendanceData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [selectedProjectId]);

  // Initial data load
  useEffect(() => {
    loadAttendanceData();
    loadPendingCorrections();
  }, [selectedProjectId]);

  // Load attendance monitoring data
  const loadAttendanceData = useCallback(async () => {
    if (!authState.user) return;

    setIsLoading(true);
    try {
      clearError();
      const response = await supervisorApiService.getAttendanceMonitoring({
        projectId: selectedProjectId || undefined,
        date: new Date().toISOString().split('T')[0],
        status: filterStatus === 'all' || filterStatus === 'issues' ? undefined : filterStatus,
      });

      if (response.success && response.data) {
        setAttendanceData(response.data);
        setLastRefresh(new Date());
      } else {
        handleApiError(new Error(response.message || 'Failed to load attendance data'), 'Load Attendance Data');
      }
    } catch (error) {
      handleApiError(error, 'Load Attendance Data');
    } finally {
      setIsLoading(false);
    }
  }, [authState.user, selectedProjectId, filterStatus, clearError, handleApiError]);

  // Load pending attendance corrections
  const loadPendingCorrections = useCallback(async () => {
    try {
      // This would be a separate API endpoint for pending corrections
      // For now, we'll simulate with empty array
      setPendingCorrections([]);
    } catch (error) {
      console.error('Failed to load pending corrections:', error);
    }
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadAttendanceData(),
        loadPendingCorrections()
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadAttendanceData, loadPendingCorrections]);

  // Filter and sort attendance records
  const filteredAndSortedRecords = useMemo(() => {
    if (!attendanceData) return [];

    let filtered = attendanceData.attendanceRecords;

    // Apply search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(record => 
        record.workerName.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'issues') {
        filtered = filtered.filter(record => record.issues.length > 0);
      } else {
        filtered = filtered.filter(record => record.status === filterStatus);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.workerName.localeCompare(b.workerName);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'checkIn':
          if (!a.checkInTime && !b.checkInTime) return 0;
          if (!a.checkInTime) return 1;
          if (!b.checkInTime) return -1;
          return new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime();
        case 'hoursWorked':
          return b.hoursWorked - a.hoursWorked;
        default:
          return 0;
      }
    });

    return filtered;
  }, [attendanceData, searchText, filterStatus, sortBy]);

  // Handle attendance correction approval
  const handleCorrectionDecision = useCallback(async (
    correction: AttendanceCorrection,
    action: 'approve' | 'reject',
    notes: string
  ) => {
    try {
      const response = await supervisorApiService.approveAttendanceCorrection(
        correction.correctionId,
        {
          action,
          notes,
          correctedTime: action === 'approve' ? correction.requestedTime : undefined,
        }
      );

      if (response.success) {
        Alert.alert(
          'Success',
          `Attendance correction ${action}d successfully`
        );
        loadPendingCorrections();
        setShowCorrectionModal(false);
        setSelectedCorrection(null);
        setCorrectionNotes('');
      } else {
        Alert.alert('Error', response.message || `Failed to ${action} correction`);
      }
    } catch (error) {
      handleApiError(error, 'Process Correction');
    }
  }, [handleApiError, loadPendingCorrections]);

  // Format time display
  const formatTime = (dateString: string | null) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format duration
  const formatDuration = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
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
        return ConstructionTheme.colors.onSurfaceVariant;
    }
  };

  // Get issue severity color
  const getIssueSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return ConstructionTheme.colors.error;
      case 'medium':
        return ConstructionTheme.colors.warning;
      case 'low':
        return ConstructionTheme.colors.info;
      default:
        return ConstructionTheme.colors.onSurfaceVariant;
    }
  };

  // Render attendance summary
  const renderSummary = () => {
    if (!attendanceData) return null;

    const { summary } = attendanceData;
    const attendanceRate = summary.totalWorkers > 0 
      ? Math.round((summary.presentCount / summary.totalWorkers) * 100)
      : 0;

    return (
      <ConstructionCard title="Attendance Summary" variant="default" style={styles.summaryCard}>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.totalWorkers}</Text>
            <Text style={styles.summaryLabel}>Total Workers</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: ConstructionTheme.colors.success }]}>
              {summary.presentCount}
            </Text>
            <Text style={styles.summaryLabel}>Present</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: ConstructionTheme.colors.error }]}>
              {summary.absentCount}
            </Text>
            <Text style={styles.summaryLabel}>Absent</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: ConstructionTheme.colors.warning }]}>
              {summary.lateCount}
            </Text>
            <Text style={styles.summaryLabel}>Late</Text>
          </View>
        </View>

        <View style={styles.summaryMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Attendance Rate</Text>
            <Text style={[styles.metricValue, { color: attendanceRate >= 90 ? ConstructionTheme.colors.success : ConstructionTheme.colors.warning }]}>
              {attendanceRate}%
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Avg. Hours Worked</Text>
            <Text style={styles.metricValue}>
              {formatDuration(summary.averageHoursWorked)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Geofence Issues</Text>
            <Text style={[styles.metricValue, { color: summary.geofenceViolations > 0 ? ConstructionTheme.colors.error : ConstructionTheme.colors.success }]}>
              {summary.geofenceViolations}
            </Text>
          </View>
        </View>
      </ConstructionCard>
    );
  };

  // Render filter controls
  const renderFilters = () => (
    <ConstructionCard title="Filters & Search" variant="outlined" style={styles.filtersCard}>
      {/* Search Input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search workers..."
        value={searchText}
        onChangeText={setSearchText}
        placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
      />

      {/* Status Filter */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Status:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
          {(['all', 'present', 'absent', 'late', 'issues'] as FilterStatus[]).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                filterStatus === status && styles.activeFilterChip,
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterStatus === status && styles.activeFilterChipText,
                ]}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sort Options */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Sort by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
          {([
            { key: 'name', label: 'Name' },
            { key: 'status', label: 'Status' },
            { key: 'checkIn', label: 'Check-in Time' },
            { key: 'hoursWorked', label: 'Hours Worked' },
          ] as Array<{ key: SortBy; label: string }>).map((sort) => (
            <TouchableOpacity
              key={sort.key}
              style={[
                styles.filterChip,
                sortBy === sort.key && styles.activeFilterChip,
              ]}
              onPress={() => setSortBy(sort.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  sortBy === sort.key && styles.activeFilterChipText,
                ]}
              >
                {sort.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ConstructionCard>
  );

  // Render attendance record item
  const renderAttendanceRecord = (record: AttendanceRecord) => (
    <ConstructionCard
      key={record.workerId}
      variant="outlined"
      style={[
        styles.recordCard,
        ...(record.issues.length > 0 ? [styles.recordCardWithIssues] : []),
      ]}
    >
      {/* Worker Header */}
      <View style={styles.recordHeader}>
        <View style={styles.workerInfo}>
          <Text style={styles.workerName}>{record.workerName}</Text>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(record.status) },
              ]}
            />
            <Text style={[styles.statusText, { color: getStatusColor(record.status) }]}>
              {record.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
        
        {/* Location Status */}
        <View style={styles.locationStatus}>
          <Text style={styles.locationLabel}>Location:</Text>
          <View style={styles.geofenceStatus}>
            <View
              style={[
                styles.geofenceDot,
                {
                  backgroundColor: record.location.insideGeofence
                    ? ConstructionTheme.colors.success
                    : ConstructionTheme.colors.error,
                },
              ]}
            />
            <Text
              style={[
                styles.geofenceText,
                {
                  color: record.location.insideGeofence
                    ? ConstructionTheme.colors.success
                    : ConstructionTheme.colors.error,
                },
              ]}
            >
              {record.location.insideGeofence ? 'Inside Site' : 'Outside Site'}
            </Text>
          </View>
        </View>
      </View>

      {/* Time Information */}
      <View style={styles.timeInfo}>
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>Check-in:</Text>
          <Text style={styles.timeValue}>{formatTime(record.checkInTime)}</Text>
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>Check-out:</Text>
          <Text style={styles.timeValue}>{formatTime(record.checkOutTime)}</Text>
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>Lunch:</Text>
          <Text style={styles.timeValue}>
            {record.lunchStartTime && record.lunchEndTime
              ? `${formatTime(record.lunchStartTime)} - ${formatTime(record.lunchEndTime)}`
              : record.lunchStartTime
              ? `Started ${formatTime(record.lunchStartTime)}`
              : '--:-- - --:--'}
          </Text>
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>Hours Worked:</Text>
          <Text style={[styles.timeValue, styles.hoursWorked]}>
            {formatDuration(record.hoursWorked)}
          </Text>
        </View>
      </View>

      {/* Issues Section */}
      {record.issues.length > 0 && (
        <View style={styles.issuesSection}>
          <Text style={styles.issuesTitle}>Issues ({record.issues.length})</Text>
          {record.issues.map((issue, index) => (
            <View key={index} style={styles.issueItem}>
              <View
                style={[
                  styles.issueSeverityDot,
                  { backgroundColor: getIssueSeverityColor(issue.severity) },
                ]}
              />
              <View style={styles.issueContent}>
                <Text style={styles.issueType}>
                  {issue.type.replace(/_/g, ' ').toUpperCase()}
                </Text>
                <Text style={styles.issueDescription}>{issue.description}</Text>
                <Text style={styles.issueTime}>
                  {new Date(issue.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Location Coordinates */}
      <View style={styles.coordinatesSection}>
        <Text style={styles.coordinatesLabel}>Last Known Location:</Text>
        <Text style={styles.coordinatesText}>
          {record.location.latitude.toFixed(6)}, {record.location.longitude.toFixed(6)}
        </Text>
        <Text style={styles.lastUpdatedText}>
          Updated: {new Date(record.location.lastUpdated).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </ConstructionCard>
  );

  // Render correction approval modal
  const renderCorrectionModal = () => (
    <Modal
      visible={showCorrectionModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCorrectionModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Attendance Correction Request</Text>
          
          {selectedCorrection && (
            <>
              <View style={styles.correctionDetails}>
                <Text style={styles.correctionLabel}>Worker:</Text>
                <Text style={styles.correctionValue}>{selectedCorrection.workerName}</Text>
              </View>
              
              <View style={styles.correctionDetails}>
                <Text style={styles.correctionLabel}>Request Type:</Text>
                <Text style={styles.correctionValue}>
                  {selectedCorrection.requestType.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              
              <View style={styles.correctionDetails}>
                <Text style={styles.correctionLabel}>Original Time:</Text>
                <Text style={styles.correctionValue}>{formatTime(selectedCorrection.originalTime)}</Text>
              </View>
              
              <View style={styles.correctionDetails}>
                <Text style={styles.correctionLabel}>Requested Time:</Text>
                <Text style={styles.correctionValue}>{formatTime(selectedCorrection.requestedTime)}</Text>
              </View>
              
              <View style={styles.correctionDetails}>
                <Text style={styles.correctionLabel}>Reason:</Text>
                <Text style={styles.correctionValue}>{selectedCorrection.reason}</Text>
              </View>

              <TextInput
                style={styles.notesInput}
                placeholder="Add notes (optional)..."
                value={correctionNotes}
                onChangeText={setCorrectionNotes}
                multiline
                numberOfLines={3}
                placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
              />

              <View style={styles.modalActions}>
                <ConstructionButton
                  title="Reject"
                  variant="error"
                  size="medium"
                  onPress={() => handleCorrectionDecision(selectedCorrection, 'reject', correctionNotes)}
                  style={styles.modalButton}
                />
                <ConstructionButton
                  title="Approve"
                  variant="success"
                  size="medium"
                  onPress={() => handleCorrectionDecision(selectedCorrection, 'approve', correctionNotes)}
                  style={styles.modalButton}
                />
              </View>
            </>
          )}

          <ConstructionButton
            title="Cancel"
            variant="secondary"
            size="medium"
            onPress={() => {
              setShowCorrectionModal(false);
              setSelectedCorrection(null);
              setCorrectionNotes('');
            }}
            style={styles.cancelButton}
          />
        </View>
      </View>
    </Modal>
  );

  if (isLoading && !attendanceData) {
    return (
      <ConstructionLoadingIndicator
        visible={true}
        message="Loading attendance data..."
        variant="card"
        size="large"
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance Monitoring</Text>
        {lastRefresh && (
          <Text style={styles.lastRefreshText}>
            Last updated: {lastRefresh.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        )}
      </View>

      {/* Error Display */}
      {errorHandlerError && (
        <ErrorDisplay
          error={errorHandlerError}
          variant="banner"
          onRetry={loadAttendanceData}
          onDismiss={clearError}
        />
      )}

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[ConstructionTheme.colors.primary]}
            tintColor={ConstructionTheme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Section */}
        {renderSummary()}

        {/* Pending Corrections Alert */}
        {pendingCorrections.length > 0 && (
          <ConstructionCard title="Pending Corrections" variant="warning" style={styles.correctionsCard}>
            <Text style={styles.correctionsText}>
              {pendingCorrections.length} attendance correction{pendingCorrections.length > 1 ? 's' : ''} awaiting approval
            </Text>
            <ConstructionButton
              title="Review Corrections"
              variant="warning"
              size="small"
              onPress={() => {
                if (pendingCorrections.length > 0) {
                  setSelectedCorrection(pendingCorrections[0]);
                  setShowCorrectionModal(true);
                }
              }}
              style={styles.reviewButton}
            />
          </ConstructionCard>
        )}

        {/* Filters */}
        {renderFilters()}

        {/* Attendance Records */}
        <View style={styles.recordsSection}>
          <Text style={styles.recordsTitle}>
            Worker Attendance ({filteredAndSortedRecords.length} records)
          </Text>
          
          {filteredAndSortedRecords.length > 0 ? (
            filteredAndSortedRecords.map(renderAttendanceRecord)
          ) : (
            <ConstructionCard variant="outlined" style={styles.noDataCard}>
              <Text style={styles.noDataText}>
                {searchText.trim() || filterStatus !== 'all'
                  ? 'No workers match your filters'
                  : 'No attendance data available'}
              </Text>
            </ConstructionCard>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <ConstructionButton
            title="Export Report"
            variant="secondary"
            size="medium"
            onPress={() => {
              // TODO: Implement export functionality
              Alert.alert('Export', 'Export functionality coming soon');
            }}
            style={styles.actionButton}
          />
          <ConstructionButton
            title="Refresh Data"
            variant="primary"
            size="medium"
            onPress={handleRefresh}
            loading={isRefreshing}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>

      {/* Correction Approval Modal */}
      {renderCorrectionModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.background,
  },
  header: {
    backgroundColor: ConstructionTheme.colors.primary,
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingTop: ConstructionTheme.spacing.xl,
    paddingBottom: ConstructionTheme.spacing.md,
    ...ConstructionTheme.shadows.medium,
  },
  headerTitle: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  lastRefreshText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onPrimary,
    opacity: 0.8,
    marginTop: ConstructionTheme.spacing.xs,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: ConstructionTheme.spacing.xl,
  },
  summaryCard: {
    margin: ConstructionTheme.spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: ConstructionTheme.spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  summaryLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  summaryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: ConstructionTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  metricValue: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
  },
  correctionsCard: {
    marginHorizontal: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  correctionsText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  reviewButton: {
    alignSelf: 'flex-start',
  },
  filtersCard: {
    marginHorizontal: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
    borderRadius: ConstructionTheme.borderRadius.sm,
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    backgroundColor: ConstructionTheme.colors.surface,
    marginBottom: ConstructionTheme.spacing.md,
    minHeight: ConstructionTheme.dimensions.inputMedium,
  },
  filterRow: {
    marginBottom: ConstructionTheme.spacing.sm,
  },
  filterLabel: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  filterChips: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: ConstructionTheme.spacing.xs,
    borderRadius: ConstructionTheme.borderRadius.sm,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    marginRight: ConstructionTheme.spacing.xs,
    minHeight: 32,
    justifyContent: 'center',
  },
  activeFilterChip: {
    backgroundColor: ConstructionTheme.colors.primary,
  },
  filterChipText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  activeFilterChipText: {
    color: ConstructionTheme.colors.onPrimary,
  },
  recordsSection: {
    marginHorizontal: ConstructionTheme.spacing.md,
  },
  recordsTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  recordCard: {
    marginBottom: ConstructionTheme.spacing.sm,
  },
  recordCardWithIssues: {
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.error,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: ConstructionTheme.spacing.xs,
  },
  statusText: {
    ...ConstructionTheme.typography.labelSmall,
    fontWeight: 'bold',
  },
  locationStatus: {
    alignItems: 'flex-end',
  },
  locationLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  geofenceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  geofenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: ConstructionTheme.spacing.xs,
  },
  geofenceText: {
    ...ConstructionTheme.typography.labelSmall,
    fontWeight: 'bold',
  },
  timeInfo: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
    padding: ConstructionTheme.spacing.sm,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  timeLabel: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  timeValue: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
  },
  hoursWorked: {
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
  },
  issuesSection: {
    backgroundColor: '#FFEBEE',
    borderRadius: ConstructionTheme.borderRadius.sm,
    padding: ConstructionTheme.spacing.sm,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  issuesTitle: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.error,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  issueSeverityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: ConstructionTheme.spacing.xs,
  },
  issueContent: {
    flex: 1,
  },
  issueType: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.error,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  issueDescription: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: 2,
  },
  issueTime: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  coordinatesSection: {
    paddingTop: ConstructionTheme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline,
  },
  coordinatesLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  coordinatesText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurface,
    fontFamily: 'monospace',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  lastUpdatedText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  noDataCard: {
    padding: ConstructionTheme.spacing.xl,
    alignItems: 'center',
  },
  noDataText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: ConstructionTheme.spacing.md,
    marginTop: ConstructionTheme.spacing.lg,
    gap: ConstructionTheme.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ConstructionTheme.spacing.lg,
  },
  modalContent: {
    backgroundColor: ConstructionTheme.colors.surface,
    borderRadius: ConstructionTheme.borderRadius.md,
    padding: ConstructionTheme.spacing.lg,
    width: '100%',
    maxWidth: 400,
    ...ConstructionTheme.shadows.large,
  },
  modalTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.md,
    textAlign: 'center',
  },
  correctionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  correctionLabel: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: '600',
  },
  correctionValue: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    flex: 1,
    textAlign: 'right',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
    borderRadius: ConstructionTheme.borderRadius.sm,
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    backgroundColor: ConstructionTheme.colors.surface,
    marginVertical: ConstructionTheme.spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ConstructionTheme.spacing.md,
    gap: ConstructionTheme.spacing.md,
  },
  modalButton: {
    flex: 1,
  },
  cancelButton: {
    alignSelf: 'center',
    minWidth: 120,
  },
});

export default AttendanceMonitoringScreen;