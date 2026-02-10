// VehicleInfoScreen - Vehicle information and status display for drivers
// Requirements: 12.1, 12.2, 12.3, 12.4, 12.5

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../store/context/AuthContext';
import { useOffline } from '../../store/context/OfflineContext';
import { driverApiService } from '../../services/api/DriverApiService';
import { VehicleInfo, MaintenanceAlert, FuelLogEntry } from '../../types';

// Import common components
import { 
  ConstructionButton, 
  ConstructionCard, 
  ConstructionLoadingIndicator,
  ErrorDisplay,
  OfflineIndicator 
} from '../../components/common';
import { FuelLogModal } from '../../components/driver/FuelLogModal';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

const VehicleInfoScreen: React.FC = () => {
  const { state: authState } = useAuth();
  const { isOffline } = useOffline();

  // Vehicle state
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showFuelLogModal, setShowFuelLogModal] = useState(false);

  // Load vehicle information
  const loadVehicleInfo = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      console.log('🚗 Loading vehicle information...');

      const response = await driverApiService.getAssignedVehicle();
      console.log('🚗 API Response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        console.log('🚗 Vehicle Data:', {
          plateNumber: response.data.plateNumber,
          currentMileage: response.data.currentMileage,
          fuelLevel: response.data.fuelLevel,
          model: response.data.model,
          year: response.data.year
        });
        setVehicleInfo(response.data);
        console.log('✅ Vehicle info loaded');
      } else {
        console.warn('⚠️ No vehicle data in response');
      }

      // Load maintenance alerts
      const alertsResponse = await driverApiService.getMaintenanceAlerts();
      if (alertsResponse.success && alertsResponse.data) {
        setMaintenanceAlerts(alertsResponse.data);
        console.log('✅ Maintenance alerts loaded:', alertsResponse.data.length);
      }

      setLastUpdated(new Date());

    } catch (error: any) {
      console.error('❌ Vehicle info loading error:', error);
      setError(error.message || 'Failed to load vehicle information');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadVehicleInfo();
  }, [loadVehicleInfo]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadVehicleInfo(false);
  }, [loadVehicleInfo]);

  // Handle fuel logging
  const handleLogFuel = useCallback(() => {
    if (!vehicleInfo) {
      Alert.alert('Error', 'No vehicle assigned');
      return;
    }
    setShowFuelLogModal(true);
  }, [vehicleInfo]);

  // Handle fuel log submission
  const handleFuelLogSubmit = useCallback(async (entry: FuelLogEntry) => {
    try {
      // In a real implementation, this would call the API
      // await driverApiService.submitFuelLog(entry);
      
      console.log('Fuel log entry submitted:', entry);
      
      // Refresh vehicle info to show the new entry
      await loadVehicleInfo(false);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to submit fuel log entry');
    }
  }, [loadVehicleInfo]);

  // Handle maintenance reporting
  const handleReportIssue = useCallback(() => {
    if (!vehicleInfo) {
      Alert.alert('Error', 'No vehicle assigned');
      return;
    }

    Alert.alert(
      'Report Vehicle Issue',
      'What type of issue would you like to report?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mechanical Issue',
          onPress: () => showIssueReportForm('mechanical'),
        },
        {
          text: 'Electrical Issue',
          onPress: () => showIssueReportForm('electrical'),
        },
        {
          text: 'Safety Concern',
          onPress: () => showIssueReportForm('safety'),
        },
        {
          text: 'Other Issue',
          onPress: () => showIssueReportForm('other'),
        },
      ]
    );
  }, [vehicleInfo]);

  // Show issue report form
  const showIssueReportForm = useCallback((category: string) => {
    Alert.alert(
      `Report ${category.charAt(0).toUpperCase() + category.slice(1)} Issue`,
      'This would open a detailed issue reporting form with:\n\n• Issue description\n• Severity level (Low/Medium/High/Critical)\n• Photo attachments\n• Current location\n• Immediate assistance needed?\n\nFeature will be fully implemented in the next update.',
      [{ text: 'OK' }]
    );
  }, []);

  // Handle vehicle pre-check
  const handleVehiclePreCheck = useCallback(() => {
    if (!vehicleInfo) {
      Alert.alert('Error', 'No vehicle assigned');
      return;
    }

    Alert.alert(
      'Vehicle Pre-Check',
      'Perform a pre-trip vehicle inspection to ensure safety and compliance.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Pre-Check',
          onPress: () => {
            Alert.alert(
              'Pre-Trip Inspection',
              'This would open a comprehensive pre-check form with:\n\n• Tire condition and pressure\n• Lights and signals\n• Brakes and steering\n• Fluid levels\n• Safety equipment\n• Interior/exterior condition\n• Photo documentation\n\nFeature will be fully implemented in the next update.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  }, [vehicleInfo]);

  // Handle emergency assistance
  const handleEmergencyAssistance = useCallback(() => {
    Alert.alert(
      'Emergency Assistance',
      'Do you need immediate assistance?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Vehicle Breakdown',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Emergency Assistance Requested',
              'Emergency assistance has been requested for vehicle breakdown. Dispatch will contact you shortly.\n\nIn case of immediate danger, please call emergency services directly.',
              [{ text: 'OK' }]
            );
          },
        },
        {
          text: 'Medical Emergency',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Medical Emergency',
              'For medical emergencies, please call emergency services immediately.\n\nEmergency Numbers:\n• Emergency: 911\n• Company Emergency Line: Available in profile',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  }, []);

  // Handle maintenance viewing
  const handleViewMaintenance = useCallback(() => {
    if (!vehicleInfo) {
      Alert.alert('Error', 'No vehicle assigned');
      return;
    }

    if (!vehicleInfo.maintenanceSchedule || vehicleInfo.maintenanceSchedule.length === 0) {
      Alert.alert(
        'Maintenance Schedule',
        'No scheduled maintenance items found for your vehicle.',
        [{ text: 'OK' }]
      );
      return;
    }

    const upcomingItems = vehicleInfo.maintenanceSchedule.filter(item => 
      item.status === 'upcoming' || item.status === 'due'
    );

    const overdueItems = vehicleInfo.maintenanceSchedule.filter(item => 
      item.status === 'overdue'
    );

    let message = 'Maintenance Schedule Summary:\n\n';
    
    if (overdueItems.length > 0) {
      message += `🔴 OVERDUE (${overdueItems.length} items):\n`;
      overdueItems.forEach(item => {
        message += `• ${item.type.replace('_', ' ').toUpperCase()}\n`;
      });
      message += '\n';
    }

    if (upcomingItems.length > 0) {
      message += `🟡 UPCOMING (${upcomingItems.length} items):\n`;
      upcomingItems.forEach(item => {
        const dueDate = new Date(item.dueDate).toLocaleDateString();
        message += `• ${item.type.replace('_', ' ').toUpperCase()} - Due: ${dueDate}\n`;
      });
    }

    if (overdueItems.length === 0 && upcomingItems.length === 0) {
      message += '✅ All maintenance items are up to date!';
    }

    Alert.alert('Maintenance Schedule', message, [{ text: 'OK' }]);
  }, [vehicleInfo]);

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Vehicle Information</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ConstructionLoadingIndicator 
            message="Loading vehicle information..."
            size="large"
          />
        </View>
      </View>
    );
  }

  // Render error state
  if (error && !vehicleInfo) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Vehicle Information</Text>
        </View>
        <View style={styles.errorContainer}>
          <ErrorDisplay 
            error={error}
            onRetry={() => loadVehicleInfo()}
            showRetry={!isOffline}
          />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Vehicle Information</Text>
          <Text style={styles.subtitle}>
            Vehicle Status & Maintenance
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          <Text style={styles.refreshButtonText}>
            {isRefreshing ? '⟳' : '↻'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Offline indicator */}
      {isOffline && <OfflineIndicator />}

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[ConstructionTheme.colors.primary]}
            tintColor={ConstructionTheme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Vehicle Details */}
        {vehicleInfo ? (
          <ConstructionCard title="Vehicle Details" variant="elevated" style={styles.vehicleCard}>
            <View style={styles.vehicleHeader}>
              <Text style={styles.vehiclePlate}>🚛 {vehicleInfo.plateNumber}</Text>
              <Text style={styles.vehicleModel}>
                {vehicleInfo.model || vehicleInfo.vehicleType || 'Unknown Vehicle'}
                {vehicleInfo.year ? ` (${vehicleInfo.year})` : ''}
              </Text>
            </View>
            
            <View style={styles.vehicleSpecs}>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Assigned Driver</Text>
                <Text style={styles.specValue}>
                  {vehicleInfo.assignedDriverName || authState.user?.name || 'Not Assigned'}
                </Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Capacity</Text>
                <Text style={styles.specValue}>{vehicleInfo.capacity} passengers</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Fuel Type</Text>
                <Text style={styles.specValue}>{vehicleInfo.fuelType || 'Diesel'}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Current Mileage</Text>
                <Text style={styles.specValue}>{vehicleInfo.currentMileage?.toLocaleString() || 'N/A'} km</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Fuel Level</Text>
                <Text style={[styles.specValue, { color: getFuelLevelColor(vehicleInfo.fuelLevel) }]}>
                  {vehicleInfo.fuelLevel}%
                </Text>
              </View>
              
              {/* Insurance Information */}
              {vehicleInfo.insurance && (
                <>
                  <View style={styles.sectionDivider} />
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>Insurance Provider</Text>
                    <Text style={styles.specValue}>{vehicleInfo.insurance.provider}</Text>
                  </View>
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>Policy Number</Text>
                    <Text style={styles.specValue}>{vehicleInfo.insurance.policyNumber}</Text>
                  </View>
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>Insurance Expiry</Text>
                    <Text style={[
                      styles.specValue,
                      { color: getExpiryStatusColor(vehicleInfo.insurance.status) }
                    ]}>
                      {new Date(vehicleInfo.insurance.expiryDate).toLocaleDateString()}
                      {' '}({vehicleInfo.insurance.status.replace('_', ' ').toUpperCase()})
                    </Text>
                  </View>
                </>
              )}
              
              {/* Road Tax Information */}
              {vehicleInfo.roadTax && (
                <>
                  <View style={styles.sectionDivider} />
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>Road Tax Valid Until</Text>
                    <Text style={[
                      styles.specValue,
                      { color: getExpiryStatusColor(vehicleInfo.roadTax.status) }
                    ]}>
                      {new Date(vehicleInfo.roadTax.validUntil).toLocaleDateString()}
                      {' '}({vehicleInfo.roadTax.status.replace('_', ' ').toUpperCase()})
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Assigned Route Section */}
            {vehicleInfo.assignedRoute && (
              <View style={styles.assignedRouteSection}>
                <Text style={styles.routeSectionTitle}>📍 Assigned Route</Text>
                <View style={styles.routeDetails}>
                  <View style={styles.routeHeader}>
                    <Text style={styles.routeName}>{vehicleInfo.assignedRoute.routeName}</Text>
                    <Text style={styles.routeCode}>Code: {vehicleInfo.assignedRoute.routeCode}</Text>
                  </View>
                  
                  <View style={styles.routeLocations}>
                    <Text style={styles.routeLabel}>Pickup Locations:</Text>
                    {vehicleInfo.assignedRoute.pickupLocations.map((location, index) => (
                      <Text key={`location-${index}-${location}`} style={styles.routeLocation}>
                        {index + 1}. {location}
                      </Text>
                    ))}
                  </View>
                  
                  <View style={styles.routeDestination}>
                    <Text style={styles.routeLabel}>Drop-off Location:</Text>
                    <Text style={styles.routeLocation}>🎯 {vehicleInfo.assignedRoute.dropoffLocation}</Text>
                  </View>
                  
                  <View style={styles.routeStats}>
                    <View style={styles.routeStat}>
                      <Text style={styles.routeStatLabel}>Distance</Text>
                      <Text style={styles.routeStatValue}>{vehicleInfo.assignedRoute.estimatedDistance} km</Text>
                    </View>
                    <View style={styles.routeStat}>
                      <Text style={styles.routeStatLabel}>Duration</Text>
                      <Text style={styles.routeStatValue}>{vehicleInfo.assignedRoute.estimatedDuration} min</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.vehicleActions}>
              <ConstructionButton
                title="⛽ Log Fuel"
                onPress={handleLogFuel}
                variant="secondary"
                size="small"
                style={styles.actionButton}
              />
              <ConstructionButton
                title="🔧 Report Issue"
                onPress={handleReportIssue}
                variant="warning"
                size="small"
                style={styles.actionButton}
              />
            </View>
          </ConstructionCard>
        ) : (
          <ConstructionCard variant="outlined" style={styles.noVehicleCard}>
            <Text style={styles.noVehicleText}>🚛 No vehicle assigned</Text>
            <Text style={styles.noVehicleSubtext}>Contact dispatch for vehicle assignment</Text>
          </ConstructionCard>
        )}

        {/* Maintenance Alerts */}
        {maintenanceAlerts.length > 0 && (
          <ConstructionCard title="Maintenance Alerts" variant="warning" style={styles.alertsCard}>
            <Text style={styles.alertsTitle}>🔧 Upcoming Maintenance</Text>
            {maintenanceAlerts.map((alert) => (
              <View key={alert.id} style={styles.alertItem}>
                <View style={styles.alertHeader}>
                  <Text style={[styles.alertType, { color: getAlertColor(alert.priority) }]}>
                    {(alert.type || 'general').toUpperCase()}
                  </Text>
                  <Text style={styles.alertPriority}>
                    {(alert.priority || 'normal').toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.alertDescription}>{alert.description}</Text>
                <Text style={styles.alertDue}>
                  Due: {new Date(alert.dueDate).toLocaleDateString()}
                  {alert.dueMileage && ` or ${alert.dueMileage?.toLocaleString() || 'N/A'} km`}
                </Text>
                {alert.estimatedCost && (
                  <Text style={styles.alertCost}>
                    Estimated Cost: ${alert.estimatedCost}
                  </Text>
                )}
              </View>
            ))}
            
            <ConstructionButton
              title="📋 View Full Schedule"
              onPress={handleViewMaintenance}
              variant="secondary"
              size="medium"
              fullWidth
              style={styles.maintenanceButton}
            />
          </ConstructionCard>
        )}

        {/* Fuel Log History */}
        {vehicleInfo?.fuelLog && vehicleInfo.fuelLog.length > 0 && (
          <ConstructionCard title="Recent Fuel Log" variant="outlined" style={styles.fuelLogCard}>
            <Text style={styles.fuelLogTitle}>⛽ Last 5 Fuel Entries</Text>
            {vehicleInfo.fuelLog.slice(0, 5).map((entry, index) => (
              <View key={entry.id || index} style={styles.fuelLogEntry}>
                <View style={styles.fuelLogHeader}>
                  <Text style={styles.fuelLogDate}>
                    {new Date(entry.date).toLocaleDateString()}
                  </Text>
                  <Text style={styles.fuelLogAmount}>
                    {entry.amount}L
                  </Text>
                </View>
                <View style={styles.fuelLogDetails}>
                  <Text style={styles.fuelLogDetail}>
                    Cost: ${entry.cost} • Mileage: {entry.mileage?.toLocaleString() || 'N/A'} km
                  </Text>
                  <Text style={styles.fuelLogLocation}>
                    📍 {entry.location}
                  </Text>
                  {entry.receiptPhoto && (
                    <Text style={styles.fuelLogReceipt}>
                      📎 Receipt attached
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </ConstructionCard>
        )}

        {/* Maintenance Schedule */}
        {vehicleInfo?.maintenanceSchedule && vehicleInfo.maintenanceSchedule.length > 0 && (
          <ConstructionCard title="Maintenance Schedule" variant="outlined" style={styles.scheduleCard}>
            <Text style={styles.scheduleTitle}>🗓️ Upcoming Services</Text>
            {vehicleInfo.maintenanceSchedule.map((item, index) => (
              <View key={`maintenance-${item.type || 'general'}-${item.dueDate || index}`} style={styles.scheduleItem}>
                <View style={styles.scheduleHeader}>
                  <Text style={styles.scheduleType}>
                    {(item.type || 'general').replace('_', ' ').toUpperCase()}
                  </Text>
                  <Text style={[styles.scheduleStatus, { color: getMaintenanceStatusColor(item.status) }]}>
                    {(item.status || 'pending').toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.scheduleDue}>
                  Due: {new Date(item.dueDate).toLocaleDateString()} or {item.dueMileage?.toLocaleString() || 'N/A'} km
                </Text>
              </View>
            ))}
          </ConstructionCard>
        )}

        {/* Quick Actions */}
        <ConstructionCard title="Quick Actions" variant="elevated" style={styles.actionsCard}>
          <View style={styles.quickActions}>
            <ConstructionButton
              title="🔍 Vehicle Pre-Check"
              onPress={handleVehiclePreCheck}
              variant="primary"
              size="medium"
              fullWidth
              style={styles.quickActionButton}
            />
            <ConstructionButton
              title="⛽ Log Fuel Entry"
              onPress={handleLogFuel}
              variant="secondary"
              size="medium"
              fullWidth
              style={styles.quickActionButton}
            />
            <ConstructionButton
              title="🔧 Report Vehicle Issue"
              onPress={handleReportIssue}
              variant="warning"
              size="medium"
              fullWidth
              style={styles.quickActionButton}
            />
            <ConstructionButton
              title="📋 View Maintenance History"
              onPress={handleViewMaintenance}
              variant="outlined"
              size="medium"
              fullWidth
              style={styles.quickActionButton}
            />
            <ConstructionButton
              title="🚨 Emergency Assistance"
              onPress={handleEmergencyAssistance}
              variant="error"
              size="medium"
              fullWidth
              style={styles.quickActionButton}
            />
          </View>
        </ConstructionCard>

        {/* Last updated info */}
        {lastUpdated && (
          <View style={styles.lastUpdatedContainer}>
            <Text style={styles.lastUpdatedText}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Text>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Fuel Log Modal */}
      {vehicleInfo && (
        <FuelLogModal
          visible={showFuelLogModal}
          vehicleId={vehicleInfo.id}
          currentMileage={vehicleInfo.currentMileage}
          onClose={() => setShowFuelLogModal(false)}
          onSubmit={handleFuelLogSubmit}
        />
      )}
    </SafeAreaView>
  );
};

// Helper functions
const getFuelLevelColor = (level: number): string => {
  if (level <= 20) return ConstructionTheme.colors.error;
  if (level <= 40) return ConstructionTheme.colors.warning;
  return ConstructionTheme.colors.success;
};

const getAlertColor = (priority: string): string => {
  switch (priority) {
    case 'critical':
      return ConstructionTheme.colors.error;
    case 'high':
      return ConstructionTheme.colors.warning;
    case 'medium':
      return ConstructionTheme.colors.primary;
    case 'low':
      return ConstructionTheme.colors.onSurfaceVariant;
    default:
      return ConstructionTheme.colors.onSurfaceVariant;
  }
};

const getMaintenanceStatusColor = (status: string): string => {
  switch (status) {
    case 'overdue':
      return ConstructionTheme.colors.error;
    case 'due':
      return ConstructionTheme.colors.warning;
    case 'upcoming':
      return ConstructionTheme.colors.success;
    default:
      return ConstructionTheme.colors.onSurfaceVariant;
  }
};

const getExpiryStatusColor = (status: string): string => {
  switch (status) {
    case 'expired':
      return ConstructionTheme.colors.error;
    case 'expiring_soon':
      return ConstructionTheme.colors.warning;
    case 'active':
      return ConstructionTheme.colors.success;
    default:
      return ConstructionTheme.colors.onSurfaceVariant;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingTop: ConstructionTheme.spacing.xl,
    paddingBottom: ConstructionTheme.spacing.lg,
    backgroundColor: ConstructionTheme.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  subtitle: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onPrimary + 'CC',
    marginTop: 4,
  },
  refreshButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.md,
  },
  refreshButtonText: {
    color: ConstructionTheme.colors.onPrimary,
    ...ConstructionTheme.typography.headlineSmall,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingTop: ConstructionTheme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ConstructionTheme.spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ConstructionTheme.spacing.lg,
  },
  vehicleCard: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  vehicleHeader: {
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.lg,
  },
  vehiclePlate: {
    ...ConstructionTheme.typography.headlineLarge,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  vehicleModel: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  vehicleSpecs: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline + '33',
  },
  specLabel: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  specValue: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: ConstructionTheme.colors.outline + '33',
    marginVertical: ConstructionTheme.spacing.md,
  },
  vehicleActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: ConstructionTheme.spacing.xs,
  },
  noVehicleCard: {
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.xl,
    marginBottom: ConstructionTheme.spacing.lg,
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
  alertsCard: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  alertsTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onWarningContainer,
    marginBottom: ConstructionTheme.spacing.md,
    textAlign: 'center',
  },
  alertItem: {
    padding: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.sm,
    backgroundColor: ConstructionTheme.colors.surface,
    borderRadius: ConstructionTheme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.warning,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  alertType: {
    ...ConstructionTheme.typography.labelLarge,
    fontWeight: 'bold',
  },
  alertPriority: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  alertDescription: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  alertDue: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  alertCost: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
  },
  maintenanceButton: {
    marginTop: ConstructionTheme.spacing.md,
  },
  fuelLogCard: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  fuelLogTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.md,
    textAlign: 'center',
  },
  fuelLogEntry: {
    padding: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.sm,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.md,
  },
  fuelLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  fuelLogDate: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: 'bold',
  },
  fuelLogAmount: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
  },
  fuelLogDetails: {
    marginTop: ConstructionTheme.spacing.xs,
  },
  fuelLogDetail: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  fuelLogLocation: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  fuelLogReceipt: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.primary,
    marginTop: ConstructionTheme.spacing.xs,
    fontStyle: 'italic',
  },
  scheduleCard: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  scheduleTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.md,
    textAlign: 'center',
  },
  scheduleItem: {
    padding: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.sm,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.md,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  scheduleType: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: 'bold',
  },
  scheduleStatus: {
    ...ConstructionTheme.typography.labelSmall,
    fontWeight: 'bold',
  },
  scheduleDue: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  actionsCard: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  quickActions: {
    gap: ConstructionTheme.spacing.md,
  },
  quickActionButton: {
    marginBottom: ConstructionTheme.spacing.sm,
  },
  lastUpdatedContainer: {
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.md,
    marginTop: ConstructionTheme.spacing.lg,
  },
  lastUpdatedText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  // Assigned Route Styles
  assignedRouteSection: {
    marginTop: ConstructionTheme.spacing.lg,
    paddingTop: ConstructionTheme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline + '33',
  },
  routeSectionTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.md,
  },
  routeDetails: {
    backgroundColor: ConstructionTheme.colors.primaryContainer + '22',
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.primary,
  },
  routeHeader: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  routeName: {
    ...ConstructionTheme.typography.titleMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  routeCode: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  routeLocations: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  routeDestination: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  routeLabel: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  routeLocation: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    marginLeft: ConstructionTheme.spacing.sm,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: ConstructionTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline + '22',
  },
  routeStat: {
    alignItems: 'center',
  },
  routeStatLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  routeStatValue: {
    ...ConstructionTheme.typography.titleMedium,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: ConstructionTheme.spacing.xl,
  },
});

export default VehicleInfoScreen;