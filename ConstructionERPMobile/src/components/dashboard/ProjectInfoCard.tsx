import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Project } from '../../types';

interface ProjectInfoCardProps {
  project: Project | null;
  isLoading: boolean;
}

const ProjectInfoCard: React.FC<ProjectInfoCardProps> = ({ project, isLoading }) => {
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
          <Text style={styles.noDataText}>No project assigned today</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Project</Text>
        <View style={[styles.statusBadge, styles[`status_${project.status}`]]}>
          <Text style={styles.statusText}>{project.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.projectName}>{project.name}</Text>
      {project.description && (
        <Text style={styles.projectDescription}>{project.description}</Text>
      )}
      
      <View style={styles.locationContainer}>
        <Text style={styles.locationIcon}>📍</Text>
        <Text style={styles.locationText}>{project.location.address}</Text>
      </View>

      {project.supervisor && (
        <View style={styles.supervisorContainer}>
          <Text style={styles.supervisorLabel}>Supervisor:</Text>
          <Text style={styles.supervisorName}>{project.supervisor.name}</Text>
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.contactButtonText}>📞 {project.supervisor.phone}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Geofence Information */}
      <View style={styles.geofenceContainer}>
        <Text style={styles.geofenceLabel}>Work Area:</Text>
        <Text style={styles.geofenceText}>
          Within {project.geofence.radius}m radius
        </Text>
        <Text style={styles.coordinatesText}>
          {project.geofence.center.latitude.toFixed(6)}, {project.geofence.center.longitude.toFixed(6)}
        </Text>
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
    marginBottom: 12,
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
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12,
    lineHeight: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#424242',
    flex: 1,
  },
  supervisorContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    marginBottom: 12,
  },
  supervisorLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  supervisorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  contactButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  geofenceContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  geofenceLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  geofenceText: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#757575',
    fontFamily: 'monospace',
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
  noDataText: {
    fontSize: 14,
    color: '#757575',
  },
});

export default ProjectInfoCard;