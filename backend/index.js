import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import centralized configuration
import appConfig from './src/config/app.config.js';

// Import routes
import authRoutes from './src/modules/auth/authRoutes.js';
import companyUserRoutes from './src/modules/companyUser/companyUserRoutes.js';
import driverRoutes from './src/modules/driver/driverRoutes.js';
import fleetTaskRoutes from './src/modules/fleetTask/fleetTaskRoutes.js';
import fleetTaskPassengerRoutes from './src/modules/fleetTask/submodules/fleetTaskPassenger/fleetTaskPassengerRoutes.js';
import fleetVehicleRoutes from './src/modules/fleetTask/submodules/fleetvehicle/fleetVehicleRoutes.js';
import projectRoutes from './src/modules/project/projectRoutes.js';
import projectToolsRoutes from './src/modules/project/projectToolsRoutes.js';
import workerRoutes from './src/modules/worker/workerRoutes.js';
import workerRequestRoutes from './src/modules/worker/workerRequestRoutes.js';
import workerAttendanceRoutes from './src/modules/worker/workerAttendanceRoutes.js';
import attendanceRoutes from'./src/modules/attendance/attendanceRoutes.js';
import supervisorRoutes from './src/modules/supervisor/supervisorRoutes.js';
import supervisorDailyProgressRoutes  from "./src/modules/supervisorDailyProgress/supervisorDailyProgressRoutes.js";
import leaveRequestRoutes from './src/modules/leaveRequest/leaveRequestRoutes.js';
import paymentRequestRoutes from './src/modules/leaveRequest/paymentRequestRoutes.js';
import medicalClaimRoutes from './src/modules/leaveRequest/medicalClaimRoutes.js';
import materialRequestRoutes from './src/modules/project/materialRequestRoutes.js';
import notificationRoutes from './src/modules/notification/notificationRoutes.js';
import supervisorNotificationRoutes from './src/modules/notification/supervisorNotificationRoutes.js';
import migrationRoutes from './src/routes/migration.js';

// Import Firebase service for initialization
import firebaseService from './src/modules/notification/services/FirebaseService.js';

// Import Notification Escalation Service
import notificationEscalationService from './src/modules/notification/services/NotificationEscalationService.js';

// Import Performance Monitoring Service
import performanceMonitoringService from './src/modules/notification/services/PerformanceMonitoringService.js';

// Import Attendance Scheduler
import attendanceScheduler from './src/modules/attendance/attendanceScheduler.js';

const app = express();

// Middleware
app.use(cors(appConfig.cors));
app.use(express.json({ limit: `${appConfig.upload.maxFileSize}b` }));
app.use(express.urlencoded({ extended: true, limit: `${appConfig.upload.maxFileSize}b` }));

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Serve uploaded files statically - THIS IS CRITICAL FOR PHOTO PREVIEWS
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log static file requests for debugging
if (appConfig.server.isDevelopment) {
  app.use('/uploads', (req, res, next) => {
    appConfig.log(`📁 Static file request: ${req.path}`);
    next();
  });
}

// API Routes with centralized prefix
const apiPrefix = appConfig.api.prefix;
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/company-users`, companyUserRoutes);
app.use(`${apiPrefix}/driver`, driverRoutes);
app.use(`${apiPrefix}/fleet-tasks`, fleetTaskRoutes);
app.use(`${apiPrefix}/fleet-task-passengers`, fleetTaskPassengerRoutes);
app.use(`${apiPrefix}/fleet-vehicles`, fleetVehicleRoutes);
app.use(`${apiPrefix}/projects`, projectRoutes);
app.use(`${apiPrefix}/project`, projectToolsRoutes);
app.use(`${apiPrefix}/worker`, workerRoutes);
app.use(`${apiPrefix}/worker/requests`, workerRequestRoutes);
app.use(`${apiPrefix}/worker/attendance`, workerAttendanceRoutes);
app.use(`${apiPrefix}/attendance`, attendanceRoutes);
app.use(`${apiPrefix}/supervisor`, supervisorRoutes);
app.use(`${apiPrefix}/supervisor`, supervisorDailyProgressRoutes);
app.use(`${apiPrefix}/leave-requests`, leaveRequestRoutes);
app.use(`${apiPrefix}/payment-requests`, paymentRequestRoutes);
app.use(`${apiPrefix}/medical-claims`, medicalClaimRoutes);
app.use(`${apiPrefix}/material-requests`, materialRequestRoutes);
app.use(`${apiPrefix}/notifications`, notificationRoutes);
app.use(`${apiPrefix}/supervisor/notifications`, supervisorNotificationRoutes);
app.use(`${apiPrefix}/migration`, migrationRoutes);

// Enhanced health check route
app.get(`${apiPrefix}/health`, (req, res) => {
  res.json({ 
    success: true, 
    message: 'ERP System API is running', 
    timestamp: new Date().toISOString(),
    version: appConfig.api.version,
    environment: appConfig.server.environment,
    port: appConfig.server.port,
    endpoints: {
      api: apiPrefix,
      uploads: '/uploads',
      health: `${apiPrefix}/health`
    }
  });
});

// Test static file route
app.get(`${apiPrefix}/test-upload`, (req, res) => {
  res.json({
    success: true,
    message: 'Static file serving test',
    uploadsPath: path.join(__dirname, 'uploads'),
    staticRoute: '/uploads',
    maxFileSize: appConfig.upload.maxFileSize,
    allowedTypes: appConfig.upload.allowedTypes
  });
});

// MongoDB connection with centralized config
mongoose.connect(appConfig.database.uri, { 
  dbName: appConfig.database.name,
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(async () => {
    appConfig.log(`✅ Connected to MongoDB database: ${appConfig.database.name}`);
    appConfig.log(`🌐 Database URI: ${appConfig.database.uri.replace(/\/\/.*@/, '//***:***@')}`);
    
    // Initialize Firebase service for push notifications
    try {
      await firebaseService.initialize();
      appConfig.log('🔥 Firebase service initialized for push notifications');
    } catch (error) {
      appConfig.error('⚠️ Firebase service initialization failed:', error.message);
      appConfig.log('📱 Push notifications will be unavailable');
    }

    // Initialize Notification Escalation Service
    try {
      notificationEscalationService.start();
      appConfig.log('⏰ Notification escalation service started');
    } catch (error) {
      appConfig.error('⚠️ Notification escalation service failed to start:', error.message);
      appConfig.log('📢 Critical notification escalation will be unavailable');
    }

    // Initialize Performance Monitoring Service
    try {
      // Performance monitoring starts automatically in constructor
      appConfig.log('📊 Performance monitoring service started');
      appConfig.log('🔍 Monitoring: delivery times, system load, uptime, and performance metrics');
    } catch (error) {
      appConfig.error('⚠️ Performance monitoring service failed to start:', error.message);
      appConfig.log('📈 Performance metrics will be unavailable');
    }

    // Initialize Attendance Scheduler
    try {
      attendanceScheduler.start(15); // Check every 15 minutes
      appConfig.log('📅 Attendance scheduler started - checking every 15 minutes');
    } catch (error) {
      appConfig.error('⚠️ Attendance scheduler failed to start:', error.message);
      appConfig.log('⏰ Attendance alerts will need to be triggered manually');
    }
  })
  .catch(err => {
    appConfig.error('❌ MongoDB connection error:', err);
    if (appConfig.server.isProduction) {
      process.exit(1);
    }
  });

// Start server
app.listen(appConfig.server.port, () => {
  console.log('🚀 ERP System Backend Started');
  console.log('================================');
  appConfig.log(`🌍 Environment: ${appConfig.server.environment}`);
  appConfig.log(`🚀 Server: ${appConfig.getFullUrl()}`);
  appConfig.log(`📁 Static files: ${appConfig.getFullUrl('/uploads/')}`);
  appConfig.log(`🔗 Health check: ${appConfig.getFullUrl(`${apiPrefix}/health`)}`);
  appConfig.log(`🖼️  Upload endpoints: ${Object.keys(appConfig.upload.paths).join(', ')}`);
  appConfig.log(`🔒 CORS origins: ${appConfig.cors.origin.join(', ')}`);
  console.log('================================');
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  // Stop performance monitoring
  try {
    performanceMonitoringService.stopMonitoring();
    appConfig.log('📊 Performance monitoring service stopped');
  } catch (error) {
    appConfig.error('⚠️ Error stopping performance monitoring:', error.message);
  }
  
  // Stop notification escalation service
  try {
    notificationEscalationService.stop();
    appConfig.log('⏰ Notification escalation service stopped');
  } catch (error) {
    appConfig.error('⚠️ Error stopping escalation service:', error.message);
  }
  
  // Stop attendance scheduler
  try {
    attendanceScheduler.stop();
    appConfig.log('📅 Attendance scheduler stopped');
  } catch (error) {
    appConfig.error('⚠️ Error stopping attendance scheduler:', error.message);
  }
  
  // Close database connection
  mongoose.connection.close(() => {
    appConfig.log('🔌 MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.emit('SIGTERM');
});