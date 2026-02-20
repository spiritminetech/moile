// RouteDeviationMonitor - Monitors route deviations during transport tasks
// Automatically detects when driver deviates from planned route

import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { driverApiService } from './api/DriverApiService';

interface Location {
  latitude: number;
  longitude: number;
}

interface RouteDeviationConfig {
  taskId: string | number;
  plannedRoute: {
    pickupLocation: Location;
    dropLocation: Location;
    waypoints?: Location[];
  };
  deviationThreshold?: number; // meters, default 500m
  autoReport?: boolean; // Auto-report deviations
  onDeviation?: (deviation: DeviationData) => void;
}

interface DeviationData {
  deviationDistance: number;
  currentLocation: Location;
  nearestWaypoint: Location;
  severity: 'minor' | 'moderate' | 'major';
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns distance in meters
 */
const calculateDistance = (loc1: Location, loc2: Location): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (loc1.latitude * Math.PI) / 180;
  const φ2 = (loc2.latitude * Math.PI) / 180;
  const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
  const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Find nearest waypoint to current location
 */
const findNearestWaypoint = (
  currentLocation: Location,
  waypoints: Location[]
): { waypoint: Location; distance: number } => {
  let minDistance = Infinity;
  let nearestWaypoint = waypoints[0];

  waypoints.forEach(waypoint => {
    const distance = calculateDistance(currentLocation, waypoint);
    if (distance < minDistance) {
      minDistance = distance;
      nearestWaypoint = waypoint;
    }
  });

  return { waypoint: nearestWaypoint, distance: minDistance };
};

/**
 * Hook for monitoring route deviations
 */
export const useRouteDeviationMonitor = (config: RouteDeviationConfig) => {
  const {
    taskId,
    plannedRoute,
    deviationThreshold = 500,
    autoReport = true,
    onDeviation,
  } = config;

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentDeviation, setCurrentDeviation] = useState<DeviationData | null>(null);
  const [deviationHistory, setDeviationHistory] = useState<DeviationData[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const lastReportedDeviationRef = useRef<number>(0);

  const waypoints = [
    plannedRoute.pickupLocation,
    ...(plannedRoute.waypoints || []),
    plannedRoute.dropLocation,
  ];

  const checkDeviation = async (currentLocation: Location) => {
    const { waypoint: nearestWaypoint, distance: deviationDistance } =
      findNearestWaypoint(currentLocation, waypoints);

    if (deviationDistance > deviationThreshold) {
      const severity: 'minor' | 'moderate' | 'major' =
        deviationDistance > 1000 ? 'major' : deviationDistance > 500 ? 'moderate' : 'minor';

      const deviation: DeviationData = {
        deviationDistance,
        currentLocation,
        nearestWaypoint,
        severity,
      };

      setCurrentDeviation(deviation);
      setDeviationHistory(prev => [...prev, deviation]);

      // Call callback
      if (onDeviation) {
        onDeviation(deviation);
      }

      // Auto-report if enabled and significant deviation
      if (autoReport && deviationDistance > deviationThreshold) {
        // Avoid reporting too frequently (max once per 5 minutes)
        const now = Date.now();
        if (now - lastReportedDeviationRef.current > 5 * 60 * 1000) {
          await reportDeviation(deviation);
          lastReportedDeviationRef.current = now;
        }
      }
    } else {
      setCurrentDeviation(null);
    }
  };

  const reportDeviation = async (deviation: DeviationData, reason?: string) => {
    try {
      const response = await driverApiService.reportRouteDeviation(taskId, {
        currentLocation: deviation.currentLocation,
        plannedRoute: {
          currentWaypoint: deviation.nearestWaypoint,
        },
        deviationDistance: deviation.deviationDistance,
        reason: reason || 'Auto-detected deviation',
        autoDetected: !reason,
      });

      if (response.success) {
        console.log('✅ Route deviation reported:', response.data);
        
        if (response.data?.supervisorNotified) {
          Alert.alert(
            'Deviation Reported',
            'Your supervisor has been notified about the route deviation.'
          );
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to report deviation:', error);
    }
  };

  const startMonitoring = () => {
    if (isMonitoring) return;

    console.log('🗺️ Starting route deviation monitoring for task:', taskId);
    setIsMonitoring(true);

    watchIdRef.current = Geolocation.watchPosition(
      position => {
        const currentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        checkDeviation(currentLocation);
      },
      error => {
        console.error('❌ Location error:', error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 50, // Update every 50 meters
        interval: 30000, // 30 seconds
        fastestInterval: 15000, // 15 seconds
      }
    );
  };

  const stopMonitoring = () => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsMonitoring(false);
    console.log('🛑 Stopped route deviation monitoring');
  };

  const manualReportDeviation = async (reason: string) => {
    if (!currentDeviation) {
      Alert.alert('No Deviation', 'No route deviation detected at the moment.');
      return;
    }

    await reportDeviation(currentDeviation, reason);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, []);

  return {
    isMonitoring,
    currentDeviation,
    deviationHistory,
    startMonitoring,
    stopMonitoring,
    manualReportDeviation,
  };
};

export default useRouteDeviationMonitor;
