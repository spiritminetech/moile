// TripTrackingStatusCard - Shows active trip tracking status with visual indicators
// Displays trip ID, start time, GPS status, and background service indicators

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { TransportTask, GeoLocation } from '../../types';
import { ConstructionCard } from '../common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface TripTrackingStatusCardProps {
  task: TransportTask | null;
  currentLocation: GeoLocation | null;
  isLocationTracking: boolean;
  lastLocationUpdate?: Date;
  tripStartTime?: Date;
  tripLogId?: string;
}

const TripTrackingStatusCard: React.FC<TripTrackingStatusCardProps> = ({
  task,
  currentLocation,
  isLocationTracking,
  lastLocationUpdate,
  tripStartTime,
  tripLogId,
}) => {
  const [pulseAnim] = useState(new Animated.Value(1));

  // Pulse animation for active tracking indicator
  useEffect(() => {
    if (isLocationTracking) {
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
  }, [isLocationTracking, pulseAnim]);

  // Don't show if no active task, task is pending/completed, or tracking hasn't started
  if (!task || task.status === 'pending' || task.status === 'completed' || !tripStartTime) {
    return null;
  }

  // Format time
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  // Calculate elapsed time
  const getElapsedTime = (): string => {
    if (!tripStartTime) return '00:00:00';
    const now = new Date();
    const diff = now.getTime() - tripStartTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get GPS accuracy status
  const getGPSAccuracyStatus = (): { text: string; color: string; icon: string } => {
    if (!currentLocation) {
      return { text: 'No Signal', color: ConstructionTheme.colors.error, icon: '📡' };
    }
    const accuracy = currentLocation.accuracy;
    if (accuracy <= 10) {
      return { text: 'Excellent', color: ConstructionTheme.colors.success, icon: '🟢' };
    } else if (accuracy <= 30) {
      return { text: 'Good', color: ConstructionTheme.colors.success, icon: '🟢' };
    } else if (accuracy <= 50) {
      return { text: 'Fair', color: ConstructionTheme.colors.warning, icon: '🟡' };
    } else {
      return { text: 'Poor', color: ConstructionTheme.colors.error, icon: '🔴' };
    }
  };

  const gpsStatus = getGPSAccuracyStatus();

  return (
    <ConstructionCard variant="elevated" style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🚛 Active Trip Tracking</Text>
        <Animated.View style={[styles.trackingIndicator, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.trackingDot, isLocationTracking && styles.trackingDotActive]} />
        </Animated.View>
      </View>

      {/* Trip Information */}
      <View style={styles.infoSection}>
        {/* Trip Log ID */}
        {tripLogId && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Trip ID:</Text>
            <Text style={styles.infoValue}>{tripLogId}</Text>
          </View>
        )}

        {/* Start Time */}
        {tripStartTime && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Started:</Text>
            <Text style={styles.infoValue}>{formatTime(tripStartTime)}</Text>
          </View>
        )}

        {/* Elapsed Time */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Duration:</Text>
          <Text style={styles.infoValueHighlight}>{getElapsedTime()}</Text>
        </View>

        {/* Route Name */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Route:</Text>
          <Text style={styles.infoValue}>{task.route}</Text>
        </View>
      </View>

      {/* GPS Status Section */}
      <View style={styles.gpsSection}>
        <View style={styles.gpsSectionHeader}>
          <Text style={styles.gpsSectionTitle}>📍 GPS Status</Text>
          {lastLocationUpdate && (
            <Text style={styles.lastUpdateText}>
              Updated {Math.floor((new Date().getTime() - lastLocationUpdate.getTime()) / 1000)}s ago
            </Text>
          )}
        </View>

        <View style={styles.gpsStatusGrid}>
          {/* GPS Accuracy */}
          <View style={styles.gpsStatusItem}>
            <Text style={styles.gpsStatusIcon}>{gpsStatus.icon}</Text>
            <Text style={[styles.gpsStatusText, { color: gpsStatus.color }]}>
              {gpsStatus.text}
            </Text>
            <Text style={styles.gpsStatusLabel}>
              {currentLocation ? `${Math.round(currentLocation.accuracy)}m` : 'N/A'}
            </Text>
          </View>

          {/* Location Tracking */}
          <View style={styles.gpsStatusItem}>
            <Text style={styles.gpsStatusIcon}>
              {isLocationTracking ? '✅' : '⏸️'}
            </Text>
            <Text style={[styles.gpsStatusText, { 
              color: isLocationTracking ? ConstructionTheme.colors.success : ConstructionTheme.colors.warning 
            }]}>
              {isLocationTracking ? 'Active' : 'Paused'}
            </Text>
            <Text style={styles.gpsStatusLabel}>Tracking</Text>
          </View>

          {/* Coordinates */}
          <View style={styles.gpsStatusItem}>
            <Text style={styles.gpsStatusIcon}>🌐</Text>
            <Text style={styles.gpsStatusText}>
              {currentLocation ? 'Available' : 'Waiting'}
            </Text>
            <Text style={styles.gpsStatusLabel}>Location</Text>
          </View>
        </View>

        {/* Current Coordinates */}
        {currentLocation && (
          <View style={styles.coordinatesBox}>
            <Text style={styles.coordinatesText}>
              📍 {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </Text>
          </View>
        )}
      </View>

      {/* Background Services Status */}
      <View style={styles.servicesSection}>
        <Text style={styles.servicesSectionTitle}>⚙️ Background Services</Text>
        <View style={styles.servicesGrid}>
          <View style={styles.serviceItem}>
            <View style={[styles.serviceIndicator, styles.serviceActive]} />
            <Text style={styles.serviceText}>Location Updates</Text>
          </View>
          <View style={styles.serviceItem}>
            <View style={[styles.serviceIndicator, styles.serviceActive]} />
            <Text style={styles.serviceText}>Route Monitoring</Text>
          </View>
          <View style={styles.serviceItem}>
            <View style={[styles.serviceIndicator, styles.serviceActive]} />
            <Text style={styles.serviceText}>Trip Logging</Text>
          </View>
        </View>
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
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.lg,
    paddingBottom: ConstructionTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline,
  },
  title: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onPrimaryContainer,
    fontWeight: '700',
  },
  trackingIndicator: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackingDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ConstructionTheme.colors.outline,
  },
  trackingDotActive: {
    backgroundColor: ConstructionTheme.colors.success,
    shadowColor: ConstructionTheme.colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  infoSection: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline + '40',
  },
  infoLabel: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onPrimaryContainer,
    fontWeight: '500',
  },
  infoValue: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onPrimaryContainer,
    fontWeight: '600',
  },
  infoValueHighlight: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.primary,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  gpsSection: {
    marginBottom: ConstructionTheme.spacing.lg,
    backgroundColor: ConstructionTheme.colors.surface,
    borderRadius: ConstructionTheme.borderRadius.md,
    padding: ConstructionTheme.spacing.md,
  },
  gpsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.md,
  },
  gpsSectionTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
  },
  lastUpdateText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  gpsStatusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ConstructionTheme.spacing.md,
  },
  gpsStatusItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.sm,
  },
  gpsStatusIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  gpsStatusText: {
    ...ConstructionTheme.typography.bodyMedium,
    fontWeight: '600',
    marginBottom: 2,
  },
  gpsStatusLabel: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  coordinatesBox: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    padding: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    alignItems: 'center',
  },
  coordinatesText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontFamily: 'monospace',
  },
  servicesSection: {
    backgroundColor: ConstructionTheme.colors.surface,
    borderRadius: ConstructionTheme.borderRadius.md,
    padding: ConstructionTheme.spacing.md,
  },
  servicesSectionTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
    marginBottom: ConstructionTheme.spacing.md,
  },
  servicesGrid: {
    gap: ConstructionTheme.spacing.sm,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.xs,
  },
  serviceIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: ConstructionTheme.spacing.sm,
  },
  serviceActive: {
    backgroundColor: ConstructionTheme.colors.success,
  },
  serviceInactive: {
    backgroundColor: ConstructionTheme.colors.outline,
  },
  serviceText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
  },
});

export default TripTrackingStatusCard;
