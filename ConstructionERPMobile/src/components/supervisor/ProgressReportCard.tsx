// ProgressReportCard Component - Project progress visualization for supervisors
// Requirements: 2.5, 5.1, 5.2, 5.3, 5.4, 5.5

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

interface ProgressReportCardProps {
  projects: SupervisorDashboardResponse['projects'];
  alerts?: SupervisorDashboardResponse['alerts'];
  isLoading: boolean;
  onViewProgressDetails?: (projectId: number) => void;
  onCreateReport?: () => void;
  onViewReports?: () => void;
}

const ProgressReportCard: React.FC<ProgressReportCardProps> = ({
  projects,
  alerts = [],
  isLoading,
  onViewProgressDetails,
  onCreateReport,
  onViewReports,
}) => {
  if (isLoading) {
    return (
      <ConstructionCard title="Progress Report" variant="default">
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading progress data...</Text>
        </View>
      </ConstructionCard>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <ConstructionCard title="Progress Report" variant="default">
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No project data available</Text>
          <TouchableOpacity style={styles.createReportButton} onPress={onCreateReport}>
            <Text style={styles.createReportButtonText}>Create Report</Text>
          </TouchableOpacity>
        </View>
      </ConstructionCard>
    );
  }

  // Calculate overall progress metrics
  const totalTasks = projects.reduce((sum, project) => sum + (project.progressSummary?.totalTasks || 0), 0);
  const completedTasks = projects.reduce((sum, project) => sum + (project.progressSummary?.completedTasks || 0), 0);
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Calculate daily target performance
  const totalDailyTarget = projects.reduce((sum, project) => sum + (project.progressSummary?.dailyTarget || 0), 0);
  const dailyTargetProgress = totalDailyTarget > 0 ? Math.round((completedTasks / totalDailyTarget) * 100) : 0;

  // Filter progress-related alerts
  const progressAlerts = alerts.filter(alert => 
    alert.type === 'safety' || alert.type === 'urgent_request'
  );

  const getProgressStatus = (progress: number) => {
    if (progress >= 90) return { status: 'excellent', color: ConstructionTheme.colors.success };
    if (progress >= 75) return { status: 'good', color: ConstructionTheme.colors.info };
    if (progress >= 50) return { status: 'fair', color: ConstructionTheme.colors.warning };
    return { status: 'behind', color: ConstructionTheme.colors.error };
  };

  const progressStatus = getProgressStatus(overallProgress);

  return (
    <ConstructionCard 
      title="Progress Report" 
      variant={progressAlerts.length > 0 ? "warning" : "default"}
    >
      {/* Overall Progress Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.progressCircleContainer}>
          <View style={[styles.progressCircle, { borderColor: progressStatus.color }]}>
            <Text style={[styles.progressValue, { color: progressStatus.color }]}>
              {overallProgress}%
            </Text>
            <Text style={styles.progressLabel}>Complete</Text>
          </View>
          <Text style={[styles.progressStatus, { color: progressStatus.color }]}>
            {progressStatus.status.toUpperCase()}
          </Text>
        </View>

        <View style={styles.metricsContainer}>
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{completedTasks}</Text>
              <Text style={styles.metricLabel}>Completed</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{totalTasks - completedTasks}</Text>
              <Text style={styles.metricLabel}>Remaining</Text>
            </View>
          </View>
          
          <View style={styles.dailyTargetContainer}>
            <Text style={styles.dailyTargetLabel}>Daily Target Progress</Text>
            <View style={styles.dailyTargetBar}>
              <View 
                style={[
                  styles.dailyTargetFill, 
                  { 
                    width: `${Math.min(dailyTargetProgress, 100)}%`,
                    backgroundColor: dailyTargetProgress >= 100 
                      ? ConstructionTheme.colors.success 
                      : ConstructionTheme.colors.warning
                  }
                ]} 
              />
            </View>
            <Text style={[
              styles.dailyTargetText,
              { color: dailyTargetProgress >= 100 
                ? ConstructionTheme.colors.success 
                : ConstructionTheme.colors.warning }
            ]}>
              {dailyTargetProgress}% of daily target
            </Text>
          </View>
        </View>
      </View>

      {/* Progress Alerts */}
      {progressAlerts.length > 0 && (
        <View style={styles.alertsContainer}>
          <Text style={styles.alertsTitle}>Progress Alerts</Text>
          <ScrollView style={styles.alertsList} showsVerticalScrollIndicator={false}>
            {progressAlerts.slice(0, 2).map((alert) => (
              <View key={alert.id} style={[styles.alertItem, styles[`alert_${alert.priority}`]]}>
                <Text style={styles.alertIcon}>
                  {alert.type === 'safety' ? '⚠️' : '🚨'}
                </Text>
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
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Project Progress Breakdown */}
      <View style={styles.projectsContainer}>
        <Text style={styles.projectsTitle}>Project Progress</Text>
        <ScrollView style={styles.projectsList} showsVerticalScrollIndicator={false}>
          {projects.map((project, index) => {
            const projectProgress = (project.progressSummary?.totalTasks || 0) > 0 
              ? Math.round(((project.progressSummary?.completedTasks || 0) / (project.progressSummary?.totalTasks || 1)) * 100)
              : 0;
            
            const projectStatus = getProgressStatus(projectProgress);

            return (
              <TouchableOpacity
                key={`project-${project.id}-${index}`}
                style={styles.projectCard}
                onPress={() => onViewProgressDetails?.(project.id)}
                activeOpacity={0.7}
              >
                <View style={styles.projectHeader}>
                  <Text style={styles.projectName} numberOfLines={1}>
                    {project.name}
                  </Text>
                  <View style={styles.projectProgressContainer}>
                    <Text style={[styles.projectProgress, { color: projectStatus.color }]}>
                      {projectProgress}%
                    </Text>
                  </View>
                </View>

                <View style={styles.projectMetrics}>
                  <View style={styles.projectMetricItem}>
                    <Text style={styles.projectMetricValue}>
                      {project.progressSummary?.completedTasks || 0}/{project.progressSummary?.totalTasks || 0}
                    </Text>
                    <Text style={styles.projectMetricLabel}>Tasks</Text>
                  </View>
                  <View style={styles.projectMetricItem}>
                    <Text style={styles.projectMetricValue}>
                      {project.workforceCount}
                    </Text>
                    <Text style={styles.projectMetricLabel}>Workers</Text>
                  </View>
                  <View style={styles.projectMetricItem}>
                    <Text style={[
                      styles.projectMetricValue,
                      { color: (project.attendanceSummary?.present || 0) >= (project.attendanceSummary?.total || 1) * 0.8 
                        ? ConstructionTheme.colors.success 
                        : ConstructionTheme.colors.warning }
                    ]}>
                      {Math.round(((project.attendanceSummary?.present || 0) / (project.attendanceSummary?.total || 1)) * 100)}%
                    </Text>
                    <Text style={styles.projectMetricLabel}>Attendance</Text>
                  </View>
                </View>

                <View style={styles.projectProgressBar}>
                  <View 
                    style={[
                      styles.projectProgressFill, 
                      { 
                        width: `${projectProgress}%`,
                        backgroundColor: projectStatus.color
                      }
                    ]} 
                  />
                </View>

                <Text style={[styles.projectStatus, { color: projectStatus.color }]}>
                  {projectStatus.status}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={onCreateReport}
        >
          <Text style={styles.quickActionIcon}>📊</Text>
          <Text style={styles.quickActionText}>Create Report</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => onViewProgressDetails?.(0)} // 0 indicates view all
        >
          <Text style={styles.quickActionIcon}>📈</Text>
          <Text style={styles.quickActionText}>View Analytics</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onViewReports}
        >
          <Text style={styles.actionButtonText}>View All Reports</Text>
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
    marginBottom: ConstructionTheme.spacing.md,
  },
  createReportButton: {
    backgroundColor: ConstructionTheme.colors.primary,
    paddingVertical: ConstructionTheme.spacing.sm,
    paddingHorizontal: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    minHeight: ConstructionTheme.dimensions.buttonMedium,
    justifyContent: 'center',
  },
  createReportButtonText: {
    ...ConstructionTheme.typography.buttonMedium,
    color: ConstructionTheme.colors.onPrimary,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.md,
  },
  progressCircleContainer: {
    alignItems: 'center',
    marginRight: ConstructionTheme.spacing.lg,
  },
  progressCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  progressValue: {
    ...ConstructionTheme.typography.headlineSmall,
    fontWeight: 'bold',
  },
  progressLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  progressStatus: {
    ...ConstructionTheme.typography.labelMedium,
    fontWeight: 'bold',
  },
  metricsContainer: {
    flex: 1,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: ConstructionTheme.spacing.md,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  metricLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  dailyTargetContainer: {
    marginTop: ConstructionTheme.spacing.sm,
  },
  dailyTargetLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  dailyTargetBar: {
    height: 6,
    backgroundColor: ConstructionTheme.colors.outline,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  dailyTargetFill: {
    height: '100%',
  },
  dailyTargetText: {
    ...ConstructionTheme.typography.labelSmall,
    textAlign: 'center',
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
    maxHeight: 100,
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
  alertIcon: {
    fontSize: 20,
    marginRight: ConstructionTheme.spacing.sm,
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
  projectsContainer: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  projectsTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  projectsList: {
    maxHeight: 200,
  },
  projectCard: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
    padding: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.sm,
    ...ConstructionTheme.shadows.small,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  projectName: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    flex: 1,
    marginRight: ConstructionTheme.spacing.sm,
  },
  projectProgressContainer: {
    alignItems: 'center',
  },
  projectProgress: {
    ...ConstructionTheme.typography.headlineSmall,
    fontWeight: 'bold',
  },
  projectMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  projectMetricItem: {
    alignItems: 'center',
  },
  projectMetricValue: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
  },
  projectMetricLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  projectProgressBar: {
    height: 4,
    backgroundColor: ConstructionTheme.colors.outline,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  projectProgressFill: {
    height: '100%',
  },
  projectStatus: {
    ...ConstructionTheme.typography.labelSmall,
    textAlign: 'center',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: ConstructionTheme.spacing.md,
    paddingBottom: ConstructionTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline,
  },
  quickActionButton: {
    alignItems: 'center',
    padding: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    minWidth: 80,
    minHeight: ConstructionTheme.dimensions.buttonMedium,
    justifyContent: 'center',
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  quickActionText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurface,
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

export default ProgressReportCard;