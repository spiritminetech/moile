import NotificationService from './NotificationService.js';
import Employee from '../../employee/Employee.js';
import Project from '../../project/models/Project.js';
import WorkerTaskAssignment from '../../worker/models/WorkerTaskAssignment.js';

/**
 * SiteChangeNotificationService
 * Handles site change notification triggers for worker mobile notifications
 * Implements Requirements 2.1, 2.2, 2.3, 2.4 (location changes, supervisor reassignment, geofence updates)
 */
class SiteChangeNotificationService {
  constructor() {
    this.notificationService = NotificationService;
  }

  /**
   * Send notification when worker's project or work location changes
   * Implements Requirement 2.1: Critical location change notifications
   */
  async notifyLocationChange(workerId, oldLocation, newLocation, projectId) {
    try {
      const employee = await Employee.findById(workerId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      const project = await Project.findById(projectId);
      const projectName = project ? project.name : 'Unknown Project';

      const notification = {
        title: 'Work Location Changed',
        body: `Your work location has been updated for ${projectName}`,
        data: {
          type: 'location_change',
          workerId,
          projectId,
          oldLocation,
          newLocation,
          timestamp: new Date().toISOString()
        }
      };

      await this.notificationService.sendToUser(workerId, notification);
      
      console.log(`Location change notification sent to worker ${workerId}`);
      return { success: true, notificationId: notification.id };
    } catch (error) {
      console.error('Error sending location change notification:', error);
      throw error;
    }
  }

  /**
   * Send notification when worker is reassigned to a different supervisor
   * Implements Requirement 2.2: Supervisor reassignment notifications
   */
  async notifySupervisorReassignment(workerId, oldSupervisorId, newSupervisorId, projectId) {
    try {
      const employee = await Employee.findById(workerId);
      const newSupervisor = await Employee.findById(newSupervisorId);
      
      if (!employee || !newSupervisor) {
        throw new Error('Employee or supervisor not found');
      }

      const project = await Project.findById(projectId);
      const projectName = project ? project.name : 'Unknown Project';

      const notification = {
        title: 'Supervisor Changed',
        body: `You have been reassigned to supervisor ${newSupervisor.name} for ${projectName}`,
        data: {
          type: 'supervisor_reassignment',
          workerId,
          projectId,
          oldSupervisorId,
          newSupervisorId,
          supervisorName: newSupervisor.name,
          timestamp: new Date().toISOString()
        }
      };

      await this.notificationService.sendToUser(workerId, notification);
      
      console.log(`Supervisor reassignment notification sent to worker ${workerId}`);
      return { success: true, notificationId: notification.id };
    } catch (error) {
      console.error('Error sending supervisor reassignment notification:', error);
      throw error;
    }
  }

  /**
   * Send notification when project geofence boundaries are updated
   * Implements Requirement 2.3: Geofence update notifications
   */
  async notifyGeofenceUpdate(projectId, affectedWorkerIds, geofenceChanges) {
    try {
      const project = await Project.findById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const notification = {
        title: 'Work Area Updated',
        body: `The work area boundaries for ${project.name} have been updated`,
        data: {
          type: 'geofence_update',
          projectId,
          projectName: project.name,
          geofenceChanges,
          timestamp: new Date().toISOString()
        }
      };

      // Send to all affected workers
      const results = [];
      for (const workerId of affectedWorkerIds) {
        try {
          await this.notificationService.sendToUser(workerId, notification);
          results.push({ workerId, success: true });
        } catch (error) {
          console.error(`Failed to send geofence update to worker ${workerId}:`, error);
          results.push({ workerId, success: false, error: error.message });
        }
      }

      console.log(`Geofence update notifications sent to ${affectedWorkerIds.length} workers`);
      return { success: true, results };
    } catch (error) {
      console.error('Error sending geofence update notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification when worker's task assignment changes location
   * Implements Requirement 2.4: Task location change notifications
   */
  async notifyTaskLocationChange(taskAssignmentId, workerId, oldTaskLocation, newTaskLocation) {
    try {
      const taskAssignment = await WorkerTaskAssignment.findById(taskAssignmentId)
        .populate('task')
        .populate('project');
      
      if (!taskAssignment) {
        throw new Error('Task assignment not found');
      }

      const employee = await Employee.findById(workerId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      const taskName = taskAssignment.task ? taskAssignment.task.name : 'Unknown Task';
      const projectName = taskAssignment.project ? taskAssignment.project.name : 'Unknown Project';

      const notification = {
        title: 'Task Location Updated',
        body: `Location for task "${taskName}" in ${projectName} has been updated`,
        data: {
          type: 'task_location_change',
          taskAssignmentId,
          workerId,
          taskName,
          projectName,
          oldTaskLocation,
          newTaskLocation,
          timestamp: new Date().toISOString()
        }
      };

      await this.notificationService.sendToUser(workerId, notification);
      
      console.log(`Task location change notification sent to worker ${workerId}`);
      return { success: true, notificationId: notification.id };
    } catch (error) {
      console.error('Error sending task location change notification:', error);
      throw error;
    }
  }

  /**
   * Batch process multiple site change notifications
   * Useful for bulk updates affecting multiple workers
   */
  async batchNotifySiteChanges(notifications) {
    const results = [];
    
    for (const notificationRequest of notifications) {
      try {
        let result;
        
        switch (notificationRequest.type) {
          case 'location_change':
            result = await this.notifyLocationChange(
              notificationRequest.workerId,
              notificationRequest.oldLocation,
              notificationRequest.newLocation,
              notificationRequest.projectId
            );
            break;
            
          case 'supervisor_reassignment':
            result = await this.notifySupervisorReassignment(
              notificationRequest.workerId,
              notificationRequest.oldSupervisorId,
              notificationRequest.newSupervisorId,
              notificationRequest.projectId
            );
            break;
            
          case 'geofence_update':
            result = await this.notifyGeofenceUpdate(
              notificationRequest.projectId,
              notificationRequest.affectedWorkerIds,
              notificationRequest.geofenceChanges
            );
            break;
            
          case 'task_location_change':
            result = await this.notifyTaskLocationChange(
              notificationRequest.taskAssignmentId,
              notificationRequest.workerId,
              notificationRequest.oldTaskLocation,
              notificationRequest.newTaskLocation
            );
            break;
            
          default:
            throw new Error(`Unknown notification type: ${notificationRequest.type}`);
        }
        
        results.push({ ...notificationRequest, result, success: true });
      } catch (error) {
        console.error(`Batch notification failed for ${notificationRequest.type}:`, error);
        results.push({ ...notificationRequest, success: false, error: error.message });
      }
    }
    
    return results;
  }
}

export default new SiteChangeNotificationService();