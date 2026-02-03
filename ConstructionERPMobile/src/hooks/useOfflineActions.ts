// Custom hook for offline-aware actions
// Provides methods that work both online and offline

import { useCallback } from 'react';
import { useOffline } from '../store/context/OfflineContext';
import { workerApiService } from '../services/api/WorkerApiService';
import { GeoLocation, CreateDailyReportRequest } from '../types';

export const useOfflineActions = () => {
  const { isOnline, queueAction } = useOffline();

  // Attendance actions
  const clockIn = useCallback(async (
    projectId: string,
    location: GeoLocation
  ) => {
    if (isOnline) {
      return await workerApiService.clockIn({ projectId, location });
    } else {
      await queueAction('CLOCK_IN', { projectId, location });
      return {
        success: true,
        data: {
          message: 'Clock in queued for sync when online',
        },
      };
    }
  }, [isOnline, queueAction]);

  const clockOut = useCallback(async (
    projectId: string,
    location: GeoLocation
  ) => {
    if (isOnline) {
      return await workerApiService.clockOut({ projectId, location });
    } else {
      await queueAction('CLOCK_OUT', { projectId, location });
      return {
        success: true,
        data: {
          message: 'Clock out queued for sync when online',
        },
      };
    }
  }, [isOnline, queueAction]);

  const startLunchBreak = useCallback(async (
    projectId: string,
    location: GeoLocation
  ) => {
    if (isOnline) {
      return await workerApiService.startLunchBreak({ projectId, location });
    } else {
      await queueAction('START_LUNCH_BREAK', { projectId, location });
      return {
        success: true,
        data: {
          success: true,
          message: 'Lunch break start queued for sync when online',
          result: null,
        },
      };
    }
  }, [isOnline, queueAction]);

  const endLunchBreak = useCallback(async (
    projectId: string,
    location: GeoLocation
  ) => {
    if (isOnline) {
      return await workerApiService.endLunchBreak({ projectId, location });
    } else {
      await queueAction('END_LUNCH_BREAK', { projectId, location });
      return {
        success: true,
        data: {
          success: true,
          message: 'Lunch break end queued for sync when online',
          result: null,
        },
      };
    }
  }, [isOnline, queueAction]);

  // Task actions
  const startTask = useCallback(async (taskId: number, location: GeoLocation) => {
    if (isOnline) {
      return await workerApiService.startTask(taskId, location);
    } else {
      await queueAction('START_TASK', { taskId, location });
      return {
        success: true,
        data: {
          success: true,
          message: 'Task start queued for sync when online',
          task: null,
        },
      };
    }
  }, [isOnline, queueAction]);

  const updateTaskProgress = useCallback(async (
    taskId: number,
    progressPercent: number,
    description: string,
    location: GeoLocation
  ) => {
    if (isOnline) {
      return await workerApiService.updateTaskProgress(taskId, progressPercent, description, location);
    } else {
      await queueAction('UPDATE_TASK_PROGRESS', {
        taskId,
        progressPercent,
        description,
        location,
      });
      return {
        success: true,
        data: {
          success: true,
          message: 'Task progress update queued for sync when online',
          task: null,
        },
      };
    }
  }, [isOnline, queueAction]);

  const completeTask = useCallback(async (taskId: number, location: GeoLocation) => {
    if (isOnline) {
      return await workerApiService.completeTask(taskId, location);
    } else {
      await queueAction('COMPLETE_TASK', { taskId, location });
      return {
        success: true,
        data: {
          success: true,
          message: 'Task completion queued for sync when online',
          task: null,
        },
      };
    }
  }, [isOnline, queueAction]);

  // Report actions
  const createDailyReport = useCallback(async (reportData: CreateDailyReportRequest) => {
    if (isOnline) {
      return await workerApiService.createDailyReport(reportData);
    } else {
      await queueAction('SUBMIT_DAILY_REPORT', reportData);
      return {
        success: true,
        data: {
          success: true,
          message: 'Daily report queued for sync when online',
          report: null,
        },
      };
    }
  }, [isOnline, queueAction]);

  // Request actions
  const submitLeaveRequest = useCallback(async (requestData: {
    leaveType: 'ANNUAL' | 'MEDICAL' | 'EMERGENCY';
    fromDate: Date;
    toDate: Date;
    reason: string;
    attachments?: File[];
  }) => {
    if (isOnline) {
      return await workerApiService.submitLeaveRequest(requestData);
    } else {
      await queueAction('SUBMIT_REQUEST', {
        requestType: 'leave',
        data: requestData,
      });
      return {
        success: true,
        data: {
          success: true,
          message: 'Leave request queued for sync when online',
          request: null,
        },
      };
    }
  }, [isOnline, queueAction]);

  const submitMaterialRequest = useCallback(async (requestData: {
    projectId: number;
    itemName: string;
    itemCategory: 'concrete' | 'steel' | 'wood' | 'electrical' | 'plumbing' | 'finishing' | 'hardware' | 'other';
    quantity: number;
    unit: string;
    urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    requiredDate: Date;
    purpose: string;
    justification: string;
    specifications?: string;
    estimatedCost?: number;
    attachments?: File[];
  }) => {
    if (isOnline) {
      return await workerApiService.submitMaterialRequest(requestData);
    } else {
      await queueAction('SUBMIT_REQUEST', {
        requestType: 'material',
        data: requestData,
      });
      return {
        success: true,
        data: {
          success: true,
          message: 'Material request queued for sync when online',
          request: null,
        },
      };
    }
  }, [isOnline, queueAction]);

  const submitToolRequest = useCallback(async (requestData: {
    projectId: number;
    itemName: string;
    itemCategory: 'power_tools' | 'hand_tools' | 'safety_equipment' | 'measuring_tools' | 'other';
    quantity: number;
    unit: string;
    urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    requiredDate: Date;
    purpose: string;
    justification: string;
    specifications?: string;
    estimatedCost?: number;
    attachments?: File[];
  }) => {
    if (isOnline) {
      return await workerApiService.submitToolRequest(requestData);
    } else {
      await queueAction('SUBMIT_REQUEST', {
        requestType: 'tool',
        data: requestData,
      });
      return {
        success: true,
        data: {
          success: true,
          message: 'Tool request queued for sync when online',
          request: null,
        },
      };
    }
  }, [isOnline, queueAction]);

  const submitReimbursementRequest = useCallback(async (requestData: {
    amount: number;
    currency: string;
    description: string;
    category: 'TRANSPORT' | 'MEALS' | 'ACCOMMODATION' | 'MATERIALS' | 'OTHER';
    urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    requiredDate: Date;
    justification: string;
    attachments?: File[];
  }) => {
    if (isOnline) {
      return await workerApiService.submitReimbursementRequest(requestData);
    } else {
      await queueAction('SUBMIT_REQUEST', {
        requestType: 'reimbursement',
        data: requestData,
      });
      return {
        success: true,
        data: {
          success: true,
          message: 'Reimbursement request queued for sync when online',
          request: null,
        },
      };
    }
  }, [isOnline, queueAction]);

  const submitAdvancePaymentRequest = useCallback(async (requestData: {
    amount: number;
    currency: string;
    description: string;
    category: 'ADVANCE';
    urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    requiredDate: Date;
    justification: string;
    attachments?: File[];
  }) => {
    if (isOnline) {
      return await workerApiService.submitAdvancePaymentRequest(requestData);
    } else {
      await queueAction('SUBMIT_REQUEST', {
        requestType: 'advance_payment',
        data: requestData,
      });
      return {
        success: true,
        data: {
          success: true,
          message: 'Advance payment request queued for sync when online',
          request: null,
        },
      };
    }
  }, [isOnline, queueAction]);

  return {
    // Attendance
    clockIn,
    clockOut,
    startLunchBreak,
    endLunchBreak,
    // Tasks
    startTask,
    updateTaskProgress,
    completeTask,
    // Reports
    createDailyReport,
    // Requests
    submitLeaveRequest,
    submitMaterialRequest,
    submitToolRequest,
    submitReimbursementRequest,
    submitAdvancePaymentRequest,
  };
};

export default useOfflineActions;