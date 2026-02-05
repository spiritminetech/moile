// TripHistoryComponent - Performance review and trip history display
// Requirements: 11.1, 11.2, 11.3, 11.4, 11.5

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { TripRecord, DriverPerformance } from '../../types';
import { ConstructionButton, ConstructionCard, ConstructionSelector } from '../common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface TripHistoryComponentProps {
  tripHistory: TripRecord[];
  performanceMetrics: DriverPerformance;
  onTripSelect: (tripId: number) => void;
  onPerformanceRefresh: () => void;
  isLoading?: boolean;
}

type TimeFilter = 'today' | 'week' | 'month' | 'all';
type StatusFilter = 'all' | 'completed' | 'cancelled' | 'incident';

const TripHistoryComponent: React.FC<TripHistoryComponentProps> = ({
  tripHistory,
  performanceMetrics,
  onTripSelect,
  onPerformanceRefresh,
  isLoading = false,
}) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedTrip, setExpandedTrip] = useState<number | null>(null);

  // Filter options
  const timeFilterOptions = [
    { value: 'today', label: '📅 Today' },
    { value: 'week', label: '📅 This Week' },
    { value: 'month', label: '📅 This Month' },
    { value: 'all', label: '📅 All Time' },
  ];

  const statusFilterOptions = [
    { value: 'all', label: '📊 All Trips' },
    { value: 'completed', label: '✅ Completed' },
    { value: 'cancelled', label: '❌ Cancelled' },
    { value: 'incident', label: '🚨 Incident' },
  ];

  // Filter trips based on selected filters
  const getFilteredTrips = (): TripRecord[] => {
    let filtered = tripHistory;

    // Apply time filter
    const now = new Date();
    switch (timeFilter) {
      case 'today':
        filtered = filtered.filter(trip => {
          const tripDate = new Date(trip.date);
          return tripDate.toDateString() === now.toDateString();
        });
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(trip => new Date(trip.date) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(trip => new Date(trip.date) >= monthAgo);
        break;
      case 'all':
      default:
        // No time filtering
        break;
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trip => trip.status === statusFilter);
    }

    // Sort by date (most recent first)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Format duration
  const formatDuration = (startTime: Date, endTime: Date): string => {
    const duration = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Format distance
  const formatDistance = (distance: number): string => {
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  // Get status color
  const getStatusColor = (status: TripRecord['status']): string => {
    switch (status) {
      case 'completed':
        return ConstructionTheme.colors.success;
      case 'cancelled':
        return ConstructionTheme.colors.warning;
      case 'incident':
        return ConstructionTheme.colors.error;
      default:
        return ConstructionTheme.colors.onSurface;
    }
  };

  // Get status icon
  const getStatusIcon = (status: TripRecord['status']): string => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'cancelled':
        return '❌';
      case 'incident':
        return '🚨';
      default:
        return '📊';
    }
  };

  // Handle trip expansion
  const toggleTripExpansion = (tripId: number) => {
    setExpandedTrip(expandedTrip === tripId ? null : tripId);
  };

  // Handle trip selection
  const handleTripSelect = (tripId: number) => {
    Alert.alert(
      'Trip Details',
      'View detailed trip information?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View Details',
          onPress: () => onTripSelect(tripId),
        },
      ]
    );
  };

  const filteredTrips = getFilteredTrips();

  return (
    <ConstructionCard title="Trip History & Performance" variant="elevated">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Performance Metrics */}
        <View style={styles.performanceSection}>
          <View style={styles.performanceHeader}>
            <Text style={styles.sectionTitle}>📊 Performance Metrics</Text>
            <ConstructionButton
              title="🔄"
              onPress={onPerformanceRefresh}
              variant="outline"
              size="small"
              loading={isLoading}
            />
          </View>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {performanceMetrics.onTimePerformance.toFixed(1)}%
              </Text>
              <Text style={styles.metricLabel}>On-Time Performance</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {performanceMetrics.totalTripsCompleted}
              </Text>
              <Text style={styles.metricLabel}>Total Trips</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {formatDistance(performanceMetrics.totalDistance)}
              </Text>
              <Text style={styles.metricLabel}>Total Distance</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {performanceMetrics.averageFuelEfficiency.toFixed(1)}L/100km
              </Text>
              <Text style={styles.metricLabel}>Fuel Efficiency</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {performanceMetrics.safetyScore.toFixed(1)}/10
              </Text>
              <Text style={styles.metricLabel}>Safety Score</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {performanceMetrics.incidentCount}
              </Text>
              <Text style={styles.metricLabel}>Incidents</Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersSection}>
          <Text style={styles.sectionTitle}>🔍 Filter Trips</Text>
          <View style={styles.filtersRow}>
            <View style={styles.filterColumn}>
              <ConstructionSelector
                label="Time Period"
                value={timeFilter}
                onValueChange={(value) => setTimeFilter(value as TimeFilter)}
                options={timeFilterOptions}
                style={styles.filterSelector}
              />
            </View>
            <View style={styles.filterColumn}>
              <ConstructionSelector
                label="Status"
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                options={statusFilterOptions}
                style={styles.filterSelector}
              />
            </View>
          </View>
        </View>

        {/* Trip Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryText}>
            Showing {filteredTrips.length} trips
            {timeFilter !== 'all' && ` for ${timeFilter}`}
            {statusFilter !== 'all' && ` with status: ${statusFilter}`}
          </Text>
        </View>

        {/* Trip List */}
        <View style={styles.tripList}>
          <Text style={styles.sectionTitle}>🚌 Trip History</Text>
          {filteredTrips.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                📭 No trips found for the selected filters
              </Text>
            </View>
          ) : (
            filteredTrips.map((trip) => (
              <ConstructionCard
                key={trip.tripId}
                variant={trip.status === 'incident' ? 'error' : 
                        trip.status === 'cancelled' ? 'warning' : 'outlined'}
                style={styles.tripCard}
              >
                <TouchableOpacity
                  onPress={() => toggleTripExpansion(trip.tripId)}
                  style={styles.tripHeader}
                >
                  <View style={styles.tripMainInfo}>
                    <Text style={styles.tripRoute}>
                      {getStatusIcon(trip.status)} {trip.route}
                    </Text>
                    <Text style={styles.tripDate}>
                      📅 {new Date(trip.date).toLocaleDateString()}
                    </Text>
                    <Text style={styles.tripBasicInfo}>
                      👥 {trip.totalWorkers} workers | {formatDistance(trip.totalDistance)}
                    </Text>
                  </View>
                  <View style={styles.tripStatus}>
                    <Text style={[styles.tripStatusText, { color: getStatusColor(trip.status) }]}>
                      {trip.status.toUpperCase()}
                    </Text>
                    <Text style={styles.expandIcon}>
                      {expandedTrip === trip.tripId ? '▼' : '▶'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Expanded Trip Details */}
                {expandedTrip === trip.tripId && (
                  <View style={styles.tripDetails}>
                    <View style={styles.tripTimeline}>
                      <Text style={styles.detailsTitle}>⏱️ Timeline</Text>
                      <Text style={styles.timelineItem}>
                        🚌 Pickup: {trip.actualPickupTime.toLocaleTimeString()}
                      </Text>
                      <Text style={styles.timelineItem}>
                        🏗️ Dropoff: {trip.actualDropoffTime.toLocaleTimeString()}
                      </Text>
                      <Text style={styles.timelineItem}>
                        ⏱️ Duration: {formatDuration(trip.actualPickupTime, trip.actualDropoffTime)}
                      </Text>
                    </View>

                    <View style={styles.tripLocations}>
                      <Text style={styles.detailsTitle}>📍 Locations</Text>
                      <Text style={styles.locationItem}>
                        Pickups: {trip.pickupLocations.join(', ')}
                      </Text>
                      <Text style={styles.locationItem}>
                        Dropoff: {trip.dropoffLocation}
                      </Text>
                    </View>

                    <View style={styles.tripMetrics}>
                      <Text style={styles.detailsTitle}>📊 Trip Metrics</Text>
                      <Text style={styles.metricItem}>
                        ⛽ Fuel Used: {trip.fuelUsed.toFixed(1)}L
                      </Text>
                      <Text style={styles.metricItem}>
                        📏 Distance: {formatDistance(trip.totalDistance)}
                      </Text>
                      <Text style={styles.metricItem}>
                        ⚡ Efficiency: {((trip.fuelUsed / trip.totalDistance) * 100).toFixed(1)}L/100km
                      </Text>
                    </View>

                    {/* Delays */}
                    {trip.delays.length > 0 && (
                      <View style={styles.tripDelays}>
                        <Text style={styles.detailsTitle}>⏰ Delays</Text>
                        {trip.delays.map((delay, index) => (
                          <Text key={index} style={styles.delayItem}>
                            • {delay.reason}: {delay.duration}min at {delay.location}
                          </Text>
                        ))}
                      </View>
                    )}

                    <View style={styles.tripActions}>
                      <ConstructionButton
                        title="📋 View Full Details"
                        onPress={() => handleTripSelect(trip.tripId)}
                        variant="primary"
                        size="small"
                        style={styles.actionButton}
                      />
                    </View>
                  </View>
                )}
              </ConstructionCard>
            ))
          )}
        </View>
      </ScrollView>
    </ConstructionCard>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 600,
  },
  performanceSection: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.md,
  },
  sectionTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onBackground,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.primaryContainer,
    borderRadius: ConstructionTheme.borderRadius.md,
    marginBottom: ConstructionTheme.spacing.sm,
    alignItems: 'center',
  },
  metricValue: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.onPrimaryContainer,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  metricLabel: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onPrimaryContainer,
    textAlign: 'center',
  },
  filtersSection: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterColumn: {
    flex: 1,
    marginHorizontal: ConstructionTheme.spacing.xs,
  },
  filterSelector: {
    marginBottom: 0,
  },
  summarySection: {
    marginBottom: ConstructionTheme.spacing.md,
    padding: ConstructionTheme.spacing.sm,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  summaryText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  tripList: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  emptyState: {
    padding: ConstructionTheme.spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  tripCard: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripMainInfo: {
    flex: 1,
  },
  tripRoute: {
    ...ConstructionTheme.typography.titleMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  tripDate: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  tripBasicInfo: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  tripStatus: {
    alignItems: 'flex-end',
  },
  tripStatusText: {
    ...ConstructionTheme.typography.labelMedium,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  expandIcon: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  tripDetails: {
    marginTop: ConstructionTheme.spacing.md,
    paddingTop: ConstructionTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.neutral,
  },
  detailsTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
    fontWeight: 'bold',
  },
  tripTimeline: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  timelineItem: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  tripLocations: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  locationItem: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  tripMetrics: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  metricItem: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  tripDelays: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  delayItem: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.warning,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  tripActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    minWidth: 150,
  },
});

export default TripHistoryComponent;