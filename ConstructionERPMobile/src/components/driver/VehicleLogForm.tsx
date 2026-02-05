// VehicleLogForm - Maintenance and fuel logging for vehicles
// Requirements: 12.1, 12.2, 12.3, 12.4, 12.5

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { VehicleInfo, GeoLocation } from '../../types';
import { ConstructionButton, ConstructionCard, ConstructionInput, ConstructionSelector } from '../common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface VehicleLogFormProps {
  vehicleInfo: VehicleInfo;
  currentLocation: GeoLocation | null;
  onFuelLogSubmit: (fuelData: FuelLogEntry) => void;
  onMaintenanceLogSubmit: (maintenanceData: MaintenanceLogEntry) => void;
  onVehicleIssueReport: (issueData: VehicleIssueReport) => void;
  isLoading?: boolean;
}

interface FuelLogEntry {
  vehicleId: number;
  date: string;
  amount: number;
  cost: number;
  mileage: number;
  location: string;
  fuelType: 'diesel' | 'petrol' | 'electric';
  notes?: string;
}

interface MaintenanceLogEntry {
  vehicleId: number;
  date: string;
  maintenanceType: 'oil_change' | 'tire_rotation' | 'inspection' | 'major_service' | 'repair' | 'cleaning';
  description: string;
  cost?: number;
  mileage: number;
  serviceProvider?: string;
  nextServiceDue?: string;
  notes?: string;
}

interface VehicleIssueReport {
  vehicleId: number;
  issueType: 'mechanical' | 'electrical' | 'body_damage' | 'tire_issue' | 'fluid_leak' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: GeoLocation;
  affectsOperation: boolean;
  immediateAttentionRequired: boolean;
  timestamp: string;
  photos?: string[];
}

const VehicleLogForm: React.FC<VehicleLogFormProps> = ({
  vehicleInfo,
  currentLocation,
  onFuelLogSubmit,
  onMaintenanceLogSubmit,
  onVehicleIssueReport,
  isLoading = false,
}) => {
  const [selectedLogType, setSelectedLogType] = useState<'fuel' | 'maintenance' | 'issue'>('fuel');
  
  // Fuel log state
  const [fuelAmount, setFuelAmount] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [fuelMileage, setFuelMileage] = useState(vehicleInfo.currentMileage.toString());
  const [fuelLocation, setFuelLocation] = useState('');
  const [fuelType, setFuelType] = useState<FuelLogEntry['fuelType']>('diesel');
  const [fuelNotes, setFuelNotes] = useState('');

  // Maintenance log state
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceLogEntry['maintenanceType']>('oil_change');
  const [maintenanceDescription, setMaintenanceDescription] = useState('');
  const [maintenanceCost, setMaintenanceCost] = useState('');
  const [maintenanceMileage, setMaintenanceMileage] = useState(vehicleInfo.currentMileage.toString());
  const [serviceProvider, setServiceProvider] = useState('');
  const [nextServiceDue, setNextServiceDue] = useState('');
  const [maintenanceNotes, setMaintenanceNotes] = useState('');

  // Issue report state
  const [issueType, setIssueType] = useState<VehicleIssueReport['issueType']>('mechanical');
  const [issueSeverity, setIssueSeverity] = useState<VehicleIssueReport['severity']>('low');
  const [issueDescription, setIssueDescription] = useState('');
  const [affectsOperation, setAffectsOperation] = useState(false);
  const [immediateAttention, setImmediateAttention] = useState(false);

  // Options for selectors
  const fuelTypeOptions = [
    { value: 'diesel', label: '⛽ Diesel' },
    { value: 'petrol', label: '⛽ Petrol' },
    { value: 'electric', label: '🔋 Electric' },
  ];

  const maintenanceTypeOptions = [
    { value: 'oil_change', label: '🛢️ Oil Change' },
    { value: 'tire_rotation', label: '🛞 Tire Rotation' },
    { value: 'inspection', label: '🔍 Inspection' },
    { value: 'major_service', label: '🔧 Major Service' },
    { value: 'repair', label: '🛠️ Repair' },
    { value: 'cleaning', label: '🧽 Cleaning' },
  ];

  const issueTypeOptions = [
    { value: 'mechanical', label: '🔧 Mechanical' },
    { value: 'electrical', label: '⚡ Electrical' },
    { value: 'body_damage', label: '🚗 Body Damage' },
    { value: 'tire_issue', label: '🛞 Tire Issue' },
    { value: 'fluid_leak', label: '💧 Fluid Leak' },
    { value: 'other', label: '❓ Other' },
  ];

  const severityOptions = [
    { value: 'low', label: '🟢 Low - Minor Issue' },
    { value: 'medium', label: '🟡 Medium - Needs Attention' },
    { value: 'high', label: '🟠 High - Urgent' },
    { value: 'critical', label: '🔴 Critical - Stop Operation' },
  ];

  // Handle fuel log submission
  const handleFuelLogSubmit = () => {
    if (!fuelAmount || !fuelCost || !fuelMileage || !fuelLocation.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fuel log fields');
      return;
    }

    const fuelData: FuelLogEntry = {
      vehicleId: vehicleInfo.id,
      date: new Date().toISOString(),
      amount: parseFloat(fuelAmount),
      cost: parseFloat(fuelCost),
      mileage: parseInt(fuelMileage),
      location: fuelLocation.trim(),
      fuelType,
      notes: fuelNotes.trim() || undefined,
    };

    Alert.alert(
      'Submit Fuel Log',
      `Log ${fuelAmount}L of ${fuelType} for $${fuelCost} at ${fuelLocation}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            onFuelLogSubmit(fuelData);
            // Reset form
            setFuelAmount('');
            setFuelCost('');
            setFuelLocation('');
            setFuelNotes('');
            Alert.alert('Success', 'Fuel log submitted successfully');
          },
        },
      ]
    );
  };

  // Handle maintenance log submission
  const handleMaintenanceLogSubmit = () => {
    if (!maintenanceDescription.trim() || !maintenanceMileage) {
      Alert.alert('Missing Information', 'Please fill in all required maintenance fields');
      return;
    }

    const maintenanceData: MaintenanceLogEntry = {
      vehicleId: vehicleInfo.id,
      date: new Date().toISOString(),
      maintenanceType,
      description: maintenanceDescription.trim(),
      cost: maintenanceCost ? parseFloat(maintenanceCost) : undefined,
      mileage: parseInt(maintenanceMileage),
      serviceProvider: serviceProvider.trim() || undefined,
      nextServiceDue: nextServiceDue || undefined,
      notes: maintenanceNotes.trim() || undefined,
    };

    Alert.alert(
      'Submit Maintenance Log',
      `Log ${maintenanceType.replace('_', ' ')} maintenance?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            onMaintenanceLogSubmit(maintenanceData);
            // Reset form
            setMaintenanceDescription('');
            setMaintenanceCost('');
            setServiceProvider('');
            setNextServiceDue('');
            setMaintenanceNotes('');
            Alert.alert('Success', 'Maintenance log submitted successfully');
          },
        },
      ]
    );
  };

  // Handle issue report submission
  const handleIssueReportSubmit = () => {
    if (!issueDescription.trim() || !currentLocation) {
      Alert.alert('Missing Information', 'Please provide issue description and ensure GPS is available');
      return;
    }

    const issueData: VehicleIssueReport = {
      vehicleId: vehicleInfo.id,
      issueType,
      severity: issueSeverity,
      description: issueDescription.trim(),
      location: currentLocation,
      affectsOperation,
      immediateAttentionRequired: immediateAttention,
      timestamp: new Date().toISOString(),
    };

    Alert.alert(
      'Report Vehicle Issue',
      `Report ${issueSeverity} ${issueType.replace('_', ' ')} issue?${immediateAttention ? ' Immediate attention will be requested.' : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: issueSeverity === 'critical' ? 'destructive' : 'default',
          onPress: () => {
            onVehicleIssueReport(issueData);
            // Reset form
            setIssueDescription('');
            setAffectsOperation(false);
            setImmediateAttention(false);
            Alert.alert('Success', 'Vehicle issue reported successfully');
          },
        },
      ]
    );
  };

  return (
    <ConstructionCard title={`Vehicle Log - ${vehicleInfo.plateNumber}`} variant="elevated">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Vehicle Info */}
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleTitle}>
            {vehicleInfo.model} ({vehicleInfo.year})
          </Text>
          <Text style={styles.vehicleDetails}>
            Plate: {vehicleInfo.plateNumber} | Mileage: {vehicleInfo.currentMileage.toLocaleString()} km
          </Text>
          <Text style={styles.vehicleDetails}>
            Fuel Level: {vehicleInfo.fuelLevel}% | Capacity: {vehicleInfo.capacity} passengers
          </Text>
        </View>

        {/* Log Type Selector */}
        <View style={styles.logTypeSelector}>
          <Text style={styles.sectionTitle}>Select Log Type</Text>
          <View style={styles.logTypeButtons}>
            <TouchableOpacity
              style={[
                styles.logTypeButton,
                selectedLogType === 'fuel' && styles.logTypeButtonActive
              ]}
              onPress={() => setSelectedLogType('fuel')}
            >
              <Text style={[
                styles.logTypeButtonText,
                selectedLogType === 'fuel' && styles.logTypeButtonTextActive
              ]}>
                ⛽ Fuel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.logTypeButton,
                selectedLogType === 'maintenance' && styles.logTypeButtonActive
              ]}
              onPress={() => setSelectedLogType('maintenance')}
            >
              <Text style={[
                styles.logTypeButtonText,
                selectedLogType === 'maintenance' && styles.logTypeButtonTextActive
              ]}>
                🔧 Maintenance
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.logTypeButton,
                selectedLogType === 'issue' && styles.logTypeButtonActive
              ]}
              onPress={() => setSelectedLogType('issue')}
            >
              <Text style={[
                styles.logTypeButtonText,
                selectedLogType === 'issue' && styles.logTypeButtonTextActive
              ]}>
                🚨 Issue
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fuel Log Form */}
        {selectedLogType === 'fuel' && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Fuel Log Entry</Text>
            
            <ConstructionSelector
              label="Fuel Type"
              value={fuelType}
              onValueChange={(value) => setFuelType(value as FuelLogEntry['fuelType'])}
              options={fuelTypeOptions}
              required
            />

            <ConstructionInput
              label="Amount (Liters)"
              value={fuelAmount}
              onChangeText={setFuelAmount}
              placeholder="Enter fuel amount..."
              keyboardType="numeric"
              required
            />

            <ConstructionInput
              label="Cost ($)"
              value={fuelCost}
              onChangeText={setFuelCost}
              placeholder="Enter total cost..."
              keyboardType="numeric"
              required
            />

            <ConstructionInput
              label="Current Mileage (km)"
              value={fuelMileage}
              onChangeText={setFuelMileage}
              placeholder="Enter current mileage..."
              keyboardType="numeric"
              required
            />

            <ConstructionInput
              label="Location"
              value={fuelLocation}
              onChangeText={setFuelLocation}
              placeholder="Enter fuel station location..."
              required
            />

            <ConstructionInput
              label="Notes (Optional)"
              value={fuelNotes}
              onChangeText={setFuelNotes}
              placeholder="Add any additional notes..."
              multiline
              numberOfLines={2}
            />

            <ConstructionButton
              title="⛽ Submit Fuel Log"
              onPress={handleFuelLogSubmit}
              variant="primary"
              size="medium"
              fullWidth
              loading={isLoading}
            />
          </View>
        )}

        {/* Maintenance Log Form */}
        {selectedLogType === 'maintenance' && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Maintenance Log Entry</Text>
            
            <ConstructionSelector
              label="Maintenance Type"
              value={maintenanceType}
              onValueChange={(value) => setMaintenanceType(value as MaintenanceLogEntry['maintenanceType'])}
              options={maintenanceTypeOptions}
              required
            />

            <ConstructionInput
              label="Description"
              value={maintenanceDescription}
              onChangeText={setMaintenanceDescription}
              placeholder="Describe the maintenance performed..."
              multiline
              numberOfLines={3}
              required
            />

            <ConstructionInput
              label="Current Mileage (km)"
              value={maintenanceMileage}
              onChangeText={setMaintenanceMileage}
              placeholder="Enter current mileage..."
              keyboardType="numeric"
              required
            />

            <ConstructionInput
              label="Cost ($ - Optional)"
              value={maintenanceCost}
              onChangeText={setMaintenanceCost}
              placeholder="Enter maintenance cost..."
              keyboardType="numeric"
            />

            <ConstructionInput
              label="Service Provider (Optional)"
              value={serviceProvider}
              onChangeText={setServiceProvider}
              placeholder="Enter service provider name..."
            />

            <ConstructionInput
              label="Next Service Due (Optional)"
              value={nextServiceDue}
              onChangeText={setNextServiceDue}
              placeholder="Enter next service date or mileage..."
            />

            <ConstructionInput
              label="Notes (Optional)"
              value={maintenanceNotes}
              onChangeText={setMaintenanceNotes}
              placeholder="Add any additional notes..."
              multiline
              numberOfLines={2}
            />

            <ConstructionButton
              title="🔧 Submit Maintenance Log"
              onPress={handleMaintenanceLogSubmit}
              variant="secondary"
              size="medium"
              fullWidth
              loading={isLoading}
            />
          </View>
        )}

        {/* Issue Report Form */}
        {selectedLogType === 'issue' && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Vehicle Issue Report</Text>
            
            <ConstructionSelector
              label="Issue Type"
              value={issueType}
              onValueChange={(value) => setIssueType(value as VehicleIssueReport['issueType'])}
              options={issueTypeOptions}
              required
            />

            <ConstructionSelector
              label="Severity"
              value={issueSeverity}
              onValueChange={(value) => setIssueSeverity(value as VehicleIssueReport['severity'])}
              options={severityOptions}
              required
            />

            <ConstructionInput
              label="Issue Description"
              value={issueDescription}
              onChangeText={setIssueDescription}
              placeholder="Describe the issue in detail..."
              multiline
              numberOfLines={4}
              required
            />

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAffectsOperation(!affectsOperation)}
            >
              <Text style={styles.checkbox}>
                {affectsOperation ? '☑️' : '☐'}
              </Text>
              <Text style={styles.checkboxLabel}>
                This issue affects vehicle operation
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setImmediateAttention(!immediateAttention)}
            >
              <Text style={styles.checkbox}>
                {immediateAttention ? '☑️' : '☐'}
              </Text>
              <Text style={styles.checkboxLabel}>
                Requires immediate attention
              </Text>
            </TouchableOpacity>

            <ConstructionButton
              title="🚨 Report Issue"
              onPress={handleIssueReportSubmit}
              variant={issueSeverity === 'critical' ? 'error' : 'warning'}
              size="medium"
              fullWidth
              loading={isLoading}
            />
          </View>
        )}

        {/* Recent Maintenance Schedule */}
        <View style={styles.maintenanceSchedule}>
          <Text style={styles.sectionTitle}>📅 Upcoming Maintenance</Text>
          {vehicleInfo.maintenanceSchedule.slice(0, 3).map((maintenance, index) => (
            <View key={index} style={styles.maintenanceItem}>
              <Text style={styles.maintenanceType}>
                {maintenance.type.replace('_', ' ').toUpperCase()}
              </Text>
              <Text style={styles.maintenanceDetails}>
                Due: {maintenance.dueDate} | {maintenance.dueMileage.toLocaleString()} km
              </Text>
              <Text style={[
                styles.maintenanceStatus,
                { color: maintenance.status === 'overdue' ? ConstructionTheme.colors.error : 
                         maintenance.status === 'due' ? ConstructionTheme.colors.warning : 
                         ConstructionTheme.colors.success }
              ]}>
                Status: {maintenance.status.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>

        {/* Location Info */}
        <View style={styles.locationInfo}>
          <Text style={styles.locationTitle}>📍 Current Location</Text>
          {currentLocation ? (
            <>
              <Text style={styles.locationText}>
                Lat: {currentLocation.latitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                Lng: {currentLocation.longitude.toFixed(6)}
              </Text>
            </>
          ) : (
            <Text style={styles.locationError}>
              ⚠️ GPS location not available
            </Text>
          )}
        </View>
      </ScrollView>
    </ConstructionCard>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 600,
  },
  vehicleInfo: {
    marginBottom: ConstructionTheme.spacing.lg,
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.primaryContainer,
    borderRadius: ConstructionTheme.borderRadius.md,
  },
  vehicleTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onPrimaryContainer,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  vehicleDetails: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onPrimaryContainer,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  logTypeSelector: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  sectionTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onBackground,
    marginBottom: ConstructionTheme.spacing.md,
  },
  logTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logTypeButton: {
    flex: 1,
    padding: ConstructionTheme.spacing.md,
    margin: ConstructionTheme.spacing.xs,
    backgroundColor: ConstructionTheme.colors.surface,
    borderRadius: ConstructionTheme.borderRadius.md,
    borderWidth: 2,
    borderColor: ConstructionTheme.colors.neutral,
    alignItems: 'center',
  },
  logTypeButtonActive: {
    backgroundColor: ConstructionTheme.colors.primaryContainer,
    borderColor: ConstructionTheme.colors.primary,
  },
  logTypeButtonText: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    textAlign: 'center',
  },
  logTypeButtonTextActive: {
    color: ConstructionTheme.colors.onPrimaryContainer,
    fontWeight: 'bold',
  },
  formSection: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.md,
    padding: ConstructionTheme.spacing.sm,
  },
  checkbox: {
    fontSize: ConstructionTheme.dimensions.iconMedium,
    marginRight: ConstructionTheme.spacing.sm,
  },
  checkboxLabel: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    flex: 1,
  },
  maintenanceSchedule: {
    marginBottom: ConstructionTheme.spacing.lg,
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.md,
  },
  maintenanceItem: {
    marginBottom: ConstructionTheme.spacing.md,
    paddingBottom: ConstructionTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.neutral,
  },
  maintenanceType: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
    fontWeight: 'bold',
  },
  maintenanceDetails: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  maintenanceStatus: {
    ...ConstructionTheme.typography.bodySmall,
    fontWeight: 'bold',
  },
  locationInfo: {
    marginTop: ConstructionTheme.spacing.lg,
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.md,
  },
  locationTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  locationText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  locationError: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.error,
    fontWeight: 'bold',
  },
});

export default VehicleLogForm;