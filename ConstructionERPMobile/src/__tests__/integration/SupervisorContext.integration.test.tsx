// Supervisor Context Integration Tests
// Task: 12.1 Write comprehensive integration tests for Supervisor functionality
// Focus: Context state management and provider integration

import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { SupervisorProvider, useSupervisorContext } from '../../store/context/SupervisorContext';
import { AuthProvider } from '../../store/context/AuthContext';
import { OfflineProvider } from '../../store/context/OfflineContext';
import { LocationProvider } from '../../store/context/LocationContext';
import {
  TeamMember,
  PendingApproval,
  MaterialRequest,
  ToolAllocation,
  TaskAssignmentRequest,
  ProgressReport,
  User,
  UserRole,
} from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;

// Test component to access context
const TestComponent: React.FC<{
  onContextReady?: (context: ReturnType<typeof useSupervisorContext>) => void;
}> = ({ onContextReady }) => {
  const context = useSupervisorContext();
  
  React.useEffect(() => {
    if (onContextReady) {
      onContextReady(context);
    }
  }, [context, onContextReady]);

  return null;
};

// Provider wrapper for tests
const ProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mockUser: User = {
    id: 1,
    employeeId: 'SUP001',
    name: 'Test Supervisor',
    email: 'supervisor@test.com',
    phone: '+65 9123 4567',
    role: 'Supervisor' as UserRole,
    certifications: [],
    workPass: {
      number: 'WP123456',
      expiryDate: new Date('2025-12-31'),
      status: 'active'
    },
    supervisorData: {
      assignedProjects: [1, 2],
      teamMembers: [1, 2, 3],
      approvalLevel: 'advanced',
      specializations: ['Construction', 'Safety']
    }
  };

  return (
    <AuthProvider initialUser={mockUser}>
      <LocationProvider>
        <OfflineProvider>
          <SupervisorProvider>
            {children}
          </SupervisorProvider>
        </OfflineProvider>
      </LocationProvider>
    </AuthProvider>
  );
};

describe('Supervisor Context Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default network state
    mockNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
      details: {}
    } as any);
  });

  describe('Context Initialization', () => {
    it('should initialize supervisor context with default state', async () => {
      let contextValue: ReturnType<typeof useSupervisorContext> | null = null;

      render(
        <ProviderWrapper>
          <TestComponent onContextReady={(context) => { contextValue = context; }} />
        </ProviderWrapper>
      );

      await waitFor(() => {
        expect(contextValue).not.toBeNull();
      });

      expect(contextValue!.state.assignedProjects).toEqual([]);
      expect(contextValue!.state.teamMembers).toEqual([]);
      expect(contextValue!.state.pendingApprovals).toEqual([]);
      expect(contextValue!.state.dailyReports).toEqual([]);
      expect(contextValue!.state.materialRequests).toEqual([]);
      expect(contextValue!.state.toolAllocations).toEqual([]);
      expect(contextValue!.state.isLoading).toBe(false);
      expect(contextValue!.state.error).toBeNull();
    });

    it('should provide all required context methods', async () => {
      let contextValue: ReturnType<typeof useSupervisorContext> | null = null;

      render(
        <ProviderWrapper>
          <TestComponent onContextReady={(context) => { contextValue = context; }} />
        </ProviderWrapper>
      );

      await waitFor(() => {
        expect(contextValue).not.toBeNull();
      });

      // Team management methods
      expect(typeof contextValue!.loadTeamData).toBe('function');
      expect(typeof contextValue!.refreshTeamMembers).toBe('function');
      expect(typeof contextValue!.updateTeamMemberStatus).toBe('function');
      expect(typeof contextValue!.assignTaskToWorker).toBe('function');
      expect(typeof contextValue!.reassignTask).toBe('function');

      // Approval management methods
      expect(typeof contextValue!.loadPendingApprovals).toBe('function');
      expect(typeof contextValue!.approveRequest).toBe('function');
      expect(typeof contextValue!.rejectRequest).toBe('function');
      expect(typeof contextValue!.escalateRequest).toBe('function');

      // Progress reporting methods
      expect(typeof contextValue!.loadDailyReports).toBe('function');
      expect(typeof contextValue!.createProgressReport).toBe('function');
      expect(typeof contextValue!.updateProgressReport).toBe('function');
      expect(typeof contextValue!.submitProgressReport).toBe('function');

      // Material and tool management methods
      expect(typeof contextValue!.loadMaterialsAndTools).toBe('function');
      expect(typeof contextValue!.createMaterialRequest).toBe('function');
      expect(typeof contextValue!.updateMaterialRequest).toBe('function');
      expect(typeof contextValue!.allocateTool).toBe('function');
      expect(typeof contextValue!.returnTool).toBe('function');

      // Utility methods
      expect(typeof contextValue!.refreshAllData).toBe('function');
      expect(typeof contextValue!.clearError).toBe('function');
      expect(typeof contextValue!.resetSupervisorState).toBe('function');

      // Data getters
      expect(typeof contextValue!.getTeamSummary).toBe('function');
      expect(typeof contextValue!.getApprovalsSummary).toBe('function');
      expect(typeof contextValue!.getProjectProgress).toBe('function');
    });
  });