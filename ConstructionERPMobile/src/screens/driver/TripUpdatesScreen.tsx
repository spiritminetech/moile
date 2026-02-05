// TripUpdatesScreen - Real-time trip status reporting interface for drivers
// Requirements: 10.1, 10.2, 10.3, 10.4, 10.5

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useAuth } from '../../store/context/AuthContext';
import { useLocation } from '../../store/context/LocationContext';
import { useOffline } from '../../store/context/OfflineContext';
import { driverApiService } from '../../services/api/DriverApiService';
import { 
  TransportTask, 
  GeoLocation 
} from '../../types';

// Import driver-specific components
import TripStatusUpdateForm from '../../components/driver/TripStatusUpdateForm';

// Import common components
import { 
  ConstructionButton, 
  ConstructionCard, 
  ConstructionLoadingIndicator,
  ErrorDisplay,
  OfflineIndicator 
} from '../../components/common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface TripStatusUpdate {
  taskId: number;
  status: 'pending' | 'en_route_pickup' | 'pickup_complete' | 'en_route_dropoff' | 'completed';
  location: GeoLocation;
  timestamp: string;
  notes?: string;
  workerCount?: number;
}

interface DelayReport {
  taskId: number;
  delayReason: string;
  estimatedDelay: number; // in minutes
  location: GeoLocation;
  description: string;
  timestamp: string;
}

interface BreakdownReport {
  taskId: number;
  breakdownType: 'mechanical' | 'accident' | 'traffic' | 'weather' | 'other';
  severity: 'minor' | 'major' | 'critical';
  location: GeoLocation;
  description: string;
  assistanceRequired: boolean;
  timestamp: string;
}

interface TripPhotoData {
  taskId: number;
  photoUri: string;
  category: 'pickup' | 'dropoff' | 'incident' | 'delay' | 'completion';
  description: string;
  location: GeoLocation;
  timestamp: string;
}

interface SupervisorContact {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: string;
}

const TripUpdatesScreen: React.FC = () => {
  const { state: authState } = useAuth();
  const { state: locationState, getCurrentLocation } = useLocation();
  const { isOffline } = useOffline();

  // Transport tasks state
  const [transportTasks, setTransportTasks] = useState<TransportTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<TransportTask | null>(null);
  const [supervisorContacts, setSupervisorContacts] = useState<SupervisorContact[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Load transport tasks
  const loadTransportTasks = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      console.log('🚛 Loading transport tasks for trip updates...');

      const response = await driverApiService.getTodaysTransportTasks();
      if (response.success && response.data) {
        setTransportTasks(response.data);
        
        // Auto-select first active task if none selected
        if (!selectedTask) {
          const activeTask = response.data.find(task => 
            task.status !== 'completed'
          );
          if (activeTask) {
            setSelectedTask(activeTask);
          }
        } else {
          // Update selected task with latest data
          const updatedTask = response.data.find(task => task.taskId === selectedTask.taskId);
          if (updatedTask) {
            setSelectedTask(updatedTask);
          }
        }
        
        console.log('✅ Transport tasks loaded:', response.data.length);
      }

      setLastUpdated(new Date());

    } catch (error: any) {
      console.error('❌ Transport tasks loading error:', error);
      setError(error.message || 'Failed to load transport tasks');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedTask]);

  // Load supervisor contacts
  const loadSupervisorContacts = useCallback(async () => {
    try {
      console.log('👥 Loading supervisor contacts...');
      
      // Mock supervisor contacts - in real implementation, would call API
      const mockContacts: SupervisorContact[] = [
        {
          id: 1,
          name: 'John Smith',
          phone: '+1234567890',
          email: 'john.smith@construction.com',
          role: 'Site Supervisor'
        },
        {
          id: 2,
          name: 'Sarah Johnson',
          phone: '+1234567891',
          email: 'sarah.johnson@construction.com',
          role: 'Transport Coordinator'
        },
        {
          id: 3,
          name: 'Emergency Dispatch',
          phone: '+1234567999',
          role: 'Emergency Contact'
        }
      ];
      
      setSupervisorContacts(mockContacts);
      console.log('✅ Supervisor contacts loaded:', mockContacts.length);
      
    } catch (error: any) {
      console.error('❌ Supervisor contacts loading error:', error);
      // Don't fail the screen if contacts can't be loaded
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadTransportTasks();
    loadSupervisorContacts();
  }, [loadTransportTasks, loadSupervisorContacts]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadTransportTasks(false);
  }, [loadTransportTasks]);

  // Handle task selection
  const handleTaskSelection = useCallback((task: TransportTask) => {
    setSelectedTask(task);
  }, []);

  // Handle status update
  const handleStatusUpdate = useCallback(async (updateData: TripStatusUpdate) => {
    try {
      setIsUpdatingStatus(true);
      console.log('📊 Updating trip status:', updateData);

      const response = await driverApiService.updateTransportTaskStatus(
        updateData.taskId,
        updateData.status,
        updateData.location,
        updateData.notes
      );

      if (response.success) {
        Alert.alert('Success', 'Trip status updated successfully!');
        
        // Update local task data
        if (selectedTask && selectedTask.taskId === updateData.taskId) {
          setSelectedTask({ ...selectedTask, status: updateData.status });
        }
        
        // Update tasks list
        const updatedTasks = transportTasks.map(task => 
          task.taskId === updateData.taskId ? { ...task, status: updateData.status } : task
        );
        setTransportTasks(updatedTasks);
        
        // Refresh to get latest data
        handleRefresh();
      }
    } catch (error: any) {
      console.error('❌ Status update error:', error);
      Alert.alert('Error', error.message || 'Failed to update trip status');
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [selectedTask, transportTasks, handleRefresh]);

  // Handle delay report
  const handleDelayReport = useCallback(async (delayData: DelayReport) => {
    try {
      console.log('⏰ Reporting delay:', delayData);

      const response = await driverApiService.reportDelay(delayData.taskId, {
        reason: delayData.delayReason,
        estimatedDelay: delayData.estimatedDelay,
        location: delayData.location,
        description: delayData.description,
      });

      if (response.success) {
        Alert.alert(
          'Delay Reported',
          `Delay of ${delayData.estimatedDelay} minutes has been reported. Supervisors have been notified.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Optionally call supervisor
                Alert.alert(
                  'Contact Supervisor?',
                  'Would you like to call your supervisor about this delay?',
                  [
                    { text: 'Not Now', style: 'cancel' },
                    {
                      text: 'Call Supervisor',
                      onPress: () => handleCallSupervisor(),
                    },
                  ]
                );
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ Delay report error:', error);
      Alert.alert('Error', error.message || 'Failed to report delay');
    }
  }, []);

  // Handle breakdown report
  const handleBreakdownReport = useCallback(async (breakdownData: BreakdownReport) => {
    try {
      console.log('🚨 Reporting breakdown:', breakdownData);

      const response = await driverApiService.reportBreakdown(breakdownData.taskId, {
        description: breakdownData.description,
        severity: breakdownData.severity,
        location: breakdownData.location,
        assistanceRequired: breakdownData.assistanceRequired,
      });

      if (response.success) {
        const alertTitle = breakdownData.severity === 'critical' ? 'Emergency Reported' : 'Breakdown Reported';
        const alertMessage = breakdownData.assistanceRequired 
          ? `${breakdownData.severity.toUpperCase()} breakdown reported. Emergency assistance has been requested and is on the way.`
          : `${breakdownData.severity.toUpperCase()} breakdown reported. Supervisors have been notified.`;

        Alert.alert(
          alertTitle,
          alertMessage,
          [
            {
              text: 'OK',
              onPress: () => {
                if (breakdownData.severity === 'critical' || breakdownData.assistanceRequired) {
                  // Automatically offer to call emergency contact
                  handleCallEmergencyContact();
                } else {
                  // Offer to call supervisor
                  Alert.alert(
                    'Contact Supervisor?',
                    'Would you like to call your supervisor about this breakdown?',
                    [
                      { text: 'Not Now', style: 'cancel' },
                      {
                        text: 'Call Supervisor',
                        onPress: () => handleCallSupervisor(),
                      },
                    ]
                  );
                }
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ Breakdown report error:', error);
      Alert.alert('Error', error.message || 'Failed to report breakdown');
    }
  }, []);

  // Handle photo upload
  const handlePhotoUpload = useCallback(async (photoData: TripPhotoData) => {
    try {
      console.log('📸 Uploading trip photo:', photoData);

      // Mock photo upload - in real implementation, would upload actual photo
      Alert.alert(
        'Photo Upload',
        'Photo documentation has been saved and will be uploaded when connection is available.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Optionally add to trip notes or send to supervisor
              Alert.alert(
                'Share with Supervisor?',
                'Would you like to notify your supervisor about this photo?',
                [
                  { text: 'Not Now', style: 'cancel' },
                  {
                    text: 'Notify Supervisor',
                    onPress: () => handleNotifySupervisor(photoData.description),
                  },
                ]
              );
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Photo upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload photo');
    }
  }, []);

  // Communication handlers
  const handleCallSupervisor = useCallback(() => {
    const supervisor = supervisorContacts.find(contact => contact.role === 'Site Supervisor');
    if (supervisor) {
      const url = `tel:${supervisor.phone}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open phone app');
      });
    } else {
      Alert.alert('No Contact', 'No supervisor contact available');
    }
  }, [supervisorContacts]);

  const handleCallEmergencyContact = useCallback(() => {
    const emergency = supervisorContacts.find(contact => contact.role === 'Emergency Contact');
    if (emergency) {
      Alert.alert(
        'Call Emergency Contact',
        `Call ${emergency.name} at ${emergency.phone}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Call Now',
            style: 'destructive',
            onPress: () => {
              const url = `tel:${emergency.phone}`;
              Linking.openURL(url).catch(() => {
                Alert.alert('Error', 'Could not open phone app');
              });
            },
          },
        ]
      );
    } else {
      Alert.alert('No Contact', 'No emergency contact available');
    }
  }, [supervisorContacts]);

  const handleNotifySupervisor = useCallback((message: string) => {
    const supervisor = supervisorContacts.find(contact => contact.role === 'Site Supervisor');
    if (supervisor && supervisor.email) {
      const subject = `Trip Update - ${selectedTask?.route || 'Transport Task'}`;
      const body = `Driver Update:\n\n${message}\n\nLocation: ${locationState.currentLocation?.latitude}, ${locationState.currentLocation?.longitude}\nTime: ${new Date().toLocaleString()}`;
      
      const url = `mailto:${supervisor.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      Linking.openURL(url).catch(() => {
        // Fallback to SMS
        const smsUrl = `sms:${supervisor.phone}?body=${encodeURIComponent(`Trip Update: ${message}`)}`;
        Linking.openURL(smsUrl).catch(() => {
          Alert.alert('Error', 'Could not open messaging app');
        });
      });
    } else {
      Alert.alert('No Contact', 'No supervisor email available');
    }
  }, [supervisorContacts, selectedTask, locationState.currentLocation]);

  const handleSendMessage = useCallback((contactId: number) => {
    const contact = supervisorContacts.find(c => c.id === contactId);
    if (contact) {
      const message = `Driver ${authState.user?.name || 'Unknown'} - Trip Update for ${selectedTask?.route || 'Transport Task'}`;
      const url = `sms:${contact.phone}?body=${encodeURIComponent(message)}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open messaging app');
      });
    }
  }, [supervisorContacts, authState.user, selectedTask]);

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Trip Updates</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ConstructionLoadingIndicator 
            message="Loading trip updates..."
            size="large"
          />
        </View>
      </View>
    );
  }

  // Render error state
  if (error && transportTasks.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Trip Updates</Text>
        </View>
        <View style={styles.errorContainer}>
          <ErrorDisplay 
            error={error}
            onRetry={() => loadTransportTasks()}
            showRetry={!isOffline}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Trip Updates</Text>
          <Text style={styles.subtitle}>
            Real-time Status & Reporting
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
        {/* Task Selection */}
        {transportTasks.length > 0 && (
          <ConstructionCard title="Select Transport Task" variant="outlined" style={styles.taskSelectionCard}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.taskSelector}>
              {transportTasks.map((task) => (
                <TouchableOpacity
                  key={task.taskId}
                  style={[
                    styles.taskOption,
                    selectedTask?.taskId === task.taskId && styles.taskOptionSelected
                  ]}
                  onPress={() => handleTaskSelection(task)}
                >
                  <Text style={[
                    styles.taskOptionText,
                    selectedTask?.taskId === task.taskId && styles.taskOptionTextSelected
                  ]}>
                    🚛 {task.route}
                  </Text>
                  <Text style={[
                    styles.taskOptionStatus,
                    selectedTask?.taskId === task.taskId && styles.taskOptionStatusSelected
                  ]}>
                    {task.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ConstructionCard>
        )}

        {/* Trip Status Update Form */}
        {selectedTask ? (
          <TripStatusUpdateForm
            transportTask={selectedTask}
            currentLocation={locationState.currentLocation}
            onStatusUpdate={handleStatusUpdate}
            onDelayReport={handleDelayReport}
            onBreakdownReport={handleBreakdownReport}
            onPhotoUpload={handlePhotoUpload}
            isLoading={isUpdatingStatus}
          />
        ) : (
          <ConstructionCard variant="outlined" style={styles.noTaskCard}>
            <Text style={styles.noTaskText}>📋 No active transport task</Text>
            <Text style={styles.noTaskSubtext}>
              {transportTasks.length === 0 
                ? 'No transport tasks available today'
                : 'Select a transport task above to begin updates'
              }
            </Text>
          </ConstructionCard>
        )}

        {/* Communication Panel */}
        {supervisorContacts.length > 0 && (
          <ConstructionCard title="Communication" variant="elevated" style={styles.communicationCard}>
            <Text style={styles.communicationTitle}>📞 Quick Contact</Text>
            <View style={styles.contactsList}>
              {supervisorContacts.map((contact) => (
                <View key={contact.id} style={styles.contactItem}>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactRole}>{contact.role}</Text>
                    <Text style={styles.contactPhone}>{contact.phone}</Text>
                  </View>
                  <View style={styles.contactActions}>
                    <TouchableOpacity
                      style={styles.contactButton}
                      onPress={() => {
                        const url = `tel:${contact.phone}`;
                        Linking.openURL(url).catch(() => {
                          Alert.alert('Error', 'Could not open phone app');
                        });
                      }}
                    >
                      <Text style={styles.contactButtonText}>📞</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.contactButton}
                      onPress={() => handleSendMessage(contact.id)}
                    >
                      <Text style={styles.contactButtonText}>💬</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
            
            {/* Emergency Actions */}
            <View style={styles.emergencyActions}>
              <ConstructionButton
                title="🚨 Emergency Assistance"
                onPress={handleCallEmergencyContact}
                variant="error"
                size="medium"
                fullWidth
                style={styles.emergencyButton}
              />
            </View>
          </ConstructionCard>
        )}

        {/* Current Location Info */}
        <ConstructionCard title="Location Information" variant="outlined" style={styles.locationCard}>
          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle}>📍 Current Location</Text>
            {locationState.currentLocation ? (
              <>
                <Text style={styles.locationText}>
                  Latitude: {locationState.currentLocation.latitude.toFixed(6)}
                </Text>
                <Text style={styles.locationText}>
                  Longitude: {locationState.currentLocation.longitude.toFixed(6)}
                </Text>
                <Text style={styles.locationText}>
                  Accuracy: {Math.round(locationState.currentLocation.accuracy)}m
                </Text>
                <Text style={styles.locationText}>
                  Updated: {locationState.currentLocation.timestamp.toLocaleTimeString()}
                </Text>
              </>
            ) : (
              <Text style={styles.locationError}>
                ⚠️ GPS location not available
              </Text>
            )}
            
            <ConstructionButton
              title="🔄 Refresh Location"
              onPress={getCurrentLocation}
              variant="secondary"
              size="small"
              style={styles.refreshLocationButton}
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
    </View>
  );
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
  taskSelectionCard: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  taskSelector: {
    flexDirection: 'row',
  },
  taskOption: {
    minWidth: 150,
    padding: ConstructionTheme.spacing.md,
    marginRight: ConstructionTheme.spacing.sm,
    backgroundColor: ConstructionTheme.colors.surface,
    borderRadius: ConstructionTheme.borderRadius.md,
    borderWidth: 2,
    borderColor: ConstructionTheme.colors.outline,
    alignItems: 'center',
  },
  taskOptionSelected: {
    backgroundColor: ConstructionTheme.colors.surface,
    borderColor: ConstructionTheme.colors.primary,
  },
  taskOptionText: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.xs,
    textAlign: 'center',
  },
  taskOptionTextSelected: {
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
  },
  taskOptionStatus: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  taskOptionStatusSelected: {
    color: ConstructionTheme.colors.primary,
  },
  noTaskCard: {
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.xl,
    marginBottom: ConstructionTheme.spacing.lg,
  },
  noTaskText: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  noTaskSubtext: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  communicationCard: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  communicationTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.md,
    textAlign: 'center',
  },
  contactsList: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.sm,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: 'bold',
  },
  contactRole: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  contactPhone: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
  },
  contactButton: {
    backgroundColor: ConstructionTheme.colors.primary,
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginLeft: ConstructionTheme.spacing.sm,
  },
  contactButtonText: {
    fontSize: ConstructionTheme.dimensions.iconMedium,
  },
  emergencyActions: {
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline,
    paddingTop: ConstructionTheme.spacing.md,
  },
  emergencyButton: {
    marginBottom: ConstructionTheme.spacing.sm,
  },
  locationCard: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  locationInfo: {
    alignItems: 'center',
  },
  locationTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
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
    marginBottom: ConstructionTheme.spacing.md,
  },
  refreshLocationButton: {
    marginTop: ConstructionTheme.spacing.md,
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
  bottomSpacing: {
    height: ConstructionTheme.spacing.xl,
  },
});

export default TripUpdatesScreen;