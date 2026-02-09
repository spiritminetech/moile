// AttendanceMonitorCard Component - Real-time attendance tracking for supervisors
// Requirements: 2.2, 3.1, 3.2, 3.3

import React, { useState } from 'react';
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

interface WorkerAttendanceDetail {
  employeeId: number;
  workerName: string;
  role: string;
  status: string;
  morningCheckIn: string | null;
  morningCheckOut: string | null;
  afternoonCheckIn: string | null;
  afternoonCheckOut: string | null;
  totalHours: number;
  overtimeHours: number;
  isLate: boolean;
  minutesLate: number;
  flags: string[];
}

interface AttendanceMonitorCardProps {
  projects: SupervisorDashboardResponse['projects'];
  alerts?: SupervisorDashboardResponse['alerts'];
  workerDetails?: WorkerAttendanceDetail[];
  isLoading: boolean;
  onViewAttendanceDetails?: (projectId: number) => void;
  onResolveAlert?: (alertId: number) => void;
  highContrast?: boolean;
}

const AttendanceMonitorCard: React.FC<AttendanceMonitorCardProps> = ({
  projects,
  alerts = [],
  workerDetails = [],
  isLoading,
  onViewAttendanceDetails,
  onResolveAlert,
  highContrast = false,
}) => {
  const [expandedWorkers, setExpandedWorkers] = useState(false);
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
  const totalWorkers = projects.reduce((sum, project) => sum + (project.attendanceSummary?.total || 0), 0);
  const totalPresent = projects.reduce((sum, project) => sum + (project.attendanceSummary?.present || 0), 0);
  const totalLate = projects.reduce((sum, project) => sum + (project.attendanceSummary?.late || 0), 0);
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
          {projects.map((project, index) => {
            const projectAttendanceRate = (project.attendanceSummary?.total || 0) > 0 
              ? Math.round(((project.attendanceSummary?.present || 0) / (project.attendanceSummary?.total || 1)) * 100)
              : 0;
            
            return (
              <TouchableOpacity
                key={`attendance-monitor-project-${project.id}-${index}`}
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
                    {project.attendanceSummary?.present || 0}/{project.attendanceSummary?.total || 0} present
                  </Text>
                  {(project.attendanceSummary?.late || 0) > 0 && (
                    <Text style={[styles.projectMetricText, styles.lateText]}>
                      {project.attendanceSummary?.late || 0} late
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Worker-wise Attendance Details (Expandable) */}
      {workerDetails.length > 0 && (
        <View style={styles.workerDetailsContainer}>
          <TouchableOpacity 
            style={styles.workerDetailsHeader}
            onPress={() => setExpandedWorkers(!expandedWorkers)}
            activeOpacity={0.7}
          >
            <Text style={styles.workerDetailsTitle}>
              Worker Attendance Details ({workerDetails.length})
            </Text>
            <Text style={styles.expandIcon}>
              {expandedWorkers ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>

          {expandedWorkers && (
            <ScrollView style={styles.workerDetailsList} nestedScrollEnabled>
              {workerDetails.slice(0, 10).map((worker, index) => (
                <View 
                  key={`worker-detail-${worker.employeeId}-${index}`}
                  style={styles.workerDetailItem}
                >
                  <View style={styles.workerDetailHeader}>
                    <Text style={styles.workerName}>{worker.workerName}</Text>
                    <View style={[
                      styles.workerStatusBadge,
                      styles[`status_${worker.status}`]
                    ]}>
                      <Text style={styles.workerStatusText}>
                        {worker.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {worker.status !== 'absent' && (
                    <>
                      {/* Morning Session */}
                      <View style={styles.sessionRow}>
                        <Text style={styles.sessionLabel}>Morning:</Text>
                        <Text style={styles.sessionTime}>
                          {worker.morningCheckIn 
                            ? new Date(worker.morningCheckIn).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })
                            : '-'}
                        </Text>
                        <Text style={styles.sessionSeparator}>→</Text>
                        <Text style={styles.sessionTime}>
                          {worker.morningCheckOut 
                            ? new Date(worker.morningCheckOut).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })
                            : '-'}
                        </Text>
                      </View>

                      {/* Afternoon Session */}
                      {(worker.afternoonCheckIn || worker.afternoonCheckOut) && (
                        <View style={styles.sessionRow}>
                          <Text style={styles.sessionLabel}>Afternoon:</Text>
                          <Text style={styles.sessionTime}>
                            {worker.afternoonCheckIn 
                              ? new Date(worker.afternoonCheckIn).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })
                              : '-'}
                          </Text>
                          <Text style={styles.sessionSeparator}>→</Text>
                          <Text style={styles.sessionTime}>
                            {worker.afternoonCheckOut 
                              ? new Date(worker.afternoonCheckOut).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })
                              : '-'}
                          </Text>
                        </View>
                      )}

                      {/* Hours Summary */}
                      <View style={styles.hoursRow}>
                        <Text style={styles.hoursLabel}>
                          Total: {worker.totalHours.toFixed(1)}h
                        </Text>
                        {worker.overtimeHours > 0 && (
                          <Text style={styles.overtimeLabel}>
                            OT: {worker.overtimeHours.toFixed(1)}h
                          </Text>
                        )}
                        {worker.isLate && (
                          <Text style={styles.lateLabel}>
                            Late: {worker.minutesLate}min
                          </Text>
                        )}
                      </View>

                      {/* Flags */}
                      {worker.flags.length > 0 && (
                        <View style={styles.flagsRow}>
                          {worker.flags.map((flag, flagIndex) => (
                            <View 
                              key={`flag-${worker.employeeId}-${flagIndex}`}
                              style={styles.flagBadge}
                            >
                              <Text style={styles.flagText}>
                                {flag.replace('_', ' ').toUpperCase()}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </>
                  )}
                </View>
              ))}
              {workerDetails.length > 10 && (
                <Text style={styles.moreWorkersText}>
                  +{workerDetails.length - 10} more workers
                </Text>
              )}
            </ScrollView>
          )}
        </View>
      )}

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
  workerDetailsContainer: {
    marginBottom: ConstructionTheme.spacing.md,
    paddingTop: ConstructionTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline,
  },
  workerDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.sm,
  },
  workerDetailsTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
  },
  expandIcon: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.primary,
  },
  workerDetailsList: {
    maxHeight: 400,
  },
  workerDetailItem: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
    padding: ConstructionTheme.spacing.sm,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  workerDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  workerName: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    flex: 1,
  },
  workerStatusBadge: {
    paddingHorizontal: ConstructionTheme.spacing.xs,
    paddingVertical: 2,
    borderRadius: ConstructionTheme.borderRadius.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  status_present: {
    backgroundColor: ConstructionTheme.colors.success,
  },
  status_checked_in: {
    backgroundColor: ConstructionTheme.colors.info,
  },
  status_on_break: {
    backgroundColor: ConstructionTheme.colors.warning,
  },
  status_absent: {
    backgroundColor: ConstructionTheme.colors.error,
  },
  workerStatusText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
    fontSize: 9,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  sessionLabel: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    width: 70,
  },
  sessionTime: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '500',
  },
  sessionSeparator: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginHorizontal: ConstructionTheme.spacing.xs,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: ConstructionTheme.spacing.xs,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  hoursLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginRight: ConstructionTheme.spacing.sm,
  },
  overtimeLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: '#9C27B0',
    fontWeight: 'bold',
    marginRight: ConstructionTheme.spacing.sm,
  },
  lateLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.warning,
    fontWeight: 'bold',
  },
  flagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: ConstructionTheme.spacing.xs,
  },
  flagBadge: {
    backgroundColor: ConstructionTheme.colors.error,
    paddingHorizontal: ConstructionTheme.spacing.xs,
    paddingVertical: 2,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginRight: ConstructionTheme.spacing.xs,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  flagText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onPrimary,
    fontSize: 9,
    fontWeight: 'bold',
  },
  moreWorkersText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: ConstructionTheme.spacing.sm,
  },
});

export default AttendanceMonitorCard;