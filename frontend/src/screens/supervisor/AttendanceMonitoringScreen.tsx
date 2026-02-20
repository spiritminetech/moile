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
  SafeAreaView,
  StatusBar,
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
  employeeId: number;
  workerName: string;
  role: string;
  phone?: string;
  email?: string;
  projectId: number;
  projectName: string;
  projectLocation: string;
  status: 'CHECKED_IN' | 'CHECKED_OUT' | 'ABSENT';
  checkInTime: string | null;
  checkOutTime: string | null;
  lunchStartTime?: string | null;
  lunchEndTime?: string | null;
  lunchDuration?: number;
  workingHours: number;
  regularHours?: number;
  otHours?: number;
  isLate: boolean;
  minutesLate: number;
  insideGeofence: boolean;
  insideGeofenceAtCheckout: boolean;
  taskAssigned: string;
  supervisorId?: number;
  lastLocationUpdate: string | null;
  lastKnownLocation: {
    latitude: number;
    longitude: number;
    insideGeofence: boolean;
  } | null;
  hasManualOverride: boolean;
  attendanceId: number | null;
  absenceReason?: 'LEAVE_APPROVED' | 'LEAVE_NOT_INFORMED' | 'MEDICAL' | 'UNAUTHORIZED' | 'PRESENT' | null;
  absenceNotes?: string;
  absenceMarkedBy?: number | null;
  absenceMarkedAt?: string | null;
}

interface AttendanceMonitoringData {
  workers: AttendanceRecord[];
  summary: {
    totalWorkers: number;
    checkedIn: number;
    checkedOut: number;
    absent: number;
    late: number;
    onTime: number;
    lastUpdated: string;
    date: string;
  };
  projects: Array<{
    id: number;
    name: string;
    location: string;
    geofenceRadius?: number;
  }>;
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

  // New modal states
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [selectedWorkerForAbsence, setSelectedWorkerForAbsence] = useState<AttendanceRecord | null>(null);
  const [absenceReason, setAbsenceReason] = useState<'LEAVE_APPROVED' | 'LEAVE_NOT_INFORMED' | 'MEDICAL' | 'UNAUTHORIZED' | 'PRESENT'>('LEAVE_NOT_INFORMED');
  const [absenceNotes, setAbsenceNotes] = useState('');

  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [selectedWorkerForEscalation, setSelectedWorkerForEscalation] = useState<AttendanceRecord | null>(null);
  const [escalationType, setEscalationType] = useState<'REPEATED_LATE' | 'REPEATED_ABSENCE' | 'GEOFENCE_VIOLATION' | 'UNAUTHORIZED_ABSENCE' | 'OTHER'>('REPEATED_LATE');
  const [escalationSeverity, setEscalationSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [escalationDescription, setEscalationDescription] = useState('');
  const [escalatedTo, setEscalatedTo] = useState<'ADMIN' | 'MANAGER' | 'HR'>('MANAGER');
  const [escalationNotes, setEscalationNotes] = useState('');

  const [isExporting, setIsExporting] = useState(false);

  // Auto-select first project when projects are loaded
  useEffect(() => {
    if (attendanceData?.projects && attendanceData.projects.length > 0 && selectedProjectId === null) {
      // Find project with id 1 (where test data is), or use first project
      const targetProject = attendanceData.projects.find(p => p.id === 1) || attendanceData.projects[0];
      if (targetProject?.id) {
        console.log('🎯 Auto-selecting project:', targetProject.id, targetProject.name);
        setSelectedProjectId(targetProject.id);
      }
    }
  }, [attendanceData?.projects, selectedProjectId]);

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
      const response = await supervisorApiService.getPendingAttendanceCorrections({
        projectId: selectedProjectId?.toString(),
        status: 'pending'
      });

      console.log('📋 Pending corrections response:', {
        success: response.success,
        hasData: !!response.data,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        fullResponse: JSON.stringify(response, null, 2)
      });

      if (response.success && response.data) {
        // Backend returns { success: true, data: [...corrections], count }
        const corrections = response.data.data || [];
        console.log('✅ Setting pending corrections:', corrections.length, 'items');
        setPendingCorrections(corrections);
      } else {
        console.log('⚠️ No data in response');
        setPendingCorrections([]);
      }
    } catch (error) {
      console.error('❌ Failed to load pending corrections:', error);
      setPendingCorrections([]);
    }
  }, [selectedProjectId]);

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
    if (!attendanceData || !attendanceData.workers) return [];

    let filtered = [...attendanceData.workers];

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
        // Filter for workers with issues (late, absent, or outside geofence)
        filtered = filtered.filter(record => 
          record.isLate || 
          record.status === 'ABSENT' || 
          !record.insideGeofence ||
          (record.lastKnownLocation && !record.lastKnownLocation.insideGeofence)
        );
      } else if (filterStatus === 'present') {
        filtered = filtered.filter(record => record.status === 'CHECKED_IN' || record.status === 'CHECKED_OUT');
      } else if (filterStatus === 'absent') {
        filtered = filtered.filter(record => record.status === 'ABSENT');
      } else if (filterStatus === 'late') {
        filtered = filtered.filter(record => record.isLate);
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
          return b.workingHours - a.workingHours;
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

  // Handle marking absence reason
  const handleMarkAbsence = useCallback(async () => {
    if (!selectedWorkerForAbsence) return;

    try {
      const response = await supervisorApiService.markAbsenceReason({
        employeeId: selectedWorkerForAbsence.employeeId,
        projectId: selectedWorkerForAbsence.projectId,
        date: attendanceData?.summary.date || new Date().toISOString().split('T')[0],
        reason: absenceReason,
        notes: absenceNotes
      });

      if (response.success) {
        Alert.alert('Success', 'Absence reason marked successfully');
        loadAttendanceData();
        setShowAbsenceModal(false);
        setSelectedWorkerForAbsence(null);
        setAbsenceNotes('');
      } else {
        Alert.alert('Error', response.message || 'Failed to mark absence reason');
      }
    } catch (error) {
      handleApiError(error, 'Mark Absence');
    }
  }, [selectedWorkerForAbsence, absenceReason, absenceNotes, attendanceData, handleApiError, loadAttendanceData]);

  // Handle creating escalation
  const handleCreateEscalation = useCallback(async () => {
    if (!selectedWorkerForEscalation) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await supervisorApiService.createEscalation({
        employeeId: selectedWorkerForEscalation.employeeId,
        projectId: selectedWorkerForEscalation.projectId,
        escalationType,
        severity: escalationSeverity,
        description: escalationDescription || `${escalationType} for ${selectedWorkerForEscalation.workerName}`,
        occurrenceCount: 1,
        dateRange: {
          from: sevenDaysAgo,
          to: today
        },
        escalatedTo,
        notes: escalationNotes,
        relatedAttendanceIds: selectedWorkerForEscalation.attendanceId ? [selectedWorkerForEscalation.attendanceId] : []
      });

      if (response.success) {
        Alert.alert('Success', 'Escalation created successfully');
        setShowEscalationModal(false);
        setSelectedWorkerForEscalation(null);
        setEscalationDescription('');
        setEscalationNotes('');
      } else {
        Alert.alert('Error', response.message || 'Failed to create escalation');
      }
    } catch (error) {
      handleApiError(error, 'Create Escalation');
    }
  }, [selectedWorkerForEscalation, escalationType, escalationSeverity, escalationDescription, escalatedTo, escalationNotes, handleApiError]);

  // Handle export report
  const handleExportReport = useCallback(async (format: 'json' | 'csv' = 'json') => {
    if (!selectedProjectId) {
      Alert.alert('Error', 'Please select a project first');
      return;
    }

    setIsExporting(true);
    try {
      const response = await supervisorApiService.exportAttendanceReport({
        projectId: selectedProjectId,
        date: attendanceData?.summary.date || new Date().toISOString().split('T')[0],
        format
      });

      if (response.success && response.data) {
        // For JSON format, show summary
        if (format === 'json') {
          const summary = response.data.summary;
          Alert.alert(
            'Report Generated',
            `Project: ${summary.projectName}\nDate: ${summary.date}\nTotal Workers: ${summary.totalWorkers}\nPresent: ${summary.present}\nAbsent: ${summary.absent}\nTotal Hours: ${summary.totalRegularHours}\nOT Hours: ${summary.totalOTHours}`,
            [
              { text: 'OK' }
            ]
          );
        } else {
          // For CSV, would need to implement file download/share
          Alert.alert('Success', 'Report exported successfully');
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to export report');
      }
    } catch (error) {
      handleApiError(error, 'Export Report');
    } finally {
      setIsExporting(false);
    }
  }, [selectedProjectId, attendanceData, handleApiError]);

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
      case 'CHECKED_IN':
      case 'present':
        return ConstructionTheme.colors.success;
      case 'CHECKED_OUT':
        return ConstructionTheme.colors.info;
      case 'ABSENT':
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

  // Get escalation severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return ConstructionTheme.colors.error;
      case 'HIGH':
        return '#FF6B6B';
      case 'MEDIUM':
        return ConstructionTheme.colors.warning;
      case 'LOW':
        return ConstructionTheme.colors.info;
      default:
        return ConstructionTheme.colors.onSurfaceVariant;
    }
  };

  // Render attendance summary
  const renderSummary = () => {
    if (!attendanceData) return null;

    const { summary } = attendanceData;
    const checkedInCount = summary.checkedIn || 0;
    const attendanceRate = summary.totalWorkers > 0 
      ? Math.round(((checkedInCount + summary.checkedOut) / summary.totalWorkers) * 100)
      : 0;

    // Calculate geofence violations from workers data
    const geofenceViolations = attendanceData.workers?.filter(w => 
      !w.insideGeofence || (w.lastKnownLocation && !w.lastKnownLocation.insideGeofence)
    ).length || 0;

    // Calculate average hours worked
    const workersWithHours = attendanceData.workers?.filter(w => w.workingHours > 0) || [];
    const averageHoursWorked = workersWithHours.length > 0
      ? workersWithHours.reduce((sum, w) => sum + w.workingHours, 0) / workersWithHours.length
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
              {checkedInCount}
            </Text>
            <Text style={styles.summaryLabel}>Present</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: ConstructionTheme.colors.error }]}>
              {summary.absent}
            </Text>
            <Text style={styles.summaryLabel}>Absent</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: ConstructionTheme.colors.warning }]}>
              {summary.late}
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
              {formatDuration(averageHoursWorked)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Geofence Issues</Text>
            <Text style={[styles.metricValue, { color: geofenceViolations > 0 ? ConstructionTheme.colors.error : ConstructionTheme.colors.success }]}>
              {geofenceViolations}
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
  const renderAttendanceRecord = (record: AttendanceRecord) => {
    // Determine if worker has issues
    const hasIssues = record.isLate || 
                      record.status === 'ABSENT' || 
                      !record.insideGeofence ||
                      (record.lastKnownLocation && !record.lastKnownLocation.insideGeofence);

    return (
      <ConstructionCard
        key={record.employeeId}
        variant="outlined"
        style={[
          styles.recordCard,
          ...(hasIssues ? [styles.recordCardWithIssues] : []),
        ]}
      >
        {/* Worker Header */}
        <View style={styles.recordHeader}>
          <View style={styles.workerInfo}>
            <Text style={styles.workerName}>{record.workerName}</Text>
            <Text style={styles.workerRole}>{record.role}</Text>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(record.status) },
                ]}
              />
              <Text style={[styles.statusText, { color: getStatusColor(record.status) }]}>
                {record.status.replace('_', ' ')}
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
                    backgroundColor: record.insideGeofence
                      ? ConstructionTheme.colors.success
                      : ConstructionTheme.colors.error,
                  },
                ]}
              />
              <Text
                style={[
                  styles.geofenceText,
                  {
                    color: record.insideGeofence
                      ? ConstructionTheme.colors.success
                      : ConstructionTheme.colors.error,
                  },
                ]}
              >
                {record.insideGeofence ? 'Inside Site' : 'Outside Site'}
              </Text>
            </View>
          </View>
        </View>

        {/* Project Information */}
        <View style={styles.projectInfo}>
          <Text style={styles.projectLabel}>Project:</Text>
          <Text style={styles.projectValue}>{record.projectName}</Text>
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
          
          {/* Lunch Break Display */}
          {record.lunchStartTime && record.lunchEndTime && (
            <>
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Lunch Start:</Text>
                <Text style={styles.timeValue}>{formatTime(record.lunchStartTime)}</Text>
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Lunch End:</Text>
                <Text style={styles.timeValue}>{formatTime(record.lunchEndTime)}</Text>
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Lunch Duration:</Text>
                <Text style={styles.timeValue}>{formatDuration(record.lunchDuration || 0)}</Text>
              </View>
            </>
          )}
          
          {/* Regular Hours */}
          {record.regularHours !== undefined && (
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Regular Hours:</Text>
              <Text style={[styles.timeValue, styles.regularHours]}>
                {formatDuration(record.regularHours)}
              </Text>
            </View>
          )}
          
          {/* OT Hours */}
          {record.otHours !== undefined && record.otHours > 0 && (
            <View style={styles.timeRow}>
              <Text style={[styles.timeLabel, { color: ConstructionTheme.colors.warning }]}>
                OT Hours:
              </Text>
              <Text style={[styles.timeValue, { color: ConstructionTheme.colors.warning, fontWeight: 'bold' }]}>
                {formatDuration(record.otHours)}
              </Text>
            </View>
          )}
          
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Total Hours:</Text>
            <Text style={[styles.timeValue, styles.hoursWorked]}>
              {formatDuration(record.workingHours)}
            </Text>
          </View>
          
          {record.isLate && (
            <View style={styles.timeRow}>
              <Text style={[styles.timeLabel, { color: ConstructionTheme.colors.warning }]}>
                Late by:
              </Text>
              <Text style={[styles.timeValue, { color: ConstructionTheme.colors.warning, fontWeight: 'bold' }]}>
                {record.minutesLate} minutes
              </Text>
            </View>
          )}
        </View>

        {/* Task Assignment */}
        <View style={styles.taskInfo}>
          <Text style={styles.taskLabel}>Task Assigned:</Text>
          <Text style={styles.taskValue}>{record.taskAssigned}</Text>
        </View>

        {/* Absence Reason Display */}
        {record.absenceReason && record.absenceReason !== 'PRESENT' && (
          <View style={styles.absenceReasonSection}>
            <Text style={styles.absenceReasonLabel}>Absence Reason:</Text>
            <Text style={[styles.absenceReasonValue, {
              color: record.absenceReason === 'LEAVE_APPROVED' 
                ? ConstructionTheme.colors.success 
                : ConstructionTheme.colors.error
            }]}>
              {record.absenceReason.replace(/_/g, ' ')}
            </Text>
            {record.absenceNotes && (
              <Text style={styles.absenceNotes}>{record.absenceNotes}</Text>
            )}
          </View>
        )}

        {/* Issues Section */}
        {hasIssues && (
          <View style={styles.issuesSection}>
            <Text style={styles.issuesTitle}>Issues</Text>
            {record.isLate && (
              <View style={styles.issueItem}>
                <View style={[styles.issueSeverityDot, { backgroundColor: ConstructionTheme.colors.warning }]} />
                <View style={styles.issueContent}>
                  <Text style={styles.issueType}>LATE ARRIVAL</Text>
                  <Text style={styles.issueDescription}>
                    Worker arrived {record.minutesLate} minutes late
                  </Text>
                </View>
              </View>
            )}
            {record.status === 'ABSENT' && (
              <View style={styles.issueItem}>
                <View style={[styles.issueSeverityDot, { backgroundColor: ConstructionTheme.colors.error }]} />
                <View style={styles.issueContent}>
                  <Text style={styles.issueType}>ABSENT</Text>
                  <Text style={styles.issueDescription}>Worker has not checked in today</Text>
                </View>
              </View>
            )}
            {!record.insideGeofence && record.status !== 'ABSENT' && (
              <View style={styles.issueItem}>
                <View style={[styles.issueSeverityDot, { backgroundColor: ConstructionTheme.colors.error }]} />
                <View style={styles.issueContent}>
                  <Text style={styles.issueType}>GEOFENCE VIOLATION</Text>
                  <Text style={styles.issueDescription}>
                    Worker checked in outside designated site boundary
                  </Text>
                </View>
              </View>
            )}
            {record.lastKnownLocation && !record.lastKnownLocation.insideGeofence && record.status === 'CHECKED_IN' && (
              <View style={styles.issueItem}>
                <View style={[styles.issueSeverityDot, { backgroundColor: ConstructionTheme.colors.warning }]} />
                <View style={styles.issueContent}>
                  <Text style={styles.issueType}>CURRENT LOCATION VIOLATION</Text>
                  <Text style={styles.issueDescription}>
                    Worker's current location is outside site boundary
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Location Coordinates */}
        {record.lastKnownLocation && (
          <View style={styles.coordinatesSection}>
            <Text style={styles.coordinatesLabel}>Last Known Location:</Text>
            <Text style={styles.coordinatesText}>
              {record.lastKnownLocation.latitude.toFixed(6)}, {record.lastKnownLocation.longitude.toFixed(6)}
            </Text>
            {record.lastLocationUpdate && (
              <Text style={styles.lastUpdatedText}>
                Updated: {new Date(record.lastLocationUpdate).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {record.status === 'ABSENT' && (
            <ConstructionButton
              title="Mark Reason"
              variant="secondary"
              size="small"
              onPress={() => {
                setSelectedWorkerForAbsence(record);
                setShowAbsenceModal(true);
              }}
              style={styles.actionButton}
            />
          )}
          {hasIssues && (
            <ConstructionButton
              title="Escalate"
              variant="error"
              size="small"
              onPress={() => {
                setSelectedWorkerForEscalation(record);
                setShowEscalationModal(true);
              }}
              style={styles.actionButton}
            />
          )}
        </View>
      </ConstructionCard>
    );
  };

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
                  {(selectedCorrection.requestType || 'unknown').replace('_', ' ').toUpperCase()}
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

  // Render absence reason modal
  const renderAbsenceModal = () => (
    <Modal
      visible={showAbsenceModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAbsenceModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Mark Absence Reason</Text>
          
          {selectedWorkerForAbsence && (
            <>
              <Text style={styles.modalSubtitle}>
                {selectedWorkerForAbsence.workerName}
              </Text>
              
              <Text style={styles.inputLabel}>Reason:</Text>
              <View style={styles.reasonButtons}>
                {(['LEAVE_APPROVED', 'LEAVE_NOT_INFORMED', 'MEDICAL', 'UNAUTHORIZED'] as const).map((reason) => (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.reasonButton,
                      absenceReason === reason && styles.reasonButtonActive
                    ]}
                    onPress={() => setAbsenceReason(reason)}
                  >
                    <Text style={[
                      styles.reasonButtonText,
                      absenceReason === reason && styles.reasonButtonTextActive
                    ]}>
                      {reason.replace(/_/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Notes (optional):</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Add notes..."
                value={absenceNotes}
                onChangeText={setAbsenceNotes}
                multiline
                numberOfLines={3}
                placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
              />

              <View style={styles.modalActions}>
                <ConstructionButton
                  title="Cancel"
                  variant="secondary"
                  size="medium"
                  onPress={() => {
                    setShowAbsenceModal(false);
                    setSelectedWorkerForAbsence(null);
                    setAbsenceNotes('');
                  }}
                  style={styles.modalButton}
                />
                <ConstructionButton
                  title="Save"
                  variant="primary"
                  size="medium"
                  onPress={handleMarkAbsence}
                  style={styles.modalButton}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  // Render escalation modal
  const renderEscalationModal = () => (
    <Modal
      visible={showEscalationModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowEscalationModal(false)}
    >
      <View style={styles.modalOverlay}>
        <ScrollView contentContainerStyle={styles.modalScrollContent}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Escalation</Text>
            
            {selectedWorkerForEscalation && (
              <>
                <Text style={styles.modalSubtitle}>
                  {selectedWorkerForEscalation.workerName}
                </Text>
                
                <Text style={styles.inputLabel}>Escalation Type:</Text>
                <View style={styles.reasonButtons}>
                  {(['REPEATED_LATE', 'REPEATED_ABSENCE', 'GEOFENCE_VIOLATION', 'UNAUTHORIZED_ABSENCE'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.reasonButton,
                        escalationType === type && styles.reasonButtonActive
                      ]}
                      onPress={() => setEscalationType(type)}
                    >
                      <Text style={[
                        styles.reasonButtonText,
                        escalationType === type && styles.reasonButtonTextActive
                      ]}>
                        {type.replace(/_/g, ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Severity:</Text>
                <View style={styles.severityButtons}>
                  {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((severity) => (
                    <TouchableOpacity
                      key={severity}
                      style={[
                        styles.severityButton,
                        escalationSeverity === severity && styles.severityButtonActive,
                        { borderColor: getSeverityColor(severity) }
                      ]}
                      onPress={() => setEscalationSeverity(severity)}
                    >
                      <Text style={[
                        styles.severityButtonText,
                        escalationSeverity === severity && { color: getSeverityColor(severity) }
                      ]}>
                        {severity}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Escalate To:</Text>
                <View style={styles.escalateToButtons}>
                  {(['ADMIN', 'MANAGER', 'HR'] as const).map((to) => (
                    <TouchableOpacity
                      key={to}
                      style={[
                        styles.escalateToButton,
                        escalatedTo === to && styles.escalateToButtonActive
                      ]}
                      onPress={() => setEscalatedTo(to)}
                    >
                      <Text style={[
                        styles.escalateToButtonText,
                        escalatedTo === to && styles.escalateToButtonTextActive
                      ]}>
                        {to}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Description:</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Describe the issue..."
                  value={escalationDescription}
                  onChangeText={setEscalationDescription}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
                />

                <Text style={styles.inputLabel}>Notes (optional):</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Additional notes..."
                  value={escalationNotes}
                  onChangeText={setEscalationNotes}
                  multiline
                  numberOfLines={2}
                  placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
                />

                <View style={styles.modalActions}>
                  <ConstructionButton
                    title="Cancel"
                    variant="secondary"
                    size="medium"
                    onPress={() => {
                      setShowEscalationModal(false);
                      setSelectedWorkerForEscalation(null);
                      setEscalationDescription('');
                      setEscalationNotes('');
                    }}
                    style={styles.modalButton}
                  />
                  <ConstructionButton
                    title="Escalate"
                    variant="error"
                    size="medium"
                    onPress={handleCreateEscalation}
                    style={styles.modalButton}
                  />
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  if (isLoading && !attendanceData) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <ConstructionLoadingIndicator
          visible={true}
          message="Loading attendance data..."
          variant="card"
          size="large"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
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
          <ConstructionCard 
            title="⚠️ Pending Corrections" 
            variant="warning" 
            style={styles.correctionsCard}
          >
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

        {/* Debug: Show when no corrections */}
        {pendingCorrections.length === 0 && __DEV__ && (
          <ConstructionCard 
            title="ℹ️ Debug Info" 
            variant="outlined" 
            style={styles.correctionsCard}
          >
            <Text style={styles.correctionsText}>
              No pending corrections found. Check console logs for API response details.
            </Text>
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
              Alert.alert(
                'Export Format',
                'Choose export format:',
                [
                  { text: 'JSON', onPress: () => handleExportReport('json') },
                  { text: 'CSV', onPress: () => handleExportReport('csv') },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
            }}
            loading={isExporting}
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

      {/* Absence Reason Modal */}
      {renderAbsenceModal()}

      {/* Escalation Modal */}
      {renderEscalationModal()}

      {/* Correction Approval Modal */}
      {renderCorrectionModal()}
    </SafeAreaView>
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
  workerRole: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  projectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
    paddingBottom: ConstructionTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline,
  },
  projectLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginRight: ConstructionTheme.spacing.xs,
  },
  projectValue: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
    flex: 1,
  },
  taskInfo: {
    marginTop: ConstructionTheme.spacing.sm,
    paddingTop: ConstructionTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline,
  },
  taskLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  taskValue: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
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
  absenceReasonSection: {
    marginTop: ConstructionTheme.spacing.sm,
    paddingTop: ConstructionTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline,
    backgroundColor: '#FFF3E0',
    padding: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  absenceReasonLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  absenceReasonValue: {
    ...ConstructionTheme.typography.bodyMedium,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  absenceNotes: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurface,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: ConstructionTheme.spacing.md,
    gap: ConstructionTheme.spacing.sm,
  },
  actionButton: {
    minWidth: 100,
  },
  regularHours: {
    color: ConstructionTheme.colors.success,
    fontWeight: '600',
  },
  modalSubtitle: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.md,
    textAlign: 'center',
  },
  inputLabel: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.xs,
    marginTop: ConstructionTheme.spacing.sm,
  },
  reasonButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ConstructionTheme.spacing.xs,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  reasonButton: {
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: ConstructionTheme.spacing.xs,
    borderRadius: ConstructionTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
    backgroundColor: ConstructionTheme.colors.surface,
  },
  reasonButtonActive: {
    backgroundColor: ConstructionTheme.colors.primary,
    borderColor: ConstructionTheme.colors.primary,
  },
  reasonButtonText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurface,
  },
  reasonButtonTextActive: {
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  severityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: ConstructionTheme.spacing.xs,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  severityButton: {
    flex: 1,
    paddingVertical: ConstructionTheme.spacing.xs,
    borderRadius: ConstructionTheme.borderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
  },
  severityButtonActive: {
    backgroundColor: '#FFF3E0',
  },
  severityButtonText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
  },
  escalateToButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: ConstructionTheme.spacing.xs,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  escalateToButton: {
    flex: 1,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
    backgroundColor: ConstructionTheme.colors.surface,
    alignItems: 'center',
  },
  escalateToButtonActive: {
    backgroundColor: ConstructionTheme.colors.error,
    borderColor: ConstructionTheme.colors.error,
  },
  escalateToButtonText: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurface,
  },
  escalateToButtonTextActive: {
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: ConstructionTheme.spacing.lg,
  },
});

export default AttendanceMonitoringScreen;