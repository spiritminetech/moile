// server.js

import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
console.log('🔧 DNS servers configured for MongoDB Atlas connectivity');


import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// DB
import connectDB from './src/config/database.js';

// Routes
import authRoutes from './src/modules/auth/authRoutes.js';
//import userRoutes from './routes/user/userRoutes.js';
import companyRoutes from './src/modules/company/companyRoutes.js';
import employeeRoutes from './src/modules/employees/employeeRoutes.js';
import employeePassportRoutes from './src/modules/employees/submodules/employeePassport/employeePassportRoutes.js';
import employeeWorkPassRoutes from './src/modules/employees/submodules/employeeWorkPass/employeeWorkPassRoutes.js';
import employeeQualificationRoutes from './src/modules/employees/submodules/employeeQualification/employeeQualificationRoutes.js';
import employeeCertificationRoutes from './src/modules/employees/submodules/employeeCertification/employeeCertificationRoutes.js';
import employeeDocumentRoutes from './src/modules/employees/submodules/employeeDocument/employeeDocumentRoutes.js';

import fleetVehicleRoutes from './src/modules/fleetVehicle/fleetVehicleRoutes.js';
import fleetTaskRoutes from './src/modules/fleetTask/fleetTaskRoutes.js';
import fleetTaskPassengerRoutes from './src/modules/fleetTaskPassenger/fleetTaskPassengerRoutes.js';
// import fleetAlertRoutes from './routes/fleetTask/fleetAlertRoutes.js';
import driverRoutes from './src/modules/driver/driverRoutes.js';
import projectRoutes from './src/modules/project/projectRoutes.js';
import taskRoutes from './src/modules/task/taskRoutes.js';
import toolRoutes from './src/modules/tool/toolRoute.js';
import materialRoutes from './src/modules/materials/materialRoutes.js';
import workerTaskAssignmentRoutes from './src/modules/workerTaskAssignment/workerTaskAssignmentRoutes.js';
import workerRoute from './src/modules/worker/workerRoute.js'; 
import companyUserRoute from './src/modules/companyUser/companyUserRoute.js';
import adminManpowerRoutes from "./src/modules/adminManpower/adminManpowerRoutes.js";
import adminProgressRoutes from "./src/modules/adminProgress/adminProgressRoutes.js";
import progressReportRoutes from './src/modules/progressReport/progressReportRoutes.js';
import clientRoutes from "./src/modules/client/clientRoutes.js";
import dashboardRoutes from "./src/modules/bossDashboard/dashboardRoutes.js"
import bossRoutes from "./src/modules/bossProject/bossRoutes.js"
import bossReportsRoutes from "./src/modules/bossReports/bossReportsRoutes.js"
import attendanceRoutes from './src/modules/bossAttendance/attendanceRoutes.js';
import masterRoutes from"./src/modules/project/submodules/projectMaster/masterRoute.js";
import bossProgressReportRoutes from './src/modules/bossProgressReport/bossProgressReportRoutes.js';
import adminRoutes from './src/modules/adminDashboard/adminRoutes.js';
import workerViewRoutes from "./src/modules/worker/submodules/workerViewRoutes.js";
import projectManagerDashboardRoutes from "./src/modules/managerDashboard/ManagerDashboardRoutes.js"
import transportAssignmentRoutes from "./src/modules/adminTransportAssignment/transportAssignmentRoutes.js";
import driverTaskRoutes from "./src/modules/adminDriverTaskAssignment/driverTaskRoutes.js";
import adminAttendanceRoutes from "./src/modules/adminAttendance/adminAttendanceRoutes.js";
import roleRoutes from "./src/modules/role/roleRoutes.js";
import userManagementRoutes from "./src/modules/user/userManagementRoutes.js";
import permissionRoutes from "./src/modules/Permission/permissionRoutes.js";
import rolePermissionRoutes from "./src/modules/rolePermission/rolePermissionRoutes.js";
import managerTaskRoutes from "./src/modules/managerTaskAssignment/managerTaskRoutes.js";
import managerDailyProgressRoutes from "./src/modules/managerDailyProgressApproval/managerDailyProgressRoutes.js";
import payrollRoutes from "./src/modules/payroll/payrollRoutes.js";
import quotationTermRoutes from "./src/modules/quotation/quotationTermRoutes.js";
import quotationRoutes from "./src/modules/quotation/quotationRoutes.js";
import costBreakdownRoutes from "./src/modules/costBreakdown/costBreakdownRoutes.js";


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));






// API Routes

app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/employees/passports', employeePassportRoutes);
app.use('/api/employees/work-passes', employeeWorkPassRoutes);
app.use('/api/employees/qualifications', employeeQualificationRoutes);
app.use('/api/employees/certifications', employeeCertificationRoutes);
app.use('/api/employees/documents', employeeDocumentRoutes);

app.use('/api/fleet-vehicles', fleetVehicleRoutes);
app.use('/api/fleet-tasks', fleetTaskRoutes);
app.use('/api/fleet-task-passengers', fleetTaskPassengerRoutes);
// app.use('/api/fleet-alerts', fleetAlertRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/company-users', companyUserRoute);

app.use("/api/master", masterRoutes);
app.use("/api/clients", clientRoutes);


app.use('/api/workers', workerRoute);
app.use('/api/workers-assignments', workerTaskAssignmentRoutes);
app.use("/api/admin", adminManpowerRoutes);
app.use("/api/admin", adminProgressRoutes);
app.use('/api', progressReportRoutes);
app.use('/api',dashboardRoutes);
app.use('/api',bossRoutes);
app.use('/api',bossReportsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/boss', bossProgressReportRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/worker-view", workerViewRoutes);
app.use("/api", projectManagerDashboardRoutes);
app.use("/api/transport", transportAssignmentRoutes);
app.use("/api/transport", driverTaskRoutes);
app.use("/api/admin", adminAttendanceRoutes);
app.use("/api/admin/roles", roleRoutes);
app.use("/api/user-management", userManagementRoutes);
app.use("/api/admin/permissions", permissionRoutes);
app.use("/api/admin/role-permissions", rolePermissionRoutes);
app.use("/api/manager/tasks", managerTaskRoutes);
app.use("/api/manager/daily-progress", managerDailyProgressRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api", quotationTermRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/cost-breakdown", costBreakdownRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'ERP API is running!',
    endpoints: {
      users: '/api/users',
      companies: '/api/companies',
      employees: '/api/employees',
      fleetVehicles: '/api/fleet-vehicles',
      fleetTasks: '/api/fleet-tasks',
      fleetTaskPassengers: '/api/fleet-task-passengers',
      fleetAlerts: '/api/fleet-alerts',
      drivers: '/api/drivers',
      projects: '/api/projects',
      tasks: '/api/tasks',
    },
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: 'Connected',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API base URL: http://localhost:${PORT}/api`);
  console.log(`📂 Uploaded files available at: http://localhost:${PORT}/uploads`);
});

export default app;
