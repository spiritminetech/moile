// GeofenceValidator component for location-based UI control

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocation } from '../../store/context/LocationContext';
import { GeofenceValidation, GPSAccuracyWarning } from '../../types';
import { COLORS, UI_CONSTANTS } from '../../utils/constants';

interface GeofenceValidatorProps {
  projectId: number;
  onValidationChange: (isValid: boolean, validation?: GeofenceValidation) => void;
  children?: React.ReactNode;
  showDetails?: boolean;
  autoValidate?: boolean;
}

export const GeofenceValidator: React.FC<GeofenceValidatorProps> = ({
  projectId,
  onValidationChange,
  children,
  showDetails = true,
  autoValidate = true,
}) => {
  const { state, getCurrentLocation, validateGeofence, checkGPSAccuracy } = useLocation();
  const [validation, setValidation] = useState<GeofenceValidation | null>(null);
  const [accuracyWarning, setAccuracyWarning] = useState<GPSAccuracyWarning | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidationTime, setLastValidationTime] = useState<Date | null>(null);

  // Auto-validate when location changes
  useEffect(() => {
    if (autoValidate && state.currentLocation && projectId) {
      performValidation();
    }
  }, [state.currentLocation, projectId, autoValidate]);

  const performValidation = async (forceRefresh: boolean = false) => {
    if (!projectId) {
      return;
    }

    console.log('🔍 GeofenceValidator: Starting validation for project', projectId);
    setIsValidating(true);
    try {
      // Always get fresh location if forceRefresh is true, or if no cached location
      let currentLocation = state.currentLocation;
      if (forceRefresh || !currentLocation) {
        console.log('📍 GeofenceValidator: Getting fresh location...');
        currentLocation = await getCurrentLocation();
      }

      console.log('📍 GeofenceValidator: Using location:', {
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
        accuracy: currentLocation?.accuracy
      });

      // Check GPS accuracy
      const accuracy = checkGPSAccuracy();
      setAccuracyWarning(accuracy);

      // Validate geofence
      console.log('🔍 GeofenceValidator: Validating geofence...');
      const validationResult = await validateGeofence(projectId);
      console.log('✅ GeofenceValidator: Validation result:', validationResult);
      
      setValidation(validationResult);
      setLastValidationTime(new Date());

      // Notify parent component
      onValidationChange(validationResult.isValid, validationResult);
    } catch (error) {
      console.error('❌ GeofenceValidator: Validation error:', error);
      const errorValidation: GeofenceValidation = {
        isValid: false,
        distanceFromSite: 999,
        accuracy: state.currentLocation?.accuracy || 999,
        message: error instanceof Error ? error.message : 'Validation failed',
      };
      setValidation(errorValidation);
      onValidationChange(false, errorValidation);
    } finally {
      setIsValidating(false);
    }
  };

  const handleManualValidation = () => {
    performValidation(true); // Force refresh when manually triggered
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  const getValidationStatusColor = (): string => {
    if (isValidating) return COLORS.WARNING;
    if (!validation) return COLORS.TEXT_SECONDARY;
    return validation.isValid ? COLORS.SUCCESS : COLORS.ERROR;
  };

  const getValidationStatusText = (): string => {
    if (isValidating) return 'Validating location...';
    if (!validation) return 'Location not validated';
    
    // Show BOTH GPS accuracy AND geofence status clearly
    if (validation.isValid) {
      return 'Inside work area ✓';
    } else {
      return `Outside work area (${formatDistance(validation.distanceFromSite)} away) ✗`;
    }
  };

  const renderLocationStatus = () => {
    if (!showDetails) return null;

    return (
      <View style={styles.statusContainer}>
        {/* Validation Status */}
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Location Status:</Text>
          <Text style={[styles.statusValue, { color: getValidationStatusColor() }]}>
            {getValidationStatusText()}
          </Text>
        </View>

        {/* Distance from site */}
        {validation && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Distance from site:</Text>
            <Text style={[
              styles.statusValue,
              { color: validation.isValid ? COLORS.SUCCESS : COLORS.ERROR }
            ]}>
              {formatDistance(validation.distanceFromSite)}
            </Text>
          </View>
        )}

        {/* GPS Accuracy */}
        {accuracyWarning && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>GPS Accuracy:</Text>
            <Text style={[
              styles.statusValue,
              { color: accuracyWarning.isAccurate ? COLORS.SUCCESS : COLORS.WARNING }
            ]}>
              ±{Math.round(accuracyWarning.currentAccuracy)}m
            </Text>
          </View>
        )}

        {/* Last validation time */}
        {lastValidationTime && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Last checked:</Text>
            <Text style={styles.statusValue}>
              {lastValidationTime.toLocaleTimeString()}
            </Text>
          </View>
        )}

        {/* Validation message */}
        {validation?.message && (
          <View style={styles.messageContainer}>
            <Text style={[
              styles.messageText,
              { color: validation.isValid ? COLORS.SUCCESS : COLORS.ERROR }
            ]}>
              {validation.message}
            </Text>
            {!validation.isValid && (
              <Text style={styles.refreshHintText}>
                💡 Moved closer? Tap "Refresh Location" below to update.
              </Text>
            )}
          </View>
        )}

        {/* GPS accuracy warning */}
        {accuracyWarning && !accuracyWarning.isAccurate && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              ⚠️ {accuracyWarning.message}
            </Text>
          </View>
        )}

        {/* Location error */}
        {state.locationError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              ❌ {state.locationError}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderValidationButton = () => {
    return (
      <TouchableOpacity
        style={[
          styles.validateButton,
          { backgroundColor: getValidationStatusColor() }
        ]}
        onPress={handleManualValidation}
        disabled={isValidating}
      >
        {isValidating ? (
          <ActivityIndicator color={COLORS.SURFACE} size="small" />
        ) : (
          <Text style={styles.validateButtonText}>
            {validation ? 'Refresh Location' : 'Validate Location'}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {renderLocationStatus()}
      {renderValidationButton()}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
    padding: UI_CONSTANTS.SPACING.MD,
    marginVertical: UI_CONSTANTS.SPACING.SM,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  statusContainer: {
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },
  statusLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
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
  refreshHintText: {
    fontSize: 12,
    textAlign: 'center',
    color: COLORS.TEXT_SECONDARY,
    marginTop: 8,
    fontStyle: 'italic',
  },
  warningContainer: {
    marginTop: UI_CONSTANTS.SPACING.SM,
    padding: UI_CONSTANTS.SPACING.SM,
    backgroundColor: '#FFF3CD',
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
    borderWidth: 1,
    borderColor: COLORS.WARNING,
  },
  warningText: {
    fontSize: 13,
    color: '#856404',
    textAlign: 'center',
  },
  errorContainer: {
    marginTop: UI_CONSTANTS.SPACING.SM,
    padding: UI_CONSTANTS.SPACING.SM,
    backgroundColor: '#F8D7DA',
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
    borderWidth: 1,
    borderColor: COLORS.ERROR,
  },
  errorText: {
    fontSize: 13,
    color: '#721C24',
    textAlign: 'center',
  },
  validateButton: {
    height: UI_CONSTANTS.LARGE_BUTTON_HEIGHT,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: UI_CONSTANTS.SPACING.SM,
  },
  validateButtonText: {
    color: COLORS.SURFACE,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GeofenceValidator;