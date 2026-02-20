// Geo-fence Utility Functions
// Used for strict geo-fence enforcement in driver app

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in meters
  return distance;
}

/**
 * Check if a location is within a geo-fence radius
 * @param currentLat Current latitude
 * @param currentLon Current longitude
 * @param targetLat Target latitude
 * @param targetLon Target longitude
 * @param radiusMeters Geo-fence radius in meters (default: 100m)
 * @returns Object with isWithin boolean and distance in meters
 */
export function isWithinGeofence(
  currentLat: number,
  currentLon: number,
  targetLat: number,
  targetLon: number,
  radiusMeters: number = 100
): { isWithin: boolean; distance: number } {
  const distance = calculateDistance(currentLat, currentLon, targetLat, targetLon);
  return {
    isWithin: distance <= radiusMeters,
    distance: distance,
  };
}

/**
 * Format distance for display
 * @param meters Distance in meters
 * @returns Formatted string (e.g., "50m" or "1.2km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
}

/**
 * Get geo-fence status message
 * @param distance Distance from target in meters
 * @param radius Geo-fence radius in meters
 * @returns Status message with emoji
 */
export function getGeofenceStatusMessage(distance: number, radius: number): string {
  if (distance <= radius) {
    return `✅ Within geo-fence (${formatDistance(distance)})`;
  } else if (distance <= radius * 1.5) {
    return `⚠️ Near geo-fence (${formatDistance(distance)} away)`;
  } else {
    return `❌ Outside geo-fence (${formatDistance(distance)} away)`;
  }
}

/**
 * Validate geo-fence with detailed result
 * @param currentLat Current latitude
 * @param currentLon Current longitude
 * @param targetLat Target latitude
 * @param targetLon Target longitude
 * @param radiusMeters Geo-fence radius in meters
 * @returns Detailed validation result
 */
export interface GeofenceValidationResult {
  isValid: boolean;
  distance: number;
  distanceFormatted: string;
  statusMessage: string;
  canProceed: boolean;
  warningMessage?: string;
}

export function validateGeofenceDetailed(
  currentLat: number,
  currentLon: number,
  targetLat: number,
  targetLon: number,
  radiusMeters: number = 100
): GeofenceValidationResult {
  const { isWithin, distance } = isWithinGeofence(
    currentLat,
    currentLon,
    targetLat,
    targetLon,
    radiusMeters
  );

  const result: GeofenceValidationResult = {
    isValid: isWithin,
    distance: distance,
    distanceFormatted: formatDistance(distance),
    statusMessage: getGeofenceStatusMessage(distance, radiusMeters),
    canProceed: isWithin,
  };

  if (!isWithin) {
    result.warningMessage = `You are ${formatDistance(
      distance
    )} away from the required location. You must be within ${formatDistance(
      radiusMeters
    )} to proceed.`;
  }

  return result;
}

/**
 * Constants for geo-fence radii
 */
export const GEOFENCE_RADIUS = {
  PICKUP: 100, // 100 meters for pickup locations
  DROPOFF: 100, // 100 meters for drop-off locations
  START_ROUTE: 150, // 150 meters for route start (slightly larger)
  STRICT: 50, // 50 meters for strict validation
  RELAXED: 200, // 200 meters for relaxed validation
};

/**
 * Get appropriate geo-fence radius based on location type
 * @param locationType Type of location
 * @returns Radius in meters
 */
export function getGeofenceRadius(
  locationType: 'pickup' | 'dropoff' | 'start_route' | 'strict' | 'relaxed'
): number {
  switch (locationType) {
    case 'pickup':
      return GEOFENCE_RADIUS.PICKUP;
    case 'dropoff':
      return GEOFENCE_RADIUS.DROPOFF;
    case 'start_route':
      return GEOFENCE_RADIUS.START_ROUTE;
    case 'strict':
      return GEOFENCE_RADIUS.STRICT;
    case 'relaxed':
      return GEOFENCE_RADIUS.RELAXED;
    default:
      return GEOFENCE_RADIUS.PICKUP;
  }
}
