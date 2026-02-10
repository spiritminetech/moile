import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AttendanceRecord } from '../../types';

interface AttendanceStatusCardProps {
  attendanceStatus: AttendanceRecord | null;
  workingHours: {
    currentSessionDuration: number;
    totalHours: number;
    overtimeApproved?: boolean;
    overtimeHours?: number;
    shiftType?: 'morning' | 'afternoon' | 'overtime';
  };
  isLoading: boolean;
}

// Working hours rules as per requirements
interface ShiftInfo {
  type: 'Morning' | 'Lunch Break' | 'Afternoon' | 'Overtime';
  status: 'active' | 'completed' | 'pending' | 'break';
  expectedLogout?: string;
  isApproved?: boolean;
}

// Helper function to determine current shift and status
const getCurrentShiftInfo = (
  attendanceStatus: AttendanceRecord | null, 
  workingHours: AttendanceStatusCardProps['workingHours']
): ShiftInfo => {
  if (!attendanceStatus || !attendanceStatus.loginTime) {
    return { type: 'Morning', status: 'pending' };
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour + currentMinute / 60;

  const loginTime = new Date(attendanceStatus.loginTime);
  const loginHour = loginTime.getHours();
  const loginMinute = loginTime.getMinutes();
  const loginTimeDecimal = loginHour + loginMinute / 60;

  // Check if logged out
  if (attendanceStatus.logoutTime) {
    const logoutTime = new Date(attendanceStatus.logoutTime);
    const logoutHour = logoutTime.getHours();
    
    if (logoutHour <= 12) {
      return { type: 'Morning', status: 'completed', expectedLogout: '12:00 PM' };
    } else if (logoutHour <= 17) {
      return { type: 'Afternoon', status: 'completed', expectedLogout: '5:00 PM' };
    } else if (logoutHour <= 19) {
      return { type: 'Afternoon', status: 'completed', expectedLogout: '7:00 PM' };
    } else {
      return { 
        type: 'Overtime', 
        status: 'completed', 
        isApproved: workingHours.overtimeApproved || true 
      };
    }
  }

  // Currently logged in - determine current session
  if (attendanceStatus.sessionType === 'lunch') {
    return { type: 'Lunch Break', status: 'break' };
  }

  // Calculate total worked hours to determine if in overtime
  const totalWorkedHours = workingHours.totalHours / 60; // Convert minutes to hours
  const isInOvertime = totalWorkedHours > 8 || currentTime >= 19.0; // After 7 PM or more than 8 hours

  // If currently in overtime
  if (isInOvertime) {
    return { 
      type: 'Overtime', 
      status: 'active', 
      isApproved: workingHours.overtimeApproved || false,
      expectedLogout: workingHours.overtimeApproved ? 'Approved until further notice' : 'Pending approval'
    };
  }

  // Morning session: Login before 8:00 AM, Logout 12:00 PM
  if (loginTimeDecimal < 8.0) {
    if (currentTime < 12.0) {
      return { type: 'Morning', status: 'active', expectedLogout: '12:00 PM' };
    } else if (currentTime >= 12.0 && currentTime < 13.0) {
      return { type: 'Lunch Break', status: 'break' };
    } else if (currentTime >= 13.0 && currentTime < 17.0) {
      return { type: 'Afternoon', status: 'active', expectedLogout: '5:00 PM' };
    } else if (currentTime >= 17.0 && currentTime < 19.0) {
      return { type: 'Afternoon', status: 'active', expectedLogout: '7:00 PM' };
    }
  }

  // Late morning login (8:00 AM - 1:00 PM)
  if (loginTimeDecimal >= 8.0 && loginTimeDecimal < 13.0) {
    if (currentTime < 17.0) {
      return { type: 'Afternoon', status: 'active', expectedLogout: '5:00 PM' };
    } else if (currentTime >= 17.0 && currentTime < 19.0) {
      return { type: 'Afternoon', status: 'active', expectedLogout: '7:00 PM' };
    }
  }

  // Afternoon login: Login 1:00 PM or later
  if (loginTimeDecimal >= 13.0) {
    if (currentTime < 17.0) {
      return { type: 'Afternoon', status: 'active', expectedLogout: '5:00 PM' };
    } else if (currentTime >= 17.0 && currentTime < 19.0) {
      return { type: 'Afternoon', status: 'active', expectedLogout: '7:00 PM' };
    }
  }

  // Default fallback
  return { type: 'Morning', status: 'pending' };
};

const AttendanceStatusCard: React.FC<AttendanceStatusCardProps> = ({ 
  attendanceStatus, 
  workingHours, 
  isLoading 
}) => {
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (timeString: string): string => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Working Hours Status</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading attendance...</Text>
        </View>
      </View>
    );
  }

  const isLoggedIn = attendanceStatus && !attendanceStatus.logoutTime;
  const shiftInfo = getCurrentShiftInfo(attendanceStatus, workingHours);

  // Get shift type icon and color
  const getShiftTypeDisplay = (shiftInfo: ShiftInfo) => {
    switch (shiftInfo.type) {
      case 'Morning':
        return { icon: '🌅', color: '#FF9800', bgColor: '#FFF3E0' };
      case 'Lunch Break':
        return { icon: '🍽️', color: '#9C27B0', bgColor: '#F3E5F5' };
      case 'Afternoon':
        return { icon: '☀️', color: '#2196F3', bgColor: '#E3F2FD' };
      case 'Overtime':
        return { icon: '🌙', color: '#F44336', bgColor: '#FFEBEE' };
      default:
        return { icon: '⏰', color: '#757575', bgColor: '#F5F5F5' };
    }
  };

  const shiftDisplay = getShiftTypeDisplay(shiftInfo);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Working Hours Status</Text>
      
      {/* Shift Type Section */}
      <View style={styles.shiftSection}>
        <View style={[styles.shiftTypeCard, { backgroundColor: shiftDisplay.bgColor }]}>
          <Text style={styles.shiftIcon}>{shiftDisplay.icon}</Text>
          <View style={styles.shiftInfo}>
            <Text style={[styles.shiftType, { color: shiftDisplay.color }]}>
              {shiftInfo.type}
            </Text>
            <Text style={styles.shiftStatus}>
              {shiftInfo.status === 'active' && 'On Duty'}
              {shiftInfo.status === 'completed' && 'Completed'}
              {shiftInfo.status === 'pending' && 'Not Started'}
              {shiftInfo.status === 'break' && 'On Break'}
            </Text>
            {shiftInfo.expectedLogout && (
              <Text style={styles.expectedLogout}>
                Expected Logout: {shiftInfo.expectedLogout}
              </Text>
            )}
            {shiftInfo.type === 'Overtime' && (
              <Text style={[styles.overtimeStatus, { color: shiftInfo.isApproved ? '#4CAF50' : '#FF9800' }]}>
                {shiftInfo.isApproved ? '✅ OT Approved' : '⏳ OT Pending Approval'}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Attendance Status Section */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, isLoggedIn ? styles.loggedIn : styles.loggedOut]}>
          <Text style={styles.statusIcon}>{isLoggedIn ? '🟢' : '🔴'}</Text>
          <Text style={[styles.statusText, isLoggedIn ? styles.loggedInText : styles.loggedOutText]}>
            {isLoggedIn ? 'LOGGED IN' : 'LOGGED OUT'}
          </Text>
        </View>
      </View>

      {/* Session Details */}
      {attendanceStatus && (
        <View style={styles.sessionInfo}>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Login Time:</Text>
            <Text style={styles.timeValue}>{formatTime(attendanceStatus.loginTime)}</Text>
          </View>
          
          {attendanceStatus.logoutTime && (
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Logout Time:</Text>
              <Text style={styles.timeValue}>{formatTime(attendanceStatus.logoutTime)}</Text>
            </View>
          )}
          
          <View style={styles.sessionTypeRow}>
            <Text style={styles.sessionTypeLabel}>Session Type:</Text>
            <View style={[styles.sessionTypeBadge, styles[`sessionType_${attendanceStatus.sessionType}`]]}>
              <Text style={styles.sessionTypeText}>
                {attendanceStatus.sessionType.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Working Hours Summary */}
      <View style={styles.hoursContainer}>
        <View style={styles.hoursRow}>
          <View style={styles.hoursItem}>
            <Text style={styles.hoursLabel}>Current Session</Text>
            <Text style={styles.hoursValue}>
              {formatDuration(workingHours.currentSessionDuration)}
            </Text>
          </View>
          <View style={styles.hoursDivider} />
          <View style={styles.hoursItem}>
            <Text style={styles.hoursLabel}>Total Today</Text>
            <Text style={styles.hoursValue}>
              {formatDuration(workingHours.totalHours)}
            </Text>
          </View>
        </View>
      </View>

      {/* Shift Schedule Reference */}
      <View style={styles.scheduleReference}>
        <Text style={styles.scheduleTitle}>📋 Working Hours Schedule</Text>
        <View style={styles.scheduleGrid}>
          <View style={styles.scheduleItem}>
            <Text style={styles.scheduleLabel}>🌅 Morning Session</Text>
            <Text style={styles.scheduleTime}>Login: Before 8:00 AM</Text>
            <Text style={styles.scheduleTime}>Logout: 12:00 PM</Text>
          </View>
          <View style={styles.scheduleItem}>
            <Text style={styles.scheduleLabel}>🍽️ Lunch Break</Text>
            <Text style={styles.scheduleTime}>Duration: 1 hour</Text>
            <Text style={styles.scheduleTime}>Time: 12:00 - 1:00 PM</Text>
          </View>
          <View style={styles.scheduleItem}>
            <Text style={styles.scheduleLabel}>☀️ Afternoon Session</Text>
            <Text style={styles.scheduleTime}>Login: 1:00 PM</Text>
            <Text style={styles.scheduleTime}>Logout: 5:00 / 7:00 PM</Text>
          </View>
          <View style={styles.scheduleItem}>
            <Text style={styles.scheduleLabel}>🌙 Overtime</Text>
            <Text style={styles.scheduleTime}>After: 7:00 PM</Text>
            <Text style={styles.scheduleTime}>Requires: Supervisor approval</Text>
          </View>
        </View>
        
        {/* Current Status Summary */}
        <View style={styles.currentStatusSummary}>
          <Text style={styles.currentStatusTitle}>📊 Today's Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Hours Worked:</Text>
            <Text style={styles.summaryValue}>
              {formatDuration(workingHours.totalHours)}
            </Text>
          </View>
          {workingHours.overtimeHours && workingHours.overtimeHours > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Overtime Hours:</Text>
              <Text style={[styles.summaryValue, styles.overtimeValue]}>
                {Math.floor(workingHours.overtimeHours / 60)}h {workingHours.overtimeHours % 60}m
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Current Shift:</Text>
            <Text style={[styles.summaryValue, { color: shiftDisplay.color }]}>
              {shiftInfo.type}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  shiftSection: {
    marginBottom: 16,
  },
  shiftTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  shiftIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  shiftInfo: {
    flex: 1,
  },
  shiftType: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  shiftStatus: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 2,
  },
  expectedLogout: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  overtimeStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loggedIn: {
    backgroundColor: '#E8F5E8',
  },
  loggedOut: {
    backgroundColor: '#FFEBEE',
  },
  statusIcon: {
    fontSize: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  loggedInText: {
    color: '#2E7D32',
  },
  loggedOutText: {
    color: '#C62828',
  },
  sessionInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: '#757575',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212121',
  },
  sessionTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sessionTypeLabel: {
    fontSize: 14,
    color: '#757575',
  },
  sessionTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sessionType_regular: {
    backgroundColor: '#E3F2FD',
  },
  sessionType_overtime: {
    backgroundColor: '#FFF3E0',
  },
  sessionType_lunch: {
    backgroundColor: '#F3E5F5',
  },
  sessionTypeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  hoursContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    marginBottom: 12,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hoursItem: {
    flex: 1,
    alignItems: 'center',
  },
  hoursDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  hoursLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  hoursValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  scheduleReference: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 12,
  },
  scheduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scheduleItem: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  scheduleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 10,
    color: '#757575',
    marginBottom: 2,
  },
  currentStatusSummary: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  currentStatusTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#424242',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  overtimeValue: {
    color: '#FF9800',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#757575',
  },
});

export default AttendanceStatusCard;