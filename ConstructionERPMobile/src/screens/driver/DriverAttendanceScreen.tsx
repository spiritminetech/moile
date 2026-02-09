import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../store/context/AuthContext';
import { useLocation } from '../../store/context/LocationContext';
import { useOffline } from '../../store/context/OfflineContext';
import { driverApiService } from '../../services/api/DriverApiService';
import {
  GeoLocation,
  VehicleInfo,
} from '../../types';

// Import common components
import {
  ConstructionButton,
  ConstructionCard,
  ConstructionLoadingIndicator,
  ErrorDisplay,
  OfflineIndicator,
} from '../../components/common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

// Driver attendance data interfaces
interface DriverAttendanceSession {
  session: 'NOT_LOGGED_IN' | 'CHECKED_IN' | 'CHECKED_OUT';
  checkInTime: string | null;
  checkOutTime: string | null;
  assignedVehicle: {
    id: number;
    plateNumber: string;
    model: string;
  } | null;
  totalHours: number;
  totalDistance: number;
  date: string;
}

interface AttendanceRecord {
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  vehicleId: number;
  vehiclePlateNumber: string;
  totalHours: number;
  totalDistance: number;
  tripsCompleted: number;
}

interface AttendanceAnalytics {
  weeklyHours: number;
  monthlyHours: number;
  overtimeHours: number;
  averageHoursPerDay: number;
  totalTripsThisMonth: number;
  onTimePerformance: number;
}

const DriverAttendanceScreen: React.FC = () => {
  const { state: authState } = useAuth();
  const { state: locationState, getCurrentLocation } = useLocation();
  const { isOffline } = useOffline();

  // Attendance state
  const [todaysSession, setTodaysSession] = useState<DriverAttendanceSession | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [analytics, setAnalytics] = useState<AttendanceAnalytics | null>(null);
  const [assignedVehicle, setAssignedVehicle] = useState<VehicleInfo | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [isClockingOut, setIsClockingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Pre-check modal state
  const [showPreCheckModal, setShowPreCheckModal] = useState(false);
  const [preCheckCompleted, setPreCheckCompleted] = useState(false);
  const [mileageReading, setMileageReading] = useState('');

  // Post-check modal state
  const [showPostCheckModal, setShowPostCheckModal] = useState(false);
  const [postCheckCompleted, setPostCheckCompleted] = useState(false);
  const [endMileageReading, setEndMileageReading] = useState('');
  const [fuelLevel, setFuelLevel] = useState('');

  // Load attendance data
  const loadAttendanceData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      console.log('⏰ Loading driver attendance data...');

      // Load today's attendance session
      const sessionResponse = await driverApiService.getTodaysAttendance();
      if (sessionResponse.success && sessionResponse.data) {
        setTodaysSession(sessionResponse.data);
        console.log('✅ Today\'s session loaded:', sessionResponse.data.session);
      }

      // Load assigned vehicle
      const vehicleResponse = await driverApiService.getAssignedVehicle();
      if (vehicleResponse.success && vehicleResponse.data) {
        setAssignedVehicle(vehicleResponse.data);
        console.log('✅ Vehicle info loaded');
      }

      // Load attendance history (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const historyResponse = await driverApiService.getAttendanceHistory({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        limit: 30,
      });

      if (historyResponse.success && historyResponse.data) {
        setAttendanceHistory(historyResponse.data.records);
        console.log('✅ Attendance history loaded:', historyResponse.data.records.length);

        // Calculate analytics from history
        calculateAnalytics(historyResponse.data.records);
      }

      setLastUpdated(new Date());

    } catch (error: any) {
      console.error('❌ Attendance loading error:', error);
      setError(error.message || 'Failed to load attendance data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Calculate analytics from attendance history
  const calculateAnalytics = useCallback((records: AttendanceRecord[]) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const weeklyRecords = records.filter(record => new Date(record.date) >= weekAgo);
    const monthlyRecords = records.filter(record => new Date(record.date) >= monthAgo);

    const weeklyHours = weeklyRecords.reduce((sum, record) => sum + record.totalHours, 0);
    const monthlyHours = monthlyRecords.reduce((sum, record) => sum + record.totalHours, 0);
    const totalTripsThisMonth = monthlyRecords.reduce((sum, record) => sum + record.tripsCompleted, 0);

    // Calculate overtime (assuming 8 hours per day is regular time)
    const regularHoursThisMonth = monthlyRecords.length * 8;
    const overtimeHours = Math.max(0, monthlyHours - regularHoursThisMonth);

    // Calculate average hours per day (excluding days with 0 hours)
    const workingDays = monthlyRecords.filter(record => record.totalHours > 0);
    const averageHoursPerDay = workingDays.length > 0 
      ? monthlyHours / workingDays.length 
      : 0;

    // Mock on-time performance (would come from API in real implementation)
    const onTimePerformance = 85; // Placeholder

    setAnalytics({
      weeklyHours,
      monthlyHours,
      overtimeHours,
      averageHoursPerDay,
      totalTripsThisMonth,
      onTimePerformance,
    });
  }, []);

  // Initial load
  useEffect(() => {
    loadAttendanceData();
  }, [loadAttendanceData]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadAttendanceData(false);
  }, [loadAttendanceData]);

  // Handle clock in
  const handleClockIn = useCallback(async () => {
    if (!assignedVehicle) {
      Alert.alert('Error', 'No vehicle assigned. Please contact dispatch.');
      return;
    }

    if (!locationState.currentLocation) {
      Alert.alert('Error', 'Location not available. Please enable GPS and try again.');
      return;
    }

    setShowPreCheckModal(true);
  }, [assignedVehicle, locationState.currentLocation]);

  // Confirm clock in after pre-check
  const confirmClockIn = useCallback(async () => {
    if (!assignedVehicle || !locationState.currentLocation) return;

    try {
      setIsClockingIn(true);
      setShowPreCheckModal(false);

      const response = await driverApiService.clockIn({
        vehicleId: assignedVehicle.id,
        location: locationState.currentLocation,
        preCheckCompleted,
        mileageReading: mileageReading ? parseInt(mileageReading) : undefined,
      });

      if (response.success) {
        Alert.alert('Success', 'Clocked in successfully!');
        // Refresh attendance data
        await loadAttendanceData(false);
        
        // Reset modal state
        setPreCheckCompleted(false);
        setMileageReading('');
      }
    } catch (error: any) {
      console.error('❌ Clock in error:', error);
      Alert.alert('Error', error.message || 'Failed to clock in');
    } finally {
      setIsClockingIn(false);
    }
  }, [assignedVehicle, locationState.currentLocation, preCheckCompleted, mileageReading, loadAttendanceData]);

  // Handle clock out
  const handleClockOut = useCallback(async () => {
    if (!assignedVehicle) {
      Alert.alert('Error', 'No vehicle assigned. Please contact dispatch.');
      return;
    }

    if (!locationState.currentLocation) {
      Alert.alert('Error', 'Location not available. Please enable GPS and try again.');
      return;
    }

    setShowPostCheckModal(true);
  }, [assignedVehicle, locationState.currentLocation]);

  // Confirm clock out after post-check
  const confirmClockOut = useCallback(async () => {
    if (!assignedVehicle || !locationState.currentLocation) return;

    try {
      setIsClockingOut(true);
      setShowPostCheckModal(false);

      const response = await driverApiService.clockOut({
        vehicleId: assignedVehicle.id,
        location: locationState.currentLocation,
        postCheckCompleted,
        mileageReading: endMileageReading ? parseInt(endMileageReading) : undefined,
        fuelLevel: fuelLevel ? parseInt(fuelLevel) : undefined,
      });

      if (response.success) {
        Alert.alert(
          'Success', 
          `Clocked out successfully!\nTotal hours: ${response.data.totalHours.toFixed(1)}\nTotal distance: ${response.data.totalDistance.toFixed(1)} km`
        );
        // Refresh attendance data
        await loadAttendanceData(false);
        
        // Reset modal state
        setPostCheckCompleted(false);
        setEndMileageReading('');
        setFuelLevel('');
      }
    } catch (error: any) {
      console.error('❌ Clock out error:', error);
      Alert.alert('Error', error.message || 'Failed to clock out');
    } finally {
      setIsClockingOut(false);
    }
  }, [assignedVehicle, locationState.currentLocation, postCheckCompleted, endMileageReading, fuelLevel, loadAttendanceData]);

  // Format time display
  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'Not recorded';
    return new Date(timeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Format hours display
  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  // Get session status color
  const getSessionStatusColor = (session: string) => {
    switch (session) {
      case 'CHECKED_IN':
        return ConstructionTheme.colors.success;
      case 'CHECKED_OUT':
        return ConstructionTheme.colors.primary;
      default:
        return ConstructionTheme.colors.onSurfaceVariant;
    }
  };

  // Get session status text
  const getSessionStatusText = (session: string) => {
    switch (session) {
      case 'CHECKED_IN':
        return '🟢 Checked In';
      case 'CHECKED_OUT':
        return '🔵 Checked Out';
      default:
        return '⚪ Not Logged In';
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Driver Attendance</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ConstructionLoadingIndicator 
            message="Loading attendance data..."
            size="large"
          />
        </View>
      </View>
    );
  }

  // Render error state
  if (error && !todaysSession) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Driver Attendance</Text>
        </View>
        <View style={styles.errorContainer}>
          <ErrorDisplay 
            error={error}
            onRetry={() => loadAttendanceData()}
            showRetry={!isOffline}
          />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Driver Attendance</Text>
        <Text style={styles.subtitle}>
          {authState.user?.name || 'Driver'} • {new Date().toLocaleDateString()}
        </Text>
      </View>

      {/* Offline indicator */}
      {isOffline && <OfflineIndicator />}

      {/* Content */}
      <ScrollView 
        style={styles.content}
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
        {/* Today's Session */}
        {todaysSession && (
          <ConstructionCard variant="elevated" style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionTitle}>📅 Today's Session</Text>
              <View style={[styles.statusBadge, { backgroundColor: getSessionStatusColor(todaysSession.session) + '20' }]}>
                <Text style={[styles.statusText, { color: getSessionStatusColor(todaysSession.session) }]}>
                  {getSessionStatusText(todaysSession.session)}
                </Text>
              </View>
            </View>

            <View style={styles.sessionDetails}>
              <View style={styles.sessionRow}>
                <Text style={styles.sessionLabel}>Check In:</Text>
                <Text style={styles.sessionValue}>{formatTime(todaysSession.checkInTime)}</Text>
              </View>
              <View style={styles.sessionRow}>
                <Text style={styles.sessionLabel}>Check Out:</Text>
                <Text style={styles.sessionValue}>{formatTime(todaysSession.checkOutTime)}</Text>
              </View>
              <View style={styles.sessionRow}>
                <Text style={styles.sessionLabel}>Total Hours:</Text>
                <Text style={styles.sessionValue}>{formatHours(todaysSession.totalHours)}</Text>
              </View>
              <View style={styles.sessionRow}>
                <Text style={styles.sessionLabel}>Distance:</Text>
                <Text style={styles.sessionValue}>{todaysSession.totalDistance.toFixed(1)} km</Text>
              </View>
              {todaysSession.assignedVehicle && (
                <View style={styles.sessionRow}>
                  <Text style={styles.sessionLabel}>Vehicle:</Text>
                  <Text style={styles.sessionValue}>
                    {todaysSession.assignedVehicle.plateNumber} ({todaysSession.assignedVehicle.model})
                  </Text>
                </View>
              )}
            </View>

            {/* Clock In/Out Buttons */}
            <View style={styles.buttonContainer}>
              {todaysSession.session === 'NOT_LOGGED_IN' && (
                <ConstructionButton
                  title="🕐 Clock In"
                  onPress={handleClockIn}
                  variant="primary"
                  size="large"
                  disabled={isClockingIn || isOffline}
                  loading={isClockingIn}
                  style={styles.clockButton}
                />
              )}
              
              {todaysSession.session === 'CHECKED_IN' && (
                <ConstructionButton
                  title="🕐 Clock Out"
                  onPress={handleClockOut}
                  variant="secondary"
                  size="large"
                  disabled={isClockingOut || isOffline}
                  loading={isClockingOut}
                  style={styles.clockButton}
                />
              )}

              {todaysSession.session === 'CHECKED_OUT' && (
                <View style={styles.completedContainer}>
                  <Text style={styles.completedText}>✅ Work day completed</Text>
                  <Text style={styles.completedSubtext}>
                    Total: {formatHours(todaysSession.totalHours)} • {todaysSession.totalDistance.toFixed(1)} km
                  </Text>
                </View>
              )}
            </View>
          </ConstructionCard>
        )}

        {/* Performance Analytics */}
        {analytics && (
          <ConstructionCard variant="outlined" style={styles.analyticsCard}>
            <Text style={styles.analyticsTitle}>📊 Performance Analytics</Text>
            
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsValue}>{formatHours(analytics.weeklyHours)}</Text>
                <Text style={styles.analyticsLabel}>This Week</Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsValue}>{formatHours(analytics.monthlyHours)}</Text>
                <Text style={styles.analyticsLabel}>This Month</Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsValue}>{formatHours(analytics.overtimeHours)}</Text>
                <Text style={styles.analyticsLabel}>Overtime</Text>
              </View>
            </View>

            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsValue}>{formatHours(analytics.averageHoursPerDay)}</Text>
                <Text style={styles.analyticsLabel}>Avg/Day</Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsValue}>{analytics.totalTripsThisMonth}</Text>
                <Text style={styles.analyticsLabel}>Trips</Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsValue}>{analytics.onTimePerformance}%</Text>
                <Text style={styles.analyticsLabel}>On-Time</Text>
              </View>
            </View>
          </ConstructionCard>
        )}

        {/* Attendance History */}
        <ConstructionCard variant="outlined" style={styles.historyCard}>
          <Text style={styles.historyTitle}>📋 Recent Attendance (Last 30 Days)</Text>
          
          {attendanceHistory.length > 0 ? (
            <View style={styles.historyList}>
              {attendanceHistory.slice(0, 10).map((record, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyDate}>
                    <Text style={styles.historyDateText}>
                      {new Date(record.date).toLocaleDateString([], { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Text>
                    <Text style={styles.historyVehicleText}>
                      {record.vehiclePlateNumber}
                    </Text>
                  </View>
                  
                  <View style={styles.historyDetails}>
                    <Text style={styles.historyTime}>
                      {formatTime(record.checkInTime)} - {formatTime(record.checkOutTime)}
                    </Text>
                    <Text style={styles.historyStats}>
                      {formatHours(record.totalHours)} • {record.totalDistance.toFixed(1)}km • {record.tripsCompleted} trips
                    </Text>
                  </View>
                </View>
              ))}
              
              {attendanceHistory.length > 10 && (
                <TouchableOpacity style={styles.viewMoreButton}>
                  <Text style={styles.viewMoreText}>
                    View all {attendanceHistory.length} records
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.noHistoryContainer}>
              <Text style={styles.noHistoryText}>No attendance history available</Text>
              <Text style={styles.noHistorySubtext}>Your attendance records will appear here</Text>
            </View>
          )}
        </ConstructionCard>

        {/* Last updated info */}
        {lastUpdated && (
          <View style={styles.lastUpdatedContainer}>
            <Text style={styles.lastUpdatedText}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Text>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Pre-Check Modal */}
      <Modal
        visible={showPreCheckModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPreCheckModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔍 Pre-Trip Vehicle Check</Text>
            <Text style={styles.modalSubtitle}>
              Complete your vehicle inspection before clocking in
            </Text>

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setPreCheckCompleted(!preCheckCompleted)}
              >
                <Text style={styles.checkboxText}>
                  {preCheckCompleted ? '✅' : '⬜'} Vehicle pre-check completed
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mileage Reading (optional):</Text>
              <TextInput
                style={styles.textInput}
                value={mileageReading}
                onChangeText={setMileageReading}
                placeholder="Enter current mileage"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalButtons}>
              <ConstructionButton
                title="Cancel"
                onPress={() => setShowPreCheckModal(false)}
                variant="outlined"
                style={styles.modalButton}
              />
              <ConstructionButton
                title="Clock In"
                onPress={confirmClockIn}
                variant="primary"
                disabled={!preCheckCompleted}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Post-Check Modal */}
      <Modal
        visible={showPostCheckModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPostCheckModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔍 Post-Trip Vehicle Check</Text>
            <Text style={styles.modalSubtitle}>
              Complete your vehicle inspection before clocking out
            </Text>

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setPostCheckCompleted(!postCheckCompleted)}
              >
                <Text style={styles.checkboxText}>
                  {postCheckCompleted ? '✅' : '⬜'} Vehicle post-check completed
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>End Mileage Reading (optional):</Text>
              <TextInput
                style={styles.textInput}
                value={endMileageReading}
                onChangeText={setEndMileageReading}
                placeholder="Enter end mileage"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Fuel Level % (optional):</Text>
              <TextInput
                style={styles.textInput}
                value={fuelLevel}
                onChangeText={setFuelLevel}
                placeholder="Enter fuel level percentage"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalButtons}>
              <ConstructionButton
                title="Cancel"
                onPress={() => setShowPostCheckModal(false)}
                variant="outlined"
                style={styles.modalButton}
              />
              <ConstructionButton
                title="Clock Out"
                onPress={confirmClockOut}
                variant="primary"
                disabled={!postCheckCompleted}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.background,
  },
  header: {
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingTop: ConstructionTheme.spacing.xl,
    paddingBottom: ConstructionTheme.spacing.lg,
    backgroundColor: ConstructionTheme.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  subtitle: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onPrimary + 'CC',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingTop: ConstructionTheme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ConstructionTheme.spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ConstructionTheme.spacing.lg,
  },
  sessionCard: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.lg,
  },
  sessionTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.full,
  },
  statusText: {
    ...ConstructionTheme.typography.labelMedium,
    fontWeight: 'bold',
  },
  sessionDetails: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline + '33',
  },
  sessionLabel: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  sessionValue: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: ConstructionTheme.spacing.md,
  },
  clockButton: {
    marginBottom: ConstructionTheme.spacing.sm,
  },
  completedContainer: {
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.lg,
    backgroundColor: ConstructionTheme.colors.successContainer,
    borderRadius: ConstructionTheme.borderRadius.md,
  },
  completedText: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSuccessContainer,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  completedSubtext: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSuccessContainer,
  },
  analyticsCard: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  analyticsTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.lg,
    textAlign: 'center',
  },
  analyticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ConstructionTheme.spacing.md,
  },
  analyticsItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginHorizontal: ConstructionTheme.spacing.xs,
  },
  analyticsValue: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  analyticsLabel: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  historyCard: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  historyTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.lg,
    textAlign: 'center',
  },
  historyList: {
    // No additional styles needed
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.md,
    paddingHorizontal: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.sm,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.md,
  },
  historyDate: {
    alignItems: 'center',
    marginRight: ConstructionTheme.spacing.lg,
    minWidth: 60,
  },
  historyDateText: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  historyVehicleText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  historyDetails: {
    flex: 1,
  },
  historyTime: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  historyStats: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  viewMoreButton: {
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.md,
    marginTop: ConstructionTheme.spacing.sm,
  },
  viewMoreText: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
  },
  noHistoryContainer: {
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.xl,
  },
  noHistoryText: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  noHistorySubtext: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  lastUpdatedContainer: {
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.md,
    marginTop: ConstructionTheme.spacing.lg,
  },
  lastUpdatedText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: ConstructionTheme.spacing.xl,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ConstructionTheme.spacing.lg,
  },
  modalContent: {
    backgroundColor: ConstructionTheme.colors.surface,
    borderRadius: ConstructionTheme.borderRadius.lg,
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingVertical: ConstructionTheme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  modalSubtitle: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: ConstructionTheme.spacing.lg,
  },
  checkboxContainer: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  checkbox: {
    paddingVertical: ConstructionTheme.spacing.md,
    paddingHorizontal: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  checkboxText: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  inputLabel: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  textInput: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.md,
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingVertical: ConstructionTheme.spacing.md,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
    minHeight: 56, // Construction-optimized touch target
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: ConstructionTheme.spacing.lg,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: ConstructionTheme.spacing.xs,
  },
});

export default DriverAttendanceScreen;