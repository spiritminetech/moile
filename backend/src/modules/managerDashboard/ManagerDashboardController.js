import Project from "../project/models/ProjectModel.js";
import WorkerTaskAssignment from "../workerTaskAssignment/WorkerTaskAssignmentModel.js";
import Attendance from "../attendance/AttendanceModel.js";
import Employee from "../employees/EmployeeModel.js";
import ProjectDailyProgress from "../project/models/ProjectDailyProgressModel.js";
import dayjs from "dayjs";

// GET /api/pm/dashboard
export const getProjectManagerDashboard = async (req, res) => {
  try {
    const managerId = req.user.id;

    // Normalize today's date
    const todayStr = dayjs().format("YYYY-MM-DD");
    const todayStart = dayjs(todayStr).startOf("day").toDate();
    const todayEnd = dayjs(todayStr).endOf("day").toDate();

    /* -----------------------------
       1️⃣ Fetch Projects (ACTIVE)
    --------------------------------*/
    const projects = await Project.find({
      projectManagerId: managerId,
      $or: [
        { status: "ACTIVE" },
        { projectStatus: "Active" }
      ]
    }).lean();

    const projectIds = projects.map(p => p.id);

    /* -----------------------------
       2️⃣ Workers Assigned for Today
    --------------------------------*/
    const assignments = await WorkerTaskAssignment.find({
      projectId: { $in: projectIds },
      date: todayStr
    }).lean();

    const employeeIds = [...new Set(assignments.map(a => a.employeeId))];

    /* -----------------------------
       3️⃣ Employees
    --------------------------------*/
    const employees = await Employee.find({
      id: { $in: employeeIds }
    }).lean();

    const employeeMap = {};
    employees.forEach(e => {
      employeeMap[e.id] = e;
    });

    /* -----------------------------
       4️⃣ Attendance for Today
    --------------------------------*/
    const attendanceRecords = await Attendance.find({
      employeeId: { $in: employeeIds },
      projectId: { $in: projectIds },
      checkIn: { $gte: todayStart, $lte: todayEnd }
    }).lean();

    const attendanceMap = {};
    attendanceRecords.forEach(a => {
      attendanceMap[`${a.employeeId}_${a.projectId}`] = a;
    });

    /* -----------------------------
       5️⃣ Manpower Calculation
    --------------------------------*/
    let totalWorkers = assignments.length;
    let present = 0;
    let absent = 0;
    let notCheckedIn = 0;

    assignments.forEach(a => {
      const att = attendanceMap[`${a.employeeId}_${a.projectId}`];
      if (att?.checkIn) present++;
      else notCheckedIn++;
    });

    /* -----------------------------
       6️⃣ Progress Alerts
    --------------------------------*/
    const dailyProgress = await ProjectDailyProgress.find({
      projectId: { $in: projectIds },
      date: { $gte: todayStart, $lte: todayEnd }
    }).lean();

    const alerts = projects.filter(p => {
      const progress = dailyProgress.find(d => d.projectId === p.id);
      return !progress || progress.overallProgress < 50;
    });

    /* -----------------------------
       7️⃣ Build Project Summary
    --------------------------------*/
    const projectSummary = projects.map(p => {
      const workers = assignments
        .filter(a => a.projectId === p.id)
        .map(a => ({
          employeeId: a.employeeId,
          name: employeeMap[a.employeeId]?.fullName || "N/A",
          status: attendanceMap[`${a.employeeId}_${p.id}`]?.checkIn ? "PRESENT" : "ASSIGNED"
        }));
                          
      return {
        projectId: p.id,
        projectName: p.projectName,
        supervisorId: p.supervisorId || p["supervisorId "] || null, // supports trailing space
        workersAssigned: workers.length,
        progress: dailyProgress.find(d => d.projectId === p.id)?.overallProgress || 0,
        status: p.status || p.projectStatus || "ACTIVE"
      };
    });

    /* -----------------------------
       8️⃣ API Response
    --------------------------------*/
    const payload = {
      summary: {
        myProjects: projects.length,
        todaysManpower: totalWorkers,
        present,
        absent,
        notCheckedIn,
        progressAlerts: alerts.length
      },
      projects: projectSummary
    };

    return res.json(payload);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};
