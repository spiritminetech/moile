// Location Context Provider for managing GPS and geofencing state

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { GeoLocation, LocationState, GeofenceValidation, GPSAccuracyWarning } from '../../types';
import { locationService } from '../../services/location/LocationService';

// Location Actions
type LocationAction =
  | { type: 'SET_LOCATION'; payload: GeoLocation }
  | { type: 'SET_LOCATION_PERMISSION'; payload: boolean }
  | { type: 'SET_LOCATION_ENABLED'; payload: boolean }
  | { type: 'SET_GEOFENCE_VALIDATION'; payload: { isValid: boolean; distance: number } }
  | { type: 'SET_LOCATION_ERROR'; payload: string | undefined }
  | { type: 'CLEAR_LOCATION_ERROR' }
  | { type: 'RESET_LOCATION_STATE' };

// Initial state
const initialLocationState: LocationState = {
  currentLocation: null,
  isLocationEnabled: false,
  hasLocationPermission: false,
  isGeofenceValid: false,
  distanceFromSite: 999,
  locationError: undefined,
};

// Location reducer
function locationReducer(state: LocationState, action: LocationAction): LocationState {
  switch (action.type) {
    case 'SET_LOCATION':
      return {
        ...state,
        currentLocation: action.payload,
        locationError: undefined,
      };
    case 'SET_LOCATION_PERMISSION':
      return {
        ...state,
        hasLocationPermission: action.payload,
      };
    case 'SET_LOCATION_ENABLED':
      return {
        ...state,
        isLocationEnabled: action.payload,
      };
    case 'SET_GEOFENCE_VALIDATION':
      return {
        ...state,
        isGeofenceValid: action.payload.isValid,
        distanceFromSite: action.payload.distance,
      };
    case 'SET_LOCATION_ERROR':
      return {
        ...state,
        locationError: action.payload,
      };
    case 'CLEAR_LOCATION_ERROR':
      return {
        ...state,
        locationError: undefined,
      };
    case 'RESET_LOCATION_STATE':
      return initialLocationState;
    default:
      return state;
  }
}

// Context interface
interface LocationContextType {
  state: LocationState;
  getCurrentLocation: () => Promise<GeoLocation>;
  startLocationTracking: () => Promise<void>;
  stopLocationTracking: () => void;
  validateGeofence: (projectId: number) => Promise<GeofenceValidation>;
  checkGPSAccuracy: () => GPSAccuracyWarning | null;
  requestLocationPermissions: () => Promise<boolean>;
  clearLocationError: () => void;
  resetLocationState: () => void;
}

// Create context
const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Export the context for direct usage
export { LocationContext };

// Provider props
interface LocationProviderProps {
  children: ReactNode;
}

// Location Provider component
export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(locationReducer, initialLocationState);

  // Initialize location services on mount
  useEffect(() => {
    initializeLocationServices();
    
    // Cleanup on unmount
    return () => {
      locationService.stopLocationTracking();
    };
  }, []);

  const initializeLocationServices = async () => {
    try {
      // Check if location services are enabled
      const isEnabled = await locationService.isLocationEnabled();
      dispatch({ type: 'SET_LOCATION_ENABLED', payload: isEnabled });

      // Check location permissions
      const hasPermission = await locationService.requestLocationPermissions();
      dispatch({ type: 'SET_LOCATION_PERMISSION', payload: hasPermission });

      if (hasPermission && isEnabled) {
        // Get initial location
        try {
          const location = await locationService.getCurrentLocation();
          dispatch({ type: 'SET_LOCATION', payload: location });
        } catch (error) {
          dispatch({ 
            type: 'SET_LOCATION_ERROR', 
            payload: error instanceof Error ? error.message : 'Failed to get location' 
          });
        }
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_LOCATION_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to initialize location services' 
      });
    }
  };

  const getCurrentLocation = async (): Promise<GeoLocation> => {
    try {
      dispatch({ type: 'CLEAR_LOCATION_ERROR' });
      const location = await locationService.getCurrentLocation();
      dispatch({ type: 'SET_LOCATION', payload: location });
      return location;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
      dispatch({ type: 'SET_LOCATION_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const startLocationTracking = async (): Promise<void> => {
    try {
      dispatch({ type: 'CLEAR_LOCATION_ERROR' });
      await locationService.startLocationTracking((location) => {
        dispatch({ type: 'SET_LOCATION', payload: location });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start location tracking';
      dispatch({ type: 'SET_LOCATION_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const stopLocationTracking = (): void => {
    locationService.stopLocationTracking();
  };

  const validateGeofence = async (projectId: number): Promise<GeofenceValidation> => {
    try {
      if (!state.currentLocation) {
        throw new Error('No current location available');
      }

      dispatch({ type: 'CLEAR_LOCATION_ERROR' });
      const validation = await locationService.validateGeofence(state.currentLocation, projectId.toString());
      
      dispatch({ 
        type: 'SET_GEOFENCE_VALIDATION', 
        payload: { 
          isValid: validation.isValid, 
          distance: validation.distanceFromSite 
        } 
      });

      return validation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to validate geofence';
      dispatch({ type: 'SET_LOCATION_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const checkGPSAccuracy = (): GPSAccuracyWarning | null => {
    if (!state.currentLocation) {
      return null;
    }
    return locationService.checkGPSAccuracy(state.currentLocation);
  };

  const requestLocationPermissions = async (): Promise<boolean> => {
    try {
      const hasPermission = await locationService.requestLocationPermissions();
      dispatch({ type: 'SET_LOCATION_PERMISSION', payload: hasPermission });
      return hasPermission;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request location permissions';
      dispatch({ type: 'SET_LOCATION_ERROR', payload: errorMessage });
      return false;
    }
  };

  const clearLocationError = (): void => {
    dispatch({ type: 'CLEAR_LOCATION_ERROR' });
  };

  const resetLocationState = (): void => {
    locationService.stopLocationTracking();
    locationService.clearCache();
    dispatch({ type: 'RESET_LOCATION_STATE' });
  };

  const contextValue: LocationContextType = {
    state,
    getCurrentLocation,
    startLocationTracking,
    stopLocationTracking,
    validateGeofence,
    checkGPSAccuracy,
    requestLocationPermissions,
    clearLocationError,
    resetLocationState,
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
};

// Custom hook to use location context
export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export default LocationContext;