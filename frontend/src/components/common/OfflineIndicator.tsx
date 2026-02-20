// Offline Indicator Component - Shows network status and sync information
// Requirements: 9.1, 9.2, 9.3, 9.4

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useOffline } from '../../store/context/OfflineContext';
import { COLORS, UI_CONSTANTS } from '../../utils/constants';

interface OfflineIndicatorProps {
  showSyncButton?: boolean;
  compact?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showSyncButton = true,
  compact = false,
}) => {
  const {
    isOnline,
    isOffline,
    state,
    syncQueuedActions,
    clearSyncError,
    getDataFreshness,
  } = useOffline();

  const { lastSyncTime, isStale, staleDuration } = getDataFreshness();
  const hasQueuedActions = state.queuedActions.length > 0;

  // Don't show indicator if online and no issues
  if (isOnline && !hasQueuedActions && !isStale && !state.syncError) {
    return null;
  }

  const handleSyncPress = async () => {
    if (state.syncError) {
      clearSyncError();
    }
    if (isOnline && hasQueuedActions) {
      await syncQueuedActions();
    }
  };

  if (compact) {
    return (
      <View style={[styles.container, styles.compact]}>
        <View style={[styles.statusDot, isOffline ? styles.offlineDot : styles.onlineDot]} />
        <Text style={[styles.statusText, styles.compactText]}>
          {isOffline ? 'Offline' : hasQueuedActions ? `${state.queuedActions.length} pending` : 'Online'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Network Status */}
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, isOffline ? styles.offlineDot : styles.onlineDot]} />
        <Text style={styles.statusText}>
          {isOffline ? 'Offline Mode' : 'Online'}
        </Text>
      </View>

      {/* Sync Information */}
      {lastSyncTime && (
        <Text style={[styles.syncText, isStale && styles.staleText]}>
          Last sync: {staleDuration}
        </Text>
      )}

      {/* Queued Actions */}
      {hasQueuedActions && (
        <Text style={styles.queueText}>
          {state.queuedActions.length} action{state.queuedActions.length > 1 ? 's' : ''} pending sync
        </Text>
      )}

      {/* Sync Error */}
      {state.syncError && (
        <Text style={styles.errorText}>
          {state.syncError}
        </Text>
      )}

      {/* Loading Indicator */}
      {state.isLoading && (
        <Text style={styles.loadingText}>
          Syncing...
        </Text>
      )}

      {/* Sync Button */}
      {showSyncButton && (isOffline || hasQueuedActions || state.syncError) && (
        <TouchableOpacity
          style={[
            styles.syncButton,
            isOffline && styles.syncButtonDisabled,
          ]}
          onPress={handleSyncPress}
          disabled={isOffline || state.isLoading}
        >
          <Text style={[
            styles.syncButtonText,
            isOffline && styles.syncButtonTextDisabled,
          ]}>
            {state.syncError ? 'Retry' : 'Sync Now'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Offline Message */}
      {isOffline && (
        <Text style={styles.offlineMessage}>
          Some features are disabled while offline. Actions will sync when connection is restored.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.SURFACE,
    padding: UI_CONSTANTS.SPACING.MD,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginVertical: UI_CONSTANTS.SPACING.SM,
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: UI_CONSTANTS.SPACING.SM,
    marginVertical: 0,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: UI_CONSTANTS.SPACING.SM,
  },
  onlineDot: {
    backgroundColor: COLORS.SUCCESS,
  },
  offlineDot: {
    backgroundColor: COLORS.WARNING,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  compactText: {
    fontSize: 14,
    fontWeight: '500',
  },
  syncText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },
  staleText: {
    color: COLORS.WARNING,
  },
  queueText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.ERROR,
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontStyle: 'italic',
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },
  syncButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: UI_CONSTANTS.SPACING.MD,
    paddingVertical: UI_CONSTANTS.SPACING.SM,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
    alignSelf: 'flex-start',
    marginTop: UI_CONSTANTS.SPACING.SM,
  },
  syncButtonDisabled: {
    backgroundColor: COLORS.TEXT_SECONDARY,
  },
  syncButtonText: {
    color: COLORS.SURFACE,
    fontSize: 14,
    fontWeight: '600',
  },
  syncButtonTextDisabled: {
    color: COLORS.BACKGROUND,
  },
  offlineMessage: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: UI_CONSTANTS.SPACING.SM,
    fontStyle: 'italic',
  },
});

export default OfflineIndicator;