import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SupervisorDashboardResponse } from '../../types';
import ConstructionCard from '../common/ConstructionCard';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface TaskMetricsCardProps {
  taskMetrics: SupervisorDashboardResponse['taskMetrics'];
  isLoading: boolean;
}

const TaskMetricsCard: React.FC<TaskMetricsCardProps> = ({
  taskMetrics,
  isLoading,
}) => {
  const completionRate = taskMetrics.totalTasks > 0
    ? Math.round((taskMetrics.completedTasks / taskMetrics.totalTasks) * 100)
    : 0;

  return (
    <ConstructionCard
      title="Task Overview"
      icon="📋"
      isLoading={isLoading}
      style={styles.card}
    >
      <View style={styles.content}>
        {/* Total Tasks */}
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Total Tasks</Text>
          <Text style={styles.metricValue}>{taskMetrics.totalTasks}</Text>
        </View>

        {/* Task Status Breakdown */}
        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <View style={[styles.statusBar, styles.completedBar]}>
              <Text style={styles.statusCount}>{taskMetrics.completedTasks}</Text>
            </View>
            <Text style={styles.statusLabel}>Completed</Text>
          </View>

          <View style={styles.statusItem}>
            <View style={[styles.statusBar, styles.inProgressBar]}>
              <Text style={styles.statusCount}>{taskMetrics.inProgressTasks}</Text>
            </View>
            <Text style={styles.statusLabel}>In Progress</Text>
          </View>

          <View style={styles.statusItem}>
            <View style={[styles.statusBar, styles.queuedBar]}>
              <Text style={styles.statusCount}>{taskMetrics.queuedTasks}</Text>
            </View>
            <Text style={styles.statusLabel}>Queued</Text>
          </View>

          {taskMetrics.overdueTasks > 0 && (
            <View style={styles.statusItem}>
              <View style={[styles.statusBar, styles.overdueBar]}>
                <Text style={styles.statusCount}>{taskMetrics.overdueTasks}</Text>
              </View>
              <Text style={styles.statusLabel}>Overdue</Text>
            </View>
          )}
        </View>

        {/* Completion Rate */}
        <View style={styles.completionContainer}>
          <View style={styles.completionHeader}>
            <Text style={styles.completionLabel}>Completion Rate</Text>
            <Text style={styles.completionValue}>{completionRate}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${completionRate}%` }
              ]} 
            />
          </View>
        </View>
      </View>
    </ConstructionCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.md,
  },
  content: {
    padding: ConstructionTheme.spacing.sm,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline,
  },
  metricLabel: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
  },
  metricValue: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
  },
  statusContainer: {
    paddingVertical: ConstructionTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline,
  },
  statusItem: {
    marginBottom: ConstructionTheme.spacing.sm,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.sm,
    paddingHorizontal: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  completedBar: {
    backgroundColor: ConstructionTheme.colors.success,
  },
  inProgressBar: {
    backgroundColor: ConstructionTheme.colors.info,
  },
  queuedBar: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
  },
  overdueBar: {
    backgroundColor: ConstructionTheme.colors.error,
  },
  statusCount: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
    minWidth: 30,
  },
  statusLabel: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  completionContainer: {
    paddingTop: ConstructionTheme.spacing.md,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  completionLabel: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
  },
  completionValue: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: ConstructionTheme.colors.success,
    borderRadius: 6,
  },
});

export default TaskMetricsCard;
