import mongoose from 'mongoose';
import Attendance from '../attendance/Attendance.js';
import Project from '../project/models/Project.js';
import Employee from '../employee/Employee.js';
import LocationLog from '../attendance/LocationLog.js';
import WorkerTaskAssignment from '../worker/models/WorkerTaskAssignment.js';
import WorkerTaskProgress from '../worker/models/WorkerTaskProgress.js';
import CompanyUser from "../companyUser/CompanyUser.js";
import Task from "../task/Task.js"
import TaskNotificationService from '../notification/services/TaskNotificationService.js';
import LeaveRequest from '../leaveRequest/models/LeaveRequest.js';
import PaymentRequest from '../leaveRequest/models/PaymentRequest.js';
import MedicalClaim from '../leaveRequest/models/MedicalClaim.js';
import MaterialRequest from '../project/models/MaterialRequest.js';
import AttendanceCorrection from '../attendance/models/AttendanceCorrection.js';
import SiteChangeNotificationService from '../notification/services/SiteChangeNotificationService.js';

// Helper function for distance calculation
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius of the earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const getAssignedWorkers = async (req, res) => {
  try {
    const { projectId, search = '', date } = req.query;
    
    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    const workDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const project = await Project.findOne({ id: Number(projectId) });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
   
    // 1️⃣ Get assignments for the project & date
    const assignments = await WorkerTaskAssignment.find({
      projectId: Number(projectId),
      date: workDate
    });

    if (assignments.length === 0) {
      return res.status(200).json({ workers: [] });
    }

    const employeeIds = assignments.map(a => a.employeeId);

    // 2️⃣ Fetch employees
    const employees = await Employee.find({
      id: { $in: employeeIds },
      fullName: { $regex: search, $options: 'i' }
    }).lean();

    // 3️⃣ Build response
    const workers = await Promise.all(
      employees.map(async (worker) => {
        // Format the workDate properly for MongoDB query
        const targetDate = new Date(workDate);
        targetDate.setHours(0, 0, 0, 0); // Set to beginning of day
        
        const attendance = await Attendance.findOne({
          employeeId: worker.id,
          projectId: Number(projectId),
          date: {
            $gte: new Date(workDate), // Greater than or equal to start of day
            $lt: new Date(new Date(workDate).setDate(new Date(workDate).getDate() + 1)) // Less than next day
          }
        }).lean();

        let status = '❌ Absent';
        if (attendance) {
          status = attendance.checkOut ? '✅ Present' : '⏳ Pending';
        }

        return {
          employeeId: worker.id,
          workerName: worker.fullName,
          role: worker.role,
          checkIn: attendance?.checkIn || '-',
          checkOut: attendance?.checkOut || '-',
          status
        };
      })
    );

    return res.status(200).json({ workers });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching assigned workers' });
  }
};


/**
 * Get real-time geofence violations for supervisor monitoring
 * @route GET /api/supervisor/geofence-violations
 */
export const getGeofenceViolations = async (req, res) => {
  try {
    const { projectId, timeRange = '24', status = 'all' } = req.query;
    
    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    const project = await Project.findOne({ id: Number(projectId) });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get workers assigned to this project today
    const today = new Date().toISOString().split('T')[0];
    const assignments = await WorkerTaskAssignment.find({
      projectId: Number(projectId),
      date: today
    });

    const employeeIds = assignments.map(a => a.employeeId);
    
    // Get employees
    const employees = await Employee.find({
      id: { $in: employeeIds }
    }).lean();

    // Create sample violations for workers who checked in late (simulating geofence violations)
    const violations = [];
    const violationsByWorker = {};
    
    for (const employee of employees) {
      // Check attendance to see if they were late
      const attendance = await Attendance.findOne({
        employeeId: employee.id,
        projectId: Number(projectId),
        date: { $gte: new Date(today) }
      });

      // If worker checked in after 8:30 AM, create a geofence violation
      if (attendance && attendance.checkIn) {
        const checkInHour = new Date(attendance.checkIn).getHours();
        const checkInMinute = new Date(attendance.checkIn).getMinutes();
        const checkInTime = checkInHour + checkInMinute / 60;
        
        // If checked in after 8:30 AM (8.5 hours), consider it a violation
        if (checkInTime > 8.5) {
          const violation = {
            id: violations.length + 1,
            employeeId: employee.id,
            workerName: employee.fullName,
            timestamp: attendance.checkIn,
            location: {
              latitude: project.latitude || 0,
              longitude: project.longitude || 0
            },
            distance: Math.floor(Math.random() * 500) + 100, // Random distance 100-600m
            severity: checkInTime > 9 ? 'high' : 'medium',
            status: 'active',
            duration: Math.floor((new Date() - new Date(attendance.checkIn)) / 60000), // minutes
            notes: `Worker checked in late at ${new Date(attendance.checkIn).toLocaleTimeString()}`
          };
          
          violations.push(violation);
          
          if (!violationsByWorker[employee.id]) {
            violationsByWorker[employee.id] = {
              employeeId: employee.id,
              workerName: employee.fullName,
              totalViolations: 0,
              activeViolations: 0,
              resolvedViolations: 0,
              lastViolation: null
            };
          }
          
          violationsByWorker[employee.id].totalViolations++;
          violationsByWorker[employee.id].activeViolations++;
          violationsByWorker[employee.id].lastViolation = attendance.checkIn;
        }
      }
    }

    const activeViolations = violations.filter(v => v.status === 'active').length;
    const resolvedViolations = violations.filter(v => v.status === 'resolved').length;

    return res.status(200).json({
      violations: violations,
      summary: {
        totalViolations: violations.length,
        activeViolations: activeViolations,
        resolvedViolations: resolvedViolations,
        uniqueWorkers: Object.keys(violationsByWorker).length,
        timeRange: timeRange === 'today' ? 'today' : `${parseInt(timeRange) || 24} hours`
      },
      violationsByWorker: Object.values(violationsByWorker),
      projectName: project.projectName || project.name,
      message: violations.length > 0 
        ? `Found ${violations.length} geofence violation(s)` 
        : 'No geofence violations found'
    });

  } catch (error) {
    console.error('Error fetching geofence violations:', error);
    return res.status(500).json({ message: 'Error fetching geofence violations' });
  }
};

/**
 * Send attendance alert to selected workers
 * @route POST /api/supervisor/send-attendance-alert
 */
export const sendAttendanceAlert = async (req, res) => {
  try {
    const { workerIds, message, projectId } = req.body;
    
    if (!workerIds || !Array.isArray(workerIds) || workerIds.length === 0) {
      return res.status(400).json({ message: 'workerIds array is required' });
    }

    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    const project = await Project.findOne({ id: Number(projectId) });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get supervisor information from token
    const supervisorId = req.user?.userId || 1;

    const alertMessage = message || 'Please check your attendance status and ensure you are at the work site on time.';
    
    // Send notifications to each worker
    const notificationPromises = workerIds.map(async (workerId) => {
      try {
        // Import AttendanceNotificationService dynamically to avoid circular dependency
        const { default: AttendanceNotificationService } = await import('../notification/services/AttendanceNotificationService.js');
        
        // Create a custom attendance alert notification
        return await AttendanceNotificationService.createNotification({
          type: 'ATTENDANCE_ALERT',
          priority: 'HIGH',
          title: 'Attendance Alert',
          message: alertMessage,
          senderId: supervisorId,
          recipients: [workerId],
          actionData: {
            alertType: 'SUPERVISOR_ATTENDANCE_ALERT',
            timestamp: new Date().toISOString(),
            projectId: projectId,
            projectName: project.projectName || project.name,
            actionUrl: '/attendance'
          },
          requiresAcknowledgment: true,
          language: 'en'
        });
      } catch (error) {
        console.error(`Failed to send alert to worker ${workerId}:`, error);
        return { success: false, workerId, error: error.message };
      }
    });

    const results = await Promise.allSettled(notificationPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return res.status(200).json({
      message: `Attendance alert sent successfully`,
      summary: {
        total: workerIds.length,
        successful,
        failed
      },
      results: results.map((result, index) => ({
        workerId: workerIds[index],
        status: result.status,
        error: result.status === 'rejected' ? result.reason : null
      }))
    });

  } catch (err) {
    console.error('Error sending attendance alert:', err);
    return res.status(500).json({ message: 'Error sending attendance alert' });
  }
};

/**
 * Get Late and Absent Workers for a project
 * @route GET /api/supervisor/late-absent-workers
 */
export const getLateAbsentWorkers = async (req, res) => {
  try {
    const { projectId, date } = req.query;
    
    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    const workDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    const project = await Project.findOne({ id: Number(projectId) });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get assignments for the project & date
    const assignments = await WorkerTaskAssignment.find({
      projectId: Number(projectId),
      date: workDate
    });

    if (assignments.length === 0) {
      return res.status(200).json({ 
        lateWorkers: [], 
        absentWorkers: [],
        summary: {
          totalAssigned: 0,
          lateCount: 0,
          absentCount: 0,
          onTimeCount: 0
        }
      });
    }

    const employeeIds = assignments.map(a => a.employeeId);

    // Fetch employees
    const employees = await Employee.find({
      id: { $in: employeeIds }
    }).lean();

    const lateWorkers = [];
    const absentWorkers = [];
    let onTimeCount = 0;

    // Define thresholds
    const LATE_THRESHOLD_MINUTES = 15; // 15 minutes after 8:00 AM
    const ABSENT_THRESHOLD_HOUR = 9; // Consider absent after 9:00 AM
    const WORK_START_HOUR = 8;
    const WORK_START_MINUTE = 0;

    for (const worker of employees) {
      const attendance = await Attendance.findOne({
        employeeId: worker.id,
        projectId: Number(projectId),
        date: {
          $gte: new Date(workDate),
          $lt: new Date(new Date(workDate).setDate(new Date(workDate).getDate() + 1))
        }
      }).lean();

      const assignment = assignments.find(a => a.employeeId === worker.id);

      if (!attendance || !attendance.checkIn) {
        // No check-in record
        if (currentHour >= ABSENT_THRESHOLD_HOUR) {
          absentWorkers.push({
            employeeId: worker.id,
            workerName: worker.fullName,
            role: worker.role,
            phone: worker.phone,
            email: worker.email,
            expectedStartTime: `${WORK_START_HOUR}:${WORK_START_MINUTE.toString().padStart(2, '0')} AM`,
            status: 'Absent',
            minutesLate: null,
            lastSeen: null,
            taskAssigned: assignment?.taskName || 'No task assigned',
            supervisorId: assignment?.supervisorId || null
          });
        }
      } else {
        // Has check-in record
        const checkInTime = new Date(attendance.checkIn);
        const expectedStartTime = new Date(workDate);
        expectedStartTime.setHours(WORK_START_HOUR, WORK_START_MINUTE, 0, 0);
        
        const minutesLate = Math.floor((checkInTime - expectedStartTime) / (1000 * 60));

        if (minutesLate > LATE_THRESHOLD_MINUTES) {
          lateWorkers.push({
            employeeId: worker.id,
            workerName: worker.fullName,
            role: worker.role,
            phone: worker.phone,
            email: worker.email,
            expectedStartTime: `${WORK_START_HOUR}:${WORK_START_MINUTE.toString().padStart(2, '0')} AM`,
            actualCheckIn: checkInTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            status: 'Late',
            minutesLate: minutesLate,
            taskAssigned: assignment?.taskName || 'No task assigned',
            supervisorId: assignment?.supervisorId || null,
            insideGeofence: attendance.insideGeofenceAtCheckin || false
          });
        } else {
          onTimeCount++;
        }
      }
    }

    const summary = {
      totalAssigned: employees.length,
      lateCount: lateWorkers.length,
      absentCount: absentWorkers.length,
      onTimeCount: onTimeCount,
      checkTime: currentTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    return res.status(200).json({
      lateWorkers,
      absentWorkers,
      summary,
      projectName: project.projectName || project.name
    });

  } catch (err) {
    console.error('Error fetching late/absent workers:', err);
    return res.status(500).json({ message: 'Error fetching late/absent workers' });
  }
};

/**
 * Export Daily Attendance Report (CSV/PDF)
 * @route GET /api/supervisor/export-report
 */
export const exportReport = async (req, res) => {
  try {
    const { projectId, date } = req.query;
    const project = await Project.findOne({ id: projectId });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Logic to generate the report (CSV or PDF) for workers' attendance on the selected date
    // This part should implement the export functionality (you can use libraries like csv-writer, pdfkit, etc.)

    const workers = await Employee.find({ projectId: projectId });
    const attendanceRecords = await Attendance.find({
      projectId: projectId,
      date: new Date(date).setHours(0, 0, 0, 0)
    });

    // Mock response for demonstration
    return res.status(200).json({
      message: 'Exported report successfully',
      fileUrl: 'http://example.com/reports/attendance_report.csv'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error exporting report' });
  }
};

/**
 * Refresh Workers Attendance (For UI update)
 * @route GET /api/supervisor/refresh-attendance
 */
export const refreshAttendance = async (req, res) => {
  try {
    const { projectId } = req.query;

    const workers = await Employee.find({ projectId });
    const workerData = await Promise.all(workers.map(async (worker) => {
      const attendance = await Attendance.findOne({ employeeId: worker.id, projectId: projectId, date: new Date().setHours(0, 0, 0, 0) });
      const status = attendance
        ? attendance.checkOut ? '✅ Present' : '⏳ Pending'
        : '❌ Absent';

      return {
        workerName: worker.fullName,
        role: worker.role,
        checkIn: attendance ? attendance.checkIn : '-',
        checkOut: attendance ? attendance.checkOut : '-',
        status: status
      };
    }));

    return res.status(200).json({ workers: workerData });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error refreshing attendance' });
  }
};

export const getSupervisorProjects = async (req, res) => {
  try {
    // 1️⃣ Get all projects
    const projects = await Project.find();

    // 2️⃣ Filter projects by checking linked employee and companyUser
    const filteredProjects = [];

    for (const project of projects) {
      // Find employee linked to supervisorId
      const employee = await Employee.findOne({ id: project.supervisorId });
      if (!employee) continue; // skip if no employee

      // Check if the employee's userId is a supervisor in CompanyUser
      const companyUser = await CompanyUser.findOne({ userId: employee.userId, role: "supervisor" });
      if (!companyUser) continue; // skip if not a supervisor

      // Passed all checks, include project
      filteredProjects.push(project);
    }

    // 3️⃣ Return filtered projects
    res.json({
      success: true,
      data: filteredProjects,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: filteredProjects.length,
        itemsPerPage: filteredProjects.length,
      },
    });
  } catch (err) {
    console.error("getSupervisorProjects error:", err);
    res.status(500).json({ message: "Server error" });
  }
};



/**
 * Get checked-in workers for a project
/**
 * Get checked-in workers for a project (ERP-safe)
 * Only workers who are:
 *   - Checked-in today
 *   - Inside geofence at check-in
 *   - Have at most one active task
 */
export const getCheckedInWorkers = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({ message: "projectId is required" });
    }

    // Today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1️⃣ Get all checked-in attendances for today, inside geofence
    const attendances = await Attendance.find({
      projectId,
      date: { $gte: today },
      checkIn: { $ne: null },
      checkOut: null, // still working
      insideGeofenceAtCheckin: true,
    });

    // 2️⃣ Map attendance -> worker info with active task
    const workerData = await Promise.all(
      attendances.map(async (att) => {
        // Fetch employee info (ensure correct id type)
        const employee = await Employee.findOne({ id: att.employeeId }).lean();

        if (!employee) return null; // skip if employee not found

        // Check if worker has an active task today
        const activeTask = await WorkerTaskAssignment.findOne({
          employeeId: employee.id,
          projectId,
          date: today,
          status: "in_progress", // only active task
        });
                console.log("active",activeTask);
        return {
          employee: {
            id: employee.id,
            fullName: employee.fullName,
          },
          taskId: activeTask ? activeTask.taskId : null,
          assignmentId: activeTask ? activeTask.id : null,
        };
      })
    );

    // Filter out nulls (missing employee)
    const filteredWorkers = workerData.filter((w) => w !== null);

    res.json(filteredWorkers);
  } catch (err) {
    console.error("getCheckedInWorkers error:", err);
    res.status(500).json({ message: "Server error" });
  }
};



/**
 * Get all tasks for a project
 */
export const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const tasks = await Task.find({ projectId });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all tasks assigned to a worker for a specific date
 * @route GET /api/supervisor/worker-tasks
 * @query employeeId, date (YYYY-MM-DD)
 */
export const getWorkerTasks = async (req, res) => {
  try {
    const { employeeId, date } = req.query;

    if (!employeeId || !date) {
      return res.status(400).json({ message: "employeeId and date are required" });
    }

    // Start and end of the selected day
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    // Fetch assignments for the worker for this date
    const assignments = await WorkerTaskAssignment.find({
      employeeId: Number(employeeId),
      date: {
        $gte: dayStart,
        $lt: dayEnd,
      },
    }).sort({ sequence: 1 }); // Order by sequence if available

    // Populate task details
    const tasksWithDetails = await Promise.all(
      assignments.map(async (a) => {
        const task = await Task.findOne({ id: a.taskId }).lean();
        return {
          assignmentId: a.id,
          taskId: a.taskId,
          taskName: task?.taskName || "Unknown Task",
          status: a.status.toLowerCase(), // queued, in_progress, completed
          sequence: a.sequence || null,
          startTime: a.startTime || null,
          endTime: a.endTime || null,
        };
      })
    );

    return res.status(200).json({ success: true, tasks: tasksWithDetails });
  } catch (err) {
    console.error("getWorkerTasks error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


/**
 * Assign task to a worker
 */

export const assignTask = async (req, res) => {
  try {
    const { employeeId, projectId, taskIds, date } = req.body;

    if (!employeeId || !projectId || !Array.isArray(taskIds) || !taskIds.length || !date) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    // 1️⃣ Validate tasks belong to project
    const validTasks = await Task.find({
      id: { $in: taskIds },
      projectId: Number(projectId),
    });

    if (validTasks.length !== taskIds.length) {
      return res.status(400).json({
        message: "One or more tasks do not belong to this project",
      });
    }

    // 2️⃣ Prevent duplicate assignments (same task, same day)
    const existing = await WorkerTaskAssignment.find({
      employeeId: Number(employeeId),
      projectId: Number(projectId),
      taskId: { $in: taskIds },
      date,
    });

    if (existing.length) {
      return res.status(400).json({
        message: "Some tasks are already assigned for this worker on this date",
      });
    }

    // 3️⃣ Find last sequence for the day
    const lastTask = await WorkerTaskAssignment
      .findOne({ 
        employeeId, 
        projectId, 
        date,
        sequence: { $exists: true, $ne: null, $type: "number" }
      })
      .sort({ sequence: -1 });

    let sequenceStart = (lastTask && typeof lastTask.sequence === 'number' && !isNaN(lastTask.sequence)) 
      ? lastTask.sequence + 1 
      : 1;

    // 4️⃣ Generate incremental IDs safely
    const lastId = await WorkerTaskAssignment.findOne().sort({ id: -1 });
    let nextId = lastId ? lastId.id + 1 : 1;

    const assignments = taskIds.map((taskId, index) => {
      const sequence = sequenceStart + index;
      
      // Ensure sequence is a valid number
      if (isNaN(sequence) || !isFinite(sequence)) {
        throw new Error(`Invalid sequence calculated: ${sequence}`);
      }
      
      return {
        id: nextId++,
        employeeId: Number(employeeId),
        projectId: Number(projectId),
        taskId: Number(taskId),
        date,
        status: "queued",
        sequence: sequence,
        createdAt: new Date(),
      };
    });

    const createdAssignments = await WorkerTaskAssignment.insertMany(assignments);

    // Send task assignment notifications
    try {
      // Get supervisor ID from request user or use a default
      const supervisorId = req.user?.userId || req.user?.id || 1; // Fallback to 1 if no user context
      
      await TaskNotificationService.notifyTaskAssignment(createdAssignments, supervisorId);
      console.log(`✅ Task assignment notifications sent for ${createdAssignments.length} assignments`);
    } catch (notificationError) {
      console.error("❌ Error sending task assignment notifications:", notificationError);
      // Don't fail the request if notifications fail
    }

    res.json({
      success: true,
      message: "Tasks queued successfully",
      totalQueued: assignments.length,
    });

  } catch (err) {
    console.error("assignTasks error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update task assignment details (modification/reassignment)
 * Implements Requirement 1.2: Task modification and reassignment notifications
 * Implements Requirement 2.4: Task location change notifications
 */
export const updateTaskAssignment = async (req, res) => {
  try {
    const { assignmentId, changes } = req.body;

    if (!assignmentId || !changes) {
      return res.status(400).json({ message: "Assignment ID and changes are required" });
    }

    // Find the assignment by MongoDB _id (ObjectId)
    const assignment = await WorkerTaskAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Store original values for notification
    const originalAssignment = { ...assignment.toObject() };

    // Check for task location changes (Requirement 2.4)
    const taskLocationChanged = (
      (changes.workArea && changes.workArea !== assignment.workArea) ||
      (changes.floor && changes.floor !== assignment.floor) ||
      (changes.zone && changes.zone !== assignment.zone)
    );

    // Update assignment fields
    if (changes.status) assignment.status = changes.status;
    if (changes.priority) assignment.priority = changes.priority;
    if (changes.workArea) assignment.workArea = changes.workArea;
    if (changes.floor) assignment.floor = changes.floor;
    if (changes.zone) assignment.zone = changes.zone;
    if (changes.timeEstimate) assignment.timeEstimate = { ...assignment.timeEstimate, ...changes.timeEstimate };
    if (changes.dailyTarget) assignment.dailyTarget = { ...assignment.dailyTarget, ...changes.dailyTarget };
    if (changes.supervisorId) assignment.supervisorId = changes.supervisorId;

    await assignment.save();

    // Send task modification notification
    try {
      const supervisorId = req.user?.userId || req.user?.id || 1;
      await TaskNotificationService.notifyTaskModification(assignment, changes, supervisorId);
      console.log(`✅ Task modification notification sent for assignment ${assignmentId}`);
    } catch (notificationError) {
      console.error("❌ Error sending task modification notification:", notificationError);
      // Don't fail the request if notifications fail
    }

    // Send task location change notification if location changed (Requirement 2.4)
    // TODO: Fix SiteChangeNotificationService to work with numeric IDs instead of MongoDB ObjectIds
    // if (taskLocationChanged) {
    //   try {
    //     const oldTaskLocation = {
    //       workArea: originalAssignment.workArea,
    //       floor: originalAssignment.floor,
    //       zone: originalAssignment.zone
    //     };
    //     const newTaskLocation = {
    //       workArea: assignment.workArea,
    //       floor: assignment.floor,
    //       zone: assignment.zone
    //     };

    //     await SiteChangeNotificationService.notifyTaskLocationChange(
    //       assignmentId,
    //       assignment.employeeId,
    //       oldTaskLocation,
    //       newTaskLocation
    //     );
    //     console.log(`✅ Task location change notification sent for assignment ${assignmentId}`);
    //   } catch (notificationError) {
    //     console.error("❌ Error sending task location change notification:", notificationError);
    //     // Don't fail the request if notifications fail
    //   }
    // }

    res.json({
      success: true,
      message: "Task assignment updated successfully",
      assignment: {
        id: assignment.id,
        status: assignment.status,
        priority: assignment.priority,
        workArea: assignment.workArea,
        updatedAt: assignment.updatedAt
      }
    });

  } catch (err) {
    console.error("updateTaskAssignment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Send overtime instructions to selected workers
 * Implements Requirement 1.4: Overtime instruction notifications
 */
export const sendOvertimeInstructions = async (req, res) => {
  try {
    const { workerIds, projectId, overtimeDetails } = req.body;

    if (!workerIds || !Array.isArray(workerIds) || workerIds.length === 0) {
      return res.status(400).json({ message: "Worker IDs are required" });
    }

    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    if (!overtimeDetails || !overtimeDetails.reason) {
      return res.status(400).json({ message: "Overtime details with reason are required" });
    }

    // Validate workers exist and are assigned to the project
    const validWorkers = await Employee.find({
      id: { $in: workerIds },
      status: 'ACTIVE'
    });

    if (validWorkers.length !== workerIds.length) {
      return res.status(400).json({ message: "Some worker IDs are invalid or inactive" });
    }

    // Send overtime instruction notifications
    try {
      const supervisorId = req.user?.userId || req.user?.id || 1;
      const notificationResult = await TaskNotificationService.notifyOvertimeInstructions(
        workerIds, 
        { ...overtimeDetails, projectId }, 
        supervisorId
      );
      
      console.log(`✅ Overtime instruction notifications sent to ${workerIds.length} workers`);

      res.json({
        success: true,
        message: `Overtime instructions sent to ${workerIds.length} workers`,
        notificationResult: notificationResult
      });

    } catch (notificationError) {
      console.error("❌ Error sending overtime instruction notifications:", notificationError);
      res.status(500).json({ message: "Failed to send overtime instructions" });
    }

  } catch (err) {
    console.error("sendOvertimeInstructions error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update daily targets for multiple assignments
 * Implements Requirement 1.3: Daily target update notifications within 2 minutes
 */
export const updateDailyTargets = async (req, res) => {
  try {
    const { assignmentUpdates } = req.body;

    if (!assignmentUpdates || !Array.isArray(assignmentUpdates) || assignmentUpdates.length === 0) {
      return res.status(400).json({ message: "Assignment updates are required" });
    }

    const updatedAssignments = [];

    // Update each assignment's daily target
    for (const update of assignmentUpdates) {
      const { assignmentId, dailyTarget } = update;
      
      if (!assignmentId || !dailyTarget) {
        continue; // Skip invalid updates
      }

      const assignment = await WorkerTaskAssignment.findById(assignmentId);
      if (assignment) {
        assignment.dailyTarget = { ...assignment.dailyTarget, ...dailyTarget };
        await assignment.save();
        updatedAssignments.push(assignment);
      }
    }

    if (updatedAssignments.length === 0) {
      return res.status(400).json({ message: "No valid assignments found to update" });
    }

    // Send daily target update notifications
    try {
      const supervisorId = req.user?.userId || req.user?.id || 1;
      await TaskNotificationService.notifyDailyTargetUpdate(updatedAssignments, supervisorId);
      console.log(`✅ Daily target update notifications sent for ${updatedAssignments.length} assignments`);
    } catch (notificationError) {
      console.error("❌ Error sending daily target update notifications:", notificationError);
      // Don't fail the request if notifications fail
    }

    res.json({
      success: true,
      message: `Daily targets updated for ${updatedAssignments.length} assignments`,
      updatedCount: updatedAssignments.length
    });

  } catch (err) {
    console.error("updateDailyTargets error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const startTask = async (req, res) => {
  try {
    const { assignmentId } = req.body;

    // 1️⃣ Get assignment
    const assignment = await WorkerTaskAssignment.findOne({
      id: assignmentId,
      status: "queued",
    });

    if (!assignment) {
      return res.status(404).json({ message: "Queued task not found" });
    }

    // 2️⃣ Check attendance + geofence
    const attendance = await Attendance.findOne({
      employeeId: assignment.employeeId,
      projectId: assignment.projectId,
      checkIn: { $ne: null },
      checkOut: null,
      insideGeofenceAtCheckin: true,
    });

    if (!attendance) {
      return res.status(400).json({
        message: "Worker must be checked-in inside geofence",
      });
    }

    // 3️⃣ Enforce ONE active task
    const activeTask = await WorkerTaskAssignment.findOne({
      employeeId: assignment.employeeId,
      date: assignment.date,
      status: "in_progress",
    });

    if (activeTask) {
      return res.status(400).json({
        message: "Worker already has an active task",
      });
    }

    // 4️⃣ Start task
    assignment.status = "in_progress";
    assignment.startTime = new Date();

    await assignment.save();

    res.json({
      success: true,
      message: "Task started successfully",
      assignmentId: assignment.id,
    });

  } catch (err) {
    console.error("startTask error:", err);
    res.status(500).json({ message: "Server error" });
  }
};





export const completeTask = async (req, res) => {
  try {
    const { assignmentId } = req.body;

    const assignment = await WorkerTaskAssignment.findOne({
      id: assignmentId,
      status: "IN_PROGRESS"
    });

    if (!assignment) {
      return res.status(404).json({ message: "Active task not found" });
    }

    assignment.status = "COMPLETED";
    assignment.endTime = new Date();
    assignment.completedAt = new Date();

    await assignment.save();

    return res.json({
      success: true,
      message: "Task completed"
    });

  } catch (err) {
    console.error("completeTask error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const getWorkerTasksForDay = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const { date } = req.query;

    const tasks = await WorkerTaskAssignment.find({
      employeeId,
      date,
    }).sort({ sequence: 1 });

    res.json({
      success: true,
      tasks,
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const removeQueuedTask = async (req, res) => {
  try {
    const { assignmentId } = req.body;

    if (!assignmentId) {
      return res.status(400).json({ message: "assignmentId is required" });
    }

    // 1️⃣ Fetch assignment
    const assignment = await WorkerTaskAssignment.findOne({
      id: Number(assignmentId),
    });

    if (!assignment) {
      return res.status(404).json({ message: "Task assignment not found" });
    }

    // 2️⃣ Only queued tasks can be removed
    if (assignment.status !== "queued") {
      return res.status(400).json({
        message: "Only queued tasks can be removed",
      });
    }

    const { employeeId, projectId, date, sequence } = assignment;

    // 3️⃣ Remove task
    await WorkerTaskAssignment.deleteOne({ id: assignment.id });

    // 4️⃣ Re-sequence remaining queued tasks
    const queuedTasks = await WorkerTaskAssignment.find({
      employeeId,
      projectId,
      date,
      status: "queued",
    }).sort({ sequence: 1 });

    for (let i = 0; i < queuedTasks.length; i++) {
      queuedTasks[i].sequence = i + 1;
      await queuedTasks[i].save();
    }

    res.json({
      success: true,
      message: "Queued task removed successfully",
    });

  } catch (err) {
    console.error("removeQueuedTask error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * Get comprehensive attendance monitoring data for supervisors
 * @route GET /api/supervisor/attendance-monitoring
 */
export const getAttendanceMonitoring = async (req, res) => {
  try {
    const { projectId, date, status = 'all', search = '' } = req.query;
    
    const workDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = new Date();

    // Build query for projects
    let projectQuery = {};
    if (projectId && projectId !== 'all') {
      projectQuery = { id: Number(projectId) };
    }

    // Get all projects accessible to supervisor
    const projects = await Project.find(projectQuery);
    if (projects.length === 0) {
      return res.status(200).json({ 
        workers: [],
        summary: {
          totalWorkers: 0,
          checkedIn: 0,
          checkedOut: 0,
          absent: 0,
          late: 0,
          onTime: 0
        },
        projects: []
      });
    }

    const projectIds = projects.map(p => p.id);
    const projectMap = projects.reduce((map, p) => {
      map[p.id] = p;
      return map;
    }, {});

    // Get all assignments for the date and projects
    const assignments = await WorkerTaskAssignment.find({
      projectId: { $in: projectIds },
      date: workDate
    });

    if (assignments.length === 0) {
      return res.status(200).json({ 
        workers: [],
        summary: {
          totalWorkers: 0,
          checkedIn: 0,
          checkedOut: 0,
          absent: 0,
          late: 0,
          onTime: 0
        },
        projects: projects.map(p => ({
          id: p.id,
          name: p.projectName || p.name,
          location: p.address || p.location || 'Unknown',
          geofenceRadius: p.geofenceRadius || p.geofence?.radius || 100
        }))
      });
    }

    const employeeIds = [...new Set(assignments.map(a => a.employeeId))];

    // Fetch employees with search filter
    // Employee model uses numeric IDs, not ObjectIds
    let employeeQuery = { id: { $in: employeeIds } };
    if (search) {
      employeeQuery.fullName = { $regex: search, $options: 'i' };
    }

    const employees = await Employee.find(employeeQuery).lean();
    const employeeMap = employees.reduce((map, emp) => {
      // Use numeric id for mapping since assignments use numeric IDs
      map[emp.id] = emp;
      return map;
    }, {});

    // Get attendance records for all employees and date
    // Handle timezone: expand range to cover the full day in any timezone
    const startOfDay = new Date(workDate);
    startOfDay.setHours(0, 0, 0, 0);
    // Go back 24 hours to catch records stored in different timezones
    startOfDay.setHours(startOfDay.getHours() - 24);
    
    const endOfDay = new Date(workDate);
    endOfDay.setHours(23, 59, 59, 999);
    // Go forward 24 hours to catch records stored in different timezones
    endOfDay.setHours(endOfDay.getHours() + 24);
    
    const attendanceRecords = await Attendance.find({
      employeeId: { $in: employeeIds },
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).lean();
    
    // Filter to exact date match after retrieval (to handle timezone differences)
    const filteredAttendance = attendanceRecords.filter(att => {
      const attDate = new Date(att.date);
      const attDateString = attDate.toISOString().split('T')[0];
      const workDateString = new Date(workDate).toISOString().split('T')[0];
      // Also check if the date in local timezone matches
      const attLocalDate = new Date(attDate.getTime() - attDate.getTimezoneOffset() * 60000);
      const attLocalDateString = attLocalDate.toISOString().split('T')[0];
      return attDateString === workDateString || attLocalDateString === workDateString;
    });

    const attendanceMap = filteredAttendance.reduce((map, att) => {
      const key = `${att.employeeId}-${att.projectId}`;
      map[key] = att;
      return map;
    }, {});

    // Process worker data
    const workers = [];
    const workerMap = new Map(); // Use Map to deduplicate by employeeId-projectId
    const summary = {
      totalWorkers: 0,
      checkedIn: 0,
      checkedOut: 0,
      absent: 0,
      late: 0,
      onTime: 0
    };

    const WORK_START_HOUR = 8;
    const LATE_THRESHOLD_MINUTES = 15;

    for (const assignment of assignments) {
      const employee = employeeMap[assignment.employeeId];
      if (!employee) continue;

      const project = projectMap[assignment.projectId];
      if (!project) continue;

      // Create unique key for deduplication
      const workerKey = `${assignment.employeeId}-${assignment.projectId}`;
      
      // Skip if we've already processed this worker-project combination
      if (workerMap.has(workerKey)) {
        continue;
      }

      const attendanceKey = `${assignment.employeeId}-${assignment.projectId}`;
      const attendance = attendanceMap[attendanceKey];

      // Determine status and timing
      let status = 'ABSENT';
      let isLate = false;
      let minutesLate = 0;
      let workingHours = 0;

      if (attendance) {
        if (attendance.checkOut) {
          status = 'CHECKED_OUT';
          // Calculate working hours
          const checkInTime = new Date(attendance.checkIn);
          const checkOutTime = new Date(attendance.checkOut);
          workingHours = Math.round((checkOutTime - checkInTime) / (1000 * 60 * 60) * 100) / 100;
        } else if (attendance.checkIn) {
          status = 'CHECKED_IN';
          // Calculate current working hours
          const checkInTime = new Date(attendance.checkIn);
          workingHours = Math.round((currentTime - checkInTime) / (1000 * 60 * 60) * 100) / 100;
        }

        // Check if late
        if (attendance.checkIn) {
          const checkInTime = new Date(attendance.checkIn);
          const expectedStartTime = new Date(workDate);
          expectedStartTime.setHours(WORK_START_HOUR, 0, 0, 0);
          
          minutesLate = Math.floor((checkInTime - expectedStartTime) / (1000 * 60));
          isLate = minutesLate > LATE_THRESHOLD_MINUTES;
        }
      }

      // Get recent location data
      const recentLocation = await LocationLog.findOne({
        employeeId: assignment.employeeId,
        projectId: assignment.projectId,
        createdAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } // Last 2 hours
      }).sort({ createdAt: -1 });

      // Calculate lunch duration and OT hours
      let lunchDuration = 0;
      let regularHours = 0;
      let otHours = 0;

      if (attendance?.lunchStartTime && attendance?.lunchEndTime) {
        const lunchStart = new Date(attendance.lunchStartTime);
        const lunchEnd = new Date(attendance.lunchEndTime);
        lunchDuration = (lunchEnd - lunchStart) / (1000 * 60 * 60); // in hours
      }

      if (workingHours > 0) {
        const netWorkHours = workingHours - lunchDuration;
        regularHours = Math.min(netWorkHours, 8);
        otHours = Math.max(netWorkHours - 8, 0);
      }

      const workerData = {
        employeeId: assignment.employeeId,
        workerName: employee.fullName,
        role: employee.role,
        phone: employee.phone,
        email: employee.email,
        projectId: assignment.projectId,
        projectName: project.projectName || project.name,
        projectLocation: project.address || project.location || 'Unknown',
        status: status,
        checkInTime: attendance?.checkIn || null,
        checkOutTime: attendance?.checkOut || null,
        lunchStartTime: attendance?.lunchStartTime || null,
        lunchEndTime: attendance?.lunchEndTime || null,
        lunchDuration: lunchDuration,
        workingHours: workingHours,
        regularHours: regularHours,
        otHours: otHours,
        isLate: isLate,
        minutesLate: Math.max(0, minutesLate),
        insideGeofence: attendance?.insideGeofenceAtCheckin || false,
        insideGeofenceAtCheckout: attendance?.insideGeofenceAtCheckout || false,
        taskAssigned: assignment.taskName || 'No task assigned',
        supervisorId: assignment.supervisorId,
        lastLocationUpdate: recentLocation?.createdAt || null,
        lastKnownLocation: recentLocation ? {
          latitude: recentLocation.latitude,
          longitude: recentLocation.longitude,
          insideGeofence: recentLocation.insideGeofence
        } : null,
        hasManualOverride: attendance?.manualOverrides?.length > 0 || false,
        attendanceId: attendance?.id || null,
        absenceReason: attendance?.absenceReason || null,
        absenceNotes: attendance?.absenceNotes || '',
        absenceMarkedBy: attendance?.absenceMarkedBy || null,
        absenceMarkedAt: attendance?.absenceMarkedAt || null
      };

      // Apply status filter
      if (status !== 'all' && status.toLowerCase() !== workerData.status.toLowerCase()) {
        continue;
      }

      // Mark this worker-project combination as processed
      workerMap.set(workerKey, workerData);
      workers.push(workerData);

      // Update summary
      summary.totalWorkers++;
      switch (status) {
        case 'CHECKED_IN':
          summary.checkedIn++;
          break;
        case 'CHECKED_OUT':
          summary.checkedOut++;
          break;
        case 'ABSENT':
          summary.absent++;
          break;
      }

      if (isLate) {
        summary.late++;
      } else if (attendance?.checkIn) {
        summary.onTime++;
      }
    }

    // Sort workers by project, then by name
    workers.sort((a, b) => {
      if (a.projectName !== b.projectName) {
        return a.projectName.localeCompare(b.projectName);
      }
      return a.workerName.localeCompare(b.workerName);
    });

    return res.status(200).json({
      workers,
      summary: {
        ...summary,
        lastUpdated: currentTime.toISOString(),
        date: workDate
      },
      projects: projects.map(p => ({
        id: p.id,
        name: p.projectName || p.name,
        location: p.address || p.location || 'Unknown',
        geofenceRadius: p.geofenceRadius || p.geofence?.radius || 100
      }))
    });

  } catch (err) {
    console.error('Error fetching attendance monitoring data:', err);
    return res.status(500).json({ message: 'Error fetching attendance monitoring data' });
  }
};

/**
 * Get workers for manual attendance override
 * @route GET /api/supervisor/manual-attendance-workers
 */
export const getManualAttendanceWorkers = async (req, res) => {
  try {
    const { projectId, date } = req.query;
    
    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    const workDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const project = await Project.findOne({ id: Number(projectId) });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get assignments for the project & date
    const assignments = await WorkerTaskAssignment.find({
      projectId: Number(projectId),
      date: workDate
    });

    if (assignments.length === 0) {
      return res.status(200).json({ 
        workers: [],
        projectName: project.projectName || project.name
      });
    }

    const employeeIds = assignments.map(a => a.employeeId);

    // Fetch employees
    const employees = await Employee.find({
      id: { $in: employeeIds }
    }).lean();

    // Build worker data with current attendance status
    const workers = await Promise.all(
      employees.map(async (worker) => {
        const attendance = await Attendance.findOne({
          employeeId: worker.id,
          projectId: Number(projectId),
          date: {
            $gte: new Date(workDate),
            $lt: new Date(new Date(workDate).setDate(new Date(workDate).getDate() + 1))
          }
        }).lean();

        const assignment = assignments.find(a => a.employeeId === worker.id);

        return {
          employeeId: worker.id,
          workerName: worker.fullName,
          role: worker.role,
          phone: worker.phone,
          email: worker.email,
          currentStatus: attendance ? (attendance.checkOut ? 'CHECKED_OUT' : 'CHECKED_IN') : 'ABSENT',
          checkInTime: attendance?.checkIn || null,
          checkOutTime: attendance?.checkOut || null,
          insideGeofenceAtCheckin: attendance?.insideGeofenceAtCheckin || false,
          insideGeofenceAtCheckout: attendance?.insideGeofenceAtCheckout || false,
          taskAssigned: assignment?.taskName || 'No task assigned',
          supervisorId: assignment?.supervisorId || null,
          canOverride: true // All assigned workers can have attendance overridden
        };
      })
    );

    return res.status(200).json({
      workers,
      projectName: project.projectName || project.name,
      date: workDate
    });

  } catch (err) {
    console.error('Error fetching manual attendance workers:', err);
    return res.status(500).json({ message: 'Error fetching workers for manual attendance' });
  }
};

/**
 * Submit manual attendance override
 * @route POST /api/supervisor/manual-attendance-override
 */
export const submitManualAttendanceOverride = async (req, res) => {
  try {
    const { 
      employeeId, 
      projectId, 
      date, 
      overrideType, 
      checkInTime, 
      checkOutTime, 
      reason, 
      notes 
    } = req.body;

    // Validation
    if (!employeeId || !projectId || !date || !overrideType || !reason) {
      return res.status(400).json({ 
        message: 'employeeId, projectId, date, overrideType, and reason are required' 
      });
    }

    if (!['CHECK_IN', 'CHECK_OUT', 'FULL_DAY', 'CORRECTION'].includes(overrideType)) {
      return res.status(400).json({ 
        message: 'Invalid overrideType. Must be CHECK_IN, CHECK_OUT, FULL_DAY, or CORRECTION' 
      });
    }

    // Verify supervisor permissions
    const supervisorId = req.user?.userId || req.user?.id || 1;
    
    // Verify project exists
    const project = await Project.findOne({ id: Number(projectId) });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify employee exists and is assigned to project
    const employee = await Employee.findOne({ id: Number(employeeId) });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const assignment = await WorkerTaskAssignment.findOne({
      employeeId: Number(employeeId),
      projectId: Number(projectId),
      date: date
    });

    if (!assignment) {
      return res.status(400).json({ 
        message: 'Employee is not assigned to this project on the specified date' 
      });
    }

    // Find or create attendance record
    let attendance = await Attendance.findOne({
      employeeId: Number(employeeId),
      projectId: Number(projectId),
      date: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
      }
    });

    const now = new Date();
    const overrideData = {
      supervisorId: supervisorId,
      overrideType: overrideType,
      reason: reason,
      notes: notes || '',
      timestamp: now,
      originalCheckIn: attendance?.checkIn || null,
      originalCheckOut: attendance?.checkOut || null
    };

    if (!attendance) {
      // Create new attendance record
      attendance = new Attendance({
        employeeId: Number(employeeId),
        projectId: Number(projectId),
        date: date,
        createdAt: now
      });
    }

    // Apply override based on type
    switch (overrideType) {
      case 'CHECK_IN':
        if (!checkInTime) {
          return res.status(400).json({ message: 'checkInTime is required for CHECK_IN override' });
        }
        attendance.checkIn = new Date(checkInTime);
        attendance.insideGeofenceAtCheckin = true; // Manual override assumes valid
        attendance.pendingCheckout = !attendance.checkOut;
        break;

      case 'CHECK_OUT':
        if (!checkOutTime) {
          return res.status(400).json({ message: 'checkOutTime is required for CHECK_OUT override' });
        }
        if (!attendance.checkIn) {
          return res.status(400).json({ message: 'Cannot set check-out without check-in' });
        }
        attendance.checkOut = new Date(checkOutTime);
        attendance.insideGeofenceAtCheckout = true; // Manual override assumes valid
        attendance.pendingCheckout = false;
        break;

      case 'FULL_DAY':
        if (!checkInTime || !checkOutTime) {
          return res.status(400).json({ message: 'Both checkInTime and checkOutTime are required for FULL_DAY override' });
        }
        attendance.checkIn = new Date(checkInTime);
        attendance.checkOut = new Date(checkOutTime);
        attendance.insideGeofenceAtCheckin = true;
        attendance.insideGeofenceAtCheckout = true;
        attendance.pendingCheckout = false;
        break;

      case 'CORRECTION':
        // Allow correction of existing times
        if (checkInTime) {
          attendance.checkIn = new Date(checkInTime);
          attendance.insideGeofenceAtCheckin = true;
        }
        if (checkOutTime) {
          attendance.checkOut = new Date(checkOutTime);
          attendance.insideGeofenceAtCheckout = true;
        }
        attendance.pendingCheckout = attendance.checkIn && !attendance.checkOut;
        break;
    }

    // Add override metadata
    if (!attendance.manualOverrides) {
      attendance.manualOverrides = [];
    }
    attendance.manualOverrides.push(overrideData);

    await attendance.save();

    // Send notification to worker about manual attendance override
    try {
      const { default: AttendanceNotificationService } = await import('../notification/services/AttendanceNotificationService.js');
      
      await AttendanceNotificationService.createNotification({
        type: 'ATTENDANCE_OVERRIDE',
        priority: 'MEDIUM',
        title: 'Attendance Override Applied',
        message: `Your attendance for ${date} has been manually adjusted by supervisor. Reason: ${reason}`,
        senderId: supervisorId,
        recipients: [Number(employeeId)],
        actionData: {
          overrideType: overrideType,
          date: date,
          projectId: projectId,
          projectName: project.projectName || project.name,
          reason: reason,
          actionUrl: '/attendance/history'
        },
        requiresAcknowledgment: true,
        language: 'en'
      });
    } catch (notificationError) {
      console.error('Error sending attendance override notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return res.status(200).json({
      success: true,
      message: 'Manual attendance override applied successfully',
      attendance: {
        employeeId: attendance.employeeId,
        projectId: attendance.projectId,
        date: attendance.date,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        overrideType: overrideType,
        reason: reason
      }
    });

  } catch (err) {
    console.error('Error applying manual attendance override:', err);
    return res.status(500).json({ message: 'Error applying manual attendance override' });
  }
};

/**
 * Get active tasks for a project
 * @route GET /api/supervisor/active-tasks/:projectId
 */
export const getActiveTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    // Get today's date in YYYY-MM-DD format (matching the schema)
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // "YYYY-MM-DD"

    // Find active task assignments for today or future dates
    const activeAssignments = await WorkerTaskAssignment.find({
      projectId: Number(projectId),
      date: { $gte: todayString }, // Compare strings instead of dates
      status: { $in: ['queued', 'in_progress'] }
    }).sort({ sequence: 1 });

    if (activeAssignments.length === 0) {
      return res.status(200).json({ 
        activeTasks: [],
        summary: {
          totalActive: 0,
          queued: 0,
          inProgress: 0
        }
      });
    }

    // Get task details and employee information
    const taskIds = [...new Set(activeAssignments.map(a => a.taskId))];
    const employeeIds = [...new Set(activeAssignments.map(a => a.employeeId))];

    const [tasks, employees] = await Promise.all([
      Task.find({ id: { $in: taskIds } }).lean(),
      Employee.find({ id: { $in: employeeIds } }).lean()
    ]);

    // Create lookup maps
    const taskMap = tasks.reduce((map, task) => {
      map[task.id] = task;
      return map;
    }, {});

    const employeeMap = employees.reduce((map, emp) => {
      map[emp.id] = emp;
      return map;
    }, {});

    // Build response with task and employee details
    const activeTasks = activeAssignments.map(assignment => {
      const task = taskMap[assignment.taskId];
      const employee = employeeMap[assignment.employeeId];

      return {
        assignmentId: assignment.id,
        taskId: assignment.taskId,
        taskName: task?.taskName || 'Unknown Task',
        taskDescription: task?.description || '',
        employeeId: assignment.employeeId,
        workerName: employee?.fullName || 'Unknown Worker',
        status: assignment.status,
        sequence: assignment.sequence,
        startTime: assignment.startTime,
        endTime: assignment.endTime,
        workArea: assignment.workArea,
        floor: assignment.floor,
        zone: assignment.zone,
        priority: assignment.priority || 'MEDIUM',
        timeEstimate: assignment.timeEstimate,
        dailyTarget: assignment.dailyTarget,
        createdAt: assignment.createdAt
      };
    });

    // Calculate summary statistics
    const summary = {
      totalActive: activeTasks.length,
      queued: activeTasks.filter(t => t.status === 'queued').length,
      inProgress: activeTasks.filter(t => t.status === 'in_progress').length
    };

    return res.status(200).json({
      activeTasks,
      summary
    });

  } catch (err) {
    console.error('Error fetching active tasks:', err);
    return res.status(500).json({ message: 'Error fetching active tasks' });
  }
};


/**
 * Get supervisor dashboard data with team overview and key metrics
 * @route GET /api/supervisor/dashboard
 */
export const getDashboardData = async (req, res) => {
  try {
    const { date } = req.query;
    const workDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = new Date();

    // Get userId from token
    const userId = req.user?.id || req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'User authentication required' 
      });
    }

    // Find supervisor by userId (same as approvals screen)
    const supervisor = await Employee.findOne({ userId }).lean();
    
    if (!supervisor) {
      return res.status(404).json({ 
        success: false,
        message: 'Supervisor not found' 
      });
    }

    const supervisorId = supervisor.id;

    console.log('📊 Dashboard - Supervisor Info:', {
      userId,
      supervisorId,
      supervisorName: supervisor.fullName
    });

    // Get supervisor's projects
    const projects = await Project.find({ supervisorId: supervisorId });
    
    if (projects.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          projects: [],
          teamOverview: {
            totalMembers: 0,
            presentToday: 0,
            absentToday: 0,
            lateToday: 0,
            onBreak: 0,
            overtimeWorkers: 0 // NEW: Include in empty state
          },
          taskMetrics: {
            totalTasks: 0,
            completedTasks: 0,
            inProgressTasks: 0,
            queuedTasks: 0,
            overdueTasks: 0
          },
          attendanceMetrics: {
            attendanceRate: 0,
            onTimeRate: 0,
            averageWorkingHours: 0
          },
          pendingApprovals: {
            leaveRequests: 0,
            materialRequests: 0,
            toolRequests: 0,
            urgent: 0,
            total: 0
          },
          alerts: [],
          recentActivity: [],
          workerAttendanceDetails: [], // NEW: Include in empty state
          summary: {
            totalProjects: 0,
            totalWorkers: 0,
            totalTasks: 0,
            overallProgress: 0,
            lastUpdated: currentTime.toISOString(),
            date: workDate
          }
        }
      });
    }

    const projectIds = projects.map(p => p.id);

    // Get all assignments for supervisor's projects for the date
    const assignments = await WorkerTaskAssignment.find({
      projectId: { $in: projectIds },
      date: workDate
    });

    const employeeIds = [...new Set(assignments.map(a => a.employeeId))];

    // Get employee information
    const employees = await Employee.find({
      id: { $in: employeeIds }
    }).lean();

    // For approval counts, we need ALL employees in supervisor's projects, not just those with tasks today
    // Try both possible employee-project link structures
    const allProjectEmployees = await Employee.find({
      $or: [
        { 'currentProject.id': { $in: projectIds } },
        { currentProjectId: { $in: projectIds } }
      ]
    }).lean();
    const allEmployeeIds = allProjectEmployees.map(e => e.id);
    
    console.log('📊 Dashboard Approval Query Debug:', {
      supervisorId,
      projectIds,
      projectCount: projects.length,
      allEmployeeCount: allProjectEmployees.length,
      allEmployeeIds: allEmployeeIds.slice(0, 10) // First 10 for debugging
    });

    // Get attendance records for the date
    const attendanceRecords = await Attendance.find({
      employeeId: { $in: employeeIds },
      projectId: { $in: projectIds },
      date: {
        $gte: new Date(workDate),
        $lt: new Date(new Date(workDate).setDate(new Date(workDate).getDate() + 1))
      }
    }).lean();

    // Get task details
    const taskIds = [...new Set(assignments.map(a => a.taskId))];
    const tasks = await Task.find({ id: { $in: taskIds } }).lean();

    // Process team overview metrics
    const teamOverview = {
      totalMembers: employees.length,
      presentToday: 0,
      absentToday: 0,
      lateToday: 0,
      onBreak: 0,
      overtimeWorkers: 0 // NEW: OT workers count
    };

    const WORK_START_HOUR = 8;
    const LATE_THRESHOLD_MINUTES = 15;
    const STANDARD_WORK_HOURS = 8;
    const OT_THRESHOLD_HOURS = 9; // Consider OT after 9 hours
    let totalWorkingHours = 0;
    let workersWithHours = 0;

    // NEW: Detailed worker attendance list
    const workerAttendanceDetails = [];

    for (const employee of employees) {
      const attendance = attendanceRecords.find(a => a.employeeId === employee.id);
      
      let workerDetail = {
        employeeId: employee.id,
        workerName: employee.fullName,
        role: employee.role,
        status: 'absent',
        morningCheckIn: null,
        morningCheckOut: null,
        afternoonCheckIn: null,
        afternoonCheckOut: null,
        totalHours: 0,
        overtimeHours: 0,
        isLate: false,
        minutesLate: 0,
        flags: []
      };

      if (attendance) {
        if (attendance.checkOut) {
          teamOverview.presentToday++;
          workerDetail.status = 'present';
          
          // Calculate working hours
          const checkInTime = new Date(attendance.checkIn);
          const checkOutTime = new Date(attendance.checkOut);
          const hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);
          totalWorkingHours += hoursWorked;
          workersWithHours++;
          workerDetail.totalHours = Math.round(hoursWorked * 100) / 100;

          // Check for overtime
          if (hoursWorked > OT_THRESHOLD_HOURS) {
            teamOverview.overtimeWorkers++;
            workerDetail.overtimeHours = Math.round((hoursWorked - STANDARD_WORK_HOURS) * 100) / 100;
          }

          // Morning session (assuming check-in is morning)
          workerDetail.morningCheckIn = attendance.checkIn;
          
          // Check if there's a lunch break recorded
          if (attendance.lunchStart && attendance.lunchEnd) {
            workerDetail.morningCheckOut = attendance.lunchStart;
            workerDetail.afternoonCheckIn = attendance.lunchEnd;
            workerDetail.afternoonCheckOut = attendance.checkOut;
          } else {
            // No lunch break recorded, assume full day
            workerDetail.afternoonCheckOut = attendance.checkOut;
          }

          // Flag: Early logout (before 5 PM)
          const checkOutHour = checkOutTime.getHours();
          if (checkOutHour < 17) {
            workerDetail.flags.push('early_logout');
          }

        } else if (attendance.checkIn) {
          teamOverview.presentToday++;
          workerDetail.status = 'checked_in';
          
          // Check if on break
          const checkInTime = new Date(attendance.checkIn);
          const hoursWorked = (currentTime - checkInTime) / (1000 * 60 * 60);
          totalWorkingHours += hoursWorked;
          workersWithHours++;
          workerDetail.totalHours = Math.round(hoursWorked * 100) / 100;

          workerDetail.morningCheckIn = attendance.checkIn;

          // Check if currently on lunch break
          if (attendance.lunchStart && !attendance.lunchEnd) {
            teamOverview.onBreak++;
            workerDetail.status = 'on_break';
            workerDetail.morningCheckOut = attendance.lunchStart;
          }
        }

        // Check if late
        if (attendance.checkIn) {
          const checkInTime = new Date(attendance.checkIn);
          const expectedStartTime = new Date(workDate);
          expectedStartTime.setHours(WORK_START_HOUR, 0, 0, 0);
          
          const minutesLate = Math.floor((checkInTime - expectedStartTime) / (1000 * 60));
          if (minutesLate > LATE_THRESHOLD_MINUTES) {
            teamOverview.lateToday++;
            workerDetail.isLate = true;
            workerDetail.minutesLate = minutesLate;
          }
        }

        // Flag: Invalid location (outside geofence at check-in)
        if (attendance.insideGeofenceAtCheckin === false) {
          workerDetail.flags.push('invalid_location');
        }

        // Flag: Missed punch (checked in but no checkout after work hours)
        if (attendance.checkIn && !attendance.checkOut && currentTime.getHours() >= 18) {
          workerDetail.flags.push('missed_punch');
        }

      } else {
        teamOverview.absentToday++;
        workerDetail.status = 'absent';
      }

      workerAttendanceDetails.push(workerDetail);
    }

    // Process task metrics
    const taskMetrics = {
      totalTasks: assignments.length,
      completedTasks: assignments.filter(a => a.status === 'completed').length,
      inProgressTasks: assignments.filter(a => a.status === 'in_progress').length,
      queuedTasks: assignments.filter(a => a.status === 'queued').length,
      overdueTasks: 0 // Could be calculated based on estimated completion times
    };

    // Calculate attendance metrics
    const attendanceMetrics = {
      attendanceRate: employees.length > 0 ? Math.round((teamOverview.presentToday / employees.length) * 100) : 0,
      onTimeRate: teamOverview.presentToday > 0 ? Math.round(((teamOverview.presentToday - teamOverview.lateToday) / teamOverview.presentToday) * 100) : 0,
      averageWorkingHours: workersWithHours > 0 ? Math.round((totalWorkingHours / workersWithHours) * 100) / 100 : 0
    };

    // Get recent geofence violations as alerts
    const recentViolations = await LocationLog.find({
      projectId: { $in: projectIds },
      insideGeofence: false,
      createdAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } // Last 2 hours
    }).sort({ createdAt: -1 }).limit(5);

    const alerts = recentViolations.map(violation => {
      const employee = employees.find(e => e.id === violation.employeeId);
      const project = projects.find(p => p.id === violation.projectId);
      
      return {
        id: violation.id,
        type: 'geofence_violation',
        title: 'Geofence Violation',
        message: `${employee?.fullName || 'Unknown Worker'} is outside project area`,
        projectName: project?.projectName || project?.name || 'Unknown Project',
        timestamp: violation.createdAt,
        severity: 'medium',
        priority: 'medium',
        workerId: violation.employeeId,
        workerName: employee?.fullName || 'Unknown Worker'
      };
    });

    // NEW: Add manpower shortfall alerts
    for (const project of projects) {
      const projectAssignments = assignments.filter(a => a.projectId === project.id);
      const projectAttendance = attendanceRecords.filter(a => a.projectId === project.id);
      
      const expectedWorkers = projectAssignments.length;
      const actualWorkers = projectAttendance.filter(a => a.checkIn).length;
      const shortfall = expectedWorkers - actualWorkers;

      // Alert if shortfall is more than 20% or more than 3 workers
      if (shortfall > 0 && (shortfall >= 3 || (expectedWorkers > 0 && (shortfall / expectedWorkers) > 0.2))) {
        alerts.push({
          id: `shortfall-${project.id}`,
          type: 'manpower_shortfall',
          title: 'Manpower Shortfall',
          message: `${shortfall} workers short of deployment plan at ${project.projectName || project.name}`,
          projectName: project.projectName || project.name,
          timestamp: currentTime.toISOString(),
          severity: shortfall >= 5 ? 'high' : 'medium',
          priority: shortfall >= 5 ? 'high' : 'medium',
          projectId: project.id,
          expectedWorkers,
          actualWorkers,
          shortfall
        });
      }
    }

    // Get pending approvals data (using same logic as approvals screen)
    const pendingApprovals = {
      leaveRequests: 0,
      materialRequests: 0,
      toolRequests: 0,
      urgent: 0,
      total: 0
    };

    try {
      // Debug: Log the query parameters
      console.log('🔍 Approval Count Query Parameters:', {
        allEmployeeIds,
        projectIds,
        employeeCount: allEmployeeIds.length,
        projectCount: projectIds.length
      });

      // Count pending requests using ALL employees in supervisor's projects (not just those with tasks today)
      const [leaveCount, advanceCount, materialCount, toolCount] = await Promise.all([
        // Pending leave requests from supervisor's workers
        LeaveRequest.countDocuments({ 
          employeeId: { $in: allEmployeeIds },
          status: 'PENDING' 
        }),
        
        // Pending advance payment requests from supervisor's workers
        PaymentRequest.countDocuments({ 
          employeeId: { $in: allEmployeeIds },
          status: 'PENDING' 
        }),
        
        // Pending material requests for supervisor's projects
        MaterialRequest.countDocuments({ 
          projectId: { $in: projectIds },
          requestType: 'MATERIAL',
          status: 'PENDING' 
        }),
        
        // Pending tool requests for supervisor's projects
        MaterialRequest.countDocuments({ 
          projectId: { $in: projectIds },
          requestType: 'TOOL',
          status: 'PENDING' 
        })
      ]);

      console.log('📊 Approval Counts:', {
        leaveCount,
        advanceCount,
        materialCount,
        toolCount,
        total: leaveCount + advanceCount + materialCount + toolCount
      });

      // Debug: Fetch actual tool requests to see what's being counted
      const actualToolRequests = await MaterialRequest.find({ 
        projectId: { $in: projectIds },
        requestType: 'TOOL',
        status: 'PENDING' 
      }).lean();
      
      console.log('🔧 Actual Tool Requests Found:', actualToolRequests.map(r => ({
        id: r.id,
        projectId: r.projectId,
        itemName: r.itemName,
        status: r.status
      })));

      pendingApprovals.leaveRequests = leaveCount + advanceCount;
      pendingApprovals.materialRequests = materialCount;
      pendingApprovals.toolRequests = toolCount;

      // Count urgent requests (older than 24 hours)
      const urgentThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const [urgentLeave, urgentAdvance, urgentMaterial, urgentTool] = await Promise.all([
        LeaveRequest.countDocuments({ 
          employeeId: { $in: allEmployeeIds },
          status: 'PENDING',
          requestedAt: { $lt: urgentThreshold }
        }),
        
        PaymentRequest.countDocuments({ 
          employeeId: { $in: allEmployeeIds },
          status: 'PENDING',
          createdAt: { $lt: urgentThreshold }
        }),
        
        MaterialRequest.countDocuments({ 
          projectId: { $in: projectIds },
          requestType: 'MATERIAL',
          status: 'PENDING',
          createdAt: { $lt: urgentThreshold }
        }),
        
        MaterialRequest.countDocuments({ 
          projectId: { $in: projectIds },
          requestType: 'TOOL',
          status: 'PENDING',
          createdAt: { $lt: urgentThreshold }
        })
      ]);

      pendingApprovals.urgent = urgentLeave + urgentAdvance + urgentMaterial + urgentTool;
      pendingApprovals.total = pendingApprovals.leaveRequests + pendingApprovals.materialRequests + pendingApprovals.toolRequests;

    } catch (approvalError) {
      console.error('Error fetching pending approvals:', approvalError);
      // Continue with default values
    }

    // Get recent activity (recent task assignments and completions)
    const recentActivity = assignments
      .filter(a => a.createdAt >= new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(assignment => {
        const employee = employees.find(e => e.id === assignment.employeeId);
        const task = tasks.find(t => t.id === assignment.taskId);
        const project = projects.find(p => p.id === assignment.projectId);

        return {
          id: assignment.id,
          type: assignment.status === 'completed' ? 'task_completed' : 'task_assigned',
          title: assignment.status === 'completed' ? 'Task Completed' : 'Task Assigned',
          message: `${task?.taskName || 'Unknown Task'} - ${employee?.fullName || 'Unknown Worker'}`,
          projectName: project?.projectName || project?.name || 'Unknown Project',
          timestamp: assignment.completedAt || assignment.createdAt,
          workerId: assignment.employeeId,
          workerName: employee?.fullName || 'Unknown Worker',
          taskId: assignment.taskId,
          taskName: task?.taskName || 'Unknown Task'
        };
      });

    // Prepare project summary with enhanced details
    const projectSummary = projects.map(project => {
      const projectAssignments = assignments.filter(a => a.projectId === project.id);
      const projectEmployees = employees.filter(emp => 
        projectAssignments.some(a => a.employeeId === emp.id)
      );
      const projectAttendance = attendanceRecords.filter(a => a.projectId === project.id);

      // Calculate attendance breakdown
      const presentCount = projectAttendance.filter(a => a.checkIn).length;
      const absentCount = projectEmployees.length - projectAttendance.length;
      const lateCount = projectAttendance.filter(a => {
        if (!a.checkIn) return false;
        const checkInTime = new Date(a.checkIn);
        const expectedStartTime = new Date(workDate);
        expectedStartTime.setHours(WORK_START_HOUR, 0, 0, 0);
        const minutesLate = Math.floor((checkInTime - expectedStartTime) / (1000 * 60));
        return minutesLate > LATE_THRESHOLD_MINUTES;
      }).length;

      // NEW: Determine project status based on progress and timeline
      let projectStatus = 'Ongoing';
      const completionRate = projectAssignments.length > 0 
        ? (projectAssignments.filter(a => a.status === 'completed').length / projectAssignments.length) * 100
        : 0;
      
      if (completionRate >= 80) {
        projectStatus = 'Near Completion';
      } else if (project.status === 'DELAYED' || absentCount > projectEmployees.length * 0.3) {
        projectStatus = 'Delayed';
      }

      return {
        id: project.id,
        name: project.projectName || project.name,
        location: project.location || project.address || 'Location not specified', // NEW: Site location
        client: project.clientName || project.client || 'Client not specified', // NEW: Client name
        status: projectStatus, // NEW: Project status
        totalWorkers: projectEmployees.length,
        presentWorkers: presentCount,
        totalTasks: projectAssignments.length,
        completedTasks: projectAssignments.filter(a => a.status === 'completed').length,
        inProgressTasks: projectAssignments.filter(a => a.status === 'in_progress').length,
        // Add attendance summary for frontend compatibility
        attendanceSummary: {
          total: projectEmployees.length,
          present: presentCount,
          absent: absentCount,
          late: lateCount
        },
        // Add workforce count for compatibility
        workforceCount: projectEmployees.length,
        // Add progress summary for compatibility
        progressSummary: {
          overallProgress: Math.round(completionRate),
          totalTasks: projectAssignments.length,
          completedTasks: projectAssignments.filter(a => a.status === 'completed').length,
          inProgressTasks: projectAssignments.filter(a => a.status === 'in_progress').length,
          queuedTasks: projectAssignments.filter(a => a.status === 'queued').length,
          dailyTarget: Math.max(1, Math.ceil(projectAssignments.length / 5)) // Default: 20% of total tasks per day
        }
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        projects: projectSummary,
        teamOverview,
        taskMetrics,
        attendanceMetrics,
        pendingApprovals,
        alerts,
        recentActivity,
        workerAttendanceDetails, // NEW: Detailed worker attendance list
        summary: {
          totalProjects: projects.length,
          totalWorkers: employees.length,
          totalTasks: assignments.length,
          overallProgress: taskMetrics.totalTasks > 0 ? Math.round((taskMetrics.completedTasks / taskMetrics.totalTasks) * 100) : 0,
          lastUpdated: currentTime.toISOString(),
          date: workDate
        }
      }
    });

  } catch (err) {
    console.error('Error fetching supervisor dashboard data:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Error fetching dashboard data',
      error: err.message 
    });
  }
};


/* ========================================
   PROFILE MANAGEMENT APIs
======================================== */

import User from '../user/User.js';
import Company from '../company/Company.js';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * GET /api/supervisor/profile
 * Get supervisor profile information
 */
export const getSupervisorProfile = async (req, res) => {
  try {
    const { userId, companyId, role } = req.user || {};

    if (!userId || !companyId) {
      return res.status(400).json({
        success: false,
        message: "Invalid user or company information.",
      });
    }

    // Fetch employee details
    const employee = await Employee.findOne({ 
      userId: userId, 
      companyId: companyId,
      status: 'ACTIVE'
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Supervisor details not found",
      });
    }

    // Fetch all data in parallel for better performance
    const today = new Date().toISOString().split('T')[0];
    
    const [company, user, assignedProjects, projectIds] = await Promise.all([
      Company.findOne({ id: companyId }),
      User.findOne({ id: userId }),
      Project.find({ 
        supervisorId: employee.id,
        status: { $in: ['ACTIVE', 'IN_PROGRESS'] }
      }).select('id name code location status'),
      // Get project IDs for team size calculation
      Project.find({ 
        supervisorId: employee.id,
        status: { $in: ['ACTIVE', 'IN_PROGRESS'] }
      }).select('id').then(projects => projects.map(p => p.id))
    ]);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: `Company with ID ${companyId} not found`,
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User details not found",
      });
    }

    // Get team size (count of workers assigned to supervisor's projects)
    const teamSize = projectIds.length > 0 
      ? await WorkerTaskAssignment.distinct('employeeId', {
          projectId: { $in: projectIds },
          date: today
        }).then(ids => ids.length)
      : 0;

    // Construct photo URL
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:5002';
    const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;
    const photoUrl = employee.photoUrl || employee.photo_url;
    
    let fullPhotoUrl = null;
    if (photoUrl) {
      if (photoUrl.startsWith('http')) {
        fullPhotoUrl = photoUrl;
      } else if (photoUrl.startsWith('/uploads')) {
        fullPhotoUrl = `${baseUrl}${photoUrl}`;
      } else {
        fullPhotoUrl = `${baseUrl}/uploads/supervisors/${photoUrl}`;
      }
    }

    // Build profile response
    const profile = {
      employeeId: employee.id,
      name: employee.fullName,
      email: user.email,
      phoneNumber: employee.phone || "N/A",
      companyName: company.name,
      role: role || 'supervisor',
      photoUrl: fullPhotoUrl,
      employeeCode: employee.employeeCode || null,
      jobTitle: employee.jobTitle || "Supervisor",
      department: employee.department || "Construction",
      status: employee.status || "ACTIVE",
      assignedProjects: assignedProjects.map(p => ({
        id: p.id,
        name: p.name,
        code: p.code,
        location: p.location,
        status: p.status
      })),
      teamSize: teamSize,
      currentProject: employee.currentProject || null,
      createdAt: employee.createdAt || user.createdAt,
      updatedAt: employee.updatedAt || employee.createdAt || user.updatedAt,
    };

    console.log("✅ Supervisor profile retrieved:", {
      userId,
      companyId,
      employeeId: employee.id,
      projectsCount: assignedProjects.length,
      teamSize,
      hasPhoto: !!fullPhotoUrl
    });

    return res.json({ 
      success: true,
      data: profile  // Wrap profile in 'data' property to match API response format
    });

  } catch (err) {
    console.error("❌ Error fetching supervisor profile:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching supervisor profile",
      error: err.message,
    });
  }
};

/**
 * PUT /api/supervisor/profile
 * Update supervisor profile information
 */
export const updateSupervisorProfile = async (req, res) => {
  try {
    const { userId, companyId } = req.user || {};
    const { phoneNumber, emergencyContact, preferences } = req.body;

    if (!userId || !companyId) {
      return res.status(400).json({
        success: false,
        message: "Invalid user or company information.",
      });
    }

    // Fetch employee
    const employee = await Employee.findOne({ 
      userId: userId, 
      companyId: companyId 
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Supervisor not found",
      });
    }

    // Update fields
    const updateData = {};
    
    if (phoneNumber !== undefined) {
      updateData.phone = phoneNumber;
    }

    if (emergencyContact !== undefined) {
      updateData.emergencyContact = emergencyContact;
    }

    if (preferences !== undefined) {
      updateData.preferences = preferences;
    }

    // Update employee record
    const updatedEmployee = await Employee.findOneAndUpdate(
      { userId: userId, companyId: companyId },
      { $set: updateData },
      { new: true }
    );

    console.log("✅ Supervisor profile updated:", {
      userId,
      companyId,
      employeeId: employee.id,
      updatedFields: Object.keys(updateData)
    });

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        employeeId: updatedEmployee.id,
        name: updatedEmployee.fullName,
        phoneNumber: updatedEmployee.phone,
        emergencyContact: updatedEmployee.emergencyContact,
        preferences: updatedEmployee.preferences,
        updatedAt: updatedEmployee.updatedAt || new Date()
      }
    });

  } catch (err) {
    console.error("❌ Error updating supervisor profile:", err);
    res.status(500).json({
      success: false,
      message: "Server error while updating supervisor profile",
      error: err.message,
    });
  }
};

/**
 * PUT /api/supervisor/profile/password
 * Change supervisor password
 */
export const changeSupervisorPassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    // Fetch user
    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    user.passwordHash = newPasswordHash;
    await user.save();

    console.log("✅ Supervisor password changed:", { userId });

    return res.json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (err) {
    console.error("❌ Error changing supervisor password:", err);
    res.status(500).json({
      success: false,
      message: "Server error while changing password",
      error: err.message,
    });
  }
};

/**
 * Multer Configuration for Supervisor Photo Upload
 */
const supervisorStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/supervisors/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const userId = req.user?.userId || "unknown";
    cb(null, `supervisor-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const supervisorFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

export const supervisorUpload = multer({
  storage: supervisorStorage,
  fileFilter: supervisorFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

/**
 * POST /api/supervisor/profile/photo
 * Upload supervisor profile photo
 */
export const uploadSupervisorPhoto = async (req, res) => {
  try {
    const { userId, companyId } = req.user || {};

    if (!userId || !companyId) {
      return res.status(400).json({
        success: false,
        message: "Invalid user or company information",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No photo file uploaded",
      });
    }

    // Fetch employee
    const employee = await Employee.findOne({ 
      userId: userId, 
      companyId: companyId 
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Supervisor not found",
      });
    }

    // Delete old photo if exists
    if (employee.photoUrl) {
      const oldPhotoPath = path.join(__dirname, '../../../', employee.photoUrl);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
        console.log("🗑️ Old photo deleted:", oldPhotoPath);
      }
    }

    // Update employee with new photo path
    const photoPath = `/uploads/supervisors/${req.file.filename}`;
    employee.photoUrl = photoPath;
    await employee.save();

    // Construct full photo URL
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:5002';
    const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;
    const fullPhotoUrl = `${baseUrl}${photoPath}`;

    console.log("✅ Supervisor photo uploaded:", {
      userId,
      companyId,
      employeeId: employee.id,
      photoPath,
      fullPhotoUrl
    });

    return res.json({
      success: true,
      message: "Profile photo uploaded successfully",
      photoUrl: fullPhotoUrl,
    });

  } catch (err) {
    console.error("❌ Error uploading supervisor photo:", err);
    res.status(500).json({
      success: false,
      message: "Server error while uploading photo",
      error: err.message,
    });
  }
};

/**
 * GET /api/supervisor/pending-approvals
 * Get summary of all pending approvals for supervisor's dashboard
 * Returns counts of pending leave, advance, material, and tool requests
 */
export const getPendingApprovalsSummary = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    
    console.log('🔍 Approvals Screen - User Info:', {
      userId,
      userFromToken: req.user
    });
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'User authentication required' 
      });
    }

    // Find supervisor by userId
    const supervisor = await Employee.findOne({ userId }).lean();
    
    console.log('🔍 Approvals Screen - Supervisor Found:', {
      supervisorId: supervisor?.id,
      supervisorName: supervisor?.fullName,
      userId: supervisor?.userId
    });
    
    if (!supervisor) {
      return res.status(404).json({ 
        success: false,
        message: 'Supervisor not found' 
      });
    }

    // Get all projects assigned to this supervisor
    const projects = await Project.find({ supervisorId: supervisor.id }).lean();
    
    if (!projects || projects.length === 0) {
      return res.json({
        success: true,
        data: {
          approvals: [], // Empty array when no projects
          summary: {
            totalPending: 0,
            urgentCount: 0,
            overdueCount: 0,
            byType: {
              leave: 0,
              material: 0,
              tool: 0,
              reimbursement: 0,
              advance_payment: 0
            }
          },
          pagination: {
            total: 0,
            limit: 50,
            offset: 0,
            hasMore: false
          }
        }
      });
    }

    const projectIds = projects.map(p => p.id);

    // Get all employees assigned to supervisor's projects
    // Use same query pattern as dashboard for consistency
    const employees = await Employee.find({ 
      $or: [
        { 'currentProject.id': { $in: projectIds } },
        { currentProjectId: { $in: projectIds } }
      ]
    }).lean();
    
    // Filter employeeIds to only include numeric values (exclude ObjectId strings)
    const allEmployeeIds = employees.map(e => e.id);
    const employeeIds = allEmployeeIds.filter(id => {
      // Only include numeric IDs, exclude ObjectId strings
      return typeof id === 'number' && !isNaN(id);
    });
    
    console.log('🔍 Employee ID Types Debug:', {
      totalEmployees: employees.length,
      allEmployeeIds: allEmployeeIds.slice(0, 5), // Show first 5 for debugging
      numericEmployeeIds: employeeIds.slice(0, 5), // Show first 5 numeric IDs
      filteredCount: employeeIds.length,
      excludedCount: allEmployeeIds.length - employeeIds.length,
      excludedIds: allEmployeeIds.filter(id => typeof id !== 'number' || isNaN(id)).slice(0, 3) // Show first 3 excluded IDs
    });

    console.log('🔍 Approvals Screen Debug:', {
      supervisorId: supervisor.id,
      supervisorName: supervisor.fullName,
      userId: userId,
      projectIds,
      employeeCount: employees.length,
      employeeIds
    });

    // Count pending requests in parallel for better performance
    console.log('📊 Counting pending requests with employeeIds:', employeeIds);
    
    const [leaveCount, advanceCount, materialCount, toolCount] = await Promise.all([
      // Pending leave requests from supervisor's workers
      LeaveRequest.countDocuments({ 
        employeeId: { $in: employeeIds },
        status: 'PENDING' 
      }),
      
      // Pending advance payment requests from supervisor's workers
      PaymentRequest.countDocuments({ 
        employeeId: { $in: employeeIds },
        status: 'PENDING' 
      }),
      
      // Pending material requests for supervisor's projects
      MaterialRequest.countDocuments({ 
        projectId: { $in: projectIds },
        requestType: 'MATERIAL',
        status: 'PENDING' 
      }),
      
      // Pending tool requests for supervisor's projects
      MaterialRequest.countDocuments({ 
        projectId: { $in: projectIds },
        requestType: 'TOOL',
        status: 'PENDING' 
      })
    ]);

    // Count urgent requests (older than 24 hours)
    const urgentThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const [urgentLeave, urgentAdvance, urgentMaterial, urgentTool] = await Promise.all([
      LeaveRequest.countDocuments({ 
        employeeId: { $in: employeeIds },
        status: 'PENDING',
        requestedAt: { $lt: urgentThreshold }
      }),
      
      PaymentRequest.countDocuments({ 
        employeeId: { $in: employeeIds },
        status: 'PENDING',
        createdAt: { $lt: urgentThreshold }
      }),
      
      MaterialRequest.countDocuments({ 
        projectId: { $in: projectIds },
        requestType: 'MATERIAL',
        status: 'PENDING',
        createdAt: { $lt: urgentThreshold }
      }),
      
      MaterialRequest.countDocuments({ 
        projectId: { $in: projectIds },
        requestType: 'TOOL',
        status: 'PENDING',
        createdAt: { $lt: urgentThreshold }
      })
    ]);

    const urgentCount = urgentLeave + urgentAdvance + urgentMaterial + urgentTool;
    const totalCount = leaveCount + advanceCount + materialCount + toolCount;

    // Fetch actual approval data with pagination
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    // Fetch all pending requests in parallel
    const [leaveRequests, paymentRequests, materialRequests, toolRequests] = await Promise.all([
      LeaveRequest.find({ 
        employeeId: { $in: employeeIds },
        status: 'PENDING' 
      }).sort({ requestedAt: -1 }).lean(),
      
      PaymentRequest.find({ 
        employeeId: { $in: employeeIds },
        status: 'PENDING' 
      }).sort({ createdAt: -1 }).lean(),
      
      MaterialRequest.find({ 
        projectId: { $in: projectIds },
        requestType: 'MATERIAL',
        status: 'PENDING' 
      }).sort({ createdAt: -1 }).lean(),
      
      MaterialRequest.find({ 
        projectId: { $in: projectIds },
        requestType: 'TOOL',
        status: 'PENDING' 
      }).sort({ createdAt: -1 }).lean()
    ]);

    // Create employee map for quick lookup
    const employeeMap = employees.reduce((map, emp) => {
      map[emp.id] = emp;
      return map;
    }, {});

    // Create project map for quick lookup
    const projectMap = projects.reduce((map, proj) => {
      map[proj.id] = proj;
      return map;
    }, {});

    // Format approvals for mobile app
    const allApprovals = [];

    // Add leave requests
    leaveRequests.forEach(req => {
      const employee = employeeMap[req.employeeId];
      allApprovals.push({
        id: req.id,
        requestType: 'leave',
        requesterName: employee?.fullName || 'Unknown',
        requesterId: req.employeeId,
        requestDate: req.requestedAt || req.createdAt,
        status: 'pending',
        urgency: (new Date() - new Date(req.requestedAt || req.createdAt)) > 24 * 60 * 60 * 1000 ? 'urgent' : 'normal',
        details: {
          leaveType: req.leaveType,
          fromDate: req.fromDate,
          toDate: req.toDate,
          totalDays: req.totalDays,
          reason: req.reason
        }
      });
    });

    // Add payment requests
    paymentRequests.forEach(req => {
      const employee = employeeMap[req.employeeId];
      allApprovals.push({
        id: req.id,
        requestType: 'advance_payment',
        requesterName: employee?.fullName || 'Unknown',
        requesterId: req.employeeId,
        requestDate: req.createdAt,
        status: 'pending',
        urgency: req.urgency?.toLowerCase() || 'normal',
        details: {
          amount: req.amount,
          currency: req.currency || 'SGD',
          reason: req.reason,
          description: req.description
        }
      });
    });

    // Add material requests
    materialRequests.forEach(req => {
      const employee = employeeMap[req.employeeId];
      const project = projectMap[req.projectId];
      allApprovals.push({
        id: req.id,
        requestType: 'material',
        requesterName: employee?.fullName || 'Unknown',
        requesterId: req.employeeId,
        requestDate: req.createdAt,
        status: 'pending',
        urgency: req.urgency?.toLowerCase() || 'normal',
        details: {
          itemName: req.itemName,
          itemCategory: req.itemCategory,
          quantity: req.quantity,
          unit: req.unit,
          requiredDate: req.requiredDate,
          purpose: req.purpose,
          projectName: project?.name || 'Unknown Project',
          projectId: req.projectId
        }
      });
    });

    // Add tool requests
    toolRequests.forEach(req => {
      const employee = employeeMap[req.employeeId];
      const project = projectMap[req.projectId];
      allApprovals.push({
        id: req.id,
        requestType: 'tool',
        requesterName: employee?.fullName || 'Unknown',
        requesterId: req.employeeId,
        requestDate: req.createdAt,
        status: 'pending',
        urgency: req.urgency?.toLowerCase() || 'normal',
        details: {
          itemName: req.itemName,
          itemCategory: req.itemCategory,
          quantity: req.quantity,
          unit: req.unit,
          requiredDate: req.requiredDate,
          purpose: req.purpose,
          projectName: project?.name || 'Unknown Project',
          projectId: req.projectId
        }
      });
    });

    // Sort by date (most recent first)
    allApprovals.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

    // Apply pagination
    const paginatedApprovals = allApprovals.slice(offset, offset + limit);

    console.log('✅ Pending approvals summary:', {
      supervisorId: supervisor.id,
      userId: userId,
      projectCount: projects.length,
      workerCount: employees.length,
      leaveRequests: leaveCount,
      advanceRequests: advanceCount,
      materialRequests: materialCount,
      toolRequests: toolCount,
      urgent: urgentCount,
      total: totalCount,
      returnedApprovals: paginatedApprovals.length
    });

    return res.json({
      success: true,
      data: {
        approvals: paginatedApprovals,
        summary: {
          totalPending: totalCount,
          urgentCount: urgentCount,
          overdueCount: 0,
          byType: {
            leave: leaveCount,
            material: materialCount,
            tool: toolCount,
            reimbursement: 0,
            advance_payment: advanceCount
          }
        },
        pagination: {
          total: allApprovals.length,
          limit: limit,
          offset: offset,
          hasMore: offset + limit < allApprovals.length
        }
      }
    });

  } catch (err) {
    console.error('❌ Error getting pending approvals summary:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Server error while fetching pending approvals',
      error: err.message 
    });
  }
};


/**
 * Get pending attendance corrections for supervisor review
 * @route GET /api/supervisor/pending-attendance-corrections
 */
export const getPendingAttendanceCorrections = async (req, res) => {
  try {
    const { projectId, status = 'pending' } = req.query;
    const supervisorId = req.user?.userId || req.user?.id;

    // Build query
    let query = { status };
    
    if (projectId && projectId !== 'all') {
      query.projectId = Number(projectId);
    }

    // Fetch pending corrections
    const corrections = await AttendanceCorrection.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with employee details
    const employeeIds = [...new Set(corrections.map(c => c.employeeId))];
    const employees = await Employee.find({ id: { $in: employeeIds } }).lean();
    const employeeMap = employees.reduce((map, emp) => {
      map[emp.id] = emp;
      return map;
    }, {});

    // Format response
    const formattedCorrections = corrections.map(correction => {
      const employee = employeeMap[correction.employeeId];
      return {
        correctionId: correction.correctionId,
        workerId: correction.employeeId,
        workerName: employee?.fullName || 'Unknown',
        requestType: correction.requestType,
        originalTime: correction.originalTime,
        requestedTime: correction.requestedTime,
        reason: correction.reason,
        requestedAt: correction.createdAt,
        status: correction.status,
        reviewedBy: correction.reviewedBy,
        reviewNotes: correction.reviewNotes,
        reviewedAt: correction.reviewedAt
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedCorrections,
      count: formattedCorrections.length
    });

  } catch (err) {
    console.error('Error fetching pending attendance corrections:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pending attendance corrections',
      error: err.message
    });
  }
};

/**
 * Approve or reject attendance correction
 * @route POST /api/supervisor/attendance-correction/:correctionId/review
 */
export const reviewAttendanceCorrection = async (req, res) => {
  try {
    const { correctionId } = req.params;
    const { action, notes } = req.body;
    const supervisorId = req.user?.userId || req.user?.id;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "approve" or "reject"'
      });
    }

    // Find the correction
    const correction = await AttendanceCorrection.findOne({ 
      correctionId: Number(correctionId) 
    });

    if (!correction) {
      return res.status(404).json({
        success: false,
        message: 'Attendance correction not found'
      });
    }

    if (correction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This correction has already been reviewed'
      });
    }

    // Update correction status
    correction.status = action === 'approve' ? 'approved' : 'rejected';
    correction.reviewedBy = supervisorId;
    correction.reviewNotes = notes || '';
    correction.reviewedAt = new Date();
    await correction.save();

    // If approved, update the attendance record
    if (action === 'approve' && correction.attendanceId) {
      const attendance = await Attendance.findById(correction.attendanceId);
      
      if (attendance) {
        // Update the appropriate time field based on request type
        switch (correction.requestType) {
          case 'check_in':
            attendance.checkIn = correction.requestedTime;
            break;
          case 'check_out':
            attendance.checkOut = correction.requestedTime;
            break;
          case 'lunch_start':
            attendance.lunchStart = correction.requestedTime;
            break;
          case 'lunch_end':
            attendance.lunchEnd = correction.requestedTime;
            break;
        }

        // Add to manual overrides array
        if (!attendance.manualOverrides) {
          attendance.manualOverrides = [];
        }
        attendance.manualOverrides.push({
          type: correction.requestType,
          originalTime: correction.originalTime,
          correctedTime: correction.requestedTime,
          reason: correction.reason,
          approvedBy: supervisorId,
          approvedAt: new Date()
        });

        await attendance.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: `Attendance correction ${action}d successfully`,
      data: {
        correctionId: correction.correctionId,
        status: correction.status,
        reviewedAt: correction.reviewedAt
      }
    });

  } catch (err) {
    console.error('Error reviewing attendance correction:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to review attendance correction',
      error: err.message
    });
  }
};

/**
 * Get task assignments with filtering
 * GET /api/supervisor/task-assignments
 */
export const getTaskAssignments = async (req, res) => {
  try {
    const { projectId, status, priority, workerId, limit = 50, offset = 0 } = req.query;

    // Build query - ONLY show assignments with valid taskId (not null)
    const query = {
      taskId: { $ne: null, $exists: true }
    };
    if (projectId) query.projectId = parseInt(projectId);
    if (workerId) query.employeeId = parseInt(workerId);
    if (status) query.status = status;

    // Get assignments from database
    const assignments = await WorkerTaskAssignment.find(query)
      .sort({ date: -1, sequence: 1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    // Get unique task IDs and employee IDs
    const taskIds = [...new Set(assignments.map(a => a.taskId).filter(Boolean))];
    const employeeIds = [...new Set(assignments.map(a => a.employeeId).filter(Boolean))];

    // Fetch tasks and employees in parallel
    const [tasks, employees] = await Promise.all([
      Task.find({ id: { $in: taskIds } }).lean(),
      Employee.find({ id: { $in: employeeIds } }).lean()
    ]);

    // Create lookup maps for quick access
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const employeeMap = new Map(employees.map(e => [e.id, e]));

    // Transform to match mobile app expectations
    const transformedAssignments = assignments.map(assignment => {
      const task = taskMap.get(assignment.taskId);
      const employee = employeeMap.get(assignment.employeeId);

      return {
        assignmentId: assignment.id, // Use numeric id, not MongoDB _id
        taskId: assignment.taskId,
        taskName: task?.taskName || `Task ${assignment.taskId}`, // Show task ID if name not found
        workerId: assignment.employeeId,
        workerName: employee?.fullName || 'Unknown Worker',
        status: assignment.status || 'queued',
        priority: assignment.priority || 'medium',
        progress: assignment.progress || 0,
        assignedAt: assignment.date || assignment.createdAt,
        startedAt: assignment.startTime || null,
        completedAt: assignment.completedAt || null,
        estimatedHours: task?.estimatedHours || 8,
        actualHours: assignment.actualHours || null,
        dependencies: assignment.dependencies || [],
        canStart: assignment.canStart !== false,
        instructions: assignment.instructions || ''
      };
    });

    // Calculate summary
    const summary = {
      totalAssignments: transformedAssignments.length,
      pending: transformedAssignments.filter(a => a.status === 'queued').length,
      inProgress: transformedAssignments.filter(a => a.status === 'in_progress').length,
      completed: transformedAssignments.filter(a => a.status === 'completed').length,
      cancelled: transformedAssignments.filter(a => a.status === 'cancelled').length
    };

    // Get total count for pagination
    const total = await WorkerTaskAssignment.countDocuments(query);

    res.json({
      success: true,
      data: {
        assignments: transformedAssignments,
        summary,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > (parseInt(offset) + transformedAssignments.length)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching task assignments:', error);
    res.status(500).json({
      success: false,
      errors: ['Failed to fetch task assignments']
    });
  }
};

/**
 * Reassign task to a different worker
 * POST /api/supervisor/task-assignments/:assignmentId/reassign
 */
export const reassignTask = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { newWorkerId, reason, priority, instructions } = req.body;

    // Find the assignment
    const assignment = await WorkerTaskAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        errors: ['Task assignment not found']
      });
    }

    // Update assignment
    assignment.employeeId = newWorkerId;
    assignment.priority = priority || assignment.priority;
    assignment.instructions = instructions || assignment.instructions;
    assignment.reassignmentReason = reason;
    assignment.reassignedAt = new Date();
    
    await assignment.save();

    res.json({
      success: true,
      data: {
        assignmentId: assignment._id,
        newWorkerId,
        reassignedAt: assignment.reassignedAt,
        message: 'Task reassigned successfully'
      }
    });
  } catch (error) {
    console.error('Error reassigning task:', error);
    res.status(500).json({
      success: false,
      errors: ['Failed to reassign task']
    });
  }
};

/**
 * Update task priority
 * PUT /api/supervisor/task-assignments/:assignmentId/priority
 */
export const updateTaskPriority = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { priority, instructions, estimatedHours } = req.body;

    console.log('updateTaskPriority called with:', { 
      assignmentId, 
      priority, 
      instructions, 
      estimatedHours,
      body: req.body 
    });

    // Validate required fields
    if (!priority) {
      console.log('Missing priority in request body');
      return res.status(400).json({
        success: false,
        errors: ['Priority is required']
      });
    }

    // Map priority values from mobile app to database enum
    // Mobile: 'low', 'normal', 'high', 'urgent'
    // Database: 'low', 'medium', 'high', 'critical'
    const priorityMap = {
      'low': 'low',
      'normal': 'medium',
      'medium': 'medium',
      'high': 'high',
      'urgent': 'critical',
      'critical': 'critical'
    };
    
    const mappedPriority = priorityMap[priority.toLowerCase()];
    
    if (!mappedPriority) {
      console.log('Invalid priority value:', priority);
      return res.status(400).json({
        success: false,
        errors: [`Priority must be one of: low, normal, medium, high, urgent, critical`]
      });
    }

    // Find and update the assignment
    const assignment = await WorkerTaskAssignment.findById(assignmentId);
    
    if (!assignment) {
      console.log('Assignment not found for ID:', assignmentId);
      return res.status(404).json({
        success: false,
        errors: ['Task assignment not found']
      });
    }

    console.log('Found assignment:', { 
      id: assignment._id, 
      currentPriority: assignment.priority,
      status: assignment.status 
    });

    // Update fields with mapped priority
    assignment.priority = mappedPriority;
    if (instructions !== undefined) assignment.instructions = instructions;
    if (estimatedHours !== undefined) assignment.estimatedHours = estimatedHours;
    assignment.updatedAt = new Date();
    
    await assignment.save();

    console.log('Assignment updated successfully:', {
      newPriority: assignment.priority,
      instructions: assignment.instructions,
      estimatedHours: assignment.estimatedHours
    });

    res.json({
      success: true,
      data: {
        assignmentId: assignment._id,
        priority: assignment.priority,
        instructions: assignment.instructions,
        estimatedHours: assignment.estimatedHours,
        updatedAt: assignment.updatedAt,
        message: 'Task priority updated successfully'
      }
    });
  } catch (error) {
    console.error('Error updating task priority:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      errors: ['Failed to update task priority']
    });
  }
};

/**
 * Create and assign a new task to a worker
 * POST /api/supervisor/create-and-assign-task
 */
export const createAndAssignTask = async (req, res) => {
  try {
    const {
      taskName,
      description,
      employeeId,
      projectId,
      priority = 'medium', // Changed default to 'medium'
      estimatedHours = 8,
      instructions = '',
      date
    } = req.body;

    // Validate required fields
    if (!taskName || !employeeId || !projectId) {
      return res.status(400).json({
        success: false,
        errors: ['Task name, employee, and project are required']
      });
    }

    // Map priority values from mobile app to database enum
    // Mobile: 'low', 'normal', 'high', 'urgent'
    // Database: 'low', 'medium', 'high', 'critical'
    const priorityMap = {
      'low': 'low',
      'normal': 'medium',
      'medium': 'medium',
      'high': 'high',
      'urgent': 'critical',
      'critical': 'critical'
    };
    const mappedPriority = priorityMap[priority.toLowerCase()] || 'medium';

    // Use current date if not provided
    const assignmentDate = date || new Date().toISOString().split('T')[0];

    // 1. Get companyId from project
    const project = await Project.findOne({ id: Number(projectId) });
    if (!project) {
      return res.status(404).json({
        success: false,
        errors: ['Project not found']
      });
    }

    // 2. Create the task first
    const lastTask = await Task.findOne().sort({ id: -1 });
    const newTaskId = lastTask ? lastTask.id + 1 : 1;

    const newTask = await Task.create({
      id: newTaskId,
      companyId: project.companyId || 1,
      projectId: Number(projectId),
      taskType: 'WORK', // Default to WORK type for supervisor-created tasks
      taskName,
      description: description || taskName,
      status: 'PLANNED', // Use valid enum value
      assignedBy: req.user?.userId || req.user?.id || 1,
      createdBy: req.user?.userId || req.user?.id || 1,
      startDate: new Date(assignmentDate),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Task created:', newTask.id, newTask.taskName);

    // 3. Find last sequence for the day
    const lastAssignment = await WorkerTaskAssignment
      .findOne({ 
        employeeId: Number(employeeId), 
        projectId: Number(projectId), 
        date: assignmentDate,
        sequence: { $exists: true, $ne: null, $type: "number" }
      })
      .sort({ sequence: -1 });

    const sequence = (lastAssignment && typeof lastAssignment.sequence === 'number' && !isNaN(lastAssignment.sequence)) 
      ? lastAssignment.sequence + 1 
      : 1;

    // 4. Generate assignment ID
    const lastAssignmentId = await WorkerTaskAssignment.findOne().sort({ id: -1 });
    const newAssignmentId = lastAssignmentId ? lastAssignmentId.id + 1 : 1;

    // 5. Create the assignment
    const assignment = await WorkerTaskAssignment.create({
      id: newAssignmentId,
      employeeId: Number(employeeId),
      projectId: Number(projectId),
      companyId: project.companyId || 1,
      taskId: newTask.id,
      date: assignmentDate,
      status: "queued",
      sequence: sequence,
      priority: mappedPriority, // Use mapped priority
      instructions: instructions,
      estimatedHours: Number(estimatedHours),
      createdAt: new Date(),
      assignedDate: new Date()
    });

    console.log('✅ Task assignment created:', assignment.id);

    // 6. Send task assignment notification
    try {
      const supervisorId = req.user?.userId || req.user?.id || 1;
      await TaskNotificationService.notifyTaskAssignment([assignment], supervisorId);
      console.log(`✅ Task assignment notification sent`);
    } catch (notificationError) {
      console.error("❌ Error sending task assignment notification:", notificationError);
      // Don't fail the request if notifications fail
    }

    res.json({
      success: true,
      message: "Task created and assigned successfully",
      data: {
        taskId: newTask.id,
        assignmentId: assignment.id,
        taskName: newTask.taskName,
        sequence: assignment.sequence
      }
    });

  } catch (err) {
    console.error("createAndAssignTask error:", err);
    res.status(500).json({
      success: false,
      errors: ['Failed to create and assign task'],
      message: err.message
    });
  }
};


/**
 * Mark absence reason for a worker
 * @route POST /api/supervisor/mark-absence-reason
 */
export const markAbsenceReason = async (req, res) => {
  try {
    const { employeeId, projectId, date, reason, notes } = req.body;
    const supervisorId = req.user?.employeeId || req.user?.id;

    if (!employeeId || !projectId || !date || !reason) {
      return res.status(400).json({ 
        message: 'employeeId, projectId, date, and reason are required' 
      });
    }

    const validReasons = ['LEAVE_APPROVED', 'LEAVE_NOT_INFORMED', 'MEDICAL', 'UNAUTHORIZED', 'PRESENT'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ 
        message: `Invalid reason. Must be one of: ${validReasons.join(', ')}` 
      });
    }

    const workDate = new Date(date);
    workDate.setHours(0, 0, 0, 0);

    // Find or create attendance record
    let attendance = await Attendance.findOne({
      employeeId: Number(employeeId),
      projectId: Number(projectId),
      date: workDate
    });

    if (!attendance) {
      // Create new attendance record for absent worker
      const lastAttendance = await Attendance.findOne().sort({ id: -1 });
      const newId = lastAttendance ? lastAttendance.id + 1 : 1;

      attendance = new Attendance({
        id: newId,
        employeeId: Number(employeeId),
        projectId: Number(projectId),
        date: workDate,
        absenceReason: reason,
        absenceNotes: notes || '',
        absenceMarkedBy: supervisorId,
        absenceMarkedAt: new Date()
      });
    } else {
      // Update existing attendance record
      attendance.absenceReason = reason;
      attendance.absenceNotes = notes || '';
      attendance.absenceMarkedBy = supervisorId;
      attendance.absenceMarkedAt = new Date();
    }

    await attendance.save();

    return res.status(200).json({
      success: true,
      message: 'Absence reason marked successfully',
      data: {
        attendanceId: attendance.id,
        absenceReason: attendance.absenceReason,
        absenceNotes: attendance.absenceNotes
      }
    });
  } catch (err) {
    console.error('Error marking absence reason:', err);
    return res.status(500).json({ message: 'Error marking absence reason' });
  }
};

/**
 * Create escalation for attendance violations
 * @route POST /api/supervisor/create-escalation
 */
export const createAttendanceEscalation = async (req, res) => {
  try {
    const { 
      employeeId, 
      projectId, 
      escalationType, 
      severity, 
      description, 
      occurrenceCount,
      dateRange,
      escalatedTo,
      notes,
      relatedAttendanceIds 
    } = req.body;
    
    const supervisorId = req.user?.employeeId || req.user?.id;

    if (!employeeId || !projectId || !escalationType || !escalatedTo) {
      return res.status(400).json({ 
        message: 'employeeId, projectId, escalationType, and escalatedTo are required' 
      });
    }

    const AttendanceEscalation = (await import('../attendance/models/AttendanceEscalation.js')).default;

    const lastEscalation = await AttendanceEscalation.findOne().sort({ id: -1 });
    const newId = lastEscalation ? lastEscalation.id + 1 : 1;

    const escalation = new AttendanceEscalation({
      id: newId,
      employeeId: Number(employeeId),
      projectId: Number(projectId),
      escalationType,
      severity: severity || 'MEDIUM',
      description: description || `${escalationType} escalation`,
      occurrenceCount: occurrenceCount || 1,
      dateRange: dateRange || {
        from: new Date(),
        to: new Date()
      },
      escalatedBy: supervisorId,
      escalatedTo,
      notes: notes || '',
      relatedAttendanceIds: relatedAttendanceIds || []
    });

    await escalation.save();

    // Get employee details for response
    const employee = await Employee.findOne({ id: Number(employeeId) });

    return res.status(201).json({
      success: true,
      message: 'Escalation created successfully',
      data: {
        escalationId: escalation.id,
        employeeName: employee?.fullName || 'Unknown',
        escalationType: escalation.escalationType,
        severity: escalation.severity,
        status: escalation.status
      }
    });
  } catch (err) {
    console.error('Error creating escalation:', err);
    return res.status(500).json({ message: 'Error creating escalation' });
  }
};

/**
 * Get escalations for a project
 * @route GET /api/supervisor/escalations
 */
export const getEscalations = async (req, res) => {
  try {
    const { projectId, status, employeeId } = req.query;

    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    const AttendanceEscalation = (await import('../attendance/models/AttendanceEscalation.js')).default;

    let query = { projectId: Number(projectId) };
    if (status) query.status = status;
    if (employeeId) query.employeeId = Number(employeeId);

    const escalations = await AttendanceEscalation.find(query).sort({ createdAt: -1 });

    // Get employee details
    const employeeIds = [...new Set(escalations.map(e => e.employeeId))];
    const employees = await Employee.find({ id: { $in: employeeIds } });
    const employeeMap = employees.reduce((map, emp) => {
      map[emp.id] = emp;
      return map;
    }, {});

    const escalationsWithDetails = escalations.map(esc => ({
      id: esc.id,
      employeeId: esc.employeeId,
      employeeName: employeeMap[esc.employeeId]?.fullName || 'Unknown',
      escalationType: esc.escalationType,
      severity: esc.severity,
      description: esc.description,
      occurrenceCount: esc.occurrenceCount,
      dateRange: esc.dateRange,
      escalatedTo: esc.escalatedTo,
      status: esc.status,
      notes: esc.notes,
      createdAt: esc.createdAt
    }));

    return res.status(200).json({
      success: true,
      data: escalationsWithDetails,
      count: escalationsWithDetails.length
    });
  } catch (err) {
    console.error('Error fetching escalations:', err);
    return res.status(500).json({ message: 'Error fetching escalations' });
  }
};

/**
 * Export attendance report
 * @route GET /api/supervisor/export-attendance-report
 */
export const exportAttendanceReport = async (req, res) => {
  try {
    const { projectId, date, format = 'json' } = req.query;

    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    const workDate = date || new Date().toISOString().split('T')[0];

    // Get attendance data
    const project = await Project.findOne({ id: Number(projectId) });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const assignments = await WorkerTaskAssignment.find({
      projectId: Number(projectId),
      date: workDate
    });

    const employeeIds = [...new Set(assignments.map(a => a.employeeId))];
    const employees = await Employee.find({ id: { $in: employeeIds } });
    const employeeMap = employees.reduce((map, emp) => {
      map[emp.id] = emp;
      return map;
    }, {});

    const startOfDay = new Date(workDate);
    startOfDay.setHours(0, 0, 0, 0);
    startOfDay.setHours(startOfDay.getHours() - 24);
    
    const endOfDay = new Date(workDate);
    endOfDay.setHours(23, 59, 59, 999);
    endOfDay.setHours(endOfDay.getHours() + 24);
    
    const attendanceRecords = await Attendance.find({
      employeeId: { $in: employeeIds },
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    const filteredAttendance = attendanceRecords.filter(att => {
      const attDate = new Date(att.date);
      const attDateString = attDate.toISOString().split('T')[0];
      const workDateString = new Date(workDate).toISOString().split('T')[0];
      const attLocalDate = new Date(attDate.getTime() - attDate.getTimezoneOffset() * 60000);
      const attLocalDateString = attLocalDate.toISOString().split('T')[0];
      return attDateString === workDateString || attLocalDateString === workDateString;
    });

    const attendanceMap = filteredAttendance.reduce((map, att) => {
      const key = `${att.employeeId}-${att.projectId}`;
      map[key] = att;
      return map;
    }, {});

    // Build report data
    const reportData = assignments.map(assignment => {
      const employee = employeeMap[assignment.employeeId];
      const attendanceKey = `${assignment.employeeId}-${assignment.projectId}`;
      const attendance = attendanceMap[attendanceKey];

      let status = 'ABSENT';
      let regularHours = 0;
      let otHours = 0;
      let lunchDuration = 0;

      if (attendance) {
        if (attendance.checkOut) {
          status = 'CHECKED_OUT';
        } else if (attendance.checkIn) {
          status = 'CHECKED_IN';
        }

        // Calculate hours
        if (attendance.checkIn) {
          const checkInTime = new Date(attendance.checkIn);
          const checkOutTime = attendance.checkOut ? new Date(attendance.checkOut) : new Date();
          const totalMinutes = (checkOutTime - checkInTime) / (1000 * 60);

          // Calculate lunch duration
          if (attendance.lunchStartTime && attendance.lunchEndTime) {
            const lunchStart = new Date(attendance.lunchStartTime);
            const lunchEnd = new Date(attendance.lunchEndTime);
            lunchDuration = (lunchEnd - lunchStart) / (1000 * 60);
          }

          const workMinutes = totalMinutes - lunchDuration;
          const workHours = workMinutes / 60;

          // Regular hours (up to 8 hours)
          regularHours = Math.min(workHours, 8);
          // OT hours (anything over 8 hours)
          otHours = Math.max(workHours - 8, 0);
        }
      }

      return {
        employeeId: assignment.employeeId,
        employeeName: employee?.fullName || 'Unknown',
        role: employee?.role || 'Worker',
        phone: employee?.phone || '',
        status,
        checkIn: attendance?.checkIn ? new Date(attendance.checkIn).toLocaleTimeString() : '--:--',
        checkOut: attendance?.checkOut ? new Date(attendance.checkOut).toLocaleTimeString() : '--:--',
        lunchStart: attendance?.lunchStartTime ? new Date(attendance.lunchStartTime).toLocaleTimeString() : '--:--',
        lunchEnd: attendance?.lunchEndTime ? new Date(attendance.lunchEndTime).toLocaleTimeString() : '--:--',
        regularHours: regularHours.toFixed(2),
        otHours: otHours.toFixed(2),
        totalHours: (regularHours + otHours).toFixed(2),
        absenceReason: attendance?.absenceReason || 'N/A',
        insideGeofence: attendance?.insideGeofenceAtCheckin ? 'Yes' : 'No',
        taskAssigned: assignment.taskName || 'No task'
      };
    });

    // Calculate summary
    const summary = {
      projectName: project.projectName || project.name,
      date: workDate,
      totalWorkers: reportData.length,
      present: reportData.filter(r => r.status !== 'ABSENT').length,
      absent: reportData.filter(r => r.status === 'ABSENT').length,
      totalRegularHours: reportData.reduce((sum, r) => sum + parseFloat(r.regularHours), 0).toFixed(2),
      totalOTHours: reportData.reduce((sum, r) => sum + parseFloat(r.otHours), 0).toFixed(2),
      generatedAt: new Date().toISOString()
    };

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = [
        'Employee ID', 'Name', 'Role', 'Phone', 'Status', 
        'Check In', 'Check Out', 'Lunch Start', 'Lunch End',
        'Regular Hours', 'OT Hours', 'Total Hours', 
        'Absence Reason', 'Inside Geofence', 'Task Assigned'
      ].join(',');

      const csvRows = reportData.map(row => [
        row.employeeId,
        `"${row.employeeName}"`,
        row.role,
        row.phone,
        row.status,
        row.checkIn,
        row.checkOut,
        row.lunchStart,
        row.lunchEnd,
        row.regularHours,
        row.otHours,
        row.totalHours,
        row.absenceReason,
        row.insideGeofence,
        `"${row.taskAssigned}"`
      ].join(','));

      const csv = [csvHeaders, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="attendance-report-${workDate}.csv"`);
      return res.status(200).send(csv);
    }

    // Return JSON format
    return res.status(200).json({
      success: true,
      summary,
      data: reportData
    });
  } catch (err) {
    console.error('Error exporting attendance report:', err);
    return res.status(500).json({ message: 'Error exporting attendance report' });
  }
};

/**
 * Create general issue escalation to manager
 * @route POST /api/supervisor/issue-escalation
 * @desc Escalate site issues like material delays, equipment breakdowns, site instruction changes
 */
export const createIssueEscalation = async (req, res) => {
  try {
    const {
      issueType,
      severity,
      title,
      description,
      escalateTo,
      photos = [],
      projectId,
      notes,
      immediateActionRequired,
      estimatedImpact,
      suggestedSolution,
      supervisorId,
      supervisorName,
    } = req.body;

    // Validation
    if (!issueType || !severity || !title || !description || !escalateTo || !projectId) {
      return res.status(400).json({
        success: false,
        errors: ['Missing required fields: issueType, severity, title, description, escalateTo, projectId'],
      });
    }

    // Get project name
    const project = await Project.findOne({ id: Number(projectId) });
    if (!project) {
      return res.status(404).json({
        success: false,
        errors: ['Project not found'],
      });
    }

    // Import the model
    const IssueEscalation = (await import('./models/IssueEscalation.js')).default;

    // Create escalation
    const escalation = new IssueEscalation({
      issueType,
      severity,
      title,
      description,
      escalateTo,
      photos,
      projectId: Number(projectId),
      projectName: project.name,
      supervisorId: supervisorId || req.user?.employeeId || 0,
      supervisorName: supervisorName || req.user?.name || 'Unknown',
      notes,
      immediateActionRequired: immediateActionRequired || false,
      estimatedImpact,
      suggestedSolution,
      status: 'PENDING',
    });

    await escalation.save();

    // TODO: Send notifications to manager/admin/boss based on escalateTo
    // This would integrate with your notification service

    return res.status(201).json({
      success: true,
      data: {
        escalationId: escalation._id,
        issueType: escalation.issueType,
        severity: escalation.severity,
        status: escalation.status,
        escalatedTo: escalation.escalateTo,
        createdAt: escalation.createdAt,
        message: `Issue escalated to ${escalation.escalateTo.toLowerCase()} successfully`,
      },
    });
  } catch (err) {
    console.error('Error creating issue escalation:', err);
    return res.status(500).json({
      success: false,
      errors: ['Failed to create issue escalation'],
    });
  }
};

/**
 * Get issue escalations for a project
 * @route GET /api/supervisor/issue-escalations
 * @desc Get list of issue escalations with filtering and pagination
 */
export const getIssueEscalations = async (req, res) => {
  try {
    const {
      projectId,
      status,
      issueType,
      severity,
      limit = 50,
      offset = 0,
    } = req.query;

    // Import the model
    const IssueEscalation = (await import('./models/IssueEscalation.js')).default;

    // Build query
    const query = {};
    if (projectId) query.projectId = Number(projectId);
    if (status) query.status = status;
    if (issueType) query.issueType = issueType;
    if (severity) query.severity = severity;

    // Get escalations with pagination
    const [escalations, total] = await Promise.all([
      IssueEscalation.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(Number(offset))
        .lean(),
      IssueEscalation.countDocuments(query),
    ]);

    // Get summary statistics
    const summary = await IssueEscalation.getStatistics(projectId ? Number(projectId) : null);

    return res.status(200).json({
      success: true,
      data: {
        escalations,
        summary: {
          total,
          pending: summary.byStatus?.pending || 0,
          acknowledged: summary.byStatus?.acknowledged || 0,
          inProgress: summary.byStatus?.in_progress || 0,
          resolved: summary.byStatus?.resolved || 0,
          bySeverity: {
            critical: summary.bySeverity?.critical || 0,
            high: summary.bySeverity?.high || 0,
            medium: summary.bySeverity?.medium || 0,
            low: summary.bySeverity?.low || 0,
          },
          byType: summary.byType || {},
        },
      },
    });
  } catch (err) {
    console.error('Error getting issue escalations:', err);
    return res.status(500).json({
      success: false,
      errors: ['Failed to get issue escalations'],
    });
  }
};

/**
 * Update issue escalation status
 * @route PUT /api/supervisor/issue-escalation/:escalationId
 * @desc Update status of an issue escalation (for managers/admin)
 */
export const updateIssueEscalation = async (req, res) => {
  try {
    const { escalationId } = req.params;
    const { status, notes, resolution } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        errors: ['Status is required'],
      });
    }

    // Import the model
    const IssueEscalation = (await import('./models/IssueEscalation.js')).default;

    const escalation = await IssueEscalation.findById(escalationId);
    if (!escalation) {
      return res.status(404).json({
        success: false,
        errors: ['Escalation not found'],
      });
    }

    // Update status using the model method
    escalation.addStatusChange(
      status,
      req.user?.employeeId || req.user?.userId || 0,
      req.user?.name || 'Unknown',
      notes
    );

    if (resolution) {
      escalation.resolution = resolution;
    }

    await escalation.save();

    return res.status(200).json({
      success: true,
      data: {
        escalationId: escalation._id,
        status: escalation.status,
        updatedAt: escalation.updatedAt,
        message: 'Issue escalation updated successfully',
      },
    });
  } catch (err) {
    console.error('Error updating issue escalation:', err);
    return res.status(500).json({
      success: false,
      errors: ['Failed to update issue escalation'],
    });
  }
};


/**
 * Verify and approve task completion
 * POST /api/supervisor/verify-task-completion/:progressId
 * Body: { notes?, approvedPercent? }
 */
export const verifyTaskCompletion = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { notes, approvedPercent } = req.body;

    console.log('\n🔍 Verify Task Completion Request:');
    console.log('   assignmentId:', assignmentId);
    console.log('   notes:', notes);
    console.log('   approvedPercent:', approvedPercent);

    // Validate assignmentId
    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        errors: ['Assignment ID is required'],
      });
    }

    // Convert to number
    const numericAssignmentId = parseInt(assignmentId);
    if (isNaN(numericAssignmentId)) {
      return res.status(400).json({
        success: false,
        errors: ['Invalid assignment ID format'],
      });
    }

    console.log('   Numeric assignment ID:', numericAssignmentId);

    // Find the assignment first
    const assignment = await WorkerTaskAssignment.findOne({
      id: numericAssignmentId
    });

    if (!assignment) {
      console.log('❌ Assignment not found');
      return res.status(404).json({
        success: false,
        errors: ['Task assignment not found'],
      });
    }

    console.log('✅ Assignment found:', {
      id: assignment.id,
      taskId: assignment.taskId,
      employeeId: assignment.employeeId,
      status: assignment.status
    });

    // Find the latest progress record for this assignment
    const progress = await WorkerTaskProgress.findOne({
      workerTaskAssignmentId: numericAssignmentId,
      status: { $in: ['SUBMITTED', 'REVIEWED'] } // Only pending approvals
    }).sort({ submittedAt: -1 }); // Get the most recent

    if (!progress) {
      console.log('❌ No pending progress found for assignment');

      // Check if there are any progress records at all
      const anyProgress = await WorkerTaskProgress.findOne({
        workerTaskAssignmentId: numericAssignmentId
      }).sort({ submittedAt: -1 });

      if (anyProgress) {
        console.log('   Found progress with status:', anyProgress.status);
        return res.status(400).json({
          success: false,
          errors: [`Task completion is already ${anyProgress.status.toLowerCase()}`],
        });
      }

      return res.status(404).json({
        success: false,
        errors: ['No task completion submission found for this assignment'],
      });
    }

    console.log('✅ Progress record found:', {
      id: progress.id,
      status: progress.status,
      progressPercent: progress.progressPercent,
      submittedAt: progress.submittedAt
    });

    // Validate approved percent if provided
    const finalApprovedPercent = approvedPercent !== undefined
      ? Math.min(Math.max(0, approvedPercent), progress.progressPercent)
      : progress.progressPercent;

    // Update progress record
    progress.status = 'APPROVED';
    progress.approvedPercent = finalApprovedPercent;
    progress.remarks = notes || 'Approved by supervisor';
    progress.reviewedBy = req.user?.employeeId || req.user?.userId || null;
    progress.reviewedAt = new Date();

    await progress.save();
    console.log('✅ Progress record updated to APPROVED');

    // Update the assignment record
    assignment.status = 'completed';
    assignment.completedAt = progress.submittedAt;
    assignment.progressPercent = finalApprovedPercent;

    // Add supervisor verification details
    if (!assignment.supervisorVerification) {
      assignment.supervisorVerification = {};
    }
    assignment.supervisorVerification.verified = true;
    assignment.supervisorVerification.verifiedBy = req.user?.employeeId || req.user?.userId || null;
    assignment.supervisorVerification.verifiedAt = new Date();
    assignment.supervisorVerification.notes = notes || '';

    await assignment.save();
    console.log('✅ Assignment record updated');

    // Get worker details for notification
    const worker = await Employee.findOne({ id: progress.employeeId });
    const task = await Task.findOne({ id: assignment.taskId });

    console.log('✅ Task completion verified successfully');

    // TODO: Send notification to worker about approval
    // await sendNotification({
    //   employeeId: progress.employeeId,
    //   title: 'Task Completion Approved',
    //   message: `Your completion of "${task?.taskName || 'task'}" has been approved by supervisor`,
    //   type: 'TASK_APPROVED'
    // });

    return res.status(200).json({
      success: true,
      data: {
        assignmentId: assignment.id,
        progressId: progress.id,
        status: 'APPROVED',
        approvedPercent: finalApprovedPercent,
        workerName: worker?.fullName || 'Unknown',
        taskName: task?.taskName || 'Unknown',
        verifiedAt: progress.reviewedAt,
        verifiedBy: progress.reviewedBy,
        message: 'Task completion verified and approved successfully',
      },
    });

  } catch (err) {
    console.error('❌ Error verifying task completion:', err);
    return res.status(500).json({
      success: false,
      errors: ['Failed to verify task completion'],
    });
  }
}
