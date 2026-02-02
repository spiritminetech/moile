import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AttendanceRecord } from '../../types';

interface AttendanceStatusCardProps {
  attendanceStatus: AttendanceRecord | null;
  workingHours: {
    currentSessionDuration: number;
    totalHours: number;
  };
  isLoading: boolean;
}

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
        <Text style={styles.title}>Attendance Status</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading attendance...</Text>
        </View>
      </View>
    );
  }

  const isLoggedIn = attendanceStatus && !attendanceStatus.logoutTime;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance Status</Text>
      
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, isLoggedIn ? styles.loggedIn : styles.loggedOut]}>
          <Text style={styles.statusIcon}>{isLoggedIn ? '🟢' : '🔴'}</Text>
          <Text style={[styles.statusText, isLoggedIn ? styles.loggedInText : styles.loggedOutText]}>
            {isLoggedIn ? 'LOGGED IN' : 'LOGGED OUT'}
          </Text>
        </View>
      </View>

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
    marginBottom: 12,
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