// Test file for Supervisor Dashboard Components
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5

import React from 'react';
import { render } from '@testing-library/react-native';
import {
  TeamManagementCard,
  AttendanceMonitorCard,
  TaskAssignmentCard,
  ApprovalQueueCard,
  ProgressReportCard,
} from '../index';
import { SupervisorDashboardResponse } from '../../../types';

// Mock data for testing
const mockProjects: SupervisorDashboardResponse['projects'] = [
  {
    id: 1,
    name: 'Test Project 1',
    workforceCount: 10,
    attendanceSummary: {
      present: 8,
      absent: 1,
      late: 1,
      total: 10,
    },
    progressSummary: {
      overallProgress: 75,
      dailyTarget: 5,
      completedTasks: 4,
      totalTasks: 8,
    },
  },
];

const mockPendingApprovals: SupervisorDashboardResponse['pendingApprovals'] = {
  leaveRequests: 3,
  materialRequests: 2,
  toolRequests: 1,
  urgent: 1,
};

describe('Supervisor Dashboard Components', () => {
  describe('TeamManagementCard', () => {
    it('renders loading state correctly', () => {
      const { getByText } = render(
        <TeamManagementCard projects={[]} isLoading={true} />
      );
      expect(getByText('Loading team data...')).toBeTruthy();
    });

    it('renders empty state correctly', () => {
      const { getByText } = render(
        <TeamManagementCard projects={[]} isLoading={false} />
      );
      expect(getByText('No projects assigned')).toBeTruthy();
    });

    it('renders project data correctly', () => {
      const { getByText } = render(
        <TeamManagementCard projects={mockProjects} isLoading={false} />
      );
      expect(getByText('Test Project 1')).toBeTruthy();
      expect(getByText('10 workers')).toBeTruthy();
      expect(getByText('8 Present')).toBeTruthy();
    });
  });

  describe('AttendanceMonitorCard', () => {
    it('renders loading state correctly', () => {
      const { getByText } = render(
        <AttendanceMonitorCard projects={[]} isLoading={true} />
      );
      expect(getByText('Loading attendance data...')).toBeTruthy();
    });

    it('renders attendance data correctly', () => {
      const { getByText } = render(
        <AttendanceMonitorCard projects={mockProjects} isLoading={false} />
      );
      expect(getByText('80%')).toBeTruthy(); // Attendance rate
      expect(getByText('Present')).toBeTruthy();
    });
  });

  describe('TaskAssignmentCard', () => {
    it('renders loading state correctly', () => {
      const { getByText } = render(
        <TaskAssignmentCard projects={[]} isLoading={true} />
      );
      expect(getByText('Loading task data...')).toBeTruthy();
    });

    it('renders task data correctly', () => {
      const { getByText } = render(
        <TaskAssignmentCard projects={mockProjects} isLoading={false} />
      );
      expect(getByText('50%')).toBeTruthy(); // Overall progress
      expect(getByText('Total Tasks')).toBeTruthy();
    });
  });

  describe('ApprovalQueueCard', () => {
    it('renders loading state correctly', () => {
      const { getByText } = render(
        <ApprovalQueueCard pendingApprovals={null} isLoading={true} />
      );
      expect(getByText('Loading approval data...')).toBeTruthy();
    });

    it('renders approval data correctly', () => {
      const { getByText } = render(
        <ApprovalQueueCard pendingApprovals={mockPendingApprovals} isLoading={false} />
      );
      expect(getByText('6')).toBeTruthy(); // Total pending approvals
      expect(getByText('1 URGENT')).toBeTruthy();
    });

    it('renders empty state correctly', () => {
      const emptyApprovals = {
        leaveRequests: 0,
        materialRequests: 0,
        toolRequests: 0,
        urgent: 0,
      };
      const { getByText } = render(
        <ApprovalQueueCard pendingApprovals={emptyApprovals} isLoading={false} />
      );
      expect(getByText('All caught up!')).toBeTruthy();
    });
  });

  describe('ProgressReportCard', () => {
    it('renders loading state correctly', () => {
      const { getByText } = render(
        <ProgressReportCard projects={[]} isLoading={true} />
      );
      expect(getByText('Loading progress data...')).toBeTruthy();
    });

    it('renders progress data correctly', () => {
      const { getByText } = render(
        <ProgressReportCard projects={mockProjects} isLoading={false} />
      );
      expect(getByText('50%')).toBeTruthy(); // Overall progress
      expect(getByText('Complete')).toBeTruthy();
    });
  });
});