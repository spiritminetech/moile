// controllers/workerAttendanceController.js

import Attendance from "../attendance/Attendance.js";
import Project from "../project/models/Project.js";
import LocationLog from "../attendance/LocationLog.js";
import Employee from "../employee/Employee.js";
import WorkerTaskAssignment from "../worker/models/WorkerTaskAssignment.js";
import { validateGeofence } from "../../../utils/geofenceUtil.js";
import AttendanceNotificationService from "../notification/services/AttendanceNotificationService.js";

/* ---------------------------------------
   UTILS
--------------------------------------- */

const getTodayString = () => {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
};

function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
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

/* ---------------------------------------
   VALIDATE LOCATION (GEOFENCE)
--------------------------------------- */
export const validateLocation = async (req, res) => {
  try {
    const { projectId, latitude, longitude, accuracy } = req.body;
    const companyId = req.user.companyId;

    const project = await Project.findOne({ id: projectId, companyId });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Prepare project geofence information
    const centerLat = project.geofence?.center?.latitude || project.latitude || 0;
    const centerLng = project.geofence?.center?.longitude || project.longitude || 0;
    const radius = project.geofence?.radius || project.geofenceRadius || 100;

    const projectGeofence = {
      center: {
        latitude: centerLat,
        longitude: centerLng
      },
      radius: radius,
      strictMode: project.geofence?.strictMode !== false,
      allowedVariance: project.geofence?.allowedVariance || 10
    };

    // Use enhanced geofence validation
    const userLocation = { latitude, longitude };
    if (accuracy) {
      userLocation.accuracy = accuracy;
    }

    const geofenceValidation = validateGeofence(userLocation, projectGeofence);

    return res.json({
      valid: geofenceValidation.isValid,
      insideGeofence: geofenceValidation.insideGeofence,
      distance: geofenceValidation.distance,
      canProceed: geofenceValidation.isValid,
      message: geofenceValidation.message,
      accuracy: accuracy || null,
      projectGeofence: {
        center: {
          latitude: centerLat,
          longitude: centerLng
        },
        radius: radius
      }
    });
  } catch (err) {
    console.error("❌ Worker attendance location validation error:", err);
    res.status(500).json({ message: "Location validation failed" });
  }
};

/* ---------------------------------------
   CLOCK IN
--------------------------------------- */
export const clockIn = async (req, res) => {
  try {
    const { projectId, latitude, longitude, accuracy } = req.body;
    const { userId, companyId } = req.user;

    /* 1️⃣ Resolve employee */
    const employee = await Employee.findOne({
      userId,
      companyId,
      status: { $in: ["active", "ACTIVE"] }
    });
    if (!employee) return res.status(403).json({ message: "Unauthorized employee" });

    /* 2️⃣ Validate project */
    const project = await Project.findOne({ id: projectId, companyId });
    if (!project) return res.status(404).json({ message: "Project not found" });

    /* 3️⃣ Validate task assignment for today */
    const today = getTodayString();
    const assignment = await WorkerTaskAssignment.findOne({
      employeeId: employee.id,
      projectId,
      date: today
    });
    if (!assignment) return res.status(400).json({ message: "No task assigned for this project today" });

    /* 4️⃣ Geofence check */
    const distance = getDistanceFromLatLonInMeters(
      latitude,
      longitude,
      project.latitude,
      project.longitude
    );
    if (distance > project.geofenceRadius) {
      return res.status(400).json({ 
        message: "Outside project geofence",
        distance: distance,
        maxDistance: project.geofenceRadius
      });
    }

    /* 5️⃣ Check if already checked in */
    let attendance = await Attendance.findOne({ employeeId: employee.id, projectId, date: today });
    
    if (attendance && attendance.checkIn && !attendance.checkOut) {
      return res.status(400).json({ 
        message: "Already checked in today",
        checkInTime: attendance.checkIn
      });
    }

    /* 6️⃣ Create or update attendance record */
    if (attendance) {
      attendance.checkIn = new Date();
      attendance.pendingCheckout = true;
      attendance.insideGeofenceAtCheckin = true;
      await attendance.save();
    } else {
      attendance = new Attendance({
        employeeId: employee.id,
        projectId,
        date: today,
        checkIn: new Date(),
        pendingCheckout: true,
        insideGeofenceAtCheckin: true
      });
      await attendance.save();
    }

    /* 7️⃣ Log location */
    const lastLocationLog = await LocationLog.findOne().sort({ id: -1 }).select("id");
    const nextLocationId = lastLocationLog ? lastLocationLog.id + 1 : 1;

    await LocationLog.create({
      id: nextLocationId,
      employeeId: employee.id,
      projectId,
      latitude,
      longitude,
      insideGeofence: true,
      logType: 'CHECK_IN',
      accuracy: accuracy || null
    });

    return res.json({ 
      message: "Clock-in successful",
      checkInTime: attendance.checkIn,
      projectId: projectId,
      location: {
        latitude,
        longitude,
        accuracy: accuracy || null
      }
    });

  } catch (err) {
    console.error("❌ Worker clock-in error:", err);
    res.status(500).json({ message: "Clock-in failed" });
  }
};

/* ---------------------------------------
   CLOCK OUT
--------------------------------------- */
export const clockOut = async (req, res) => {
  try {
    const { projectId, latitude, longitude, accuracy } = req.body;
    const { userId, companyId } = req.user;

    /* 1️⃣ Resolve employee */
    const employee = await Employee.findOne({
      userId,
      companyId,
      status: { $in: ["active", "ACTIVE"] }
    });
    if (!employee) return res.status(403).json({ message: "Unauthorized employee" });

    /* 2️⃣ Validate project */
    const project = await Project.findOne({ id: projectId, companyId });
    if (!project) return res.status(404).json({ message: "Project not found" });

    /* 3️⃣ Get today's attendance */
    const today = getTodayString();
    const attendance = await Attendance.findOne({ employeeId: employee.id, projectId, date: today });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: "Cannot clock out before clocking in" });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ 
        message: "Already clocked out today",
        checkOutTime: attendance.checkOut
      });
    }

    /* 4️⃣ Geofence check */
    const distance = getDistanceFromLatLonInMeters(
      latitude,
      longitude,
      project.latitude,
      project.longitude
    );
    if (distance > project.geofenceRadius) {
      return res.status(400).json({ 
        message: "Outside project geofence",
        distance: distance,
        maxDistance: project.geofenceRadius
      });
    }

    /* 5️⃣ Update attendance record */
    attendance.checkOut = new Date();
    attendance.pendingCheckout = false;
    attendance.insideGeofenceAtCheckout = true;
    await attendance.save();

    /* 6️⃣ Log location */
    const lastLocationLog = await LocationLog.findOne().sort({ id: -1 }).select("id");
    const nextLocationId = lastLocationLog ? lastLocationLog.id + 1 : 1;

    await LocationLog.create({
      id: nextLocationId,
      employeeId: employee.id,
      projectId,
      latitude,
      longitude,
      insideGeofence: true,
      logType: 'CHECK_OUT',
      accuracy: accuracy || null
    });

    /* 7️⃣ Calculate work duration */
    const workDuration = Math.round((attendance.checkOut - attendance.checkIn) / (1000 * 60)); // minutes

    return res.json({ 
      message: "Clock-out successful",
      checkOutTime: attendance.checkOut,
      checkInTime: attendance.checkIn,
      workDuration: workDuration,
      projectId: projectId,
      location: {
        latitude,
        longitude,
        accuracy: accuracy || null
      }
    });

  } catch (err) {
    console.error("❌ Worker clock-out error:", err);
    res.status(500).json({ message: "Clock-out failed" });
  }
};

/* ---------------------------------------
   LUNCH START
--------------------------------------- */
export const lunchStart = async (req, res) => {
  try {
    const { projectId, latitude, longitude, accuracy } = req.body;
    const { userId, companyId } = req.user;

    /* 1️⃣ Resolve employee */
    const employee = await Employee.findOne({
      userId,
      companyId,
      status: { $in: ["active", "ACTIVE"] }
    });
    if (!employee) return res.status(403).json({ message: "Unauthorized employee" });

    /* 2️⃣ Get today's attendance */
    const today = getTodayString();
    const attendance = await Attendance.findOne({ employeeId: employee.id, projectId, date: today });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: "Must be clocked in to start lunch break" });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: "Cannot start lunch break after clocking out" });
    }

    if (attendance.lunchStartTime) {
      return res.status(400).json({ 
        message: "Lunch break already started",
        lunchStartTime: attendance.lunchStartTime
      });
    }

    /* 3️⃣ Update attendance record */
    attendance.lunchStartTime = new Date();
    await attendance.save();

    /* 4️⃣ Log location */
    if (latitude && longitude) {
      const lastLocationLog = await LocationLog.findOne().sort({ id: -1 }).select("id");
      const nextLocationId = lastLocationLog ? lastLocationLog.id + 1 : 1;

      await LocationLog.create({
        id: nextLocationId,
        employeeId: employee.id,
        projectId,
        latitude,
        longitude,
        insideGeofence: true,
        logType: 'LUNCH_START',
        accuracy: accuracy || null
      });
    }

    return res.json({ 
      message: "Lunch break started",
      lunchStartTime: attendance.lunchStartTime,
      projectId: projectId
    });

  } catch (err) {
    console.error("❌ Worker lunch start error:", err);
    res.status(500).json({ message: "Lunch break start failed" });
  }
};

/* ---------------------------------------
   LUNCH END
--------------------------------------- */
export const lunchEnd = async (req, res) => {
  try {
    const { projectId, latitude, longitude, accuracy } = req.body;
    const { userId, companyId } = req.user;

    /* 1️⃣ Resolve employee */
    const employee = await Employee.findOne({
      userId,
      companyId,
      status: { $in: ["active", "ACTIVE"] }
    });
    if (!employee) return res.status(403).json({ message: "Unauthorized employee" });

    /* 2️⃣ Get today's attendance */
    const today = getTodayString();
    const attendance = await Attendance.findOne({ employeeId: employee.id, projectId, date: today });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: "Must be clocked in to end lunch break" });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: "Cannot end lunch break after clocking out" });
    }

    if (!attendance.lunchStartTime) {
      return res.status(400).json({ message: "Lunch break not started" });
    }

    if (attendance.lunchEndTime) {
      return res.status(400).json({ 
        message: "Lunch break already ended",
        lunchEndTime: attendance.lunchEndTime
      });
    }

    /* 3️⃣ Update attendance record */
    attendance.lunchEndTime = new Date();
    await attendance.save();

    /* 4️⃣ Log location */
    if (latitude && longitude) {
      const lastLocationLog = await LocationLog.findOne().sort({ id: -1 }).select("id");
      const nextLocationId = lastLocationLog ? lastLocationLog.id + 1 : 1;

      await LocationLog.create({
        id: nextLocationId,
        employeeId: employee.id,
        projectId,
        latitude,
        longitude,
        insideGeofence: true,
        logType: 'LUNCH_END',
        accuracy: accuracy || null
      });
    }

    /* 5️⃣ Calculate lunch duration */
    const lunchDuration = Math.round((attendance.lunchEndTime - attendance.lunchStartTime) / (1000 * 60)); // minutes

    return res.json({ 
      message: "Lunch break ended",
      lunchEndTime: attendance.lunchEndTime,
      lunchStartTime: attendance.lunchStartTime,
      lunchDuration: lunchDuration,
      projectId: projectId
    });

  } catch (err) {
    console.error("❌ Worker lunch end error:", err);
    res.status(500).json({ message: "Lunch break end failed" });
  }
};

/* ---------------------------------------
   GET ATTENDANCE STATUS
--------------------------------------- */
export const getAttendanceStatus = async (req, res) => {
  try {
    const { userId, companyId } = req.user;
    const { projectId } = req.query;

    // Find employee
    const employee = await Employee.findOne({ userId, companyId });
    if (!employee) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Get today's date
    const today = getTodayString();

    // Find today's attendance record
    let attendance = null;
    if (projectId) {
      attendance = await Attendance.findOne({
        employeeId: employee.id,
        projectId: parseInt(projectId),
        date: today
      });
    } else {
      // Get attendance for any project if no specific project requested
      attendance = await Attendance.findOne({
        employeeId: employee.id,
        date: today
      });
    }

    if (!attendance) {
      return res.json({
        status: 'NOT_CLOCKED_IN',
        session: 'NOT_LOGGED_IN',
        checkInTime: null,
        checkOutTime: null,
        lunchStartTime: null,
        lunchEndTime: null,
        overtimeStartTime: null,
        date: today,
        projectId: projectId ? parseInt(projectId) : null,
        workDuration: 0,
        lunchDuration: 0,
        isOnLunchBreak: false
      });
    }

    // Calculate durations
    let workDuration = 0;
    let lunchDuration = 0;
    
    if (attendance.checkIn) {
      const endTime = attendance.checkOut || new Date();
      workDuration = Math.round((endTime - attendance.checkIn) / (1000 * 60)); // minutes
    }

    if (attendance.lunchStartTime && attendance.lunchEndTime) {
      lunchDuration = Math.round((attendance.lunchEndTime - attendance.lunchStartTime) / (1000 * 60)); // minutes
    }

    // Determine current status
    let status = 'NOT_CLOCKED_IN';
    let session = 'NOT_LOGGED_IN';
    let isOnLunchBreak = false;

    if (attendance.checkOut) {
      status = 'CLOCKED_OUT';
      session = 'CHECKED_OUT';
    } else if (attendance.checkIn) {
      if (attendance.lunchStartTime && !attendance.lunchEndTime) {
        status = 'ON_LUNCH_BREAK';
        session = 'ON_LUNCH';
        isOnLunchBreak = true;
      } else {
        status = 'CLOCKED_IN';
        session = 'CHECKED_IN';
      }
    }

    res.json({
      status: status,
      session: session,
      checkInTime: attendance.checkIn,
      checkOutTime: attendance.checkOut,
      lunchStartTime: attendance.lunchStartTime || null,
      lunchEndTime: attendance.lunchEndTime || null,
      overtimeStartTime: attendance.overtimeStartTime || null,
      date: attendance.date,
      projectId: attendance.projectId,
      workDuration: workDuration,
      lunchDuration: lunchDuration,
      isOnLunchBreak: isOnLunchBreak,
      pendingCheckout: attendance.pendingCheckout || false
    });

  } catch (err) {
    console.error('Error fetching worker attendance status:', err);
    res.status(500).json({ message: "Failed to fetch attendance status" });
  }
};

/* ---------------------------------------
   GET ATTENDANCE HISTORY
--------------------------------------- */
export const getAttendanceHistory = async (req, res) => {
  try {
    const { projectId, startDate, endDate, limit = 30, page = 1 } = req.query;
    const { userId, companyId } = req.user;

    const employee = await Employee.findOne({ userId, companyId });
    if (!employee) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Build query
    const query = {
      employeeId: employee.id
    };

    if (projectId) {
      query.projectId = parseInt(projectId);
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get records with pagination
    const records = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count for pagination
    const totalRecords = await Attendance.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / parseInt(limit));

    // Calculate work durations and format response
    const formattedRecords = records.map(record => {
      let workDuration = 0;
      let lunchDuration = 0;

      if (record.checkIn) {
        const endTime = record.checkOut || new Date();
        workDuration = Math.round((endTime - record.checkIn) / (1000 * 60)); // minutes
      }

      if (record.lunchStartTime && record.lunchEndTime) {
        lunchDuration = Math.round((record.lunchEndTime - record.lunchStartTime) / (1000 * 60)); // minutes
      }

      return {
        date: record.date,
        projectId: record.projectId,
        checkInTime: record.checkIn,
        checkOutTime: record.checkOut,
        lunchStartTime: record.lunchStartTime,
        lunchEndTime: record.lunchEndTime,
        workDuration: workDuration,
        lunchDuration: lunchDuration,
        insideGeofenceAtCheckin: record.insideGeofenceAtCheckin,
        insideGeofenceAtCheckout: record.insideGeofenceAtCheckout,
        overtimeStartTime: record.overtimeStartTime
      };
    });

    res.json({ 
      records: formattedRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: totalPages,
        totalRecords: totalRecords,
        limit: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (err) {
    console.error('Error fetching worker attendance history:', err);
    res.status(500).json({ message: "Failed to fetch attendance history" });
  }
};

/* ---------------------------------------
   GET TODAY'S ATTENDANCE
--------------------------------------- */
export const getTodayAttendance = async (req, res) => {
  try {
    const { userId, companyId } = req.user;
    const { projectId } = req.query;

    // Find employee
    const employee = await Employee.findOne({ userId, companyId });
    if (!employee) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Get today's date
    const today = getTodayString();

    // Find today's attendance record
    let attendance = null;
    if (projectId) {
      attendance = await Attendance.findOne({
        employeeId: employee.id,
        projectId: parseInt(projectId),
        date: today
      });
    } else {
      // Get attendance for any project if no specific project requested
      attendance = await Attendance.findOne({
        employeeId: employee.id,
        date: today
      });
    }

    if (!attendance) {
      return res.json({
        session: 'NOT_LOGGED_IN',
        checkInTime: null,
        checkOutTime: null,
        lunchStartTime: null,
        lunchEndTime: null,
        overtimeStartTime: null,
        date: today,
        projectId: projectId ? parseInt(projectId) : null,
        workDuration: 0,
        lunchDuration: 0,
        isOnLunchBreak: false
      });
    }

    // Calculate durations
    let workDuration = 0;
    let lunchDuration = 0;
    
    if (attendance.checkIn) {
      const endTime = attendance.checkOut || new Date();
      workDuration = Math.round((endTime - attendance.checkIn) / (1000 * 60)); // minutes
    }

    if (attendance.lunchStartTime && attendance.lunchEndTime) {
      lunchDuration = Math.round((attendance.lunchEndTime - attendance.lunchStartTime) / (1000 * 60)); // minutes
    }

    // Determine session status
    let session = 'NOT_LOGGED_IN';
    let isOnLunchBreak = false;

    if (attendance.checkOut) {
      session = 'CHECKED_OUT';
    } else if (attendance.checkIn) {
      if (attendance.lunchStartTime && !attendance.lunchEndTime) {
        session = 'ON_LUNCH';
        isOnLunchBreak = true;
      } else {
        session = 'CHECKED_IN';
      }
    }

    res.json({
      session: session,
      checkInTime: attendance.checkIn,
      checkOutTime: attendance.checkOut,
      lunchStartTime: attendance.lunchStartTime || null,
      lunchEndTime: attendance.lunchEndTime || null,
      overtimeStartTime: attendance.overtimeStartTime || null,
      date: attendance.date,
      projectId: attendance.projectId,
      workDuration: workDuration,
      lunchDuration: lunchDuration,
      isOnLunchBreak: isOnLunchBreak
    });

  } catch (err) {
    console.error('Error fetching today\'s worker attendance:', err);
    res.status(500).json({ message: "Failed to fetch today's attendance" });
  }
};