// RouteMapCard Component - Display route map with navigation and location information
// Requirements: 8.1, 8.2, 8.3, 8.4, 8.5

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { TransportTask, GeoLocation } from '../../types';
import { ConstructionButton, ConstructionCard } from '../common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface RouteMapCardProps {
  task: TransportTask | null;
  currentLocation: GeoLocation | null;
  onNavigateToLocation: (coordinates: { latitude: number; longitude: number }, name: string) => void;
  onRefreshLocation: () => void;
  isLocationEnabled: boolean;
}

const RouteMapCard: React.FC<RouteMapCardProps> = ({
  task,
  currentLocation,
  onNavigateToLocation,
  onRefreshLocation,
  isLocationEnabled,
}) => {
  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Format distance
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  // Get next destination based on task status
  const getNextDestination = () => {
    if (!task) return null;

    switch (task.status) {
      case 'pending':
      case 'en_route_pickup':
        // Next pickup location
        const nextPickup = task.pickupLocations?.find(
          location => !location.actualPickupTime
        );
        return nextPickup ? {
          name: nextPickup.name,
          address: nextPickup.address,
          coordinates: nextPickup.coordinates,
          type: 'pickup' as const,
        } : null;

      case 'pickup_complete':
      case 'en_route_dropoff':
        // Dropoff location
        return task.dropoffLocation ? {
          name: task.dropoffLocation.name,
          address: task.dropoffLocation.address,
          coordinates: task.dropoffLocation.coordinates,
          type: 'dropoff' as const,
        } : null;

      default:
        return null;
    }
  };

  // Handle navigation
  const handleNavigate = (coordinates: { latitude: number; longitude: number }, name: string) => {
    if (!isLocationEnabled) {
      Alert.alert(
        'Location Disabled',
        'Please enable location services to use navigation.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable', onPress: onRefreshLocation },
        ]
      );
      return;
    }

    onNavigateToLocation(coordinates, name);
  };

  // Handle refresh location
  const handleRefreshLocation = () => {
    onRefreshLocation();
  };

  // Render current location info
  const renderCurrentLocation = () => {
    if (!currentLocation) {
      return (
        <View style={styles.locationSection}>
          <Text style={styles.sectionTitle}>📍 Current Location</Text>
          <View style={styles.noLocationContainer}>
            <Text style={styles.noLocationText}>Location not available</Text>
            <ConstructionButton
              title="Enable Location"
              onPress={handleRefreshLocation}
              variant="primary"
              size="small"
              icon="🔄"
              style={styles.refreshButton}
            />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.locationSection}>
        <View style={styles.locationHeader}>
          <Text style={styles.sectionTitle}>📍 Current Location</Text>
          <TouchableOpacity
            onPress={handleRefreshLocation}
            style={styles.refreshIconButton}
          >
            <Text style={styles.refreshIcon}>🔄</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.coordinatesContainer}>
          <Text style={styles.coordinatesText}>
            {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
          </Text>
          <Text style={styles.accuracyText}>
            Accuracy: {Math.round(currentLocation.accuracy)}m
          </Text>
        </View>
      </View>
    );
  };

  // Render next destination
  const renderNextDestination = () => {
    const destination = getNextDestination();
    
    if (!destination) {
      return (
        <View style={styles.destinationSection}>
          <Text style={styles.sectionTitle}>🎯 Next Destination</Text>
          <Text style={styles.noDestinationText}>No active destination</Text>
        </View>
      );
    }

    const distance = currentLocation
      ? calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          destination.coordinates.latitude,
          destination.coordinates.longitude
        )
      : null;

    return (
      <View style={styles.destinationSection}>
        <Text style={styles.sectionTitle}>
          🎯 Next Destination ({destination.type === 'pickup' ? 'Pickup' : 'Dropoff'})
        </Text>
        <View style={styles.destinationInfo}>
          <Text style={styles.destinationName}>{destination.name}</Text>
          <Text style={styles.destinationAddress}>{destination.address}</Text>
          {distance && (
            <Text style={styles.distanceText}>
              📏 {formatDistance(distance)} away
            </Text>
          )}
        </View>
        <ConstructionButton
          title="Navigate"
          onPress={() => handleNavigate(destination.coordinates, destination.name)}
          variant="success"
          size="medium"
          disabled={!isLocationEnabled}
          icon="🧭"
          style={styles.navigateButton}
        />
      </View>
    );
  };

  // Render all locations list
  const renderAllLocations = () => {
    if (!task) return null;

    const allLocations = [
      ...(task.pickupLocations || []).map(loc => ({
        ...loc,
        type: 'pickup' as const,
        completed: !!loc.actualPickupTime,
      })),
      ...(task.dropoffLocation ? [{
        ...task.dropoffLocation,
        locationId: -1,
        type: 'dropoff' as const,
        completed: !!task.dropoffLocation.actualArrival,
      }] : []),
    ];

    if (allLocations.length === 0) return null;

    return (
      <View style={styles.allLocationsSection}>
        <Text style={styles.sectionTitle}>🗺️ All Locations</Text>
        {allLocations.map((location, index) => {
          const distance = currentLocation
            ? calculateDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                location.coordinates.latitude,
                location.coordinates.longitude
              )
            : null;

          return (
            <View key={`${location.type}-${location.locationId || index}`} style={styles.locationItem}>
              <View style={styles.locationItemHeader}>
                <Text style={styles.locationItemName}>
                  {location.type === 'pickup' ? '📍' : '🏗️'} {location.name}
                </Text>
                {location.completed && (
                  <Text style={styles.completedBadge}>✅ Done</Text>
                )}
              </View>
              <Text style={styles.locationItemAddress}>{location.address}</Text>
              {distance && (
                <Text style={styles.locationItemDistance}>
                  {formatDistance(distance)} away
                </Text>
              )}
              <TouchableOpacity
                onPress={() => handleNavigate(location.coordinates, location.name)}
                disabled={!isLocationEnabled}
                style={styles.miniNavigateButton}
              >
                <Text style={styles.miniNavigateText}>Navigate 🧭</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    );
  };

  if (!task) {
    return (
      <ConstructionCard
        variant="outlined"
        style={styles.container}
      >
        <View style={styles.noTaskContainer}>
          <Text style={styles.noTaskText}>🗺️ No active route</Text>
          <Text style={styles.noTaskSubtext}>Select a transport task to view route information</Text>
        </View>
      </ConstructionCard>
    );
  }

  return (
    <ConstructionCard
      variant="elevated"
      style={styles.container}
    >
      <Text style={styles.cardTitle}>🗺️ Route Navigation</Text>
      
      {/* Current location */}
      {renderCurrentLocation()}

      {/* Next destination */}
      {renderNextDestination()}

      {/* All locations */}
      {renderAllLocations()}

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
  noTaskContainer: {
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.xl,
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
  locationSection: {
    marginBottom: ConstructionTheme.spacing.lg,
    paddingBottom: ConstructionTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  sectionTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
  },
  refreshIconButton: {
    padding: ConstructionTheme.spacing.sm,
  },
  refreshIcon: {
    fontSize: ConstructionTheme.dimensions.iconMedium,
  },
  coordinatesContainer: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  coordinatesText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  accuracyText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  noLocationContainer: {
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.md,
  },
  noLocationText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.md,
  },
  refreshButton: {
    minWidth: 140,
  },
  destinationSection: {
    marginBottom: ConstructionTheme.spacing.lg,
    paddingBottom: ConstructionTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline,
  },
  destinationInfo: {
    backgroundColor: ConstructionTheme.colors.primaryLight + '20',
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginVertical: ConstructionTheme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.primary,
  },
  destinationName: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  destinationAddress: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  distanceText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.primary,
    fontWeight: '600',
  },
  noDestinationText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: ConstructionTheme.spacing.lg,
  },
  navigateButton: {
    marginTop: ConstructionTheme.spacing.sm,
  },
  allLocationsSection: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  locationItem: {
    backgroundColor: ConstructionTheme.colors.surface,
    borderRadius: ConstructionTheme.borderRadius.sm,
    padding: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.sm,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
  },
  locationItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  locationItemName: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
    flex: 1,
  },
  completedBadge: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.success,
    fontWeight: '600',
  },
  locationItemAddress: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  locationItemDistance: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.primary,
    fontWeight: '600',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  miniNavigateButton: {
    backgroundColor: ConstructionTheme.colors.secondary + '20',
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  miniNavigateText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.secondary,
    fontWeight: '600',
  },
});

export default RouteMapCard;