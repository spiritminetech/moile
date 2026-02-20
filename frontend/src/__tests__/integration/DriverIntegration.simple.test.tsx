// Simplified Driver Integration Tests
// Task: 12.2 Write comprehensive integration tests for Driver functionality

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { driverApiService } from '../../services/api/DriverApiService';
import { 
  TransportTask, 
  VehicleInfo, 
  DriverPerformance, 
  DriverDashboardResponse,
  GeoLocation,
  User,
  UserRole,
} from '../../types';

// Mock the API service
jest.mock('../../services/api/DriverApiService');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');

// Test data generators
const createMockUser = (role: UserRole = 'Driver'): User => ({
  id: 1,
  employeeId: '