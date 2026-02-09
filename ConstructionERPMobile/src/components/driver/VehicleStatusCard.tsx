// VehicleStatusCard Component - Display vehicle information and status
// Requirements: 8.1, 8.2, 8.3, 8.4, 8.5

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { VehicleInfo } from '../../types';
import { ConstructionCard } from '../common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface VehicleStatusCardProps {
  vehicle: VehicleInfo | null;
}

const VehicleStatusCard: React.FC<VehicleStatusCardProps> = ({
  vehicle,
}) => {
  // Get fuel level color
  const getFuelLevelColor = (level: number): string => {
    if (level >= 50) return ConstructionTheme.colors.success;
    if (level >= 25) return ConstructionTheme.colors.warning;
    return ConstructionTheme.colors.error;
  };

  // Render fuel level indicator
  const renderFuelLevel = () => {
    if (!vehicle) return null;

    const fuelLevel = vehicle.fuelLevel;
    const fuelColor = getFuelLevelColor(fuelLevel);

    return (
      <View style={styles.fuelSection}>
        <Text style={styles.sectionTitle}>⛽ Fuel Level</Text>
        <View style={styles.fuelContainer}>
          <View style={styles.fuelGauge}>
            <View style={styles.fuelGaugeBackground}>
              <View 
                style={[
                  styles.fuelGaugeFill,
                  { 
                    width: `${fuelLevel}%`,
                    backgroundColor: fuelColor,
                  }
                ]}
              />
            </View>
            <Text style={[styles.fuelPercentage, { color: fuelColor }]}>
              {fuelLevel}%
            </Text>
          </View>
          {fuelLevel < 25 && (
            <View style={styles.fuelWarning}>
              <Text style={styles.fuelWarningText}>⚠️ Low fuel - refuel soon</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render vehicle info
  const renderVehicleInfo = () => {
    if (!vehicle) return null;

    return (
      <View style={styles.vehicleInfoSection}>
        <View style={styles.vehicleInfoRow}>
          <Text style={styles.vehicleInfoLabel}>Plate Number:</Text>
          <Text style={styles.vehicleInfoValue}>{vehicle.plateNumber}</Text>
        </View>
        <View style={styles.vehicleInfoRow}>
          <Text style={styles.vehicleInfoLabel}>Model:</Text>
          <Text style={styles.vehicleInfoValue}>
            {vehicle.model || 'Unknown'}
            {vehicle.year ? ` (${vehicle.year})` : ''}
          </Text>
        </View>
        <View style={styles.vehicleInfoRow}>
          <Text style={styles.vehicleInfoLabel}>Capacity:</Text>
          <Text style={styles.vehicleInfoValue}>{vehicle.capacity} passengers</Text>
        </View>
        <View style={styles.vehicleInfoRow}>
          <Text style={styles.vehicleInfoLabel}>Fuel Type:</Text>
          <Text style={styles.vehicleInfoValue}>{vehicle.fuelType || 'Diesel'}</Text>
        </View>
      </View>
    );
  };

  if (!vehicle) {
    return (
      <ConstructionCard
        variant="outlined"
        style={styles.container}
      >
        <View style={styles.noVehicleContainer}>
          <Text style={styles.noVehicleText}>🚗 No vehicle assigned</Text>
          <Text style={styles.noVehicleSubtext}>Contact your supervisor to get a vehicle assignment</Text>
        </View>
      </ConstructionCard>
    );
  }

  return (
    <ConstructionCard
      variant="elevated"
      style={styles.container}
    >
      <Text style={styles.cardTitle}>🚗 Vehicle Status</Text>
      
      {/* Vehicle info */}
      {renderVehicleInfo()}

      {/* Fuel level */}
      {renderFuelLevel()}
    </ConstructionCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  cardTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.lg,
    textAlign: 'center',
  },
  noVehicleContainer: {
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.xl,
  },
  noVehicleText: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  noVehicleSubtext: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  vehicleInfoSection: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
    padding: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.lg,
  },
  vehicleInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  vehicleInfoLabel: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  vehicleInfoValue: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
  },
  fuelSection: {
    marginBottom: ConstructionTheme.spacing.lg,
    paddingBottom: ConstructionTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline,
  },
  sectionTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.md,
  },
  fuelContainer: {
    alignItems: 'center',
  },
  fuelGauge: {
    width: '100%',
    alignItems: 'center',
  },
  fuelGaugeBackground: {
    width: '100%',
    height: 24,
    backgroundColor: ConstructionTheme.colors.outline,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  fuelGaugeFill: {
    height: '100%',
    borderRadius: 12,
    minWidth: 2,
  },
  fuelPercentage: {
    ...ConstructionTheme.typography.headlineSmall,
    fontWeight: '700',
  },
  fuelWarning: {
    marginTop: ConstructionTheme.spacing.sm,
    padding: ConstructionTheme.spacing.sm,
    backgroundColor: ConstructionTheme.colors.error + '20',
    borderRadius: ConstructionTheme.borderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.error,
  },
  fuelWarningText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.error,
    fontWeight: '600',
  },
  maintenanceSection: {
    marginBottom: ConstructionTheme.spacing.lg,
    paddingBottom: ConstructionTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline,
  },
  noMaintenanceText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: ConstructionTheme.spacing.lg,
  },
  urgentMaintenanceContainer: {
    backgroundColor: ConstructionTheme.colors.surface,
    borderRadius: ConstructionTheme.borderRadius.sm,
    padding: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.md,
    borderLeftWidth: 4,
  },
  urgentMaintenanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  urgentMaintenanceType: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
    flex: 1,
  },
  maintenanceStatusBadge: {
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: 4,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  maintenanceStatusText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  urgentMaintenanceDate: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  urgentMaintenanceMileage: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  maintenanceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
    paddingVertical: ConstructionTheme.spacing.md,
    paddingHorizontal: ConstructionTheme.spacing.lg,
  },
  maintenanceSummaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  maintenanceSummaryValue: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.info,
    fontWeight: '700',
    marginBottom: 4,
  },
  maintenanceSummaryLabel: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ConstructionTheme.spacing.sm,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
  },
});

export default VehicleStatusCard;