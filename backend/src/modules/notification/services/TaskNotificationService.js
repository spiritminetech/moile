import NotificationService from './NotificationService.js';
import Employee from '../../employee/Employee.js';
import Task from '../../task/Task.js';
import Project from '../../project/models/Project.js';

/**
 * TaskNotificationService
 * Handles task update notification triggers for worker mobile notifications
 * Implements Requirements 1.1, 1.2, 1.4 (task assignment, modification, overtime notifications)
 */
class TaskNotificationService {
  constructor() {
    this.notificationService = NotificationService;
  }

  /**
   * Send notification when new tasks are assigned to workers
   * Implements Requirement 1.1: New task assignment notifications within 30 seconds
   * @param {Array} assignments - Array of WorkerTaskAssignment objects
   * @param {number} supervisorId - ID of supervisor who assigned the tasks
   * @returns {Promise<Object>} Notification creation results
   */
  async notifyTaskAssignment(assignments, supervisorId) {
    try {
      if (!assignments || assignments.length === 0) {
        return { success: false, message: 'No assignments provided' };
      }

      const results = [];
      
      // Group assignments by worker to send consolidated notifications
      const assignmentsByWorker = assignments.reduce((acc, assignment) => {
        const workerId = assignment.employeeId;
        if (!acc[workerId]) {
          acc[workerId] = [];
        }
        acc[workerId].push(assignment);
        return acc;
      }, {});

      // Get supervisor information for contact details
      const supervisor = await Employee.findOne({ id: supervisorId });
      const supervisorContact = supervisor ? {
        name: supervisor.fullName,
        phone: supervisor.phone || 'N/A',
        email: supervisor.email || 'N/A'
      } : {
        name: 'Supervisor',
        phone: 'N/A',
        email: 'N/A'
      };

      // Send notification to each worker
      for (const [workerId, workerAssignments] of Object.entries(assignmentsByWorker)) {
        try {
          // Get project and task details for the first assignment (assuming same project)
          const firstAssignment = workerAssignments[0];
          const project = await Project.findOne({ id: firstAssignment.projectId });
          const taskCount = workerAssignments.length;

          // Create notification title and message
          const title = taskCount === 1 
            ? 'New Task Assigned'
            : `${taskCount} New Tasks Assigned`;

          const message = taskCount === 1
            ? `You have been assigned a new task for ${project?.projectName || 'your project'} on ${firstAssignment.date}.`
            : `You have been assigned ${taskCount} new tasks for ${project?.projectName || 'your project'} on ${firstAssignment.date}.`;

          // Prepare action data with required fields (Requirement 1.5)
          const actionData = {
            taskId: firstAssignment.taskId,
            projectId: firstAssignment.projectId,
            supervisorContact: supervisorContact,
            assignmentIds: workerAssignments.map(a => a.id),
            assignmentDate: firstAssignment.date,
            taskCount: taskCount,
            actionUrl: `/worker/tasks/today`
          };

          // Create notification
          const notificationResult = await this.notificationService.createNotification({
            type: 'TASK_UPDATE',
            title: title,
            message: message,
            senderId: supervisorId,
            recipients: [parseInt(workerId)],
            actionData: actionData,
            requiresAcknowledgment: false,
            language: 'en'
          });

          results.push({
            workerId: parseInt(workerId),
            assignmentCount: taskCount,
            notificationResult: notificationResult
          });

        } catch (workerError) {
          console.error(`❌ Error sending task assignment notification to worker ${workerId}:`, workerError);
          results.push({
            workerId: parseInt(workerId),
            assignmentCount: workerAssignments.length,
            error: workerError.message
          });
        }
      }

      return {
        success: true,
        message: `Task assignment notifications processed for ${Object.keys(assignmentsByWorker).length} workers`,
        results: results
      };

    } catch (error) {
      console.error('❌ Error in TaskNotificationService.notifyTaskAssignment:', error);
      throw error;
    }
  }

  /**
   * Send notification when tasks are modified or reassigned
   * Implements Requirement 1.2: Task modification notifications with change details
   * @param {Object} assignment - WorkerTaskAssignment object
   * @param {Object} changes - Object describing what changed
   * @param {number} supervisorId - ID of supervisor who made the changes
   * @returns {Promise<Object>} Notification creation result
   */
  async notifyTaskModification(assignment, changes, supervisorId) {
    try {
      // Get task and project details
      const [task, project, supervisor] = await Promise.all([
        Task.findOne({ id: assignment.taskId }),
        Project.findOne({ id: assignment.projectId }),
        Employee.findOne({ id: supervisorId })
      ]);

      // Build change description
      const changeDescriptions = [];
      if (changes.status) {
        changeDescriptions.push(`Status changed to ${changes.status}`);
      }
      if (changes.priority) {
        changeDescriptions.push(`Priority changed to ${changes.priority}`);
      }
      if (changes.workArea) {
        changeDescriptions.push(`Work area changed to ${changes.workArea}`);
      }
      if (changes.timeEstimate) {
        changeDescriptions.push(`Time estimate updated`);
      }
      if (changes.dailyTarget) {
        changeDescriptions.push(`Daily target updated`);
      }
      if (changes.reassigned) {
        changeDescriptions.push(`Task reassigned`);
      }

      const changeText = changeDescriptions.length > 0 
        ? changeDescriptions.join(', ')
        : 'Task details updated';

      // Create notification
      const title = 'Task Updated';
      const message = `Your task "${task?.taskName || 'Task'}" has been modified. ${changeText}.`;

      const supervisorContact = supervisor ? {
        name: supervisor.fullName,
        phone: supervisor.phone || 'N/A',
        email: supervisor.email || 'N/A'
      } : {
        name: 'Supervisor',
        phone: 'N/A',
        email: 'N/A'
      };

      // Prepare action data with required fields (Requirement 2.1, 2.2, 2.3)
      const actionData = {
        taskId: assignment.taskId,
        projectId: assignment.projectId,
        supervisorContact: supervisorContact,
        assignmentId: assignment.id,
        changes: changes,
        changeDescription: changeText,
        actionUrl: `/worker/tasks/today`
      };

      const notificationResult = await this.notificationService.createNotification({
        type: 'TASK_UPDATE',
        title: title,
        message: message,
        senderId: supervisorId,
        recipients: [assignment.employeeId],
        actionData: actionData,
        requiresAcknowledgment: false,
        language: 'en'
      });

      return {
        success: true,
        message: 'Task modification notification sent',
        notificationResult: notificationResult
      };

    } catch (error) {
      console.error('❌ Error in TaskNotificationService.notifyTaskModification:', error);
      throw error;
    }
  }

  /**
   * Send notification for overtime instructions
   * Implements Requirement 1.4: High-priority overtime instruction notifications
   * @param {Array} workerIds - Array of worker IDs who need to work overtime
   * @param {Object} overtimeDetails - Overtime instruction details
   * @param {number} supervisorId - ID of supervisor issuing overtime instructions
   * @returns {Promise<Object>} Notification creation results
   */
  async notifyOvertimeInstructions(workerIds, overtimeDetails, supervisorId) {
    try {
      if (!workerIds || workerIds.length === 0) {
        return { success: false, message: 'No worker IDs provided' };
      }

      // Get supervisor information
      const supervisor = await Employee.findOne({ id: supervisorId });
      const supervisorContact = supervisor ? {
        name: supervisor.fullName,
        phone: supervisor.phone || 'N/A',
        email: supervisor.email || 'N/A'
      } : {
        name: 'Supervisor',
        phone: 'N/A',
        email: 'N/A'
      };

      // Create notification content
      const title = 'Overtime Instructions';
      const message = `You are required to work overtime. ${overtimeDetails.reason || 'Please check with your supervisor for details.'} Duration: ${overtimeDetails.duration || 'TBD'}.`;

      // Prepare action data with required fields
      const actionData = {
        taskId: overtimeDetails.taskId || null,
        projectId: overtimeDetails.projectId,
        supervisorContact: supervisorContact,
        overtimeDetails: {
          startTime: overtimeDetails.startTime,
          endTime: overtimeDetails.endTime,
          duration: overtimeDetails.duration,
          reason: overtimeDetails.reason,
          compensation: overtimeDetails.compensation || 'Standard overtime rate'
        },
        actionUrl: `/worker/tasks/today`
      };

      // Send high-priority notification to all selected workers
      const notificationResult = await this.notificationService.createNotification({
        type: 'TASK_UPDATE',
        priority: 'HIGH', // High priority for overtime instructions
        title: title,
        message: message,
        senderId: supervisorId,
        recipients: workerIds,
        actionData: actionData,
        requiresAcknowledgment: true, // Require acknowledgment for overtime
        language: 'en'
      });

      return {
        success: true,
        message: `Overtime instruction notifications sent to ${workerIds.length} workers`,
        notificationResult: notificationResult
      };

    } catch (error) {
      console.error('❌ Error in TaskNotificationService.notifyOvertimeInstructions:', error);
      throw error;
    }
  }

  /**
   * Send notification when daily job targets are updated
   * Implements Requirement 1.3: Daily target update notifications within 2 minutes
   * @param {Array} assignments - Array of WorkerTaskAssignment objects with updated targets
   * @param {number} supervisorId - ID of supervisor who updated the targets
   * @returns {Promise<Object>} Notification creation results
   */
  async notifyDailyTargetUpdate(assignments, supervisorId) {
    try {
      if (!assignments || assignments.length === 0) {
        return { success: false, message: 'No assignments provided' };
      }

      const results = [];
      
      // Get supervisor information
      const supervisor = await Employee.findOne({ id: supervisorId });
      const supervisorContact = supervisor ? {
        name: supervisor.fullName,
        phone: supervisor.phone || 'N/A',
        email: supervisor.email || 'N/A'
      } : {
        name: 'Supervisor',
        phone: 'N/A',
        email: 'N/A'
      };

      // Group assignments by worker
      const assignmentsByWorker = assignments.reduce((acc, assignment) => {
        const workerId = assignment.employeeId;
        if (!acc[workerId]) {
          acc[workerId] = [];
        }
        acc[workerId].push(assignment);
        return acc;
      }, {});

      // Send notification to each affected worker
      for (const [workerId, workerAssignments] of Object.entries(assignmentsByWorker)) {
        try {
          const taskCount = workerAssignments.length;
          const firstAssignment = workerAssignments[0];
          
          // Get project details
          const project = await Project.findOne({ id: firstAssignment.projectId });

          // Create notification content
          const title = taskCount === 1 
            ? 'Daily Target Updated'
            : 'Daily Targets Updated';

          const message = taskCount === 1
            ? `Your daily target has been updated for ${project?.projectName || 'your project'}.`
            : `Daily targets have been updated for ${taskCount} of your tasks in ${project?.projectName || 'your project'}.`;

          // Prepare action data
          const actionData = {
            taskId: firstAssignment.taskId,
            projectId: firstAssignment.projectId,
            supervisorContact: supervisorContact,
            assignmentIds: workerAssignments.map(a => a.id),
            updatedTargets: workerAssignments.map(a => ({
              assignmentId: a.id,
              taskId: a.taskId,
              dailyTarget: a.dailyTarget
            })),
            actionUrl: `/worker/tasks/today`
          };

          // Create notification
          const notificationResult = await this.notificationService.createNotification({
            type: 'TASK_UPDATE',
            title: title,
            message: message,
            senderId: supervisorId,
            recipients: [parseInt(workerId)],
            actionData: actionData,
            requiresAcknowledgment: false,
            language: 'en'
          });

          results.push({
            workerId: parseInt(workerId),
            assignmentCount: taskCount,
            notificationResult: notificationResult
          });

        } catch (workerError) {
          console.error(`❌ Error sending daily target update notification to worker ${workerId}:`, workerError);
          results.push({
            workerId: parseInt(workerId),
            assignmentCount: workerAssignments.length,
            error: workerError.message
          });
        }
      }

      return {
        success: true,
        message: `Daily target update notifications processed for ${Object.keys(assignmentsByWorker).length} workers`,
        results: results
      };

    } catch (error) {
      console.error('❌ Error in TaskNotificationService.notifyDailyTargetUpdate:', error);
      throw error;
    }
  }

  /**
   * Send notification when task status changes (started, completed, blocked)
   * @param {Object} assignment - WorkerTaskAssignment object
   * @param {string} previousStatus - Previous status
   * @param {string} newStatus - New status
   * @param {number} supervisorId - ID of supervisor (optional)
   * @returns {Promise<Object>} Notification creation result
   */
  async notifyTaskStatusChange(assignment, previousStatus, newStatus, supervisorId = null) {
    try {
      // Only notify supervisors about worker-initiated status changes
      if (!supervisorId) {
        return { success: false, message: 'No supervisor to notify' };
      }

      // Get task and project details
      const [task, project, worker] = await Promise.all([
        Task.findOne({ id: assignment.taskId }),
        Project.findOne({ id: assignment.projectId }),
        Employee.findOne({ id: assignment.employeeId })
      ]);

      // Create notification content based on status change
      let title, message;
      switch (newStatus) {
        case 'in_progress':
          title = 'Task Started';
          message = `${worker?.fullName || 'Worker'} has started task "${task?.taskName || 'Task'}" in ${project?.projectName || 'project'}.`;
          break;
        case 'completed':
          title = 'Task Completed';
          message = `${worker?.fullName || 'Worker'} has completed task "${task?.taskName || 'Task'}" in ${project?.projectName || 'project'}.`;
          break;
        case 'blocked':
          title = 'Task Blocked';
          message = `Task "${task?.taskName || 'Task'}" has been blocked for ${worker?.fullName || 'worker'} in ${project?.projectName || 'project'}.`;
          break;
        default:
          title = 'Task Status Updated';
          message = `Task "${task?.taskName || 'Task'}" status changed from ${previousStatus} to ${newStatus}.`;
      }

      // Prepare action data
      const actionData = {
        taskId: assignment.taskId,
        projectId: assignment.projectId,
        supervisorContact: {
          name: 'System',
          phone: 'N/A',
          email: 'N/A'
        },
        assignmentId: assignment.id,
        workerId: assignment.employeeId,
        workerName: worker?.fullName || 'Worker',
        statusChange: {
          from: previousStatus,
          to: newStatus,
          timestamp: new Date().toISOString()
        },
        actionUrl: `/supervisor/worker-tasks`
      };

      // Create notification for supervisor
      const notificationResult = await this.notificationService.createNotification({
        type: 'TASK_UPDATE',
        title: title,
        message: message,
        senderId: assignment.employeeId, // Worker is the sender
        recipients: [supervisorId],
        actionData: actionData,
        requiresAcknowledgment: false,
        language: 'en'
      });

      return {
        success: true,
        message: 'Task status change notification sent to supervisor',
        notificationResult: notificationResult
      };

    } catch (error) {
      console.error('❌ Error in TaskNotificationService.notifyTaskStatusChange:', error);
      throw error;
    }
  }
}

export default new TaskNotificationService();