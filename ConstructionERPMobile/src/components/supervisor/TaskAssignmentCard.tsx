// TaskAssignmentCard Component - Task management interface for supervisors
// Requirements: 2.3, 4.1, 4.2, 4.3, 4.4, 4.5

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

interface TaskAssignmentCardProps {
  projects: SupervisorDashboardResponse['projects'];
  isLoading: boolean;
  onCreateTask?: () => void;
  onViewTaskDetails?: (projectId: number) => void;
  onAssignTask?: (projectId: number) => void;
}

const TaskAssignmentCard: React.FC<TaskAssignmentCardProps> = ({
  projects,
  isLoading,
  onCreateTask,
  onViewTaskDetails,
  onAssignTask,
}) => {
  if (isLoading) {
    return (
      <ConstructionCard title="Task Assignment" variant="default">
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading task data...</Text>
        </View>
      </ConstructionCard>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <ConstructionCard title="Task Assignment" variant="default">
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No projects available</Text>
          <TouchableOpacity style={styles.createTaskButton} onPress={onCreateTask}>
            <Text style={styles.createTaskButtonText}>Create New Task</Text>
          </TouchableOpacity>
        </View>
      </ConstructionCard>
    );
  }

  // Calculate overall task metrics
  const totalTasks = projects.reduce((sum, project) => sum + (project.progressSummary?.totalTasks || 0), 0);
  const completedTasks = projects.reduce((sum, project) => sum + (project.progressSummary?.completedTasks || 0), 0);
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <ConstructionCard title="Task Assignment" variant="default">
      {/* Overall Task Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.progressCircleContainer}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressValue}>{overallProgress}%</Text>
            <Text style={styles.progressLabel}>Complete</Text>
          </View>
        </View>
        
        <View style={styles.taskMetrics}>
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{totalTasks}</Text>
              <Text style={styles.metricLabel}>Total Tasks</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, styles.completedValue]}>{completedTasks}</Text>
              <Text style={styles.metricLabel}>Completed</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, styles.pendingValue]}>{totalTasks - completedTasks}</Text>
              <Text style={styles.metricLabel}>Pending</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity style={styles.quickActionButton} onPress={onCreateTask}>
          <Text style={styles.quickActionIcon}>➕</Text>
          <Text style={styles.quickActionText}>New Task</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickActionButton} 
          onPress={() => onAssignTask?.(0)} // 0 indicates bulk assignment
        >
          <Text style={styles.quickActionIcon}>👥</Text>
          <Text style={styles.quickActionText}>Assign Tasks</Text>
        </TouchableOpacity>
      </View>

      {/* Project Task Breakdown */}
      <View style={styles.projectsContainer}>
        <Text style={styles.projectsTitle}>Project Tasks</Text>
        <ScrollView style={styles.projectsList} showsVerticalScrollIndicator={false}>
          {projects.map((project, index) => {
            const projectProgress = (project.progressSummary?.totalTasks || 0) > 0 
              ? Math.round(((project.progressSummary?.completedTasks || 0) / (project.progressSummary?.totalTasks || 1)) * 100)
              : 0;
            
            const dailyTargetProgress = (project.progressSummary?.dailyTarget || 0) > 0
              ? Math.round(((project.progressSummary?.completedTasks || 0) / (project.progressSummary?.dailyTarget || 1)) * 100)
              : 0;

            return (
              <TouchableOpacity
                key={`task-project-${project.id}-${index}`}
                style={styles.projectCard}
                onPress={() => onViewTaskDetails?.(project.id)}
                activeOpacity={0.7}
              >
                <View style={styles.projectHeader}>
                  <Text style={styles.projectName} numberOfLines={1}>
                    {project.name}
                  </Text>
                  <View style={styles.projectActions}>
                    <TouchableOpacity
                      style={styles.assignButton}
                      onPress={() => onAssignTask?.(project.id)}
                    >
                      <Text style={styles.assignButtonText}>Assign</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.taskStats}>
                  <View style={styles.taskStatItem}>
                    <Text style={styles.taskStatValue}>
                      {project.progressSummary?.completedTasks || 0}/{project.progressSummary?.totalTasks || 0}
                    </Text>
                    <Text style={styles.taskStatLabel}>Tasks</Text>
                  </View>
                  <View style={styles.taskStatItem}>
                    <Text style={[
                      styles.taskStatValue,
                      dailyTargetProgress >= 100 ? styles.onTrackValue : styles.behindValue
                    ]}>
                      {dailyTargetProgress}%
                    </Text>
                    <Text style={styles.taskStatLabel}>Daily Target</Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${projectProgress}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>{projectProgress}%</Text>
                  </View>
                </View>

                {/* Task Priority Indicators */}
                <View style={styles.priorityIndicators}>
                  <View style={styles.priorityItem}>
                    <View style={[styles.priorityDot, styles.highPriorityDot]} />
                    <Text style={styles.priorityText}>High Priority</Text>
                  </View>
                  <View style={styles.priorityItem}>
                    <View style={[styles.priorityDot, styles.normalPriorityDot]} />
                    <Text style={styles.priorityText}>Normal</Text>
                  </View>
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
          onPress={() => onViewTaskDetails?.(0)} // 0 indicates view all
        >
          <Text style={styles.actionButtonText}>View All Tasks</Text>
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
  createTaskButton: {
    backgroundColor: ConstructionTheme.colors.primary,
    paddingVertical: ConstructionTheme.spacing.sm,
    paddingHorizontal: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    minHeight: ConstructionTheme.dimensions.buttonMedium,
    justifyContent: 'center',
  },
  createTaskButtonText: {
    ...ConstructionTheme.typography.buttonMedium,
    color: ConstructionTheme.colors.onPrimary,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.md,
  },
  progressCircleContainer: {
    marginRight: ConstructionTheme.spacing.lg,
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: ConstructionTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
  },
  progressValue: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
  },
  progressLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  taskMetrics: {
    flex: 1,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  completedValue: {
    color: ConstructionTheme.colors.success,
  },
  pendingValue: {
    color: ConstructionTheme.colors.warning,
  },
  metricLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
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
  projectActions: {
    flexDirection: 'row',
  },
  assignButton: {
    backgroundColor: ConstructionTheme.colors.secondary,
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: ConstructionTheme.spacing.xs,
    borderRadius: ConstructionTheme.borderRadius.sm,
    minHeight: 32,
    justifyContent: 'center',
  },
  assignButtonText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSecondary,
    fontWeight: 'bold',
  },
  taskStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  taskStatItem: {
    alignItems: 'center',
  },
  taskStatValue: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
  },
  onTrackValue: {
    color: ConstructionTheme.colors.success,
  },
  behindValue: {
    color: ConstructionTheme.colors.error,
  },
  taskStatLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  progressContainer: {
    marginBottom: ConstructionTheme.spacing.sm,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: ConstructionTheme.colors.outline,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: ConstructionTheme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: ConstructionTheme.colors.primary,
  },
  progressText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    minWidth: 35,
  },
  priorityIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: ConstructionTheme.spacing.xs,
  },
  highPriorityDot: {
    backgroundColor: ConstructionTheme.colors.error,
  },
  normalPriorityDot: {
    backgroundColor: ConstructionTheme.colors.info,
  },
  priorityText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
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

export default TaskAssignmentCard;