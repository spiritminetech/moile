// RouteNavigationComponent - GPS integration for route navigation and optimization
// Requirements: 9.1, 9.2, 9.3

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { TransportTask, GeoLocation } from '../../types';
import { ConstructionButton, ConstructionCard } from '../common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface RouteNavigationProps {
  transportTask: TransportTask;
  currentLocation: GeoLocation | null;
  onNavigationStart: (locationId: number) => void;
  onRouteOptimization: () => void;
  onEmergencyReroute: () => void;
  onCompletePickup?: (locationId: number) => void;
  onCompleteDropoff?: () => void;
  onUpdateTaskStatus?: (status: TransportTask['status']) => void;
}

const RouteNavigationComponent: React.FC<RouteNavigationProps> = ({
  transportTask,
  currentLocation,
  onNavigationStart,
  onRouteOptimization,
  onEmergencyReroute,
  onCompletePickup,
  onCompleteDropoff,
  onUpdateTaskStatus,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get distance to location
  const getDistanceToLocation = (location: { latitude: number; longitude: number }): string => {
    if (!currentLocation) return 'Unknown';
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      location.latitude,
      location.longitude
    );
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  // Open external navigation app
  const openExternalNavigation = (location: { latitude: number; longitude: number; name: string }) => {
    const { latitude, longitude, name } = location;
    
    Alert.alert(
      'Open Navigation',
      `Navigate to ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Google Maps',
          onPress: () => {
            const url = Platform.select({
              ios: `maps://app?daddr=${latitude},${longitude}`,
              android: `google.navigation:q=${latitude},${longitude}`,
            });
            if (url) {
              Linking.openURL(url).catch(() => {
                // Fallback to web version
                Linking.openURL(`https://maps.google.com/maps?daddr=${latitude},${longitude}`);
              });
            }
          },
        },
        {
          text: 'Waze',
          onPress: () => {
            const url = `waze://ul?ll=${latitude},${longitude}&navigate=yes`;
            Linking.openURL(url).catch(() => {
              // Fallback to web version
              Linking.openURL(`https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`);
            });
          },
        },
      ]
    );
  };

  // Handle navigation start
  const handleNavigationStart = (locationId: number) => {
    setSelectedLocation(locationId);
    setIsNavigating(true);
    onNavigationStart(locationId);
  };

  // Handle route optimization
  const handleRouteOptimization = () => {
    Alert.alert(
      'Optimize Route',
      'Optimize pickup order based on current location and traffic?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Optimize',
          onPress: () => {
            onRouteOptimization();
          },
        },
      ]
    );
  };

  // Handle emergency reroute
  const handleEmergencyReroute = () => {
    Alert.alert(
      'Emergency Reroute',
      'Request emergency reroute due to road closure or incident?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Reroute',
          style: 'destructive',
          onPress: () => {
            onEmergencyReroute();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Route Overview */}
        <View style={styles.routeOverview}>
          <Text style={styles.routeTitle}>Route: {transportTask.route}</Text>
          <Text style={styles.routeInfo}>
            {transportTask.pickupLocations.length} pickup locations → {transportTask.dropoffLocation.name}
          </Text>
          <Text style={styles.workerCount}>
            Total Workers: {transportTask.totalWorkers} | Checked In: {transportTask.checkedInWorkers}
          </Text>
        </View>

        {/* Route Controls */}
        <View style={styles.routeControls}>
          <ConstructionButton
            title="🗺️ Optimize Route"
            onPress={handleRouteOptimization}
            variant="secondary"
            size="medium"
            style={styles.controlButton}
          />
          <ConstructionButton
            title="🚨 Emergency Reroute"
            onPress={handleEmergencyReroute}
            variant="warning"
            size="medium"
            style={styles.controlButton}
          />
        </View>

        {/* Pickup Locations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Pickup Locations</Text>
          {transportTask.pickupLocations.map((location, index) => (
            <ConstructionCard
              key={location.locationId}
              variant={selectedLocation === location.locationId ? 'success' : 'outlined'}
              style={styles.locationCard}
            >
              <View style={styles.locationHeader}>
                <Text style={styles.locationName}>
                  {index + 1}. {location.name}
                </Text>
                <Text style={styles.locationDistance}>
                  {getDistanceToLocation(location.coordinates)}
                </Text>
              </View>
              
              <Text style={styles.locationAddress}>{location.address}</Text>
              
              <View style={styles.locationInfo}>
                <Text style={styles.pickupTime}>
                  📅 {location.estimatedPickupTime}
                  {location.actualPickupTime && ` (Actual: ${location.actualPickupTime})`}
                </Text>
                <Text style={styles.workerInfo}>
                  👥 {location.workerManifest.length} workers
                  ({location.workerManifest.filter(w => w.checkedIn).length} checked in)
                </Text>
              </View>

              <View style={styles.locationActions}>
                <ConstructionButton
                  title="🧭 Navigate"
                  onPress={() => openExternalNavigation({
                    latitude: location.coordinates.latitude,
                    longitude: location.coordinates.longitude,
                    name: location.name,
                  })}
                  variant="primary"
                  size="small"
                  style={styles.actionButton}
                />
                <ConstructionButton
                  title={selectedLocation === location.locationId ? "✅ Selected" : "📍 Select"}
                  onPress={() => handleNavigationStart(location.locationId)}
                  variant={selectedLocation === location.locationId ? "success" : "outline"}
                  size="small"
                  style={styles.actionButton}
                />
              </View>
            </ConstructionCard>
          ))}
        </View>

        {/* Drop-off Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏗️ Drop-off Location</Text>
          <ConstructionCard 
            variant={selectedLocation === -1 ? 'success' : 'outlined'} 
            style={styles.locationCard}
          >
            <View style={styles.locationHeader}>
              <Text style={styles.locationName}>
                {transportTask.dropoffLocation.name}
              </Text>
              <Text style={styles.locationDistance}>
                {getDistanceToLocation(transportTask.dropoffLocation.coordinates)}
              </Text>
            </View>
            
            <Text style={styles.locationAddress}>
              {transportTask.dropoffLocation.address}
            </Text>
            
            <View style={styles.locationInfo}>
              <Text style={styles.pickupTime}>
                📅 ETA: {transportTask.dropoffLocation.estimatedArrival}
                {transportTask.dropoffLocation.actualArrival && 
                  ` (Actual: ${transportTask.dropoffLocation.actualArrival})`}
              </Text>
              <Text style={styles.workerInfo}>
                👥 {transportTask.totalWorkers} workers
                ({transportTask.checkedInWorkers} checked in)
              </Text>
            </View>

            <View style={styles.locationActions}>
              <ConstructionButton
                title="🧭 Navigate"
                onPress={() => openExternalNavigation({
                  latitude: transportTask.dropoffLocation.coordinates.latitude,
                  longitude: transportTask.dropoffLocation.coordinates.longitude,
                  name: transportTask.dropoffLocation.name,
                })}
                variant="primary"
                size="small"
                style={styles.actionButton}
              />
              <ConstructionButton
                title={selectedLocation === -1 ? "✅ Selected" : "📍 Select"}
                onPress={() => handleNavigationStart(-1)}
                variant={selectedLocation === -1 ? "success" : "outline"}
                size="small"
                style={styles.actionButton}
              />
            </View>
          </ConstructionCard>
        </View>

        {/* Current Status - Only show if NOT completed */}
        {transportTask.status !== 'completed' && (
          <View style={styles.statusSection}>
            <Text style={styles.sectionTitle}>📊 Current Status</Text>
            <View style={styles.statusInfo}>
              <Text style={styles.statusText}>
                Status: <Text style={styles.statusValue}>{transportTask.status.replace('_', ' ').toUpperCase()}</Text>
              </Text>
              {currentLocation && (
                <Text style={styles.statusText}>
                  📍 Current Location: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </Text>
              )}
              <Text style={styles.statusText}>
                🎯 GPS Accuracy: {currentLocation?.accuracy ? `${Math.round(currentLocation.accuracy)}m` : 'Unknown'}
              </Text>
            </View>

            {/* Status Update Buttons */}
            {onUpdateTaskStatus && (
              <View style={styles.statusActions}>
                {transportTask.status === 'pending' && (
                  <ConstructionButton
                    title="🚀 Start Trip - En Route to Pickup"
                    onPress={() => onUpdateTaskStatus('en_route_pickup')}
                    variant="primary"
                    size="large"
                    fullWidth
                  />
                )}
                {transportTask.status === 'en_route_pickup' && (
                  <ConstructionButton
                    title="📍 Arrived at Pickup Location"
                    onPress={() => onUpdateTaskStatus('pickup_complete')}
                    variant="secondary"
                    size="large"
                    fullWidth
                  />
                )}
                {transportTask.status === 'pickup_complete' && (
                  <ConstructionButton
                    title="🚛 En Route to Drop-off"
                    onPress={() => onUpdateTaskStatus('en_route_dropoff')}
                    variant="primary"
                    size="large"
                    fullWidth
                  />
                )}
                {transportTask.status === 'en_route_dropoff' && (
                  <ConstructionButton
                    title="🏗️ Arrived at Drop-off Site"
                    onPress={() => onUpdateTaskStatus('completed')}
                    variant="success"
                    size="large"
                    fullWidth
                  />
                )}
              </View>
            )}
          </View>
        )}

        {/* Show completed badge if task is completed */}
        {transportTask.status === 'completed' && (
          <View style={styles.statusSection}>
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>✅ Trip Completed</Text>
            </View>
          </View>
        )}

        {/* Bottom spacing for scroll */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: ConstructionTheme.spacing.xl * 3,
  },
  routeOverview: {
    marginBottom: ConstructionTheme.spacing.lg,
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.primaryContainer,
    borderRadius: ConstructionTheme.borderRadius.md,
  },
  routeTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onPrimaryContainer,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  routeInfo: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onPrimaryContainer,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  workerCount: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onPrimaryContainer,
    fontWeight: 'bold',
  },
  routeControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ConstructionTheme.spacing.lg,
  },
  controlButton: {
    flex: 1,
    marginHorizontal: ConstructionTheme.spacing.xs,
  },
  section: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  sectionTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onBackground,
    marginBottom: ConstructionTheme.spacing.md,
  },
  locationCard: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ConstructionTheme.spacing.sm,
    flexWrap: 'wrap',
  },
  locationName: {
    ...ConstructionTheme.typography.titleMedium,
    color: ConstructionTheme.colors.onSurface,
    flex: 1,
    flexShrink: 1,
  },
  locationDistance: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
  },
  locationAddress: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.sm,
    flexWrap: 'wrap',
  },
  locationInfo: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  pickupTime: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  workerInfo: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurface,
  },
  locationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: ConstructionTheme.spacing.xs,
  },
  statusSection: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  completedBadgeSmall: {
    backgroundColor: ConstructionTheme.colors.successContainer,
    paddingVertical: ConstructionTheme.spacing.sm,
    paddingHorizontal: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: ConstructionTheme.spacing.xs,
  },
  completedBadgeText: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSuccessContainer,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: ConstructionTheme.spacing.xl * 2,
  },
});

export default RouteNavigationComponent;