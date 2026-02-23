import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Project } from '../../types';

interface ProjectInfoCardProps {
  project: Project | null;
  isLoading: boolean;
}

const ProjectInfoCard: React.FC<ProjectInfoCardProps> = ({ project, isLoading }) => {
  const handleCallSupervisor = (phone: string, name: string) => {
    Alert.alert(
      'Call Supervisor',
      `Call ${name} at ${phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => {
            Linking.openURL(`tel:${phone}`).catch(() => {
              Alert.alert('Error', 'Could not open phone app');
            });
          }
        },
      ]
    );
  };

  const handleEmailSupervisor = (email: string, name: string) => {
    const subject = encodeURIComponent('Work Site Query');
    const body = encodeURIComponent(`Hello ${name},\n\nI have a question regarding today's work.\n\nBest regards`);
    
    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`).catch(() => {
      Alert.alert('Error', 'Could not open email app');
    });
  };

  const getGeofenceStatus = (project: Project) => {
    // This would typically check current location against geofence
    // For now, we'll show the geofence information
    return {
      isInside: true, // This would be calculated based on current location
      distance: 0, // Distance from center in meters
    };
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading project information...</Text>
        </View>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.container}>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataIcon}>🏗️</Text>
          <Text style={styles.noDataText}>No project assigned today</Text>
          <Text style={styles.noDataSubtext}>Check with your supervisor for today's assignment</Text>
        </View>
      </View>
    );
  }

  const geofenceStatus = getGeofenceStatus(project);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📍 Today's Project & Site</Text>
        <View style={[styles.statusBadge, styles[`status_${project.status}`]]}>
          <Text style={styles.statusText}>{project.status.toUpperCase()}</Text>
        </View>
      </View>
      
      {/* Project Information */}
      <View style={styles.projectSection}>
        <Text style={styles.projectName}>{project.name}</Text>
        {project.description ? (
          <Text style={styles.projectDescription}>{String(project.description)}</Text>
        ) : null}
      </View>
      
      {/* Site Location */}
      <View style={styles.locationContainer}>
        <Text style={styles.sectionTitle}>🏢 Site Location</Text>
        <View style={styles.locationDetails}>
          <Text style={styles.locationIcon}>📍</Text>
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>{project.location.address}</Text>
            {project.location.landmarks && project.location.landmarks.length > 0 ? (
              <Text style={styles.landmarksText}>
                Near: {project.location.landmarks.join(', ')}
              </Text>
            ) : null}
            {project.location.accessInstructions ? (
              <Text style={styles.accessInstructions}>
                Access: {String(project.location.accessInstructions)}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* Geo-fenced Work Area */}
      <View style={styles.geofenceContainer}>
        <Text style={styles.sectionTitle}>🎯 Geo-fenced Work Area</Text>
        <View style={styles.geofenceDetails}>
          <View style={styles.geofenceRow}>
            <Text style={styles.geofenceLabel}>Work Area Radius:</Text>
            <Text style={styles.geofenceValue}>{String(project.geofence.radius)}m</Text>
          </View>
          <View style={styles.geofenceRow}>
            <Text style={styles.geofenceLabel}>GPS Accuracy Required:</Text>
            <Text style={styles.geofenceValue}>≤{String(project.geofence.allowedAccuracy)}m</Text>
          </View>
          <View style={styles.geofenceRow}>
            <Text style={styles.geofenceLabel}>Current Status:</Text>
            <View style={[styles.geofenceStatusBadge, geofenceStatus.isInside ? styles.insideGeofence : styles.outsideGeofence]}>
              <Text style={styles.geofenceStatusText}>
                {geofenceStatus.isInside ? '✅ Inside Work Area' : '❌ Outside Work Area'}
              </Text>
            </View>
          </View>
          <Text style={styles.coordinatesText}>
            Center: {String(project.geofence.center.latitude.toFixed(6))}, {String(project.geofence.center.longitude.toFixed(6))}
          </Text>
          <Text style={styles.geofenceNote}>
            ⚠️ Attendance can only be marked inside the geo-fenced area
          </Text>
        </View>
      </View>

      {/* Supervisor Contact */}
      {project.supervisor && typeof project.supervisor === 'object' && project.supervisor.name && (
        <View style={styles.supervisorContainer}>
          <Text style={styles.sectionTitle}>👨‍💼 Supervisor Name & Contact</Text>
          <View style={styles.supervisorCard}>
            <View style={styles.supervisorInfo}>
              <Text style={styles.supervisorName}>{String(project.supervisor.name)}</Text>
              <Text style={styles.supervisorRole}>Site Supervisor</Text>
            </View>
            <View style={styles.contactButtons}>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={() => handleCallSupervisor(String(project.supervisor.phone), String(project.supervisor.name))}
              >
                <Text style={styles.contactButtonIcon}>📞</Text>
                <Text style={styles.contactButtonText}>{String(project.supervisor.phone)}</Text>
              </TouchableOpacity>
              {project.supervisor.email ? (
                <TouchableOpacity 
                  style={[styles.contactButton, styles.emailButton]}
                  onPress={() => handleEmailSupervisor(String(project.supervisor.email), String(project.supervisor.name))}
                >
                  <Text style={styles.contactButtonIcon}>✉️</Text>
                  <Text style={styles.contactButtonText}>Email</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <Text style={styles.contactNote}>
            📋 Contact supervisor for: Late arrival, Site issues, Emergency situations
          </Text>
        </View>
      )}

      {/* Project Timeline */}
      <View style={styles.timelineContainer}>
        <Text style={styles.sectionTitle}>📅 Project Timeline</Text>
        <View style={styles.timelineDetails}>
          <View style={styles.timelineRow}>
            <Text style={styles.timelineLabel}>Start Date:</Text>
            <Text style={styles.timelineValue}>
              {project.startDate.toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.timelineRow}>
            <Text style={styles.timelineLabel}>End Date:</Text>
            <Text style={styles.timelineValue}>
              {project.endDate.toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  status_active: {
    backgroundColor: '#E8F5E8',
  },
  status_completed: {
    backgroundColor: '#E3F2FD',
  },
  status_on_hold: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  projectSection: {
    marginBottom: 16,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 8,
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationDetails: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 4,
  },
  landmarksText: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 2,
  },
  accessInstructions: {
    fontSize: 12,
    color: '#2196F3',
    fontStyle: 'italic',
  },
  geofenceContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    marginBottom: 16,
  },
  geofenceDetails: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  geofenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  geofenceLabel: {
    fontSize: 12,
    color: '#757575',
  },
  geofenceValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#424242',
  },
  geofenceStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  insideGeofence: {
    backgroundColor: '#E8F5E8',
  },
  outsideGeofence: {
    backgroundColor: '#FFEBEE',
  },
  geofenceStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  coordinatesText: {
    fontSize: 11,
    color: '#757575',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  geofenceNote: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '500',
    textAlign: 'center',
  },
  supervisorContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    marginBottom: 16,
  },
  supervisorCard: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  supervisorInfo: {
    marginBottom: 12,
  },
  supervisorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  supervisorRole: {
    fontSize: 12,
    color: '#757575',
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  contactButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  emailButton: {
    backgroundColor: '#4CAF50',
  },
  contactButtonIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  contactNote: {
    fontSize: 11,
    color: '#757575',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  timelineContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  timelineDetails: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineLabel: {
    fontSize: 12,
    color: '#757575',
  },
  timelineValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#424242',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#757575',
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noDataIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#757575',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
});

export default ProjectInfoCard;