// GPS Accuracy Indicator component for displaying GPS signal quality

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GPSAccuracyWarning } from '../../types';
import { COLORS, UI_CONSTANTS } from '../../utils/constants';

interface GPSAccuracyIndicatorProps {
  accuracyWarning: GPSAccuracyWarning | null;
  showDetails?: boolean;
  compact?: boolean;
}

export const GPSAccuracyIndicator: React.FC<GPSAccuracyIndicatorProps> = ({
  accuracyWarning,
  showDetails = true,
  compact = false,
}) => {
  if (!accuracyWarning) {
    return null;
  }

  const getAccuracyLevel = (): 'excellent' | 'good' | 'fair' | 'poor' => {
    const accuracy = accuracyWarning.currentAccuracy;
    if (accuracy <= 5) return 'excellent';
    if (accuracy <= 10) return 'good';
    if (accuracy <= 20) return 'fair';
    return 'poor';
  };

  const getAccuracyColor = (): string => {
    const level = getAccuracyLevel();
    switch (level) {
      case 'excellent':
        return COLORS.SUCCESS;
      case 'good':
        return COLORS.SUCCESS;
      case 'fair':
        return COLORS.WARNING;
      case 'poor':
        return COLORS.ERROR;
      default:
        return COLORS.TEXT_SECONDARY;
    }
  };

  const getAccuracyIcon = (): string => {
    const level = getAccuracyLevel();
    switch (level) {
      case 'excellent':
        return '📶';
      case 'good':
        return '📶';
      case 'fair':
        return '📶';
      case 'poor':
        return '📵';
      default:
        return '❓';
    }
  };

  const getAccuracyText = (): string => {
    const level = getAccuracyLevel();
    switch (level) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'fair':
        return 'Fair';
      case 'poor':
        return 'Poor';
      default:
        return 'Unknown';
    }
  };

  if (compact) {
    return (
      <View style={[styles.compactContainer, { borderColor: getAccuracyColor() }]}>
        <Text style={styles.compactIcon}>{getAccuracyIcon()}</Text>
        <Text style={[styles.compactText, { color: getAccuracyColor() }]}>
          ±{Math.round(accuracyWarning.currentAccuracy)}m
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderColor: getAccuracyColor() }]}>
      <View style={styles.header}>
        <Text style={styles.icon}>{getAccuracyIcon()}</Text>
        <Text style={styles.title}>GPS Signal</Text>
        <Text style={[styles.status, { color: getAccuracyColor() }]}>
          {getAccuracyText()}
        </Text>
      </View>

      {showDetails && (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Current Accuracy:</Text>
            <Text style={[styles.detailValue, { color: getAccuracyColor() }]}>
              ±{Math.round(accuracyWarning.currentAccuracy)} meters
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Required Accuracy:</Text>
            <Text style={styles.detailValue}>
              ±{accuracyWarning.requiredAccuracy} meters
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Can Proceed:</Text>
            <Text style={[
              styles.detailValue,
              { color: accuracyWarning.canProceed ? COLORS.SUCCESS : COLORS.ERROR }
            ]}>
              {accuracyWarning.canProceed ? 'Yes ✓' : 'No ✗'}
            </Text>
          </View>

          {accuracyWarning.message && (
            <View style={styles.messageContainer}>
              <Text style={[styles.messageText, { color: getAccuracyColor() }]}>
                {accuracyWarning.message}
              </Text>
            </View>
          )}

          {!accuracyWarning.isAccurate && (
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>💡 Tips to improve GPS accuracy:</Text>
              <Text style={styles.tipText}>• Move to an open area away from buildings</Text>
              <Text style={styles.tipText}>• Ensure clear view of the sky</Text>
              <Text style={styles.tipText}>• Wait a few moments for signal to improve</Text>
              <Text style={styles.tipText}>• Restart location services if needed</Text>
            </View>
          )}
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
    backgroundColor: COLORS.SURFACE,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS / 2,
    paddingHorizontal: UI_CONSTANTS.SPACING.SM,
    paddingVertical: UI_CONSTANTS.SPACING.XS,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },
  icon: {
    fontSize: 20,
    marginRight: UI_CONSTANTS.SPACING.SM,
  },
  compactIcon: {
    fontSize: 16,
    marginRight: UI_CONSTANTS.SPACING.XS,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
  },
  compactText: {
    fontSize: 12,
    fontWeight: '600',
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    paddingTop: UI_CONSTANTS.SPACING.SM,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  messageContainer: {
    marginTop: UI_CONSTANTS.SPACING.SM,
    padding: UI_CONSTANTS.SPACING.SM,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
  },
  messageText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  tipsContainer: {
    marginTop: UI_CONSTANTS.SPACING.SM,
    padding: UI_CONSTANTS.SPACING.SM,
    backgroundColor: '#E3F2FD',
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },
  tipText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 2,
  },
});

export default GPSAccuracyIndicator;