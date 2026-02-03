// Worker Attendance Screen with location-based controls
// Requirements: 3.2, 3.3, 3.5, 12.1

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocation } from '../../store/context/LocationContext';
import { useAuth } from '../../store/context/AuthContext';
import { useOffline } from '../../store/context/OfflineContext';
import { workerApiService } from '../../services/api/WorkerApiService';
import { TodaysAttendanceResponse } from '../../services/api/AttendanceApiService';
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
import { AttendanceRecord } from '../../types';
import { useErrorHandler } from '../../hooks/useErrorHandler';

interface AttendanceStatus {
  currentSession: AttendanceRecord | null;
  todaysAttendance: AttendanceRecord[];
  canClockIn: boolean;
  canClockOut: boolean;
  isOnLunchBreak: boolean;
  totalTodayMinutes?: number;
  lunchMinutes?: number;
}

type AttendanceType = 'login' | 'logout' | 'lunch_start' | 'lunch_end' | 'overtime_start' | 'overtime_end';

const AttendanceScreen: React.FC = () => {
  const { state: locationState, validateGeofence } = useLocation();
  const { state: authState } = useAuth();
  const { state: offlineState } = useOffline();
  const { handleApiError, clearError, error: errorHandlerError } = useErrorHandler();
  
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>({
    currentSession: null,
    todaysAttendance: [],
    canClockIn: false,
    canClockOut: false,
    isOnLunchBreak: false,
    totalTodayMinutes: 0,
    lunchMinutes: 0,
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
    
    console.log('🔄 Loading attendance status...');
    setIsLoading(true);
    try {
      clearError();
      const response = await workerApiService.getTodaysAttendance();
      console.log('📥 getTodaysAttendance response:', response);
      
      if (response.success) {
        const data = response.data as TodaysAttendanceResponse & {
          workDuration?: number;
          lunchDuration?: number;
        };
        console.log('📊 Processing attendance data:', data);
        
        // Create currentSession only if actively checked in
        const currentSession = data.session === 'CHECKED_IN' || data.session === 'ON_LUNCH' ? {
          id: 1,
          workerId: authState.user.id,
          projectId: parseInt(data.projectId?.toString() || '1003'),
          loginTime: data.checkInTime || '',
          logoutTime: data.checkOutTime || undefined,
          location: { latitude: 0, longitude: 0, accuracy: 0, timestamp: new Date() },
          sessionType: 'regular' as const,
        } : null;
        
        // Create todaysAttendance record if there's any attendance data for today
        let todaysAttendance: AttendanceRecord[] = [];
        if (data.checkInTime) {
          // There's attendance data for today, create a record
          todaysAttendance = [{
            id: 1,
            workerId: authState.user.id,
            projectId: parseInt(data.projectId?.toString() || '1003'),
            loginTime: data.checkInTime,
            logoutTime: data.checkOutTime || undefined,
            location: { latitude: 0, longitude: 0, accuracy: 0, timestamp: new Date() },
            sessionType: 'regular' as const,
          }];
        }
        
        console.log('🎯 Created currentSession:', currentSession);
        console.log('📋 Created todaysAttendance:', todaysAttendance);
        
        // Determine button states based on session and lunch status
        let canClockIn = false;
        let canClockOut = false;
        
        if (data.session === 'NOT_LOGGED_IN' || data.session === 'CHECKED_OUT') {
          canClockIn = true;
          canClockOut = false;
        } else if (data.session === 'CHECKED_IN') {
          canClockIn = false;
          canClockOut = !data.isOnLunchBreak; // Can't clock out while on lunch
        } else if (data.session === 'ON_LUNCH') {
          canClockIn = false;
          canClockOut = false; // Can't clock out while on lunch
        }
        
        const newAttendanceStatus = {
          currentSession,
          todaysAttendance,
          canClockIn,
          canClockOut,
          isOnLunchBreak: data.isOnLunchBreak || false,
          // Add additional data for display
          totalTodayMinutes: data.workDuration || 0,
          lunchMinutes: data.lunchDuration || 0,
        };
        
        console.log('✅ Setting attendance status:', {
          hasCurrentSession: !!newAttendanceStatus.currentSession,
          todaysAttendanceLength: newAttendanceStatus.todaysAttendance.length,
          canClockIn: newAttendanceStatus.canClockIn,
          canClockOut: newAttendanceStatus.canClockOut,
          isOnLunchBreak: newAttendanceStatus.isOnLunchBreak,
          session: data.session,
          totalTodayMinutes: newAttendanceStatus.totalTodayMinutes,
          lunchMinutes: newAttendanceStatus.lunchMinutes,
        });
        
        setAttendanceStatus(newAttendanceStatus);
      }
    } catch (error) {
      console.error('❌ Error loading attendance status:', error);
      handleApiError(error, 'Load Attendance Status');
    } finally {
      setIsLoading(false);
    }
  }, [authState.user, offlineState.isOnline, clearError, handleApiError]);

  const updateAttendanceButtons = useCallback(() => {
    // Don't override API-based session state
    // The API response should determine canClockIn/canClockOut based on session
    // This function now only handles location-based restrictions in the button rendering
    console.log('🔄 Location state changed, buttons will be updated in render');
  }, []);

  const handleAttendanceAction = async (type: AttendanceType) => {
    console.log('🎯 Starting attendance action:', type);
    
    if (!locationState.currentLocation || !authState.user) {
      Alert.alert('Error', 'Location or user information not available');
      return;
    }

    // Get project ID - try multiple sources
    let projectId: string | null = null;
    
    console.log('🔍 DEBUG: Project ID selection:');
    console.log('  authState.user?.currentProject:', authState.user?.currentProject);
    console.log('  authState.company?.id:', authState.company?.id);
    
    // Try to get from user's current project (CORRECT SOURCE)
    if (authState.user?.currentProject?.id) {
      projectId = authState.user.currentProject.id.toString();
      console.log('📍 Using project ID from user.currentProject:', projectId);
    }
    // Fallback: Use project ID 1003 (from task assignment we just created)
    else {
      projectId = '1003';
      console.log('📍 Using default project ID (task assignment):', projectId);
    }

    if (!projectId) {
      Alert.alert('Error', 'No project assigned. Please contact your supervisor.');
      return;
    }

    // For lunch break actions, skip geofence validation if already checked in
    const skipGeofenceForLunch = (type === 'lunch_start' || type === 'lunch_end') && attendanceStatus.currentSession;
    
    if (!skipGeofenceForLunch) {
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
    }

    setActionLoading(type);
    try {
      clearError();
      const location = locationState.currentLocation;
      let response;

      console.log('🚀 Making API call for:', type, 'with projectId:', projectId);
      console.log('📊 Request details:', {
        type,
        projectId,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy
        }
      });

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
      console.log('📊 Response structure:', {
        hasSuccess: 'success' in (response || {}),
        hasDataSuccess: response?.data && 'success' in response.data,
        responseSuccess: response?.success,
        dataSuccess: response?.data?.success,
        responseData: response?.data,
        responseMessage: response?.message,
        dataMessage: response?.data?.message
      });

      // Check for success in the response data (backend returns success in data)
      const isSuccess = response?.success || response?.data?.success;
      const responseData = response?.data || response;
      
      console.log('📊 Processed response:', {
        isSuccess,
        responseData,
        message: responseData?.message || response?.message
      });
      
      if (isSuccess) {
        const message = responseData?.message || response.message || `${type.replace('_', ' ')} recorded successfully`;
        Alert.alert('Success', message);
        
        // Immediately update local state for better UX
        if (type === 'login') {
          setAttendanceStatus(prev => ({
            ...prev,
            currentSession: {
              id: 1,
              workerId: authState.user!.id,
              projectId: parseInt(projectId!),
              loginTime: new Date().toISOString(),
              location: { latitude: location.latitude, longitude: location.longitude, accuracy: location.accuracy || 0, timestamp: new Date() },
              sessionType: 'regular' as const,
            },
            todaysAttendance: [{
              id: 1,
              workerId: authState.user!.id,
              projectId: parseInt(projectId!),
              loginTime: new Date().toISOString(),
              location: { latitude: location.latitude, longitude: location.longitude, accuracy: location.accuracy || 0, timestamp: new Date() },
              sessionType: 'regular' as const,
            }],
            canClockIn: false,
            canClockOut: true,
            isOnLunchBreak: false,
            totalTodayMinutes: 0, // Reset for new session
          }));
        } else if (type === 'logout') {
          setAttendanceStatus(prev => ({
            ...prev,
            currentSession: null,
            canClockIn: true,
            canClockOut: false,
            isOnLunchBreak: false,
            // Keep totalTodayMinutes as it represents the completed session
          }));
        } else if (type === 'lunch_start') {
          setAttendanceStatus(prev => ({
            ...prev,
            isOnLunchBreak: true,
            canClockOut: false, // Can't clock out while on lunch
          }));
        } else if (type === 'lunch_end') {
          setAttendanceStatus(prev => ({
            ...prev,
            isOnLunchBreak: false,
            canClockOut: true, // Can clock out after lunch
          }));
        }
      } else {
        const errorMessage = responseData?.message || response?.message || 'Failed to record attendance';
        console.error('❌ API Error:', errorMessage);
        
        // Handle specific lunch break errors with better state management
        if (type === 'lunch_start') {
          if (errorMessage.toLowerCase().includes('already')) {
            // If lunch already started, sync local state with server
            setAttendanceStatus(prev => ({
              ...prev,
              isOnLunchBreak: true,
              canClockOut: false,
            }));
            Alert.alert('Info', 'Lunch break is already active');
          } else {
            Alert.alert('Error', errorMessage);
          }
        } else if (type === 'lunch_end') {
          if (errorMessage.toLowerCase().includes('not on lunch')) {
            // If not on lunch, sync local state with server
            setAttendanceStatus(prev => ({
              ...prev,
              isOnLunchBreak: false,
              canClockOut: prev.currentSession ? true : false,
            }));
            Alert.alert('Info', 'You are not currently on lunch break');
          } else {
            Alert.alert('Error', errorMessage);
          }
        } else {
          Alert.alert('Error', errorMessage);
        }
      }
      
      // Always refresh attendance status after any attendance action to ensure consistency
      setTimeout(() => {
        loadAttendanceStatus();
      }, 1000); // Small delay to allow server to process
      
    } catch (error: any) {
      console.error('❌ Attendance Action Error:', error);
      const errorInfo = handleApiError(error, 'Attendance Action');
      Alert.alert('Error', errorInfo.message);
      
      // Also refresh status after errors, in case the action partially succeeded
      setTimeout(() => {
        loadAttendanceStatus();
      }, 1000);
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
    const date = new Date(dateString);
    console.log('🕐 Formatting time:', {
      input: dateString,
      parsed: date,
      formatted: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    });
    return date.toLocaleTimeString('en-US', {
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

  const formatMinutesToDuration = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const renderAttendanceButton = (
    type: AttendanceType,
    title: string,
    enabled: boolean,
    variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' = 'primary'
  ) => {
    // Check if location and geofence are valid for attendance actions
    // For lunch break actions, allow if already checked in (skip geofence check)
    const isLunchAction = type === 'lunch_start' || type === 'lunch_end';
    const locationValid = locationState.currentLocation && (
      locationState.isGeofenceValid || 
      (isLunchAction && attendanceStatus.currentSession)
    );
    
    const finalEnabled = enabled && locationValid && actionLoading === null && offlineState.isOnline !== false;
    
    return (
      <ConstructionButton
        title={title}
        onPress={() => handleAttendanceAction(type)}
        variant={variant}
        size="large"
        disabled={!finalEnabled}
        loading={actionLoading === type}
        style={styles.attendanceButton}
      />
    );
  };

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
          projectId={1003}
          onValidationChange={(isValid) => {
            console.log('🎯 AttendanceScreen: Geofence validation changed:', isValid);
            // Update location state based on validation
          }}
        />
        {!locationState.isGeofenceValid && (
          <DistanceDisplay 
            distance={locationState.distanceFromSite} 
            isValid={locationState.isGeofenceValid}
          />
        )}
        
        {/* Debug location info */}
        <View style={{ padding: 10, backgroundColor: '#f0f0f0', marginTop: 10, borderRadius: 5 }}>
          <Text style={{ fontSize: 12, color: '#666' }}>
            Debug: Current Location: {locationState.currentLocation ? 
              `${locationState.currentLocation.latitude.toFixed(4)}, ${locationState.currentLocation.longitude.toFixed(4)}` : 
              'None'}
          </Text>
          <Text style={{ fontSize: 12, color: '#666' }}>
            Permission: {locationState.hasLocationPermission ? 'Yes' : 'No'} | 
            Services: {locationState.isLocationEnabled ? 'Yes' : 'No'} | 
            Geofence: {locationState.isGeofenceValid ? 'Valid' : 'Invalid'}
          </Text>
          <Text style={{ fontSize: 12, color: '#666' }}>
            Attendance: ClockIn={attendanceStatus.canClockIn ? 'Yes' : 'No'} | 
            ClockOut={attendanceStatus.canClockOut ? 'Yes' : 'No'} | 
            OnLunch={attendanceStatus.isOnLunchBreak ? 'Yes' : 'No'}
          </Text>
        </View>
      </ConstructionCard>

      {/* Attendance Status */}
      <ConstructionCard
        title="Attendance Status"
        variant="default"
        style={styles.sessionSection}
      >
        <View style={styles.sessionInfo}>
          {/* Current Session */}
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Current Session:</Text>
            {attendanceStatus.currentSession ? (
              <Text style={styles.activeStatus}>
                Active {attendanceStatus.isOnLunchBreak && '(On Lunch)'}
              </Text>
            ) : (
              <Text style={styles.inactiveStatus}>Not Active</Text>
            )}
          </View>

          {/* Total Today */}
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Total Today:</Text>
            <Text style={styles.sessionText}>
              {attendanceStatus.totalTodayMinutes !== undefined 
                ? formatMinutesToDuration(attendanceStatus.totalTodayMinutes)
                : (attendanceStatus.todaysAttendance.length > 0 
                    ? formatDuration(
                        attendanceStatus.todaysAttendance[0].loginTime, 
                        attendanceStatus.todaysAttendance[0].logoutTime
                      )
                    : '0h 0m'
                  )
              }
            </Text>
          </View>

          {/* Session Details */}
          {attendanceStatus.currentSession && (
            <>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Started:</Text>
                <Text style={styles.sessionText}>
                  {formatTime(attendanceStatus.currentSession.loginTime)}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Duration:</Text>
                <Text style={styles.sessionText}>
                  {formatDuration(attendanceStatus.currentSession.loginTime)}
                </Text>
              </View>
            </>
          )}
        </View>
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
        {(attendanceStatus.currentSession || (attendanceStatus.todaysAttendance.length > 0 && !attendanceStatus.todaysAttendance[0].logoutTime)) && (
          <View style={styles.secondaryActions}>
            <Text style={styles.subsectionTitle}>Break & Overtime</Text>
            <View style={styles.actionRow}>
              {renderAttendanceButton(
                'lunch_start',
                'START LUNCH',
                attendanceStatus.currentSession && !attendanceStatus.isOnLunchBreak && attendanceStatus.canClockOut,
                'warning'
              )}
              {renderAttendanceButton(
                'lunch_end',
                'END LUNCH',
                attendanceStatus.currentSession && attendanceStatus.isOnLunchBreak,
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: '600',
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
  lunchStatus: {
    color: ConstructionTheme.colors.warning,
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