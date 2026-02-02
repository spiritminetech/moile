import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TaskHistoryScreen from '../TaskHistoryScreen';
import * as useTaskHistoryModule from '../../../hooks/useTaskHistory';
import * as useOfflineModule from '../../../store/context/OfflineContext';
import { TaskAssignment } from '../../../types';

// Mock the hooks
jest.mock('../../../hooks/useTaskHistory');
jest.mock('../../../store/context/OfflineContext');

const mockUseTaskHistory = useTaskHistoryModule.useTaskHistory as jest.MockedFunction<typeof useTaskHistoryModule.useTaskHistory>;
const mockUseOffline = useOfflineModule.useOffline as jest.MockedFunction<typeof useOfflineModule.useOffline>;

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const mockTasks: TaskAssignment[] = [
  {
    assignmentId: 1,
    projectId: 1,
    taskName: 'Test Task 1',
    description: 'Test description 1',
    dependencies: [],
    sequence: 1,
    status: 'completed',
    location: { latitude: 0, longitude: 0, accuracy: 10, timestamp: new Date() },
    estimatedHours: 8,
    actualHours: 7.5,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-01T16:00:00Z',
    completedAt: '2024-01-01T15:30:00Z',
  },
  {
    assignmentId: 2,
    projectId: 1,
    taskName: 'Test Task 2',
    description: 'Test description 2',
    dependencies: [],
    sequence: 2,
    status: 'in_progress',
    location: { latitude: 0, longitude: 0, accuracy: 10, timestamp: new Date() },
    estimatedHours: 6,
    actualHours: 3,
    createdAt: '2024-01-02T08:00:00Z',
    updatedAt: '2024-01-02T12:00:00Z',
    startedAt: '2024-01-02T09:00:00Z',
  },
];

const mockTaskHistory: useTaskHistoryModule.UseTaskHistoryReturn = {
  tasks: mockTasks,
  filteredTasks: mockTasks,
  isLoading: false,
  error: null,
  refreshData: jest.fn(),
  lastRefresh: new Date(),
  isRefreshing: false,
  filterTasks: jest.fn(),
  currentFilter: 'all',
};

const mockOfflineContext = {
  state: {
    isOnline: true,
    lastSyncTime: null,
    queuedActions: [],
    cachedData: {
      tasks: [],
      attendance: [],
      notifications: [],
      lastUpdated: new Date(),
    },
    isLoading: false,
    syncError: null,
  },
  isOnline: true,
  isOffline: false,
  cacheData: jest.fn(),
  getCachedData: jest.fn(),
  queueAction: jest.fn(),
  syncQueuedActions: jest.fn(),
  clearSyncError: jest.fn(),
  getDataFreshness: jest.fn(() => ({
    lastSyncTime: null,
    isStale: false,
    staleDuration: '0 minutes',
  })),
};

describe('TaskHistoryScreen', () => {
  beforeEach(() => {
    mockUseTaskHistory.mockReturnValue(mockTaskHistory);
    mockUseOffline.mockReturnValue(mockOfflineContext);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders task history screen correctly', () => {
    const { getByText } = render(
      React.createElement(TaskHistoryScreen, { navigation: mockNavigation })
    );

    expect(getByText('All (2)')).toBeTruthy();
    expect(getByText('Completed (1)')).toBeTruthy();
    expect(getByText('In Progress (1)')).toBeTruthy();
  });

  it('calls filterTasks when filter button is pressed', () => {
    const { getByText } = render(
      React.createElement(TaskHistoryScreen, { navigation: mockNavigation })
    );

    fireEvent.press(getByText('Completed (1)'));
    expect(mockTaskHistory.filterTasks).toHaveBeenCalledWith('completed');
  });

  it('shows loading state correctly', () => {
    mockUseTaskHistory.mockReturnValue({
      ...mockTaskHistory,
      isLoading: true,
    });

    const { getByText } = render(
      React.createElement(TaskHistoryScreen, { navigation: mockNavigation })
    );

    expect(getByText('Loading task history...')).toBeTruthy();
  });

  it('shows error state correctly', () => {
    mockUseTaskHistory.mockReturnValue({
      ...mockTaskHistory,
      tasks: [],
      filteredTasks: [],
      error: 'Failed to load task history',
    });

    const { getByText } = render(
      React.createElement(TaskHistoryScreen, { navigation: mockNavigation })
    );

    expect(getByText('Unable to Load Task History')).toBeTruthy();
  });

  it('shows empty state when no tasks', () => {
    mockUseTaskHistory.mockReturnValue({
      ...mockTaskHistory,
      tasks: [],
      filteredTasks: [],
    });

    const { getByText } = render(
      React.createElement(TaskHistoryScreen, { navigation: mockNavigation })
    );

    expect(getByText('No Task History')).toBeTruthy();
    expect(getByText('You have no task history yet. Complete some tasks to see them here.')).toBeTruthy();
  });
});