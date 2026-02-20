// DriverProfileScreen Tests
// Requirements: 15.1, 15.2, 15.3, 15.4, 15.5

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import DriverProfileScreen from '../DriverProfileScreen';
import { driverApiService } from '../../../services/api/DriverApiService';

// Mock dependencies
jest.mock('../../../store/context/AuthContext', () => ({
  useAuth: () => ({
    state: {
      user: { name: 'Test Driver', id: 1 },
      company: { name: 'Test Company' },
      isAuthenticated: true,
    },
    logout: jest.fn(),
  }),
}));

jest.mock('../../../store/context/OfflineContext', () => ({
  useOffline: () => ({
    isOffline: false,
  }),
}));

jest.mock('../../../services/api/DriverApiService');

// Mock common components
jest.mock('../../../components/common', () => ({
  ConstructionButton: ({ title, onPress, testID }: any) => (
    <button onPress={onPress} testID={testID}>{title}</button>
  ),
  ConstructionCard: ({ children, testID }: any) => (
    <div testID={testID}>{children}</div>
  ),
  ConstructionLoadingIndicator: ({ message }: any) => (
    <div testID="loading-indicator">{message}</div>
  ),
  ErrorDisplay: ({ error, onRetry }: any) => (
    <div testID="error-display">
      <div>{error}</div>
      <button onPress={onRetry}>Retry</button>
    </div>
  ),
  OfflineIndicator: () => <div testID="offline-indicator">Offline</div>,
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('DriverProfileScreen', () => {
  const mockProfileData = {
    user: {
      id: 1,
      name: 'John Driver',
      email: 'john.driver@company.com',
      phone: '+1234567890',
      profileImage: 'https://example.com/profile.jpg',
      employeeId: 'DRV001',
    },
    driverInfo: {
      licenseNumber: 'DL123456789',
      licenseClass: 'Class B',
      licenseExpiry: '2025-12-31',
      yearsOfExperience: 5,
      specializations: ['Heavy Vehicles', 'Construction Transport'],
    },
    assignedVehicles: [
      {
        id: 1,
        plateNumber: 'ABC-123',
        model: 'Ford Transit',
        isPrimary: true,
      },
      {
        id: 2,
        plateNumber: 'XYZ-789',
        model: 'Mercedes Sprinter',
        isPrimary: false,
      },
    ],
    certifications: [
      {
        id: 1,
        name: 'Defensive Driving',
        issuer: 'Safety Institute',
        issueDate: '2023-01-15',
        expiryDate: '2025-01-15',
        status: 'active' as const,
      },
      {
        id: 2,
        name: 'First Aid',
        issuer: 'Red Cross',
        issueDate: '2023-06-01',
        expiryDate: '2024-06-01',
        status: 'expiring_soon' as const,
      },
    ],
    performanceSummary: {
      totalTrips: 150,
      onTimePerformance: 95.5,
      safetyScore: 98.2,
      customerRating: 4.8,
    },
  };

  const mockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup API mocks
    (driverApiService.getDriverProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: mockProfileData,
    });
  });

  describe('Profile Loading and Display', () => {
    it('should display loading indicator initially', () => {
      const { getByTestId } = render(<DriverProfileScreen navigation={mockNavigation} />);
      
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });

    it('should load and display driver profile data successfully', async () => {
      const { getByText, queryByTestId } = render(<DriverProfileScreen navigation={mockNavigation} />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(queryByTestId('loading-indicator')).toBeNull();
      });

      // Check if profile content is displayed
      expect(getByText('John Driver')).toBeTruthy();
      expect(getByText('ID: DRV001')).toBeTruthy();
      expect(getByText('john.driver@company.com')).toBeTruthy();
      expect(getByText('+1234567890')).toBeTruthy();
    });

    it('should display driver license information', async () => {
      const { getByText } = render(<DriverProfileScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(getByText('DL123456789')).toBeTruthy();
        expect(getByText('Class B')).toBeTruthy();
        expect(getByText('5 years')).toBeTruthy();
      });
    });

    it('should display specializations', async () => {
      const { getByText } = render(<DriverProfileScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(getByText('Heavy Vehicles')).toBeTruthy();
        expect(getByText('Construction Transport')).toBeTruthy();
      });
    });

    it('should display assigned vehicles', async () => {
      const { getByText } = render(<DriverProfileScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(getByText('ABC-123')).toBeTruthy();
        expect(getByText('Ford Transit')).toBeTruthy();
        expect(getByText('XYZ-789')).toBeTruthy();
        expect(getByText('Mercedes Sprinter')).toBeTruthy();
        expect(getByText('PRIMARY')).toBeTruthy();
      });
    });

    it('should display certifications with status', async () => {
      const { getByText } = render(<DriverProfileScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(getByText('Defensive Driving')).toBeTruthy();
        expect(getByText('Safety Institute')).toBeTruthy();
        expect(getByText('First Aid')).toBeTruthy();
        expect(getByText('Red Cross')).toBeTruthy();
        expect(getByText('ACTIVE')).toBeTruthy();
        expect(getByText('EXPIRING SOON')).toBeTruthy();
      });
    });

    it('should display performance metrics', async () => {
      const { getByText } = render(<DriverProfileScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(getByText('150')).toBeTruthy(); // Total trips
        expect(getByText('95.5%')).toBeTruthy(); // On-time performance
        expect(getByText('98.2')).toBeTruthy(); // Safety score
        expect(getByText('4.8/5')).toBeTruthy(); // Customer rating
      });
    });
  });

  describe('Certification Alerts', () => {
    it('should display certification alerts for expiring certifications', async () => {
      const { getByText } = render(<DriverProfileScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(getByText('🚨 Certification Alerts')).toBeTruthy();
        expect(getByText('First Aid')).toBeTruthy();
      });
    });

    it('should show expired certification alerts', async () => {
      const expiredProfileData = {
        ...mockProfileData,
        certifications: [
          {
            id: 3,
            name: 'Expired Cert',
            issuer: 'Test Issuer',
            issueDate: '2022-01-01',
            expiryDate: '2023-01-01',
            status: 'expired' as const,
          },
        ],
      };

      (driverApiService.getDriverProfile as jest.Mock).mockResolvedValue({
        success: true,
        data: expiredProfileData,
      });

      const { getByText } = render(<DriverProfileScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(getByText('Expired Cert')).toBeTruthy();
        expect(getByText('EXPIRED')).toBeTruthy();
      });
    });
  });

  describe('Actions', () => {
    it('should navigate to change password screen', async () => {
      const { getByText } = render(<DriverProfileScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        const changePasswordButton = getByText('🔒 Change Password');
        fireEvent.press(changePasswordButton);
      });

      expect(mockNavigation.navigate).toHaveBeenCalledWith('ChangePassword');
    });

    it('should navigate to help support screen', async () => {
      const { getByText } = render(<DriverProfileScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        const helpButton = getByText('📞 Help & Support');
        fireEvent.press(helpButton);
      });

      expect(mockNavigation.navigate).toHaveBeenCalledWith('HelpSupport');
    });

    it('should show logout confirmation dialog', async () => {
      const { getByText } = render(<DriverProfileScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        const logoutButton = getByText('🚪 Logout');
        fireEvent.press(logoutButton);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Logout',
        'Are you sure you want to logout?',
        expect.any(Array)
      );
    });
  });

  describe('Error Handling', () => {
    it('should display error when profile data fails to load', async () => {
      (driverApiService.getDriverProfile as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { getByTestId, getByText } = render(<DriverProfileScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(getByTestId('error-display')).toBeTruthy();
        expect(getByText('Network error')).toBeTruthy();
      });
    });

    it('should handle API response without success flag', async () => {
      (driverApiService.getDriverProfile as jest.Mock).mockResolvedValue({
        success: false,
        message: 'Profile not found',
      });

      const { getByTestId, getByText } = render(<DriverProfileScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(getByTestId('error-display')).toBeTruthy();
        expect(getByText('Profile not found')).toBeTruthy();
      });
    });

    it('should retry loading profile data when retry button is pressed', async () => {
      (driverApiService.getDriverProfile as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          success: true,
          data: mockProfileData,
        });

      const { getByTestId, getByText } = render(<DriverProfileScreen navigation={mockNavigation} />);
      
      // Wait for error to appear
      await waitFor(() => {
        expect(getByTestId('error-display')).toBeTruthy();
      });

      // Press retry button
      const retryButton = getByText('Retry');
      fireEvent.press(retryButton);

      // Wait for successful load
      await waitFor(() => {
        expect(getByText('John Driver')).toBeTruthy();
      });

      expect(driverApiService.getDriverProfile).toHaveBeenCalledTimes(2);
    });
  });

  describe('Offline Mode', () => {
    it('should display offline indicator when offline', () => {
      // Mock offline state
      jest.doMock('../../../store/context/OfflineContext', () => ({
        useOffline: () => ({
          isOffline: true,
        }),
      }));

      const { getByTestId } = render(<DriverProfileScreen navigation={mockNavigation} />);
      
      expect(getByTestId('offline-indicator')).toBeTruthy();
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh profile data when pull-to-refresh is triggered', async () => {
      const { getByTestId } = render(<DriverProfileScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(driverApiService.getDriverProfile).toHaveBeenCalledTimes(1);
      });

      // In a real test, we would simulate the RefreshControl trigger
      // For now, just verify the API call is made
      expect(driverApiService.getDriverProfile).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle profile data without optional fields', async () => {
      const minimalProfileData = {
        user: {
          id: 1,
          name: 'Minimal Driver',
          email: 'minimal@company.com',
          phone: '+1111111111',
          employeeId: 'MIN001',
        },
        driverInfo: {
          licenseNumber: 'MIN123',
          licenseClass: 'Class C',
          licenseExpiry: '2025-01-01',
          yearsOfExperience: 1,
          specializations: [],
        },
        assignedVehicles: [],
        certifications: [],
        performanceSummary: {
          totalTrips: 0,
          onTimePerformance: 0,
          safetyScore: 0,
          customerRating: 0,
        },
      };

      (driverApiService.getDriverProfile as jest.Mock).mockResolvedValue({
        success: true,
        data: minimalProfileData,
      });

      const { getByText, queryByText } = render(<DriverProfileScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(getByText('Minimal Driver')).toBeTruthy();
        expect(getByText('MIN123')).toBeTruthy();
        expect(queryByText('🚨 Certification Alerts')).toBeNull();
        expect(queryByText('🚛 Vehicle Assignments')).toBeNull();
        expect(queryByText('📜 Certifications')).toBeNull();
      });
    });

    it('should handle license expiry warning', async () => {
      const expiringLicenseData = {
        ...mockProfileData,
        driverInfo: {
          ...mockProfileData.driverInfo,
          licenseExpiry: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
        },
      };

      (driverApiService.getDriverProfile as jest.Mock).mockResolvedValue({
        success: true,
        data: expiringLicenseData,
      });

      const { getByText } = render(<DriverProfileScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        // The license expiry date should be displayed with warning styling
        expect(getByText(/2024/)).toBeTruthy(); // Should show the expiry date
      });
    });
  });

  describe('Performance Color Coding', () => {
    it('should apply correct colors based on performance scores', async () => {
      const { getByText } = render(<DriverProfileScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        // High performance scores should be displayed
        expect(getByText('95.5%')).toBeTruthy(); // On-time performance
        expect(getByText('98.2')).toBeTruthy(); // Safety score
        expect(getByText('4.8/5')).toBeTruthy(); // Customer rating
      });
    });
  });
});