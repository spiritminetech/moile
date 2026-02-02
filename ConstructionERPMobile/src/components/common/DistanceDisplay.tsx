// Distance Display component for showing distance from work site

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, UI_CONSTANTS } from '../../utils/constants';

interface DistanceDisplayProps {
  distance: number;
  isValid: boolean;
  showIcon?: boolean;
  compact?: boolean;
  threshold?: number; // Distance threshold for validation in meters
}

export const DistanceDisplay: React.FC<DistanceDisplayProps> = ({
  distance,
  isValid,
  showIcon = true,
  compact = false,
  threshold = 100,
}) => {
  const formatDistance = (distanceInMeters: number): string => {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)}m`;
    } else {
      return `${(distanceInMeters / 1000).toFixed(1)}km`;
    }
  };

  const getDistanceColor = (): string => {
    if (isValid) return COLORS.SUCCESS;
    if (distance <= threshold * 2) return COLORS.WARNING;
    return COLORS.ERROR;
  };

  const getDistanceIcon = (): string => {
    if (isValid) return '📍';
    if (distance <= threshold * 2) return '⚠️';
    return '🚫';
  };

  const getDistanceStatus = (): string => {
    if (isValid) return 'At work site';
    if (distance <= threshold * 2) return 'Near work site';
    return 'Far from work site';
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {showIcon && <Text style={styles.compactIcon}>{getDistanceIcon()}</Text>}
        <Text style={[styles.compactDistance, { color: getDistanceColor() }]}>
          {formatDistance(distance)}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderColor: getDistanceColor() }]}>
      <View style={styles.header}>
        {showIcon && <Text style={styles.icon}>{getDistanceIcon()}</Text>}
        <View style={styles.textContainer}>
          <Text style={styles.status}>{getDistanceStatus()}</Text>
          <Text style={[styles.distance, { color: getDistanceColor() }]}>
            {formatDistance(distance)} away
          </Text>
        </View>
      </View>

      {!isValid && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>To clock in/out:</Text>
          <Text style={styles.instructionsText}>
            Move closer to the work site (within {formatDistance(threshold)})
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
    padding: UI_CONSTANTS.SPACING.MD,
    marginVertical: UI_CONSTANTS.SPACING.SM,
    borderWidth: 2,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: UI_CONSTANTS.SPACING.SM,
    paddingVertical: UI_CONSTANTS.SPACING.XS,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginRight: UI_CONSTANTS.SPACING.SM,
  },
  compactIcon: {
    fontSize: 16,
    marginRight: UI_CONSTANTS.SPACING.XS,
  },
  textContainer: {
    flex: 1,
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  distance: {
    fontSize: 14,
    fontWeight: '500',
  },
  compactDistance: {
    fontSize: 14,
    fontWeight: '600',
  },
  instructionsContainer: {
    marginTop: UI_CONSTANTS.SPACING.SM,
    padding: UI_CONSTANTS.SPACING.SM,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },
  instructionsText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
});

export default DistanceDisplay;