// PerformanceMetricsCard Component - Display driver performance tracking and metrics
// Requirements: 8.1, 8.2, 8.3, 8.4, 8.5

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { DriverPerformance } from '../../types';
import { ConstructionButton, ConstructionCard } from '../common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface PerformanceMetricsCardProps {
  performance: DriverPerformance | null;
  onViewDetails: () => void;
  onViewHistory: () => void;
  isLoading: boolean;
}

const PerformanceMetricsCard: React.FC<PerformanceMetricsCardProps> = ({
  performance,
  onViewDetails,
  onViewHistory,
  isLoading,
}) => {
  // Get performance color based on value
  const getPerformanceColor = (value: number, thresholds: { good: number; fair: number }): string => {
    if (value >= thresholds.good) return ConstructionTheme.colors.success;
    if (value >= thresholds.fair) return ConstructionTheme.colors.warning;
    return ConstructionTheme.colors.error;
  };

  // Get rating color
  const getRatingColor = (rating: number): string => {
    if (rating >= 4.5) return ConstructionTheme.colors.success;
    if (rating >= 3.5) return ConstructionTheme.colors.warning;
    return ConstructionTheme.colors.error;
  };

  // Format distance
  const formatDistance = (distance: number): string => {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(1)}k km`;
    }
    return `${distance.toFixed(0)} km`;
  };

  // Format fuel efficiency
  const formatFuelEfficiency = (efficiency: number): string => {
    return `${efficiency.toFixed(1)} L/100km`;
  };

  // Render performance metric item
  const renderMetricItem = (
    title: string,
    value: string,
    subtitle: string,
    color: string,
    icon: string
  ) => {
    return (
      <View style={styles.metricItem}>
        <Text style={styles.metricIcon}>{icon}</Text>
        <View style={styles.metricContent}>
          <Text style={styles.metricTitle}>{title}</Text>
          <Text style={[styles.metricValue, { color }]}>{value}</Text>
          <Text style={styles.metricSubtitle}>{subtitle}</Text>
        </View>
      </View>
    );
  };

  // Render performance summary
  const renderPerformanceSummary = () => {
    if (!performance) return null;

    const onTimeColor = getPerformanceColor(performance.onTimePerformance, { good: 90, fair: 75 });
    const safetyColor = getPerformanceColor(performance.safetyScore, { good: 90, fair: 80 });
    const ratingColor = getRatingColor(performance.customerRating);

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          {renderMetricItem(
            'On-Time',
            `${performance.onTimePerformance.toFixed(1)}%`,
            'Punctuality',
            onTimeColor,
            '⏰'
          )}
          {renderMetricItem(
            'Safety Score',
            `${performance.safetyScore.toFixed(1)}`,
            'Out of 100',
            safetyColor,
            '🛡️'
          )}
        </View>
        <View style={styles.summaryRow}>
          {renderMetricItem(
            'Rating',
            `${performance.customerRating.toFixed(1)}⭐`,
            'Worker feedback',
            ratingColor,
            '⭐'
          )}
          {renderMetricItem(
            'Incidents',
            `${performance.incidentCount}`,
            'This month',
            performance.incidentCount === 0 ? ConstructionTheme.colors.success : ConstructionTheme.colors.error,
            '⚠️'
          )}
        </View>
      </View>
    );
  };

  // Render trip statistics
  const renderTripStatistics = () => {
    if (!performance) return null;

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>📊 Trip Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{performance.totalTripsCompleted}</Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDistance(performance.totalDistance)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatFuelEfficiency(performance.averageFuelEfficiency)}</Text>
            <Text style={styles.statLabel}>Fuel Usage</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render performance badges
  const renderPerformanceBadges = () => {
    if (!performance) return null;

    const badges = [];

    // On-time performance badge
    if (performance.onTimePerformance >= 95) {
      badges.push({
        title: 'Punctual Driver',
        subtitle: '95%+ on-time',
        icon: '🏆',
        color: ConstructionTheme.colors.success,
      });
    }

    // Safety badge
    if (performance.safetyScore >= 95 && performance.incidentCount === 0) {
      badges.push({
        title: 'Safety Champion',
        subtitle: 'Zero incidents',
        icon: '🛡️',
        color: ConstructionTheme.colors.success,
      });
    }

    // High rating badge
    if (performance.customerRating >= 4.5) {
      badges.push({
        title: 'Top Rated',
        subtitle: '4.5+ stars',
        icon: '⭐',
        color: ConstructionTheme.colors.success,
      });
    }

    // Fuel efficiency badge
    if (performance.averageFuelEfficiency <= 8.0) {
      badges.push({
        title: 'Eco Driver',
        subtitle: 'Fuel efficient',
        icon: '🌱',
        color: ConstructionTheme.colors.success,
      });
    }

    if (badges.length === 0) {
      return (
        <View style={styles.badgesContainer}>
          <Text style={styles.sectionTitle}>🏅 Achievements</Text>
          <Text style={styles.noBadgesText}>Keep up the good work to earn performance badges!</Text>
        </View>
      );
    }

    return (
      <View style={styles.badgesContainer}>
        <Text style={styles.sectionTitle}>🏅 Achievements</Text>
        <View style={styles.badgesList}>
          {badges.map((badge, index) => (
            <View key={index} style={[styles.badge, { borderLeftColor: badge.color }]}>
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
              <View style={styles.badgeContent}>
                <Text style={styles.badgeTitle}>{badge.title}</Text>
                <Text style={styles.badgeSubtitle}>{badge.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render action buttons
  const renderActionButtons = () => {
    return (
      <View style={styles.actionsContainer}>
        <ConstructionButton
          title="View Details"
          onPress={onViewDetails}
          variant="primary"
          size="medium"
          icon="📊"
          style={styles.actionButton}
        />
        <ConstructionButton
          title="Trip History"
          onPress={onViewHistory}
          variant="neutral"
          size="medium"
          icon="📋"
          style={styles.actionButton}
        />
      </View>
    );
  };

  if (isLoading) {
    return (
      <ConstructionCard
        variant="elevated"
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>📊 Loading performance metrics...</Text>
        </View>
      </ConstructionCard>
    );
  }

  if (!performance) {
    return (
      <ConstructionCard
        variant="outlined"
        style={styles.container}
      >
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>📊 No performance data</Text>
          <Text style={styles.noDataSubtext}>Complete some trips to see your performance metrics</Text>
        </View>
      </ConstructionCard>
    );
  }

  return (
    <ConstructionCard
      variant="elevated"
      style={styles.container}
    >
      <Text style={styles.cardTitle}>📊 Performance Metrics</Text>
      
      {/* Performance summary */}
      {renderPerformanceSummary()}

      {/* Trip statistics */}
      {renderTripStatistics()}

      {/* Performance badges */}
      {renderPerformanceBadges()}

      {/* Action buttons */}
      {renderActionButtons()}
    </ConstructionCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  cardTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.lg,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.xl,
  },
  loadingText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.xl,
  },
  noDataText: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  noDataSubtext: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  summaryContainer: {
    marginBottom: ConstructionTheme.spacing.lg,
    paddingBottom: ConstructionTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ConstructionTheme.spacing.md,
  },
  metricItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
    padding: ConstructionTheme.spacing.md,
    marginHorizontal: ConstructionTheme.spacing.xs,
  },
  metricIcon: {
    fontSize: ConstructionTheme.dimensions.iconLarge,
    marginRight: ConstructionTheme.spacing.md,
  },
  metricContent: {
    flex: 1,
  },
  metricTitle: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  metricValue: {
    ...ConstructionTheme.typography.headlineSmall,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricSubtitle: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  sectionTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.md,
  },
  statsContainer: {
    marginBottom: ConstructionTheme.spacing.lg,
    paddingBottom: ConstructionTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
    paddingVertical: ConstructionTheme.spacing.lg,
    paddingHorizontal: ConstructionTheme.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: ConstructionTheme.colors.outline,
    marginHorizontal: ConstructionTheme.spacing.md,
  },
  badgesContainer: {
    marginBottom: ConstructionTheme.spacing.lg,
    paddingBottom: ConstructionTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline,
  },
  noBadgesText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: ConstructionTheme.spacing.lg,
    fontStyle: 'italic',
  },
  badgesList: {
    gap: ConstructionTheme.spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ConstructionTheme.colors.surface,
    borderRadius: ConstructionTheme.borderRadius.sm,
    padding: ConstructionTheme.spacing.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
  },
  badgeIcon: {
    fontSize: ConstructionTheme.dimensions.iconLarge,
    marginRight: ConstructionTheme.spacing.md,
  },
  badgeContent: {
    flex: 1,
  },
  badgeTitle: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
    marginBottom: 2,
  },
  badgeSubtitle: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});

export default PerformanceMetricsCard;