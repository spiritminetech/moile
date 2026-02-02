// LocationService unit tests

import { LocationService } from '../LocationService';
import { GPS_CONFIG } from '../../../utils/constants';

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
  Accuracy: {
    High: 4,
  },
}));

// Mock API client
jest.mock('../../api/client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

describe('LocationService', () => {
  let locationService: LocationService;

  beforeEach(() => {
    locationService = LocationService.getInstance();
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = LocationService.getInstance();
      const instance2 = LocationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates correctly', () => {
      // Test with known coordinates (approximately 1km apart)
      const lat1 = 1.3521; // Singapore
      const lon1 = 103.8198;
      const lat2 = 1.3621; // ~1km north
      const lon2 = 103.8198;

      const distance = locationService.calculateDistance(lat1, lon1, lat2, lon2);
      
      // Should be approximately 1111 meters (1 degree latitude ≈ 111km)
      expect(distance).toBeGreaterThan(1000);
      expect(distance).toBeLessThan(1200);
    });

    it('should return 0 for same coordinates', () => {
      const distance = locationService.calculateDistance(1.3521, 103.8198, 1.3521, 103.8198);
      expect(distance).toBe(0);
    });
  });

  describe('checkGPSAccuracy', () => {
    it('should return accurate warning for good GPS signal', () => {
      const location = {
        latitude: 1.3521,
        longitude: 103.8198,
        accuracy: 5,
        timestamp: new Date(),
      };

      const warning = locationService.checkGPSAccuracy(location);
      
      expect(warning.isAccurate).toBe(true);
      expect(warning.canProceed).toBe(true);
      expect(warning.currentAccuracy).toBe(5);
      expect(warning.requiredAccuracy).toBe(GPS_CONFIG.REQUIRED_ACCURACY);
    });

    it('should return inaccurate warning for poor GPS signal', () => {
      const location = {
        latitude: 1.3521,
        longitude: 103.8198,
        accuracy: 50,
        timestamp: new Date(),
      };

      const warning = locationService.checkGPSAccuracy(location);
      
      expect(warning.isAccurate).toBe(false);
      expect(warning.canProceed).toBe(false);
      expect(warning.currentAccuracy).toBe(50);
      expect(warning.message).toContain('GPS accuracy is poor');
    });

    it('should provide appropriate messages for different accuracy levels', () => {
      const testCases = [
        { accuracy: 5, expectedMessage: 'GPS accuracy is good' },
        { accuracy: 15, expectedMessage: 'GPS accuracy is below required threshold' },
        { accuracy: 25, expectedMessage: 'GPS accuracy is poor' },
        { accuracy: 60, expectedMessage: 'GPS signal is very weak' },
      ];

      testCases.forEach(({ accuracy, expectedMessage }) => {
        const location = {
          latitude: 1.3521,
          longitude: 103.8198,
          accuracy,
          timestamp: new Date(),
        };

        const warning = locationService.checkGPSAccuracy(location);
        expect(warning.message).toContain(expectedMessage);
      });
    });
  });

  describe('getCachedLocation', () => {
    it('should return null initially', () => {
      const cachedLocation = locationService.getCachedLocation();
      expect(cachedLocation).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should clear cached location', () => {
      locationService.clearCache();
      const cachedLocation = locationService.getCachedLocation();
      expect(cachedLocation).toBeNull();
    });
  });
});