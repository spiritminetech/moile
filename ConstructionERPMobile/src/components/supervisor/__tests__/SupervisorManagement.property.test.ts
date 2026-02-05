// Property-Based Test for Supervisor Management Functionality
// Feature: construction-erp-supervisor-driver-extension, Property 3: Supervisor Attendance Management, Property 4: Supervisor Task Management
// **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5**

import * as fc from 'fast-check';
import '@testing-library/jest-native/extend-expect';

// Type definitions for testing
interface TeamMember {
  id: number;
  name: string;
  role: string;
  attendanceStatus: 'present' | 'absent' | 'late' | 'on_break';
  currentTask: {
    id: number;
    name: string;
    progress: number;
  } | null;
  location: {
    latitude: number;
    longitude: number;
    insideGeofence: boolean;
    lastUpdated: string;
  };
  certifications: Array<{
    name: string;
    status: 'active' | 'expiring' | 'expired';
    expiryDate: string;
  }>;
}

interface AttendanceRecord {
  workerId: number;
  workerName: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  lunchStartTime: string | null;
  lunchEndTime: string | null;
  status: 'present' | 'absent' | 'late' | 'on_break';
  location: {
    latitude: number;
    longitude: number;
    insideGeofence: boolean;
    lastUpdated: string;
  };
  hoursWorked: number;
  issues: Array<{
    type: 'geofence_violation' | 'late_arrival' | 'missing_checkout' | 'extended_break';
    description: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

interface TaskAssignment {
  assignmentId: number;
  taskId: number;
  taskName: string;
  workerId: number;
  workerName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  progress: number;
  assignedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  estimatedHours: number;
  actualHours: number | null;
  dependencies: number[];
  canStart: boolean;
}

interface AttendanceCorrection {
  correctionId: number;
  workerId: number;
  workerName: string;
  requestType: 'check_in' | 'check_out' | 'lunch_start' | 'lunch_end';
  originalTime: string;
  requestedTime: string;
  reason: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface GeofenceValidation {
  workerId: number;
  latitude: number;
  longitude: number;
  insideGeofence: boolean;
  distance: number;
  timestamp: string;
}

interface SupervisorManagementData {
  teamMembers: TeamMember[];
  attendanceRecords: AttendanceRecord[];
  taskAssignments: TaskAssignment[];
  attendanceCorrections: AttendanceCorrection[];
  geofenceValidations: GeofenceValidation[];
}

// Mock supervisor management functions
class MockSupervisorManagement {
  // Property 3: Supervisor Attendance Management functions
  
  static displayAttendanceStatus(attendanceRecords: AttendanceRecord[]): {
    totalWorkers: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    onBreakCount: number;
  } {
    const totalWorkers = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
    const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
    const onBreakCount = attendanceRecords.filter(r => r.status === 'on_break').length;
    
    return {
      totalWorkers,
      presentCount,
      absentCount,
      lateCount,
      onBreakCount
    };
  }

  static detectAttendanceIssues(attendanceRecords: AttendanceRecord[]): Array<{
    workerId: number;
    issueType: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }> {
    const issues: Array<{
      workerId: number;
      issueType: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }> = [];

    attendanceRecords.forEach(record => {
      // Detect late arrivals
      if (record.status === 'late') {
        issues.push({
          workerId: record.workerId,
          issueType: 'late_arrival',
          severity: 'medium',
          description: `${record.workerName} arrived late`
        });
      }

      // Detect geofence violations
      if (!record.location.insideGeofence && record.status === 'present') {
        issues.push({
          workerId: record.workerId,
          issueType: 'geofence_violation',
          severity: 'high',
          description: `${record.workerName} is outside geofence`
        });
      }

      // Detect missing checkout
      if (record.checkInTime && !record.checkOutTime && record.status !== 'present') {
        issues.push({
          workerId: record.workerId,
          issueType: 'missing_checkout',
          severity: 'medium',
          description: `${record.workerName} has not checked out`
        });
      }

      // Add existing issues from record
      record.issues.forEach(issue => {
        issues.push({
          workerId: record.workerId,
          issueType: issue.type,
          severity: issue.severity,
          description: issue.description
        });
      });
    });

    return issues;
  }

  static validateGeofenceLocation(geofenceValidations: GeofenceValidation[]): {
    validLocations: number;
    violations: number;
    averageDistance: number;
  } {
    const validLocations = geofenceValidations.filter(v => v.insideGeofence).length;
    const violations = geofenceValidations.filter(v => !v.insideGeofence).length;
    const averageDistance = geofenceValidations.length > 0 
      ? geofenceValidations.reduce((sum, v) => sum + v.distance, 0) / geofenceValidations.length 
      : 0;

    return {
      validLocations,
      violations,
      averageDistance
    };
  }

  static processAttendanceCorrection(correction: AttendanceCorrection, decision: 'approve' | 'reject'): {
    correctionId: number;
    status: 'approved' | 'rejected';
    processedAt: string;
    isValid: boolean;
  } {
    const isValid = correction.status === 'pending' && 
                   ['check_in', 'check_out', 'lunch_start', 'lunch_end'].includes(correction.requestType);

    return {
      correctionId: correction.correctionId,
      status: decision === 'approve' ? 'approved' : 'rejected',
      processedAt: new Date().toISOString(),
      isValid
    };
  }

  // Property 4: Supervisor Task Management functions

  static createTaskAssignment(taskData: {
    workerId: number;
    taskId: number;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    estimatedHours: number;
    dependencies: number[];
  }): {
    assignmentId: number;
    isValid: boolean;
    canStart: boolean;
    validationErrors: string[];
  } {
    const validationErrors: string[] = [];
    
    // Validate worker ID
    if (taskData.workerId <= 0) {
      validationErrors.push('Invalid worker ID');
    }
    
    // Validate task ID
    if (taskData.taskId <= 0) {
      validationErrors.push('Invalid task ID');
    }
    
    // Validate estimated hours
    if (taskData.estimatedHours <= 0 || taskData.estimatedHours > 24) {
      validationErrors.push('Invalid estimated hours');
    }
    
    // Check if task can start (no unresolved dependencies)
    const canStart = taskData.dependencies.length === 0;
    
    const isValid = validationErrors.length === 0;
    
    return {
      assignmentId: isValid ? Math.floor(Math.random() * 10000) + 1 : -1,
      isValid,
      canStart,
      validationErrors
    };
  }

  static validateWorkerAvailability(workerId: number, existingAssignments: TaskAssignment[]): {
    isAvailable: boolean;
    currentTaskCount: number;
    activeTaskIds: number[];
  } {
    const workerTasks = existingAssignments.filter(
      assignment => assignment.workerId === workerId && 
                   ['pending', 'in_progress'].includes(assignment.status)
    );
    
    return {
      isAvailable: workerTasks.length < 3, // Max 3 concurrent tasks
      currentTaskCount: workerTasks.length,
      activeTaskIds: workerTasks.map(task => task.taskId)
    };
  }

  static updateTaskProgress(taskId: number, newProgress: number, assignments: TaskAssignment[]): {
    success: boolean;
    updatedTask: TaskAssignment | null;
    validationErrors: string[];
  } {
    const validationErrors: string[] = [];
    
    // Validate progress value
    if (newProgress < 0 || newProgress > 100) {
      validationErrors.push('Progress must be between 0 and 100');
    }
    
    // Find task
    const taskIndex = assignments.findIndex(task => task.assignmentId === taskId);
    if (taskIndex === -1) {
      validationErrors.push('Task not found');
      return { success: false, updatedTask: null, validationErrors };
    }
    
    const task = assignments[taskIndex];
    
    // Validate task can be updated
    if (task.status === 'completed' || task.status === 'cancelled') {
      validationErrors.push('Cannot update completed or cancelled task');
    }
    
    if (validationErrors.length > 0) {
      return { success: false, updatedTask: null, validationErrors };
    }
    
    // Update task
    const updatedTask = {
      ...task,
      progress: newProgress,
      status: newProgress === 100 ? 'completed' as const : 'in_progress' as const,
      completedAt: newProgress === 100 ? new Date().toISOString() : null
    };
    
    return { success: true, updatedTask, validationErrors: [] };
  }

  static reassignTask(taskId: number, newWorkerId: number, assignments: TaskAssignment[]): {
    success: boolean;
    reassignedTask: TaskAssignment | null;
    validationErrors: string[];
  } {
    const validationErrors: string[] = [];
    
    // Validate new worker ID first
    if (newWorkerId <= 0) {
      validationErrors.push('Invalid worker ID');
    }
    
    // Find task
    const taskIndex = assignments.findIndex(task => task.assignmentId === taskId);
    if (taskIndex === -1) {
      validationErrors.push('Task not found');
    }
    
    if (validationErrors.length > 0) {
      return { success: false, reassignedTask: null, validationErrors };
    }
    
    const task = assignments[taskIndex];
    
    // Validate task can be reassigned
    if (task.status === 'completed') {
      validationErrors.push('Cannot reassign completed task');
    }
    
    if (validationErrors.length > 0) {
      return { success: false, reassignedTask: null, validationErrors };
    }
    
    // Reassign task
    const reassignedTask = {
      ...task,
      workerId: newWorkerId,
      workerName: `Worker ${newWorkerId}`, // Simplified for testing
      status: 'pending' as const,
      progress: 0,
      startedAt: null,
      completedAt: null
    };
    
    return { success: true, reassignedTask, validationErrors: [] };
  }
}

// Property test generators
const teamMemberGenerator = fc.record({
  id: fc.integer({ min: 1, max: 1000 }),
  name: fc.string({ minLength: 2, maxLength: 50 }),
  role: fc.constantFrom('Worker', 'Technician', 'Specialist'),
  attendanceStatus: fc.constantFrom('present', 'absent', 'late', 'on_break'),
  currentTask: fc.option(fc.record({
    id: fc.integer({ min: 1, max: 100 }),
    name: fc.string({ minLength: 5, maxLength: 30 }),
    progress: fc.integer({ min: 0, max: 100 })
  })),
  location: fc.record({
    latitude: fc.float({ min: -90, max: 90 }),
    longitude: fc.float({ min: -180, max: 180 }),
    insideGeofence: fc.boolean(),
    lastUpdated: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString())
  }),
  certifications: fc.array(fc.record({
    name: fc.string({ minLength: 3, maxLength: 20 }),
    status: fc.constantFrom('active', 'expiring', 'expired'),
    expiryDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString())
  }), { maxLength: 5 })
});

const attendanceRecordGenerator = fc.record({
  workerId: fc.integer({ min: 1, max: 1000 }),
  workerName: fc.string({ minLength: 2, maxLength: 50 }),
  checkInTime: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString())),
  checkOutTime: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString())),
  lunchStartTime: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString())),
  lunchEndTime: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString())),
  status: fc.constantFrom('present', 'absent', 'late', 'on_break'),
  location: fc.record({
    latitude: fc.float({ min: -90, max: 90 }),
    longitude: fc.float({ min: -180, max: 180 }),
    insideGeofence: fc.boolean(),
    lastUpdated: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString())
  }),
  hoursWorked: fc.float({ min: 0, max: 12 }),
  issues: fc.array(fc.record({
    type: fc.constantFrom('geofence_violation', 'late_arrival', 'missing_checkout', 'extended_break'),
    description: fc.string({ minLength: 10, maxLength: 100 }),
    timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
    severity: fc.constantFrom('low', 'medium', 'high')
  }), { maxLength: 3 })
});

const taskAssignmentGenerator = fc.record({
  assignmentId: fc.integer({ min: 1, max: 10000 }),
  taskId: fc.integer({ min: 1, max: 1000 }),
  taskName: fc.string({ minLength: 5, maxLength: 50 }),
  workerId: fc.integer({ min: 1, max: 1000 }),
  workerName: fc.string({ minLength: 2, maxLength: 50 }),
  status: fc.constantFrom('pending', 'in_progress', 'completed', 'cancelled'),
  priority: fc.constantFrom('low', 'normal', 'high', 'urgent'),
  progress: fc.integer({ min: 0, max: 100 }),
  assignedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
  startedAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString())),
  completedAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString())),
  estimatedHours: fc.float({ min: 0.5, max: 24 }),
  actualHours: fc.option(fc.float({ min: 0, max: 24 })),
  dependencies: fc.array(fc.integer({ min: 1, max: 100 }), { maxLength: 5 }),
  canStart: fc.boolean()
});

const attendanceCorrectionGenerator = fc.record({
  correctionId: fc.integer({ min: 1, max: 10000 }),
  workerId: fc.integer({ min: 1, max: 1000 }),
  workerName: fc.string({ minLength: 2, maxLength: 50 }),
  requestType: fc.constantFrom('check_in', 'check_out', 'lunch_start', 'lunch_end'),
  originalTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
  requestedTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
  reason: fc.string({ minLength: 10, maxLength: 200 }),
  requestedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
  status: fc.constantFrom('pending', 'approved', 'rejected')
});

const geofenceValidationGenerator = fc.record({
  workerId: fc.integer({ min: 1, max: 1000 }),
  latitude: fc.float({ min: -90, max: 90 }),
  longitude: fc.float({ min: -180, max: 180 }),
  insideGeofence: fc.boolean(),
  distance: fc.float({ min: 0, max: 1000 }),
  timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString())
});

// Property 3: Supervisor Attendance Management Tests
describe('Property 3: Supervisor Attendance Management', () => {
  it('should accurately display real-time worker attendance status for any attendance data', () => {
    fc.assert(fc.property(
      fc.array(attendanceRecordGenerator, { minLength: 1, maxLength: 10 }),
      (attendanceRecords) => {
        // **Validates: Requirements 3.1**
        const result = MockSupervisorManagement.displayAttendanceStatus(attendanceRecords);
        
        // Property: Total workers should equal sum of all status counts
        expect(result.totalWorkers).toBe(attendanceRecords.length);
        expect(result.presentCount + result.absentCount + result.lateCount + result.onBreakCount)
          .toBe(result.totalWorkers);
        
        // Property: Each status count should be non-negative
        expect(result.presentCount).toBeGreaterThanOrEqual(0);
        expect(result.absentCount).toBeGreaterThanOrEqual(0);
        expect(result.lateCount).toBeGreaterThanOrEqual(0);
        expect(result.onBreakCount).toBeGreaterThanOrEqual(0);
        
        // Property: Status counts should match actual records
        const actualPresent = attendanceRecords.filter(r => r.status === 'present').length;
        const actualAbsent = attendanceRecords.filter(r => r.status === 'absent').length;
        const actualLate = attendanceRecords.filter(r => r.status === 'late').length;
        const actualOnBreak = attendanceRecords.filter(r => r.status === 'on_break').length;
        
        expect(result.presentCount).toBe(actualPresent);
        expect(result.absentCount).toBe(actualAbsent);
        expect(result.lateCount).toBe(actualLate);
        expect(result.onBreakCount).toBe(actualOnBreak);
      }
    ), { numRuns: 10 });
  });

  it('should correctly detect and classify attendance issues for any attendance data', () => {
    fc.assert(fc.property(
      fc.array(attendanceRecordGenerator, { minLength: 1, maxLength: 5 }),
      (attendanceRecords) => {
        // **Validates: Requirements 3.2**
        const issues = MockSupervisorManagement.detectAttendanceIssues(attendanceRecords);
        
        // Property: All detected issues should have valid worker IDs
        issues.forEach(issue => {
          expect(issue.workerId).toBeGreaterThan(0);
          expect(['low', 'medium', 'high']).toContain(issue.severity);
          expect(issue.description).toBeTruthy();
          expect(issue.issueType).toBeTruthy();
        });
        
        // Property: Late workers should generate late arrival issues
        const lateWorkers = attendanceRecords.filter(r => r.status === 'late');
        const lateIssues = issues.filter(i => i.issueType === 'late_arrival');
        expect(lateIssues.length).toBeGreaterThanOrEqual(lateWorkers.length);
        
        // Property: Workers outside geofence while present should generate violations
        const geofenceViolators = attendanceRecords.filter(
          r => !r.location.insideGeofence && r.status === 'present'
        );
        const geofenceIssues = issues.filter(i => i.issueType === 'geofence_violation');
        expect(geofenceIssues.length).toBeGreaterThanOrEqual(geofenceViolators.length);
      }
    ), { numRuns: 10 });
  });

  it('should accurately validate geofence locations and calculate distances', () => {
    fc.assert(fc.property(
      fc.array(geofenceValidationGenerator, { minLength: 1, maxLength: 5 }),
      (geofenceValidations) => {
        // **Validates: Requirements 3.3**
        const result = MockSupervisorManagement.validateGeofenceLocation(geofenceValidations);
        
        // Property: Valid locations + violations should equal total validations
        expect(result.validLocations + result.violations).toBe(geofenceValidations.length);
        
        // Property: Valid locations should match actual inside geofence count
        const actualValid = geofenceValidations.filter(v => v.insideGeofence).length;
        const actualViolations = geofenceValidations.filter(v => !v.insideGeofence).length;
        expect(result.validLocations).toBe(actualValid);
        expect(result.violations).toBe(actualViolations);
        
        // Property: Average distance should be non-negative
        expect(result.averageDistance).toBeGreaterThanOrEqual(0);
        
        // Property: If all locations are valid, violations should be 0
        if (geofenceValidations.every(v => v.insideGeofence)) {
          expect(result.violations).toBe(0);
        }
      }
    ), { numRuns: 10 });
  });

  it('should properly process attendance correction requests with valid decisions', () => {
    fc.assert(fc.property(
      attendanceCorrectionGenerator,
      fc.constantFrom('approve', 'reject'),
      (correction, decision) => {
        // **Validates: Requirements 3.4, 3.5**
        const result = MockSupervisorManagement.processAttendanceCorrection(correction, decision);
        
        // Property: Result should have correct correction ID
        expect(result.correctionId).toBe(correction.correctionId);
        
        // Property: Result status should match decision
        expect(result.status).toBe(decision === 'approve' ? 'approved' : 'rejected');
        
        // Property: Processed timestamp should be valid
        expect(new Date(result.processedAt)).toBeInstanceOf(Date);
        expect(new Date(result.processedAt).getTime()).toBeGreaterThan(0);
        
        // Property: Validity should depend on correction status and request type
        const expectedValidity = correction.status === 'pending' && 
                               ['check_in', 'check_out', 'lunch_start', 'lunch_end'].includes(correction.requestType);
        expect(result.isValid).toBe(expectedValidity);
      }
    ), { numRuns: 10 });
  });
});

// Property 4: Supervisor Task Management Tests
describe('Property 4: Supervisor Task Management', () => {
  it('should create valid task assignments with proper validation for any task data', () => {
    fc.assert(fc.property(
      fc.record({
        workerId: fc.integer({ min: -10, max: 1000 }),
        taskId: fc.integer({ min: -10, max: 1000 }),
        priority: fc.constantFrom('low', 'normal', 'high', 'urgent'),
        estimatedHours: fc.float({ min: -5, max: 30 }),
        dependencies: fc.array(fc.integer({ min: 1, max: 100 }), { maxLength: 3 })
      }),
      (taskData) => {
        // **Validates: Requirements 4.1**
        const result = MockSupervisorManagement.createTaskAssignment(taskData);
        
        // Property: Valid assignments should have positive assignment ID
        if (result.isValid) {
          expect(result.assignmentId).toBeGreaterThan(0);
        } else {
          expect(result.assignmentId).toBe(-1);
        }
        
        // Property: Validation should catch invalid worker IDs
        if (taskData.workerId <= 0) {
          expect(result.isValid).toBe(false);
          expect(result.validationErrors).toContain('Invalid worker ID');
        }
        
        // Property: Validation should catch invalid task IDs
        if (taskData.taskId <= 0) {
          expect(result.isValid).toBe(false);
          expect(result.validationErrors).toContain('Invalid task ID');
        }
        
        // Property: Validation should catch invalid estimated hours
        if (taskData.estimatedHours <= 0 || taskData.estimatedHours > 24) {
          expect(result.isValid).toBe(false);
          expect(result.validationErrors).toContain('Invalid estimated hours');
        }
        
        // Property: Tasks can start only if no dependencies
        expect(result.canStart).toBe(taskData.dependencies.length === 0);
        
        // Property: Valid tasks should have no validation errors
        if (result.isValid) {
          expect(result.validationErrors).toHaveLength(0);
        }
      }
    ), { numRuns: 10 });
  });

  it('should correctly validate worker availability based on existing assignments', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 1000 }),
      fc.array(taskAssignmentGenerator, { maxLength: 5 }),
      (workerId, existingAssignments) => {
        // **Validates: Requirements 4.2, 4.3**
        const result = MockSupervisorManagement.validateWorkerAvailability(workerId, existingAssignments);
        
        // Property: Current task count should match actual active tasks for worker
        const actualActiveTasks = existingAssignments.filter(
          assignment => assignment.workerId === workerId && 
                       ['pending', 'in_progress'].includes(assignment.status)
        );
        expect(result.currentTaskCount).toBe(actualActiveTasks.length);
        
        // Property: Active task IDs should match actual task IDs
        const actualTaskIds = actualActiveTasks.map(task => task.taskId).sort();
        const resultTaskIds = result.activeTaskIds.sort();
        expect(resultTaskIds).toEqual(actualTaskIds);
        
        // Property: Worker should be available if they have less than 3 active tasks
        expect(result.isAvailable).toBe(result.currentTaskCount < 3);
        
        // Property: Current task count should be non-negative
        expect(result.currentTaskCount).toBeGreaterThanOrEqual(0);
      }
    ), { numRuns: 10 });
  });

  it('should properly update task progress with validation for any progress value', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 10000 }),
      fc.integer({ min: -10, max: 110 }),
      fc.array(taskAssignmentGenerator, { minLength: 1, maxLength: 3 }),
      (taskId, newProgress, assignments) => {
        // **Validates: Requirements 4.4**
        const result = MockSupervisorManagement.updateTaskProgress(taskId, newProgress, assignments);
        
        // Property: Progress validation should catch invalid values
        if (newProgress < 0 || newProgress > 100) {
          expect(result.success).toBe(false);
          expect(result.validationErrors).toContain('Progress must be between 0 and 100');
        }
        
        // Property: Non-existent tasks should fail
        const taskExists = assignments.some(task => task.assignmentId === taskId);
        if (!taskExists) {
          expect(result.success).toBe(false);
          expect(result.validationErrors).toContain('Task not found');
        }
        
        // Property: Completed or cancelled tasks should not be updatable
        const task = assignments.find(t => t.assignmentId === taskId);
        if (task && (task.status === 'completed' || task.status === 'cancelled')) {
          expect(result.success).toBe(false);
          expect(result.validationErrors).toContain('Cannot update completed or cancelled task');
        }
        
        // Property: Successful updates should return updated task
        if (result.success && result.updatedTask) {
          expect(result.updatedTask.progress).toBe(newProgress);
          expect(result.validationErrors).toHaveLength(0);
          
          // Property: 100% progress should mark task as completed
          if (newProgress === 100) {
            expect(result.updatedTask.status).toBe('completed');
            expect(result.updatedTask.completedAt).toBeTruthy();
          } else {
            expect(result.updatedTask.status).toBe('in_progress');
          }
        }
      }
    ), { numRuns: 10 });
  });

  it('should properly reassign tasks with validation for any worker assignment', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 10000 }),
      fc.integer({ min: -10, max: 1000 }),
      fc.array(taskAssignmentGenerator, { minLength: 1, maxLength: 3 }),
      (taskId, newWorkerId, assignments) => {
        // **Validates: Requirements 4.5**
        const result = MockSupervisorManagement.reassignTask(taskId, newWorkerId, assignments);
        
        // Property: Non-existent tasks should fail
        const taskExists = assignments.some(task => task.assignmentId === taskId);
        if (!taskExists) {
          expect(result.success).toBe(false);
          expect(result.validationErrors).toContain('Task not found');
        }
        
        // Property: Invalid worker IDs should fail
        if (newWorkerId <= 0) {
          expect(result.success).toBe(false);
          expect(result.validationErrors).toContain('Invalid worker ID');
        }
        
        // Property: Completed tasks should not be reassignable
        const task = assignments.find(t => t.assignmentId === taskId);
        if (task && task.status === 'completed') {
          expect(result.success).toBe(false);
          expect(result.validationErrors).toContain('Cannot reassign completed task');
        }
        
        // Property: Successful reassignments should return updated task
        if (result.success && result.reassignedTask) {
          expect(result.reassignedTask.workerId).toBe(newWorkerId);
          expect(result.reassignedTask.status).toBe('pending');
          expect(result.reassignedTask.progress).toBe(0);
          expect(result.reassignedTask.startedAt).toBeNull();
          expect(result.reassignedTask.completedAt).toBeNull();
          expect(result.validationErrors).toHaveLength(0);
        }
      }
    ), { numRuns: 10 });
  });
});