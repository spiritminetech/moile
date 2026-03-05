import Attendance from '../attendance/AttendanceModel.js';
import Project from '../project/models/ProjectModel.js';
import WorkerTaskAssignment from '../workerTaskAssignment/WorkerTaskAssignmentModel.js';
import Employee from '../employees/EmployeeModel.js';

/**
 * GET /attendance/today/projects
 * Project-wise attendance summary
 */
export const getTodayProjectAttendance = async (req, res) => {
  // console.log('Route hit', req.query);
  try {
    const companyId = Number(req.query.companyId);
    const date = req.query.date;

    if (!companyId || !date) {
      console.log('Missing companyId or date');
      return res.status(400).json({ message: 'companyId and date are required' });
    }

    // ===== Active projects =====
    const projects = await Project.find({
      companyId,
      status: { $regex: /^active$/i }
    }).lean();
    console.log('Projects found:', projects.length);

    const projectIds = projects.map(p => p.id);

    // ===== Assigned workers =====
    const assignments = await WorkerTaskAssignment.find({
      companyId,
      projectId: { $in: projectIds },
      date: date
    }).lean();
    console.log('Assignments found:', assignments.length);

    // ===== Attendance =====
  const attendance = await Attendance.find({
  projectId: { $in: projectIds }
}).lean();

    console.log('Attendance found:', attendance.length);

    // build maps safely
    const assignedMap = {};
    assignments.forEach(a => {
      if (!a.projectId || !a.employeeId) return;
      if (!assignedMap[a.projectId]) assignedMap[a.projectId] = new Set();
      assignedMap[a.projectId].add(a.employeeId);
    });

    const attendanceMap = {};
    attendance.forEach(a => {
      if (!a.projectId || !a.employeeId || !a.date) return;
      const attDate = new Date(a.date).toISOString().slice(0, 10);
      if (attDate !== date) return;
      if (!attendanceMap[a.projectId]) attendanceMap[a.projectId] = [];
      attendanceMap[a.projectId].push(a);
    });

    // ===== Build response =====
    const data = projects.map(p => {
      const assigned = assignedMap[p.id] || new Set();
      const present = (attendanceMap[p.id] || []).filter(a => a.checkIn).length;
      const absent = Math.max(assigned.size - present, 0);
      return { projectId: p.id, projectCode: p.projectCode, projectName: p.projectName, present, absent };
    });

 
    return res.json({ date, companyId, totalProjects: data.length, data });

  } catch (error) {
    console.error('Error in getTodayProjectAttendance:', error);
    return res.status(500).json({ message: 'Failed to load today project attendance', error: error.message });
  }
};





/**
 * GET /attendance/today/projects/:projectId/workers
 * Worker-level attendance list
 */
export const getTodayWorkerAttendance = async (req, res) => {
  try {
    const { companyId } = req.query;
    const date = req.query.date || new Date().toISOString().split('T')[0]; 
    const projectId = Number(req.params.projectId);
    const companyIdNumber = Number(companyId);

    /* ================= VALIDATION ================= */
    if (
      Number.isNaN(companyIdNumber) ||
      Number.isNaN(projectId) ||
      !date
    ) {
      return res.status(400).json({
        message: 'companyId, projectId and date are required'
      });
    }

    /* ================= DATE RANGE ================= */
    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    /* ================= ASSIGNMENTS ================= */
    const assignments = await WorkerTaskAssignment.find({
      companyId: companyIdNumber,
      projectId,
    }).lean();

    if (!assignments.length) {
      return res.json({
        projectId,
        date,
        totalWorkers: 0,
        data: []
      });
    }

    const employeeIds = [...new Set(assignments.map(a => String(a.employeeId)))]; 

    /* ================= EMPLOYEES ================= */
    const employees = await Employee.find({
      id: { $in: employeeIds },
      companyId: companyIdNumber,
      status: 'ACTIVE'
    }).lean();

    const employeeMap = new Map(
      employees.map(e => [String(e.id), e])
    );

    /* ================= ATTENDANCE ================= */
    const attendance = await Attendance.find({
      projectId,
      employeeId: { $in: employeeIds },
      checkIn: { $gte: startOfDay, $lte: endOfDay } 
    }).lean();

    const attendanceMap = new Map(
      attendance.map(a => [String(a.employeeId), a])
    );

    /* ================= BUILD RESPONSE ================= */
    const data = [];
    employeeIds.forEach(empKey => {
      const emp = employeeMap.get(empKey);
      const att = attendanceMap.get(empKey);

      data.push({
        employeeId: emp?.id ?? empKey,
        employeeName: emp?.fullName ?? 'Unknown',
        employeeCode: emp?.employeeCode ?? null,
        status: att?.checkIn ? 'PRESENT' : 'ABSENT',
        checkIn: att?.checkIn ?? null,
        checkOut: att?.checkOut ?? null,
        pendingCheckout: att?.pendingCheckout ?? false,
        insideGeofenceAtCheckIn: att?.insideGeofenceAtCheckin ?? null
      });
    });

    return res.json({
      projectId,
      date,
      totalWorkers: data.length,
      data
    });

  } catch (error) {
    console.error('getTodayWorkerAttendance error:', error);
    return res.status(500).json({
      message: 'Failed to load worker attendance',
      error: error.message
    });
  }
};




