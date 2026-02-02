// Error Display Component for showing user-friendly errors
// Requirements: 12.4

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import ConstructionButton from './ConstructionButton';
import ConstructionCard from './ConstructionCard';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';
import { ErrorInfo } from '../../utils/errorHandling/ErrorHandler';

type ErrorDisplayVariant = 'inline' | 'card' | 'banner';

interface ErrorDisplayProps {
  error: ErrorInfo | string | null;
  variant?: ErrorDisplayVariant;
  showRetry?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  style?: ViewStyle | ViewStyle[];
  title?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  variant = 'card',
  showRetry = true,
  onRetry,
  onDismiss,
  style,
  title,
}) => {
  if (!error) return null;

  const errorInfo: ErrorInfo = typeof error === 'string' 
    ? {
        message: error,
        timestamp: new Date(),
        recoverable: true,
      }
    : error;

  const getErrorIcon = () => {
    if (errorInfo.code === 'NETWORK_ERROR') return '📡';
    if (errorInfo.code === 'LOCATION_ERROR') return '📍';
    if (errorInfo.code === 'CAMERA_ERROR') return '📷';
    if (errorInfo.context === 'Authentication') return '🔐';
    return '⚠️';
  };

  const getErrorTitle = () => {
    if (title) return title;
    if (errorInfo.code === 'NETWORK_ERROR') return 'Connection Error';
    if (errorInfo.code === 'LOCATION_ERROR') return 'Location Error';
    if (errorInfo.code === 'CAMERA_ERROR') return 'Camera Error';
    if (errorInfo.context === 'Authentication') return 'Authentication Error';
    return 'Error';
  };

  const renderActions = () => {
    const actions = [];

    if (showRetry && errorInfo.recoverable && (onRetry || errorInfo.retryAction)) {
      actions.push(
        <ConstructionButton
          key="retry"
          title="Try Again"
          onPress={async () => {
            if (onRetry) {
              await onRetry();
            } else if (errorInfo.retryAction) {
              await errorInfo.retryAction();
            }
          }}
          variant="primary"
          size="small"
          icon="🔄"
          style={styles.actionButton}
        />
      );
    }

    if (onDismiss) {
      actions.push(
        <ConstructionButton
          key="dismiss"
          title="Dismiss"
          onPress={onDismiss}
          variant="neutral"
          size="small"
          style={styles.actionButton}
        />
      );
    }

    return actions.length > 0 ? (
      <View style={styles.actions}>
        {actions}
      </View>
    ) : null;
  };

  const renderContent = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.icon}>{getErrorIcon()}</Text>
        <Text style={styles.title}>{getErrorTitle()}</Text>
      </View>
      
      <Text style={styles.message}>{errorInfo.message}</Text>
      
      {errorInfo.code && (
        <Text style={styles.code}>Error Code: {errorInfo.code}</Text>
      )}
      
      {renderActions()}
      
      {errorInfo.timestamp && (
        <Text style={styles.timestamp}>
          {errorInfo.timestamp.toLocaleTimeString()}
        </Text>
      )}
    </>
  );

  switch (variant) {
    case 'inline':
      return (
        <View style={[styles.inlineContainer, style]}>
          {renderContent()}
        </View>
      );

    case 'banner':
      return (
        <View style={[styles.bannerContainer, style]}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerIcon}>{getErrorIcon()}</Text>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>{getErrorTitle()}</Text>
              <Text style={styles.bannerMessage}>{errorInfo.message}</Text>
            </View>
            {showRetry && errorInfo.recoverable && onRetry && (
              <ConstructionButton
                title="Retry"
                onPress={onRetry}
                variant="primary"
                size="small"
                style={styles.bannerButton}
              />
            )}
          </View>
        </View>
      );

    case 'card':
    default:
      return (
        <ConstructionCard
          variant="error"
          style={styles.cardContainer}
        >
          {renderContent()}
        </ConstructionCard>
      );
  }
};

const styles = StyleSheet.create({
  // Card variant styles
  cardContainer: {
    marginVertical: ConstructionTheme.spacing.sm,
  },

  // Inline variant styles
  inlineContainer: {
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.error + '10',
    borderRadius: ConstructionTheme.borderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.error,
    marginVertical: ConstructionTheme.spacing.sm,
  },

  // Banner variant styles
  bannerContainer: {
    backgroundColor: ConstructionTheme.colors.error + '15',
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.error + '30',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ConstructionTheme.spacing.md,
  },
  bannerIcon: {
    fontSize: ConstructionTheme.dimensions.iconMedium,
    marginRight: ConstructionTheme.spacing.md,
  },
  bannerText: {
    flex: 1,
    marginRight: ConstructionTheme.spacing.md,
  },
  bannerTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.error,
    marginBottom: 2,
  },
  bannerMessage: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
  },
  bannerButton: {
    minWidth: 80,
  },

  // Common styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  icon: {
    fontSize: ConstructionTheme.dimensions.iconLarge,
    marginRight: ConstructionTheme.spacing.md,
  },
  title: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.error,
    flex: 1,
  },
  message: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    lineHeight: 22,
    marginBottom: ConstructionTheme.spacing.md,
  },
  code: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontFamily: 'monospace',
    marginBottom: ConstructionTheme.spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: ConstructionTheme.spacing.sm,
    gap: ConstructionTheme.spacing.sm,
  },
  actionButton: {
    minWidth: 100,
  },
  timestamp: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'right',
    fontStyle: 'italic',
  },
});

export default ErrorDisplay;