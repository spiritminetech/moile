// controllers/workerController.js

import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import multer from "multer";
import mongoose from "mongoose";
import FleetTask from "../fleetTask/models/FleetTask.js";
import FleetTaskPassenger from "../fleetTask/submodules/fleetTaskPassenger/FleetTaskPassenger.js";
import Project from '../project/models/Project.js';
import FleetVehicle from "../fleetTask/submodules/fleetvehicle/FleetVehicle.js";
import Employee from "../employee/Employee.js";
import EmployeeWorkPass from "../employee/EmployeeWorkPass.js";
import EmployeeCertifications from "../employee/EmployeeCertifications.js";
import User from "../user/User.js";
import Company from "../company/Company.js";
import WorkerTaskAssignment from "../worker/models/WorkerTaskAssignment.js";
import WorkerTaskProgress from "../worker/models/WorkerTaskProgress.js";
import WorkerTaskPhoto from "../worker/models/WorkerTaskPhoto.js";
import Task from "../task/Task.js";
import Attendance from "../attendance/Attendance.js";
import LocationLog from "../attendance/LocationLog.js";
import Tool from "../project/models/Tool.js";
import Material from "../project/models/Material.js";
import { validateGeofence } from "../../../utils/geofenceUtil.js";
import { 
  validateAuthData, 
  validateDateString, 
  validateProgressPercentage,
  validateNumericValue,
  validateStringField,
  validateCoordinates,
  validateId
} from "../../../utils/validationUtil.js";
import TaskNotificationService from '../notification/services/TaskNotificationService.js';

/* ----------------------------------------------------
   Helper: Resolve logged-in employee (MANDATORY)
---------------------------------------------------- */
const resolveEmployee = async (req) => {
  try {
    // Validate request structure
    if (!req || !req.user) {
      console.error("❌ Invalid request structure - missing user data");
      return null;
    }

    const { userId, companyId } = req.user;

    // Validate required fields
    if (!userId || !companyId) {
      console.error("❌ Missing required user fields:", { userId, companyId });
      return null;
    }

    // Validate field types
    if (!Number.isInteger(userId) || !Number.isInteger(companyId)) {
      console.error("❌ Invalid user field types:", { 
        userId: typeof userId, 
        companyId: typeof companyId 
      });
      return null;
    }

    // Validate field values
    if (userId <= 0 || companyId <= 0) {
      console.error("❌ Invalid user field values:", { userId, companyId });
      return null;
    }

    const employee = await Employee.findOne({
      userId: userId,
      companyId: companyId,
      status: "ACTIVE"
    });

    if (!employee) {
      console.warn("⚠️ Employee not found or inactive:", { userId, companyId });
      return null;
    }

    // Validate employee data integrity
    if (!employee.id || !employee.fullName) {
      console.error("❌ Employee data integrity issue:", {
        employeeId: employee.id,
        hasFullName: Boolean(employee.fullName)
      });
      return null;
    }

    return employee;

  } catch (error) {
    console.error("❌ Error resolving employee:", error);
    return null;
  }
};

/* ----------------------------------------------------
   Multer Configuration for Worker Photo Upload
---------------------------------------------------- */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/workers/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const userId = req.user?.userId || "unknown";
    cb(null, `worker-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
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

/* ----------------------------------------------------
   GET /worker/profile - Get worker profile
---------------------------------------------------- */
export const getWorkerProfile = async (req, res) => {
  try {
    const { userId, companyId, role } = req.user || {};

    if (!userId || !companyId) {
      return res.status(400).json({
        success: false,
        message: "Invalid user or company information.",
      });
    }

    // First fetch employee to get the employee.id
    const employee = await Employee.findOne({ userId: userId, companyId: companyId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee details not found",
      });
    }

    // Fetch company, user, work pass, and certifications in parallel for efficiency
    const [company, user, workPass, certifications] = await Promise.all([
      Company.findOne({ id: companyId }),
      User.findOne({ id: userId }),
      EmployeeWorkPass.findOne({ employeeId: employee.id }).sort({ createdAt: -1 }), // Get latest work pass using employee.id
      EmployeeCertifications.find({ employeeId: employee.id }).sort({ expiryDate: 1 }) // Get certifications sorted by expiry
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

    // Construct profile with work pass information (remove ID from response)
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:5002';
    const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;
    const photoUrl = employee.photoUrl || employee.photo_url;
    
    // Ensure photo URL is absolute
    let fullPhotoUrl = null;
    if (photoUrl) {
      if (photoUrl.startsWith('http')) {
        fullPhotoUrl = photoUrl;
      } else if (photoUrl.startsWith('/uploads')) {
        fullPhotoUrl = `${baseUrl}${photoUrl}`;
      } else {
        fullPhotoUrl = `${baseUrl}/uploads/workers/${photoUrl}`;
      }
    }

    const profile = {
      employeeId: employee.id,
      employeeCode: employee.employeeCode || null,
      name: employee.fullName,
      email: user.email,
      phoneNumber: employee.phone || user.phone || "N/A",
      nationality: employee.nationality || "N/A",
      jobTitle: employee.jobTitle || "Worker",
      department: employee.department || "Construction",
      companyName: company.name,
      role,
      photoUrl: fullPhotoUrl,
      status: employee.status || "ACTIVE",
      workPassNumber: workPass?.workPermitNo || workPass?.finNumber || null,
      workPass: workPass ? {
        id: workPass.id || workPass._id,
        passNumber: workPass.workPermitNo || 'N/A',
        finNumber: workPass.finNumber || 'N/A',
        workPassType: workPass.workPassType || 'WORK_PERMIT',
        issueDate: workPass.issuanceDate || workPass.createdAt,
        expiryDate: workPass.expiryDate,
        status: workPass.status?.toLowerCase() || 'active',
        applicationDoc: workPass.applicationDoc || null,
        medicalDoc: workPass.medicalDoc || null,
        issuanceDoc: workPass.issuanceDoc || null,
        momDoc: workPass.momDoc || null
      } : {
        id: 0,
        passNumber: 'N/A',
        finNumber: 'N/A',
        workPassType: 'WORK_PERMIT',
        issueDate: new Date().toISOString(),
        expiryDate: new Date().toISOString(),
        status: 'active',
        applicationDoc: null,
        medicalDoc: null,
        issuanceDoc: null,
        momDoc: null
      },
      certifications: certifications ? certifications.map(cert => {
        // Calculate status based on expiry date
        let status = 'active';
        if (cert.expiryDate) {
          const now = new Date();
          const expiryDate = new Date(cert.expiryDate);
          const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry < 0) {
            status = 'expired';
          } else if (daysUntilExpiry <= 30) {
            status = 'expiring_soon';
          } else {
            status = 'active';
          }
        }

        // Extract certificate number from document path
        let certificateNumber = 'N/A';
        if (cert.documentPath) {
          const filename = path.basename(cert.documentPath, path.extname(cert.documentPath));
          // Remove common prefixes and use a more meaningful number
          certificateNumber = filename.replace(/^(cert_|certificate_|doc_)/, '').toUpperCase();
        }

        // Determine issuer based on ownership
        let issuer = 'N/A';
        if (cert.ownership === 'company') {
          issuer = company?.name || 'Company';
        } else if (cert.ownership === 'employee') {
          issuer = 'External Provider';
        }

        return {
          id: cert.id || cert._id?.toString() || Math.random().toString(),
          name: cert.name || 'Unknown Certification',
          type: cert.type || 'training',
          certificationType: cert.certificationType || 'NEW',
          ownership: cert.ownership || 'company',
          issuer: issuer,
          issueDate: cert.issueDate ? cert.issueDate.toISOString() : new Date().toISOString(),
          expiryDate: cert.expiryDate ? cert.expiryDate.toISOString() : null,
          certificateNumber: certificateNumber,
          status: status,
          documentPath: cert.documentPath || null
        };
      }) : [],
      createdAt: employee.createdAt || user.createdAt,
      updatedAt: employee.updatedAt || employee.createdAt || user.updatedAt,
    };

    console.log("✅ Profile retrieved:", {
      userId,
      companyId,
      hasPhoto: !!fullPhotoUrl,
      photoUrl: fullPhotoUrl,
      originalPhotoUrl: photoUrl,
      baseUrl,
      certificationsCount: certifications?.length || 0,
      sampleCertification: certifications?.[0] ? {
        name: certifications[0].name,
        ownership: certifications[0].ownership,
        documentPath: certifications[0].documentPath,
        expiryDate: certifications[0].expiryDate
      } : null
    });

    return res.json({ success: true, profile });

  } catch (err) {
    console.error("Error fetching worker profile:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching worker profile",
      error: err.message,
    });
  }
};

/* ----------------------------------------------------
   PUT /worker/profile/password - Change worker password
---------------------------------------------------- */
export const changeWorkerPassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword)
      return res.status(400).json({ success: false, message: "Both passwords required" });

    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: "Password too short" });

    const user = await User.findOne({ id: userId });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid)
      return res.status(400).json({ success: false, message: "Incorrect current password" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne(
      { id: userId },
      { $set: { passwordHash: hashedPassword, updatedAt: new Date() } }
    );

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("❌ Error changing password:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

/* ----------------------------------------------------
   POST /worker/profile/photo - Upload worker photo
---------------------------------------------------- */
export const uploadWorkerPhoto = async (req, res) => {
  try {
    const userId = req.user.userId;
    const companyId = req.user.companyId;

    if (!req.file)
      return res.status(400).json({ success: false, message: "No photo file uploaded" });

    // Construct full photo URL with server base URL (without /api prefix for static files)
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:5002';
    const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;
    const photoUrl = `${baseUrl}/uploads/workers/${req.file.filename}`;

    await Employee.updateOne(
      { userId: userId, companyId: companyId },
      { $set: { photoUrl, updatedAt: new Date() } }
    );

    const [employee, company, user] = await Promise.all([
      Employee.findOne({ userId: userId, companyId: companyId }),
      Company.findOne({ id: companyId }),
      User.findOne({ id: userId }),
    ]);

    const updatedProfile = {
      employeeId: employee.id,
      name: employee.fullName,
      email: user?.email || "N/A",
      phoneNumber: employee.phone || "N/A",
      companyName: company?.name || "N/A",
      role: "worker",
      photoUrl,
      employeeCode: employee.employeeCode || null,
      jobTitle: employee.jobTitle || "Worker",
    };

    console.log("✅ Photo uploaded successfully:", {
      filename: req.file.filename,
      photoUrl,
      userId,
      companyId,
      protocol,
      host,
      baseUrl
    });

    res.json({
      success: true,
      message: "Profile photo updated successfully",
      data: {
        worker: updatedProfile,
        photoUrl,
      },
      photoUrl, // Include this for backward compatibility
    });
  } catch (err) {
    console.error("❌ Error uploading photo:", err);
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ success: false, message: "Upload failed", error: err.message });
  }
};

/* ----------------------------------------------------
   GET /worker/profile/certification-alerts - Get certification expiry alerts
---------------------------------------------------- */
export const getWorkerCertificationAlerts = async (req, res) => {
  try {
    const { userId, companyId } = req.user || {};

    if (!userId || !companyId) {
      return res.status(400).json({
        success: false,
        message: "Invalid user or company information.",
      });
    }

    const employee = await Employee.findOne({ userId: userId, companyId: companyId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee details not found",
      });
    }

    // Get certifications from the database
    const certifications = await EmployeeCertifications.find({ employeeId: employee.id });

    if (!certifications || certifications.length === 0) {
      return res.json({ 
        success: true, 
        data: [], // Return empty array for frontend compatibility
        message: "No certifications found for this employee"
      });
    }

    // Generate alerts array for frontend
    const alerts = [];
    const now = new Date();

    certifications.forEach(cert => {
      if (!cert.expiryDate) {
        // Skip certifications without expiry dates (they don't need alerts)
        return;
      }

      const expiryDate = new Date(cert.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      
      let alertLevel = null;
      
      if (daysUntilExpiry < 0) {
        alertLevel = 'expired';
      } else if (daysUntilExpiry <= 7) {
        alertLevel = 'urgent';
      } else if (daysUntilExpiry <= 30) {
        alertLevel = 'warning';
      }

      // Only create alerts for certifications that need attention
      if (alertLevel) {
        alerts.push({
          certificationId: cert.id || cert._id,
          name: cert.name || 'Unknown Certification',
          expiryDate: cert.expiryDate,
          daysUntilExpiry: daysUntilExpiry,
          alertLevel: alertLevel
        });
      }
    });

    // Sort alerts by severity (expired > urgent > warning)
    alerts.sort((a, b) => {
      const severityOrder = { expired: 3, urgent: 2, warning: 1 };
      return severityOrder[b.alertLevel] - severityOrder[a.alertLevel];
    });

    // Generate summary message
    let summaryMessage = '';
    if (alerts.length === 0) {
      summaryMessage = "All certifications are up to date";
    } else {
      const expiredCount = alerts.filter(a => a.alertLevel === 'expired').length;
      const urgentCount = alerts.filter(a => a.alertLevel === 'urgent').length;
      const warningCount = alerts.filter(a => a.alertLevel === 'warning').length;
      
      if (expiredCount > 0) {
        summaryMessage = `${expiredCount} certification${expiredCount === 1 ? '' : 's'} expired - immediate action required`;
      } else if (urgentCount > 0) {
        summaryMessage = `${urgentCount} certification${urgentCount === 1 ? '' : 's'} expiring within 7 days`;
      } else {
        summaryMessage = `${warningCount} certification${warningCount === 1 ? '' : 's'} expiring within 30 days`;
      }
    }

    return res.json({ 
      success: true, 
      data: alerts, // Return flat array for frontend compatibility
      message: summaryMessage
    });

  } catch (err) {
    console.error("Error fetching certification alerts:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching certification alerts",
      error: err.message,
    });
  }
};

/* ----------------------------------------------------
   GET /worker/tasks/today - Comprehensive task details
   Enhanced version with full mobile app requirements
---------------------------------------------------- */
export const getWorkerTasksToday = async (req, res) => {
  try {
    // Rate limiting check (basic implementation)
    const clientIP = req.ip || req.connection.remoteAddress;
    const rateLimitKey = `worker_tasks_${clientIP}`;
    
    // Input validation using validation utilities
    const authValidation = validateAuthData(req);
    if (!authValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: authValidation.message,
        error: authValidation.error
      });
    }

    const { userId, companyId } = authValidation;

    // Validate optional query parameters
    const dateValidation = validateDateString(req.query?.date, false);
    if (!dateValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: dateValidation.message,
        error: dateValidation.error
      });
    }

    const targetDate = dateValidation.date;

    // Resolve employee with additional validation
    const employee = await resolveEmployee(req);
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: "Employee not found or inactive",
        error: "EMPLOYEE_NOT_FOUND"
      });
    }

    // Validate employee status
    if (employee.status !== 'ACTIVE') {
      return res.status(403).json({ 
        success: false, 
        message: "Employee account is not active",
        error: "EMPLOYEE_INACTIVE"
      });
    }

    const today = targetDate;

    // Get all task assignments for today with error handling
    let assignments;
    try {
      assignments = await WorkerTaskAssignment.find({
        employeeId: employee.id,
        date: today
      }).sort({ sequence: 1 });
    } catch (dbError) {
      console.error("❌ Database error fetching assignments:", dbError);
      return res.status(500).json({ 
        success: false, 
        message: "Database error while fetching task assignments",
        error: "DATABASE_ERROR"
      });
    }

    if (!assignments || assignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No tasks assigned for today",
        error: "NO_TASKS_ASSIGNED"
      });
    }

    // Validate assignments data integrity
    const invalidAssignments = assignments.filter(a => 
      !a.projectId || !a.taskId || !Number.isInteger(a.projectId) || !Number.isInteger(a.taskId)
    );
    
    if (invalidAssignments.length > 0) {
      console.error("❌ Invalid assignment data found:", invalidAssignments.map(a => a.id));
      return res.status(500).json({
        success: false,
        message: "Invalid task assignment data detected",
        error: "INVALID_ASSIGNMENT_DATA"
      });
    }

    // Get project information (assuming one project per day)
    const projectId = assignments[0].projectId;
    let project;
    try {
      project = await Project.findOne({ id: projectId });
    } catch (dbError) {
      console.error("❌ Database error fetching project:", dbError);
      return res.status(500).json({ 
        success: false, 
        message: "Database error while fetching project information",
        error: "DATABASE_ERROR"
      });
    }

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found for assigned tasks",
        error: "PROJECT_NOT_FOUND"
      });
    }

    // Validate project data integrity
    if (!project.projectName || !project.id) {
      console.error("❌ Invalid project data:", project.id);
      return res.status(500).json({
        success: false,
        message: "Invalid project data detected",
        error: "INVALID_PROJECT_DATA"
      });
    }

    // Get client information from client collection if clientId exists
    let clientName = project.clientName || "N/A";
    if (project.clientId) {
      try {
        const clientsCollection = mongoose.connection.db.collection('clients');
        const client = await clientsCollection.findOne({ id: project.clientId });
        if (client && client.name) {
          clientName = client.name;
        }
      } catch (clientError) {
        console.error("❌ Error fetching client information:", clientError);
        // Continue with existing clientName from project
      }
    }

    // Get supervisor information with error handling
    const supervisorId = assignments[0].supervisorId;
    let supervisor = null;
    
    if (supervisorId) {
      try {
        supervisor = await Employee.findOne({ id: supervisorId });
        
        // Validate supervisor data if found
        if (supervisor && (!supervisor.fullName || supervisor.status !== 'ACTIVE')) {
          console.warn("⚠️ Supervisor found but has invalid data or is inactive:", supervisorId);
          // Don't fail the request, just log the warning
        }
      } catch (dbError) {
        console.error("❌ Database error fetching supervisor:", dbError);
        // Don't fail the request for supervisor fetch errors, just log
        console.warn("⚠️ Could not fetch supervisor information, continuing without it");
      }
    }

    // Get worker's current attendance and location status with error handling
    const todayStart = new Date(today + 'T00:00:00.000Z');
    const todayEnd = new Date(today + 'T23:59:59.999Z');
    
    let attendance = null;
    try {
      attendance = await Attendance.findOne({
        employeeId: employee.id,
        projectId: projectId,
        date: { $gte: todayStart, $lte: todayEnd }
      });
    } catch (dbError) {
      console.error("❌ Database error fetching attendance:", dbError);
      // Continue without attendance data
    }

    // Get latest location log with error handling
    let latestLocation = null;
    try {
      latestLocation = await LocationLog.findOne({
        employeeId: employee.id,
        projectId: projectId
      }).sort({ createdAt: -1 });
    } catch (dbError) {
      console.error("❌ Database error fetching location:", dbError);
      // Continue without location data
    }

    // Prepare project geofence information with validation
    let projectGeofence;
    try {
      const centerLat = project.geofence?.center?.latitude || project.latitude || 0;
      const centerLng = project.geofence?.center?.longitude || project.longitude || 0;
      const radius = project.geofence?.radius || project.geofenceRadius || 100;

      // Validate and sanitize geofence coordinates
      const latValidation = validateNumericValue(centerLat, { 
        min: -90, 
        max: 90, 
        default: 0, 
        fieldName: "latitude" 
      });
      
      const lngValidation = validateNumericValue(centerLng, { 
        min: -180, 
        max: 180, 
        default: 0, 
        fieldName: "longitude" 
      });
      
      const radiusValidation = validateNumericValue(radius, { 
        min: 1, 
        max: 10000, 
        default: 100, 
        fieldName: "radius" 
      });

      // Log warnings if values were modified
      if (latValidation.warning) console.warn("⚠️", latValidation.warning);
      if (lngValidation.warning) console.warn("⚠️", lngValidation.warning);
      if (radiusValidation.warning) console.warn("⚠️", radiusValidation.warning);

      projectGeofence = {
        center: {
          latitude: latValidation.value,
          longitude: lngValidation.value
        },
        radius: radiusValidation.value,
        strictMode: project.geofence?.strictMode !== false,
        allowedVariance: validateNumericValue(
          project.geofence?.allowedVariance, 
          { min: 0, max: 1000, default: 10, fieldName: "allowedVariance" }
        ).value
      };
    } catch (error) {
      console.error("❌ Error preparing geofence data:", error);
      // Use default geofence values
      projectGeofence = {
        center: { latitude: 0, longitude: 0 },
        radius: 100,
        strictMode: true,
        allowedVariance: 10
      };
    }

    // Calculate geofence validation for current location with error handling
    let currentLocationStatus = {
      latitude: latestLocation?.latitude || 0,
      longitude: latestLocation?.longitude || 0,
      insideGeofence: false,
      lastUpdated: latestLocation?.createdAt || null
    };

    if (latestLocation && latestLocation.latitude && latestLocation.longitude) {
      try {
        // Validate location coordinates using validation utility
        const coordValidation = validateCoordinates(latestLocation.latitude, latestLocation.longitude);
        
        if (coordValidation.isValid) {
          const geofenceValidation = validateGeofence(
            { latitude: latestLocation.latitude, longitude: latestLocation.longitude },
            projectGeofence
          );
          currentLocationStatus.insideGeofence = geofenceValidation.insideGeofence;
        } else {
          console.warn("⚠️ Invalid location coordinates:", coordValidation.message);
        }
      } catch (geofenceError) {
        console.error("❌ Error validating geofence:", geofenceError);
        // Continue with default values
      }
    }

    // Build task details with progress information and error handling
    let taskDetails;
    try {
      taskDetails = await Promise.all(assignments.map(async (assignment) => {
        try {
          // Validate assignment data
          if (!assignment.id || !assignment.taskId) {
            console.error("❌ Invalid assignment data:", assignment);
            throw new Error(`Invalid assignment data for assignment ${assignment.id}`);
          }

          const task = await Task.findOne({ id: assignment.taskId });
          
          if (!task) {
            console.warn("⚠️ Task not found for assignment:", assignment.id);
            // Return a placeholder task instead of failing
            return {
              assignmentId: assignment.id,
              taskId: assignment.taskId,
              taskName: "Task Not Found",
              taskType: "WORK",
              description: "Task details unavailable",
              workArea: assignment.workArea || "",
              floor: assignment.floor || "",
              zone: assignment.zone || "",
              status: assignment.status || "queued",
              priority: assignment.priority || "medium",
              sequence: assignment.sequence || 0,
              dailyTarget: {
                description: "",
                quantity: 0,
                unit: "",
                targetCompletion: 100
              },
              progress: {
                percentage: 0,
                completed: 0,
                remaining: 0,
                lastUpdated: null
              },
              timeEstimate: {
                estimated: 0,
                elapsed: 0,
                remaining: 0
              },
              supervisorInstructions: "",
              startTime: null,
              estimatedEndTime: null,
              canStart: false,
              dependencies: []
            };
          }
          
          // Get latest progress with error handling
          let latestProgress = null;
          try {
            latestProgress = await WorkerTaskProgress.findOne({
              workerTaskAssignmentId: assignment.id
            }).sort({ submittedAt: -1 });
          } catch (progressError) {
            console.error("❌ Error fetching progress for assignment:", assignment.id, progressError);
            // Continue without progress data
          }

          // Calculate progress metrics with validation
          const progressValidation = validateProgressPercentage(assignment.progressPercent);
          const progressPercent = progressValidation.percentage;
          
          if (progressValidation.wasModified) {
            console.warn("⚠️ Progress percentage was clamped for assignment:", assignment.id);
          }

          const dailyTarget = assignment.dailyTarget || {};
          
          // Validate daily target data using validation utility
          const targetQuantityValidation = validateNumericValue(
            dailyTarget.quantity, 
            { min: 0, max: 10000, default: 0, fieldName: "target quantity" }
          );
          const targetQuantity = targetQuantityValidation.value;
          
          const completed = targetQuantity > 0 
            ? Math.floor((progressPercent / 100) * targetQuantity) 
            : 0;
          const remaining = Math.max(0, targetQuantity - completed);

          // Calculate time estimates with validation
          const timeEstimate = assignment.timeEstimate || {};
          
          const estimatedValidation = validateNumericValue(
            timeEstimate.estimated, 
            { min: 0, max: 1440, default: 0, fieldName: "estimated time" }
          );
          const estimatedMinutes = estimatedValidation.value;
          
          const elapsedValidation = validateNumericValue(
            timeEstimate.elapsed, 
            { min: 0, max: estimatedMinutes, default: 0, fieldName: "elapsed time" }
          );
          const elapsedMinutes = elapsedValidation.value;
          
          const remainingMinutes = Math.max(0, estimatedMinutes - elapsedMinutes);

          // Determine if task can be started with error handling
          let canStart = true;
          let validationMessage = null;
          
          // Check task dependencies
          if (assignment.dependencies && assignment.dependencies.length > 0) {
            try {
              const dependencyResult = await checkDependencies(assignment.dependencies);
              canStart = dependencyResult.canStart;
              if (!canStart) {
                validationMessage = dependencyResult.message;
              }
            } catch (depError) {
              console.error("❌ Error checking dependencies for assignment:", assignment.id, depError);
              canStart = false; // Err on the side of caution
              validationMessage = "Error validating task dependencies";
            }
          }
          
          // Check task sequence if dependencies are satisfied
          if (canStart) {
            try {
              const sequenceResult = await validateTaskSequence(assignment, assignment.employeeId, assignment.date);
              canStart = sequenceResult.canStart;
              if (!canStart) {
                validationMessage = sequenceResult.message;
              }
            } catch (seqError) {
              console.error("❌ Error validating task sequence for assignment:", assignment.id, seqError);
              canStart = false;
              validationMessage = "Error validating task sequence";
            }
          }

          // Calculate estimated end time with validation
          let estimatedEndTime = null;
          if (assignment.startTime && remainingMinutes > 0) {
            try {
              const startTime = new Date(assignment.startTime);
              if (!isNaN(startTime.getTime())) {
                estimatedEndTime = new Date(startTime.getTime() + remainingMinutes * 60000);
              }
            } catch (timeError) {
              console.error("❌ Error calculating estimated end time:", timeError);
            }
          } else if (remainingMinutes > 0) {
            const now = new Date();
            estimatedEndTime = new Date(now.getTime() + remainingMinutes * 60000);
          }

          return {
            assignmentId: assignment.id,
            taskId: assignment.taskId,
            taskName: task.taskName || "N/A",
            taskType: task.taskType || "WORK",
            description: task.description || "",
            workArea: assignment.workArea || "",
            floor: assignment.floor || "",
            zone: assignment.zone || "",
            status: assignment.status || "queued",
            priority: assignment.priority || "medium",
            sequence: assignment.sequence || 0,
            dailyTarget: {
              description: validateStringField(
                dailyTarget.description, 
                { maxLength: 500, default: "", fieldName: "daily target description" }
              ).value,
              quantity: targetQuantity,
              unit: validateStringField(
                dailyTarget.unit, 
                { maxLength: 50, default: "", fieldName: "target unit" }
              ).value,
              targetCompletion: validateNumericValue(
                dailyTarget.targetCompletion, 
                { min: 0, max: 100, default: 100, fieldName: "target completion" }
              ).value
            },
            progress: {
              percentage: progressPercent,
              completed: completed,
              remaining: remaining,
              lastUpdated: latestProgress?.submittedAt || null
            },
            timeEstimate: {
              estimated: estimatedMinutes,
              elapsed: elapsedMinutes,
              remaining: remainingMinutes
            },
            supervisorInstructions: validateStringField(
              task.description, 
              { maxLength: 2000, default: "", fieldName: "supervisor instructions" }
            ).value,
            instructionAttachments: assignment.supervisorInstructions?.attachments || [],
            instructionsLastUpdated: assignment.supervisorInstructions?.lastUpdated || null,
            startTime: assignment.startTime,
            estimatedEndTime: estimatedEndTime,
            canStart: canStart,
            canStartMessage: validationMessage,
            dependencies: assignment.dependencies || []
          };
        } catch (taskError) {
          console.error("❌ Error processing task assignment:", assignment.id, taskError);
          // Return error placeholder instead of failing entire request
          return {
            assignmentId: assignment.id,
            taskId: assignment.taskId || 0,
            taskName: "Error Loading Task",
            taskType: "WORK",
            description: "Unable to load task details",
            workArea: assignment.workArea || "",
            floor: assignment.floor || "",
            zone: assignment.zone || "",
            status: "error",
            priority: "medium",
            sequence: assignment.sequence || 0,
            dailyTarget: { description: "", quantity: 0, unit: "", targetCompletion: 100 },
            progress: { percentage: 0, completed: 0, remaining: 0, lastUpdated: null },
            timeEstimate: { estimated: 0, elapsed: 0, remaining: 0 },
            supervisorInstructions: "",
            startTime: null,
            estimatedEndTime: null,
            canStart: false,
            dependencies: []
          };
        }
      }));
    } catch (taskDetailsError) {
      console.error("❌ Critical error building task details:", taskDetailsError);
      return res.status(500).json({
        success: false,
        message: "Error processing task details",
        error: "TASK_PROCESSING_ERROR"
      });
    }

    // Calculate daily summary with validation
    const totalTasks = taskDetails.length;
    const completedTasks = taskDetails.filter(t => t.status === 'completed').length;
    const inProgressTasks = taskDetails.filter(t => t.status === 'in_progress').length;
    const queuedTasks = taskDetails.filter(t => t.status === 'queued').length;
    const errorTasks = taskDetails.filter(t => t.status === 'error').length;
    
    // Validate and calculate time totals
    const totalEstimatedMinutes = taskDetails.reduce((sum, t) => {
      const estimated = Number.isFinite(t.timeEstimate.estimated) ? t.timeEstimate.estimated : 0;
      return sum + estimated;
    }, 0);
    
    const totalElapsedMinutes = taskDetails.reduce((sum, t) => {
      const elapsed = Number.isFinite(t.timeEstimate.elapsed) ? t.timeEstimate.elapsed : 0;
      return sum + elapsed;
    }, 0);
    
    const totalRemainingMinutes = taskDetails.reduce((sum, t) => {
      const remaining = Number.isFinite(t.timeEstimate.remaining) ? t.timeEstimate.remaining : 0;
      return sum + remaining;
    }, 0);
    
    // Calculate overall progress based on task completion status (not individual progress percentages)
    const overallProgress = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    // Get tools and materials for the project with error handling
    let formattedTools = [];
    let formattedMaterials = [];
    
    try {
      const tools = await Tool.find({
        companyId: req.user.companyId,
        projectId: projectId
      }).select('id name category quantity unit allocated location condition status');

      formattedTools = tools.map(tool => ({
        id: tool.id,
        name: validateStringField(tool.name, { default: "Unknown Tool", maxLength: 200 }).value,
        quantity: validateNumericValue(tool.quantity, { min: 0, max: 10000, default: 0 }).value,
        unit: validateStringField(tool.unit, { default: "pieces", maxLength: 50 }).value,
        allocated: Boolean(tool.allocated),
        location: validateStringField(tool.location, { default: "Not specified", maxLength: 200 }).value
      }));
    } catch (toolsError) {
      console.error("❌ Error fetching tools:", toolsError);
      // Continue with empty tools array
    }

    try {
      const materials = await Material.find({
        companyId: req.user.companyId,
        projectId: projectId
      }).select('id name category quantity unit allocated used remaining location status');

      formattedMaterials = materials.map(material => {
        const quantityValidation = validateNumericValue(material.quantity, { min: 0, max: 100000, default: 0 });
        const allocatedValidation = validateNumericValue(material.allocated, { min: 0, max: 100000, default: 0 });
        const usedValidation = validateNumericValue(material.used, { min: 0, max: 100000, default: 0 });
        
        const quantity = quantityValidation.value;
        const allocated = allocatedValidation.value;
        const used = usedValidation.value;
        const remaining = validateNumericValue(
          material.remaining, 
          { min: 0, max: 100000, default: Math.max(0, allocated - used) }
        ).value;

        return {
          id: material.id,
          name: validateStringField(material.name, { default: "Unknown Material", maxLength: 200 }).value,
          quantity: quantity,
          unit: validateStringField(material.unit, { default: "pieces", maxLength: 50 }).value,
          allocated: allocated,
          used: used,
          remaining: remaining,
          location: validateStringField(material.location, { default: "Not specified", maxLength: 200 }).value
        };
      });
    } catch (materialsError) {
      console.error("❌ Error fetching materials:", materialsError);
      // Continue with empty materials array
    }

    // Build response according to design specification with validation
    const response = {
      success: true,
      data: {
        project: {
          id: project.id,
          name: validateStringField(project.projectName, { default: "N/A", maxLength: 200 }).value,
          code: validateStringField(project.projectCode, { default: "N/A", maxLength: 100 }).value,
          clientName: validateStringField(clientName, { default: "N/A", maxLength: 200 }).value,
          location: validateStringField(project.address, { default: "N/A", maxLength: 500 }).value,
          geofence: {
            latitude: projectGeofence.center.latitude,
            longitude: projectGeofence.center.longitude,
            radius: projectGeofence.radius
          }
        },
        supervisor: supervisor && supervisor.fullName ? {
          id: supervisor.id,
          name: supervisor.fullName,
          phone: supervisor.phone || "N/A",
          email: supervisor.email || "N/A"
        } : null,
        worker: {
          id: employee.id,
          name: validateStringField(employee.fullName, { default: "N/A", maxLength: 200 }).value,
          role: validateStringField(employee.jobTitle, { default: "Construction Worker", maxLength: 100 }).value,
          checkInStatus: attendance?.checkIn ? "checked_in" : "not_checked_in",
          currentLocation: {
            latitude: currentLocationStatus.latitude,
            longitude: currentLocationStatus.longitude,
            insideGeofence: Boolean(currentLocationStatus.insideGeofence),
            lastUpdated: currentLocationStatus.lastUpdated
          }
        },
        tasks: taskDetails,
        toolsAndMaterials: {
          tools: formattedTools,
          materials: formattedMaterials
        },
        dailySummary: {
          totalTasks: totalTasks,
          completedTasks: completedTasks,
          inProgressTasks: inProgressTasks,
          queuedTasks: queuedTasks,
          errorTasks: errorTasks,
          totalHoursWorked: validateNumericValue(totalElapsedMinutes / 60, { min: 0, max: 24, default: 0 }).value,
          remainingHours: validateNumericValue(totalRemainingMinutes / 60, { min: 0, max: 24, default: 0 }).value,
          overallProgress: validateNumericValue(overallProgress, { min: 0, max: 100, default: 0 }).value
        }
      }
    };

    // Final validation of response structure
    if (!response.data.project.id || !response.data.worker.id || !Array.isArray(response.data.tasks)) {
      console.error("❌ Invalid response structure generated");
      return res.status(500).json({
        success: false,
        message: "Error generating response data",
        error: "RESPONSE_GENERATION_ERROR"
      });
    }

    return res.json(response);

  } catch (err) {
    console.error("❌ getWorkerTasksToday - Unexpected error:", err);
    
    // Determine error type and provide appropriate response
    if (err.name === 'MongoError' || err.name === 'MongooseError') {
      return res.status(500).json({ 
        success: false, 
        message: "Database connection error",
        error: "DATABASE_CONNECTION_ERROR"
      });
    }
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: "Data validation error",
        error: "VALIDATION_ERROR"
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid data format",
        error: "INVALID_DATA_FORMAT"
      });
    }
    
    // Generic server error for unknown issues
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};

/**
 * Enhanced helper function to check if task dependencies are completed
 * 
 * @param {number[]} dependencyIds - Array of assignment IDs that this task depends on
 * @returns {Object} - Object with canStart boolean, message string, and additional data
 * 
 * **Validates: Requirements 3.2 - Task Status Management**
 * - Validates that all dependent tasks are completed before allowing task start
 * - Provides detailed error messages for missing or incomplete dependencies
 * - Returns structured data for client-side error handling
 */
const checkDependencies = async (dependencyIds) => {
  try {
    if (!dependencyIds || dependencyIds.length === 0) return { canStart: true, message: null };
    
    // Validate dependency IDs
    const validDependencyIds = dependencyIds.filter(id => 
      Number.isInteger(id) && id > 0
    );
    
    if (validDependencyIds.length === 0) {
      console.warn("⚠️ No valid dependency IDs found:", dependencyIds);
      return { canStart: true, message: null }; // If no valid dependencies, allow task to start
    }
    
    const dependencies = await WorkerTaskAssignment.find({
      id: { $in: validDependencyIds }
    });
    
    // Check if all dependencies exist
    if (dependencies.length !== validDependencyIds.length) {
      const foundIds = dependencies.map(d => d.id);
      const missingIds = validDependencyIds.filter(id => !foundIds.includes(id));
      console.warn("⚠️ Missing dependency assignments:", missingIds);
      return { 
        canStart: false, 
        message: `Missing dependency assignments: ${missingIds.join(', ')}`,
        missingDependencies: missingIds
      };
    }
    
    // Check which dependencies are not completed
    const incompleteDependencies = dependencies.filter(dep => dep.status !== 'completed');
    
    if (incompleteDependencies.length > 0) {
      const incompleteInfo = incompleteDependencies.map(dep => ({
        id: dep.id,
        status: dep.status,
        progressPercent: dep.progressPercent || 0
      }));
      
      return {
        canStart: false,
        message: `Dependent tasks must be completed first: ${incompleteDependencies.map(d => `Task ${d.id} (${d.status})`).join(', ')}`,
        incompleteDependencies: incompleteInfo
      };
    }
    
    // All dependencies are completed
    return { canStart: true, message: null };
    
  } catch (error) {
    console.error("❌ Error checking dependencies:", error);
    return { 
      canStart: false, 
      message: "Error validating task dependencies",
      error: error.message
    };
  }
};

/**
 * Helper function to validate task sequence
 * 
 * @param {Object} assignment - The task assignment to validate
 * @param {number} employeeId - The employee ID
 * @param {string} date - The date in YYYY-MM-DD format
 * @returns {Object} - Object with canStart boolean, message string, and additional data
 * 
 * **Validates: Requirements 3.2 - Task Status Management**
 * - Prevents starting tasks out of assigned sequence
 * - Ensures earlier sequence tasks are completed first
 * - Provides detailed information about incomplete earlier tasks
 */
const validateTaskSequence = async (assignment, employeeId, date) => {
  try {
    // If no sequence is defined, allow the task to start
    if (!assignment.sequence || assignment.sequence <= 1) {
      return { canStart: true, message: null };
    }
    
    // Get all assignments for the same employee and date
    const allAssignments = await WorkerTaskAssignment.find({
      employeeId: employeeId,
      date: date,
      projectId: assignment.projectId
    }).sort({ sequence: 1 });
    
    // Check if there are any earlier sequence tasks that are not completed
    const earlierTasks = allAssignments.filter(task => 
      task.sequence < assignment.sequence && 
      task.id !== assignment.id
    );
    
    if (earlierTasks.length === 0) {
      return { canStart: true, message: null };
    }
    
    // Check if all earlier sequence tasks are completed
    const incompleteEarlierTasks = earlierTasks.filter(task => 
      task.status !== 'completed'
    );
    
    if (incompleteEarlierTasks.length > 0) {
      const incompleteInfo = incompleteEarlierTasks.map(task => ({
        id: task.id,
        sequence: task.sequence,
        status: task.status,
        progressPercent: task.progressPercent || 0
      }));
      
      return {
        canStart: false,
        message: `Tasks must be completed in sequence. Complete earlier tasks first: ${incompleteEarlierTasks.map(t => `Sequence ${t.sequence} (Task ${t.id})`).join(', ')}`,
        incompleteEarlierTasks: incompleteInfo
      };
    }
    
    return { canStart: true, message: null };
    
  } catch (error) {
    console.error("❌ Error validating task sequence:", error);
    return { 
      canStart: false, 
      message: "Error validating task sequence",
      error: error.message
    };
  }
};

/* ----------------------------------------------------
   GET /worker/today-trip
---------------------------------------------------- */
export const getWorkerTodayTrip = async (req, res) => {
  try {
    const employee = await resolveEmployee(req);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const passengerRecords = await FleetTaskPassenger.find({
      workerEmployeeId: employee.id
    });

    if (!passengerRecords.length) {
      return res.json({ success: true, data: [] });
    }

    const fleetTaskIds = passengerRecords.map(p => p.fleetTaskId);

    const tasks = await FleetTask.find({
      id: { $in: fleetTaskIds },
      taskDate: { $gte: startOfDay, $lte: endOfDay },
      companyId: req.user.companyId
    });

    const enriched = await Promise.all(tasks.map(async (task) => {
      const [project, vehicle, driver, passengerCount] = await Promise.all([
        Project.findOne({ id: task.projectId }).select("projectName"),
        FleetVehicle.findOne({ id: task.vehicleId }).select("registrationNo vehicleType"),
        Employee.findOne({ id: task.driverId }).select("fullName phone photoUrl"),
        FleetTaskPassenger.countDocuments({ fleetTaskId: task.id })
      ]);

      return {
        taskId: task.id,
        projectName: project?.projectName || "N/A",
        vehicleNumber: vehicle?.registrationNo || "N/A",
        vehicleType: vehicle?.vehicleType || "N/A",
        driverName: driver?.fullName || "N/A",
        driverContact: driver?.phone || "N/A",
        driverPhoto: driver?.photoUrl || null,
        startTime: task.plannedPickupTime,
        dropTime: task.plannedDropTime,
        pickupLocation: task.pickupLocation,
        dropLocation: task.dropLocation,
        status: task.status,
        passengerCount
      };
    }));

    return res.json({ success: true, data: enriched });

  } catch (err) {
    console.error("❌ getWorkerTodayTrip:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ----------------------------------------------------
   GET /worker/today-tasks
   ONE PROJECT → MULTIPLE TASKS
---------------------------------------------------- */
export const getWorkerTodayTask = async (req, res) => {
  try {
    const employee = await resolveEmployee(req);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const today = new Date().toISOString().split("T")[0];

    const assignments = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      //companyId: req.user.companyId,
      date: today
    });

    if (!assignments.length) {
      return res.status(404).json({
        success: false,
        message: "No tasks assigned for today"
      });
    }

    // Enforce ONE PROJECT per day
    const projectId = assignments[0].projectId;

    const project = await Project.findOne({ id: projectId })
      .select("projectName projectCode");

    const supervisor = await Employee.findOne({
      id: assignments[0].supervisorId
    }).select("fullName phone");

    const taskDetails = await Promise.all(assignments.map(async (a) => {
      const task = await Task.findOne({ id: a.taskId }).select("taskName");
      return {
        assignmentId: a.id,
        taskId: a.taskId,
        taskName: task?.taskName || "N/A",
        status: a.status,
        progressPercent: a.progressPercent ?? 0
      };
    }));

    return res.json({
      success: true,
      data: {
        projectId,
        projectName: project?.projectName || "N/A",
        projectCode: project?.projectCode || "N/A",
        supervisorName: employee?.fullName || "N/A",
        supervisorPhone: supervisor?.phone || "N/A",
        tasks: taskDetails
      }
    });

  } catch (err) {
    console.error("❌ getWorkerTodayTask:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ----------------------------------------------------
   GET /worker/geofence/validate - Validate current location against project geofence
---------------------------------------------------- */
export const validateWorkerGeofence = async (req, res) => {
  try {
    // Input validation using validation utilities
    const authValidation = validateAuthData(req);
    if (!authValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: authValidation.message,
        error: authValidation.error
      });
    }

    const employee = await resolveEmployee(req);
    if (!employee) {
      return res.status(403).json({ 
        success: false, 
        message: "Employee not found or unauthorized",
        error: "EMPLOYEE_UNAUTHORIZED"
      });
    }

    // Get location from query parameters
    const { latitude, longitude, projectId, accuracy } = req.query;

    // Validate coordinates
    const coordValidation = validateCoordinates(
      parseFloat(latitude), 
      parseFloat(longitude)
    );
    if (!coordValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: coordValidation.message,
        error: coordValidation.error
      });
    }

    // Parse and validate GPS accuracy if provided
    let gpsAccuracy = null;
    if (accuracy) {
      gpsAccuracy = parseFloat(accuracy);
      if (isNaN(gpsAccuracy) || gpsAccuracy < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid GPS accuracy value",
          error: "INVALID_GPS_ACCURACY"
        });
      }
    }

    // Determine project ID - use provided or get from current assignment
    let targetProjectId = null;
    if (projectId) {
      const projectIdValidation = validateId(parseInt(projectId), "project");
      if (!projectIdValidation.isValid) {
        return res.status(400).json({ 
          success: false, 
          message: projectIdValidation.message,
          error: projectIdValidation.error
        });
      }
      targetProjectId = projectIdValidation.id;
    } else {
      // Get project from current day's assignment
      const today = new Date().toISOString().split("T")[0];
      const assignment = await WorkerTaskAssignment.findOne({
        employeeId: employee.id,
        date: today
      });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "No active project assignment found for today",
          error: "NO_ACTIVE_ASSIGNMENT"
        });
      }

      targetProjectId = assignment.projectId;
    }

    // Get project information
    const project = await Project.findOne({ id: targetProjectId });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
        error: "PROJECT_NOT_FOUND"
      });
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

    // Validate geofence location
    const geofenceValidation = validateGeofence(
      { latitude: coordValidation.latitude, longitude: coordValidation.longitude },
      projectGeofence
    );

    // Handle GPS accuracy edge cases
    let accuracyWarning = null;
    let adjustedValidation = geofenceValidation;
    
    if (gpsAccuracy !== null) {
      // If GPS accuracy is poor (>50m), provide warning
      if (gpsAccuracy > 50) {
        accuracyWarning = `GPS accuracy is poor (${Math.round(gpsAccuracy)}m). Location validation may be unreliable.`;
        
        // If accuracy is very poor (>100m), be more lenient with validation
        if (gpsAccuracy > 100 && !geofenceValidation.isValid) {
          const lenientRadius = projectGeofence.radius + gpsAccuracy;
          const lenientValidation = validateGeofence(
            { latitude: coordValidation.latitude, longitude: coordValidation.longitude },
            { ...projectGeofence, radius: lenientRadius }
          );
          
          if (lenientValidation.isValid) {
            adjustedValidation = {
              ...geofenceValidation,
              isValid: true,
              message: `Location validated with GPS accuracy consideration (${Math.round(gpsAccuracy)}m accuracy)`
            };
          }
        }
      }
    }

    // Create location log for audit trail
    try {
      const locationLog = new LocationLog({
        employeeId: employee.id,
        projectId: targetProjectId,
        latitude: coordValidation.latitude,
        longitude: coordValidation.longitude,
        accuracy: gpsAccuracy,
        insideGeofence: adjustedValidation.insideGeofence,
        logType: 'GEOFENCE_VALIDATION',
        taskAssignmentId: null // Will be set when validating for specific task
      });
      
      await locationLog.save();
    } catch (logError) {
      console.warn("⚠️ Failed to create location log:", logError);
      // Don't fail the request if logging fails
    }

    return res.json({
      success: true,
      data: {
        insideGeofence: adjustedValidation.insideGeofence,
        distance: adjustedValidation.distance,
        geofence: {
          center: {
            latitude: projectGeofence.center.latitude,
            longitude: projectGeofence.center.longitude
          },
          radius: projectGeofence.radius
        },
        canStartTasks: adjustedValidation.isValid,
        message: adjustedValidation.message,
        strictMode: adjustedValidation.strictValidation,
        allowedVariance: adjustedValidation.allowedVariance,
        gpsAccuracy: gpsAccuracy,
        accuracyWarning: accuracyWarning,
        validationTimestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error("❌ validateWorkerGeofence:", err);
    
    // Determine error type and provide appropriate response
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: "Data validation error",
        error: "VALIDATION_ERROR"
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid data format",
        error: "INVALID_DATA_FORMAT"
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};

/* ----------------------------------------------------
   GET /worker/tasks/{taskId} - Get individual task details
---------------------------------------------------- */
export const getWorkerTaskDetails = async (req, res) => {
  try {
    // Input validation using validation utilities
    const authValidation = validateAuthData(req);
    if (!authValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: authValidation.message,
        error: authValidation.error
      });
    }

    const employee = await resolveEmployee(req);
    if (!employee) {
      return res.status(403).json({ 
        success: false, 
        message: "Employee not found or unauthorized",
        error: "EMPLOYEE_UNAUTHORIZED"
      });
    }

    // Validate task ID from URL parameter
    const taskId = parseInt(req.params.taskId);
    const taskIdValidation = validateId(taskId, "task assignment");
    if (!taskIdValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: taskIdValidation.message,
        error: taskIdValidation.error
      });
    }

    // Find the task assignment
    const assignment = await WorkerTaskAssignment.findOne({
      id: taskIdValidation.id,
      employeeId: employee.id
    });

    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: "Task assignment not found or unauthorized",
        error: "ASSIGNMENT_NOT_FOUND"
      });
    }

    // Get task details
    const task = await Task.findOne({ id: assignment.taskId });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task details not found",
        error: "TASK_NOT_FOUND"
      });
    }

    // Get project information
    const project = await Project.findOne({ id: assignment.projectId });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
        error: "PROJECT_NOT_FOUND"
      });
    }

    // Get supervisor information
    let supervisor = null;
    if (assignment.supervisorId) {
      supervisor = await Employee.findOne({ id: assignment.supervisorId });
    }

    // Get latest progress
    const latestProgress = await WorkerTaskProgress.findOne({
      workerTaskAssignmentId: assignment.id
    }).sort({ submittedAt: -1 });

    // Get task photos
    const photos = await WorkerTaskPhoto.find({
      workerTaskAssignmentId: assignment.id
    }).sort({ uploadedAt: -1 });

    // Calculate progress metrics
    const progressValidation = validateProgressPercentage(assignment.progressPercent);
    const progressPercent = progressValidation.percentage;

    const dailyTarget = assignment.dailyTarget || {};
    const targetQuantity = validateNumericValue(
      dailyTarget.quantity, 
      { min: 0, max: 10000, default: 0, fieldName: "target quantity" }
    ).value;
    
    const completed = targetQuantity > 0 
      ? Math.floor((progressPercent / 100) * targetQuantity) 
      : 0;
    const remaining = Math.max(0, targetQuantity - completed);

    // Calculate time estimates
    const timeEstimate = assignment.timeEstimate || {};
    const estimatedMinutes = validateNumericValue(
      timeEstimate.estimated, 
      { min: 0, max: 1440, default: 0, fieldName: "estimated time" }
    ).value;
    const elapsedMinutes = validateNumericValue(
      timeEstimate.elapsed, 
      { min: 0, max: estimatedMinutes, default: 0, fieldName: "elapsed time" }
    ).value;
    const remainingMinutes = Math.max(0, estimatedMinutes - elapsedMinutes);

    // Calculate estimated end time
    let estimatedEndTime = null;
    if (assignment.startTime && remainingMinutes > 0) {
      const startTime = new Date(assignment.startTime);
      if (!isNaN(startTime.getTime())) {
        estimatedEndTime = new Date(startTime.getTime() + remainingMinutes * 60000);
      }
    } else if (remainingMinutes > 0) {
      const now = new Date();
      estimatedEndTime = new Date(now.getTime() + remainingMinutes * 60000);
    }

    // Check if task can be started
    let canStart = true;
    let validationMessage = null;
    
    if (assignment.dependencies && assignment.dependencies.length > 0) {
      const dependencyResult = await checkDependencies(assignment.dependencies);
      canStart = dependencyResult.canStart;
      if (!canStart) {
        validationMessage = dependencyResult.message;
      }
    }
    
    if (canStart) {
      const sequenceResult = await validateTaskSequence(assignment, assignment.employeeId, assignment.date);
      canStart = sequenceResult.canStart;
      if (!canStart) {
        validationMessage = sequenceResult.message;
      }
    }

    const response = {
      success: true,
      data: {
        assignmentId: assignment.id,
        taskId: assignment.taskId,
        taskName: task.taskName || "N/A",
        taskType: task.taskType || "WORK",
        description: task.description || "",
        workArea: assignment.workArea || "",
        floor: assignment.floor || "",
        zone: assignment.zone || "",
        status: assignment.status || "queued",
        priority: assignment.priority || "medium",
        sequence: assignment.sequence || 0,
        project: {
          id: project.id,
          name: project.projectName || "N/A",
          location: project.address || "N/A"
        },
        supervisor: {
          id: supervisor?.id || 0,
          name: supervisor?.fullName || "N/A",
          phone: supervisor?.phone || "N/A"
        },
        dailyTarget: {
          description: validateStringField(
            dailyTarget.description, 
            { maxLength: 500, default: "", fieldName: "daily target description" }
          ).value,
          quantity: targetQuantity,
          unit: validateStringField(
            dailyTarget.unit, 
            { maxLength: 50, default: "", fieldName: "target unit" }
          ).value,
          targetCompletion: validateNumericValue(
            dailyTarget.targetCompletion, 
            { min: 0, max: 100, default: 100, fieldName: "target completion" }
          ).value
        },
        progress: {
          percentage: progressPercent,
          completed: completed,
          remaining: remaining,
          lastUpdated: latestProgress?.submittedAt || null
        },
        timeEstimate: {
          estimated: estimatedMinutes,
          elapsed: elapsedMinutes,
          remaining: remainingMinutes
        },
        startTime: assignment.startTime,
        estimatedEndTime: estimatedEndTime,
        canStart: canStart,
        canStartMessage: validationMessage,
        dependencies: assignment.dependencies || [],
        photos: photos.map(photo => ({
          id: photo.id,
          photoUrl: photo.photoUrl,
          caption: photo.caption || "",
          uploadedAt: photo.uploadedAt
        }))
      }
    };

    return res.json(response);

  } catch (err) {
    console.error("❌ getWorkerTaskDetails:", err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: "Data validation error",
        error: "VALIDATION_ERROR"
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid data format",
        error: "INVALID_DATA_FORMAT"
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};

/* ----------------------------------------------------
   POST /worker/tasks/{taskId}/start - Start a task with geofence validation
---------------------------------------------------- */
export const startWorkerTaskById = async (req, res) => {
  try {
    // Input validation using validation utilities
    const authValidation = validateAuthData(req);
    if (!authValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: authValidation.message,
        error: authValidation.error
      });
    }

    const employee = await resolveEmployee(req);
    if (!employee) {
      return res.status(403).json({ 
        success: false, 
        message: "Employee not found or unauthorized",
        error: "EMPLOYEE_UNAUTHORIZED"
      });
    }

    // Validate task ID from URL parameter
    const taskId = parseInt(req.params.taskId);
    const taskIdValidation = validateId(taskId, "task assignment");
    if (!taskIdValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: taskIdValidation.message,
        error: taskIdValidation.error
      });
    }

    // Validate request body
    const { location } = req.body;

    // Validate location data
    if (!location) {
      return res.status(400).json({ 
        success: false, 
        message: "Location data is required to start task",
        error: "MISSING_LOCATION"
      });
    }

    const coordValidation = validateCoordinates(location.latitude, location.longitude);
    if (!coordValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: coordValidation.message,
        error: coordValidation.error
      });
    }

    // Validate location accuracy if provided
    let accuracy = null;
    if (location.accuracy !== undefined) {
      const accuracyValidation = validateNumericValue(location.accuracy, {
        min: 0,
        max: 1000,
        default: null,
        fieldName: "location accuracy"
      });
      accuracy = accuracyValidation.value;
    }

    // Find the task assignment
    const assignment = await WorkerTaskAssignment.findOne({
      id: taskIdValidation.id,
      employeeId: employee.id
    });

    if (!assignment) {
      return res.status(403).json({ 
        success: false, 
        message: "Task assignment not found or unauthorized",
        error: "ASSIGNMENT_UNAUTHORIZED"
      });
    }

    // Check if task is already started or completed
    if (assignment.status === 'in_progress') {
      return res.status(400).json({ 
        success: false, 
        message: "Task is already in progress",
        error: "TASK_ALREADY_STARTED"
      });
    }

    if (assignment.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: "Task is already completed",
        error: "TASK_ALREADY_COMPLETED"
      });
    }

    // Check task dependencies
    if (assignment.dependencies && assignment.dependencies.length > 0) {
      const dependencyResult = await checkDependencies(assignment.dependencies);
      if (!dependencyResult.canStart) {
        return res.status(400).json({ 
          success: false, 
          message: dependencyResult.message,
          error: "DEPENDENCIES_NOT_MET",
          data: {
            incompleteDependencies: dependencyResult.incompleteDependencies,
            missingDependencies: dependencyResult.missingDependencies
          }
        });
      }
    }
    
    // Check task sequence
    const sequenceResult = await validateTaskSequence(assignment, employee.id, assignment.date);
    if (!sequenceResult.canStart) {
      return res.status(400).json({ 
        success: false, 
        message: sequenceResult.message,
        error: "SEQUENCE_VALIDATION_FAILED",
        data: {
          incompleteEarlierTasks: sequenceResult.incompleteEarlierTasks
        }
      });
    }

    // Get project information for geofence validation
    const project = await Project.findOne({ id: assignment.projectId });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found for this task",
        error: "PROJECT_NOT_FOUND"
      });
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

    // Validate geofence location
    const geofenceValidation = validateGeofence(
      { latitude: location.latitude, longitude: location.longitude },
      projectGeofence
    );

    if (!geofenceValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: geofenceValidation.message,
        error: "GEOFENCE_VALIDATION_FAILED",
        data: {
          distance: geofenceValidation.distance,
          allowedRadius: geofenceValidation.allowedRadius,
          insideGeofence: geofenceValidation.insideGeofence,
          strictMode: geofenceValidation.strictValidation
        }
      });
    }

    // Update task assignment status
    const startTime = new Date();
    const previousStatus = assignment.status;
    assignment.status = 'in_progress';
    assignment.startTime = startTime;
    
    // Update geofence validation info
    if (!assignment.geofenceValidation) {
      assignment.geofenceValidation = {};
    }
    assignment.geofenceValidation.lastValidated = startTime;
    assignment.geofenceValidation.validationLocation = {
      latitude: location.latitude,
      longitude: location.longitude
    };

    await assignment.save();

    // Send task status change notification to supervisor
    try {
      if (assignment.supervisorId) {
        await TaskNotificationService.notifyTaskStatusChange(
          assignment, 
          previousStatus, 
          'in_progress', 
          assignment.supervisorId
        );
        console.log(`✅ Task start notification sent to supervisor ${assignment.supervisorId}`);
      }
    } catch (notificationError) {
      console.error("❌ Error sending task start notification:", notificationError);
      // Don't fail the request if notifications fail
    }

    // Log location for audit trail
    try {
      const lastLocationLog = await LocationLog.findOne().sort({ id: -1 }).select("id");
      const nextLocationId = lastLocationLog ? lastLocationLog.id + 1 : 1;

      await LocationLog.create({
        id: nextLocationId,
        employeeId: employee.id,
        projectId: assignment.projectId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: accuracy,
        insideGeofence: geofenceValidation.insideGeofence,
        logType: 'TASK_START',
        taskAssignmentId: assignment.id
      });
    } catch (locationLogError) {
      console.error("❌ Error logging location for task start:", locationLogError);
      // Don't fail the request if location logging fails
    }

    // Calculate estimated end time if time estimate is available
    let estimatedEndTime = null;
    if (assignment.timeEstimate && assignment.timeEstimate.remaining > 0) {
      estimatedEndTime = new Date(startTime.getTime() + assignment.timeEstimate.remaining * 60000);
    }

    return res.json({
      success: true,
      message: "Task started successfully",
      data: {
        assignmentId: assignment.id,
        status: assignment.status,
        startTime: startTime,
        estimatedEndTime: estimatedEndTime,
        geofenceValidation: {
          insideGeofence: geofenceValidation.insideGeofence,
          distance: geofenceValidation.distance,
          validated: true,
          validatedAt: startTime
        }
      }
    });

  } catch (err) {
    console.error("❌ startWorkerTaskById:", err);
    
    // Determine error type and provide appropriate response
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: "Data validation error",
        error: "VALIDATION_ERROR"
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid data format",
        error: "INVALID_DATA_FORMAT"
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};

/* ----------------------------------------------------
   PUT /worker/tasks/{taskId}/progress - Update task progress
---------------------------------------------------- */
export const updateWorkerTaskProgress = async (req, res) => {
  try {
    // Input validation using validation utilities
    const authValidation = validateAuthData(req);
    if (!authValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: authValidation.message,
        error: authValidation.error
      });
    }

    const employee = await resolveEmployee(req);
    if (!employee) {  
      return res.status(403).json({ 
        success: false, 
        message: "Employee not found or unauthorized",
        error: "EMPLOYEE_UNAUTHORIZED"
      });
    }

    // Validate task ID from URL parameter
    const taskId = parseInt(req.params.taskId);
    const taskIdValidation = validateId(taskId, "task assignment");
    if (!taskIdValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: taskIdValidation.message,
        error: taskIdValidation.error
      });
    }

    // Validate request body - enhanced to match design specification
    const { 
      progressPercent, 
      description, 
      notes, 
      location,
      completedQuantity,
      issuesEncountered 
    } = req.body;

    // Validate progress percentage
    const progressValidation = validateProgressPercentage(progressPercent);
    if (!progressValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: progressValidation.message,
        error: progressValidation.error
      });
    }

    // Validate description (required field)
    const descriptionValidation = validateStringField(description, { 
      maxLength: 1000, 
      required: true,
      fieldName: "description"
    });
    
    if (!descriptionValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: descriptionValidation.message,
        error: descriptionValidation.error
      });
    }
    
    const notesValidation = validateStringField(notes, { 
      maxLength: 500, 
      default: "", 
      fieldName: "notes" 
    });

    // Validate location if provided
    let validatedLocation = null;
    if (location) {
      const coordValidation = validateCoordinates(location.latitude, location.longitude);
      if (coordValidation.isValid) {
        validatedLocation = {
          latitude: coordValidation.latitude,
          longitude: coordValidation.longitude,
          timestamp: location.timestamp ? new Date(location.timestamp) : new Date()
        };
      } else {
        console.warn("⚠️ Invalid location coordinates provided:", coordValidation.message);
      }
    }

    // Validate completed quantity if provided
    let validatedCompletedQuantity = null;
    if (completedQuantity !== undefined) {
      const quantityValidation = validateNumericValue(completedQuantity, {
        min: 0,
        max: 100000,
        default: null,
        fieldName: "completed quantity"
      });
      validatedCompletedQuantity = quantityValidation.value;
    }

    // Validate issues encountered if provided
    let validatedIssues = [];
    if (issuesEncountered && Array.isArray(issuesEncountered)) {
      validatedIssues = issuesEncountered.slice(0, 10).map(issue => {
        if (typeof issue === 'string') {
          return validateStringField(issue, { 
            maxLength: 200, 
            default: "", 
            fieldName: "issue" 
          }).value;
        }
        return "";
      }).filter(issue => issue.length > 0);
    }

    // Find the task assignment
    const assignment = await WorkerTaskAssignment.findOne({
      id: taskIdValidation.id,
      employeeId: employee.id
    });

    if (!assignment) {
      return res.status(403).json({ 
        success: false, 
        message: "Task assignment not found or unauthorized",
        error: "ASSIGNMENT_UNAUTHORIZED"
      });
    }

    // Check if task is in a valid state for progress updates
    if (assignment.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot update progress for completed task",
        error: "TASK_ALREADY_COMPLETED"
      });
    }

    if (assignment.status === 'queued') {
      return res.status(400).json({ 
        success: false, 
        message: "Task must be started before progress can be updated",
        error: "TASK_NOT_STARTED"
      });
    }

    // Validate progress logic - cannot decrease progress
    const currentProgress = assignment.progressPercent || 0;
    if (progressValidation.percentage < currentProgress) {
      return res.status(400).json({ 
        success: false, 
        message: `Progress percentage cannot be decreased from ${currentProgress}% to ${progressValidation.percentage}%`,
        error: "INVALID_PROGRESS_DECREASE",
        data: {
          currentProgress: currentProgress,
          attemptedProgress: progressValidation.percentage
        }
      });
    }

    // Create WorkerTaskProgress record
    const last = await WorkerTaskProgress.findOne().sort({ id: -1 }).select("id");
    const nextId = last ? last.id + 1 : 1;

    const submittedAt = new Date();
    const progressRecord = await WorkerTaskProgress.create({
      id: nextId,
      workerTaskAssignmentId: taskIdValidation.id,
      employeeId: employee.id,
      progressPercent: progressValidation.percentage,
      description: descriptionValidation.value,
      notes: notesValidation.value,
      location: validatedLocation,
      completedQuantity: validatedCompletedQuantity,
      issuesEncountered: validatedIssues,
      submittedAt: submittedAt,
      status: "SUBMITTED"
    });

    // Update assignment progress and status
    const previousProgress = assignment.progressPercent || 0;
    const previousStatus = assignment.status;
    assignment.progressPercent = progressValidation.percentage;
    
    // Update status based on progress
    if (progressValidation.percentage >= 100) {
      assignment.status = "completed";
      assignment.completedAt = submittedAt;
    } else if (assignment.status === 'queued') {
      assignment.status = "in_progress";
      if (!assignment.startTime) {
        assignment.startTime = submittedAt;
      }
    }

    // Update time estimates if available
    if (assignment.timeEstimate) {
      const progressDelta = progressValidation.percentage - previousProgress;
      if (progressDelta > 0 && assignment.timeEstimate.estimated > 0) {
        const estimatedElapsed = (progressValidation.percentage / 100) * assignment.timeEstimate.estimated;
        assignment.timeEstimate.elapsed = Math.min(estimatedElapsed, assignment.timeEstimate.estimated);
        assignment.timeEstimate.remaining = Math.max(0, assignment.timeEstimate.estimated - assignment.timeEstimate.elapsed);
      }
    }

    await assignment.save();

    // Send task status change notification to supervisor if status changed
    try {
      if (assignment.supervisorId && previousStatus !== assignment.status) {
        await TaskNotificationService.notifyTaskStatusChange(
          assignment, 
          previousStatus, 
          assignment.status, 
          assignment.supervisorId
        );
        console.log(`✅ Task status change notification sent to supervisor ${assignment.supervisorId}`);
      }
    } catch (notificationError) {
      console.error("❌ Error sending task status change notification:", notificationError);
      // Don't fail the request if notifications fail
    }

    // Log location for audit trail if provided
    if (validatedLocation) {
      try {
        const lastLocationLog = await LocationLog.findOne().sort({ id: -1 }).select("id");
        const nextLocationId = lastLocationLog ? lastLocationLog.id + 1 : 1;

        await LocationLog.create({
          id: nextLocationId,
          employeeId: employee.id,
          projectId: assignment.projectId,
          latitude: validatedLocation.latitude,
          longitude: validatedLocation.longitude,
          logType: 'PROGRESS_UPDATE',
          taskAssignmentId: assignment.id,
          progressPercent: progressValidation.percentage
        });
      } catch (locationLogError) {
        console.error("❌ Error logging location for progress update:", locationLogError);
        // Don't fail the request if location logging fails
      }
    }

    // Determine next action based on progress and status
    let nextAction = "continue_work";
    if (progressValidation.percentage >= 100) {
      nextAction = "task_completed";
    } else if (validatedIssues.length > 0) {
      nextAction = "resolve_issues";
    }

    // Return response matching design specification
    return res.json({ 
      success: true, 
      message: "Progress updated successfully",
      data: {
        progressId: progressRecord.id,
        assignmentId: assignment.id,
        progressPercent: progressValidation.percentage,
        submittedAt: submittedAt,
        status: "SUBMITTED",
        nextAction: nextAction,
        taskStatus: assignment.status,
        previousProgress: previousProgress,
        progressDelta: progressValidation.percentage - previousProgress
      }
    });

  } catch (err) {
    console.error("❌ updateWorkerTaskProgress:", err);
    
    // Determine error type and provide appropriate response
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: "Data validation error",
        error: "VALIDATION_ERROR"
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid data format",
        error: "INVALID_DATA_FORMAT"
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};

/* ----------------------------------------------------
   POST /worker/tasks/{taskId}/complete - Complete task
---------------------------------------------------- */
export const completeWorkerTask = async (req, res) => {
  try {
    // Input validation using validation utilities
    const authValidation = validateAuthData(req);
    if (!authValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: authValidation.message,
        error: authValidation.error
      });
    }

    const employee = await resolveEmployee(req);
    if (!employee) {
      return res.status(403).json({ 
        success: false, 
        message: "Employee not found or unauthorized",
        error: "EMPLOYEE_UNAUTHORIZED"
      });
    }

    // Validate task ID from URL parameter
    const taskId = parseInt(req.params.taskId);
    const taskIdValidation = validateId(taskId, "task assignment");
    if (!taskIdValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: taskIdValidation.message,
        error: taskIdValidation.error
      });
    }

    // Validate request body
    const { 
      completionNotes, 
      finalPhotos, 
      location,
      actualQuantityCompleted,
      qualityCheck 
    } = req.body;

    // Validate completion notes (required)
    const notesValidation = validateStringField(completionNotes, { 
      maxLength: 1000, 
      required: true,
      fieldName: "completion notes"
    });
    
    if (!notesValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: notesValidation.message,
        error: notesValidation.error
      });
    }

    // Validate location if provided
    let validatedLocation = null;
    if (location) {
      const coordValidation = validateCoordinates(location.latitude, location.longitude);
      if (coordValidation.isValid) {
        validatedLocation = {
          latitude: coordValidation.latitude,
          longitude: coordValidation.longitude,
          timestamp: location.timestamp ? new Date(location.timestamp) : new Date()
        };
      } else {
        console.warn("⚠️ Invalid location coordinates provided:", coordValidation.message);
      }
    }

    // Validate actual quantity completed if provided
    let validatedQuantity = null;
    if (actualQuantityCompleted !== undefined) {
      const quantityValidation = validateNumericValue(actualQuantityCompleted, {
        min: 0,
        max: 100000,
        default: null,
        fieldName: "actual quantity completed"
      });
      validatedQuantity = quantityValidation.value;
    }

    // Find the task assignment
    const assignment = await WorkerTaskAssignment.findOne({
      id: taskIdValidation.id,
      employeeId: employee.id
    });

    if (!assignment) {
      return res.status(403).json({ 
        success: false, 
        message: "Task assignment not found or unauthorized",
        error: "ASSIGNMENT_UNAUTHORIZED"
      });
    }

    // Check if task is already completed
    if (assignment.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: "Task is already completed",
        error: "TASK_ALREADY_COMPLETED"
      });
    }

    // Check if task is in progress (must be started to complete)
    if (assignment.status === 'queued') {
      return res.status(400).json({ 
        success: false, 
        message: "Task must be started before it can be completed",
        error: "TASK_NOT_STARTED"
      });
    }

    // Update assignment to completed status
    const completedAt = new Date();
    const previousStatus = assignment.status;
    assignment.status = 'completed';
    assignment.completedAt = completedAt;
    assignment.progressPercent = 100;

    // Update completion details
    assignment.completionNotes = notesValidation.value;
    if (validatedQuantity !== null) {
      assignment.actualQuantityCompleted = validatedQuantity;
    }
    if (qualityCheck) {
      assignment.qualityCheck = {
        passed: Boolean(qualityCheck.passed),
        notes: validateStringField(qualityCheck.notes, { 
          maxLength: 500, 
          default: "", 
          fieldName: "quality check notes" 
        }).value
      };
    }

    // Calculate total time spent
    let totalTimeSpent = 0;
    if (assignment.startTime) {
      totalTimeSpent = Math.round((completedAt - new Date(assignment.startTime)) / (1000 * 60)); // in minutes
    }

    // Update time estimates
    if (assignment.timeEstimate) {
      assignment.timeEstimate.elapsed = totalTimeSpent;
      assignment.timeEstimate.remaining = 0;
    }

    await assignment.save();

    // Create final progress record
    try {
      const last = await WorkerTaskProgress.findOne().sort({ id: -1 }).select("id");
      const nextId = last ? last.id + 1 : 1;

      await WorkerTaskProgress.create({
        id: nextId,
        workerTaskAssignmentId: taskIdValidation.id,
        employeeId: employee.id,
        progressPercent: 100,
        description: "Task completed",
        notes: notesValidation.value,
        location: validatedLocation,
        completedQuantity: validatedQuantity,
        submittedAt: completedAt,
        status: "COMPLETED"
      });
    } catch (progressError) {
      console.error("❌ Error creating completion progress record:", progressError);
      // Don't fail the request if progress logging fails
    }

    // Send task completion notification to supervisor
    try {
      if (assignment.supervisorId) {
        await TaskNotificationService.notifyTaskStatusChange(
          assignment, 
          previousStatus, 
          'completed', 
          assignment.supervisorId
        );
        console.log(`✅ Task completion notification sent to supervisor ${assignment.supervisorId}`);
      }
    } catch (notificationError) {
      console.error("❌ Error sending task completion notification:", notificationError);
      // Don't fail the request if notifications fail
    }

    // Log location for audit trail if provided
    if (validatedLocation) {
      try {
        const lastLocationLog = await LocationLog.findOne().sort({ id: -1 }).select("id");
        const nextLocationId = lastLocationLog ? lastLocationLog.id + 1 : 1;

        await LocationLog.create({
          id: nextLocationId,
          employeeId: employee.id,
          projectId: assignment.projectId,
          latitude: validatedLocation.latitude,
          longitude: validatedLocation.longitude,
          logType: 'TASK_COMPLETION',
          taskAssignmentId: assignment.id,
          progressPercent: 100
        });
      } catch (locationLogError) {
        console.error("❌ Error logging location for task completion:", locationLogError);
        // Don't fail the request if location logging fails
      }
    }

    // Find next task in sequence if any
    let nextTask = null;
    try {
      const nextAssignment = await WorkerTaskAssignment.findOne({
        employeeId: employee.id,
        date: assignment.date,
        projectId: assignment.projectId,
        sequence: assignment.sequence + 1,
        status: 'queued'
      });

      if (nextAssignment) {
        const nextTaskDetails = await Task.findOne({ id: nextAssignment.taskId });
        
        // Check if next task can be started
        let canStart = true;
        if (nextAssignment.dependencies && nextAssignment.dependencies.length > 0) {
          const dependencyResult = await checkDependencies(nextAssignment.dependencies);
          canStart = dependencyResult.canStart;
        }
        
        if (canStart) {
          const sequenceResult = await validateTaskSequence(nextAssignment, employee.id, nextAssignment.date);
          canStart = sequenceResult.canStart;
        }

        nextTask = {
          assignmentId: nextAssignment.id,
          taskName: nextTaskDetails?.taskName || "Next Task",
          canStart: canStart
        };
      }
    } catch (nextTaskError) {
      console.error("❌ Error finding next task:", nextTaskError);
      // Don't fail the request if next task lookup fails
    }

    return res.json({
      success: true,
      message: "Task completed successfully",
      data: {
        assignmentId: assignment.id,
        status: "completed",
        completedAt: completedAt,
        totalTimeSpent: totalTimeSpent,
        finalProgress: 100,
        nextTask: nextTask
      }
    });

  } catch (err) {
    console.error("❌ completeWorkerTask:", err);
    
    // Determine error type and provide appropriate response
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: "Data validation error",
        error: "VALIDATION_ERROR"
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid data format",
        error: "INVALID_DATA_FORMAT"
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};

/* ----------------------------------------------------
   GET /worker/tasks/history - Get worker's task history
---------------------------------------------------- */
export const getWorkerTaskHistory = async (req, res) => {
  try {
    // Input validation using validation utilities
    const authValidation = validateAuthData(req);
    if (!authValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: authValidation.message,
        error: authValidation.error
      });
    }

    const employee = await resolveEmployee(req);
    if (!employee) {
      return res.status(403).json({ 
        success: false, 
        message: "Employee not found or unauthorized",
        error: "EMPLOYEE_UNAUTHORIZED"
      });
    }

    // Parse and validate query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 items per page
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const status = req.query.status;
    const projectId = req.query.projectId ? parseInt(req.query.projectId) : null;

    // Validate pagination parameters
    if (page < 1) {
      return res.status(400).json({
        success: false,
        message: "Page number must be greater than 0",
        error: "INVALID_PAGE_NUMBER"
      });
    }

    if (limit < 1) {
      return res.status(400).json({
        success: false,
        message: "Limit must be greater than 0",
        error: "INVALID_LIMIT"
      });
    }

    // Build query filter
    const filter = {
      employeeId: employee.id
    };

    // Add date range filter if provided
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const startDateValidation = validateDateString(startDate, true);
        if (!startDateValidation.isValid) {
          return res.status(400).json({
            success: false,
            message: startDateValidation.message,
            error: startDateValidation.error
          });
        }
        filter.date.$gte = startDateValidation.date;
      }
      if (endDate) {
        const endDateValidation = validateDateString(endDate, true);
        if (!endDateValidation.isValid) {
          return res.status(400).json({
            success: false,
            message: endDateValidation.message,
            error: endDateValidation.error
          });
        }
        filter.date.$lte = endDateValidation.date;
      }
    }

    // Add status filter if provided
    if (status) {
      const validStatuses = ['queued', 'in_progress', 'completed', 'blocked', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          error: "INVALID_STATUS"
        });
      }
      filter.status = status;
    }

    // Add project filter if provided
    if (projectId) {
      const projectIdValidation = validateId(projectId, "project");
      if (!projectIdValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: projectIdValidation.message,
          error: projectIdValidation.error
        });
      }
      filter.projectId = projectIdValidation.id;
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalTasks = await WorkerTaskAssignment.countDocuments(filter);

    // Get task assignments with pagination
    const assignments = await WorkerTaskAssignment.find(filter)
      .sort({ date: -1, sequence: 1 }) // Most recent first, then by sequence
      .skip(skip)
      .limit(limit);

    if (assignments.length === 0) {
      return res.json({
        success: true,
        data: {
          tasks: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalTasks: 0,
            hasNext: false,
            hasPrevious: false
          },
          summary: {
            totalCompleted: 0,
            totalInProgress: 0,
            totalHoursWorked: 0,
            averageTaskTime: 0
          }
        }
      });
    }

    // Get task and project details for each assignment
    const taskDetails = await Promise.all(assignments.map(async (assignment) => {
      try {
        const [task, project] = await Promise.all([
          Task.findOne({ id: assignment.taskId }).select('taskName taskType'),
          Project.findOne({ id: assignment.projectId }).select('projectName')
        ]);

        // Calculate time spent
        let timeSpent = 0;
        if (assignment.startTime && assignment.completedAt) {
          timeSpent = Math.round((new Date(assignment.completedAt) - new Date(assignment.startTime)) / (1000 * 60)); // in minutes
        } else if (assignment.startTime && assignment.status === 'in_progress') {
          timeSpent = Math.round((new Date() - new Date(assignment.startTime)) / (1000 * 60)); // in minutes
        }

        return {
          assignmentId: assignment.id,
          taskId: assignment.taskId,
          taskName: task?.taskName || "N/A",
          taskType: task?.taskType || "WORK",
          projectName: project?.projectName || "N/A",
          status: assignment.status,
          startTime: assignment.startTime,
          completedAt: assignment.completedAt,
          progressPercent: assignment.progressPercent || 0,
          timeSpent: timeSpent,
          workArea: assignment.workArea || "",
          date: assignment.date
        };
      } catch (error) {
        console.error("❌ Error processing task assignment:", assignment.id, error);
        return {
          assignmentId: assignment.id,
          taskId: assignment.taskId,
          taskName: "Error Loading Task",
          taskType: "WORK",
          projectName: "N/A",
          status: assignment.status,
          startTime: assignment.startTime,
          completedAt: assignment.completedAt,
          progressPercent: assignment.progressPercent || 0,
          timeSpent: 0,
          workArea: assignment.workArea || "",
          date: assignment.date
        };
      }
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalTasks / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    // Calculate summary statistics
    const allAssignments = await WorkerTaskAssignment.find({
      employeeId: employee.id
    });

    const totalCompleted = allAssignments.filter(a => a.status === 'completed').length;
    const totalInProgress = allAssignments.filter(a => a.status === 'in_progress').length;
    
    // Calculate total hours worked
    const totalMinutesWorked = allAssignments.reduce((total, assignment) => {
      if (assignment.startTime && assignment.completedAt) {
        return total + Math.round((new Date(assignment.completedAt) - new Date(assignment.startTime)) / (1000 * 60));
      }
      return total;
    }, 0);
    
    const totalHoursWorked = Math.round((totalMinutesWorked / 60) * 100) / 100; // Round to 2 decimal places
    const averageTaskTime = totalCompleted > 0 ? Math.round((totalHoursWorked / totalCompleted) * 100) / 100 : 0;

    return res.json({
      success: true,
      data: {
        tasks: taskDetails,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalTasks: totalTasks,
          hasNext: hasNext,
          hasPrevious: hasPrevious
        },
        summary: {
          totalCompleted: totalCompleted,
          totalInProgress: totalInProgress,
          totalHoursWorked: totalHoursWorked,
          averageTaskTime: averageTaskTime
        }
      }
    });

  } catch (err) {
    console.error("❌ getWorkerTaskHistory:", err);
    
    // Determine error type and provide appropriate response
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: "Data validation error",
        error: "VALIDATION_ERROR"
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid data format",
        error: "INVALID_DATA_FORMAT"
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};

/* ----------------------------------------------------
   Legacy endpoint - keeping for backward compatibility
   POST /worker/task/start - Start a task with geofence validation
---------------------------------------------------- */
export const startWorkerTask = async (req, res) => {
  try {
    // Input validation using validation utilities
    const authValidation = validateAuthData(req);
    if (!authValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: authValidation.message,
        error: authValidation.error
      });
    }

    const employee = await resolveEmployee(req);
    if (!employee) {
      return res.status(403).json({ 
        success: false, 
        message: "Employee not found or unauthorized",
        error: "EMPLOYEE_UNAUTHORIZED"
      });
    }

    // Validate request body
    const { assignmentId, location } = req.body;

    // TODO: Complete the startWorkerTask function implementation
    return res.status(501).json({
      success: false,
      message: "Function implementation incomplete"
    });

  } catch (err) {
    console.error("Error in startWorkerTask:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message
    });
  }
};

/* ----------------------------------------------------
   POST /api/worker/task/progress - Submit task progress updates
   Enhanced version matching design specification
---------------------------------------------------- */
export const submitWorkerTaskProgress = async (req, res) => {
  try {
    // Input validation using validation utilities
    const authValidation = validateAuthData(req);
    if (!authValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: authValidation.message,
        error: authValidation.error
      });
    }

    const employee = await resolveEmployee(req);
    if (!employee) {  
      return res.status(403).json({ 
        success: false, 
        message: "Employee not found or unauthorized",
        error: "EMPLOYEE_UNAUTHORIZED"
      });
    }

    // Validate request body - enhanced to match design specification
    const { 
      assignmentId, 
      progressPercent, 
      description, 
      notes, 
      location,
      completedQuantity,
      issuesEncountered 
    } = req.body;

    // Validate assignment ID
    const assignmentIdValidation = validateId(assignmentId, "assignment");
    if (!assignmentIdValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: assignmentIdValidation.message,
        error: assignmentIdValidation.error
      });
    }

    // Validate progress percentage
    const progressValidation = validateProgressPercentage(progressPercent);
    if (!progressValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: progressValidation.message,
        error: progressValidation.error
      });
    }

    // Validate description (required field)
    const descriptionValidation = validateStringField(description, { 
      maxLength: 1000, 
      required: true,
      fieldName: "description"
    });
    
    if (!descriptionValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: descriptionValidation.message,
        error: descriptionValidation.error
      });
    }
    
    const notesValidation = validateStringField(notes, { 
      maxLength: 500, 
      default: "", 
      fieldName: "notes" 
    });

    // Validate location if provided
    let validatedLocation = null;
    if (location) {
      const coordValidation = validateCoordinates(location.latitude, location.longitude);
      if (coordValidation.isValid) {
        validatedLocation = {
          latitude: coordValidation.latitude,
          longitude: coordValidation.longitude,
          timestamp: location.timestamp ? new Date(location.timestamp) : new Date()
        };
      } else {
        console.warn("⚠️ Invalid location coordinates provided:", coordValidation.message);
      }
    }

    // Validate completed quantity if provided
    let validatedCompletedQuantity = null;
    if (completedQuantity !== undefined) {
      const quantityValidation = validateNumericValue(completedQuantity, {
        min: 0,
        max: 100000,
        default: null,
        fieldName: "completed quantity"
      });
      validatedCompletedQuantity = quantityValidation.value;
    }

    // Validate issues encountered if provided
    let validatedIssues = [];
    if (issuesEncountered && Array.isArray(issuesEncountered)) {
      validatedIssues = issuesEncountered.slice(0, 10).map(issue => {
        if (typeof issue === 'string') {
          return validateStringField(issue, { 
            maxLength: 200, 
            default: "", 
            fieldName: "issue" 
          }).value;
        }
        return "";
      }).filter(issue => issue.length > 0);
    }

    // Find the task assignment
    const assignment = await WorkerTaskAssignment.findOne({
      id: assignmentIdValidation.id,
      employeeId: employee.id
    });

    if (!assignment) {
      return res.status(403).json({ 
        success: false, 
        message: "Task assignment not found or unauthorized",
        error: "ASSIGNMENT_UNAUTHORIZED"
      });
    }

    // Check if task is in a valid state for progress updates
    if (assignment.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot update progress for completed task",
        error: "TASK_ALREADY_COMPLETED"
      });
    }

    if (assignment.status === 'queued') {
      return res.status(400).json({ 
        success: false, 
        message: "Task must be started before progress can be updated",
        error: "TASK_NOT_STARTED"
      });
    }

    // Validate progress logic - cannot decrease progress
    const currentProgress = assignment.progressPercent || 0;
    if (progressValidation.percentage < currentProgress) {
      return res.status(400).json({ 
        success: false, 
        message: `Progress percentage cannot be decreased from ${currentProgress}% to ${progressValidation.percentage}%`,
        error: "INVALID_PROGRESS_DECREASE",
        data: {
          currentProgress: currentProgress,
          attemptedProgress: progressValidation.percentage
        }
      });
    }

    // Create WorkerTaskProgress record
    const last = await WorkerTaskProgress.findOne().sort({ id: -1 }).select("id");
    const nextId = last ? last.id + 1 : 1;

    const submittedAt = new Date();
    const progressRecord = await WorkerTaskProgress.create({
      id: nextId,
      workerTaskAssignmentId: assignmentIdValidation.id,
      employeeId: employee.id,
      progressPercent: progressValidation.percentage,
      description: descriptionValidation.value,
      notes: notesValidation.value,
      location: validatedLocation,
      completedQuantity: validatedCompletedQuantity,
      issuesEncountered: validatedIssues,
      submittedAt: submittedAt,
      status: "SUBMITTED"
    });

    // Update assignment progress and status
    const previousProgress = assignment.progressPercent || 0;
    const previousStatus = assignment.status;
    assignment.progressPercent = progressValidation.percentage;
    
    // Update status based on progress
    if (progressValidation.percentage >= 100) {
      assignment.status = "completed";
      assignment.completedAt = submittedAt;
    } else if (assignment.status === 'queued') {
      assignment.status = "in_progress";
      if (!assignment.startTime) {
        assignment.startTime = submittedAt;
      }
    }

    // Update time estimates if available
    if (assignment.timeEstimate) {
      const progressDelta = progressValidation.percentage - previousProgress;
      if (progressDelta > 0 && assignment.timeEstimate.estimated > 0) {
        const estimatedElapsed = (progressValidation.percentage / 100) * assignment.timeEstimate.estimated;
        assignment.timeEstimate.elapsed = Math.min(estimatedElapsed, assignment.timeEstimate.estimated);
        assignment.timeEstimate.remaining = Math.max(0, assignment.timeEstimate.estimated - assignment.timeEstimate.elapsed);
      }
    }

    await assignment.save();

    // Send task status change notification to supervisor if status changed
    try {
      if (assignment.supervisorId && previousStatus !== assignment.status) {
        await TaskNotificationService.notifyTaskStatusChange(
          assignment, 
          previousStatus, 
          assignment.status, 
          assignment.supervisorId
        );
        console.log(`✅ Task status change notification sent to supervisor ${assignment.supervisorId}`);
      }
    } catch (notificationError) {
      console.error("❌ Error sending task status change notification:", notificationError);
      // Don't fail the request if notifications fail
    }

    // Log location for audit trail if provided
    if (validatedLocation) {
      try {
        const lastLocationLog = await LocationLog.findOne().sort({ id: -1 }).select("id");
        const nextLocationId = lastLocationLog ? lastLocationLog.id + 1 : 1;

        await LocationLog.create({
          id: nextLocationId,
          employeeId: employee.id,
          projectId: assignment.projectId,
          latitude: validatedLocation.latitude,
          longitude: validatedLocation.longitude,
          logType: 'PROGRESS_UPDATE',
          taskAssignmentId: assignment.id,
          progressPercent: progressValidation.percentage
        });
      } catch (locationLogError) {
        console.error("❌ Error logging location for progress update:", locationLogError);
        // Don't fail the request if location logging fails
      }
    }

    // Determine next action based on progress and status
    let nextAction = "continue_work";
    if (progressValidation.percentage >= 100) {
      nextAction = "task_completed";
    } else if (validatedIssues.length > 0) {
      nextAction = "resolve_issues";
    }

    // Return response matching design specification
    return res.json({ 
      success: true, 
      message: "Progress updated successfully",
      data: {
        progressId: progressRecord.id,
        assignmentId: assignment.id,
        progressPercent: progressValidation.percentage,
        submittedAt: submittedAt,
        status: "SUBMITTED",
        nextAction: nextAction,
        taskStatus: assignment.status,
        previousProgress: previousProgress,
        progressDelta: progressValidation.percentage - previousProgress
      }
    });

  } catch (err) {
    console.error("❌ submitWorkerTaskProgress:", err);
    
    // Determine error type and provide appropriate response
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: "Data validation error",
        error: "VALIDATION_ERROR"
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid data format",
        error: "INVALID_DATA_FORMAT"
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};

/* ----------------------------------------------------
   POST /worker/task-photos
---------------------------------------------------- */
export const uploadWorkerTaskPhotos = async (req, res) => {
  try {
    // Input validation using validation utilities
    const authValidation = validateAuthData(req);
    if (!authValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: authValidation.message,
        error: authValidation.error
      });
    }

    const employee = await resolveEmployee(req);
    if (!employee) {
      return res.status(403).json({ 
        success: false, 
        message: "Employee not found or unauthorized",
        error: "EMPLOYEE_UNAUTHORIZED"
      });
    }

    const { assignmentId, captions, location } = req.body;

    // Validate assignment ID
    const assignmentIdValidation = validateId(assignmentId, "assignment");
    if (!assignmentIdValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: assignmentIdValidation.message,
        error: assignmentIdValidation.error
      });
    }

    // Validate files are present
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "No photos provided",
        error: "NO_PHOTOS_PROVIDED"
      });
    }

    // Validate file count (max 5 photos as per design spec)
    if (req.files.length > 5) {
      return res.status(400).json({ 
        success: false, 
        message: "Maximum 5 photos allowed per upload",
        error: "TOO_MANY_PHOTOS"
      });
    }

    // Validate file types and sizes
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxFileSize = 10 * 1024 * 1024; // 10MB as per design spec

    for (const file of req.files) {
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid file type. Only JPEG and PNG files are allowed",
          error: "INVALID_FILE_TYPE"
        });
      }

      if (file.size > maxFileSize) {
        return res.status(400).json({ 
          success: false, 
          message: "File size too large. Maximum 10MB per file",
          error: "FILE_TOO_LARGE"
        });
      }
    }

    const assignment = await WorkerTaskAssignment.findOne({
      id: assignmentIdValidation.id,
      employeeId: employee.id
    });

    if (!assignment) {
      return res.status(403).json({ 
        success: false, 
        message: "Task assignment not found or unauthorized",
        error: "ASSIGNMENT_UNAUTHORIZED"
      });
    }

    // Check existing photo count to enforce limit
    const existingPhotoCount = await WorkerTaskPhoto.countDocuments({
      workerTaskAssignmentId: assignmentIdValidation.id
    });

    if (existingPhotoCount + req.files.length > 5) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot upload ${req.files.length} photos. Maximum 5 photos per task (${existingPhotoCount} already uploaded)`,
        error: "PHOTO_LIMIT_EXCEEDED"
      });
    }

    // Parse captions if provided (should be array or comma-separated string)
    let photoCaptions = [];
    if (captions) {
      try {
        if (Array.isArray(captions)) {
          photoCaptions = captions;
        } else if (typeof captions === 'string') {
          // Try to parse as JSON array first, then fall back to comma-separated
          try {
            photoCaptions = JSON.parse(captions);
          } catch {
            photoCaptions = captions.split(',').map(c => c.trim());
          }
        }
      } catch (error) {
        console.warn("⚠️ Error parsing captions, using empty captions:", error);
        photoCaptions = [];
      }
    }

    // Parse location if provided
    let photoLocation = null;
    if (location) {
      try {
        const locationData = typeof location === 'string' ? JSON.parse(location) : location;
        if (locationData && locationData.latitude && locationData.longitude) {
          const coordValidation = validateCoordinates(locationData.latitude, locationData.longitude);
          if (coordValidation.isValid) {
            photoLocation = {
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              timestamp: locationData.timestamp || new Date().toISOString()
            };
          }
        }
      } catch (error) {
        console.warn("⚠️ Error parsing location data:", error);
      }
    }

    const last = await WorkerTaskPhoto.findOne().sort({ id: -1 }).select("id");
    let nextId = last ? last.id + 1 : 1;

    // Create photo records with enhanced naming convention
    const uploadTimestamp = Date.now();
    const photos = [];
    
    // Process each file with proper naming convention
    for (let index = 0; index < req.files.length; index++) {
      const file = req.files[index];
      const fileIndex = index + 1;
      const extension = path.extname(file.originalname);
      
      // Generate proper filename: task_{assignmentId}_{timestamp}_{index}.jpg
      const properFilename = `task_${assignmentIdValidation.id}_${uploadTimestamp}_${fileIndex}${extension}`;
      const oldPath = file.path;
      const newPath = path.join(path.dirname(oldPath), properFilename);
      
      try {
        // Rename the file to follow proper naming convention
        fs.renameSync(oldPath, newPath);
        
        // Update the file object with new filename
        file.filename = properFilename;
        file.path = newPath;
      } catch (renameError) {
        console.error(`❌ Error renaming file ${file.filename} to ${properFilename}:`, renameError);
        // If rename fails, use original filename but log the error
      }
      
      // Create photo URL with proper filename
      const photoUrl = `/uploads/tasks/${file.filename}`;
      
      const photo = {
        id: nextId++,
        workerTaskAssignmentId: assignmentIdValidation.id,
        employeeId: employee.id,
        photoUrl: photoUrl,
        caption: photoCaptions[index] || '',
        location: photoLocation,
        uploadedAt: new Date(),
        fileSize: file.size,
        originalName: file.originalname,
        mimeType: file.mimetype
      };
      
      photos.push(photo);
    }

    await WorkerTaskPhoto.insertMany(photos);

    // Enhanced response format matching design specification
    return res.json({
      success: true,
      data: {
        uploadedPhotos: photos.map(photo => ({
          id: photo.id,
          photoUrl: photo.photoUrl,
          caption: photo.caption,
          uploadedAt: photo.uploadedAt,
          fileSize: photo.fileSize,
          dimensions: "1920x1080" // Placeholder - would need image processing to get actual dimensions
        })),
        totalPhotos: existingPhotoCount + photos.length,
        maxPhotos: 5
      },
      message: "Photos uploaded successfully"
    });

  } catch (err) {
    console.error("❌ uploadWorkerTaskPhotos:", err);
    
    // Determine error type and provide appropriate response
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: "Data validation error",
        error: "VALIDATION_ERROR"
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid data format",
        error: "INVALID_DATA_FORMAT"
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};

/* ----------------------------------------------------
   POST /worker/task/issue - Report task issue
---------------------------------------------------- */
export const reportWorkerTaskIssue = async (req, res) => {
  try {
    // Input validation using validation utilities
    const authValidation = validateAuthData(req);
    if (!authValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: authValidation.message,
        error: authValidation.error
      });
    }

    const employee = await resolveEmployee(req);
    if (!employee) {
      return res.status(403).json({ 
        success: false, 
        message: "Employee not found or unauthorized",
        error: "EMPLOYEE_UNAUTHORIZED"
      });
    }

    const { assignmentId, issueType, priority, description, location } = req.body;

    // Validate assignment ID
    const assignmentIdValidation = validateId(assignmentId, "assignment");
    if (!assignmentIdValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: assignmentIdValidation.message,
        error: assignmentIdValidation.error
      });
    }

    // Validate issue type
    const validIssueTypes = [
      'material_shortage', 'tool_malfunction', 'safety_concern', 
      'quality_issue', 'weather_delay', 'technical_problem', 'other'
    ];
    
    if (!issueType || !validIssueTypes.includes(issueType)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid issue type. Must be one of: " + validIssueTypes.join(', '),
        error: "INVALID_ISSUE_TYPE"
      });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    const issuePriority = priority || 'medium';
    
    if (!validPriorities.includes(issuePriority)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid priority. Must be one of: " + validPriorities.join(', '),
        error: "INVALID_PRIORITY"
      });
    }

    // Validate description
    const descriptionValidation = validateStringField(description, {
      required: true,
      minLength: 10,
      maxLength: 1000,
      fieldName: "description"
    });

    if (!descriptionValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: descriptionValidation.message,
        error: descriptionValidation.error
      });
    }

    // Verify assignment belongs to employee
    const assignment = await WorkerTaskAssignment.findOne({
      id: assignmentIdValidation.id,
      employeeId: employee.id
    });

    if (!assignment) {
      return res.status(403).json({ 
        success: false, 
        message: "Task assignment not found or unauthorized",
        error: "ASSIGNMENT_UNAUTHORIZED"
      });
    }

    // Parse location if provided
    let issueLocation = null;
    if (location) {
      try {
        const locationData = typeof location === 'string' ? JSON.parse(location) : location;
        if (locationData && locationData.latitude && locationData.longitude) {
          const coordValidation = validateCoordinates(locationData.latitude, locationData.longitude);
          if (coordValidation.isValid) {
            issueLocation = {
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              workArea: locationData.workArea || assignment.workArea || 'Unknown',
              timestamp: locationData.timestamp || new Date().toISOString()
            };
          }
        }
      } catch (error) {
        console.warn("⚠️ Error parsing location data:", error);
      }
    }

    // Import TaskIssue model
    const { default: TaskIssue } = await import('./models/TaskIssue.js');

    // Get next ID for TaskIssue
    const lastIssue = await TaskIssue.findOne().sort({ id: -1 }).select("id");
    const nextId = lastIssue ? lastIssue.id + 1 : 1;

    // Generate ticket number
    const ticketNumber = `ISSUE_${Date.now()}_${nextId}`;

    // Create issue record
    const issue = new TaskIssue({
      id: nextId,
      assignmentId: assignmentIdValidation.id,
      employeeId: employee.id,
      projectId: assignment.projectId, // Add projectId from assignment
      issueType: issueType,
      priority: issuePriority,
      description: descriptionValidation.value,
      location: issueLocation,
      ticketNumber: ticketNumber,
      status: 'reported', // Use correct enum value
      reportedAt: new Date()
    });

    await issue.save();

    // Update assignment status if needed (optional)
    const previousStatus = assignment.status;
    if (issuePriority === 'critical' || issuePriority === 'high') {
      assignment.status = 'blocked';
      await assignment.save();

      // Send task status change notification to supervisor
      try {
        if (assignment.supervisorId) {
          await TaskNotificationService.notifyTaskStatusChange(
            assignment, 
            previousStatus, 
            'blocked', 
            assignment.supervisorId
          );
          console.log(`✅ Task blocked notification sent to supervisor ${assignment.supervisorId}`);
        }
      } catch (notificationError) {
        console.error("❌ Error sending task blocked notification:", notificationError);
        // Don't fail the request if notifications fail
      }
    }

    // Enhanced response format
    return res.json({
      success: true,
      data: {
        issueId: issue.id,
        ticketNumber: ticketNumber,
        status: 'reported',
        reportedAt: issue.reportedAt,
        estimatedResolution: null, // Could be calculated based on issue type and priority
        assignmentStatus: assignment.status
      },
      message: "Issue reported successfully"
    });

  } catch (err) {
    console.error("❌ reportWorkerTaskIssue:", err);
    
    // Determine error type and provide appropriate response
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: "Data validation error",
        error: "VALIDATION_ERROR"
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid data format",
        error: "INVALID_DATA_FORMAT"
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};