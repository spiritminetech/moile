// Jest test setup file

import 'react-native-gesture-handler/jestSetup';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

// Mock location services (will be implemented in location task)
jest.mock('../services/location', () => ({
  getCurrentLocation: jest.fn(),
  requestLocationPermission: jest.fn(),
  validateGeofence: jest.fn(),
}));

// Mock camera services (will be implemented in camera task)
jest.mock('../services/camera', () => ({
  openCamera: jest.fn(),
  openGallery: jest.fn(),
}));

// Mock push notifications (will be implemented in notifications task)
jest.mock('../services/notifications', () => ({
  requestPermission: jest.fn(),
  registerForPushNotifications: jest.fn(),
}));

// Global test utilities
global.console = {
  ...console,
  // Suppress console.warn and console.error in tests unless needed
  warn: jest.fn(),
  error: jest.fn(),
};