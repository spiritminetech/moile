// TripTrackingStatusBar - Visual indicator for active trip tracking
// Shows trip ID, start time, GPS status, and real-time updates

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { ConstructionCard } from '../common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface TripTrackingStatusBarProps {
  tripId?: number;
  tripStartTime?: Date;
  isGPSActive: boolean;
  gpsAccuracy?: number;
  lastLocationUpdate?: Date;
  isRouteDeviationMonitoring?: boolean;
  status: 'pending' | 'en_route_pickup' | 'pickup_complete' | 'en_route_dropoff' | 'completed';
}

const TripTrackingStatusBar: React.FC<TripTrackingStatusBarProps> = ({
  tripId,
  tripStartTime,
  isGPSActive,
  gpsAccuracy,
  lastLocationUpdate,
  isRouteDeviationMonitoring = false,
  status,
}) => {
  const [pulseAnim] = useState(new Animated.Value(1));
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  // Pulse animation for GPS indicator
  useEffect(() => {
    if (isGPSActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isGPSActive, pulseAnim]);

  // Calculate elapsed time
  useEffect(() => {
    if (!tripStartTime || status === 'completed') return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - tripStartTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [tripStartTime, status]);

  // Format time since last update
  const getTimeSinceLastUpdate = (): string => {
    if (!lastLocationUpdate) return 'Never';
    
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastLocationUpdate.getTime()) / 1000);
    
    if (diff < 10) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  // Get GPS accuracy status
  const getGPSAccuracyStatus = (): { text: string; color: string } => {
    if (!gpsAccuracy) return { text: 'Unknown', color: ConstructionTheme.colors.neutral };
    if (gpsAccuracy <= 10) return { text: 'Excellent', color: ConstructionTheme.colors.success };
    if (gpsAccuracy <= 30) return { text: 'Good', color: ConstructionTheme.colors.success };
    if (gpsAccuracy <= 50) return { text: 'Fair', color: ConstructionTheme.colors.warning };
    return { text: 'Poor', color: ConstructionTheme.colors.error };
  };

  // Don't show if trip hasn't started
  if (status === 'pending' || !tripStartTime) {
    return null;
  }

  const accuracyStatus = getGPSAccuracyStatus();

  return (
    <ConstructionCard variant="elevated" style={styles.container}>
      {/* Trip Info Header */}
      <View style={styles.header}>
        <View style={styles.tripInfo}>
          <Text style={styles.tripLabel}>Trip ID</Text>
          <Text style={styles.tripId}>#{tripId || 'N/A'}</Text>
        </View>
        <View style={styles.timeInfo}>
          <Text style={styles.timeLabel}>Trip Duration</Text>
          <Text style={styles.timeValue}>{elapsedTime}</Text>
        </View>
      </View>

      {/* Status Indicators */}
      <View style={styles.statusRow}>
        {/* GPS Status */}
        <View style={styles.statusItem}>
          <View style={styles.statusHeader}>
            <Animated.View style={[
              styles.indicator,
              { 
                backgroundColor: isGPSActive ? ConstructionTheme.colors.success : ConstructionTheme.colors.error,
                transform: [{ scale: isGPSActive ? pulseAnim : 1 }]
              }
            ]} />
            <Text style={styles.statusLabel}>GPS</Text>
          </View>
          <Text style={[styles.statusValue, { color: accuracyStatus.color }]}>
            {accuracyStatus.text}
          </Text>
          {gpsAccuracy && (
            <Text style={styles.statusSubtext}>±{Math.round(gpsAccuracy)}m</Text>
          )}
        </View>

        {/* Location Updates */}
        <View style={styles.statusItem}>
          <View style={styles.statusHeader}>
            <View style={[
              styles.indicator,
              { backgroundColor: ConstructionTheme.colors.info }
            ]} />
            <Text style={styles.statusLabel}>Updates</Text>
          </View>
          <Text style={styles.statusValue}>
            {getTimeSinceLastUpdate()}
          </Text>
          <Text style={styles.statusSubtext}>Last sync</Text>
        </View>

        {/* Route Monitoring */}
        <View style={styles.statusItem}>
          <View style={styles.statusHeader}>
            <View style={[
              styles.indicator,
              { backgroundColor: isRouteDeviationMonitoring ? ConstructionTheme.colors.secondary : ConstructionTheme.colors.neutral }
            ]} />
            <Text style={styles.statusLabel}>Monitor</Text>
          </View>
          <Text style={styles.statusValue}>
            {isRouteDeviationMonitoring ? 'Active' : 'Off'}
          </Text>
          <Text style={styles.statusSubtext}>Route track</Text>
        </View>
      </View>

      {/* Trip Start Time */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🕐 Started: {tripStartTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            hour12: true 
          })}
        </Text>
      </View>
    </ConstructionCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.primaryContainer,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ConstructionTheme.spacing.md,
    paddingBottom: ConstructionTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline + '40',
  },
  tripInfo: {
    flex: 1,
  },
  tripLabel: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onPrimaryContainer,
    opacity: 0.8,
    marginBottom: 4,
  },
  tripId: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onPrimaryContainer,
    fontWeight: '700',
  },
  timeInfo: {
    alignItems: 'flex-end',
  },
  timeLabel: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onPrimaryContainer,
    opacity: 0.8,
    marginBottom: 4,
  },
  timeValue: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onPrimaryContainer,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ConstructionTheme.spacing.md,
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: ConstructionTheme.spacing.xs,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusLabel: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onPrimaryContainer,
    fontWeight: '600',
  },
  statusValue: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onPrimaryContainer,
    fontWeight: '700',
    marginBottom: 2,
  },
  statusSubtext: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onPrimaryContainer,
    opacity: 0.7,
    fontSize: 10,
  },
  footer: {
    paddingTop: ConstructionTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline + '40',
  },
  footerText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onPrimaryContainer,
    textAlign: 'center',
    opacity: 0.9,
  },
});

export default TripTrackingStatusBar;
