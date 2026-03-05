import WorkerTaskAssignment from "../workerTaskAssignment/WorkerTaskAssignmentModel.js";
import Attendance from "../attendance/AttendanceModel.js";

export const getAdminDashboard = async (req, res) => {
  try {
    // ===== TODAY STRING (matches WorkerTaskAssignment) =====
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD


    // ================= TODAY'S TASK ASSIGNMENTS =================
    const assignmentsToday = await WorkerTaskAssignment.find({
      date: todayStr
    }).lean();
    
     
    // Unique deployed workers
    const deployedEmployeeIds = [
      ...new Set(assignmentsToday.map(a => a.employeeId))
    ];

    const todaysDeployment = deployedEmployeeIds.length;

    // Pending tasks = still assigned
    const pendingTaskAssignments = assignmentsToday.filter(
      a => a.status === "assigned"
    ).length;

    // ================= TODAY'S ATTENDANCE =================
    const attendanceToday = await Attendance.find({
      date: {
        $gte: new Date(`${todayStr}T00:00:00.000Z`),
        $lte: new Date(`${todayStr}T23:59:59.999Z`)
      }
    }).lean();

    // Map employeeId → attendance record
    const attendanceMap = new Map();
    attendanceToday.forEach(a => attendanceMap.set(a.employeeId, a));

    // ================= ATTENDANCE ISSUES (CHECKIN/CHECKOUT ONLY) =================
    let attendanceIssues = 0;

    deployedEmployeeIds.forEach(employeeId => {
      const att = attendanceMap.get(employeeId);

      // ❌ Missing attendance OR missing checkIn OR missing checkOut
      if (!att || !att.checkIn || !att.checkOut) {
        attendanceIssues++;
      }
    });

    // ================= RESPONSE =================
    return res.json({
      date: todayStr,
      dashboard: {
        todaysDeployment,
        attendanceIssues,
        pendingTaskAssignments
      }
    });

  } catch (error) {
    console.error("Admin Dashboard Error:", error);
    return res.status(500).json({
      message: "Failed to fetch admin dashboard",
      error: error.message
    });
  }
};
