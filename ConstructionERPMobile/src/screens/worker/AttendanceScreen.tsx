// Worker Attendance Screen with location-based controls
// Requirements: 3.2, 3.3, 3.5, 12.1

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useLocation } from '../../store/context/LocationContext';
import { useAuth } from '../../store/context/AuthContext';
import { useOffline } from '../../store/context/OfflineContext';
import { workerApiService } from '../../services/api/WorkerApiService';
import { GeofenceValidator } from '../../components/common/GeofenceValidator';
import { GPSAccuracyIndicator } from '../../components/common/GPSAccuracyIndicator';
import { DistanceDisplay } from '../../components/common/DistanceDisplay';
import { OfflineIndicator } from '../../components/common/OfflineIndicator';
import { 
  ConstructionButton, 
  ConstructionCard, 
  ConstructionLoadingIndicator,
  ErrorDisplay
} from '../../components/common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';
import { AttendanceRecord, GeoLocation } from '../../types';
import { useErrorHandler } from '../../hooks/useErrorHandler';

interface AttendanceStatus {
  currentSession: AttendanceRecord | null;
  todaysAttendance: AttendanceRecord[];
  canClockIn: boolean;
  canClockOut: boolean;
}

type AttendanceType = 'login' | 'logout' | 'lunch_start' | 'lunch_end' | 'overtime_start' | 'overtime_end';

const AttendanceScreen: React.FC = () => {
  const { state: locationState, getCurrentLocation, validateGeofence } = useLocation();
  const { state: authState } = useAuth();
  const { state: offlineState } = useOffline();
  const { handleApiError, clearError, error: errorHandlerError } = useErrorHandler();
  
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>({
    currentSession: null,
    todaysAttendance: [],
    canClockIn: false,
    canClockOut: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<AttendanceType | null>(null);

  // Load attendance status on component mount
  useEffect(() => {
    loadAttendanceStatus();
  }, []);

  // Update attendance buttons based on location and current status
  useEffect(() => {
    updateAttendanceButtons();
  }, [locationState.isGeofenceValid, attendanceStatus.currentSession]);

  const loadAttendanceStatus = useCallback(async () => {
    if (!authState.user || offlineState.isOnline === false) return;
    
    setIsLoading(true);
    try {
      clearError();
      const response = await workerApiService.getTodaysAttendance();
      if (response.success) {
        const data = response.data;
        // Convert the new API response to the expected format
        const currentSession = data.session === 'CHECKED_IN' ? {
          id: 1,
          workerId: authState.user.id,
          projectId: parseInt(data.projectId || '0'),
          loginTime: data.checkInTime || '',
          logoutTime: data.checkOutTime || undefined,
          location: { latitude: 0, longitude: 0, accuracy: 0, timestamp: new Date() },
          sessionType: 'regular' as const,
        } : null;
        
        setAttendanceStatus({
          currentSession,
          todaysAttendance: currentSession ? [currentSession] : [],
          canClockIn: data.session === 'NOT_LOGGED_IN' && locationState.isGeofenceValid,
          canClockOut: data.session === 'CHECKED_IN' && locationState.isGeofenceValid,
        });
      }
    } catch (error) {
      handleApiError(error, 'Load Attendance Status');
    } finally {
      setIsLoading(false);
    }
  }, [authState.user, offlineState.isOnline, locationState.isGeofenceValid, clearError, handleApiError]);

  const updateAttendanceButtons = useCallback(() => {
    setAttendanceStatus(prev => ({
      ...prev,
      canClockIn: !prev.currentSession && locationState.isGeofenceValid,
      canClockOut: !!prev.currentSession && locationState.isGeofenceValid,
    }));
  }, [locationState.isGeofenceValid]);

  const handleAttendanceAction = async (type: AttendanceType) => {
    console.log('🎯 Starting attendance action:', type);
    
    if (!locationState.currentLocation || !authState.user) {
      Alert.alert('Error', 'Location or user information not available');
      return;
    }

    // Get project ID - try multiple sources
    let projectId: string | null = null;
    
    // Try to get from user's current project
    if (authState.user?.currentProject?.id) {
      projectId = authState.user.currentProject.id.toString();
      console.log('📍 Using project ID from user.currentProject:', projectId);
    }
    // Try to get from company data (fallback)
    else if (authState.company?.id) {
      projectId = authState.company.id.toString();
      console.log('📍 Using project ID from company:', projectId);
    }
    // Use default project ID (last resort)
    else {
      projectId = '1';
      console.log('📍 Using default project ID:', projectId);
    }

    if (!projectId) {
      Alert.alert('Error', 'No project assigned. Please contact your supervisor.');
      return;
    }

    // Validate geofence before action
    console.log('🔍 Validating geofence for project:', projectId);
    try {
      const geofenceValid = await validateGeofence(parseInt(projectId));
      console.log('🔍 Geofence validation result:', geofenceValid);
      
      if (!geofenceValid.isValid) {
        Alert.alert(
          'Location Required',
          `You must be within ${geofenceValid.distanceFromSite}m of the work site to perform attendance actions.`
        );
        return;
      }
    } catch (geofenceError) {
      console.warn('⚠️ Geofence validation failed, proceeding anyway:', geofenceError);
      // Continue with attendance action even if geofence validation fails
    }

    setActionLoading(type);
    try {
      clearError();
      const location = locationState.currentLocation;
      let response;

      console.log('🚀 Making API call for:', type, 'with projectId:', projectId);

      switch (type) {
        case 'login':
          console.log('📞 Calling clockIn API...');
          response = await workerApiService.clockIn({
            projectId,
            location
          });
          break;
        case 'logout':
          console.log('📞 Calling clockOut API...');
          response = await workerApiService.clockOut({
            projectId,
            location
          });
          break;
        case 'lunch_start':
          console.log('📞 Calling startLunchBreak API...');
          response = await workerApiService.startLunchBreak({
            projectId,
            location
          });
          break;
        case 'lunch_end':
          console.log('📞 Calling endLunchBreak API...');
          response = await workerApiService.endLunchBreak({
            projectId,
            location
          });
          break;
        case 'overtime_start':
          console.log('📞 Calling sendOvertimeAlert API (START)...');
          response = await workerApiService.sendOvertimeAlert({
            workerId: authState.user.id.toString(),
            overtimeInfo: { type: 'overtime_start', projectId },
            overtimeType: 'START'
          });
          break;
        case 'overtime_end':
          console.log('📞 Calling sendOvertimeAlert API (END)...');
          response = await workerApiService.sendOvertimeAlert({
            workerId: authState.user.id.toString(),
            overtimeInfo: { type: 'overtime_end', projectId },
            overtimeType: 'END'
          });
          break;
      }

      console.log('📊 API Response:', response);

      if (response?.success) {
        const message = response.data?.message || response.message || `${type.replace('_', ' ')} recorded successfully`;
        Alert.alert('Success', message);
        await loadAttendanceStatus(); // Refresh status
      } else {
        const errorMessage = response?.message || response?.data?.message || 'Failed to record attendance';
        console.error('❌ API Error:', errorMessage);
        Alert.alert('Error', errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Attendance Action Error:', error);
      const errorInfo = handleApiError(error, 'Attendance Action');
      Alert.alert('Error', errorInfo.message);
    } finally {
      setActionLoading(null);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadAttendanceStatus();
    setIsRefreshing(false);
  }, [loadAttendanceStatus]);

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

  const renderAttendanceButton = (
    type: AttendanceType,
    title: string,
    enabled: boolean,
    variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' = 'primary'
  ) => (
    <ConstructionButton
      title={title}
      onPress={() => handleAttendanceAction(type)}
      variant={variant}
      size="large"
      disabled={!enabled || actionLoading !== null || offlineState.isOnline === false}
      loading={actionLoading === type}
      style={styles.attendanceButton}
    />
  );

  if (isLoading) {
    return (
      <ConstructionLoadingIndicator
        visible={true}
        message="Loading attendance status..."
        variant="card"
        size="large"
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <OfflineIndicator />
      
      {/* Error Display */}
      {errorHandlerError && (
        <ErrorDisplay
          error={errorHandlerError}
          variant="banner"
          onRetry={loadAttendanceStatus}
          onDismiss={clearError}
        />
      )}
      
      {/* Location Status */}
      <ConstructionCard
        title="Location Status"
        variant="outlined"
        style={styles.locationSection}
      >
        <GPSAccuracyIndicator 
          accuracyWarning={locationState.currentLocation ? {
            isAccurate: locationState.currentLocation.accuracy <= 20,
            currentAccuracy: locationState.currentLocation.accuracy,
            requiredAccuracy: 20,
            message: locationState.currentLocation.accuracy > 20 ? 'GPS accuracy is insufficient for attendance actions' : 'GPS accuracy is good',
            canProceed: locationState.currentLocation.accuracy <= 20
          } : null}
        />
        <GeofenceValidator 
          projectId={authState.user?.id || 1}
          onValidationChange={(isValid) => {
            // Update location state based on validation
          }}
        />
        {!locationState.isGeofenceValid && (
          <DistanceDisplay 
            distance={locationState.distanceFromSite} 
            isValid={locationState.isGeofenceValid}
          />
        )}
      </ConstructionCard>

      {/* Current Session Info */}
      <ConstructionCard
        title="Current Session"
        variant="default"
        style={styles.sessionSection}
      >
        {attendanceStatus.currentSession ? (
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionText}>
              Status: <Text style={styles.activeStatus}>Active</Text>
            </Text>
            <Text style={styles.sessionText}>
              Started: {formatTime(attendanceStatus.currentSession.loginTime)}
            </Text>
            <Text style={styles.sessionText}>
              Duration: {formatDuration(attendanceStatus.currentSession.loginTime)}
            </Text>
            <Text style={styles.sessionText}>
              Type: {attendanceStatus.currentSession.sessionType}
            </Text>
          </View>
        ) : (
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionText}>
              Status: <Text style={styles.inactiveStatus}>Not Active</Text>
            </Text>
            <Text style={styles.sessionText}>No active session</Text>
          </View>
        )}
      </ConstructionCard>

      {/* Attendance Actions */}
      <ConstructionCard
        title="Attendance Actions"
        variant="elevated"
        style={styles.actionsSection}
      >
        {/* Primary Actions */}
        <View style={styles.primaryActions}>
          {renderAttendanceButton(
            'login',
            'CLOCK IN',
            attendanceStatus.canClockIn,
            'success'
          )}
          {renderAttendanceButton(
            'logout',
            'CLOCK OUT',
            attendanceStatus.canClockOut,
            'error'
          )}
        </View>

        {/* Secondary Actions */}
        {attendanceStatus.currentSession && (
          <View style={styles.secondaryActions}>
            <Text style={styles.subsectionTitle}>Break & Overtime</Text>
            <View style={styles.actionRow}>
              {renderAttendanceButton(
                'lunch_start',
                'START LUNCH',
                attendanceStatus.canClockOut,
                'warning'
              )}
              {renderAttendanceButton(
                'lunch_end',
                'END LUNCH',
                !attendanceStatus.currentSession,
                'warning'
              )}
            </View>
            <View style={styles.actionRow}>
              {renderAttendanceButton(
                'overtime_start',
                'START OVERTIME',
                attendanceStatus.canClockOut,
                'secondary'
              )}
              {renderAttendanceButton(
                'overtime_end',
                'END OVERTIME',
                !attendanceStatus.currentSession,
                'secondary'
              )}
            </View>
          </View>
        )}
      </ConstructionCard>

      {/* Today's Summary */}
      <ConstructionCard
        title="Today's Summary"
        variant="default"
        style={styles.summarySection}
      >
        {attendanceStatus.todaysAttendance.length > 0 ? (
          attendanceStatus.todaysAttendance.map((record, index) => (
            <View key={record.id || index} style={styles.summaryItem}>
              <Text style={styles.summaryText}>
                {formatTime(record.loginTime)} - {record.logoutTime ? formatTime(record.logoutTime) : 'Active'}
              </Text>
              <Text style={styles.summarySubtext}>
                {record.sessionType} • {formatDuration(record.loginTime, record.logoutTime)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No attendance records for today</Text>
        )}
      </ConstructionCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.background,
  },
  locationSection: {
    margin: ConstructionTheme.spacing.md,
  },
  sessionSection: {
    marginHorizontal: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.md,
  },
  sessionInfo: {
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  sessionText: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: 4,
  },
  activeStatus: {
    color: ConstructionTheme.colors.success,
    fontWeight: 'bold',
  },
  inactiveStatus: {
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: 'bold',
  },
  actionsSection: {
    marginHorizontal: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.md,
  },
  primaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ConstructionTheme.spacing.lg,
    gap: ConstructionTheme.spacing.md,
  },
  secondaryActions: {
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.surfaceVariant,
    paddingTop: ConstructionTheme.spacing.lg,
  },
  subsectionTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ConstructionTheme.spacing.md,
    gap: ConstructionTheme.spacing.md,
  },
  attendanceButton: {
    flex: 1,
  },
  summarySection: {
    marginHorizontal: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.md,
  },
  summaryItem: {
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  summaryText: {
    ...ConstructionTheme.typography.bodyLarge,
    fontWeight: '600',
    color: ConstructionTheme.colors.onSurface,
  },
  summarySubtext: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  noDataText: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default AttendanceScreen;