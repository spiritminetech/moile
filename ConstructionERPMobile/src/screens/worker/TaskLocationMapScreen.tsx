import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocation } from '../../store/context/LocationContext';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';
import { ConstructionButton } from '../../components/common';

interface TaskLocationMapScreenProps {
  route: {
    params: {
      task: any;
      projectGeofence: {
        latitude: number;
        longitude: number;
        radius: number;
        strictMode?: boolean;
        allowedVariance?: number;
      };
    };
  };
  navigation: any;
}

const TaskLocationMapScreen: React.FC<TaskLocationMapScreenProps> = ({ route, navigation }) => {
  const { task, projectGeofence } = route.params;
  const { state: locationState } = useLocation();
  const { currentLocation } = locationState;

  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [distance, setDistance] = useState<number | null>(null);

  // Calculate distance from worker to site
  useEffect(() => {
    if (currentLocation && projectGeofence) {
      const dist = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        projectGeofence.latitude,
        projectGeofence.longitude
      );
      setDistance(dist);
    }
  }, [currentLocation, projectGeofence]);

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Check if worker is inside geofence
  const isInsideGeofence = (): boolean => {
    if (!distance) return false;
    return distance <= projectGeofence.radius + (projectGeofence.allowedVariance || 0);
  };

  // Open navigation app
  const handleNavigate = () => {
    const { latitude, longitude } = projectGeofence;
    const label = task.projectName || 'Work Site';

    const scheme = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
    });

    const url = scheme || `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Unable to open maps application');
        }
      })
      .catch((err) => {
        console.error('Error opening maps:', err);
        Alert.alert('Error', 'Failed to open navigation');
      });
  };

  // Toggle map type
  const toggleMapType = () => {
    setMapType(mapType === 'standard' ? 'satellite' : 'standard');
  };

  const insideGeofence = isInsideGeofence();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Work Site Location</Text>
        <TouchableOpacity onPress={toggleMapType} style={styles.mapTypeButton}>
          <Text style={styles.mapTypeButtonText}>
            {mapType === 'standard' ? '🛰️' : '🗺️'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        mapType={mapType}
        initialRegion={{
          latitude: projectGeofence.latitude,
          longitude: projectGeofence.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      >
        {/* Site Marker */}
        <Marker
          coordinate={{
            latitude: projectGeofence.latitude,
            longitude: projectGeofence.longitude,
          }}
          title={task.projectName || 'Work Site'}
          description={task.siteName || task.location}
          pinColor="red"
        />

        {/* Geofence Circle */}
        <Circle
          center={{
            latitude: projectGeofence.latitude,
            longitude: projectGeofence.longitude,
          }}
          radius={projectGeofence.radius}
          fillColor={insideGeofence ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'}
          strokeColor={insideGeofence ? '#4CAF50' : '#F44336'}
          strokeWidth={2}
        />
      </MapView>

      {/* Info Panel */}
      <View style={styles.infoPanel}>
        {/* Project Info */}
        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>{task.projectName}</Text>
          <Text style={styles.projectCode}>Code: {task.projectCode}</Text>
          <Text style={styles.siteName}>📍 {task.siteName}</Text>
        </View>

        {/* Distance Info */}
        {distance !== null && (
          <View style={[styles.distanceCard, insideGeofence ? styles.insideGeofence : styles.outsideGeofence]}>
            <Text style={styles.distanceLabel}>
              {insideGeofence ? '✅ Inside Work Area' : '⚠️ Outside Work Area'}
            </Text>
            <Text style={styles.distanceValue}>
              {distance < 1000 
                ? `${Math.round(distance)}m away`
                : `${(distance / 1000).toFixed(2)}km away`
              }
            </Text>
            <Text style={styles.geofenceInfo}>
              Allowed radius: {projectGeofence.radius}m
            </Text>
          </View>
        )}

        {/* Navigation Button */}
        <ConstructionButton
          title="🧭 Navigate to Site"
          onPress={handleNavigate}
          variant="primary"
          size="large"
          icon="🗺️"
          style={styles.navigateButton}
        />

        {/* Additional Info */}
        <View style={styles.additionalInfo}>
          <Text style={styles.infoText}>🔧 Nature of Work: {task.natureOfWork || 'General Construction'}</Text>
          <Text style={styles.infoText}>👤 Your Trade: {task.trade || 'General'}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ConstructionTheme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  mapTypeButton: {
    padding: 8,
  },
  mapTypeButtonText: {
    fontSize: 24,
  },
  map: {
    flex: 1,
  },
  infoPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  projectInfo: {
    marginBottom: 16,
  },
  projectName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  projectCode: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  siteName: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  distanceCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  insideGeofence: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  outsideGeofence: {
    backgroundColor: '#FFEBEE',
    borderWidth: 2,
    borderColor: '#F44336',
  },
  distanceLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  distanceValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  geofenceInfo: {
    fontSize: 12,
    color: '#666666',
  },
  navigateButton: {
    marginBottom: 16,
  },
  additionalInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
  },
});

export default TaskLocationMapScreen;
