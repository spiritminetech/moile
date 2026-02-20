// Time window status component for attendance controls
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { TimeValidator, TimeValidationResult } from '../../utils/timeValidation';
import { ConstructionCard } from '../common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface TimeWindowStatusProps {
  currentAction?: 'login' | 'lunch_start' | 'lunch_end' | 'logout';
  onValidationChange?: (isValid: boolean, result: TimeValidationResult) => void;
}

export const TimeWindowStatus: React.FC<TimeWindowStatusProps> = ({
  currentAction,
  onValidationChange,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [validationResult, setValidationResult] = useState<TimeValidationResult | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentAction) {
      validateCurrentAction();
    }
  }, [currentAction, currentTime]);

  const validateCurrentAction = () => {
    let result: TimeValidationResult;

    switch (currentAction) {
      case 'login':
        result = TimeValidator.validateMorningLogin();
        break;
      case 'lunch_start':
        result = TimeValidator.validateLunchTiming('start');
        break;
      case 'lunch_end':
        result = TimeValidator.validateLunchTiming('end');
        break;
      case 'logout':
        result = TimeValidator.validateEveningLogout();
        break;
      default:
        return;
    }

    setValidationResult(result);
    onValidationChange?.(result.canProceed, result);
  };

  const getStatusColor = () => {
    if (!validationResult) return ConstructionTheme.colors.onSurfaceVariant;
    
    if (!validationResult.canProceed) return ConstructionTheme.colors.error;
    if (validationResult.isGracePeriod) return ConstructionTheme.colors.warning;
    return ConstructionTheme.colors.success;
  };

  const getStatusIcon = () => {
    if (!validationResult) return '🕐';
    
    if (!validationResult.canProceed) return '🚫';
    if (validationResult.isGracePeriod) return '⚠️';
    return '✅';
  };

  const getActionLabel = () => {
    switch (currentAction) {
      case 'login':
        return 'Morning Login';
      case 'lunch_start':
        return 'Lunch Start';
      case 'lunch_end':
        return 'Lunch End';
      case 'logout':
        return 'Evening Logout';
      default:
        return 'Current Time';
    }
  };

  return (
    <ConstructionCard
      title="Time Window Status"
      variant="outlined"
      style={styles.statusCard}
    >
      <View style={styles.statusContent}>
        {/* Current Time Display */}
        <View style={styles.timeDisplay}>
          <Text style={styles.currentTime}>
            {TimeValidator.getCurrentTimeStatus()}
          </Text>
        </View>

        {/* Action Validation */}
        {currentAction && validationResult && (
          <View style={styles.validationSection}>
            <View style={styles.validationHeader}>
              <Text style={styles.validationIcon}>{getStatusIcon()}</Text>
              <View style={styles.validationContent}>
                <Text style={styles.actionLabel}>{getActionLabel()}</Text>
                <Text style={[
                  styles.validationMessage,
                  { color: getStatusColor() }
                ]}>
                  {validationResult.message}
                </Text>
              </View>
            </View>

            {validationResult.isGracePeriod && (
              <View style={styles.gracePeriodNotice}>
                <Text style={styles.gracePeriodText}>
                  ⏰ You are in the grace period. Action is allowed but will be marked as late.
                </Text>
              </View>
            )}

            {!validationResult.canProceed && (
              <View style={styles.restrictionNotice}>
                <Text style={styles.restrictionText}>
                  🚫 Action is not allowed at this time. Please wait for the appropriate time window.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Work Schedule Info */}
        <View style={styles.scheduleInfo}>
          <Text style={styles.scheduleTitle}>Today's Schedule</Text>
          <View style={styles.scheduleItem}>
            <Text style={styles.scheduleLabel}>Morning Login:</Text>
            <Text style={styles.scheduleValue}>Before 8:00 AM (Grace: 8:30 AM)</Text>
          </View>
          <View style={styles.scheduleItem}>
            <Text style={styles.scheduleLabel}>Lunch Break:</Text>
            <Text style={styles.scheduleValue}>12:00 PM - 1:00 PM</Text>
          </View>
          <View style={styles.scheduleItem}>
            <Text style={styles.scheduleLabel}>Evening Logout:</Text>
            <Text style={styles.scheduleValue}>5:00 PM (Extended: 7:00 PM)</Text>
          </View>
        </View>
      </View>
    </ConstructionCard>
  );
};

const styles = StyleSheet.create({
  statusCard: {
    marginVertical: ConstructionTheme.spacing.sm,
  },
  statusContent: {
    padding: ConstructionTheme.spacing.md,
  },
  timeDisplay: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
    padding: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.md,
    alignItems: 'center',
  },
  currentTime: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  validationSection: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  validationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  validationIcon: {
    fontSize: 20,
    marginRight: ConstructionTheme.spacing.md,
  },
  validationContent: {
    flex: 1,
  },
  actionLabel: {
    ...ConstructionTheme.typography.bodyLarge,
    fontWeight: '600',
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  validationMessage: {
    ...ConstructionTheme.typography.bodyMedium,
    lineHeight: 20,
  },
  gracePeriodNotice: {
    backgroundColor: '#FFF3CD',
    borderRadius: ConstructionTheme.borderRadius.sm,
    padding: ConstructionTheme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.warning,
  },
  gracePeriodText: {
    ...ConstructionTheme.typography.bodySmall,
    color: '#856404',
    lineHeight: 18,
  },
  restrictionNotice: {
    backgroundColor: '#F8D7DA',
    borderRadius: ConstructionTheme.borderRadius.sm,
    padding: ConstructionTheme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.error,
  },
  restrictionText: {
    ...ConstructionTheme.typography.bodySmall,
    color: '#721C24',
    lineHeight: 18,
  },
  scheduleInfo: {
    backgroundColor: ConstructionTheme.colors.surface,
    borderRadius: ConstructionTheme.borderRadius.sm,
    padding: ConstructionTheme.spacing.md,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
  },
  scheduleTitle: {
    ...ConstructionTheme.typography.bodyLarge,
    fontWeight: '600',
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.md,
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  scheduleLabel: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  scheduleValue: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
  },
});

export default TimeWindowStatus;