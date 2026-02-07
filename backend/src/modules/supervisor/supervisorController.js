import Attendance from '../attendance/Attendance.js';
import Project from '../project/models/Project.js';
import Employee from '../employee/Employee.js';
import LocationLog from '../attendance/LocationLog.js';
import WorkerTaskAssignment from '../worker/models/WorkerTaskAssignment.js';
import CompanyUser from "../companyUser/CompanyUser.js";
import Task from "../task/Task.js"
import TaskNotificationService from '../notification/services/TaskNotificationService.js';
import LeaveRequest from '../leaveRequest/models/LeaveRequest.js';
import PaymentRequest from '../leaveRequest/models/PaymentRequest.js';
import MedicalClaim from '../leaveRequest/models/MedicalClaim.js';
import MaterialRequest from '../project/models/MaterialRequest.js';
// import SiteChangeNotificationService from '../notification/services/SiteChangeNotificationService.js';

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

    // Find the assignment
    const assignment = await WorkerTaskAssignment.findOne({ id: assignmentId });
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
    if (taskLocationChanged) {
      try {
        const oldTaskLocation = {
          workArea: originalAssignment.workArea,
          floor: originalAssignment.floor,
          zone: originalAssignment.zone
        };
        const newTaskLocation = {
          workArea: assignment.workArea,
          floor: assignment.floor,
          zone: assignment.zone
        };

        await SiteChangeNotificationService.notifyTaskLocationChange(
          assignmentId,
          assignment.employeeId,
          oldTaskLocation,
          newTaskLocation
        );
        console.log(`✅ Task location change notification sent for assignment ${assignmentId}`);
      } catch (notificationError) {
        console.error("❌ Error sending task location change notification:", notificationError);
        // Don't fail the request if notifications fail
      }
    }

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

      const assignment = await WorkerTaskAssignment.findOne({ id: assignmentId });
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
          location: p.location || 'Unknown'
        }))
      });
    }

    const employeeIds = [...new Set(assignments.map(a => a.employeeId))];

    // Fetch employees with search filter
    let employeeQuery = { id: { $in: employeeIds } };
    if (search) {
      employeeQuery.fullName = { $regex: search, $options: 'i' };
    }

    const employees = await Employee.find(employeeQuery).lean();
    const employeeMap = employees.reduce((map, emp) => {
      map[emp.id] = emp;
      return map;
    }, {});

    // Get attendance records for all employees and date
    const attendanceRecords = await Attendance.find({
      employeeId: { $in: employeeIds },
      date: {
        $gte: new Date(workDate),
        $lt: new Date(new Date(workDate).setDate(new Date(workDate).getDate() + 1))
      }
    }).lean();

    const attendanceMap = attendanceRecords.reduce((map, att) => {
      const key = `${att.employeeId}-${att.projectId}`;
      map[key] = att;
      return map;
    }, {});

    // Process worker data
    const workers = [];
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

      const workerData = {
        employeeId: assignment.employeeId,
        workerName: employee.fullName,
        role: employee.role,
        phone: employee.phone,
        email: employee.email,
        projectId: assignment.projectId,
        projectName: project.projectName || project.name,
        projectLocation: project.location || 'Unknown',
        status: status,
        checkInTime: attendance?.checkIn || null,
        checkOutTime: attendance?.checkOut || null,
        workingHours: workingHours,
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
        attendanceId: attendance?.id || null
      };

      // Apply status filter
      if (status !== 'all' && status.toLowerCase() !== workerData.status.toLowerCase()) {
        continue;
      }

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
        location: p.location || 'Unknown',
        geofenceRadius: p.geofenceRadius || 100
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

    // Get supervisor ID from token or use default
    const supervisorId = req.user?.userId || req.user?.id || 1;

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
            onBreak: 0
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
      onBreak: 0
    };

    const WORK_START_HOUR = 8;
    const LATE_THRESHOLD_MINUTES = 15;
    let totalWorkingHours = 0;
    let workersWithHours = 0;

    for (const employee of employees) {
      const attendance = attendanceRecords.find(a => a.employeeId === employee.id);
      
      if (attendance) {
        if (attendance.checkOut) {
          teamOverview.presentToday++;
          // Calculate working hours
          const checkInTime = new Date(attendance.checkIn);
          const checkOutTime = new Date(attendance.checkOut);
          const hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);
          totalWorkingHours += hoursWorked;
          workersWithHours++;
        } else if (attendance.checkIn) {
          teamOverview.presentToday++;
          // Check if on break (simplified logic)
          const checkInTime = new Date(attendance.checkIn);
          const hoursWorked = (currentTime - checkInTime) / (1000 * 60 * 60);
          totalWorkingHours += hoursWorked;
          workersWithHours++;
        }

        // Check if late
        if (attendance.checkIn) {
          const checkInTime = new Date(attendance.checkIn);
          const expectedStartTime = new Date(workDate);
          expectedStartTime.setHours(WORK_START_HOUR, 0, 0, 0);
          
          const minutesLate = Math.floor((checkInTime - expectedStartTime) / (1000 * 60));
          if (minutesLate > LATE_THRESHOLD_MINUTES) {
            teamOverview.lateToday++;
          }
        }
      } else {
        teamOverview.absentToday++;
      }
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

    // Get pending approvals data
    const pendingApprovals = {
      leaveRequests: 0,
      materialRequests: 0,
      toolRequests: 0,
      urgent: 0,
      total: 0
    };

    try {
      // Get leave requests count
      const leaveRequestsCount = await LeaveRequest.countDocuments({
        status: 'pending',
        supervisorId: supervisorId
      });
      pendingApprovals.leaveRequests = leaveRequestsCount;

      // Get payment requests count (advance payments)
      const paymentRequestsCount = await PaymentRequest.countDocuments({
        status: 'pending',
        supervisorId: supervisorId
      });
      pendingApprovals.leaveRequests += paymentRequestsCount; // Add to leave requests for now

      // Get medical claims count
      const medicalClaimsCount = await MedicalClaim.countDocuments({
        status: 'pending',
        supervisorId: supervisorId
      });
      pendingApprovals.leaveRequests += medicalClaimsCount; // Add to leave requests for now

      // Calculate urgent requests (high priority or overdue)
      const urgentLeaveRequests = await LeaveRequest.countDocuments({
        status: 'pending',
        supervisorId: supervisorId,
        $or: [
          { priority: 'urgent' },
          { priority: 'high' },
          { requestDate: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Older than 24 hours
        ]
      });

      pendingApprovals.urgent = urgentLeaveRequests;
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

    // Prepare project summary
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

      return {
        id: project.id,
        name: project.projectName || project.name,
        location: project.location || 'Unknown',
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
          overallProgress: projectAssignments.length > 0 
            ? Math.round((projectAssignments.filter(a => a.status === 'completed').length / projectAssignments.length) * 100)
            : 0,
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

    // Fetch company, user, and assigned projects in parallel
    const [company, user, assignedProjects] = await Promise.all([
      Company.findOne({ id: companyId }),
      User.findOne({ id: userId }),
      Project.find({ 
        supervisorId: employee.id,
        status: { $in: ['ACTIVE', 'IN_PROGRESS'] }
      }).select('id name code location status')
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
    const projectIds = assignedProjects.map(p => p.id);
    const today = new Date().toISOString().split('T')[0];
    
    const teamSize = await WorkerTaskAssignment.distinct('employeeId', {
      projectId: { $in: projectIds },
      date: today
    }).then(ids => ids.length);

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
      profile 
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
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'User authentication required' 
      });
    }

    // Find supervisor by userId
    const supervisor = await Employee.findOne({ userId }).lean();
    
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
          leaveRequests: 0,
          advanceRequests: 0,
          materialRequests: 0,
          toolRequests: 0,
          urgent: 0,
          total: 0
        }
      });
    }

    const projectIds = projects.map(p => p.id);

    // Get all employees assigned to supervisor's projects
    const employees = await Employee.find({ 
      currentProjectId: { $in: projectIds } 
    }).lean();
    
    const employeeIds = employees.map(e => e.id);

    // Count pending requests in parallel for better performance
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
      total: totalCount
    });

    return res.json({
      success: true,
      data: {
        leaveRequests: leaveCount,
        advanceRequests: advanceCount,
        materialRequests: materialCount,
        toolRequests: toolCount,
        urgent: urgentCount,
        total: totalCount
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
