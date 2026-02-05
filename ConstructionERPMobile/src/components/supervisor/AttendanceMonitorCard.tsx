// AttendanceMonitorCard Component - Real-time attendance tracking for supervisors
// Requirements: 2.2, 3.1, 3.2, 3.3

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SupervisorDashboardResponse } from '../../types';
import ConstructionCard from '../common/ConstructionCard';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface AttendanceMonitorCardProps {
  projects: SupervisorDashboardResponse['projects'];
  alerts?: SupervisorDashboardResponse['alerts'];
  isLoading: boolean;
  onViewAttendanceDetails?: (projectId: number) => void;
  onResolveAlert?: (alertId: number) => void;
}

const AttendanceMonitorCard: React.FC<AttendanceMonitorCardProps> = ({
  projects,
  alerts = [],
  isLoading,
  onViewAttendanceDetails,
  onResolveAlert,
}) => {
  if (isLoading) {
    return (
      <ConstructionCard title="Attendance Monitor" variant="default">
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading attendance data...</Text>
        </View>
      </ConstructionCard>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <ConstructionCard title="Attendance Monitor" variant="default">
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No attendance data available</Text>
        </View>
      </ConstructionCard>
    );
  }

  // Calculate overall attendance metrics
  const totalWorkers = projects.reduce((sum, project) => sum + project.attendanceSummary.total, 0);
  const totalPresent = projects.reduce((sum, project) => sum + project.attendanceSummary.present, 0);
  const totalLate = projects.reduce((sum, project) => sum + project.attendanceSummary.late, 0);
  const attendanceRate = totalWorkers > 0 ? Math.round((totalPresent / totalWorkers) * 100) : 0;

  // Filter attendance-related alerts
  const attendanceAlerts = alerts.filter(alert => 
    alert.type === 'attendance' || alert.type === 'geofence'
  );

  return (
    <ConstructionCard 
      title="Attendance Monitor" 
      variant={attendanceAlerts.length > 0 ? "warning" : "default"}
    >
      {/* Overall Attendance Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.attendanceRateContainer}>
          <Text style={styles.attendanceRateValue}>{attendanceRate}%</Text>
          <Text style={styles.attendanceRateLabel}>Attendance Rate</Text>
        </View>
        
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, styles.presentValue]}>{totalPresent}</Text>
            <Text style={styles.metricLabel}>Present</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, styles.lateValue]}>{totalLate}</Text>
            <Text style={styles.metricLabel}>Late</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, styles.absentValue]}>
              {totalWorkers - totalPresent}
            </Text>
            <Text style={styles.metricLabel}>Absent</Text>
          </View>
        </View>
      </View>

      {/* Attendance Alerts */}
      {attendanceAlerts.length > 0 && (
        <View style={styles.alertsContainer}>
          <Text style={styles.alertsTitle}>Attendance Alerts</Text>
          <ScrollView style={styles.alertsList} showsVerticalScrollIndicator={false}>
            {attendanceAlerts.slice(0, 3).map((alert) => (
              <View key={alert.id} style={[styles.alertItem, styles[`alert_${alert.priority}`]]}>
                <View style={styles.alertContent}>
                  <Text style={styles.alertMessage} numberOfLines={2}>
                    {alert.message}
                  </Text>
                  <Text style={styles.alertTime}>
                    {new Date(alert.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.resolveButton}
                  onPress={() => onResolveAlert?.(alert.id)}
                >
                  <Text style={styles.resolveButtonText}>✓</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          {attendanceAlerts.length > 3 && (
            <Text style={styles.moreAlertsText}>
              +{attendanceAlerts.length - 3} more alerts
            </Text>
          )}
        </View>
      )}

      {/* Project Attendance Breakdown */}
      <View style={styles.projectsContainer}>
        <Text style={styles.projectsTitle}>Project Breakdown</Text>
        <ScrollView style={styles.projectsList} showsVerticalScrollIndicator={false}>
          {projects.map((project) => {
            const projectAttendanceRate = project.attendanceSummary.total > 0 
              ? Math.round((project.attendanceSummary.present / project.attendanceSummary.total) * 100)
              : 0;
            
            return (
              <TouchableOpacity
                key={project.id}
                style={styles.projectItem}
                onPress={() => onViewAttendanceDetails?.(project.id)}
                activeOpacity={0.7}
              >
                <View style={styles.projectHeader}>
                  <Text style={styles.projectName} numberOfLines={1}>
                    {project.name}
                  </Text>
                  <Text style={[
                    styles.projectRate,
                    projectAttendanceRate < 80 ? styles.lowRate : styles.goodRate
                  ]}>
                    {projectAttendanceRate}%
                  </Text>
                </View>
                
                <View style={styles.projectMetrics}>
                  <Text style={styles.projectMetricText}>
                    {project.attendanceSummary.present}/{project.attendanceSummary.total} present
                  </Text>
                  {project.attendanceSummary.late > 0 && (
                    <Text style={[styles.projectMetricText, styles.lateText]}>
                      {project.attendanceSummary.late} late
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onViewAttendanceDetails?.(0)} // 0 indicates view all
        >
          <Text style={styles.actionButtonText}>View All Attendance</Text>
        </TouchableOpacity>
      </View>
    </ConstructionCard>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: ConstructionTheme.spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  emptyContainer: {
    padding: ConstructionTheme.spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  summaryContainer: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  attendanceRateContainer: {
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.md,
  },
  attendanceRateValue: {
    ...ConstructionTheme.typography.displaySmall,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
  },
  attendanceRateLabel: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    ...ConstructionTheme.typography.headlineMedium,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  presentValue: {
    color: ConstructionTheme.colors.success,
  },
  lateValue: {
    color: ConstructionTheme.colors.warning,
  },
  absentValue: {
    color: ConstructionTheme.colors.error,
  },
  metricLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  alertsContainer: {
    marginBottom: ConstructionTheme.spacing.md,
    paddingTop: ConstructionTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline,
  },
  alertsTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  alertsList: {
    maxHeight: 120,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  alert_low: {
    backgroundColor: '#E8F5E8',
  },
  alert_medium: {
    backgroundColor: '#FFF8E1',
  },
  alert_high: {
    backgroundColor: '#FFEBEE',
  },
  alert_critical: {
    backgroundColor: '#FFCDD2',
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  alertTime: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  resolveButton: {
    backgroundColor: ConstructionTheme.colors.success,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: ConstructionTheme.spacing.sm,
  },
  resolveButtonText: {
    color: ConstructionTheme.colors.onPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  moreAlertsText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: ConstructionTheme.spacing.xs,
  },
  projectsContainer: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  projectsTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  projectsList: {
    maxHeight: 150,
  },
  projectItem: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
    padding: ConstructionTheme.spacing.sm,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  projectName: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurface,
    flex: 1,
    marginRight: ConstructionTheme.spacing.sm,
  },
  projectRate: {
    ...ConstructionTheme.typography.labelLarge,
    fontWeight: 'bold',
  },
  goodRate: {
    color: ConstructionTheme.colors.success,
  },
  lowRate: {
    color: ConstructionTheme.colors.error,
  },
  projectMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  projectMetricText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  lateText: {
    color: ConstructionTheme.colors.warning,
  },
  actionsContainer: {
    paddingTop: ConstructionTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline,
  },
  actionButton: {
    backgroundColor: ConstructionTheme.colors.primary,
    paddingVertical: ConstructionTheme.spacing.sm,
    paddingHorizontal: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    alignItems: 'center',
    minHeight: ConstructionTheme.dimensions.buttonMedium,
    justifyContent: 'center',
  },
  actionButtonText: {
    ...ConstructionTheme.typography.buttonMedium,
    color: ConstructionTheme.colors.onPrimary,
  },
});

export default AttendanceMonitorCard;