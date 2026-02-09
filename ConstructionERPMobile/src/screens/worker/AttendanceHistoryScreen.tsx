// Worker Attendance History Screen with calendar view and filtering
// Requirements: 3.6

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../store/context/AuthContext';
import { useOffline } from '../../store/context/OfflineContext';
import { workerApiService } from '../../services/api/WorkerApiService';
import { OfflineIndicator } from '../../components/common/OfflineIndicator';
import { AttendanceRecord } from '../../types';
import { WORK_HOURS_CONFIG } from '../../utils/constants';

interface AttendanceHistoryFilter {
  startDate: Date;
  endDate: Date;
  sessionType?: 'regular' | 'overtime' | 'lunch' | 'all';
  searchText: string;
}

const AttendanceHistoryScreen: React.FC = () => {
  const { state: authState } = useAuth();
  const { state: offlineState } = useOffline();
  
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [filter, setFilter] = useState<AttendanceHistoryFilter>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
    sessionType: 'all',
    searchText: '',
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadAttendanceHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [attendanceHistory, filter]);

  const loadAttendanceHistory = useCallback(async () => {
    if (!authState.user || offlineState.isOnline === false) return;
    
    setIsLoading(true);
    try {
      const response = await workerApiService.getAttendanceHistory({
        projectId: authState.user.currentProject?.id?.toString(),
      });
      
      if (response.success) {
        // Convert the new API response format to the expected format
        const convertedRecords = response.data.records.map((record: any, index: number) => {
          const converted = {
            id: index + 1, // Use index as numeric ID since API doesn't provide numeric ID
            workerId: authState.user?.id || 0,
            employeeId: authState.user?.id || 0,
            projectId: parseInt(record.projectId),
            projectName: record.projectName, // Now available from backend
            loginTime: record.checkInTime || '', // Fixed: use checkInTime from API
            logoutTime: record.checkOutTime || '', // Fixed: use checkOutTime from API
            lunchStartTime: record.lunchStartTime || '',
            lunchEndTime: record.lunchEndTime || '',
            overtimeStartTime: record.overtimeStartTime || '',
            sessionType: 'regular' as const,
            location: { 
              latitude: record.latitude || 0, 
              longitude: record.longitude || 0, 
              accuracy: record.accuracy || 10, 
              timestamp: new Date() 
            },
            geofenceValidated: record.insideGeofenceAtCheckin,
            notes: '',
            date: record.date,
            pendingCheckout: record.pendingCheckout || false,
          };
          
          return converted;
        });
        
        setAttendanceHistory(convertedRecords);
      } else {
        Alert.alert('Error', response.message || 'Failed to load attendance history');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load attendance history');
    } finally {
      setIsLoading(false);
    }
  }, [authState.user, offlineState.isOnline]);

  const applyFilters = useCallback(() => {
    let filtered = [...attendanceHistory];

    // Filter by session type
    if (filter.sessionType && filter.sessionType !== 'all') {
      filtered = filtered.filter(record => record.sessionType === filter.sessionType);
    }

    // Filter by search text (project name, notes, etc.)
    if (filter.searchText.trim()) {
      const searchLower = filter.searchText.toLowerCase();
      filtered = filtered.filter(record => {
        // Search by project ID
        const projectIdMatch = record.projectId?.toString().includes(searchLower);
        
        // Search by project name (now available directly from API response)
        const projectNameMatch = (record as any).projectName?.toLowerCase().includes(searchLower);
        
        // Search by session type
        const sessionTypeMatch = record.sessionType.toLowerCase().includes(searchLower);
        
        return projectIdMatch || projectNameMatch || sessionTypeMatch;
      });
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime());

    setFilteredHistory(filtered);
  }, [attendanceHistory, filter]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadAttendanceHistory();
    setIsRefreshing(false);
  }, [loadAttendanceHistory]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Invalid Date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'Invalid Date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!startTime) return 'NaNh NaNm';
    const start = new Date(startTime);
    if (isNaN(start.getTime())) return 'NaNh NaNm';
    
    const end = endTime ? new Date(endTime) : new Date();
    if (endTime && isNaN(end.getTime())) return 'NaNh NaNm';
    
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return '0h 0m'; // Handle negative durations
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Calculate work hours breakdown (regular vs overtime)
  const calculateWorkHours = (checkInTime: string, checkOutTime?: string, lunchStartTime?: string, lunchEndTime?: string) => {
    if (!checkInTime || !checkOutTime) {
      return {
        totalHours: 0,
        regularHours: 0,
        overtimeHours: 0,
        lunchHours: 0,
      };
    }

    const checkIn = new Date(checkInTime);
    const checkOut = new Date(checkOutTime);
    
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return {
        totalHours: 0,
        regularHours: 0,
        overtimeHours: 0,
        lunchHours: 0,
      };
    }

    // Calculate total work duration
    const totalWorkMs = checkOut.getTime() - checkIn.getTime();
    let totalWorkHours = totalWorkMs / (1000 * 60 * 60);

    // Calculate lunch break duration if available
    let lunchHours = 0;
    if (lunchStartTime && lunchEndTime) {
      const lunchStart = new Date(lunchStartTime);
      const lunchEnd = new Date(lunchEndTime);
      
      if (!isNaN(lunchStart.getTime()) && !isNaN(lunchEnd.getTime())) {
        const lunchMs = lunchEnd.getTime() - lunchStart.getTime();
        lunchHours = lunchMs / (1000 * 60 * 60);
        // Subtract lunch time from total work hours
        totalWorkHours -= lunchHours;
      }
    }

    // Calculate regular vs overtime hours
    const standardHours = WORK_HOURS_CONFIG.STANDARD_WORK_HOURS;
    const regularHours = Math.min(totalWorkHours, standardHours);
    const overtimeHours = Math.max(0, totalWorkHours - standardHours);

    return {
      totalHours: Math.max(0, totalWorkHours),
      regularHours: Math.max(0, regularHours),
      overtimeHours: Math.max(0, overtimeHours),
      lunchHours: Math.max(0, lunchHours),
    };
  };

  const getSessionTypeColor = (sessionType: string) => {
    switch (sessionType) {
      case 'regular':
        return '#28a745';
      case 'overtime':
        return '#6f42c1';
      case 'lunch':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  const getSessionTypeLabel = (sessionType: string) => {
    switch (sessionType) {
      case 'regular':
        return 'Regular';
      case 'overtime':
        return 'Overtime';
      case 'lunch':
        return 'Lunch Break';
      default:
        return sessionType;
    }
  };

  const renderFilterSection = () => (
    <View style={styles.filterSection}>
      <TouchableOpacity
        style={styles.filterToggle}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Text style={styles.filterToggleText}>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Text>
      </TouchableOpacity>

      {showFilters && (
        <View style={styles.filterContent}>
          {/* Search Input */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Search:</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by project name or type..."
              value={filter.searchText}
              onChangeText={(text) => setFilter(prev => ({ ...prev, searchText: text }))}
            />
          </View>

          {/* Session Type Filter */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Session Type:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['all', 'regular', 'overtime', 'lunch'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterChip,
                    filter.sessionType === type && styles.activeFilterChip,
                  ]}
                  onPress={() => setFilter(prev => ({ ...prev, sessionType: type as any }))}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filter.sessionType === type && styles.activeFilterChipText,
                    ]}
                  >
                    {type === 'all' ? 'All' : getSessionTypeLabel(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Date Range */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Date Range:</Text>
            <View style={styles.dateRangeContainer}>
              <TouchableOpacity style={styles.dateButton}>
                <Text style={styles.dateButtonText}>
                  {filter.startDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <Text style={styles.dateRangeSeparator}>to</Text>
              <TouchableOpacity style={styles.dateButton}>
                <Text style={styles.dateButtonText}>
                  {filter.endDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  // Create a separate component for attendance record to avoid hooks rule violations
  const AttendanceRecordItem: React.FC<{ record: AttendanceRecord; index: number }> = ({ record, index }) => {
    // Display coordinates directly as requested by user
    const getLocationDisplay = () => {
      if (record.location && (record.location.latitude !== 0 || record.location.longitude !== 0)) {
        return `${record.location.latitude.toFixed(6)}, ${record.location.longitude.toFixed(6)}`;
      }
      return 'Location not available';
    };

    // Calculate work hours breakdown
    const workHours = calculateWorkHours(
      record.loginTime, 
      record.logoutTime, 
      (record as any).lunchStartTime, 
      (record as any).lunchEndTime
    );

    // Use project name from API response or fallback to project ID
    const displayProjectName = record.projectName || `Project #${record.projectId}`;

    return (
      <View key={record.id || index} style={styles.recordCard}>
        <View style={styles.recordHeader}>
          <Text style={styles.recordDate}>{formatDate(record.loginTime)}</Text>
          <View style={styles.badgeContainer}>
            <View
              style={[
                styles.sessionTypeBadge,
                { backgroundColor: getSessionTypeColor(record.sessionType) },
              ]}
            >
              <Text style={styles.sessionTypeBadgeText}>
                {getSessionTypeLabel(record.sessionType)}
              </Text>
            </View>
            {/* Show overtime badge if there are overtime hours */}
            {workHours.overtimeHours > 0 && (
              <View style={[styles.overtimeBadge]}>
                <Text style={styles.overtimeBadgeText}>
                  OT: {workHours.overtimeHours.toFixed(1)}h
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.recordContent}>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Clock In:</Text>
            <Text style={styles.timeValue}>{formatTime(record.loginTime)}</Text>
          </View>

          {record.logoutTime && (
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Clock Out:</Text>
              <Text style={styles.timeValue}>{formatTime(record.logoutTime)}</Text>
            </View>
          )}

          {/* Enhanced duration display with breakdown */}
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Total Duration:</Text>
            <Text style={[styles.timeValue, styles.durationValue]}>
              {formatDuration(record.loginTime, record.logoutTime)}
            </Text>
          </View>

          {/* Work hours breakdown */}
          {record.logoutTime && workHours.totalHours > 0 && (
            <>
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Work Hours:</Text>
                <Text style={styles.timeValue}>
                  {workHours.totalHours.toFixed(1)}h
                </Text>
              </View>
              
              {workHours.regularHours > 0 && (
                <View style={styles.timeRow}>
                  <Text style={styles.timeLabel}>Regular:</Text>
                  <Text style={[styles.timeValue, styles.regularHoursValue]}>
                    {workHours.regularHours.toFixed(1)}h
                  </Text>
                </View>
              )}
              
              {workHours.overtimeHours > 0 && (
                <View style={styles.timeRow}>
                  <Text style={styles.timeLabel}>Overtime:</Text>
                  <Text style={[styles.timeValue, styles.overtimeValue]}>
                    {workHours.overtimeHours.toFixed(1)}h
                  </Text>
                </View>
              )}

              {workHours.lunchHours > 0 && (
                <View style={styles.timeRow}>
                  <Text style={styles.timeLabel}>Lunch Break:</Text>
                  <Text style={styles.timeValue}>
                    {workHours.lunchHours.toFixed(1)}h
                  </Text>
                </View>
              )}
            </>
          )}

          {record.projectId && (
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Project:</Text>
              <Text style={styles.timeValue}>{displayProjectName}</Text>
            </View>
          )}

          {record.location && (
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Location:</Text>
              <Text style={styles.locationValue}>
                {getLocationDisplay()}
              </Text>
              {record.location.accuracy && (
                <Text style={styles.accuracyValue}>
                  (±{record.location.accuracy.toFixed(0)}m)
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSummaryStats = () => {
    let totalWorkHours = 0;
    let totalRegularHours = 0;
    let totalOvertimeHours = 0;
    let totalLunchHours = 0;

    // Calculate totals using the new work hours calculation
    filteredHistory.forEach(record => {
      if (record.logoutTime) {
        const workHours = calculateWorkHours(
          record.loginTime, 
          record.logoutTime, 
          (record as any).lunchStartTime, 
          (record as any).lunchEndTime
        );
        
        totalWorkHours += workHours.totalHours;
        totalRegularHours += workHours.regularHours;
        totalOvertimeHours += workHours.overtimeHours;
        totalLunchHours += workHours.lunchHours;
      }
    });

    return (
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{filteredHistory.length}</Text>
            <Text style={styles.summaryLabel}>Sessions</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalWorkHours.toFixed(1)}h</Text>
            <Text style={styles.summaryLabel}>Work Hours</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalRegularHours.toFixed(1)}h</Text>
            <Text style={styles.summaryLabel}>Regular</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, totalOvertimeHours > 0 && styles.overtimeValue]}>
              {totalOvertimeHours.toFixed(1)}h
            </Text>
            <Text style={styles.summaryLabel}>Overtime</Text>
          </View>
        </View>
        
        {/* Additional info row */}
        <View style={styles.summaryInfoRow}>
          <Text style={styles.summaryInfoText}>
            Standard work day: {WORK_HOURS_CONFIG.STANDARD_WORK_HOURS} hours
          </Text>
          <Text style={styles.summaryInfoText}>
            Overtime after: {WORK_HOURS_CONFIG.OVERTIME_THRESHOLD_HOURS} hours
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading attendance history...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <OfflineIndicator />
      
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {renderFilterSection()}
        {renderSummaryStats()}

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>
            Attendance History ({filteredHistory.length} records)
          </Text>
          
          {filteredHistory.length > 0 ? (
            filteredHistory.map((record, index) => (
              <AttendanceRecordItem key={record.id || index} record={record} index={index} />
            ))
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>
                {attendanceHistory.length === 0
                  ? 'No attendance records found'
                  : 'No records match your filters'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  filterSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterToggle: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filterToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
  },
  filterContent: {
    padding: 16,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6c757d',
  },
  activeFilterChipText: {
    color: '#fff',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  dateRangeSeparator: {
    marginHorizontal: 12,
    fontSize: 16,
    color: '#6c757d',
  },
  summarySection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  historySection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  recordDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sessionTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionTypeBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  recordContent: {
    padding: 16,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  durationValue: {
    color: '#007AFF',
  },
  regularHoursValue: {
    color: '#28a745',
  },
  overtimeValue: {
    color: '#ff6b35',
    fontWeight: 'bold',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  overtimeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#ff6b35',
  },
  overtimeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryInfoRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  summaryInfoText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 4,
  },
  locationRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    flexDirection: 'column',
  },
  locationLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace', // Use monospace for better coordinate display
  },
  accuracyValue: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  noDataContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default AttendanceHistoryScreen;