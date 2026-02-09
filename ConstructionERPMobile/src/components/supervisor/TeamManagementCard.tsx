// AssignedProjectsCard Component - Simple list of assigned projects
// Requirements: Dashboard - Assigned Projects

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SupervisorDashboardResponse } from '../../types';
import ConstructionCard from '../common/ConstructionCard';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface TeamManagementCardProps {
  projects: SupervisorDashboardResponse['projects'];
  isLoading: boolean;
  onViewTeamDetails?: (projectId: number) => void;
  highContrast?: boolean;
}

const TeamManagementCard: React.FC<TeamManagementCardProps> = ({
  projects,
  isLoading,
  onViewTeamDetails,
  highContrast = false,
}) => {
  if (isLoading) {
    return (
      <ConstructionCard 
        title="Assigned Projects" 
        icon="📍"
        isLoading={isLoading}
        style={[styles.card, highContrast && styles.highContrastCard]}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, highContrast && styles.highContrastText]}>
            Loading projects...
          </Text>
        </View>
      </ConstructionCard>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <ConstructionCard 
        title="Assigned Projects" 
        icon="📍"
        style={[styles.card, highContrast && styles.highContrastCard]}
      >
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, highContrast && styles.highContrastText]}>
            No projects assigned
          </Text>
        </View>
      </ConstructionCard>
    );
  }

  return (
    <ConstructionCard 
      title="Assigned Projects" 
      icon="📍"
      style={[styles.card, highContrast && styles.highContrastCard]}
    >
      <View style={styles.content}>
        {/* Simple Project List */}
        <ScrollView 
          style={styles.projectsContainer} 
          contentContainerStyle={styles.projectsContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {projects.map((project, index) => (
            <TouchableOpacity
              key={`project-${project.id}-${index}`}
              style={[styles.projectCard, highContrast && styles.highContrastProjectCard]}
              onPress={() => onViewTeamDetails?.(project.id)}
              activeOpacity={0.7}
            >
              <View style={styles.projectHeader}>
                <View style={styles.projectInfo}>
                  <Text style={[styles.projectName, highContrast && styles.highContrastText]} numberOfLines={2}>
                    {project.name}
                  </Text>
                  {project.location && (
                    <Text style={[styles.projectLocation, highContrast && styles.highContrastText]} numberOfLines={1}>
                      📍 {project.location}
                    </Text>
                  )}
                  {project.client && (
                    <Text style={[styles.projectClient, highContrast && styles.highContrastText]} numberOfLines={1}>
                      👤 {project.client}
                    </Text>
                  )}
                </View>
                <View style={styles.projectMeta}>
                  <Text style={[styles.workforceCount, highContrast && styles.highContrastPrimary]}>
                    {project.workforceCount} workers
                  </Text>
                  {project.status && (
                    <View style={[
                      styles.statusBadge, 
                      styles[`status_${project.status.toLowerCase().replace(' ', '_')}`]
                    ]}>
                      <Text style={styles.statusText}>
                        {project.status}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
  projectsContainer: {
    maxHeight: 300,
  },
  projectsContent: {
    paddingBottom: ConstructionTheme.spacing.xs,
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
    alignItems: 'flex-start',
  },
  projectInfo: {
    flex: 1,
    marginRight: ConstructionTheme.spacing.sm,
  },
  projectMeta: {
    alignItems: 'flex-end',
  },
  projectName: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  projectLocation: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  projectClient: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  workforceCount: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: 4,
    borderRadius: ConstructionTheme.borderRadius.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  status_ongoing: {
    backgroundColor: ConstructionTheme.colors.info,
  },
  status_near_completion: {
    backgroundColor: ConstructionTheme.colors.success,
  },
  status_delayed: {
    backgroundColor: ConstructionTheme.colors.error,
  },
  statusText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
    fontSize: 10,
  },
  highContrastCard: {
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  highContrastProjectCard: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  highContrastText: {
    color: '#FFFFFF',
  },
  highContrastPrimary: {
    color: '#FFA726',
  },
});

export default TeamManagementCard;