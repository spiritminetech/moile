// Location Service for GPS and geofencing functionality

import * as Location from 'expo-location';
import { GeoLocation, GeofenceValidation, GPSAccuracyWarning } from '../../types';
import { GPS_CONFIG } from '../../utils/constants';
import { attendanceApiService } from '../api/AttendanceApiService';

export class LocationService {
  private static instance: LocationService;
  private currentLocation: GeoLocation | null = null;
  private locationSubscription: Location.LocationSubscription | null = null;

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permissions from the user
   */
  async requestLocationPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      
      // In development mode, allow fallback even if permission denied
      if (__DEV__ && !granted) {
        console.warn('Development mode: location permission denied, but allowing fallback location');
        return true; // Allow fallback location in development
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      
      // In development mode, allow fallback on error
      if (__DEV__) {
        console.warn('Development mode: location permission error, but allowing fallback location');
        return true;
      }
      
      return false;
    }
  }

  /**
   * Check if location services are enabled on the device
   */
  async isLocationEnabled(): Promise<boolean> {
    try {
      const isEnabled = await Location.hasServicesEnabledAsync();
      console.log('📍 Location services enabled:', isEnabled);
      
      // In development mode, return true if we can get fallback location
      if (__DEV__ && !isEnabled) {
        console.warn('Development mode: location services disabled, but allowing fallback location');
        return true; // Allow fallback location in development
      }
      
      return isEnabled;
    } catch (error) {
      console.error('Error checking location services:', error);
      // In development, assume enabled if we can't check
      if (__DEV__) {
        console.warn('Development mode: assuming location services are enabled');
        return true;
      }
      return false;
    }
  }

  /**
   * Get current location with accuracy validation and fallback options
   */
  async getCurrentLocation(allowFallback: boolean = true): Promise<GeoLocation> {
    try {
      // First check permission status without requesting
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      
      // If permission is not granted, request it
      let hasPermission = currentStatus === 'granted';
      if (!hasPermission) {
        hasPermission = await this.requestLocationPermissions();
      }
      
      if (!hasPermission) {
        if (allowFallback) {
          console.warn('⚠️ Location permission denied, using fallback location');
          return this.getFallbackLocation();
        }
        throw new Error('Location permission denied. Please enable location permissions in your device settings.');
      }

      const isEnabled = await this.isLocationEnabled();
      if (!isEnabled) {
        if (allowFallback) {
          console.warn('⚠️ Location services disabled, using fallback location');
          return this.getFallbackLocation();
        }
        throw new Error('Location services are disabled. Please enable location services in your device settings.');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: GPS_CONFIG.MAXIMUM_AGE,
      });

      const geoLocation: GeoLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 999,
        timestamp: new Date(location.timestamp),
        altitude: location.coords.altitude || undefined,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined,
      };

      this.currentLocation = geoLocation;
      console.log('✅ Location obtained successfully:', geoLocation);
      return geoLocation;
    } catch (error) {
      console.error('❌ Error getting current location:', error);
      
      // Check if it's a permission error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Not authorized') || errorMessage.includes('permission') || errorMessage.includes('denied')) {
        if (allowFallback) {
          console.warn('⚠️ Location permission error, using fallback location');
          return this.getFallbackLocation();
        }
        throw new Error('Location permission denied. Please enable location permissions in your device settings.');
      }
      
      if (allowFallback) {
        console.warn('⚠️ Location error, using fallback location');
        return this.getFallbackLocation();
      }
      
      throw new Error(`Failed to get location: ${errorMessage}`);
    }
  }

  /**
   * Get fallback location for testing when GPS is unavailable
   */
  private getFallbackLocation(): GeoLocation {
    // Return a test location that matches the updated project coordinates
    const fallbackLocation: GeoLocation = {
      latitude: GPS_CONFIG.FALLBACK_COORDINATES.latitude,
      longitude: GPS_CONFIG.FALLBACK_COORDINATES.longitude,
      accuracy: GPS_CONFIG.FALLBACK_COORDINATES.accuracy,
      timestamp: new Date(),
      altitude: undefined,
      heading: undefined,
      speed: undefined,
    };

    console.log('📍 Using fallback location for testing:', fallbackLocation);
    this.currentLocation = fallbackLocation;
    return fallbackLocation;
  }

  /**
   * Start watching location changes
   */
  async startLocationTracking(callback: (location: GeoLocation) => void): Promise<void> {
    try {
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update when moved 10 meters
        },
        (location) => {
          const geoLocation: GeoLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 999,
            timestamp: new Date(location.timestamp),
            altitude: location.coords.altitude || undefined,
            heading: location.coords.heading || undefined,
            speed: location.coords.speed || undefined,
          };

          this.currentLocation = geoLocation;
          callback(geoLocation);
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
      throw new Error(`Failed to start location tracking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop location tracking
   */
  stopLocationTracking(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
  }

  /**
   * Validate location against project geofence through backend API
   */
  async validateGeofence(location: GeoLocation, projectId: string, allowFallback: boolean = true): Promise<GeofenceValidation> {
    try {
      // In development mode with bypass enabled, always return valid
      if (__DEV__ && GPS_CONFIG.BYPASS_GEOFENCE_IN_DEV) {
        console.log('🔧 Development mode: bypassing geofence validation');
        return {
          isValid: true,
          distanceFromSite: 0,
          canProceed: true,
          message: 'Development mode - geofence validation bypassed',
          accuracy: location.accuracy,
        };
      }

      const response = await attendanceApiService.validateGeofence({
        projectId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      });

      // Convert API response to internal format
      const validation: GeofenceValidation = {
        isValid: response.data.insideGeofence,
        distanceFromSite: response.data.distance,
        canProceed: response.data.canProceed,
        message: response.data.message,
        accuracy: response.data.accuracy,
      };

      return validation;
    } catch (error) {
      console.error('Geofence validation error:', error);
      
      // If using fallback location or in development mode, be more permissive
      if (allowFallback || __DEV__) {
        console.warn('Geofence validation failed, allowing in development mode');
        return {
          isValid: true,
          distanceFromSite: 0,
          canProceed: true,
          message: 'Development mode - geofence validation bypassed due to error',
          accuracy: location.accuracy,
        };
      }
      
      // Return a default validation result on error
      return {
        isValid: false,
        distanceFromSite: 999,
        canProceed: false,
        message: `Failed to validate location: ${error instanceof Error ? error.message : 'Unknown error'}`,
        accuracy: location.accuracy,
      };
    }
  }

  /**
   * Check GPS accuracy and provide warnings
   */
  checkGPSAccuracy(location: GeoLocation): GPSAccuracyWarning {
    const requiredAccuracy = GPS_CONFIG.REQUIRED_ACCURACY;
    const currentAccuracy = location.accuracy;
    const isAccurate = currentAccuracy <= requiredAccuracy;

    let message = '';
    if (!isAccurate) {
      if (currentAccuracy > 50) {
        message = 'GPS signal is very weak. Please move to an open area away from buildings and try again.';
      } else if (currentAccuracy > 20) {
        message = 'GPS accuracy is poor. Please wait for better signal or move to a clearer location.';
      } else {
        message = 'GPS accuracy is below required threshold. Please wait for better signal.';
      }
    } else {
      message = 'GPS accuracy is good.';
    }

    return {
      isAccurate,
      currentAccuracy,
      requiredAccuracy,
      message,
      canProceed: isAccurate,
    };
  }

  /**
   * Calculate distance between two coordinates in meters
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  }

  /**
   * Get cached current location
   */
  getCachedLocation(): GeoLocation | null {
    return this.currentLocation;
  }

  /**
   * Clear cached location data
   */
  clearCache(): void {
    this.currentLocation = null;
  }
}

// Export singleton instance
export const locationService = LocationService.getInstance();
export default locationService;