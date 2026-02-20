// Forgotten checkout alert component
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { TimeValidator } from '../../utils/timeValidation';
import { ConstructionButton, ConstructionCard } from '../common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface ForgottenCheckoutAlertProps {
  checkInTime: string;
  onRequestRegularization: () => void;
  onForceCheckout: () => void;
}

export const ForgottenCheckoutAlert: React.FC<ForgottenCheckoutAlertProps> = ({
  checkInTime,
  onRequestRegularization,
  onForceCheckout,
}) => {
  const checkoutStatus = TimeValidator.checkForForgottenCheckout(checkInTime);

  if (!checkoutStatus.requiresRegularization) {
    return null;
  }

  const handleRegularizationRequest = () => {
    Alert.alert(
      'Request Regularization',
      'This will send a request to your supervisor to regularize your checkout time. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Request', onPress: onRequestRegularization },
      ]
    );
  };

  const handleForceCheckout = () => {
    Alert.alert(
      'Force Checkout',
      'This will check you out immediately. Your supervisor may need to review this action. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Checkout Now', onPress: onForceCheckout, style: 'destructive' },
      ]
    );
  };

  const getAlertVariant = () => {
    if (checkoutStatus.isForgotten) return 'error';
    if (checkoutStatus.requiresRegularization) return 'warning';
    return 'default';
  };

  const getAlertIcon = () => {
    if (checkoutStatus.isForgotten) return '🚨';
    if (checkoutStatus.requiresRegularization) return '⚠️';
    return 'ℹ️';
  };

  return (
    <ConstructionCard
      title="Long Work Session Alert"
      variant="outlined"
      style={[
        styles.alertCard,
        {
          borderColor: checkoutStatus.isForgotten 
            ? ConstructionTheme.colors.error 
            : ConstructionTheme.colors.warning
        }
      ]}
    >
      <View style={styles.alertContent}>
        <View style={styles.alertHeader}>
          <Text style={styles.alertIcon}>{getAlertIcon()}</Text>
          <View style={styles.alertTextContainer}>
            <Text style={[
              styles.alertTitle,
              {
                color: checkoutStatus.isForgotten 
                  ? ConstructionTheme.colors.error 
                  : ConstructionTheme.colors.warning
              }
            ]}>
              {checkoutStatus.isForgotten ? 'Forgotten Checkout Detected' : 'Long Work Session'}
            </Text>
            <Text style={styles.alertMessage}>
              {checkoutStatus.message}
            </Text>
          </View>
        </View>

        <View style={styles.sessionDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Checked in at:</Text>
            <Text style={styles.detailValue}>
              {new Date(checkInTime).toLocaleString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={[
              styles.detailValue,
              {
                color: checkoutStatus.isForgotten 
                  ? ConstructionTheme.colors.error 
                  : ConstructionTheme.colors.warning,
                fontWeight: 'bold',
              }
            ]}>
              {Math.floor(checkoutStatus.hoursCheckedIn)} hours {Math.floor((checkoutStatus.hoursCheckedIn % 1) * 60)} minutes
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <ConstructionButton
            title="Request Regularization"
            onPress={handleRegularizationRequest}
            variant="secondary"
            size="medium"
            style={styles.actionButton}
          />
          <ConstructionButton
            title="Checkout Now"
            onPress={handleForceCheckout}
            variant={checkoutStatus.isForgotten ? 'error' : 'warning'}
            size="medium"
            style={styles.actionButton}
          />
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            💡 If you forgot to checkout yesterday, contact your supervisor for manual regularization.
          </Text>
        </View>
      </View>
    </ConstructionCard>
  );
};

const styles = StyleSheet.create({
  alertCard: {
    marginVertical: ConstructionTheme.spacing.md,
    backgroundColor: '#FFF9E6', // Light yellow background
  },
  alertContent: {
    padding: ConstructionTheme.spacing.md,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: ConstructionTheme.spacing.md,
  },
  alertIcon: {
    fontSize: 24,
    marginRight: ConstructionTheme.spacing.md,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  alertMessage: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  sessionDetails: {
    backgroundColor: ConstructionTheme.colors.surface,
    borderRadius: ConstructionTheme.borderRadius.sm,
    padding: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  detailLabel: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: '600',
  },
  detailValue: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  infoSection: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
    padding: ConstructionTheme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.primary,
  },
  infoText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
});

export default ForgottenCheckoutAlert;