// ProfileScreen unit tests
// Requirements: 8.1, 8.2, 8.4, 8.5

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../ProfileScreen';
import { workerApiService } from '../../../services/api/WorkerApiService';

// Mock the API service
jest.mock('../../../services/api/WorkerApiService', () => ({
  workerApiService: {
    getProfile: jest.fn(),
    getCertificationExpiryAlerts: jest.fn(),
  },
}));

// Mock LoadingOverlay
jest.mock('../../../components/common/LoadingOverlay', () => {
  return function MockLoadingOverlay({ visible, message }: { visible: boolean; message: string }) {
    const { Text } = require('react-native');
    return visible ? <Text testID="loading-overlay">{message}</Text> : null;
  };
});

const mockProfileData = {
  user: {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    profileImage: 'https://example.com/profile.jpg',
    employeeId: 'EMP001',
  },
  certifications: [
    {
      id: 1,
      name: 'Safety Certification',
      issuer: 'Safety Institute',
      issueDate: '2023-01-01',
      expiryDate: '2024-01-01',
      certificateNumber: 'CERT001',
      status: 'active' as const,
    },
    {
      id: 2,
      name: 'Equipment Certification',
      issuer: 'Equipment Authority',
      issueDate: '2023-06-01',
      expiryDate: '2024-06-01',
      certificateNumber: 'CERT002',
      status: 'expiring_soon' as const,
    },
  ],
  workPass: {
    id: 1,
    passNumber: 'WP001',
    issueDate: '2023-01-01',
    expiryDate: '2024-12-31',
    status: 'active' as const,
  },
  salaryInfo: {
    basicSalary: 50000,
    allowances: 5000,
    totalEarnings: 55000,
    currency: 'USD',
  },
};

const mockCertificationAlerts = [
  {
    certificationId: 2,
    name: 'Equipment Certification',
    expiryDate: '2024-06-01',
    daysUntilExpiry: 30,
    alertLevel: 'warning' as const,
  },
];

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (workerApiService.getProfile as jest.Mock).mockImplementation(() => new Promise(() => {}));
    (workerApiService.getCertificationExpiryAlerts as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const { getByTestId } = render(<ProfileScreen />);
    
    expect(getByTestId('loading-overlay')).toBeTruthy();
  });

  it('should render profile data when loaded successfully', async () => {
    (workerApiService.getProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: mockProfileData,
    });
    (workerApiService.getCertificationExpiryAlerts as jest.Mock).mockResolvedValue({
      success: true,
      data: mockCertificationAlerts,
    });

    const { getByText, queryByTestId } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(queryByTestId('loading-overlay')).toBeNull();
    });

    // Check personal information
    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('john.doe@example.com')).toBeTruthy();
    expect(getByText('+1234567890')).toBeTruthy();
    expect(getByText('ID: EMP001')).toBeTruthy();

    // Check certifications
    expect(getByText('Safety Certification')).toBeTruthy();
    expect(getByText('Equipment Certification')).toBeTruthy();
    expect(getByText('Safety Institute')).toBeTruthy();
    expect(getByText('CERT001')).toBeTruthy();

    // Check work pass
    expect(getByText('Work Authorization')).toBeTruthy();
    expect(getByText('WP001')).toBeTruthy();

    // Check salary information
    expect(getByText('USD 50,000')).toBeTruthy();
    expect(getByText('USD 5,000')).toBeTruthy();
    expect(getByText('USD 55,000')).toBeTruthy();
  });

  it('should handle API errors gracefully', async () => {
    (workerApiService.getProfile as jest.Mock).mockRejectedValue(new Error('API Error'));
    (workerApiService.getCertificationExpiryAlerts as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });

    const { getByText, queryByTestId } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(queryByTestId('loading-overlay')).toBeNull();
    });

    expect(getByText('API Error')).toBeTruthy();
    expect(getByText('Retry')).toBeTruthy();
  });

  it('should display certification status badges correctly', async () => {
    (workerApiService.getProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: mockProfileData,
    });
    (workerApiService.getCertificationExpiryAlerts as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('ACTIVE')).toBeTruthy();
      expect(getByText('EXPIRING SOON')).toBeTruthy();
    });
  });

  it('should format dates correctly', async () => {
    (workerApiService.getProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: mockProfileData,
    });
    (workerApiService.getCertificationExpiryAlerts as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Jan 1, 2023')).toBeTruthy();
      expect(getByText('Jan 1, 2024')).toBeTruthy();
    });
  });
});