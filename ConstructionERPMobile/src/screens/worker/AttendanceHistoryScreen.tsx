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
} from 'react-native';
import { useAuth } from '../../store/context/AuthContext';
import { useOffline } from '../../store/context/OfflineContext';
import { workerApiService } from '../../services/api/WorkerApiService';
import { OfflineIndicator } from '../../components/common/OfflineIndicator';
import { AttendanceRecord } from '../../types';

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
        const convertedRecords = response.data.records.map((record: any, index: number) => ({
          id: index + 1, // Use index as numeric ID since API doesn't provide numeric ID
          workerId: parseInt(record.employeeId),
          employeeId: parseInt(record.employeeId),
          projectId: parseInt(record.projectId),
          loginTime: record.checkIn || '',
          logoutTime: record.checkOut || '',
          lunchStartTime: record.lunchStartTime || '',
          lunchEndTime: record.lunchEndTime || '',
          overtimeStartTime: record.overtimeStartTime || '',
          sessionType: 'regular' as const,
          location: { latitude: 0, longitude: 0, accuracy: 0, timestamp: new Date() },
          geofenceValidated: record.insideGeofenceAtCheckin,
          notes: '',
          date: record.date,
          pendingCheckout: record.pendingCheckout,
        }));
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
      filtered = filtered.filter(record => 
        record.projectId?.toString().includes(searchLower) ||
        record.sessionType.toLowerCase().includes(searchLower)
      );
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
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
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
              placeholder="Search by project or type..."
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

  const renderAttendanceRecord = (record: AttendanceRecord, index: number) => (
    <View key={record.id || index} style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordDate}>{formatDate(record.loginTime)}</Text>
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

        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>Duration:</Text>
          <Text style={[styles.timeValue, styles.durationValue]}>
            {formatDuration(record.loginTime, record.logoutTime)}
          </Text>
        </View>

        {record.projectId && (
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Project:</Text>
            <Text style={styles.timeValue}>#{record.projectId}</Text>
          </View>
        )}

        {record.location && (
          <View style={styles.locationRow}>
            <Text style={styles.locationLabel}>Location:</Text>
            <Text style={styles.locationValue}>
              {record.location.latitude.toFixed(6)}, {record.location.longitude.toFixed(6)}
            </Text>
            <Text style={styles.accuracyValue}>
              (±{record.location.accuracy.toFixed(0)}m)
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderSummaryStats = () => {
    const totalHours = filteredHistory.reduce((total, record) => {
      if (record.logoutTime) {
        const duration = new Date(record.logoutTime).getTime() - new Date(record.loginTime).getTime();
        return total + (duration / (1000 * 60 * 60));
      }
      return total;
    }, 0);

    const regularHours = filteredHistory
      .filter(record => record.sessionType === 'regular' && record.logoutTime)
      .reduce((total, record) => {
        const duration = new Date(record.logoutTime!).getTime() - new Date(record.loginTime).getTime();
        return total + (duration / (1000 * 60 * 60));
      }, 0);

    const overtimeHours = filteredHistory
      .filter(record => record.sessionType === 'overtime' && record.logoutTime)
      .reduce((total, record) => {
        const duration = new Date(record.logoutTime!).getTime() - new Date(record.loginTime).getTime();
        return total + (duration / (1000 * 60 * 60));
      }, 0);

    return (
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{filteredHistory.length}</Text>
            <Text style={styles.summaryLabel}>Sessions</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalHours.toFixed(1)}h</Text>
            <Text style={styles.summaryLabel}>Total Hours</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{regularHours.toFixed(1)}h</Text>
            <Text style={styles.summaryLabel}>Regular</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{overtimeHours.toFixed(1)}h</Text>
            <Text style={styles.summaryLabel}>Overtime</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading attendance history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            filteredHistory.map((record, index) => renderAttendanceRecord(record, index))
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
    </View>
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
  locationRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  locationLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
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