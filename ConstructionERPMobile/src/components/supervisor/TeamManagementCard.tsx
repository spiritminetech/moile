// TeamManagementCard Component - Workforce overview for supervisors
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SupervisorDashboardResponse } from '../../types';
import ConstructionCard from '../common/ConstructionCard';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface TeamManagementCardProps {
  projects: SupervisorDashboardResponse['projects'];
  isLoading: boolean;
  onViewTeamDetails?: (projectId: number) => void;
}

const TeamManagementCard: React.FC<TeamManagementCardProps> = ({
  projects,
  isLoading,
  onViewTeamDetails,
}) => {
  if (isLoading) {
    return (
      <ConstructionCard title="Team Management" variant="default">
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading team data...</Text>
        </View>
      </ConstructionCard>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <ConstructionCard title="Team Management" variant="default">
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No projects assigned</Text>
        </View>
      </ConstructionCard>
    );
  }

  const totalWorkforce = projects.reduce((sum, project) => sum + (project.workforceCount || 0), 0);
  const totalPresent = projects.reduce((sum, project) => sum + (project.attendanceSummary?.present || 0), 0);
  const totalAbsent = projects.reduce((sum, project) => sum + (project.attendanceSummary?.absent || 0), 0);
  const totalLate = projects.reduce((sum, project) => sum + (project.attendanceSummary?.late || 0), 0);

  return (
    <ConstructionCard title="Team Management" variant="default">
      {/* Overall Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalWorkforce}</Text>
            <Text style={styles.summaryLabel}>Total Team</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, styles.presentValue]}>{totalPresent}</Text>
            <Text style={styles.summaryLabel}>Present</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, styles.absentValue]}>{totalAbsent}</Text>
            <Text style={styles.summaryLabel}>Absent</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, styles.lateValue]}>{totalLate}</Text>
            <Text style={styles.summaryLabel}>Late</Text>
          </View>
        </View>
      </View>

      {/* Project Details */}
      <ScrollView 
        style={styles.projectsContainer} 
        contentContainerStyle={styles.projectsContent}
        showsVerticalScrollIndicator={false}
      >
        {projects.map((project, index) => (
          <TouchableOpacity
            key={`project-${project.id}-${index}`}
            style={styles.projectCard}
            onPress={() => onViewTeamDetails?.(project.id)}
            activeOpacity={0.7}
          >
            <View style={styles.projectHeader}>
              <Text style={styles.projectName} numberOfLines={1}>
                {project.name}
              </Text>
              <Text style={styles.workforceCount}>
                {project.workforceCount} workers
              </Text>
            </View>

            <View style={styles.attendanceRow}>
              <View style={styles.attendanceItem}>
                <View style={[styles.attendanceDot, styles.presentDot]} />
                <Text style={styles.attendanceText}>
                  {project.attendanceSummary?.present || 0} Present
                </Text>
              </View>
              <View style={styles.attendanceItem}>
                <View style={[styles.attendanceDot, styles.absentDot]} />
                <Text style={styles.attendanceText}>
                  {project.attendanceSummary?.absent || 0} Absent
                </Text>
              </View>
              <View style={styles.attendanceItem}>
                <View style={[styles.attendanceDot, styles.lateDot]} />
                <Text style={styles.attendanceText}>
                  {project.attendanceSummary?.late || 0} Late
                </Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>
                Progress: {project.progressSummary?.overallProgress || 0}%
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${project.progressSummary?.overallProgress || 0}%` }
                  ]} 
                />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* View All Button */}
      <TouchableOpacity 
        style={styles.viewAllButton}
        onPress={() => onViewTeamDetails?.(0)} // 0 indicates view all teams
      >
        <Text style={styles.viewAllText}>View All Team Details</Text>
      </TouchableOpacity>
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
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: ConstructionTheme.colors.outline,
  },
  summaryValue: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  presentValue: {
    color: ConstructionTheme.colors.success,
  },
  absentValue: {
    color: ConstructionTheme.colors.error,
  },
  lateValue: {
    color: ConstructionTheme.colors.warning,
  },
  summaryLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  projectsContainer: {
    maxHeight: 400, // Increased to show all 3 projects clearly without cutting off
    marginBottom: ConstructionTheme.spacing.md,
  },
  projectsContent: {
    paddingBottom: ConstructionTheme.spacing.sm, // Add padding to ensure last project is fully visible
  },
  projectCard: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
    padding: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.md, // Increased margin for better spacing
    minHeight: 100, // Increased minimum height to ensure all content is visible
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
  workforceCount: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.primary,
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  attendanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: ConstructionTheme.spacing.xs,
  },
  presentDot: {
    backgroundColor: ConstructionTheme.colors.success,
  },
  absentDot: {
    backgroundColor: ConstructionTheme.colors.error,
  },
  lateDot: {
    backgroundColor: ConstructionTheme.colors.warning,
  },
  attendanceText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  progressContainer: {
    marginTop: ConstructionTheme.spacing.xs,
  },
  progressLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  progressBar: {
    height: 4,
    backgroundColor: ConstructionTheme.colors.outline,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ConstructionTheme.colors.primary,
  },
  viewAllButton: {
    backgroundColor: ConstructionTheme.colors.primary,
    paddingVertical: ConstructionTheme.spacing.sm,
    paddingHorizontal: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    alignItems: 'center',
    minHeight: ConstructionTheme.dimensions.buttonMedium,
    justifyContent: 'center',
  },
  viewAllText: {
    ...ConstructionTheme.typography.buttonMedium,
    color: ConstructionTheme.colors.onPrimary,
  },
});

export default TeamManagementCard;