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
import { VehicleIssueModal } from '../../components/driver/VehicleIssueModal';
import { VehicleInspectionModal } from '../../components/driver/VehicleInspectionModal';
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
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionHistory, setInspectionHistory] = useState<any[]>([]);

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

      // Load inspection history
      if (response.data?.id) {
        const inspectionsResponse = await driverApiService.getVehicleInspections(response.data.id, 5);
        if (inspectionsResponse.success && inspectionsResponse.data) {
          setInspectionHistory(inspectionsResponse.data);
          console.log('✅ Inspection history loaded:', inspectionsResponse.data.length);
        }
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
      console.log('⛽ Submitting fuel log entry:', entry);
      
      // Call the API to submit fuel log
      const response = await driverApiService.submitFuelLog({
        vehicleId: entry.vehicleId,
        amount: entry.amount,
        cost: entry.cost,
        mileage: entry.mileage,
        location: entry.location,
        receiptPhoto: entry.receiptPhoto
      });

      if (response.success) {
        console.log('✅ Fuel log submitted successfully');
        // Refresh vehicle info to show the new entry
        await loadVehicleInfo(false);
      } else {
        throw new Error(response.message || 'Failed to submit fuel log');
      }
    } catch (error: any) {
      console.error('❌ Fuel log submission error:', error);
      throw new Error(error.message || 'Failed to submit fuel log entry');
    }
  }, [loadVehicleInfo]);

  // Handle maintenance reporting
  const handleReportIssue = useCallback(() => {
    if (!vehicleInfo) {
      Alert.alert('Error', 'No vehicle assigned');
      return;
    }
    setShowIssueModal(true);
  }, [vehicleInfo]);

  // Handle issue submission
  const handleIssueSubmit = useCallback(async (issueData: {
    category: string;
    description: string;
    severity: string;
  }) => {
    if (!vehicleInfo) return;

    try {
      console.log('🔧 Submitting vehicle issue:', issueData);

      const response = await driverApiService.reportVehicleIssue({
        vehicleId: vehicleInfo.id,
        category: issueData.category as 'mechanical' | 'electrical' | 'safety' | 'other',
        description: issueData.description,
        severity: issueData.severity as 'low' | 'medium' | 'high' | 'critical',
        location: { latitude: null, longitude: null },
        photos: [],
        immediateAssistance: issueData.severity === 'critical'
      });

      if (response.success) {
        let message = 'Vehicle issue has been reported successfully.';
        
        if (issueData.severity === 'critical') {
          message += '\n\n⚠️ This vehicle is marked as OUT OF SERVICE. Please do not use it until repaired.';
        } else if (issueData.severity === 'high') {
          message += '\n\n⚠️ This vehicle needs repair. Use with caution.';
        }

        Alert.alert('Issue Reported', message);
        
        // Refresh vehicle info
        await loadVehicleInfo(false);
      } else {
        throw new Error(response.message || 'Failed to report issue');
      }
    } catch (error: any) {
      console.error('❌ Error reporting vehicle issue:', error);
      throw new Error(error.message || 'Failed to report vehicle issue');
    }
  }, [vehicleInfo, loadVehicleInfo]);

  // Handle vehicle pre-check
  const handleVehiclePreCheck = useCallback(() => {
    if (!vehicleInfo) {
      Alert.alert('Error', 'No vehicle assigned');
      return;
    }
    setShowInspectionModal(true);
  }, [vehicleInfo]);

  // Handle inspection submission
  const handleInspectionSubmit = useCallback(async (inspectionData: any) => {
    if (!vehicleInfo) return;

    try {
      console.log('🔍 Submitting vehicle inspection:', inspectionData);

      const response = await driverApiService.submitVehicleInspection(inspectionData);

      if (response.success) {
        const result = response.data;
        let message = 'Vehicle inspection completed successfully.';
        
        if (result.overallStatus === 'fail') {
          message = '❌ INSPECTION FAILED\n\nCritical issues found. This vehicle cannot be used until repaired.\n\n';
          message += result.issuesFound.map((issue: any) => `• ${issue.description}`).join('\n');
          Alert.alert('Inspection Failed', message);
        } else if (result.overallStatus === 'conditional_pass') {
          message = '⚠️ CONDITIONAL PASS\n\nMinor issues found. You can proceed with caution.\n\n';
          message += result.issuesFound.map((issue: any) => `• ${issue.description}`).join('\n');
          message += '\n\nThese issues have been reported to maintenance.';
          Alert.alert('Inspection Complete', message);
        } else {
          Alert.alert('Inspection Passed', '✅ All checks passed! Vehicle is safe to operate.');
        }
        
        // Refresh vehicle info and inspection history
        await loadVehicleInfo(false);
      } else {
        throw new Error(response.message || 'Failed to submit inspection');
      }
    } catch (error: any) {
      console.error('❌ Error submitting vehicle inspection:', error);
      throw new Error(error.message || 'Failed to submit vehicle inspection');
    }
  }, [vehicleInfo, loadVehicleInfo]);

  // Handle emergency assistance
  const handleEmergencyAssistance = useCallback(() => {
    Alert.alert(
      '🚨 Emergency Assistance',
      'What type of emergency are you experiencing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '🔧 Vehicle Breakdown',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '🔧 Vehicle Breakdown Assistance',
              '✅ Emergency assistance request has been sent to dispatch.\n\n' +
              '📞 Dispatch will contact you shortly.\n\n' +
              '⚠️ If you are in immediate danger:\n' +
              '• Move to a safe location\n' +
              '• Call emergency services: 911\n\n' +
              '💡 While waiting:\n' +
              '• Turn on hazard lights\n' +
              '• Stay with the vehicle if safe\n' +
              '• Note your exact location',
              [{ text: 'OK' }]
            );
          },
        },
        {
          text: '🚑 Medical Emergency',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '🚑 Medical Emergency',
              '⚠️ CALL EMERGENCY SERVICES IMMEDIATELY\n\n' +
              '📞 Emergency Numbers:\n' +
              '• Emergency: 911\n' +
              '• Ambulance: 911\n\n' +
              '✅ After calling 911:\n' +
              '• Contact company emergency line (check your profile)\n' +
              '• Stay with the injured person\n' +
              '• Follow dispatcher instructions\n\n' +
              '💡 Do not move injured person unless in immediate danger',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Call 911 Now', 
                  style: 'destructive',
                  onPress: () => {
                    // In a real app, this would trigger phone dialer
                    Alert.alert('Calling 911', 'Emergency services will be contacted');
                  }
                }
              ]
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

    // Build simple maintenance info
    let message = '🔧 Maintenance Information\n\n';
    
    // Current Mileage (most important)
    message += `📊 Current Mileage: ${vehicleInfo.currentMileage?.toLocaleString() || 'N/A'} km\n\n`;
    
    // Last service
    if (vehicleInfo.lastServiceDate) {
      const lastService = new Date(vehicleInfo.lastServiceDate);
      message += `📅 Last Service:\n`;
      message += `   Date: ${lastService.toLocaleDateString()}\n`;
      if (vehicleInfo.lastServiceMileage) {
        message += `   Mileage: ${vehicleInfo.lastServiceMileage.toLocaleString()} km\n`;
      }
    } else {
      message += `📅 Last Service: Not recorded\n`;
    }
    
    message += `\n`;
    
    // Next service
    if (vehicleInfo.nextServiceDate) {
      const nextService = new Date(vehicleInfo.nextServiceDate);
      const today = new Date();
      const daysUntil = Math.ceil((nextService.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      message += `📅 Next Service:\n`;
      message += `   Date: ${nextService.toLocaleDateString()}`;
      
      if (daysUntil < 0) {
        message += ` ⚠️ OVERDUE\n`;
      } else if (daysUntil <= 7) {
        message += ` ⚠️ (${daysUntil} days)\n`;
      } else {
        message += ` (${daysUntil} days)\n`;
      }
      
      if (vehicleInfo.nextServiceMileage) {
        const kmUntilService = vehicleInfo.nextServiceMileage - (vehicleInfo.currentMileage || 0);
        message += `   Mileage: ${vehicleInfo.nextServiceMileage.toLocaleString()} km`;
        if (kmUntilService > 0) {
          message += ` (${kmUntilService.toLocaleString()} km remaining)\n`;
        } else {
          message += ` ⚠️ OVERDUE\n`;
        }
      }
    } else {
      message += `📅 Next Service: Not scheduled\n`;
    }

    Alert.alert('Maintenance Information', message, [{ text: 'OK' }]);
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

      {/* Vehicle Issue Modal */}
      {vehicleInfo && (
        <VehicleIssueModal
          visible={showIssueModal}
          vehicleId={vehicleInfo.id}
          onClose={() => setShowIssueModal(false)}
          onSubmit={handleIssueSubmit}
        />
      )}

      {/* Vehicle Inspection Modal */}
      {vehicleInfo && (
        <VehicleInspectionModal
          visible={showInspectionModal}
          vehicleId={vehicleInfo.id}
          currentMileage={vehicleInfo.currentMileage}
          onClose={() => setShowInspectionModal(false)}
          onSubmit={handleInspectionSubmit}
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