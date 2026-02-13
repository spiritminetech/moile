// ==============================
// Imports (ESM Syntax)
// ==============================
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";  // ✅ Add mongoose import

import User from "../user/User.js";
import Company from "../company/Company.js";
import Driver from "./Driver.js";
import Employee from "../employee/Employee.js";
import FleetTask from "../fleetTask/models/FleetTask.js";
import FleetVehicle from "../fleetTask/submodules/fleetvehicle/FleetVehicle.js";
import Project from "../project/models/Project.js";
import FleetTaskPassenger from "../fleetTask/submodules/fleetTaskPassenger/FleetTaskPassenger.js";
import TripIncident from "./models/TripIncident.js";
import VehicleRequest from "./models/VehicleRequest.js";
import Attendance from "../attendance/Attendance.js";  // ✅ Add Attendance import
import ApprovedLocation from "../location/ApprovedLocation.js";  // ✅ Add ApprovedLocation import
import FleetTaskPhoto from "../fleetTask/models/FleetTaskPhoto.js";  // ✅ Add FleetTaskPhoto import
import { validateGeofence, isValidCoordinates } from "../../../utils/geofenceUtil.js";  // ✅ Add geofence utilities

// ==============================
// Helper function to safely get or create mongoose models
// ==============================
const getOrCreateModel = (modelName, schema, collectionName) => {
  try {
    return mongoose.model(modelName);
  } catch (error) {
    return mongoose.model(modelName, schema, collectionName);
  }
};

// ==============================
// Multer Configuration for Driver Photo Upload
// ==============================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/drivers/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const userId = req.user?.id || req.user?.userId || "unknown";
    cb(null, `driver-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed!"), false);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ==============================
// Multer Configuration for Trip Photo Upload
// ==============================
const tripPhotoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/trips/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const taskId = req.params.taskId || "unknown";
    cb(null, `trip-${taskId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const uploadTripPhotos = multer({
  storage: tripPhotoStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ==============================
// Multer Configuration for License Photo Upload
// ==============================
const licensePhotoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/drivers/licenses/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const userId = req.user?.id || req.user?.userId || "unknown";
    cb(null, `license-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const uploadLicensePhoto = multer({
  storage: licensePhotoStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ==============================
// Helper function to get next ID
// ==============================
const getNextId = async (Model) => {
  const lastRecord = await Model.findOne().sort({ id: -1 }).limit(1);
  return lastRecord ? lastRecord.id + 1 : 1;
};

// ==============================
// DRIVER PROFILE APIs
// ==============================
export const getDriverProfile = async (req, res) => {
  try {
    const { id, userId, companyId, role } = req.user || {};
    const driverId = Number(id || userId);
    const compId = Number(companyId);

    if (!driverId || !compId) {
      return res.status(400).json({
        success: false,
        message: "Invalid user or company information.",
      });
    }

    // Fetch company, user, driver, and employee details in parallel
    const [company, user, driver, employee] = await Promise.all([
      Company.findOne({ id: compId }),
      User.findOne({ id: driverId }),
      Driver.findOne({ id: driverId }),
      Employee.findOne({ id: driverId }),
    ]);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: `Company with ID ${compId} not found`,
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User details not found",
      });
    }

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver details not found",
      });
    }

    // Get assigned vehicles for this driver
    const assignedVehicles = await FleetVehicle.find({
      driverId: driverId,
      companyId: compId
    }).lean();

    // Get completed trips count for performance summary
    const completedTrips = await FleetTask.countDocuments({
      driverId: driverId,
      companyId: compId,
      status: "COMPLETED"
    });

    // Calculate on-time performance using aggregation
    const onTimeTripsResult = await FleetTask.aggregate([
      {
        $match: {
          driverId: driverId,
          companyId: compId,
          status: "COMPLETED",
          actualEndTime: { $exists: true },
          plannedDropTime: { $exists: true }
        }
      },
      {
        $project: {
          isOnTime: {
            $lte: ["$actualEndTime", "$plannedDropTime"]
          }
        }
      },
      {
        $match: {
          isOnTime: true
        }
      },
      {
        $count: "count"
      }
    ]);

    const onTimeTrips = onTimeTripsResult.length > 0 ? onTimeTripsResult[0].count : 0;
    const onTimePerformance = completedTrips > 0 ? (onTimeTrips / completedTrips) * 100 : 0;

    // Construct profile with all required fields using Driver model
    const profile = {
      user: {
        id: driverId,
        name: driver.employeeName || employee?.fullName || user.email?.split('@')[0] || "Driver",
        email: user.email,
        phone: employee?.phone || user.phone || "N/A",
        profileImage: employee?.photoUrl || employee?.photo_url || null,
        employeeId: driver.employeeCode || driver.employeeId?.toString() || driverId.toString(),
        companyName: company.name || "N/A",
        employmentStatus: driver.status || "ACTIVE"
      },
      driverInfo: {
        licenseNumber: driver.licenseNo || "N/A",
        licenseClass: driver.licenseClass || employee?.licenseClass || "Commercial",
        licenseIssueDate: driver.licenseIssueDate || employee?.licenseIssueDate || null,
        licenseExpiry: driver.licenseExpiry || employee?.licenseExpiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        licenseIssuingAuthority: driver.licenseIssuingAuthority || employee?.licenseIssuingAuthority || "Transport Authority",
        licensePhotoUrl: driver.licensePhotoUrl || employee?.licensePhotoUrl || null,
        yearsOfExperience: employee?.yearsOfExperience || 0,
        specializations: employee?.specializations || []
      },
      emergencyContact: employee?.emergencyContact || {
        name: null,
        relationship: null,
        phone: null
      },
      assignedVehicles: assignedVehicles.map(vehicle => ({
        id: vehicle.id,
        plateNumber: vehicle.registrationNo || vehicle.plateNumber || "N/A",
        model: vehicle.model || vehicle.vehicleModel || vehicle.vehicleType || "N/A",
        isPrimary: vehicle.isPrimary || false
      })),
      certifications: employee?.certifications || [],
      performanceSummary: {
        totalTrips: completedTrips,
        onTimePerformance: Math.round(onTimePerformance * 10) / 10,
        safetyScore: employee?.safetyScore || 95,
        customerRating: employee?.customerRating || 4.5
      }
    };

    return res.json({ 
      success: true, 
      data: profile,
      message: "Driver profile retrieved successfully"
    });

  } catch (err) {
    console.error("Error fetching driver profile:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching driver profile",
      error: err.message,
    });
  }
};

// ==============================
// Update Driver Profile (Phone & Emergency Contact)
// ==============================
export const updateDriverProfile = async (req, res) => {
  try {
    const driverId = Number(req.user.id || req.user.userId);
    const { phone, emergencyContact } = req.body;

    if (!phone && !emergencyContact) {
      return res.status(400).json({
        success: false,
        message: "At least one field (phone or emergencyContact) is required"
      });
    }

    const updateFields = {};
    const updatedFieldsList = [];

    // Update phone if provided
    if (phone) {
      // Basic phone validation
      const phoneRegex = /^\+?[\d\s\-()]+$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number format"
        });
      }
      updateFields.phone = phone.trim();
      updatedFieldsList.push('phone');
    }

    // Update emergency contact if provided
    if (emergencyContact) {
      if (emergencyContact.name || emergencyContact.relationship || emergencyContact.phone) {
        updateFields.emergencyContact = {
          name: emergencyContact.name?.trim() || null,
          relationship: emergencyContact.relationship?.trim() || null,
          phone: emergencyContact.phone?.trim() || null
        };
        updatedFieldsList.push('emergencyContact');
      }
    }

    updateFields.updatedAt = new Date();

    // Update employee record
    const result = await Employee.updateOne(
      { id: driverId },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee record not found"
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      updatedFields: updatedFieldsList
    });

  } catch (err) {
    console.error("❌ Error updating driver profile:", err);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile",
      error: err.message
    });
  }
};


// ==============================
// Change Driver Password
// ==============================
export const changeDriverPassword = async (req, res) => {
  try {
    const driverId = Number(req.user.id || req.user.userId);
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword)
      return res.status(400).json({ success: false, message: "Both passwords required" });

    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: "Password too short" });

    const user = await User.findOne({ id: driverId });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid)
      return res.status(400).json({ success: false, message: "Incorrect current password" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne(
      { id: driverId },
      { $set: { passwordHash: hashedPassword, updatedAt: new Date() } }
    );

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("❌ Error changing password:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ==============================
// Upload Driver Photo
// ==============================
export const uploadDriverPhoto = async (req, res) => {
  try {
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    if (!req.file)
      return res.status(400).json({ success: false, message: "No photo file uploaded" });

    const photoUrl = `/uploads/drivers/${req.file.filename}`;

    await Employee.updateOne(
      { id: driverId },
      { $set: { photoUrl, updatedAt: new Date() } }
    );

    const [employee, company, user] = await Promise.all([
      Employee.findOne({ id: driverId }),
      Company.findOne({ id: companyId }),
      User.findOne({ id: driverId }),
    ]);

    const updatedProfile = {
      id: driverId,
      name: employee.fullName,
      email: user?.email || "N/A",
      phoneNumber: employee.phone || "N/A",
      companyName: company?.name || "N/A",
      role: "driver",
      photoUrl,
    };

    res.json({
      success: true,
      message: "Profile photo updated successfully",
      driver: updatedProfile,
      photoUrl,
    });
  } catch (err) {
    console.error("❌ Error uploading photo:", err);
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ success: false, message: "Upload failed", error: err.message });
  }
};

// ==============================
// DRIVER TASK APIs
// ==============================
export const getTodaysTasks = async (req, res) => {
  try {
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📌 Fetching today's tasks for driver: ${driverId}, company: ${companyId}`);

    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    console.log(`📌 Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    const tasks = await FleetTask.find({
      driverId,
      companyId,
      taskDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).lean();

    console.log(`📌 Found ${tasks.length} tasks for today`);

    if (!tasks.length) {
      return res.json({
        success: true,
        message: 'No tasks found for today',
        data: []
      });
    }

    const projectIds = [...new Set(tasks.map(t => t.projectId))];
    const vehicleIds = [...new Set(tasks.map(t => t.vehicleId))];
    const taskIds = tasks.map(t => t.id);

    const [projects, vehicles, passengerCounts, checkedInCounts, driver] = await Promise.all([
      Project.find({ id: { $in: projectIds } }).lean(),
      FleetVehicle.find({ id: { $in: vehicleIds } }).lean(),
      FleetTaskPassenger.aggregate([
        { $match: { fleetTaskId: { $in: taskIds } } },
        { $group: { _id: "$fleetTaskId", count: { $sum: 1 } } }
      ]),
      // Count checked-in workers by matching with attendance records
      FleetTaskPassenger.aggregate([
        { $match: { fleetTaskId: { $in: taskIds } } },
        // First, lookup the FleetTask to get projectId
        {
          $lookup: {
            from: 'fleetTasks',
            localField: 'fleetTaskId',
            foreignField: 'id',
            as: 'task'
          }
        },
        { $unwind: '$task' },
        // Then lookup attendance records
        {
          $lookup: {
            from: 'attendance',  // Fixed: singular, not plural
            let: { employeeId: '$workerEmployeeId', projectId: '$task.projectId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$employeeId', '$$employeeId'] },
                      { $eq: ['$projectId', '$$projectId'] },
                      { $ne: ['$checkIn', null] }
                    ]
                  }
                }
              }
            ],
            as: 'attendance'
          }
        },
        // Only count workers who have attendance with checkIn
        { $match: { 'attendance.0': { $exists: true } } },
        { $group: { _id: "$fleetTaskId", count: { $sum: 1 } } }
      ]),
      Employee.findOne({ id: driverId, companyId }).lean() // Fetch driver info
    ]);

    const projectMap = Object.fromEntries(projects.map(p => [p.id, p]));
    const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));
    const passengerCountMap = Object.fromEntries(passengerCounts.map(p => [p._id, p.count]));
    const checkedInCountMap = Object.fromEntries(checkedInCounts.map(p => [p._id, p.count]));

    const formatTime = (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    };

    const taskList = tasks.map(task => ({
      taskId: task.id,
      route: `${task.pickupAddress || task.pickupLocation || 'Pickup'} → ${task.dropAddress || task.dropLocation || 'Dropoff'}`,
      pickupLocations: [], // Will be populated by separate API call if needed
      dropoffLocation: {
        name: task.dropAddress || task.dropLocation || 'Drop-off Location',
        address: task.dropAddress || task.dropLocation || 'Location not specified',
        coordinates: {
          latitude: task.dropLatitude || 0,
          longitude: task.dropLongitude || 0
        },
        estimatedArrival: task.plannedDropTime ? new Date(task.plannedDropTime).toISOString() : new Date().toISOString(),
        actualArrival: task.actualEndTime ? new Date(task.actualEndTime).toISOString() : undefined
      },
      status: task.status,
      totalWorkers: passengerCountMap[task.id] || 0,
      checkedInWorkers: checkedInCountMap[task.id] || 0,
      // Legacy fields for backward compatibility
      projectName: projectMap[task.projectId]?.projectName || 'Unknown Project',
      startTime: formatTime(task.plannedPickupTime),
      endTime: formatTime(task.plannedDropTime),
      vehicleNumber: vehicleMap[task.vehicleId]?.registrationNo || 'N/A',
      passengers: passengerCountMap[task.id] || 0,
      pickupLocation: task.pickupAddress || task.pickupLocation || 'Location not specified',
      dropLocation: task.dropAddress || task.dropLocation || 'Location not specified',
      // Driver information
      driverName: driver?.fullName || 'Unknown Driver',
      driverPhone: driver?.phone || 'Not available',
      driverPhoto: driver?.photoUrl || driver?.photo_url || null,
      employeeId: driver?.id || null
    }));

    res.json({
      success: true,
      message: `Found ${taskList.length} tasks for today`,
      data: taskList
    });

  } catch (err) {
    console.error("❌ Error fetching today's tasks:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching today's tasks",
      error: err.message
    });
  }
};

// ==============================
// Trip History
// ==============================
export const getTripHistory = async (req, res) => {
  try {
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);
    const { startDate, endDate } = req.query;

    console.log(`📌 Fetching trip history for driver: ${driverId}, from ${startDate} to ${endDate}`);

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    console.log(`📌 Date range: ${start.toISOString()} to ${end.toISOString()}`);

    const tasks = await FleetTask.find({
      status: "COMPLETED",
      driverId,
      companyId,
      taskDate: {
        $gte: start,
        $lte: end
      }
    })
    .sort({ taskDate: -1 })
    .lean();

    console.log(`📌 Found ${tasks.length} historical tasks`);

    if (!tasks.length) {
      return res.json({
        success: true,
        message: 'No trips found for the selected period',
        trips: []
      });
    }

    const projectIds = [...new Set(tasks.map(t => t.projectId))];
    const vehicleIds = [...new Set(tasks.map(t => t.vehicleId))];
    const taskIds = tasks.map(t => t.id);

    const [projects, vehicles, passengerCounts] = await Promise.all([
      Project.find({ id: { $in: projectIds } }).lean(),
      FleetVehicle.find({ id: { $in: vehicleIds } }).lean(),
      FleetTaskPassenger.aggregate([
        { $match: { fleetTaskId: { $in: taskIds } } },
        { $group: { _id: "$fleetTaskId", count: { $sum: 1 } } }
      ])
    ]);

    const projectMap = Object.fromEntries(projects.map(p => [p.id, p]));
    const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));
    const passengerCountMap = Object.fromEntries(passengerCounts.map(p => [p._id, p.count]));

    const tripHistory = tasks.map(task => ({
      taskId: task.id,
      projectName: projectMap[task.projectId]?.projectName || 'Unknown Project',
      startTime: task.plannedPickupTime,
      endTime: task.plannedDropTime,
      actualStartTime: task.actualStartTime,
      actualEndTime: task.actualEndTime,
      vehicleNumber: vehicleMap[task.vehicleId]?.registrationNo || 'N/A',
      passengers: passengerCountMap[task.id] || 0,
      status: task.status,
      pickupLocation: task.pickupAddress || task.pickupLocation || 'Location not specified',
      dropLocation: task.dropAddress || task.dropLocation || 'Location not specified',
      taskDate: task.taskDate
    }));

    res.json({
      success: true,
      message: `Found ${tripHistory.length} trips`,
      trips: tripHistory
    });

  } catch (err) {
    console.error("❌ Error fetching trip history:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching trip history",
      error: err.message
    });
  }
};

// ==============================
// Task Details
// ==============================
export const getTaskDetails = async (req, res) => {
  try {
    const { taskId } = req.params;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📌 Fetching task details for: ${taskId}, driver: ${driverId}, company: ${companyId}`);

    const numericTaskId = Number(taskId);

    if (!numericTaskId || isNaN(numericTaskId)) {
      console.log('❌ Invalid task ID provided');
      return res.status(400).json({ 
        success: false,
        message: "Invalid task ID" 
      });
    }

    console.log(`📌 Searching for task with numeric ID: ${numericTaskId}`);

    const task = await FleetTask.findOne({
      id: numericTaskId,
      driverId: driverId,
      companyId: companyId
    }).lean();

    console.log(`📌 Task query result:`, task ? 'Found' : 'Not found');

    if (!task) {
      console.log(`❌ Task not found for numeric ID: ${numericTaskId}`);
      return res.status(404).json({ 
        success: false,
        message: "Task not found" 
      });
    }

    console.log(`✅ Task found: ${task._id}, Project ID: ${task.projectId}, Vehicle ID: ${task.vehicleId}`);

    const passengers = await FleetTaskPassenger.find({ 
      fleetTaskId: task.id 
    })
      .select("id name pickupPoint pickupStatus dropStatus")
      .lean();

    console.log(`✅ Found ${passengers.length} passengers`);

    const project = await Project.findOne({ id: task.projectId }).lean();
    console.log(`✅ Project: ${project?.ProjectName || 'Not found'}`);
    
    const vehicle = await FleetVehicle.findOne({ id: task.vehicleId }).lean();
    console.log(`✅ Vehicle: ${vehicle?.registrationNo || 'Not found'}`);

    const response = {
      _id: task._id,
      id: task.id,
      projectName: project?.projectName || 'Unknown Project',
      vehicleNo: vehicle?.registrationNo || 'N/A',
      startTime: task.plannedPickupTime,
      endTime: task.plannedDropTime,
      actualStartTime: task.actualStartTime,
      actualEndTime: task.actualEndTime,
      passengers: passengers.map(p => ({
        id: p.id,
        name: p.name,
        pickupPoint: p.pickupPoint,
        pickupStatus: p.pickupStatus || 'pending',
        dropStatus: p.dropStatus || 'pending'
      })),
      status: task.status,
      pickupLocation: task.pickupAddress || task.pickupLocation || 'Location not specified',
      dropLocation: task.dropAddress || task.dropLocation || 'Location not specified',
      expectedPassengers: task.expectedPassengers || passengers.length
    };

    console.log(`✅ Task details prepared: ${response.projectName} with ${response.passengers.length} passengers`);
    return res.json(response);

  } catch (err) {
    console.error("❌ Error fetching task details:", err);
    console.error("❌ Error stack:", err.stack);
    
    res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: err.message 
    });
  }
};

// ==============================
// Confirm Pickup
// ==============================
export const confirmPickup = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { confirmed = [], missed = [], locationId, workerCount } = req.body;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📌 Confirm pickup for task: ${taskId}, driver: ${driverId}`);
    console.log(`📌 Request body:`, req.body);

    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId: driverId,
      companyId: companyId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not assigned to this driver.",
      });
    }

    // ✅ FIX 1: Validate task is in ONGOING status
    if (task.status !== 'ONGOING') {
      return res.status(400).json({
        success: false,
        message: `Cannot complete pickup. Task is currently in ${task.status} status.`,
        error: 'INVALID_STATUS_FOR_PICKUP',
        currentStatus: task.status,
        requiredStatus: 'ONGOING',
        hint: task.status === 'PLANNED' ? 'Please start the route first.' :
              task.status === 'PICKUP_COMPLETE' ? 'Pickup already completed.' :
              task.status === 'COMPLETED' ? 'Trip already completed.' :
              'Invalid status for pickup completion.'
      });
    }

    // ✅ FIX 2: Get all passengers and validate at least one is checked in
    const allPassengers = await FleetTaskPassenger.find({ 
      fleetTaskId: Number(taskId) 
    }).lean();

    if (allPassengers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No workers assigned to this task.",
        error: 'NO_WORKERS_ASSIGNED'
      });
    }

    const checkedInPassengers = allPassengers.filter(p => 
      p.pickupStatus === 'confirmed'
    );

    // ✅ FIX 3: Require at least one worker to be checked in
    if (checkedInPassengers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot complete pickup: No workers have been checked in yet.",
        error: 'NO_WORKERS_CHECKED_IN',
        details: {
          totalWorkers: allPassengers.length,
          checkedInWorkers: 0,
          message: 'Please check in at least one worker before completing pickup.'
        }
      });
    }

    // ✅ FIX 4: Warn if not all workers are checked in
    if (checkedInPassengers.length < allPassengers.length) {
      console.log(`⚠️ Warning: Only ${checkedInPassengers.length} of ${allPassengers.length} workers checked in`);
      // Allow completion but log warning
    }

    // Handle new format (locationId + workerCount) from transport tasks screen
    if (locationId !== undefined && workerCount !== undefined) {
      console.log(`📌 Using new format: locationId=${locationId}, workerCount=${workerCount}`);
      console.log(`📌 Completing pickup with ${workerCount} workers at location ${locationId}`);
      
      // Validate workerCount matches checked-in count
      if (workerCount !== checkedInPassengers.length) {
        console.log(`⚠️ Warning: Reported workerCount (${workerCount}) doesn't match checked-in count (${checkedInPassengers.length})`);
      }
    } 
    // Handle old format (confirmed/missed arrays)
    else {
      console.log(`📌 Using old format: confirmed=${confirmed.length}, missed=${missed.length}`);
      
      if (confirmed.length > 0) {
        await FleetTaskPassenger.updateMany(
          { 
            fleetTaskId: Number(taskId), 
            id: { $in: confirmed.map(id => Number(id)) } 
          },
          {
            $set: {
              pickupStatus: "confirmed",
              pickupConfirmedAt: new Date(),
            },
          }
        );
      }

      if (missed.length > 0) {
        await FleetTaskPassenger.updateMany(
          { 
            fleetTaskId: Number(taskId), 
            id: { $in: missed.map(id => Number(id)) } 
          },
          {
            $set: {
              pickupStatus: "missed",
              pickupConfirmedAt: new Date(),
            },
          }
        );
      }
    }

    const currentTime = new Date();
    
    // Determine the new status - always set to PICKUP_COMPLETE
    // (EN_ROUTE_DROPOFF is set automatically when driver starts driving)
    const newStatus = 'PICKUP_COMPLETE';
    
    await FleetTask.updateOne(
      { id: Number(taskId) },
      {
        $set: {
          status: newStatus,
          actualStartTime: task.actualStartTime || currentTime,
          updatedAt: currentTime
        }
      }
    );

    const [updatedTask, updatedPassengers, project, vehicle] = await Promise.all([
      FleetTask.findOne({ id: Number(taskId) }).lean(),
      FleetTaskPassenger.find({ fleetTaskId: Number(taskId) }).lean(),
      Project.findOne({ id: task.projectId }).lean(),
      FleetVehicle.findOne({ id: task.vehicleId }).lean()
    ]);

    const response = {
      success: true,
      message: "Pickup confirmed successfully",
      status: updatedTask.status,
      task: {
        _id: updatedTask._id,
        id: updatedTask.id,
        projectName: project?.projectName || 'Unknown Project',
        vehicleNo: vehicle?.registrationNo || 'N/A',
        startTime: updatedTask.plannedPickupTime,
        endTime: updatedTask.plannedDropTime,
        actualStartTime: updatedTask.actualStartTime,
        status: updatedTask.status,
        pickupLocation: updatedTask.pickupAddress || updatedTask.pickupLocation,
        dropLocation: updatedTask.dropAddress || updatedTask.dropLocation
      },
      updatedPassengers: updatedPassengers.map(p => ({
        id: p.id,
        name: p.name,
        pickupPoint: p.pickupPoint,
        pickupStatus: p.pickupStatus || 'pending',
        dropStatus: p.dropStatus || 'pending'
      })),
      summary: {
        totalWorkers: allPassengers.length,
        checkedInWorkers: checkedInPassengers.length,
        missedWorkers: allPassengers.length - checkedInPassengers.length
      }
    };

    console.log(`✅ Pickup confirmed for task ${taskId}`);
    console.log(`✅ Task status updated to: ${updatedTask.status}`);
    console.log(`✅ Workers checked in: ${checkedInPassengers.length}/${allPassengers.length}`);
    
    return res.status(200).json(response);

  } catch (err) {
    console.error("❌ Pickup confirmation error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during pickup confirmation.",
      error: err.message,
    });
  }
};

// ==============================
// Confirm Drop
// ==============================
export const confirmDrop = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { confirmed = [], missed = [], workerCount } = req.body;
    
    // ✅ Parse workerIds from JSON string if provided
    let workerIds = req.body.workerIds;
    if (typeof workerIds === 'string') {
      try {
        workerIds = JSON.parse(workerIds);
      } catch (e) {
        console.log('⚠️ Failed to parse workerIds:', e);
        workerIds = undefined;
      }
    }
    
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📌 Confirm drop for task: ${taskId}, driver: ${driverId}`);
    console.log(`📌 Request body:`, req.body);

    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId: driverId,
      companyId: companyId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not assigned to this driver.",
      });
    }

    // ✅ FIX 1: Validate task is in correct status for dropoff
    const validDropoffStatuses = ['PICKUP_COMPLETE', 'EN_ROUTE_DROPOFF'];
    if (!validDropoffStatuses.includes(task.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot complete dropoff. Task is currently in ${task.status} status.`,
        error: 'INVALID_STATUS_FOR_DROPOFF',
        currentStatus: task.status,
        requiredStatus: validDropoffStatuses,
        hint: task.status === 'PLANNED' ? 'Please start the route first.' :
              task.status === 'ONGOING' ? 'Please complete pickup first.' :
              task.status === 'COMPLETED' ? 'Trip already completed.' :
              'Invalid status for dropoff completion.'
      });
    }

    // ✅ FIX 2: Validate at least one worker was picked up
    const allPassengers = await FleetTaskPassenger.find({ 
      fleetTaskId: Number(taskId)
    }).lean();
    
    const pickedUpPassengers = allPassengers.filter(p => p.pickupStatus === "confirmed");
    
    if (pickedUpPassengers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot complete dropoff: No workers were picked up.",
        error: 'NO_WORKERS_PICKED_UP',
        details: {
          totalWorkers: allPassengers.length,
          pickedUpWorkers: 0,
          message: 'You must pick up at least one worker before completing dropoff.'
        }
      });
    }

    // Handle new format (workerCount) from transport tasks screen
    if (workerCount !== undefined) {
      console.log(`📌 Using new format: workerCount=${workerCount}`);
      console.log(`📌 workerIds provided: ${workerIds ? JSON.stringify(workerIds) : 'NO (undefined or null)'}`);
      console.log(`📌 workerIds type: ${typeof workerIds}`);
      console.log(`📌 workerIds is array: ${Array.isArray(workerIds)}`);
      
      const droppedPassengers = allPassengers.filter(p => p.dropStatus === "confirmed");
      
      console.log(`📊 Task completion summary:`);
      console.log(`   Total passengers: ${allPassengers.length}`);
      console.log(`   Picked up: ${pickedUpPassengers.length}`);
      console.log(`   Already dropped: ${droppedPassengers.length}`);
      console.log(`   Reported workerCount: ${workerCount}`);
      
      // Log current status BEFORE any updates
      console.log(`📊 Current passenger status (BEFORE update):`);
      allPassengers.forEach(p => {
        console.log(`   Worker ${p.workerEmployeeId}: pickup=${p.pickupStatus}, drop=${p.dropStatus}`);
      });
      
      // ✅ PRODUCTION LOGIC: Support both individual and bulk drop
      
      // Option 1: Driver app sends specific workerIds (for "pick 3, drop 2" scenario)
      if (workerIds && Array.isArray(workerIds) && workerIds.length > 0) {
        console.log(`👤 Individual drop: Updating ${workerIds.length} specific workers`);
        console.log(`   Worker IDs to update: ${workerIds.join(', ')}`);
        
        // ✅ FIX: Log the exact query being used
        const query = { 
          fleetTaskId: Number(taskId),
          workerEmployeeId: { $in: workerIds.map(id => Number(id)) }
        };
        console.log(`   Query:`, JSON.stringify(query));
        
        // ✅ FIX: First check if documents exist
        const existingDocs = await FleetTaskPassenger.find(query).lean();
        console.log(`   Found ${existingDocs.length} matching documents`);
        existingDocs.forEach(doc => {
          console.log(`     - Worker ${doc.workerEmployeeId}: current dropStatus="${doc.dropStatus}"`);
        });
        
        // ✅ FIX: Use updateMany with explicit write concern
        const updateResult = await FleetTaskPassenger.updateMany(
          query,
          {
            $set: {
              dropStatus: "confirmed",
              dropConfirmedAt: new Date(),
            },
          },
          { writeConcern: { w: 'majority' } }  // ✅ Ensure write is committed
        );
        
        console.log(`✅ Update result: matched=${updateResult.matchedCount}, modified=${updateResult.modifiedCount}`);
        
        // ✅ FIX: Verify the update worked
        const updatedDocs = await FleetTaskPassenger.find(query).lean();
        console.log(`   After update:`);
        updatedDocs.forEach(doc => {
          console.log(`     - Worker ${doc.workerEmployeeId}: dropStatus="${doc.dropStatus}"`);
        });
        
        // ✅ FIX: If update didn't work, try individual updates
        if (updateResult.modifiedCount === 0 && existingDocs.length > 0) {
          console.log(`⚠️ Bulk update failed, trying individual updates...`);
          for (const workerId of workerIds) {
            const singleUpdate = await FleetTaskPassenger.findOneAndUpdate(
              { 
                fleetTaskId: Number(taskId),
                workerEmployeeId: Number(workerId)
              },
              {
                $set: {
                  dropStatus: "confirmed",
                  dropConfirmedAt: new Date(),
                }
              },
              { new: true }
            );
            console.log(`   Updated worker ${workerId}: ${singleUpdate ? 'SUCCESS' : 'FAILED'}`);
          }
        }
      }
      // Option 2: Workers already checked out via checkOutWorker endpoint
      else if (droppedPassengers.length > 0) {
        console.log(`👤 ${droppedPassengers.length} workers already checked out via checkOutWorker`);
        console.log(`   No additional updates needed`);
      }
      // Option 3: No workerIds AND no workers checked out yet - DO NOT AUTO-UPDATE
      else {
        console.log(`⚠️ WARNING: No workerIds provided and no workers checked out yet!`);
        console.log(`⚠️ This means driver completed drop without selecting any workers.`);
        console.log(`⚠️ NOT updating passenger status automatically.`);
        console.log(`⚠️ Driver app should either:`);
        console.log(`   1. Send workerIds array with specific workers to drop, OR`);
        console.log(`   2. Call checkOutWorker for each worker before completing drop`);
      }
      
      // Log final status AFTER updates
      const finalPassengers = await FleetTaskPassenger.find({ 
        fleetTaskId: Number(taskId)
      }).lean();
      
      console.log(`📊 Final passenger status (AFTER update):`);
      finalPassengers.forEach(p => {
        console.log(`   Worker ${p.workerEmployeeId}: pickup=${p.pickupStatus}, drop=${p.dropStatus}`);
      });
    } 
    // Handle old format (confirmed/missed arrays)
    else {
      console.log(`📌 Using old format: confirmed=${confirmed.length}, missed=${missed.length}`);
      
      // ✅ Individual workers are checked out via checkOutWorker endpoint
      // This endpoint is only called when driver clicks "Complete Drop" button
      // At this point, individual workers should already have their dropStatus updated
      // So we don't need to update passenger records here - just update task status
      
      if (confirmed.length > 0) {
        await FleetTaskPassenger.updateMany(
          { 
            fleetTaskId: Number(taskId), 
            id: { $in: confirmed.map(id => Number(id)) } 
          },
          {
            $set: {
              dropStatus: "confirmed",
              dropConfirmedAt: new Date(),
            },
          }
        );
        console.log(`✅ Marked ${confirmed.length} passengers as confirmed drop`);
      }

      if (missed.length > 0) {
        await FleetTaskPassenger.updateMany(
          { 
            fleetTaskId: Number(taskId), 
            id: { $in: missed.map(id => Number(id)) } 
          },
          {
            $set: {
              dropStatus: "missed",
              dropConfirmedAt: new Date(),
            },
          }
        );
        console.log(`✅ Marked ${missed.length} passengers as missed drop`);
      }
      
      // Log current passenger status for debugging
      const passengers = await FleetTaskPassenger.find({ fleetTaskId: Number(taskId) }).lean();
      console.log(`📊 Passenger drop status summary:`);
      passengers.forEach(p => {
        console.log(`   Worker ${p.workerEmployeeId}: pickup=${p.pickupStatus}, drop=${p.dropStatus}`);
      });
    }

    const currentTime = new Date();
    await FleetTask.updateOne(
      { id: Number(taskId) },
      {
        $set: {
          status: "COMPLETED",
          actualEndTime: currentTime,
          updatedAt: currentTime
        }
      }
    );

    const [updatedTask, updatedPassengers, project, vehicle] = await Promise.all([
      FleetTask.findOne({ id: Number(taskId) }).lean(),
      FleetTaskPassenger.find({ fleetTaskId: Number(taskId) }).lean(),
      Project.findOne({ id: task.projectId }).lean(),
      FleetVehicle.findOne({ id: task.vehicleId }).lean()
    ]);

    const response = {
      success: true,
      message: "Drop-off confirmed successfully",
      status: updatedTask.status,
      task: {
        _id: updatedTask._id,
        id: updatedTask.id,
        projectName: project?.projectName || 'Unknown Project',
        vehicleNo: vehicle?.registrationNo || 'N/A',
        startTime: updatedTask.plannedPickupTime,
        endTime: updatedTask.plannedDropTime,
        actualStartTime: updatedTask.actualStartTime,
        actualEndTime: updatedTask.actualEndTime,
        status: updatedTask.status,
        pickupLocation: updatedTask.pickupAddress || updatedTask.pickupLocation,
        dropLocation: updatedTask.dropAddress || updatedTask.dropLocation
      },
      updatedPassengers: updatedPassengers.map(p => ({
        id: p.id,
        name: p.name,
        pickupPoint: p.pickupPoint,
        pickupStatus: p.pickupStatus || 'pending',
        dropStatus: p.dropStatus || 'pending'
      }))
    };

    console.log(`✅ Drop confirmed for task ${taskId}`);
    console.log(`✅ Task status updated to: ${updatedTask.status}`);
    console.log(`✅ Actual end time set to: ${currentTime}`);
    
    return res.status(200).json(response);

  } catch (err) {
    console.error("❌ Drop confirmation error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during drop confirmation.",
      error: err.message,
    });
  }
};


// ==============================
// Trip Summary
// ==============================
export const getTripSummary = async (req, res) => {
  try {
    const { taskId } = req.params;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📌 Fetching trip summary for task: ${taskId}, driver: ${driverId}`);

    const numericTaskId = Number(taskId);

    // 🧭 Find the Fleet Task assigned to this driver
    const task = await FleetTask.findOne({
      id: numericTaskId,
      driverId: driverId,
      companyId: companyId
    }).lean();

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not assigned to this driver.",
      });
    }

    console.log(`📌 Fetching driver details for driverId: ${driverId}`);

    // ✅ Get driver name from Employee collection using 'id' (not userId)
    let employee = await Employee.findOne({ id: driverId }).lean();
    let driverName = employee?.fullName;

    console.log("employees:", employee);

    console.log(`✅ Driver Name: ${driverName}`);

    // 🧾 Get passenger stats
    const passengers = await FleetTaskPassenger.find({
      fleetTaskId: numericTaskId
    }).lean();

    const totalPassengers = passengers.length;
    const pickedUp = passengers.filter(p => p.pickupStatus === 'confirmed').length;
    const dropped = passengers.filter(p => p.dropStatus === 'confirmed').length;
    const missedPickups = passengers.filter(p => p.pickupStatus === 'missed').length;
    const missedDrops = passengers.filter(p => p.dropStatus === 'missed').length;
    const totalMissed = missedPickups + missedDrops;

    // 🕒 Duration calculation
    let durationMinutes = 0;
    if (task.actualStartTime && task.actualEndTime) {
      const start = new Date(task.actualStartTime);
      const end = new Date(task.actualEndTime);
      durationMinutes = Math.ceil((end - start) / (1000 * 60));
    } else if (task.plannedPickupTime && task.plannedDropTime) {
      const start = new Date(task.plannedPickupTime);
      const end = new Date(task.plannedDropTime);
      durationMinutes = Math.ceil((end - start) / (1000 * 60));
    }

    const formatDate = (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    };

    console.log(`⏱️ Duration calculation: ${durationMinutes} minutes`);

    // 🔗 Fetch related project & vehicle
    const [project, vehicle] = await Promise.all([
      Project.findOne({ id: task.projectId }).lean(),
      FleetVehicle.findOne({ id: task.vehicleId }).lean()
    ]);

    // 🧩 Prepare Summary Object
    const summary = {
      _id: task._id,
      id: task.id,
      projectName: project?.projectName || 'Unknown Project',
      vehicleNo: vehicle?.registrationNo || 'N/A',
      driverName: driverName, 
      driverId: driverId,
      totalPassengers: totalPassengers,
      pickedUp: totalPassengers,
      dropped: totalPassengers,
      missed: totalMissed,
      durationMinutes: durationMinutes,
      startTime: task.plannedPickupTime,
      endTime: task.plannedDropTime,
      actualStartTime: task.actualStartTime,
      actualEndTime: task.actualEndTime,
      status: task.status,
      pickupLocation: task.pickupAddress || task.pickupLocation || 'Location not specified',
      dropLocation: task.dropAddress || task.dropLocation || 'Location not specified',
      taskDate: task.taskDate,
      formattedDate: formatDate(task.taskDate),
      pickupConfirmedAt: task.actualStartTime,
      dropConfirmedAt: task.actualEndTime
    };

    console.log(`✅ Trip summary prepared for task ${taskId}`);
    console.log(`👨‍✈️ Driver: ${driverName}`);
    res.json(summary);

  } catch (err) {
    console.error("❌ Error fetching trip summary:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching trip summary.",
      error: err.message,
    });
  }
};


// ==============================
// DASHBOARD SUMMARY
// ==============================
export const getDashboardSummary = async (req, res) => {
  try {
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📊 Fetching dashboard summary for driver: ${driverId}`);

    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    // Get today's tasks
    const todaysTasks = await FleetTask.find({
      driverId,
      companyId,
      taskDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).lean();

    const totalTrips = todaysTasks.length;
    const completedTrips = todaysTasks.filter(t => t.status === 'COMPLETED').length;
    const ongoingTrips = todaysTasks.filter(t => t.status === 'ONGOING').length;
    const pendingTrips = todaysTasks.filter(t => t.status === 'PENDING' || t.status === 'SCHEDULED').length;

    // Get total passengers for today
    const taskIds = todaysTasks.map(t => t.id);
    const totalPassengers = await FleetTaskPassenger.countDocuments({
      fleetTaskId: { $in: taskIds }
    });

    // Get current vehicle assignment
    let currentVehicle = null;
    const currentTask = todaysTasks.find(t => t.status === 'ONGOING' || t.status === 'PENDING' || t.status === 'SCHEDULED');
    if (currentTask && currentTask.vehicleId) {
      const vehicle = await FleetVehicle.findOne({ id: currentTask.vehicleId }).lean();
      if (vehicle) {
        currentVehicle = {
          id: vehicle.id,
          registrationNo: vehicle.registrationNo,
          vehicleType: vehicle.vehicleType,
          capacity: vehicle.capacity
        };
      }
    }

    // Get driver info
    const driver = await Employee.findOne({ id: driverId }).lean();

    const summary = {
      driverId,
      driverName: driver?.fullName || 'Unknown Driver',
      driverPhoto: driver?.photoUrl || driver?.photo_url || null,
      totalTrips,
      completedTrips,
      ongoingTrips,
      pendingTrips,
      totalPassengers,
      currentVehicle,
      date: startOfDay
    };

    res.json({
      success: true,
      message: 'Dashboard summary retrieved successfully',
      summary
    });

  } catch (err) {
    console.error("❌ Error fetching dashboard summary:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard summary",
      error: err.message
    });
  }
};

// ==============================
// DRIVER PERFORMANCE METRICS
// ==============================
export const getDriverPerformanceMetrics = async (req, res) => {
  try {
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);
    const period = req.query.period || 'month'; // week, month, quarter

    console.log(`📊 Fetching performance metrics for driver: ${driverId}, period: ${period}`);

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Get all tasks in the period
    const tasks = await FleetTask.find({
      driverId,
      companyId,
      taskDate: {
        $gte: startDate,
        $lte: now
      }
    }).lean();

    const totalTripsCompleted = tasks.filter(t => t.status === 'COMPLETED').length;
    const onTimeTrips = tasks.filter(t => 
      t.status === 'COMPLETED' && 
      (!t.actualPickupTime || !t.scheduledPickupTime || 
       new Date(t.actualPickupTime) <= new Date(t.scheduledPickupTime))
    ).length;

    const onTimePerformance = totalTripsCompleted > 0 
      ? Math.round((onTimeTrips / totalTripsCompleted) * 100) 
      : 0;

    // Calculate total distance (if available in tasks)
    const totalDistance = tasks.reduce((sum, task) => {
      return sum + (task.distance || 0);
    }, 0);

    // Get incident count
    const incidentCount = await TripIncident.countDocuments({
      driverId,
      createdAt: {
        $gte: startDate,
        $lte: now
      }
    });

    const performanceMetrics = {
      onTimePerformance,
      totalTripsCompleted,
      totalDistance: Math.round(totalDistance),
      averageFuelEfficiency: 0, // TODO: Calculate from fuel logs when available
      safetyScore: incidentCount === 0 ? 100 : Math.max(0, 100 - (incidentCount * 10)),
      customerRating: 0, // TODO: Calculate from customer feedback when available
      incidentCount
    };

    res.json({
      success: true,
      message: 'Performance metrics retrieved successfully',
      data: performanceMetrics
    });

  } catch (err) {
    console.error("❌ Error fetching performance metrics:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching performance metrics",
      error: err.message
    });
  }
};

// ==============================
// VEHICLE DETAILS
// ==============================
export const getVehicleDetails = async (req, res) => {
  try {
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`🚗 Fetching vehicle details for driver: ${driverId}`);

    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    // Find today's tasks to get assigned vehicle
    const todaysTasks = await FleetTask.find({
      driverId,
      companyId,
      taskDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).lean();

    if (!todaysTasks.length) {
      return res.json({
        success: true,
        message: 'No vehicle assigned for today',
        vehicle: null
      });
    }

    // Get the vehicle from the first task (assuming same vehicle for all tasks in a day)
    const vehicleId = todaysTasks[0].vehicleId;
    const vehicle = await FleetVehicle.findOne({ id: vehicleId }).lean();

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle details not found'
      });
    }

    const vehicleDetails = {
      id: vehicle.id,
      plateNumber: vehicle.registrationNo, // Map registrationNo to plateNumber
      model: vehicle.vehicleType || 'Unknown', // Map vehicleType to model
      year: vehicle.year || vehicle.manufacturingYear || new Date().getFullYear(), // Use year or current year as fallback
      vehicleCode: vehicle.vehicleCode,
      registrationNo: vehicle.registrationNo, // Keep for backward compatibility
      vehicleType: vehicle.vehicleType,
      capacity: vehicle.capacity,
      fuelType: vehicle.fuelType || 'Diesel',
      currentMileage: vehicle.odometer || vehicle.currentMileage || 0, // Map odometer to currentMileage
      fuelLevel: vehicle.fuelLevel || 75, // Use actual fuel level or default to 75%
      status: vehicle.status,
      assignedDriverName: vehicle.assignedDriverName, // Driver name if available
      
      // Insurance information
      insurance: vehicle.insuranceExpiry ? {
        policyNumber: vehicle.insurancePolicyNumber || 'N/A',
        provider: vehicle.insuranceProvider || 'N/A',
        expiryDate: vehicle.insuranceExpiry,
        status: getInsuranceStatus(vehicle.insuranceExpiry)
      } : undefined,
      
      // Road tax information
      roadTax: vehicle.roadTaxExpiry ? {
        validUntil: vehicle.roadTaxExpiry,
        status: getRoadTaxStatus(vehicle.roadTaxExpiry)
      } : undefined,
      
      insuranceExpiry: vehicle.insuranceExpiry,
      lastServiceDate: vehicle.lastServiceDate,
      nextServiceDate: vehicle.nextServiceDate,
      lastServiceMileage: vehicle.lastServiceMileage,
      nextServiceMileage: vehicle.nextServiceMileage,
      odometer: vehicle.odometer,
      assignedTasks: todaysTasks.length,
      
      // Maintenance schedule - empty for now, can be populated from maintenance records
      maintenanceSchedule: [],
      
      // Fuel log - load from fuelLogs collection
      fuelLog: [],
      
      // Include predefined route information
      assignedRoute: vehicle.assignedRoute ? {
        routeName: vehicle.assignedRoute.routeName,
        routeCode: vehicle.assignedRoute.routeCode,
        pickupLocations: vehicle.assignedRoute.pickupLocations || [],
        dropoffLocation: vehicle.assignedRoute.dropoffLocation,
        estimatedDistance: vehicle.assignedRoute.estimatedDistance,
        estimatedDuration: vehicle.assignedRoute.estimatedDuration
      } : null
    };

    // Load fuel log data from fuelLogs collection
    try {
      const FuelLog = (await import('./models/FuelLog.js')).default;
      const fuelLogs = await FuelLog.find({ vehicleId: vehicle.id })
        .sort({ date: -1 })
        .limit(5)
        .lean();
      
      vehicleDetails.fuelLog = fuelLogs.map(log => ({
        id: log.id,
        date: log.date,
        amount: log.amount,
        cost: log.cost,
        mileage: log.mileage,
        location: log.location,
        receiptPhoto: log.receiptPhoto
      }));
      
      console.log(`✅ Loaded ${fuelLogs.length} fuel log entries for vehicle ${vehicle.id}`);
    } catch (fuelLogError) {
      console.warn('⚠️ Could not load fuel logs:', fuelLogError.message);
      // Continue without fuel logs if there's an error
    }

    // Debug logging
    console.log('🚗 Vehicle from DB:', {
      id: vehicle.id,
      registrationNo: vehicle.registrationNo,
      odometer: vehicle.odometer,
      fuelLevel: vehicle.fuelLevel
    });
    console.log('🚗 Vehicle details being sent:', {
      plateNumber: vehicleDetails.plateNumber,
      currentMileage: vehicleDetails.currentMileage,
      fuelLevel: vehicleDetails.fuelLevel
    });

    // Helper function to determine insurance status
    function getInsuranceStatus(expiryDate) {
      if (!expiryDate) return 'expired';
      const expiry = new Date(expiryDate);
      const now = new Date();
      const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) return 'expired';
      if (daysUntilExpiry <= 30) return 'expiring_soon';
      return 'active';
    }

    // Helper function to determine road tax status
    function getRoadTaxStatus(expiryDate) {
      if (!expiryDate) return 'expired';
      const expiry = new Date(expiryDate);
      const now = new Date();
      const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) return 'expired';
      if (daysUntilExpiry <= 30) return 'expiring_soon';
      return 'active';
    }

    res.json({
      success: true,
      message: 'Vehicle details retrieved successfully',
      vehicle: vehicleDetails
    });

  } catch (err) {
    console.error("❌ Error fetching vehicle details:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching vehicle details",
      error: err.message
    });
  }
};

// ==============================
// VEHICLE MAINTENANCE ALERTS
// ==============================
export const getMaintenanceAlerts = async (req, res) => {
  try {
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`🔧 Fetching maintenance alerts for driver: ${driverId}`);

    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    // Find today's tasks to get assigned vehicle
    const todaysTasks = await FleetTask.find({
      driverId,
      companyId,
      taskDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).lean();

    if (!todaysTasks.length) {
      return res.json({
        success: true,
        message: 'No vehicle assigned for today',
        data: []
      });
    }

    // Get the vehicle from the first task
    const vehicleId = todaysTasks[0].vehicleId;
    const vehicle = await FleetVehicle.findOne({ id: vehicleId }).lean();

    if (!vehicle) {
      return res.json({
        success: true,
        message: 'Vehicle not found',
        data: []
      });
    }

    const alerts = [];
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    // Check insurance expiry
    if (vehicle.insuranceExpiry) {
      const insuranceDate = new Date(vehicle.insuranceExpiry);
      if (insuranceDate < now) {
        alerts.push({
          id: alerts.length + 1,
          vehicleId: vehicle.id,
          type: 'insurance',
          title: 'Insurance Expired',
          description: 'Vehicle insurance has expired',
          dueDate: vehicle.insuranceExpiry,
          priority: 'critical',
          status: 'overdue'
        });
      } else if (insuranceDate < thirtyDaysFromNow) {
        alerts.push({
          id: alerts.length + 1,
          vehicleId: vehicle.id,
          type: 'insurance',
          title: 'Insurance Renewal Due',
          description: `Insurance expires in ${Math.ceil((insuranceDate - now) / (24 * 60 * 60 * 1000))} days`,
          dueDate: vehicle.insuranceExpiry,
          priority: 'high',
          status: 'upcoming'
        });
      } else if (insuranceDate < sixtyDaysFromNow) {
        alerts.push({
          id: alerts.length + 1,
          vehicleId: vehicle.id,
          type: 'insurance',
          title: 'Insurance Renewal',
          description: `Insurance expires in ${Math.ceil((insuranceDate - now) / (24 * 60 * 60 * 1000))} days`,
          dueDate: vehicle.insuranceExpiry,
          priority: 'medium',
          status: 'upcoming'
        });
      }
    }

    // Check last service date (assume service needed every 90 days)
    if (vehicle.lastServiceDate) {
      const lastService = new Date(vehicle.lastServiceDate);
      const nextServiceDue = new Date(lastService.getTime() + 90 * 24 * 60 * 60 * 1000);
      
      if (nextServiceDue < now) {
        alerts.push({
          id: alerts.length + 1,
          vehicleId: vehicle.id,
          type: 'service',
          title: 'Service Overdue',
          description: 'Regular service is overdue',
          dueDate: nextServiceDue,
          priority: 'high',
          status: 'overdue'
        });
      } else if (nextServiceDue < thirtyDaysFromNow) {
        alerts.push({
          id: alerts.length + 1,
          vehicleId: vehicle.id,
          type: 'service',
          title: 'Service Due Soon',
          description: `Service due in ${Math.ceil((nextServiceDue - now) / (24 * 60 * 60 * 1000))} days`,
          dueDate: nextServiceDue,
          priority: 'medium',
          status: 'upcoming'
        });
      }
    }

    // Check odometer for service (assume service every 10,000 km)
    if (vehicle.odometer) {
      const nextServiceMileage = Math.ceil(vehicle.odometer / 10000) * 10000;
      const remainingKm = nextServiceMileage - vehicle.odometer;
      
      if (remainingKm < 500) {
        alerts.push({
          id: alerts.length + 1,
          vehicleId: vehicle.id,
          type: 'service',
          title: 'Mileage Service Due',
          description: `Service due in ${remainingKm} km`,
          dueMileage: nextServiceMileage,
          priority: remainingKm < 100 ? 'high' : 'medium',
          status: 'upcoming'
        });
      }
    }

    res.json({
      success: true,
      message: 'Maintenance alerts retrieved successfully',
      data: alerts
    });

  } catch (err) {
    console.error("❌ Error fetching maintenance alerts:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching maintenance alerts",
      error: err.message
    });
  }
};

// ==============================
// DELAY REPORT
// ==============================
// DELAY REPORT WITH GRACE PERIOD APPLICATION
// ==============================
export const reportDelay = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { delayReason, estimatedDelay, currentLocation, description, photoUrls } = req.body;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`⏰ Reporting delay for task: ${taskId}, driver: ${driverId}`);

    if (!delayReason || !estimatedDelay) {
      return res.status(400).json({
        success: false,
        message: 'Delay reason and estimated delay are required'
      });
    }

    // Verify task belongs to driver
    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId,
      companyId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not assigned to this driver'
      });
    }

    // Create incident record
    const incidentId = await getNextId(TripIncident);
    const incident = new TripIncident({
      id: incidentId,
      fleetTaskId: Number(taskId),
      driverId,
      companyId,
      incidentType: 'DELAY',
      description: description || delayReason,
      delayReason,
      estimatedDelay: Number(estimatedDelay),
      location: currentLocation || {},
      photoUrls: photoUrls || [],
      requiresAssistance: false,
      status: 'REPORTED'
    });

    await incident.save();

    // ✅ FIX #7: APPLY GRACE PERIOD TO WORKER ATTENDANCE
    try {
      // Get all workers on this transport task
      const passengers = await FleetTaskPassenger.find({
        fleetTaskId: Number(taskId),
        companyId: companyId,
        status: { $in: ['ASSIGNED', 'PICKED_UP'] }
      });

      console.log(`📋 Found ${passengers.length} workers to apply grace period`);

      // Apply grace period to each worker's attendance
      const today = new Date().toISOString().split('T')[0];
      let graceAppliedCount = 0;

      for (const passenger of passengers) {
        const attendanceUpdate = await Attendance.updateOne(
          {
            employeeId: passenger.workerId,
            date: today,
            companyId: companyId
          },
          {
            $set: {
              graceApplied: true,
              graceReason: `Transport delay: ${delayReason}`,
              graceMinutes: Number(estimatedDelay),
              transportDelayId: incident.id,
              updatedAt: new Date()
            }
          }
        );

        if (attendanceUpdate.modifiedCount > 0) {
          graceAppliedCount++;
        }
      }

      console.log(`✅ Grace period applied to ${graceAppliedCount} workers`);

      res.json({
        success: true,
        message: 'Delay reported successfully. Grace period applied to affected workers.',
        data: {
          incidentId: incident.id,
          incidentType: incident.incidentType,
          delayReason: incident.delayReason,
          estimatedDelay: incident.estimatedDelay,
          status: incident.status,
          reportedAt: incident.reportedAt,
          affectedWorkers: passengers.length,
          graceAppliedCount: graceAppliedCount,
          graceMinutes: Number(estimatedDelay)
        }
      });

    } catch (graceError) {
      console.error('⚠️ Error applying grace period:', graceError);
      // Still return success for delay report even if grace period fails
      res.json({
        success: true,
        message: 'Delay reported successfully (grace period application failed)',
        data: {
          incidentId: incident.id,
          incidentType: incident.incidentType,
          delayReason: incident.delayReason,
          estimatedDelay: incident.estimatedDelay,
          status: incident.status,
          reportedAt: incident.reportedAt,
          graceError: graceError.message
        }
      });
    }

  } catch (err) {
    console.error("❌ Error reporting delay:", err);
    res.status(500).json({
      success: false,
      message: "Server error while reporting delay",
      error: err.message
    });
  }
};

// ==============================
// BREAKDOWN REPORT
// ==============================
export const reportBreakdown = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { breakdownType, description, location, requiresAssistance } = req.body;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`🔧 Reporting breakdown for task: ${taskId}, driver: ${driverId}`);

    if (!breakdownType || !description) {
      return res.status(400).json({
        success: false,
        message: 'Breakdown type and description are required'
      });
    }

    // Verify task belongs to driver
    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId,
      companyId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not assigned to this driver'
      });
    }

    // Create incident record
    const incidentId = await getNextId(TripIncident);
    const incident = new TripIncident({
      id: incidentId,
      fleetTaskId: Number(taskId),
      driverId,
      companyId,
      incidentType: 'BREAKDOWN',
      description,
      breakdownType,
      location: location || {},
      requiresAssistance: requiresAssistance || false,
      status: 'REPORTED'
    });

    await incident.save();

    res.json({
      success: true,
      message: 'Breakdown reported successfully',
      incident: {
        id: incident.id,
        incidentType: incident.incidentType,
        breakdownType: incident.breakdownType,
        description: incident.description,
        requiresAssistance: incident.requiresAssistance,
        status: incident.status,
        reportedAt: incident.reportedAt
      }
    });

  } catch (err) {
    console.error("❌ Error reporting breakdown:", err);
    res.status(500).json({
      success: false,
      message: "Server error while reporting breakdown",
      error: err.message
    });
  }
};

// ==============================
// TRIP PHOTO UPLOAD
// ==============================
export const uploadTripPhoto = async (req, res) => {
  try {
    const { taskId } = req.params;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📸 Uploading trip photos for task: ${taskId}, driver: ${driverId}`);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No photos uploaded'
      });
    }

    // Verify task belongs to driver
    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId,
      companyId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not assigned to this driver'
      });
    }

    const photoUrls = req.files.map(file => `/uploads/trips/${file.filename}`);

    // Optionally store photo URLs in task or incident
    // For now, just return the URLs
    res.json({
      success: true,
      message: `${photoUrls.length} photo(s) uploaded successfully`,
      photos: photoUrls
    });

  } catch (err) {
    console.error("❌ Error uploading trip photos:", err);
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, () => {});
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while uploading photos",
      error: err.message
    });
  }
};

// ==============================
// WORKER COUNT VALIDATION
// ==============================
export const validateWorkerCount = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { expectedCount, actualCount } = req.body;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`✅ Validating worker count for task: ${taskId}`);

    if (expectedCount === undefined || actualCount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Expected count and actual count are required'
      });
    }

    // Verify task belongs to driver
    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId,
      companyId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not assigned to this driver'
      });
    }

    // Get actual passenger count from database
    const dbPassengerCount = await FleetTaskPassenger.countDocuments({
      fleetTaskId: Number(taskId)
    });

    const countMatch = (Number(actualCount) === dbPassengerCount);
    const countDiscrepancy = Math.abs(Number(actualCount) - dbPassengerCount);

    res.json({
      success: true,
      message: countMatch ? 'Worker count validated successfully' : 'Worker count mismatch detected',
      validation: {
        expectedCount: Number(expectedCount),
        actualCount: Number(actualCount),
        databaseCount: dbPassengerCount,
        countMatch,
        countDiscrepancy,
        status: countMatch ? 'VALIDATED' : 'MISMATCH'
      }
    });

  } catch (err) {
    console.error("❌ Error validating worker count:", err);
    res.status(500).json({
      success: false,
      message: "Server error while validating worker count",
      error: err.message
    });
  }
};

// ==============================
// LOGOUT TRACKING
// ==============================
// LOGOUT TRACKING (Moved to DRIVER ATTENDANCE MANAGEMENT section below)
// ==============================

// ==============================
// DRIVING LICENSE MANAGEMENT
// ==============================
export const getLicenseDetails = async (req, res) => {
  try {
    const driverId = Number(req.user.id || req.user.userId);

    console.log(`📄 Fetching license details for driver: ${driverId}`);

    const employee = await Employee.findOne({ id: driverId }).lean();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Driver details not found'
      });
    }

    const licenseDetails = {
      driverId: employee.id,
      driverName: employee.fullName,
      licenseNumber: employee.drivingLicenseNumber || null,
      licenseType: employee.licenseType || null,
      licenseExpiry: employee.licenseExpiry || null,
      licensePhotoUrl: employee.licensePhotoUrl || null,
      isExpired: employee.licenseExpiry ? new Date(employee.licenseExpiry) < new Date() : null
    };

    res.json({
      success: true,
      message: 'License details retrieved successfully',
      license: licenseDetails
    });

  } catch (err) {
    console.error("❌ Error fetching license details:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching license details",
      error: err.message
    });
  }
};

export const updateLicenseDetails = async (req, res) => {
  try {
    const driverId = Number(req.user.id || req.user.userId);
    const { licenseNumber, licenseType, licenseExpiry } = req.body;

    console.log(`📝 Updating license details for driver: ${driverId}`);

    if (!licenseNumber || !licenseType || !licenseExpiry) {
      return res.status(400).json({
        success: false,
        message: 'License number, type, and expiry date are required'
      });
    }

    const employee = await Employee.findOne({ id: driverId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Driver details not found'
      });
    }

    // Update license details
    await Employee.updateOne(
      { id: driverId },
      {
        $set: {
          drivingLicenseNumber: licenseNumber,
          licenseType: licenseType,
          licenseExpiry: new Date(licenseExpiry)
        }
      }
    );

    const updatedEmployee = await Employee.findOne({ id: driverId }).lean();

    res.json({
      success: true,
      message: 'License details updated successfully',
      license: {
        driverId: updatedEmployee.id,
        licenseNumber: updatedEmployee.drivingLicenseNumber,
        licenseType: updatedEmployee.licenseType,
        licenseExpiry: updatedEmployee.licenseExpiry,
        licensePhotoUrl: updatedEmployee.licensePhotoUrl
      }
    });

  } catch (err) {
    console.error("❌ Error updating license details:", err);
    res.status(500).json({
      success: false,
      message: "Server error while updating license details",
      error: err.message
    });
  }
};

export const uploadLicensePhotoHandler = async (req, res) => {
  try {
    const driverId = Number(req.user.id || req.user.userId);

    console.log(`📸 Uploading license photo for driver: ${driverId}`);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No license photo uploaded'
      });
    }

    const licensePhotoUrl = `/uploads/drivers/licenses/${req.file.filename}`;

    await Employee.updateOne(
      { id: driverId },
      { $set: { licensePhotoUrl } }
    );

    const employee = await Employee.findOne({ id: driverId }).lean();

    res.json({
      success: true,
      message: 'License photo uploaded successfully',
      license: {
        driverId: employee.id,
        licenseNumber: employee.drivingLicenseNumber,
        licenseType: employee.licenseType,
        licenseExpiry: employee.licenseExpiry,
        licensePhotoUrl: employee.licensePhotoUrl
      }
    });

  } catch (err) {
    console.error("❌ Error uploading license photo:", err);
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({
      success: false,
      message: "Server error while uploading license photo",
      error: err.message
    });
  }
};


// ==============================
// TRANSPORT TASKS - NEW ENDPOINTS
// ==============================

// Update Task Status
export const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, location, notes } = req.body;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`🔄 Updating task status: ${taskId} from mobile app: ${status}`);

    // Map frontend status to backend status
    const statusMap = {
      'pending': 'PLANNED',
      'en_route_pickup': 'ONGOING',
      'pickup_complete': 'PICKUP_COMPLETE',
      'en_route_dropoff': 'EN_ROUTE_DROPOFF',
      'completed': 'COMPLETED',
      'cancelled': 'CANCELLED'
    };

    const backendStatus = statusMap[status] || status;
    console.log(`📊 Status mapping: ${status} → ${backendStatus}`);

    // ✅ FIX 1: ONLY allow "Start Route" action (PLANNED → ONGOING) or CANCELLED
    // All other status changes must go through their specific endpoints
    if (backendStatus !== 'ONGOING' && backendStatus !== 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'This endpoint only handles route start. Use the appropriate endpoint for other actions.',
        error: 'INVALID_ENDPOINT_FOR_STATUS',
        requestedStatus: backendStatus,
        hint: {
          'PICKUP_COMPLETE': 'Use POST /transport-tasks/:taskId/pickup-complete',
          'EN_ROUTE_DROPOFF': 'Automatically set after pickup complete',
          'COMPLETED': 'Use POST /transport-tasks/:taskId/dropoff-complete'
        }
      });
    }

    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId,
      companyId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not assigned to this driver'
      });
    }

    // ✅ FIX 2: Validate task is in PLANNED status before allowing route start
    if (backendStatus === 'ONGOING') {
      if (task.status !== 'PLANNED') {
        return res.status(400).json({
          success: false,
          message: `Cannot start route. Task is currently in ${task.status} status.`,
          error: 'INVALID_STATUS_TRANSITION',
          currentStatus: task.status,
          requiredStatus: 'PLANNED',
          taskId: task.id,
          hint: task.status === 'ONGOING' ? 'Route already started. Proceed to check in workers.' : 
                task.status === 'PICKUP_COMPLETE' ? 'Pickup already complete. Proceed to dropoff.' :
                task.status === 'COMPLETED' ? 'Trip already completed.' : 
                'Invalid status for route start.'
        });
      }

      // ✅ FIX 3: Validate driver has clocked in today before starting route
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const attendance = await Attendance.findOne({
        employeeId: driverId,
        date: { $gte: today, $lte: endOfDay },
        checkIn: { $ne: null },
        pendingCheckout: true
      });

      if (!attendance) {
        return res.status(403).json({
          success: false,
          message: 'Route start denied: You must clock in before starting a route',
          error: 'ATTENDANCE_REQUIRED',
          details: {
            message: 'Please clock in first before starting your route. Go to Attendance screen to clock in.'
          }
        });
      }

      console.log(`✅ Driver attendance verified: Clocked in at ${attendance.checkIn}`);

      // ✅ FIX 4: Validate driver is at approved location before starting route
      if (location && isValidCoordinates(location.latitude, location.longitude)) {
        const approvedLocations = await ApprovedLocation.find({
          companyId,
          active: true,
          allowedForRouteStart: true
        }).lean();

        if (approvedLocations.length > 0) {
          let isAtApprovedLocation = false;
          let nearestLocation = null;
          let nearestDistance = Infinity;

          for (const approvedLoc of approvedLocations) {
            const validation = validateGeofence(location, {
              center: approvedLoc.center,
              radius: approvedLoc.radius,
              strictMode: true,
              allowedVariance: 50  // Allow 50m variance for route start
            });

            if (validation.distance < nearestDistance) {
              nearestDistance = validation.distance;
              nearestLocation = approvedLoc.name;
            }

            if (validation.isValid) {
              isAtApprovedLocation = true;
              console.log(`✅ Route start approved from location: ${approvedLoc.name} (${validation.distance}m away)`);
              break;
            }
          }

          if (!isAtApprovedLocation) {
            return res.status(403).json({
              success: false,
              message: `Route start denied: You must be at an approved location to start the route`,
              error: 'ROUTE_START_LOCATION_NOT_APPROVED',
              details: {
                nearestLocation,
                distance: Math.round(nearestDistance),
                message: `You are ${Math.round(nearestDistance)}m from ${nearestLocation}. Please move closer to start the route.`
              }
            });
          }
        }
      }

      // Set actualStartTime when starting route
      task.actualStartTime = new Date();
      task.status = 'ONGOING';
      
      if (location) {
        task.currentLocation = {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: location.timestamp || new Date()
        };
      }
      
      if (notes) {
        task.notes = notes;
      }
      
      task.updatedAt = new Date();
      await task.save();

      console.log(`✅ Task ${taskId} status updated: ${task.status}`);

      return res.status(200).json({
        success: true,
        message: 'Route started successfully',
        data: {
          taskId: task.id,
          status: task.status,
          actualStartTime: task.actualStartTime,
          updatedAt: task.updatedAt
        }
      });
    }

    // Handle CANCELLED status
    if (backendStatus === 'CANCELLED') {
      task.status = 'CANCELLED';
      task.updatedAt = new Date();
      
      if (notes) {
        task.notes = notes;
      }
      
      await task.save();

      console.log(`✅ Task ${taskId} cancelled`);

      return res.status(200).json({
        success: true,
        message: 'Task cancelled successfully',
        data: {
          taskId: task.id,
          status: task.status,
          updatedAt: task.updatedAt
        }
      });
    }

  } catch (err) {
    console.error("❌ Error updating task status:", err);
    res.status(500).json({
      success: false,
      message: "Server error while updating task status",
      error: err.message
    });
  }
};

// Get Worker Manifests
export const getWorkerManifests = async (req, res) => {
  try {
    const { taskId } = req.params;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📋 Fetching worker manifests for task: ${taskId}`);

    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId,
      companyId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not assigned to this driver'
      });
    }

    const passengers = await FleetTaskPassenger.find({
      fleetTaskId: Number(taskId)
    }).lean();

    const employeeIds = passengers.map(p => p.workerEmployeeId);  // ✅ Use workerEmployeeId
    
    console.log('🔍 Looking up employees:', {
      employeeIds,
      companyId,
      query: { id: { $in: employeeIds }, companyId }
    });
    
    const employees = await Employee.find({
      id: { $in: employeeIds },
      companyId
    }).lean();
    
    console.log('✅ Employees found:', {
      count: employees.length,
      employees: employees.map(e => ({ id: e.id, name: e.fullName }))
    });

    const employeeMap = Object.fromEntries(employees.map(e => [e.id, e]));

    console.log('📊 Employee lookup:', {
      passengerCount: passengers.length,
      employeeCount: employees.length,
      employeeIds: employeeIds,
      foundEmployeeIds: employees.map(e => e.id),
      missingEmployeeIds: employeeIds.filter(id => !employeeMap[id])
    });

    const manifests = passengers.map(p => {
      const employee = employeeMap[p.workerEmployeeId];  // ✅ Use workerEmployeeId
      
      console.log(`👤 Passenger ${p.workerEmployeeId}:`, {
        found: !!employee,
        fullName: employee?.fullName,
        employeeId: employee?.employeeId,
        phone: employee?.phone
      });
      
      // ✅ FIX: Use pickupStatus from FleetTaskPassenger, NOT attendance
      // pickupStatus can be: 'confirmed' (picked up), 'missed' (not picked up), or null/undefined (pending)
      const pickupStatus = p.pickupStatus || 'pending';
      
      return {
        workerId: p.workerEmployeeId,  // ✅ Use workerEmployeeId
        workerName: employee?.fullName || `Worker ${p.workerEmployeeId}`,  // ✅ Fallback to Worker ID
        employeeId: employee?.employeeId || 'N/A',
        department: employee?.department || 'N/A',
        contactNumber: employee?.phone || 'N/A',
        roomNumber: employee?.roomNumber || 'N/A',
        trade: employee?.trade || 'General Labor',
        supervisorName: employee?.supervisorName || 'N/A',
        // ✅ Return pickup status from FleetTaskPassenger
        pickupStatus: pickupStatus,  // 'confirmed', 'missed', or 'pending'
        pickupConfirmedAt: p.pickupConfirmedAt || null,
        pickupLocation: p.pickupLocation || task.pickupLocation,
        dropLocation: p.dropLocation || task.dropLocation,
        dropStatus: p.dropStatus || 'pending',
        dropConfirmedAt: p.dropConfirmedAt || null
      };
    });

    res.json({
      success: true,
      data: manifests
    });

  } catch (err) {
    console.error("❌ Error fetching worker manifests:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching worker manifests",
      error: err.message
    });
  }
};

// Get Pickup List
export const getPickupList = async (req, res) => {
  try {
    const { taskId } = req.params;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📋 Fetching pickup list for task: ${taskId}`);

    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId,
      companyId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not assigned to this driver'
      });
    }

    const passengers = await FleetTaskPassenger.find({
      fleetTaskId: Number(taskId)
    }).lean();

    const employeeIds = passengers.map(p => p.workerEmployeeId);  // ✅ Use workerEmployeeId
    const employees = await Employee.find({
      id: { $in: employeeIds },
      companyId
    }).lean();

    const employeeMap = Object.fromEntries(employees.map(e => [e.id, e]));

    // ✅ Check attendance for today to determine check-in status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Use raw MongoDB collection to ensure we're querying the right collection
    const db = mongoose.connection.db;
    const attendanceCol = db.collection('attendance');
    
    const todayAttendance = await attendanceCol.find({
      employeeId: { $in: employeeIds },
      date: { $gte: today, $lt: tomorrow },
      checkIn: { $ne: null }
    }).toArray();

    const checkedInEmployeeIds = new Set(todayAttendance.map(att => att.employeeId));

    const workers = passengers.map(p => {
      const employee = employeeMap[p.workerEmployeeId];  // ✅ Use workerEmployeeId
      const isCheckedIn = checkedInEmployeeIds.has(p.workerEmployeeId);  // ✅ Check attendance
      
      return {
        workerId: p.workerEmployeeId,  // ✅ Use workerEmployeeId
        workerName: employee?.fullName || 'Unknown',
        employeeId: employee?.employeeId || 'N/A',
        department: employee?.department || 'N/A',
        contactNumber: employee?.phone || 'N/A',
        roomNumber: employee?.roomNumber || 'N/A',
        status: isCheckedIn ? 'checked-in' : 'Confirmed'  // ✅ Based on attendance
      };
    });

    res.json({
      success: true,
      data: {
        taskId: task.id,
        dormitory: task.pickupLocation || 'Dormitory A',
        totalWorkers: workers.length,
        workers: workers
      }
    });

  } catch (err) {
    console.error("❌ Error fetching pickup list:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching pickup list",
      error: err.message
    });
  }
};

// Get Drop Locations
export const getDropLocations = async (req, res) => {
  try {
    const { taskId } = req.params;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📍 Fetching drop locations for task: ${taskId}`);

    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId,
      companyId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not assigned to this driver'
      });
    }

    const project = await Project.findOne({ id: task.projectId }).lean();

    const dropLocations = [{
      locationId: task.projectId,
      siteName: project?.projectName || 'Construction Site',
      address: task.dropLocation || task.dropAddress || project?.address || 'Site Address',
      coordinates: {
        latitude: task.dropLatitude || project?.latitude || 25.1872,
        longitude: task.dropLongitude || project?.longitude || 55.2674
      },
      workerCount: await FleetTaskPassenger.countDocuments({ fleetTaskId: Number(taskId) }),
      estimatedArrival: task.plannedDropTime ? new Date(task.plannedDropTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) : 'N/A'
    }];

    res.json({
      success: true,
      data: {
        taskId: task.id,
        dropLocations: dropLocations
      }
    });

  } catch (err) {
    console.error("❌ Error fetching drop locations:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching drop locations",
      error: err.message
    });
  }
};

// Confirm Worker Count
export const confirmWorkerCount = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { expectedCount, actualCount, absentWorkers, remarks } = req.body;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`✅ Confirming worker count for task: ${taskId}`);

    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId,
      companyId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not assigned to this driver'
      });
    }

    task.expectedWorkerCount = expectedCount;
    task.actualWorkerCount = actualCount;
    task.absentWorkers = absentWorkers || [];
    task.workerCountRemarks = remarks;
    task.workerCountConfirmedAt = new Date();

    await task.save();

    res.json({
      success: true,
      message: 'Worker count confirmed successfully',
      data: {
        taskId: task.id,
        confirmedCount: actualCount,
        confirmedAt: task.workerCountConfirmedAt
      }
    });

  } catch (err) {
    console.error("❌ Error confirming worker count:", err);
    res.status(500).json({
      success: false,
      message: "Server error while confirming worker count",
      error: err.message
    });
  }
};

// Optimize Route
export const optimizeRoute = async (req, res) => {
  try {
    const { taskId } = req.params;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`🗺️ Optimizing route for task: ${taskId}`);

    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId,
      companyId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not assigned to this driver'
      });
    }

    // Simple route optimization (in real app, use Google Maps API)
    const routeData = {
      taskId: task.id,
      optimizedRoute: [
        {
          order: 1,
          location: task.pickupLocation || 'Pickup Location',
          coordinates: {
            latitude: task.pickupLatitude || 25.2048,
            longitude: task.pickupLongitude || 55.2708
          },
          estimatedTime: task.plannedPickupTime
        },
        {
          order: 2,
          location: task.dropLocation || 'Drop Location',
          coordinates: {
            latitude: task.dropLatitude || 25.1872,
            longitude: task.dropLongitude || 55.2674
          },
          estimatedTime: task.plannedDropTime
        }
      ],
      totalDistance: 15.5, // km
      estimatedDuration: 25 // minutes
    };

    res.json({
      success: true,
      data: routeData
    });

  } catch (err) {
    console.error("❌ Error optimizing route:", err);
    res.status(500).json({
      success: false,
      message: "Server error while optimizing route",
      error: err.message
    });
  }
};

// Get Navigation
export const getNavigation = async (req, res) => {
  try {
    const { taskId } = req.params;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`🧭 Fetching navigation for task: ${taskId}`);

    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId,
      companyId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not assigned to this driver'
      });
    }

    const navigationData = {
      currentLocation: {
        latitude: task.currentLocation?.latitude || 25.2048,
        longitude: task.currentLocation?.longitude || 55.2708
      },
      nextDestination: {
        name: task.status === 'in-progress' ? (task.dropLocation || 'Drop Location') : (task.pickupLocation || 'Pickup Location'),
        address: task.status === 'in-progress' ? (task.dropAddress || 'Drop Address') : (task.pickupAddress || 'Pickup Address'),
        coordinates: {
          latitude: task.status === 'in-progress' ? (task.dropLatitude || 25.1872) : (task.pickupLatitude || 25.2048),
          longitude: task.status === 'in-progress' ? (task.dropLongitude || 55.2674) : (task.pickupLongitude || 55.2708)
        },
        estimatedArrival: task.status === 'in-progress' ? task.plannedDropTime : task.plannedPickupTime,
        distance: 15.5 // km
      },
      routeInstructions: [
        { instruction: 'Head north on Main Street', distance: 2.5, duration: 5 },
        { instruction: 'Turn right onto Highway 1', distance: 10.0, duration: 15 },
        { instruction: 'Take exit 5 toward destination', distance: 3.0, duration: 5 }
      ]
    };

    res.json({
      success: true,
      data: navigationData
    });

  } catch (err) {
    console.error("❌ Error fetching navigation:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching navigation",
      error: err.message
    });
  }
};

// Check In Worker
export const checkInWorker = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { workerId, latitude, longitude, accuracy, timestamp } = req.body;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`✅ Checking in worker: ${workerId} at location: ${locationId}`);

    const employee = await Employee.findOne({
      id: Number(workerId),
      companyId
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // Find the task for this location (location ID is typically taskId * 100 + index)
    // Or we need to find the active task for this driver
    const activeTask = await FleetTask.findOne({
      driverId,
      companyId,
      status: { $in: ['PENDING', 'ONGOING', 'PICKUP_COMPLETE', 'ENROUTE_DROPOFF'] }
    }).sort({ id: -1 });

    if (!activeTask) {
      return res.status(404).json({
        success: false,
        message: 'No active task found for this driver'
      });
    }

    console.log(`📌 Found active task: ${activeTask.id} for worker check-in`);

    // Log the query parameters for debugging
    console.log(`📌 Query parameters:`, {
      workerEmployeeId: Number(workerId),
      fleetTaskId: activeTask.id,
      companyId: companyId
    });

    // First, check if the passenger record exists
    const existingPassenger = await FleetTaskPassenger.findOne({
      workerEmployeeId: Number(workerId),
      fleetTaskId: activeTask.id
    }).lean();

    console.log(`📌 Existing passenger record:`, existingPassenger);

    if (!existingPassenger) {
      console.log(`❌ No passenger record found for worker ${workerId} in task ${activeTask.id}`);
      return res.status(404).json({
        success: false,
        message: 'Worker not found in task passenger list. Please ensure worker is assigned to this task.'
      });
    }

    // Update passenger status - MUST match both workerEmployeeId AND fleetTaskId
    // Use pickupStatus field which exists in the schema
    const updateResult = await FleetTaskPassenger.updateOne(
      { 
        workerEmployeeId: Number(workerId),  // ✅ Use workerEmployeeId (schema field name)
        fleetTaskId: activeTask.id  // ✅ CRITICAL: Match by task ID too
      },
      {
        $set: {
          pickupStatus: 'confirmed',  // ✅ Use existing schema field
          pickupConfirmedAt: new Date(timestamp || Date.now())  // ✅ Use existing schema field
        }
      }
    );

    console.log(`✅ Update result: matched=${updateResult.matchedCount}, modified=${updateResult.modifiedCount}`);
    
    // Verify the update by reading the record again
    const updatedPassenger = await FleetTaskPassenger.findOne({
      workerEmployeeId: Number(workerId),
      fleetTaskId: activeTask.id
    }).lean();
    
    console.log(`✅ Updated passenger record:`, updatedPassenger);

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found in task passenger list'
      });
    }

    res.json({
      success: true,
      message: 'Worker checked in successfully',
      checkInTime: new Date().toISOString(),
      workerName: employee.fullName,
      locationName: 'Pickup Location'
    });

  } catch (err) {
    console.error("❌ Error checking in worker:", err);
    res.status(500).json({
      success: false,
      message: "Server error while checking in worker",
      error: err.message
    });
  }
};

// Check Out Worker
export const checkOutWorker = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { workerId, location } = req.body;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`✅ Checking out worker: ${workerId} at location: ${locationId}`);

    const employee = await Employee.findOne({
      id: Number(workerId),
      companyId
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // Find the active task for this driver
    const activeTask = await FleetTask.findOne({
      driverId,
      companyId,
      status: { $in: ['PICKUP_COMPLETE', 'ENROUTE_DROPOFF', 'COMPLETED'] }
    }).sort({ id: -1 });

    if (!activeTask) {
      return res.status(404).json({
        success: false,
        message: 'No active task found for this driver'
      });
    }

    console.log(`📌 Found active task: ${activeTask.id} for worker check-out`);

    // ✅ FIX: Update passenger drop status using correct field names
    const updateResult = await FleetTaskPassenger.updateOne(
      { 
        workerEmployeeId: Number(workerId),  // ✅ Correct field name
        fleetTaskId: activeTask.id
      },
      {
        $set: {
          dropStatus: 'confirmed',  // ✅ Correct field name
          dropConfirmedAt: new Date(location?.timestamp || Date.now())
        }
      }
    );

    console.log(`✅ Update result: matched=${updateResult.matchedCount}, modified=${updateResult.modifiedCount}`);

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found in task passenger list'
      });
    }

    res.json({
      success: true,
      message: 'Worker checked out successfully',
      checkOutTime: new Date().toISOString(),
      workerName: employee.fullName,
      locationName: 'Drop Location'
    });

  } catch (err) {
    console.error("❌ Error checking out worker:", err);
    res.status(500).json({
      success: false,
      message: "Server error while checking out worker",
      error: err.message
    });
  }
};


// ==============================
// DRIVER ATTENDANCE MANAGEMENT
// ==============================

// Get today's attendance
export const getTodaysAttendance = async (req, res) => {
  try {
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📅 Fetching today's attendance for driver: ${driverId}`);

    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    // Get today's actual attendance record
    const attendance = await Attendance.findOne({
      employeeId: driverId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    // Get today's tasks count
    const tasksCount = await FleetTask.countDocuments({
      driverId,
      companyId,
      plannedPickupTime: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    // Determine session status
    let session = 'NOT_LOGGED_IN';
    let checkInTime = null;
    let checkOutTime = null;
    let totalHours = 0;

    if (attendance) {
      if (attendance.checkOut) {
        session = 'CHECKED_OUT';
        checkOutTime = attendance.checkOut.toISOString();
      } else if (attendance.checkIn) {
        session = 'CHECKED_IN';
      }

      if (attendance.checkIn) {
        checkInTime = attendance.checkIn.toISOString();

        // Calculate total hours if checked out
        if (attendance.checkOut) {
          const diffMs = attendance.checkOut.getTime() - attendance.checkIn.getTime();
          totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
        }
      }
    }

    res.json({
      success: true,
      data: {
        session,
        checkInTime,
        checkOutTime,
        assignedVehicle: null, // Will be loaded separately
        totalHours,
        date: now.toISOString().split('T')[0],
        tasksCount,
        attendanceId: attendance?.id || null
      }
    });

  } catch (err) {
    console.error("❌ Error fetching today's attendance:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching today's attendance",
      error: err.message
    });
  }
};



// Driver Clock In
export const clockInDriver = async (req, res) => {
  try {
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);
    const { vehicleId, preCheckCompleted, mileageReading, location } = req.body;
    
    console.log(`⏰ Driver clock in: ${driverId}, vehicle: ${vehicleId}`);

    // ✅ FIX 1: Validate location is provided
    if (!location || !isValidCoordinates(location.latitude, location.longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Valid GPS location is required for clock-in',
        error: 'LOCATION_REQUIRED'
      });
    }

    // ✅ FIX 1: Validate driver is at approved location (geofence check)
    const approvedLocations = await ApprovedLocation.find({
      companyId,
      active: true,
      allowedForClockIn: true
    }).lean();

    if (approvedLocations.length === 0) {
      console.warn(`⚠️ No approved locations configured for company ${companyId}`);
      // Allow clock-in if no locations configured (backward compatibility)
    } else {
      let isAtApprovedLocation = false;
      let nearestLocation = null;
      let nearestDistance = Infinity;

      for (const approvedLoc of approvedLocations) {
        const validation = validateGeofence(location, {
          center: approvedLoc.center,
          radius: approvedLoc.radius,
          strictMode: true
        });

        if (validation.distance < nearestDistance) {
          nearestDistance = validation.distance;
          nearestLocation = approvedLoc.name;
        }

        if (validation.isValid) {
          isAtApprovedLocation = true;
          console.log(`✅ Driver at approved location: ${approvedLoc.name} (${validation.distance}m away)`);
          break;
        }
      }

      if (!isAtApprovedLocation) {
        return res.status(403).json({
          success: false,
          message: `Clock-in denied: You must be at an approved location (depot/dormitory/yard)`,
          error: 'LOCATION_NOT_APPROVED',
          details: {
            nearestLocation,
            distance: Math.round(nearestDistance),
            message: `You are ${Math.round(nearestDistance)}m from ${nearestLocation}. Please move closer to an approved location.`
          }
        });
      }
    }

    // Get vehicle details
    const vehicle = await FleetVehicle.findOne({
      id: Number(vehicleId),
      companyId
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Get today's date (start of day)
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    // Check if already clocked in today
    const existingAttendance = await Attendance.findOne({
      employeeId: driverId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    if (existingAttendance && existingAttendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked in today',
        checkInTime: existingAttendance.checkIn
      });
    }

    // Get today's tasks count
    const todayTasks = await FleetTask.countDocuments({
      driverId,
      companyId,
      plannedPickupTime: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    // Get next attendance ID
    const lastAttendance = await Attendance.findOne().sort({ id: -1 }).limit(1);
    const nextId = lastAttendance ? lastAttendance.id + 1 : 1;

    // Create or update attendance record
    const checkInTime = new Date();
    let attendance;

    if (existingAttendance) {
      // Update existing record
      existingAttendance.checkIn = checkInTime;
      existingAttendance.status = 'present';
      existingAttendance.pendingCheckout = true;
      if (location) {
        existingAttendance.lastLatitude = location.latitude;
        existingAttendance.lastLongitude = location.longitude;
      }
      attendance = await existingAttendance.save();
      console.log(`✅ Updated existing attendance record: ${attendance.id}`);
    } else {
      // Create new attendance record
      // For drivers, use projectId: 0 or a special value to indicate driver attendance
      attendance = new Attendance({
        id: nextId,
        employeeId: driverId,
        projectId: 0, // Special value for driver attendance (not project-specific)
        date: startOfDay,
        checkIn: checkInTime,
        checkOut: null,
        status: 'present',
        pendingCheckout: true,
        lastLatitude: location?.latitude || null,
        lastLongitude: location?.longitude || null,
        absenceReason: 'PRESENT',
        regularHours: 0,
        overtimeHours: 0
      });
      await attendance.save();
      console.log(`✅ Created new attendance record: ${attendance.id}`);
    }
    
    res.json({
      success: true,
      message: 'Clock in successful',
      data: {
        checkInTime: checkInTime.toISOString(),
        session: 'CHECKED_IN',
        vehicleAssigned: {
          id: vehicle.id,
          plateNumber: vehicle.registrationNo || vehicle.plateNumber,
          model: vehicle.vehicleType || vehicle.model
        },
        todayTasks,
        attendanceId: attendance.id
      }
    });

  } catch (err) {
    console.error("❌ Error during clock in:", err);
    res.status(500).json({
      success: false,
      message: "Server error during clock in",
      error: err.message
    });
  }
};

// Driver Clock Out
export const clockOutDriver = async (req, res) => {
  try {
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);
    const { vehicleId, postCheckCompleted, mileageReading, fuelLevel, location } = req.body;
    
    console.log(`⏰ Driver clock out: ${driverId}`);

    // Get today's date range
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    // Find today's attendance record
    const attendance = await Attendance.findOne({
      employeeId: driverId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'No check-in record found for today. Please check in first.'
      });
    }

    if (!attendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'No check-in time found. Please check in first.'
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked out today',
        checkOutTime: attendance.checkOut.toISOString()
      });
    }

    // Update attendance record with check-out time
    const checkOutTime = new Date();
    attendance.checkOut = checkOutTime;
    attendance.pendingCheckout = false;
    
    // Calculate total hours
    const diffMs = checkOutTime.getTime() - attendance.checkIn.getTime();
    const totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
    attendance.regularHours = Math.max(totalHours, 0);

    // Update location if provided
    if (location) {
      attendance.lastLatitude = location.latitude;
      attendance.lastLongitude = location.longitude;
    }

    await attendance.save();

    // Get today's completed tasks
    const tasksCompleted = await FleetTask.countDocuments({
      driverId,
      companyId,
      status: 'completed',
      actualDropTime: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
    
    console.log(`✅ Driver clocked out successfully. Total hours: ${totalHours}`);

    res.json({
      success: true,
      message: 'Clock out successful',
      data: {
        checkOutTime: checkOutTime.toISOString(),
        session: 'CHECKED_OUT',
        totalHours: totalHours,
        tasksCompleted,
        attendanceId: attendance.id
      }
    });

  } catch (err) {
    console.error("❌ Error during clock out:", err);
    res.status(500).json({
      success: false,
      message: "Server error during clock out",
      error: err.message
    });
  }
};

// Driver Login (Alias for clock-in)
export const loginDriver = async (req, res) => {
  try {
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);
    const { loginTime, location, deviceInfo } = req.body;
    
    console.log(`👋 Driver login: ${driverId}`);

    // Get today's tasks count
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    const todayTasks = await FleetTask.countDocuments({
      driverId,
      companyId,
      plannedPickupTime: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
    
    res.json({
      success: true,
      message: 'Login recorded successfully',
      data: {
        attendanceId: `ATT${Date.now()}`,
        driverId,
        loginTime: loginTime || new Date().toISOString(),
        status: 'active',
        todayTasks
      }
    });

  } catch (err) {
    console.error("❌ Error during login:", err);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: err.message
    });
  }
};

// Driver Logout (Alias for clock-out)
export const logoutDriver = async (req, res) => {
  try {
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);
    const { logoutTime, location, remarks } = req.body;
    
    console.log(`👋 Driver logout: ${driverId}`);

    // Get today's completed tasks
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    const tasksCompleted = await FleetTask.countDocuments({
      driverId,
      companyId,
      status: 'completed',
      actualDropTime: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    // Calculate total hours (mock - in real app, get from attendance record)
    const totalHours = 12.5;
    
    res.json({
      success: true,
      message: 'Logout recorded successfully',
      data: {
        attendanceId: `ATT${Date.now()}`,
        driverId,
        loginTime: new Date(Date.now() - totalHours * 60 * 60 * 1000).toISOString(),
        logoutTime: logoutTime || new Date().toISOString(),
        totalHours,
        tasksCompleted
      }
    });

  } catch (err) {
    console.error("❌ Error during logout:", err);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
      error: err.message
    });
  }
};

// Get Attendance Summary
export const getAttendanceSummary = async (req, res) => {
  try {
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);
    const { month, year } = req.query;
    
    const targetMonth = month ? Number(month) : new Date().getMonth() + 1;
    const targetYear = year ? Number(year) : new Date().getFullYear();

    console.log(`📅 Fetching attendance summary for driver: ${driverId}, month: ${targetMonth}, year: ${targetYear}`);

    // Calculate date range for the month
    const startOfMonth = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));

    // Get actual attendance records for the month
    const attendanceRecords = await Attendance.find({
      employeeId: driverId,
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    }).sort({ date: 1 });

    // Process attendance records
    const processedRecords = attendanceRecords.map(record => {
      let totalHours = 0;
      let checkInTime = null;
      let checkOutTime = null;

      if (record.checkIn) {
        checkInTime = record.checkIn.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });

        if (record.checkOut) {
          checkOutTime = record.checkOut.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });
          
          // Calculate total hours
          const diffMs = record.checkOut.getTime() - record.checkIn.getTime();
          totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
        }
      }

      return {
        date: record.date.toISOString().split('T')[0],
        checkInTime: record.checkIn ? record.checkIn.toISOString() : null,
        checkOutTime: record.checkOut ? record.checkOut.toISOString() : null,
        loginTime: checkInTime,
        logoutTime: checkOutTime,
        totalHours: Math.max(totalHours, 0),
        status: record.status || 'present'
      };
    });

    const daysPresent = processedRecords.length;
    const totalWorkingDays = new Date(targetYear, targetMonth, 0).getDate(); // Days in month
    const daysAbsent = totalWorkingDays - daysPresent;
    const totalHours = processedRecords.reduce((sum, record) => sum + record.totalHours, 0);
    const averageHoursPerDay = daysPresent > 0 ? totalHours / daysPresent : 0;

    res.json({
      success: true,
      data: {
        driverId,
        month: targetMonth,
        year: targetYear,
        totalWorkingDays,
        daysPresent,
        daysAbsent,
        totalHours: Math.round(totalHours * 10) / 10,
        averageHoursPerDay: Math.round(averageHoursPerDay * 10) / 10,
        attendanceRecords: processedRecords
      }
    });

  } catch (err) {
    console.error("❌ Error fetching attendance summary:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching attendance summary",
      error: err.message
    });
  }
};
// Get Attendance History
export const getAttendanceHistory = async (req, res) => {
  try {
    const driverId = Number(req.user.id || req.user.userId);
    const { startDate, endDate, limit = 30, offset = 0 } = req.query;

    console.log(`📅 Fetching attendance history for driver: ${driverId}`);

    // Calculate date range
    let start, end;
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of day
    } else {
      // Default to last 30 days
      end = new Date();
      start = new Date();
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0); // Start of day
      end.setHours(23, 59, 59, 999); // End of day
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find({
      employeeId: driverId,
      date: {
        $gte: start,
        $lte: end
      }
    })
    .sort({ date: -1 }) // Most recent first
    .limit(Number(limit))
    .skip(Number(offset));

    // Get total count for pagination
    const totalCount = await Attendance.countDocuments({
      employeeId: driverId,
      date: {
        $gte: start,
        $lte: end
      }
    });

    // Transform attendance records to the expected format
    const records = attendanceRecords.map(record => {
      let totalHours = 0;
      if (record.checkIn && record.checkOut) {
        const diffMs = record.checkOut.getTime() - record.checkIn.getTime();
        totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
      }

      return {
        date: record.date.toISOString().split('T')[0],
        checkInTime: record.checkIn ? record.checkIn.toISOString() : null,
        checkOutTime: record.checkOut ? record.checkOut.toISOString() : null,
        vehicleId: 0, // Not tracked in attendance record
        vehiclePlateNumber: '', // Not tracked in attendance record - empty instead of N/A
        totalHours: Math.max(totalHours, 0),
        tripsCompleted: 0 // Would need to query FleetTask for this
      };
    });

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          total: totalCount,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: (Number(offset) + Number(limit)) < totalCount
        }
      },
      message: 'Attendance history retrieved successfully'
    });

  } catch (err) {
    console.error("❌ Error fetching attendance history:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching attendance history",
      error: err.message
    });
  }
};

// Get Trip History (Alias for attendance screen)
export const getAttendanceTripHistory = async (req, res) => {
  // Reuse the existing getTripHistory function
  return getTripHistory(req, res);
};

// ==============================
// GPS NAVIGATION LINKS
// ==============================
export const getNavigationLinks = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { locationId } = req.query;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📌 Getting navigation links for task: ${taskId}, location: ${locationId || 'next'}`);

    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId,
      companyId
    }).lean();

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Transport task not found'
      });
    }

    // Determine target location
    let targetLocation = null;
    let locationName = '';
    let locationType = '';

    if (locationId) {
      // Find specific location from passengers
      const passenger = await FleetTaskPassenger.findOne({
        id: Number(locationId),
        fleetTaskId: Number(taskId)
      }).lean();

      if (passenger && passenger.pickupPoint) {
        locationName = passenger.pickupPoint;
        locationType = 'pickup';
        // Use task pickup coordinates as default
        targetLocation = {
          latitude: task.pickupLatitude || 25.2048,
          longitude: task.pickupLongitude || 55.2708
        };
      }
    }

    // Default to task pickup location if no specific location
    if (!targetLocation) {
      locationName = task.pickupAddress || task.pickupLocation || 'Pickup Location';
      locationType = 'pickup';
      targetLocation = {
        latitude: task.pickupLatitude || 25.2048,
        longitude: task.pickupLongitude || 55.2708
      };
    }

    const { latitude, longitude } = targetLocation;

    const navigationLinks = {
      googleMaps: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
      waze: `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`,
      appleMaps: `http://maps.apple.com/?daddr=${latitude},${longitude}`,
      location: {
        id: locationId || null,
        name: locationName,
        address: task.pickupAddress || '',
        type: locationType,
        latitude,
        longitude
      }
    };

    console.log(`✅ Navigation links generated for: ${locationName}`);

    res.json({
      success: true,
      data: navigationLinks
    });

  } catch (err) {
    console.error('❌ Error generating navigation links:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to generate navigation links',
      error: err.message
    });
  }
};

// ==============================
// ROUTE DEVIATION MONITORING
// ==============================
import RouteDeviation from './models/RouteDeviation.js';
import Notification from '../notification/models/Notification.js';

// Helper function to get next ID for RouteDeviation
const getNextRouteDeviationId = async () => {
  const lastRecord = await RouteDeviation.findOne().sort({ id: -1 }).limit(1);
  return lastRecord ? lastRecord.id + 1 : 1;
};

export const reportRouteDeviation = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { currentLocation, plannedRoute, deviationDistance, reason, autoDetected } = req.body;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📌 Reporting route deviation for task: ${taskId}, distance: ${deviationDistance}m`);

    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId,
      companyId
    }).populate('projectId').lean();

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Transport task not found'
      });
    }

    // Get driver info
    const driver = await Employee.findOne({ id: driverId }).lean();

    // Create deviation record
    const deviationId = await getNextRouteDeviationId();
    const deviation = new RouteDeviation({
      id: deviationId,
      taskId: Number(taskId),
      driverId,
      companyId,
      currentLocation: {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      },
      plannedLocation: plannedRoute?.currentWaypoint || {
        latitude: task.pickupLatitude || 0,
        longitude: task.pickupLongitude || 0
      },
      deviationDistance: Number(deviationDistance),
      reason: reason || '',
      autoDetected: autoDetected || false,
      estimatedDelay: Math.ceil(deviationDistance / 500 * 5) // Rough estimate: 5 min per 500m
    });

    await deviation.save();

    // Notify supervisor if deviation is significant (>500m)
    let supervisorNotified = false;
    let notificationId = null;

    if (deviationDistance > 500) {
      // Find supervisor for this project
      const project = await Project.findOne({ id: task.projectId }).lean();
      
      if (project && project.supervisorId) {
        // Get next notification ID
        const lastNotification = await Notification.findOne().sort({ id: -1 }).limit(1);
        notificationId = lastNotification ? lastNotification.id + 1 : 1;

        const notification = new Notification({
          id: notificationId,
          userId: project.supervisorId,
          type: 'transport_delay',
          title: 'Route Deviation Alert',
          message: `Driver ${driver?.fullName || 'Unknown'} has deviated ${Math.round(deviationDistance)}m from planned route on Task #${taskId}. ${reason || 'No reason provided.'}`,
          data: {
            taskId: Number(taskId),
            deviationId: deviation.id,
            driverId,
            deviationDistance,
            estimatedDelay: deviation.estimatedDelay
          },
          priority: 'high',
          read: false
        });

        await notification.save();

        deviation.supervisorNotified = true;
        deviation.notificationId = notificationId;
        await deviation.save();

        supervisorNotified = true;
        console.log(`✅ Supervisor notified about route deviation`);
      }
    }

    res.json({
      success: true,
      data: {
        deviationId: deviation.id,
        logged: true,
        supervisorNotified,
        allowedDeviation: deviationDistance <= 500,
        requiresApproval: deviationDistance > 500,
        estimatedDelay: deviation.estimatedDelay
      }
    });

  } catch (err) {
    console.error('❌ Error reporting route deviation:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to report route deviation',
      error: err.message
    });
  }
};

export const getRouteDeviationHistory = async (req, res) => {
  try {
    const { taskId } = req.params;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📌 Fetching route deviation history for task: ${taskId}`);

    // Verify task belongs to driver
    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId,
      companyId
    }).lean();

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Transport task not found'
      });
    }

    const deviations = await RouteDeviation.find({ taskId: Number(taskId) })
      .sort({ timestamp: -1 })
      .lean();

    // Get driver info for each deviation
    const driverIds = [...new Set(deviations.map(d => d.driverId))];
    const drivers = await Employee.find({ id: { $in: driverIds } }).lean();
    const driverMap = Object.fromEntries(drivers.map(d => [d.id, d]));

    const deviationHistory = deviations.map(d => ({
      deviationId: d.id,
      timestamp: d.timestamp,
      driverId: d.driverId,
      driverName: driverMap[d.driverId]?.fullName || 'Unknown',
      currentLocation: d.currentLocation,
      plannedLocation: d.plannedLocation,
      deviationDistance: d.deviationDistance,
      reason: d.reason,
      autoDetected: d.autoDetected,
      supervisorNotified: d.supervisorNotified,
      estimatedDelay: d.estimatedDelay,
      resolved: d.resolved,
      resolvedAt: d.resolvedAt
    }));

    res.json({
      success: true,
      data: deviationHistory
    });

  } catch (err) {
    console.error('❌ Error fetching route deviation history:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deviation history',
      error: err.message
    });
  }
};

// ==============================
// TRANSPORT DELAY & ATTENDANCE IMPACT
// ==============================

export const getTransportAttendanceImpact = async (req, res) => {
  try {
    const { taskId } = req.params;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📌 Fetching transport attendance impact for task: ${taskId}`);

    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId,
      companyId
    }).lean();

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Transport task not found'
      });
    }

    // Get all delays for this task
    const delays = await RouteDeviation.find({ taskId: Number(taskId) })
      .sort({ timestamp: 1 })
      .lean();

    // Get all passengers for this task
    const passengers = await FleetTaskPassenger.find({ fleetTaskId: Number(taskId) }).lean();
    const workerIds = passengers.map(p => p.employeeId).filter(Boolean);

    // Get attendance records for these workers on task date
    const taskDate = new Date(task.taskDate);
    const startOfDay = new Date(taskDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(taskDate.setHours(23, 59, 59, 999));

    const attendanceRecords = await Attendance.find({
      employeeId: { $in: workerIds },
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).lean();

    // Get worker details
    const workers = await Employee.find({ id: { $in: workerIds } }).lean();
    const workerMap = Object.fromEntries(workers.map(w => [w.id, w]));

    // Get supervisor notifications
    const notifications = await Notification.find({
      'data.taskId': Number(taskId),
      type: { $in: ['transport_delay', 'route_deviation'] }
    }).sort({ createdAt: 1 }).lean();

    // Build timeline
    const timeline = [];

    // Add task start
    if (task.actualStartTime || task.plannedPickupTime) {
      timeline.push({
        time: task.actualStartTime || task.plannedPickupTime,
        event: `Pickup started at ${task.pickupAddress || task.pickupLocation || 'pickup location'}`,
        type: 'task_start'
      });
    }

    // Add deviations
    delays.forEach(delay => {
      timeline.push({
        time: delay.timestamp,
        event: `Route deviation detected - ${delay.deviationDistance}m off planned route${delay.reason ? ': ' + delay.reason : ''}`,
        type: 'route_deviation',
        data: {
          deviationId: delay.id,
          distance: delay.deviationDistance,
          estimatedDelay: delay.estimatedDelay
        }
      });
    });

    // Add notifications
    notifications.forEach(notif => {
      timeline.push({
        time: notif.createdAt,
        event: `Supervisor notified: ${notif.message}`,
        type: 'notification',
        data: {
          notificationId: notif.id,
          priority: notif.priority
        }
      });
    });

    // Add worker check-ins
    attendanceRecords.forEach(attendance => {
      if (attendance.checkIn) {
        const worker = workerMap[attendance.employeeId];
        const isLate = attendance.status === 'late' || attendance.lateMinutes > 0;
        timeline.push({
          time: attendance.checkIn,
          event: `Worker ${worker?.fullName || 'Unknown'} checked in${isLate ? ` (${attendance.lateMinutes} min late${attendance.linkedToTransportDelay ? ', linked to transport delay' : ''})` : ''}`,
          type: 'worker_checkin',
          data: {
            workerId: attendance.employeeId,
            lateMinutes: attendance.lateMinutes,
            linkedToDelay: attendance.linkedToTransportDelay
          }
        });
      }
    });

    // Sort timeline
    timeline.sort((a, b) => new Date(a.time) - new Date(b.time));

    // Build affected workers list
    const affectedWorkers = attendanceRecords
      .filter(att => att.status === 'late' || att.lateMinutes > 0)
      .map(att => {
        const worker = workerMap[att.employeeId];
        return {
          workerId: att.employeeId,
          name: worker?.fullName || 'Unknown',
          employeeId: worker?.employeeCode || att.employeeId,
          expectedCheckIn: task.plannedPickupTime,
          actualCheckIn: att.checkIn,
          lateMinutes: att.lateMinutes || 0,
          linkedToTransportDelay: att.linkedToTransportDelay || false,
          delayId: att.linkedDelayId,
          attendanceStatus: att.status || 'present'
        };
      });

    res.json({
      success: true,
      data: {
        taskId: Number(taskId),
        taskCode: `TSK${String(taskId).padStart(3, '0')}`,
        transportDelays: delays.map(d => ({
          delayId: d.id,
          type: d.autoDetected ? 'route_deviation' : 'manual_report',
          timestamp: d.timestamp,
          duration: d.estimatedDelay,
          reason: d.reason,
          location: d.currentLocation
        })),
        affectedWorkers,
        supervisorNotifications: notifications.map(n => ({
          notificationId: n.id,
          sentAt: n.createdAt,
          type: n.type,
          message: n.message
        })),
        geofenceViolations: [], // Placeholder for future implementation
        timeline
      }
    });

  } catch (err) {
    console.error('❌ Error fetching transport attendance impact:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance impact data',
      error: err.message
    });
  }
};

export const linkDelayToAttendance = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { workerIds, delayReason } = req.body;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📌 Linking delay to attendance for task: ${taskId}, workers: ${workerIds?.length || 0}`);

    // Verify task belongs to driver
    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId,
      companyId
    }).lean();

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Transport task not found'
      });
    }

    // Find the most recent deviation for this task
    const deviation = await RouteDeviation.findOne({ taskId: Number(taskId) })
      .sort({ timestamp: -1 })
      .lean();

    if (!deviation) {
      return res.status(404).json({
        success: false,
        message: 'No route deviation found for this task'
      });
    }

    // Update attendance records
    const taskDate = new Date(task.taskDate);
    const startOfDay = new Date(taskDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(taskDate.setHours(23, 59, 59, 999));

    const result = await Attendance.updateMany(
      {
        employeeId: { $in: workerIds.map(id => Number(id)) },
        date: { 
          $gte: startOfDay,
          $lte: endOfDay
        },
        status: 'late'
      },
      {
        $set: {
          linkedToTransportDelay: true,
          linkedDelayId: deviation.id,
          delayReason: delayReason || deviation.reason,
          status: 'late_excused'
        }
      }
    );

    console.log(`✅ Linked ${result.modifiedCount} attendance records to transport delay`);

    res.json({
      success: true,
      data: {
        updatedCount: result.modifiedCount,
        deviationId: deviation.id,
        message: `Linked ${result.modifiedCount} attendance records to transport delay`
      }
    });

  } catch (err) {
    console.error('❌ Error linking delay to attendance:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to link delay to attendance',
      error: err.message
    });
  }
};

export const getDelayAuditTrail = async (req, res) => {
  try {
    const { taskId } = req.params;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📌 Fetching delay audit trail for task: ${taskId}`);

    // Verify task belongs to driver
    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId,
      companyId
    }).lean();

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Transport task not found'
      });
    }

    // Get all deviations
    const deviations = await RouteDeviation.find({ taskId: Number(taskId) })
      .sort({ timestamp: 1 })
      .lean();

    // Get all notifications
    const notifications = await Notification.find({
      'data.taskId': Number(taskId),
      type: { $in: ['transport_delay', 'route_deviation'] }
    }).sort({ createdAt: 1 }).lean();

    res.json({
      success: true,
      data: {
        taskId: Number(taskId),
        deviations: deviations.map(d => ({
          id: d.id,
          timestamp: d.timestamp,
          deviationDistance: d.deviationDistance,
          reason: d.reason,
          estimatedDelay: d.estimatedDelay,
          supervisorNotified: d.supervisorNotified
        })),
        notifications: notifications.map(n => ({
          id: n.id,
          sentAt: n.createdAt,
          message: n.message,
          type: n.type
        })),
        totalDeviations: deviations.length,
        totalEstimatedDelay: deviations.reduce((sum, d) => sum + (d.estimatedDelay || 0), 0)
      }
    });

  } catch (err) {
    console.error('❌ Error fetching delay audit trail:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delay audit trail',
      error: err.message
    });
  }
};

// ==============================
// Multer Configuration for Pickup Photos
// ==============================
const pickupPhotoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/pickup/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const taskId = req.params.taskId || "unknown";
    const locationId = req.body.locationId || "unknown";
    cb(null, `pickup-task${taskId}-loc${locationId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const uploadPickupPhotoMulter = multer({
  storage: pickupPhotoStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// ==============================
// Multer Configuration for Dropoff Photos
// ==============================
const dropoffPhotoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/dropoff/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const taskId = req.params.taskId || "unknown";
    cb(null, `dropoff-task${taskId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const uploadDropoffPhotoMulter = multer({
  storage: dropoffPhotoStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// ==============================
// Upload Pickup Photo Handler
// ==============================
export const uploadPickupPhoto = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { locationId, latitude, longitude, accuracy, timestamp, remarks } = req.body;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📸 Upload pickup photo - Task: ${taskId}, Location: ${locationId}, Driver: ${driverId}`);
    console.log(`📸 Request body:`, req.body);
    console.log(`📸 File info:`, req.file ? { filename: req.file.filename, size: req.file.size } : 'No file');

    // Validate required fields
    if (!req.file) {
      console.error('❌ No photo file uploaded');
      return res.status(400).json({
        success: false,
        message: "No photo file uploaded"
      });
    }

    // Verify task belongs to this driver
    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId: driverId,
      companyId: companyId
    });

    if (!task) {
      console.error(`❌ Task ${taskId} not found for driver ${driverId}`);
      // Delete uploaded file if task not found
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      }
      return res.status(404).json({
        success: false,
        message: "Task not found or not assigned to this driver"
      });
    }

    // Construct photo URL
    const photoUrl = `/uploads/pickup/${req.file.filename}`;

    console.log(`📸 Creating photo record in FleetTaskPhoto collection...`);

    // Create photo record in FleetTaskPhoto collection
    const photoRecord = new FleetTaskPhoto({
      fleetTaskId: Number(taskId),
      driverId: driverId,
      companyId: companyId,
      photoType: "pickup",
      photoUrl: photoUrl,
      remarks: remarks || `Pickup photo at location ${locationId || 'unknown'}`,
      locationId: locationId ? Number(locationId) : null,
      fileName: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      gpsLocation: latitude && longitude ? {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: parseFloat(accuracy || 0)
      } : null,
      uploadedAt: new Date(timestamp || Date.now())
    });

    await photoRecord.save();

    console.log(`✅ Pickup photo saved to FleetTaskPhoto collection - ID: ${photoRecord._id}`);
    console.log(`✅ Photo URL: ${photoUrl}`);

    res.json({
      success: true,
      message: "Pickup photo uploaded successfully",
      photoUrl: photoUrl,
      photoId: photoRecord._id.toString(),
      data: {
        photoUrl: photoUrl,
        photoId: photoRecord._id.toString(),
        uploadedAt: photoRecord.createdAt,
        fileSize: req.file.size,
        gpsTagged: !!photoRecord.gpsLocation
      }
    });

  } catch (err) {
    console.error("❌ Error uploading pickup photo:", err);
    console.error("❌ Error stack:", err.stack);
    
    // Delete uploaded file on error
    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting file:', unlinkErr);
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while uploading photo",
      error: err.message
    });
  }
};

// ==============================
// Upload Dropoff Photo Handler
// ==============================
export const uploadDropoffPhoto = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { latitude, longitude, accuracy, timestamp, remarks } = req.body;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📸 Upload dropoff photo - Task: ${taskId}, Driver: ${driverId}`);
    console.log(`📸 Request body:`, req.body);
    console.log(`📸 File info:`, req.file ? { filename: req.file.filename, size: req.file.size } : 'No file');

    // Validate required fields
    if (!req.file) {
      console.error('❌ No photo file uploaded');
      return res.status(400).json({
        success: false,
        message: "No photo file uploaded"
      });
    }

    // Verify task belongs to this driver
    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId: driverId,
      companyId: companyId
    });

    if (!task) {
      console.error(`❌ Task ${taskId} not found for driver ${driverId}`);
      // Delete uploaded file if task not found
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      }
      return res.status(404).json({
        success: false,
        message: "Task not found or not assigned to this driver"
      });
    }

    // Construct photo URL
    const photoUrl = `/uploads/dropoff/${req.file.filename}`;

    console.log(`📸 Creating photo record in FleetTaskPhoto collection...`);

    // Create photo record in FleetTaskPhoto collection
    const photoRecord = new FleetTaskPhoto({
      fleetTaskId: Number(taskId),
      driverId: driverId,
      companyId: companyId,
      photoType: "dropoff",
      photoUrl: photoUrl,
      remarks: remarks || `Dropoff photo for task ${taskId}`,
      fileName: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      gpsLocation: latitude && longitude ? {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: parseFloat(accuracy || 0)
      } : null,
      uploadedAt: new Date(timestamp || Date.now())
    });

    await photoRecord.save();

    console.log(`✅ Dropoff photo saved to FleetTaskPhoto collection - ID: ${photoRecord._id}`);
    console.log(`✅ Photo URL: ${photoUrl}`);

    res.json({
      success: true,
      message: "Dropoff photo uploaded successfully",
      photoUrl: photoUrl,
      photoId: photoRecord._id.toString(),
      data: {
        photoUrl: photoUrl,
        photoId: photoRecord._id.toString(),
        uploadedAt: photoRecord.createdAt,
        fileSize: req.file.size,
        gpsTagged: !!photoRecord.gpsLocation
      }
    });

  } catch (err) {
    console.error("❌ Error uploading dropoff photo:", err);
    console.error("❌ Error stack:", err.stack);
    
    // Delete uploaded file on error
    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting file:', unlinkErr);
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while uploading photo",
      error: err.message
    });
  }
};


// ==============================
// LOG GEOFENCE VIOLATION
// ==============================
export const logGeofenceViolation = async (req, res) => {
  try {
    const { taskId } = req.params;
    const {
      locationId,
      locationType,
      driverLocation,
      expectedLocation,
      distance,
      timestamp,
      notifyAdmin
    } = req.body;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`🚫 Logging geofence violation for task: ${taskId}, driver: ${driverId}`);
    console.log(`   Location type: ${locationType}, Distance: ${distance}m`);

    // Verify task belongs to driver
    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId,
      companyId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not assigned to this driver'
      });
    }

    // Create violation record using TripIncident model
    const incidentId = await getNextId(TripIncident);
    const violation = new TripIncident({
      id: incidentId,
      fleetTaskId: Number(taskId),
      driverId,
      companyId,
      incidentType: 'GEOFENCE_VIOLATION',
      description: `Geofence violation at ${locationType}: ${distance.toFixed(0)}m away from expected location`,
      location: driverLocation,
      expectedLocation: expectedLocation,
      distance: distance,
      locationType: locationType,
      locationId: locationId,
      requiresAssistance: false,
      status: 'REPORTED',
      notifyAdmin: notifyAdmin || false
    });

    await violation.save();

    console.log(`✅ Geofence violation logged with ID: ${violation.id}`);

    // TODO: Send notification to admin/supervisors if notifyAdmin is true
    // This would integrate with your notification system

    res.json({
      success: true,
      message: 'Geofence violation logged successfully',
      data: {
        violationId: violation.id,
        distance: distance,
        locationType: locationType,
        adminNotified: notifyAdmin || false
      }
    });

  } catch (err) {
    console.error("❌ Error logging geofence violation:", err);
    res.status(500).json({
      success: false,
      message: "Server error while logging geofence violation",
      error: err.message
    });
  }
};

// ==============================
// SUBMIT WORKER MISMATCH
// ==============================
export const submitWorkerMismatch = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { expectedCount, actualCount, mismatches, timestamp, location } = req.body;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`⚠️ Submitting worker mismatch for task: ${taskId}`);
    console.log(`   Expected: ${expectedCount}, Actual: ${actualCount}`);
    console.log(`   Missing workers: ${mismatches.length}`);

    // Verify task belongs to driver
    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId,
      companyId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not assigned to this driver'
      });
    }

    // Create mismatch record using TripIncident model
    const incidentId = await getNextId(TripIncident);
    const mismatchRecord = new TripIncident({
      id: incidentId,
      fleetTaskId: Number(taskId),
      driverId,
      companyId,
      incidentType: 'WORKER_MISMATCH',
      description: `Worker count mismatch: Expected ${expectedCount}, Actual ${actualCount}`,
      location: location,
      expectedCount: expectedCount,
      actualCount: actualCount,
      mismatches: mismatches,
      requiresAssistance: false,
      status: 'REPORTED'
    });

    await mismatchRecord.save();

    // Update attendance records for missing workers
    const today = new Date().toISOString().split('T')[0];
    let attendanceUpdatedCount = 0;

    for (const mismatch of mismatches) {
      try {
        const attendanceUpdate = await Attendance.updateOne(
          {
            employeeId: mismatch.workerId,
            date: today,
            companyId: companyId
          },
          {
            $set: {
              status: mismatch.reason === 'absent' ? 'ABSENT' : 'EXCUSED',
              mismatchReason: mismatch.reason,
              mismatchRemarks: mismatch.remarks,
              transportMismatchId: mismatchRecord.id,
              updatedAt: new Date()
            }
          },
          { upsert: true }
        );

        if (attendanceUpdate.modifiedCount > 0 || attendanceUpdate.upsertedCount > 0) {
          attendanceUpdatedCount++;
        }
      } catch (attendanceError) {
        console.error(`⚠️ Error updating attendance for worker ${mismatch.workerId}:`, attendanceError);
      }
    }

    console.log(`✅ Worker mismatch recorded. Attendance updated for ${attendanceUpdatedCount} workers`);

    // TODO: Send notification to supervisors
    // This would integrate with your notification system

    res.json({
      success: true,
      message: 'Worker mismatch recorded successfully',
      data: {
        mismatchId: mismatchRecord.id,
        expectedCount: expectedCount,
        actualCount: actualCount,
        missingCount: expectedCount - actualCount,
        attendanceUpdatedCount: attendanceUpdatedCount,
        supervisorsNotified: true
      }
    });

  } catch (err) {
    console.error("❌ Error submitting worker mismatch:", err);
    res.status(500).json({
      success: false,
      message: "Server error while submitting worker mismatch",
      error: err.message
    });
  }
};


// ==============================
// REQUEST ALTERNATE VEHICLE
// ==============================
export const requestAlternateVehicle = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { requestType, reason, urgency, currentLocation } = req.body;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`🚗 Requesting alternate vehicle for task: ${taskId}, driver: ${driverId}`);

    if (!requestType || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Request type and reason are required'
      });
    }

    // Verify task belongs to driver
    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId,
      companyId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not assigned to this driver'
      });
    }

    // Check if there's already a pending request
    const existingRequest = await VehicleRequest.findOne({
      fleetTaskId: Number(taskId),
      driverId,
      companyId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'A vehicle request is already pending for this task',
        existingRequest: {
          id: existingRequest.id,
          requestType: existingRequest.requestType,
          urgency: existingRequest.urgency,
          status: existingRequest.status,
          requestedAt: existingRequest.requestedAt
        }
      });
    }

    // Create vehicle request
    const requestId = await getNextId(VehicleRequest);
    const vehicleRequest = new VehicleRequest({
      id: requestId,
      fleetTaskId: Number(taskId),
      driverId,
      companyId,
      requestType,
      reason,
      urgency: urgency || 'medium',
      status: 'pending',
      currentLocation: currentLocation || {}
    });

    await vehicleRequest.save();

    // Determine estimated response time based on urgency
    let estimatedResponse = '30-60 minutes';
    let emergencyContact = null;

    switch (urgency) {
      case 'critical':
        estimatedResponse = 'Immediate (5-10 minutes)';
        emergencyContact = '+971-XX-XXX-XXXX'; // Replace with actual emergency contact
        break;
      case 'high':
        estimatedResponse = '15-30 minutes';
        break;
      case 'medium':
        estimatedResponse = '30-60 minutes';
        break;
      case 'low':
        estimatedResponse = '1-2 hours';
        break;
    }

    // TODO: Send notification to fleet manager/supervisor
    // TODO: If critical, trigger emergency response protocol

    console.log(`✅ Vehicle request created: ${requestId}, urgency: ${urgency}`);

    res.json({
      success: true,
      message: 'Vehicle request submitted successfully',
      data: {
        requestId: vehicleRequest.id,
        status: vehicleRequest.status,
        estimatedResponse,
        emergencyContact,
        requestedAt: vehicleRequest.requestedAt
      }
    });

  } catch (err) {
    console.error("❌ Error requesting alternate vehicle:", err);
    res.status(500).json({
      success: false,
      message: "Server error while requesting vehicle",
      error: err.message
    });
  }
};

// ============================================
// FUEL LOG MANAGEMENT
// ============================================

/**
 * Submit Fuel Log Entry
 * POST /api/v1/driver/vehicle/fuel-log
 */
export const submitFuelLog = async (req, res) => {
  try {
    const driverId = req.user.id;
    const companyId = req.user.companyId;
    const { vehicleId, date, amount, cost, mileage, location, receiptPhoto, gpsLocation } = req.body;

    console.log('🔹 Submit fuel log request:', { driverId, vehicleId, amount, cost, mileage, location });

    // Validation
    if (!vehicleId || !amount || !cost || !mileage || !location) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: vehicleId, amount, cost, mileage, location'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Fuel amount must be greater than 0'
      });
    }

    if (cost <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Cost must be greater than 0'
      });
    }

    if (mileage < 0) {
      return res.status(400).json({
        success: false,
        message: 'Mileage cannot be negative'
      });
    }

    // Import FuelLog model
    const FuelLog = (await import('./models/FuelLog.js')).default;

    // Get driver record - use imported Driver model
    const driver = await Driver.findOne({ id: driverId, companyId });
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Get driver name from employees collection using employeeId
    let driverName = 'Unknown Driver';
    if (driver.employeeId) {
      const employee = await Employee.findOne({ 
        id: driver.employeeId, 
        companyId 
      });
      
      if (employee) {
        driverName = employee.name || employee.fullName || 'Unknown Driver';
        console.log(`✅ Found driver name from employee: ${driverName} (employeeId: ${driver.employeeId})`);
      } else {
        console.warn(`⚠️ Employee not found for employeeId: ${driver.employeeId}`);
        // Fallback to driver record name fields
        driverName = driver.name || driver.username || 'Unknown Driver';
      }
    } else {
      console.warn(`⚠️ Driver ${driverId} has no employeeId`);
      // Fallback to driver record name fields
      driverName = driver.name || driver.username || 'Unknown Driver';
    }

    // Verify vehicle exists - use imported FleetVehicle model
    const vehicle = await FleetVehicle.findOne({ id: Number(vehicleId), companyId });
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if mileage is valid (should be >= vehicle's current mileage)
    if (vehicle.currentMileage && mileage < vehicle.currentMileage) {
      return res.status(400).json({
        success: false,
        message: `Mileage must be at least ${vehicle.currentMileage} km (current vehicle mileage)`
      });
    }

    // Get next fuel log ID
    const lastFuelLog = await FuelLog.findOne().sort({ id: -1 });
    const nextId = lastFuelLog ? lastFuelLog.id + 1 : 1;

    // Create fuel log entry
    const fuelLog = new FuelLog({
      id: nextId,
      vehicleId: Number(vehicleId),
      driverId,
      driverName: driverName,
      date: date ? new Date(date) : new Date(),
      amount: Number(amount),
      cost: Number(cost),
      pricePerLiter: Number(cost) / Number(amount),
      mileage: Number(mileage),
      location: location.trim(),
      receiptPhoto: receiptPhoto || null,
      gpsLocation: gpsLocation || { latitude: null, longitude: null },
      status: 'pending'
    });

    await fuelLog.save();

    // Update vehicle's current mileage and fuel level if provided
    await FleetVehicle.updateOne(
      { id: Number(vehicleId), companyId },
      { 
        $set: { 
          currentMileage: Number(mileage),
          odometer: Number(mileage),
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ Fuel log created: ${nextId} for vehicle ${vehicleId}`);

    res.json({
      success: true,
      message: 'Fuel log entry saved successfully',
      data: {
        id: fuelLog.id,
        vehicleId: fuelLog.vehicleId,
        date: fuelLog.date,
        amount: fuelLog.amount,
        cost: fuelLog.cost,
        pricePerLiter: fuelLog.pricePerLiter,
        mileage: fuelLog.mileage,
        location: fuelLog.location,
        status: fuelLog.status,
        createdAt: fuelLog.createdAt
      }
    });

  } catch (err) {
    console.error("❌ Error submitting fuel log:", err);
    res.status(500).json({
      success: false,
      message: "Server error while submitting fuel log",
      error: err.message
    });
  }
};

/**
 * Get Fuel Log History
 * GET /api/v1/driver/vehicle/fuel-log
 */
export const getFuelLogHistory = async (req, res) => {
  try {
    const driverId = req.user.id;
    const companyId = req.user.companyId;
    const { vehicleId, limit = 10, status } = req.query;

    console.log('🔹 Get fuel log history:', { driverId, vehicleId, limit, status });

    // Import FuelLog model
    const FuelLog = (await import('./models/FuelLog.js')).default;

    // Build query
    const query = { driverId };
    
    if (vehicleId) {
      query.vehicleId = Number(vehicleId);
    }
    
    if (status) {
      query.status = status;
    }

    // Get fuel logs
    const fuelLogs = await FuelLog.find(query)
      .sort({ date: -1 })
      .limit(Number(limit));

    // Calculate summary statistics
    const totalEntries = await FuelLog.countDocuments(query);
    const totalCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0);
    const totalAmount = fuelLogs.reduce((sum, log) => sum + log.amount, 0);
    const avgPricePerLiter = totalAmount > 0 ? totalCost / totalAmount : 0;

    res.json({
      success: true,
      data: {
        fuelLogs: fuelLogs.map(log => ({
          id: log.id,
          vehicleId: log.vehicleId,
          date: log.date,
          amount: log.amount,
          cost: log.cost,
          pricePerLiter: log.pricePerLiter,
          mileage: log.mileage,
          location: log.location,
          receiptPhoto: log.receiptPhoto,
          status: log.status,
          createdAt: log.createdAt
        })),
        summary: {
          totalEntries,
          totalCost: totalCost.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          avgPricePerLiter: avgPricePerLiter.toFixed(2)
        }
      }
    });

  } catch (err) {
    console.error("❌ Error getting fuel log history:", err);
    res.status(500).json({
      success: false,
      message: "Server error while getting fuel log history",
      error: err.message
    });
  }
};

/**
 * Get Fuel Log by Vehicle
 * GET /api/v1/driver/vehicle/:vehicleId/fuel-log
 */
export const getVehicleFuelLog = async (req, res) => {
  try {
    const driverId = req.user.id;
    const companyId = req.user.companyId;
    const { vehicleId } = req.params;
    const { limit = 5 } = req.query;

    console.log('🔹 Get vehicle fuel log:', { vehicleId, limit });

    // Import FuelLog model
    const FuelLog = (await import('./models/FuelLog.js')).default;

    // Verify vehicle exists - use imported FleetVehicle model
    const vehicle = await FleetVehicle.findOne({ id: Number(vehicleId), companyId });
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Get fuel logs for this vehicle
    const fuelLogs = await FuelLog.find({ vehicleId: Number(vehicleId) })
      .sort({ date: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      data: fuelLogs.map(log => ({
        id: log.id,
        date: log.date,
        amount: log.amount,
        cost: log.cost,
        pricePerLiter: log.pricePerLiter,
        mileage: log.mileage,
        location: log.location,
        receiptPhoto: log.receiptPhoto,
        status: log.status
      }))
    });

  } catch (err) {
    console.error("❌ Error getting vehicle fuel log:", err);
    res.status(500).json({
      success: false,
      message: "Server error while getting vehicle fuel log",
      error: err.message
    });
  }
};


// ============================================
// VEHICLE ISSUE REPORTING
// ============================================

/**
 * Report Vehicle Issue
 * POST /api/v1/driver/vehicle/report-issue
 */
export const reportVehicleIssue = async (req, res) => {
  try {
    const driverId = req.user?.id || req.user?.userId;
    const companyId = req.user?.companyId;
    const { vehicleId, category, description, severity, location, photos, immediateAssistance } = req.body;

    console.log('🔧 Report vehicle issue request:', { 
      driverId, 
      companyId, 
      vehicleId, 
      category, 
      severity,
      hasLocation: !!location,
      hasPhotos: !!photos,
      userObject: req.user
    });

    // Validation - check user data first
    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: 'Driver ID not found in user session'
      });
    }

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID not found in user session'
      });
    }

    // Validation - check request body
    if (!vehicleId || !category || !description || !severity) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: vehicleId, category, description, severity'
      });
    }

    // Validate category
    const validCategories = ['mechanical', 'electrical', 'safety', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    // Validate severity
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      return res.status(400).json({
        success: false,
        message: `Invalid severity. Must be one of: ${validSeverities.join(', ')}`
      });
    }

    // Import VehicleIssue model
    const VehicleIssue = (await import('./models/VehicleIssue.js')).default;

    // Get driver record
    const driver = await Driver.findOne({ id: driverId, companyId });
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Get driver name from employees collection
    let driverName = 'Unknown Driver';
    if (driver.employeeId) {
      const employee = await Employee.findOne({ 
        id: driver.employeeId, 
        companyId 
      });
      
      if (employee) {
        driverName = employee.name || employee.fullName || 'Unknown Driver';
      } else {
        driverName = driver.name || driver.username || 'Unknown Driver';
      }
    } else {
      driverName = driver.name || driver.username || 'Unknown Driver';
    }

    // Verify vehicle exists
    const vehicle = await FleetVehicle.findOne({ id: Number(vehicleId), companyId });
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Get next issue ID
    const lastIssue = await VehicleIssue.findOne().sort({ id: -1 });
    const nextId = lastIssue ? lastIssue.id + 1 : 1;

    // Determine vehicle status based on severity
    let vehicleStatus = 'operational';
    if (severity === 'critical') {
      vehicleStatus = 'out_of_service';
    } else if (severity === 'high') {
      vehicleStatus = 'needs_repair';
    }

    // Prepare location data - only include non-null values
    const locationData = {};
    if (location?.latitude !== null && location?.latitude !== undefined) {
      locationData.latitude = location.latitude;
    }
    if (location?.longitude !== null && location?.longitude !== undefined) {
      locationData.longitude = location.longitude;
    }
    if (location?.address) {
      locationData.address = location.address;
    }

    // Create vehicle issue - only include required fields and non-null optional fields
    const issueData = {
      id: nextId,
      vehicleId: Number(vehicleId),
      driverId: Number(driverId),
      driverName: String(driverName),
      companyId: Number(companyId),
      category: String(category),
      description: String(description).trim(),
      severity: String(severity),
      reportedAt: new Date(),
      immediateAssistance: Boolean(immediateAssistance),
      status: 'reported',
      vehicleStatus: String(vehicleStatus)
    };

    // Only add location if it has data
    if (Object.keys(locationData).length > 0) {
      issueData.location = locationData;
    }

    // Only add photos if array has items
    if (Array.isArray(photos) && photos.length > 0) {
      issueData.photos = photos;
    }

    const vehicleIssue = new VehicleIssue(issueData);

    console.log('📝 Vehicle issue object created:', {
      id: vehicleIssue.id,
      vehicleId: vehicleIssue.vehicleId,
      driverId: vehicleIssue.driverId,
      companyId: vehicleIssue.companyId,
      category: vehicleIssue.category,
      severity: vehicleIssue.severity
    });

    await vehicleIssue.save();

    console.log(`✅ Vehicle issue saved to database: ${nextId} for vehicle ${vehicleId}`);

    res.json({
      success: true,
      message: 'Vehicle issue reported successfully',
      data: {
        id: vehicleIssue.id,
        vehicleId: vehicleIssue.vehicleId,
        category: vehicleIssue.category,
        description: vehicleIssue.description,
        severity: vehicleIssue.severity,
        status: vehicleIssue.status,
        vehicleStatus: vehicleIssue.vehicleStatus,
        reportedAt: vehicleIssue.reportedAt,
        immediateAssistance: vehicleIssue.immediateAssistance
      }
    });

  } catch (err) {
    console.error("❌ Error reporting vehicle issue:", err);
    console.error("❌ Error stack:", err.stack);
    res.status(500).json({
      success: false,
      message: "Server error while reporting vehicle issue",
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

/**
 * Get Vehicle Issues
 * GET /api/v1/driver/vehicle/issues
 */
export const getVehicleIssues = async (req, res) => {
  try {
    const driverId = req.user.id;
    const companyId = req.user.companyId;
    const { vehicleId, status, limit = 10 } = req.query;

    console.log('🔧 Get vehicle issues:', { driverId, vehicleId, status, limit });

    // Import VehicleIssue model
    const VehicleIssue = (await import('./models/VehicleIssue.js')).default;

    // Build query
    const query = { companyId };
    
    if (vehicleId) {
      query.vehicleId = Number(vehicleId);
    }
    
    if (status) {
      query.status = status;
    }

    // Get vehicle issues
    const issues = await VehicleIssue.find(query)
      .sort({ reportedAt: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      data: issues.map(issue => ({
        id: issue.id,
        vehicleId: issue.vehicleId,
        driverId: issue.driverId,
        driverName: issue.driverName,
        category: issue.category,
        description: issue.description,
        severity: issue.severity,
        status: issue.status,
        vehicleStatus: issue.vehicleStatus,
        reportedAt: issue.reportedAt,
        immediateAssistance: issue.immediateAssistance,
        photos: issue.photos,
        location: issue.location
      }))
    });

  } catch (err) {
    console.error("❌ Error getting vehicle issues:", err);
    res.status(500).json({
      success: false,
      message: "Server error while getting vehicle issues",
      error: err.message
    });
  }
};

// VEHICLE INSPECTION (PRE-CHECK)
// ============================================

/**
 * Submit Vehicle Inspection
 * POST /api/v1/driver/vehicle/inspection
 */
export const submitVehicleInspection = async (req, res) => {
  try {
    const driverId = req.user?.id || req.user?.userId;
    const companyId = req.user?.companyId;
    const { 
      vehicleId, 
      checklist, 
      odometerReading, 
      location, 
      signature,
      inspectionType = 'pre_trip'
    } = req.body;

    console.log('🔍 Submit vehicle inspection request:', { 
      driverId, 
      companyId, 
      vehicleId, 
      odometerReading,
      inspectionType,
      hasChecklist: !!checklist,
      hasSignature: !!signature
    });

    // Validation
    if (!driverId || !companyId) {
      return res.status(400).json({
        success: false,
        message: 'Driver ID or Company ID not found in user session'
      });
    }

    if (!vehicleId || !checklist || odometerReading === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: vehicleId, checklist, odometerReading'
      });
    }

    // Validate checklist has all required items
    const requiredItems = [
      'tires', 'lights', 'brakes', 'steering', 'fluids', 
      'mirrors', 'seatbelts', 'horn', 'wipers', 
      'emergencyEquipment', 'interior', 'exterior'
    ];

    for (const item of requiredItems) {
      if (!checklist[item] || !checklist[item].status) {
        return res.status(400).json({
          success: false,
          message: `Missing or invalid checklist item: ${item}`
        });
      }
    }

    // Import VehicleInspection model
    const VehicleInspection = (await import('./models/VehicleInspection.js')).default;

    // Get driver record
    const driver = await Driver.findOne({ id: driverId, companyId });
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Get driver name from employees collection
    let driverName = 'Unknown Driver';
    if (driver.employeeId) {
      const employee = await Employee.findOne({ 
        id: driver.employeeId, 
        companyId 
      });
      
      if (employee) {
        driverName = employee.name || employee.fullName || 'Unknown Driver';
      } else {
        driverName = driver.name || driver.username || 'Unknown Driver';
      }
    } else {
      driverName = driver.name || driver.username || 'Unknown Driver';
    }

    // Verify vehicle exists
    const vehicle = await FleetVehicle.findOne({ id: Number(vehicleId), companyId });
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Calculate overall status and find issues
    let passCount = 0;
    let failCount = 0;
    let needsAttentionCount = 0;
    const issuesFound = [];

    for (const [itemName, itemData] of Object.entries(checklist)) {
      if (itemData.status === 'pass') {
        passCount++;
      } else if (itemData.status === 'fail') {
        failCount++;
        
        // Determine severity based on item type
        let severity = 'medium';
        if (['brakes', 'steering', 'tires', 'lights'].includes(itemName)) {
          severity = 'high';
        }
        if (itemName === 'brakes') {
          severity = 'critical';
        }
        
        issuesFound.push({
          item: itemName,
          severity: severity,
          description: itemData.notes || `${itemName} inspection failed`,
          actionRequired: `Repair or replace ${itemName}`
        });
      } else if (itemData.status === 'needs_attention') {
        needsAttentionCount++;
        issuesFound.push({
          item: itemName,
          severity: 'low',
          description: itemData.notes || `${itemName} needs attention`,
          actionRequired: `Inspect and service ${itemName}`
        });
      }
    }

    // Determine overall status
    let overallStatus = 'pass';
    let canProceed = true;

    if (failCount > 0) {
      // Check if any critical items failed
      const criticalFailed = issuesFound.some(issue => issue.severity === 'critical');
      if (criticalFailed) {
        overallStatus = 'fail';
        canProceed = false;
      } else {
        overallStatus = 'conditional_pass';
        canProceed = true;
      }
    } else if (needsAttentionCount > 0) {
      overallStatus = 'conditional_pass';
      canProceed = true;
    }

    // Get next inspection ID
    const lastInspection = await VehicleInspection.findOne().sort({ id: -1 });
    const nextId = lastInspection ? lastInspection.id + 1 : 1;

    // Prepare location data
    const locationData = {};
    if (location?.latitude !== null && location?.latitude !== undefined) {
      locationData.latitude = location.latitude;
    }
    if (location?.longitude !== null && location?.longitude !== undefined) {
      locationData.longitude = location.longitude;
    }
    if (location?.address) {
      locationData.address = location.address;
    }

    // Create vehicle inspection
    const inspectionData = {
      id: nextId,
      vehicleId: Number(vehicleId),
      driverId: Number(driverId),
      driverName: String(driverName),
      companyId: Number(companyId),
      inspectionDate: new Date(),
      inspectionType: String(inspectionType),
      checklist: checklist,
      overallStatus: String(overallStatus),
      canProceed: Boolean(canProceed),
      issuesFound: issuesFound,
      odometerReading: Number(odometerReading)
    };

    if (Object.keys(locationData).length > 0) {
      inspectionData.location = locationData;
    }

    if (signature) {
      inspectionData.signature = signature;
    }

    const vehicleInspection = new VehicleInspection(inspectionData);

    await vehicleInspection.save();

    console.log(`✅ Vehicle inspection saved: ${nextId} for vehicle ${vehicleId} - Status: ${overallStatus}`);

    // If inspection failed or has issues, create VehicleIssue entries
    if (issuesFound.length > 0 && (overallStatus === 'fail' || overallStatus === 'conditional_pass')) {
      const VehicleIssue = (await import('./models/VehicleIssue.js')).default;
      
      for (const issue of issuesFound) {
        // Only create issues for failed items (not needs_attention)
        if (issue.severity !== 'low') {
          const lastIssue = await VehicleIssue.findOne().sort({ id: -1 });
          const issueId = lastIssue ? lastIssue.id + 1 : 1;

          const vehicleIssue = new VehicleIssue({
            id: issueId,
            vehicleId: Number(vehicleId),
            driverId: Number(driverId),
            driverName: String(driverName),
            companyId: Number(companyId),
            category: 'safety',
            description: `Pre-check inspection: ${issue.description}`,
            severity: issue.severity,
            reportedAt: new Date(),
            status: 'reported',
            vehicleStatus: issue.severity === 'critical' ? 'out_of_service' : 'needs_repair',
            location: Object.keys(locationData).length > 0 ? locationData : undefined
          });

          await vehicleIssue.save();
          console.log(`✅ Auto-created vehicle issue ${issueId} from inspection`);
        }
      }
    }

    res.json({
      success: true,
      message: 'Vehicle inspection submitted successfully',
      data: {
        id: vehicleInspection.id,
        vehicleId: vehicleInspection.vehicleId,
        inspectionDate: vehicleInspection.inspectionDate,
        overallStatus: vehicleInspection.overallStatus,
        canProceed: vehicleInspection.canProceed,
        issuesFound: vehicleInspection.issuesFound,
        odometerReading: vehicleInspection.odometerReading
      }
    });

  } catch (err) {
    console.error("❌ Error submitting vehicle inspection:", err);
    console.error("❌ Error stack:", err.stack);
    res.status(500).json({
      success: false,
      message: "Server error while submitting vehicle inspection",
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

/**
 * Get Vehicle Inspections
 * GET /api/v1/driver/vehicle/inspections
 */
export const getVehicleInspections = async (req, res) => {
  try {
    const driverId = req.user.id;
    const companyId = req.user.companyId;
    const { vehicleId, limit = 5 } = req.query;

    console.log('🔍 Get vehicle inspections:', { driverId, vehicleId, limit });

    // Import VehicleInspection model
    const VehicleInspection = (await import('./models/VehicleInspection.js')).default;

    // Build query
    const query = { companyId };
    
    if (vehicleId) {
      query.vehicleId = Number(vehicleId);
    }

    // Get vehicle inspections
    const inspections = await VehicleInspection.find(query)
      .sort({ inspectionDate: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      data: inspections.map(inspection => ({
        id: inspection.id,
        vehicleId: inspection.vehicleId,
        driverId: inspection.driverId,
        driverName: inspection.driverName,
        inspectionDate: inspection.inspectionDate,
        inspectionType: inspection.inspectionType,
        overallStatus: inspection.overallStatus,
        canProceed: inspection.canProceed,
        issuesFound: inspection.issuesFound,
        odometerReading: inspection.odometerReading,
        location: inspection.location
      }))
    });

  } catch (err) {
    console.error("❌ Error getting vehicle inspections:", err);
    res.status(500).json({
      success: false,
      message: "Server error while getting vehicle inspections",
      error: err.message
    });
  }
};

/**
 * Get Single Vehicle Inspection Details
 * GET /api/v1/driver/vehicle/inspection/:id
 */
export const getVehicleInspectionDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    console.log('🔍 Get vehicle inspection details:', { id, companyId });

    // Import VehicleInspection model
    const VehicleInspection = (await import('./models/VehicleInspection.js')).default;

    const inspection = await VehicleInspection.findOne({ 
      id: Number(id), 
      companyId 
    });

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found'
      });
    }

    res.json({
      success: true,
      data: inspection
    });

  } catch (err) {
    console.error("❌ Error getting vehicle inspection details:", err);
    res.status(500).json({
      success: false,
      message: "Server error while getting vehicle inspection details",
      error: err.message
    });
  }
};
