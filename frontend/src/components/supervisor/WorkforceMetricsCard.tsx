import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SupervisorDashboardResponse } from '../../types';
import ConstructionCard from '../common/ConstructionCard';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface WorkforceMetricsCardProps {
  teamOverview: SupervisorDashboardResponse['teamOverview'];
  attendanceMetrics: SupervisorDashboardResponse['attendanceMetrics'];
  isLoading: boolean;
  highContrast?: boolean;
}

const WorkforceMetricsCard: React.FC<WorkforceMetricsCardProps> = React.memo(({
  teamOverview,
  attendanceMetrics,
  isLoading,
  highContrast = false,
}) => {
  return (
    <ConstructionCard
      title="Today's Workforce"
      icon="👥"
      isLoading={isLoading}
      style={[styles.card, highContrast && styles.highContrastCard]}
    >
      <View style={styles.content}>
        {/* Total Workforce */}
        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, highContrast && styles.highContrastText]}>
            Total Workforce
          </Text>
          <Text style={[styles.metricValue, highContrast && styles.highContrastPrimary]}>
            {teamOverview.totalMembers}
          </Text>
        </View>

        {/* Attendance Breakdown - Simple Count Only */}
        <View style={styles.breakdownContainer}>
          <View style={styles.breakdownItem}>
            <View style={[styles.statusDot, styles.presentDot]} />
            <Text style={[styles.breakdownLabel, highContrast && styles.highContrastText]}>
              Present
            </Text>
            <Text style={[styles.breakdownValue, highContrast && styles.highContrastText]}>
              {teamOverview.presentToday}
            </Text>
          </View>

          <View style={styles.breakdownItem}>
            <View style={[styles.statusDot, styles.absentDot]} />
            <Text style={[styles.breakdownLabel, highContrast && styles.highContrastText]}>
              Absent
            </Text>
            <Text style={[styles.breakdownValue, highContrast && styles.highContrastText]}>
              {teamOverview.absentToday}
            </Text>
          </View>

          <View style={styles.breakdownItem}>
            <View style={[styles.statusDot, styles.lateDot]} />
            <Text style={[styles.breakdownLabel, highContrast && styles.highContrastText]}>
              Late
            </Text>
            <Text style={[styles.breakdownValue, highContrast && styles.highContrastText]}>
              {teamOverview.lateToday}
            </Text>
          </View>

          <View style={styles.breakdownItem}>
            <View style={[styles.statusDot, styles.breakDot]} />
            <Text style={[styles.breakdownLabel, highContrast && styles.highContrastText]}>
              On Break
            </Text>
            <Text style={[styles.breakdownValue, highContrast && styles.highContrastText]}>
              {teamOverview.onBreak}
            </Text>
          </View>

          {teamOverview.overtimeWorkers > 0 && (
            <View style={styles.breakdownItem}>
              <View style={[styles.statusDot, styles.overtimeDot]} />
              <Text style={[styles.breakdownLabel, highContrast && styles.highContrastText]}>
                Overtime
              </Text>
              <Text style={[styles.breakdownValue, highContrast && styles.highContrastText]}>
                {teamOverview.overtimeWorkers}
              </Text>
            </View>
          )}
        </View>
      </View>
    </ConstructionCard>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for React.memo optimization
  return prevProps.teamOverview === nextProps.teamOverview &&
         prevProps.attendanceMetrics === nextProps.attendanceMetrics &&
         prevProps.isLoading === nextProps.isLoading &&
         prevProps.highContrast === nextProps.highContrast;
});

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
  breakdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: ConstructionTheme.spacing.md,
  },
  breakdownItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: ConstructionTheme.spacing.xs,
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
  breakDot: {
    backgroundColor: ConstructionTheme.colors.info,
  },
  overtimeDot: {
    backgroundColor: '#9C27B0', // Purple for overtime
  },
  breakdownLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  breakdownValue: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
  },
  highContrastCard: {
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  highContrastText: {
    color: '#FFFFFF',
  },
  highContrastPrimary: {
    color: '#FFA726',
  },
});

export default WorkforceMetricsCard;
