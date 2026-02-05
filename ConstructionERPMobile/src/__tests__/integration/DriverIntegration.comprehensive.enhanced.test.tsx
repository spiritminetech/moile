{
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      reset: jest.fn(),
      setOptions: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
    NavigationContainer: ({ children }: any) => children,
  };
});neContext';

// Import types
import {
  DriverDashboardResponse,
  TransportTask,
  VehicleInfo,
  DriverPerformance,
  TripRecord,
  MaintenanceAlert,
  GeoLocation,
  User,
  UserRole,
} from '../../types';

// Mock external dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');
jest.mock('../../services/api/DriverApiService');
jest.mock('../../services/api/client');

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  return gation/DriverNavigator';
import AppNavigator from '../../navigation/AppNavigator';

// Import API services
import { driverApiService } from '../../services/api/DriverApiService';
import { apiClient } from '../../services/api/client';

// Import contexts
import { AuthProvider } from '../../store/context/AuthContext';
import { DriverProvider } from '../../store/context/DriverContext';
import { LocationProvider } from '../../store/context/LocationContext';
import { OfflineProvider } from '../../store/context/Offli components and services
import DriverDashboard from '../../screens/driver/DriverDashboard';
import TransportTasksScreen from '../../screens/driver/TransportTasksScreen';
import TripUpdatesScreen from '../../screens/driver/TripUpdatesScreen';
import DriverAttendanceScreen from '../../screens/driver/DriverAttendanceScreen';
import VehicleInfoScreen from '../../screens/driver/VehicleInfoScreen';
import DriverProfileScreen from '../../screens/driver/DriverProfileScreen';
import DriverNavigator from '../../navi// Enhanced Comprehensive Driver Integration Tests - Task 12.2
// Complete Driver workflows from login to trip completion, API integration, offline mode, cross-platform compatibility

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as fc from 'fast-check';

// Import Driver