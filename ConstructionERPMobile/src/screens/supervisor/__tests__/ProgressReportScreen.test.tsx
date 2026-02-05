// ProgressReportScreen Tests
// Requirements: 5.1, 5.2, 5.3, 5.4, 5.5

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProgressReportScreen from '../ProgressReportScreen';
import { SupervisorProvider } from '../../../store/context/SupervisorContext';

// Mock the supervisor API service
jest.mock('../../../services/api/SupervisorApiService', () => ({
  supervisorApiService: {
    createProgressReport: jest.fn().mockResolvedValue({
      success: true,
      data: {
        reportId: 'test-report-123',
        date: '2024-01-15',
        status: 'draft',
        createdAt: '2024-01-15T10:00:00Z',
      },
    }),
    submitProgressReport: jest.fn().mockResolvedValue({
      success: true,
    }),
  },
}));

// Mock the camera service
jest.mock('../../../services/camera/CameraService', () => ({
  cameraService: {
    capturePhoto: jest.fn().mockResolvedValue({
      id: 1,
      photoId: 'photo-123',
      filename: 'test-photo.jpg',
      url: 'https://example.com/photo.jpg',
      uri: 'file://test-photo.jpg',
      size: 1024,
      mimeType: 'image/jpeg',
      timestamp: new Date(),
      category: 'progress',
      uploadedAt: new Date().toISOString(),
    }),
    selectFromGallery: jest.fn().mockResolvedValue({
      id: 2,
      photoId: 'photo-456',
      filename: 'gallery-photo.jpg',
      url: 'https://example.com/gallery-photo.jpg',
      uri: 'file://gallery-photo.jpg',
      size: 2048,
      mimeType: 'image/jpeg',
      timestamp: new Date(),
      category: 'progress',
      uploadedAt: new Date().toISOString(),
    }),
  },
}));

// Mock supervisor context
const mockSupervisorContext = {
  state: {
    isLoading: false,
    error: null,
    teamLoading: false,
    approvalsLoading: false,
    reportsLoading: false,
  },
  refreshAllData: jest.fn(),
  clearError: jest.fn(),
};

const MockSupervisorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SupervisorProvider value={mockSupervisorContext}>
    {children}
  </SupervisorProvider>
);

describe('ProgressReportScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with initial state', () => {
    const { getByText, getByPlaceholderText } = render(
      <MockSupervisorProvider>
        <ProgressReportScreen />
      </MockSupervisorProvider>
    );

    expect(getByText('Progress Report')).toBeTruthy();
    expect(getByText('Overview')).toBeTruthy();
    expect(getByPlaceholderText('YYYY-MM-DD')).toBeTruthy();
  });

  it('allows project selection', () => {
    const { getByText } = render(
      <MockSupervisorProvider>
        <ProgressReportScreen />
      </MockSupervisorProvider>
    );

    // Should show available projects
    expect(getByText('Construction Site A')).toBeTruthy();
    expect(getByText('Construction Site B')).toBeTruthy();

    // Tap on a project
    fireEvent.press(getByText('Construction Site A'));
    
    // Project should be selected (visual feedback would be tested in integration tests)
  });

  it('allows adding issues', async () => {
    const { getByText, getByPlaceholderText } = render(
      <MockSupervisorProvider>
        <ProgressReportScreen />
      </MockSupervisorProvider>
    );

    // Navigate to issues section
    fireEvent.press(getByText('Issues'));

    // Add issue button should be visible
    expect(getByText('Add Issue')).toBeTruthy();

    // Tap add issue
    fireEvent.press(getByText('Add Issue'));

    // Modal should open with issue form
    expect(getByText('Add Issue')).toBeTruthy();
    expect(getByPlaceholderText('Describe the issue in detail...')).toBeTruthy();
  });

  it('allows adding materials', async () => {
    const { getByText, getByPlaceholderText } = render(
      <MockSupervisorProvider>
        <ProgressReportScreen />
      </MockSupervisorProvider>
    );

    // Navigate to materials section
    fireEvent.press(getByText('Materials'));

    // Add material button should be visible
    expect(getByText('Add Material')).toBeTruthy();

    // Tap add material
    fireEvent.press(getByText('Add Material'));

    // Modal should open with material form
    expect(getByText('Add Material')).toBeTruthy();
    expect(getByPlaceholderText('e.g., Concrete, Steel Bars, Bricks...')).toBeTruthy();
  });

  it('allows adding photos', async () => {
    const { getByText } = render(
      <MockSupervisorProvider>
        <ProgressReportScreen />
      </MockSupervisorProvider>
    );

    // Navigate to photos section
    fireEvent.press(getByText('Photos'));

    // Add photo button should be visible
    expect(getByText('Add Photo')).toBeTruthy();

    // Tap add photo
    fireEvent.press(getByText('Add Photo'));

    // Modal should open with photo options
    expect(getByText('Take Photo')).toBeTruthy();
    expect(getByText('Choose from Gallery')).toBeTruthy();
  });

  it('shows manpower utilization data', () => {
    const { getByText } = render(
      <MockSupervisorProvider>
        <ProgressReportScreen />
      </MockSupervisorProvider>
    );

    // Select a project first
    fireEvent.press(getByText('Construction Site A'));

    // Navigate to manpower section
    fireEvent.press(getByText('Manpower'));

    // Should show manpower metrics
    expect(getByText('Total Workers')).toBeTruthy();
    expect(getByText('Active Today')).toBeTruthy();
    expect(getByText('Productivity')).toBeTruthy();
    expect(getByText('Efficiency')).toBeTruthy();
  });

  it('shows progress metrics', () => {
    const { getByText } = render(
      <MockSupervisorProvider>
        <ProgressReportScreen />
      </MockSupervisorProvider>
    );

    // Select a project first
    fireEvent.press(getByText('Construction Site A'));

    // Navigate to progress section
    fireEvent.press(getByText('Progress'));

    // Should show progress metrics
    expect(getByText('Complete')).toBeTruthy();
    expect(getByText('Milestones')).toBeTruthy();
    expect(getByText('Tasks Done')).toBeTruthy();
    expect(getByText('Hours Worked')).toBeTruthy();
  });

  it('validates required fields before saving', async () => {
    const { getByText } = render(
      <MockSupervisorProvider>
        <ProgressReportScreen />
      </MockSupervisorProvider>
    );

    // Try to save without selecting project or entering summary
    fireEvent.press(getByText('Save'));

    // Should show validation error
    await waitFor(() => {
      expect(getByText('Please select a project and enter a summary')).toBeTruthy();
    });
  });

  it('saves report successfully', async () => {
    const { getByText, getByPlaceholderText } = render(
      <MockSupervisorProvider>
        <ProgressReportScreen />
      </MockSupervisorProvider>
    );

    // Select project
    fireEvent.press(getByText('Construction Site A'));

    // Enter summary
    const summaryInput = getByPlaceholderText('Enter a comprehensive summary of today\'s progress...');
    fireEvent.changeText(summaryInput, 'Test progress summary');

    // Save report
    fireEvent.press(getByText('Save'));

    // Should show success message
    await waitFor(() => {
      expect(getByText('Report saved successfully')).toBeTruthy();
    });
  });
});