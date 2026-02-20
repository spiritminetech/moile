import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SupervisorDashboardResponse } from '../../types';
import ConstructionCard from '../common/ConstructionCard';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface RecentActivityCardProps {
  recentActivity: SupervisorDashboardResponse['recentActivity'];
  isLoading: boolean;
}

const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  recentActivity,
  isLoading,
}) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_completed':
        return '✅';
      case 'task_assigned':
        return '📌';
      default:
        return '📋';
    }
  };

  return (
    <ConstructionCard
      title="Recent Activity"
      icon="🕐"
      isLoading={isLoading}
      style={styles.card}
    >
      <View style={styles.content}>
        {recentActivity.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recent activity</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.activityList}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {recentActivity.slice(0, 5).map((activity, index) => (
              <View key={`activity-${activity.id}-${index}`} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Text style={styles.activityIconText}>
                    {getActivityIcon(activity.type)}
                  </Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityMessage}>{activity.message}</Text>
                  <View style={styles.activityMeta}>
                    <Text style={styles.activityProject}>{activity.projectName}</Text>
                    <Text style={styles.activityTime}>{formatTime(activity.timestamp)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
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
  emptyContainer: {
    paddingVertical: ConstructionTheme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  activityList: {
    maxHeight: 300,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: ConstructionTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ConstructionTheme.spacing.sm,
  },
  activityIconText: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  activityMessage: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityProject: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.primary,
  },
  activityTime: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
});

export default RecentActivityCard;
