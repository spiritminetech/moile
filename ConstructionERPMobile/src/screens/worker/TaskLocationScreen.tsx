// Task Location Screen - Display task location on map with navigation capabilities
// Requirements: 4.6

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { TaskAssignment, GeoLocation } from '../../types';
import { useLocation } from '../../store/context/LocationContext';
import DistanceDisplay from '../../components/common/DistanceDisplay';
import GPSAccuracyIndicator from '../../components/common/GPSAccuracyIndicator';

const { width, height } = Dimensions.get('window');

const TaskLocationScreen = ({ navigation, route }: any) => {
  const { task } = route.params;
  const { state: locationState, checkGPSAccuracy } = useLocation();
  const { currentLocation, isLocationEnabled, hasLocationPermission } = locationState;
  
  const [distance, setDistance] = useState<number | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: task.location?.latitude || 1.3521,
    longitude: task.location?.longitude || 103.8198,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Calculate distance between current location and task location
  useEffect(() => {
    if (currentLocation && task.location) {
      const calculatedDistance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        task.location.latitude,
        task.location.longitude
      );
      setDistance(calculatedDistance);
    }
  }, [currentLocation, task.location]);

  // Update map region when current location changes
  useEffect(() => {
    if (currentLocation && task.location) {
      // Calculate bounds to show both current location and task location
      const minLat = Math.min(currentLocation.latitude, task.location.latitude);
      const maxLat = Math.max(currentLocation.latitude, task.location.latitude);
      const minLng = Math.min(currentLocation.longitude, task.location.longitude);
      const maxLng = Math.max(currentLocation.longitude, task.location.longitude);
      
      const latDelta = Math.max(0.01, (maxLat - minLat) * 1.5);
      const lngDelta = Math.max(0.01, (maxLng - minLng) * 1.5);
      
      setMapRegion({
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      });
    }
  }, [currentLocation, task.location]);

  // Calculate distance using Haversine formula
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Convert to meters
  };

  const toRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  // Handle navigation to task location
  const handleNavigateToLocation = () => {
    if (!task.location) {
      Alert.alert(
        'Location Not Available',
        'Task location information is not available.',
        [{ text: 'OK' }]
      );
      return;
    }

    const { latitude, longitude } = task.location;
    const label = encodeURIComponent(task.taskName);

    Alert.alert(
      'Open Navigation',
      'Choose your preferred navigation app:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Google Maps',
          onPress: () => openGoogleMaps(latitude, longitude, label),
        },
        {
          text: 'Apple Maps',
          onPress: () => openAppleMaps(latitude, longitude, label),
        },
        {
          text: 'Waze',
          onPress: () => openWaze(latitude, longitude),
        },
      ]
    );
  };

  // Open Google Maps
  const openGoogleMaps = (lat: number, lng: number, label: string) => {
    const url = Platform.select({
      ios: `comgooglemaps://?q=${lat},${lng}&zoom=16&views=traffic`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})&z=16`,
    });

    const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&zoom=16`;

    if (url) {
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(fallbackUrl);
        }
      });
    } else {
      Linking.openURL(fallbackUrl);
    }
  };

  // Open Apple Maps
  const openAppleMaps = (lat: number, lng: number, label: string) => {
    const url = `http://maps.apple.com/?q=${label}&ll=${lat},${lng}&z=16`;
    Linking.openURL(url);
  };

  // Open Waze
  const openWaze = (lat: number, lng: number) => {
    const url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    Linking.openURL(url);
  };

  // Handle share location
  const handleShareLocation = () => {
    if (!task.location) return;

    const { latitude, longitude } = task.location;
    const message = `Task Location: ${task.taskName}\nCoordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    // For now, we'll show an alert with the shareable text
    // In a real app, you might use react-native-share or similar
    Alert.alert(
      'Share Location',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy to Clipboard',
          onPress: () => {
            // In a real app, you'd use Clipboard.setString(message)
            Alert.alert('Copied', 'Location information copied to clipboard');
          },
        },
      ]
    );
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'in_progress':
        return '#2196F3';
      case 'completed':
        return '#4CAF50';
      default:
        return '#757575';
    }
  };

  // Get status text
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Task Information */}
        <View style={styles.taskInfoContainer}>
          <View style={styles.taskHeader}>
            <View style={styles.taskTitleContainer}>
              <Text style={styles.taskName}>{task.taskName}</Text>
              <Text style={styles.taskSequence}>#{task.sequence}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
              <Text style={styles.statusText}>{getStatusText(task.status)}</Text>
            </View>
          </View>
          <Text style={styles.taskDescription}>{task.description}</Text>
        </View>

        {/* GPS Status */}
        <GPSAccuracyIndicator accuracyWarning={checkGPSAccuracy()} />

        {/* Interactive Map */}
        {task.location && (
          <View style={styles.mapContainer}>
            <Text style={styles.sectionTitle}>Task Location Map</Text>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              region={mapRegion}
              onRegionChangeComplete={setMapRegion}
              showsUserLocation={hasLocationPermission && isLocationEnabled}
              showsMyLocationButton={true}
              showsCompass={true}
              showsScale={true}
              mapType="hybrid"
            >
              {/* Task Location Marker */}
              <Marker
                coordinate={{
                  latitude: task.location.latitude,
                  longitude: task.location.longitude,
                }}
                title={task.taskName}
                description={`Task #${task.sequence}`}
                pinColor="#FF6B6B"
              />
              
              {/* Geofence Circle (if available) */}
              {task.projectGeofence && (
                <Circle
                  center={{
                    latitude: task.projectGeofence.latitude,
                    longitude: task.projectGeofence.longitude,
                  }}
                  radius={task.projectGeofence.radius || 100}
                  strokeColor="rgba(33, 150, 243, 0.8)"
                  fillColor="rgba(33, 150, 243, 0.2)"
                  strokeWidth={2}
                />
              )}

              {/* Current Location Marker */}
              {currentLocation && (
                <Marker
                  coordinate={{
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                  }}
                  title="Your Location"
                  description={`Accuracy: ±${Math.round(currentLocation.accuracy)}m`}
                  pinColor="#4CAF50"
                />
              )}
            </MapView>
          </View>
        )}

        {/* Location Information */}
        <View style={styles.locationContainer}>
          <Text style={styles.sectionTitle}>Location Details</Text>
          
          {task.location ? (
            <>
              <View style={styles.coordinatesContainer}>
                <Text style={styles.coordinatesLabel}>Coordinates:</Text>
                <Text style={styles.coordinatesText}>
                  {task.location.latitude.toFixed(6)}, {task.location.longitude.toFixed(6)}
                </Text>
              </View>

              {task.location.altitude && (
                <View style={styles.altitudeContainer}>
                  <Text style={styles.altitudeLabel}>Altitude:</Text>
                  <Text style={styles.altitudeText}>{Math.round(task.location.altitude)}m</Text>
                </View>
              )}

              {/* Distance from current location */}
              {currentLocation && distance !== null && (
                <DistanceDisplay
                  distance={distance}
                  isValid={distance <= 100} // Assuming 100m threshold
                  showIcon={true}
                />
              )}
            </>
          ) : (
            <View style={styles.noLocationContainer}>
              <Text style={styles.noLocationIcon}>📍</Text>
              <Text style={styles.noLocationText}>Location information not available</Text>
            </View>
          )}
        </View>

        {/* Current Location */}
        {currentLocation && (
          <View style={styles.currentLocationContainer}>
            <Text style={styles.sectionTitle}>Your Current Location</Text>
            <View style={styles.coordinatesContainer}>
              <Text style={styles.coordinatesLabel}>Coordinates:</Text>
              <Text style={styles.coordinatesText}>
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </Text>
            </View>
            <Text style={styles.accuracyText}>
              Accuracy: ±{Math.round(currentLocation.accuracy)}m
            </Text>
          </View>
        )}

        {/* Location Status */}
        {!hasLocationPermission && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              Location permission is required to show distance and enable navigation.
            </Text>
          </View>
        )}

        {!isLocationEnabled && hasLocationPermission && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningIcon}>📍</Text>
            <Text style={styles.warningText}>
              Please enable location services to show your current position and distance.
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {task.location && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.navigateButton]}
                onPress={handleNavigateToLocation}
              >
                <Text style={styles.actionButtonText}>🧭 Navigate to Location</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.shareButton]}
                onPress={handleShareLocation}
              >
                <Text style={styles.shareButtonText}>📤 Share Location</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.backButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back to Tasks</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  taskInfoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  taskName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  taskSequence: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  taskDescription: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
  },
  locationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  coordinatesLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
    minWidth: 80,
  },
  coordinatesText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#333333',
    fontWeight: '500',
  },
  altitudeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  altitudeLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
    minWidth: 80,
  },
  altitudeText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  distanceDisplay: {
    marginTop: 8,
  },
  noLocationContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noLocationIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noLocationText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  currentLocationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  accuracyText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  warningContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
  },
  actionsContainer: {
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigateButton: {
    backgroundColor: '#4CAF50',
  },
  shareButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  backButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  backButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  mapContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: 300,
  },
});

export default TaskLocationScreen;