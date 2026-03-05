// controllers/adminAttendanceController.js
import Attendance from "../attendance/AttendanceModel.js";
import Employee from "../employees/EmployeeModel.js";
import Project from "../project/models/ProjectModel.js";
import LocationLog from "../attendance/LocationLogModel.js";

// export const getAdminTodayAttendance = async (req, res) => {
//   try {
//     const { date, projectId } = req.query;
//     const queryDate = date || new Date().toISOString().split("T")[0];

//     // 1️⃣ Attendance query
//     const attendanceQuery = { date: queryDate };
//     if (projectId) attendanceQuery.projectId = Number(projectId);

//     const attendanceRecords = await Attendance.find(attendanceQuery).lean();
//     if (!attendanceRecords.length) {
//       return res.json({
//         date: queryDate,
//         site: "All",
//         attendance: []
//       });
//     }

//     // 2️⃣ Collect IDs
//     const employeeIds = [...new Set(attendanceRecords.map(a => a.employeeId))];
//     const projectIds = [...new Set(attendanceRecords.map(a => a.projectId))];

//     // 3️⃣ Fetch master data
//     const [employees, projects] = await Promise.all([
//       Employee.find({ id: { $in: employeeIds } }).lean(),
//       Project.find({ id: { $in: projectIds } }).lean()
//     ]);

//     // 4️⃣ Fetch latest location logs ONLY
//     const locationLogs = await LocationLog.find({
//       employeeId: { $in: employeeIds },
//       projectId: { $in: projectIds },
//       date: queryDate
//     })
//       .sort({ createdAt: -1 })
//       .lean();

//     // 5️⃣ Create lookup maps (IMPORTANT)
//     const employeeMap = new Map(employees.map(e => [e.id, e]));
//     const projectMap = new Map(projects.map(p => [p.id, p]));

//     const locationMap = new Map();
//     for (const log of locationLogs) {
//       if (!locationMap.has(log.employeeId)) {
//         locationMap.set(log.employeeId, log); // latest due to sort
//       }
//     }

//     // 6️⃣ Build response
//     const attendance = attendanceRecords.map(record => {
//       const employee = employeeMap.get(record.employeeId);
//       const project = projectMap.get(record.projectId);
//       const locationLog = locationMap.get(record.employeeId);

//       const checkInTime = record.checkIn?.substring(0, 5) || null;
//       const checkOutTime = record.checkOut?.substring(0, 5) || null;

//       let status = "Present";

//       if (checkInTime && checkInTime > "08:00") {
//         status = "Late ⚠";
//       }

//       if (locationLog && locationLog.insideGeofence === false) {
//         status = "⚠ Outside Fence";
//       }

//       return {
//         workerId: employee?.id || record.employeeId,
//         workerName: employee?.fullName || "Unknown",
//         site: project?.projectName || "Unknown",
//         loginTime: checkInTime,
//         logoutTime: checkOutTime,
//         status,
//         geoFenceViolation: locationLog
//           ? !locationLog.insideGeofence
//           : false
//       };
//     });

//     res.json({
//       date: queryDate,
//       site: projectId
//         ? projectMap.get(Number(projectId))?.projectName || "Unknown"
//         : "All",
//       attendance
//     });

//   } catch (err) {
//     console.error("Admin Attendance Error:", err);
//     res.status(500).json({ message: "Failed to fetch admin attendance" });
//   }
// };


export const getAdminTodayAttendance = async (req, res) => {
  try {

    const { date, projectId } = req.query;

    // 1️⃣ Date handling (UTC safe)
    const queryDate = date || new Date().toISOString().split("T")[0];
    const startOfDay = new Date(`${queryDate}T00:00:00.000Z`);
    const endOfDay = new Date(`${queryDate}T23:59:59.999Z`);

    // 2️⃣ Attendance query (SOURCE OF TRUTH)
    const attendanceQuery = {
      date: { $gte: startOfDay, $lte: endOfDay },
      ...(projectId ? { projectId: Number(projectId) } : {})
    }; 

    const attendanceRecords = await Attendance.find(attendanceQuery).lean();

    if (!attendanceRecords.length) {
      return res.json({
        date: queryDate,
        site: "All",
        attendance: []
      });
    }

    // 3️⃣ Collect IDs
    const employeeIds = [...new Set(attendanceRecords.map(a => a.employeeId))];
    const projectIds = [...new Set(attendanceRecords.map(a => a.projectId))];

    // 4️⃣ Fetch master data
    const [employees, projects] = await Promise.all([
      Employee.find({ id: { $in: employeeIds } }).lean(),
      Project.find({ id: { $in: projectIds } }).lean()
    ]);

    const employeeMap = new Map(employees.map(e => [e.id, e]));
    const projectMap = new Map(projects.map(p => [p.id, p]));

    // 5️⃣ Build response
    const attendance = attendanceRecords.map(record => {
      const employee = employeeMap.get(record.employeeId);
      const project = projectMap.get(record.projectId);

      const checkInTime = record.checkIn
        ? new Date(record.checkIn).toISOString().substring(11, 16)
        : null;

      const checkOutTime = record.checkOut
        ? new Date(record.checkOut).toISOString().substring(11, 16)
        : null;

      // 🔥 STATUS LOGIC — PRIORITY MATTERS
      let status = "Present";

      if (record.insideGeofenceAtCheckin === false) {
        status = "⚠ Outside Fence";
      } else if (checkInTime && checkInTime > "08:00") {
        status = "Late ⚠";
      }

      return {
        workerId: employee?.id || record.employeeId,
        workerName: employee?.fullName || "Unknown",
        site: project?.projectName || "Unknown",
        loginTime: checkInTime,
        logoutTime: checkOutTime,
        status,
        geoFenceViolation: record.insideGeofenceAtCheckin === false
      };
    });

    // 6️⃣ Response
    res.json({
      date: queryDate,
      site: projectId
        ? projectMap.get(Number(projectId))?.projectName || "Unknown"
        : "All",
      attendance
    });
  } catch (err) {
    console.error("Admin Attendance Error:", err);
    res.status(500).json({ message: "Failed to fetch admin attendance" });
  }
};



