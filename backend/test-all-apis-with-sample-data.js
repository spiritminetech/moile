import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://192.168.1.6:5002';
const API_PREFIX = '/api';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}\n`),
  subsection: (msg) => console.log(`\n${colors.magenta}--- ${msg} ---${colors.reset}\n`)
};

// Test results tracker
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// Store tokens and IDs for subsequent tests
const testData = {
  tokens: {},
  ids: {},
  users: {}
};

/**
 * Test API endpoint
 */
async function testAPI(name, method, endpoint, data = null, token = null, expectedStatus = 200) {
  testResults.total++;
  
  try {
    const config = {
      method,
      url: `${BASE_URL}${API_PREFIX}${endpoint}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    };
    
    if (data) {
      if (method === 'GET') {
        config.params = data;
      } else {
        config.data = data;
      }
    }
    
    log.info(`Testing: ${name}`);
    console.log(`   ${method} ${endpoint}`);
    
    const response = await axios(config);
    
    if (response.status === expectedStatus) {
      testResults.passed++;
      log.success(`${name} - Status: ${response.status}`);
      return { success: true, data: response.data };
    } else {
      testResults.failed++;
      log.warning(`${name} - Unexpected status: ${response.status} (expected ${expectedStatus})`);
      return { success: false, data: response.data };
    }
  } catch (error) {
    testResults.failed++;
    const errorMsg = error.response?.data?.message || error.message;
    log.error(`${name} - Error: ${errorMsg}`);
    testResults.errors.push({ name, error: errorMsg });
    return { success: false, error: errorMsg };
  }
}

/**
 * Insert sample data into database
 */
async function insertSampleData() {
  log.section('📊 INSERTING SAMPLE DATA INTO DATABASE');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'erp'
    });
    log.success('Connected to MongoDB');
    
    // Import models
    const { default: Company } = await import('./src/modules/company/Company.js');
    const { default: User } = await import('./src/modules/user/User.js');
    const { default: Employee } = await import('./src/modules/employee/Employee.js');
    const { default: Project } = await import('./src/modules/project/models/Project.js');
    const { default: Task } = await import('./src/modules/task/Task.js');
    const { default: Role } = await import('./src/modules/role/Role.js');
    const { default: Permission } = await import('./src/modules/permission/Permission.js');
    const bcrypt = (await import('bcryptjs')).default;
    
    // 1. Create Company
    log.subsection('Creating Company');
    let company = await Company.findOne({ name: 'Test Construction Company' });
    if (!company) {
      company = await Company.create({
        name: 'Test Construction Company',
        address: '123 Test Street, Test City',
        phone: '+1234567890',
        email: 'test@construction.com',
        isActive: true
      });
      log.success(`Company created: ${company.name}`);
    } else {
      log.info('Company already exists');
    }
    testData.ids.companyId = company._id;
    
    // 2. Create Roles
    log.subsection('Creating Roles');
    const roles = ['admin', 'supervisor', 'worker', 'driver'];
    for (const roleName of roles) {
      let role = await Role.findOne({ name: roleName });
      if (!role) {
        role = await Role.create({
          name: roleName,
          description: `${roleName.charAt(0).toUpperCase() + roleName.slice(1)} role`,
          isActive: true
        });
        log.success(`Role created: ${roleName}`);
      } else {
        log.info(`Role already exists: ${roleName}`);
      }
      testData.ids[`${roleName}RoleId`] = role._id;
    }
    
    // 3. Create Permissions
    log.subsection('Creating Permissions');
    const permissions = [
      { name: 'view_dashboard', description: 'View dashboard' },
      { name: 'manage_workers', description: 'Manage workers' },
      { name: 'manage_tasks', description: 'Manage tasks' },
      { name: 'view_attendance', description: 'View attendance' },
      { name: 'approve_requests', description: 'Approve requests' }
    ];
    
    for (const perm of permissions) {
      let permission = await Permission.findOne({ name: perm.name });
      if (!permission) {
        permission = await Permission.create(perm);
        log.success(`Permission created: ${perm.name}`);
      } else {
        log.info(`Permission already exists: ${perm.name}`);
      }
    }
    
    // 4. Create Projects
    log.subsection('Creating Projects');
    const projects = [
      {
        name: 'Downtown Office Building',
        location: 'Downtown, Test City',
        address: '456 Downtown Ave',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: 'active',
        companyId: company._id,
        geofence: {
          type: 'circle',
          center: {
            latitude: 12.9716,
            longitude: 77.5946
          },
          radius: 200
        }
      },
      {
        name: 'Residential Complex Phase 2',
        location: 'Suburb Area, Test City',
        address: '789 Suburb Road',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2025-01-31'),
        status: 'active',
        companyId: company._id,
        geofence: {
          type: 'circle',
          center: {
            latitude: 12.9800,
            longitude: 77.6000
          },
          radius: 150
        }
      }
    ];
    
    for (const proj of projects) {
      let project = await Project.findOne({ name: proj.name, companyId: company._id });
      if (!project) {
        project = await Project.create(proj);
        log.success(`Project created: ${proj.name}`);
      } else {
        log.info(`Project already exists: ${proj.name}`);
      }
      
      if (proj.name.includes('Downtown')) {
        testData.ids.project1Id = project._id;
      } else {
        testData.ids.project2Id = project._id;
      }
    }
    
    // 5. Create Users (Admin, Supervisor, Workers)
    log.subsection('Creating Users');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = [
      {
        email: 'admin@test.com',
        password: hashedPassword,
        role: testData.ids.adminRoleId,
        companyId: company._id,
        isActive: true,
        type: 'admin'
      },
      {
        email: 'supervisor@test.com',
        password: hashedPassword,
        role: testData.ids.supervisorRoleId,
        companyId: company._id,
        currentProjectId: testData.ids.project1Id,
        isActive: true,
        type: 'supervisor'
      },
      {
        email: 'worker1@test.com',
        password: hashedPassword,
        role: testData.ids.workerRoleId,
        companyId: company._id,
        currentProjectId: testData.ids.project1Id,
        isActive: true,
        type: 'worker'
      },
      {
        email: 'worker2@test.com',
        password: hashedPassword,
        role: testData.ids.workerRoleId,
        companyId: company._id,
        currentProjectId: testData.ids.project2Id,
        isActive: true,
        type: 'worker'
      },
      {
        email: 'driver@test.com',
        password: hashedPassword,
        role: testData.ids.driverRoleId,
        companyId: company._id,
        isActive: true,
        type: 'driver'
      }
    ];
    
    for (const userData of users) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = await User.create(userData);
        log.success(`User created: ${userData.email}`);
      } else {
        log.info(`User already exists: ${userData.email}`);
      }
      testData.users[userData.type] = user;
      testData.ids[`${userData.type}UserId`] = user._id;
    }
    
    // 6. Create Employees
    log.subsection('Creating Employees');
    const employees = [
      {
        userId: testData.ids.supervisorUserId,
        companyId: company._id,
        firstName: 'John',
        lastName: 'Supervisor',
        email: 'supervisor@test.com',
        phone: '+1234567891',
        position: 'Site Supervisor',
        department: 'Construction',
        hireDate: new Date('2023-01-01'),
        status: 'active'
      },
      {
        userId: testData.ids.workerUserId,
        companyId: company._id,
        firstName: 'Mike',
        lastName: 'Worker',
        email: 'worker1@test.com',
        phone: '+1234567892',
        position: 'Construction Worker',
        department: 'Construction',
        hireDate: new Date('2023-06-01'),
        status: 'active'
      },
      {
        userId: testData.ids.workerUserId,
        companyId: company._id,
        firstName: 'Sarah',
        lastName: 'Worker',
        email: 'worker2@test.com',
        phone: '+1234567893',
        position: 'Construction Worker',
        department: 'Construction',
        hireDate: new Date('2023-07-01'),
        status: 'active'
      }
    ];
    
    for (const empData of employees) {
      let employee = await Employee.findOne({ email: empData.email });
      if (!employee) {
        employee = await Employee.create(empData);
        log.success(`Employee created: ${empData.firstName} ${empData.lastName}`);
      } else {
        log.info(`Employee already exists: ${empData.email}`);
      }
      
      if (empData.email === 'supervisor@test.com') {
        testData.ids.supervisorEmployeeId = employee._id;
      } else if (empData.email === 'worker1@test.com') {
        testData.ids.worker1EmployeeId = employee._id;
      } else if (empData.email === 'worker2@test.com') {
        testData.ids.worker2EmployeeId = employee._id;
      }
    }
    
    // 7. Create Tasks
    log.subsection('Creating Tasks');
    const tasks = [
      {
        name: 'Foundation Work',
        description: 'Complete foundation excavation and concrete pouring',
        projectId: testData.ids.project1Id,
        assignedTo: testData.ids.worker1EmployeeId,
        status: 'pending',
        priority: 'high',
        startDate: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        estimatedHours: 40
      },
      {
        name: 'Steel Framework',
        description: 'Install steel framework for first floor',
        projectId: testData.ids.project1Id,
        assignedTo: testData.ids.worker1EmployeeId,
        status: 'pending',
        priority: 'medium',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        estimatedHours: 60
      },
      {
        name: 'Electrical Wiring',
        description: 'Install electrical wiring for residential units',
        projectId: testData.ids.project2Id,
        assignedTo: testData.ids.worker2EmployeeId,
        status: 'pending',
        priority: 'high',
        startDate: new Date(),
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        estimatedHours: 50
      }
    ];
    
    for (const taskData of tasks) {
      let task = await Task.findOne({ name: taskData.name, projectId: taskData.projectId });
      if (!task) {
        task = await Task.create(taskData);
        log.success(`Task created: ${taskData.name}`);
      } else {
        log.info(`Task already exists: ${taskData.name}`);
      }
    }
    
    log.success('Sample data insertion completed!');
    
    // Close MongoDB connection
    await mongoose.connection.close();
    log.success('MongoDB connection closed');
    
  } catch (error) {
    log.error(`Error inserting sample data: ${error.message}`);
    console.error(error);
    await mongoose.connection.close();
  }
}

/**
 * Test all APIs
 */
async function testAllAPIs() {
  log.section('🧪 TESTING ALL APIs');
  
  // 1. Health Check
  log.subsection('Health Check');
  await testAPI('Health Check', 'GET', '/health');
  
  // 2. Authentication APIs
  log.subsection('Authentication APIs');
  
  // Login as admin
  const adminLogin = await testAPI(
    'Admin Login',
    'POST',
    '/auth/login',
    { email: 'admin@test.com', password: 'password123' }
  );
  if (adminLogin.success) {
    testData.tokens.admin = adminLogin.data.token;
  }
  
  // Login as supervisor
  const supervisorLogin = await testAPI(
    'Supervisor Login',
    'POST',
    '/auth/login',
    { email: 'supervisor@test.com', password: 'password123' }
  );
  if (supervisorLogin.success) {
    testData.tokens.supervisor = supervisorLogin.data.token;
  }
  
  // Login as worker
  const workerLogin = await testAPI(
    'Worker Login',
    'POST',
    '/auth/login',
    { email: 'worker1@test.com', password: 'password123' }
  );
  if (workerLogin.success) {
    testData.tokens.worker = workerLogin.data.token;
  }
  
  // 3. Project APIs
  log.subsection('Project APIs');
  await testAPI('Get All Projects', 'GET', '/projects', null, testData.tokens.admin);
  await testAPI('Get Project by ID', 'GET', `/projects/${testData.ids.project1Id}`, null, testData.tokens.admin);
  
  // 4. Worker APIs
  log.subsection('Worker APIs');
  await testAPI('Get Worker Profile', 'GET', '/worker/profile', null, testData.tokens.worker);
  await testAPI('Get Worker Tasks', 'GET', '/worker/tasks', null, testData.tokens.worker);
  await testAPI('Get Worker Tasks Today', 'GET', '/worker/tasks/today', null, testData.tokens.worker);
  
  // 5. Worker Attendance APIs
  log.subsection('Worker Attendance APIs');
  await testAPI('Get Today Attendance', 'GET', '/worker/attendance/today', null, testData.tokens.worker);
  
  // 6. Supervisor APIs
  log.subsection('Supervisor APIs');
  await testAPI('Get Supervisor Dashboard', 'GET', '/supervisor/dashboard', null, testData.tokens.supervisor);
  await testAPI('Get Supervisor Profile', 'GET', '/supervisor/profile', null, testData.tokens.supervisor);
  await testAPI('Get Team Members', 'GET', '/supervisor/team', null, testData.tokens.supervisor);
  await testAPI('Get Active Tasks', 'GET', '/supervisor/tasks/active', null, testData.tokens.supervisor);
  
  // 7. Supervisor Daily Progress APIs
  log.subsection('Supervisor Daily Progress APIs');
  await testAPI('Get Daily Targets', 'GET', '/supervisor/daily-targets', null, testData.tokens.supervisor);
  await testAPI('Get Daily Progress', 'GET', '/supervisor/daily-progress', null, testData.tokens.supervisor);
  
  // 8. Attendance Monitoring APIs
  log.subsection('Attendance Monitoring APIs');
  await testAPI('Get Attendance Summary', 'GET', '/supervisor/attendance/summary', null, testData.tokens.supervisor);
  await testAPI('Get Late/Absent Workers', 'GET', '/supervisor/attendance/late-absent', null, testData.tokens.supervisor);
  
  // 9. Notification APIs
  log.subsection('Notification APIs');
  await testAPI('Get Worker Notifications', 'GET', '/notifications', null, testData.tokens.worker);
  await testAPI('Get Supervisor Notifications', 'GET', '/supervisor/notifications', null, testData.tokens.supervisor);
  
  // 10. Request APIs
  log.subsection('Request APIs');
  await testAPI('Get Leave Requests', 'GET', '/leave-requests', null, testData.tokens.supervisor);
  await testAPI('Get Payment Requests', 'GET', '/payment-requests', null, testData.tokens.supervisor);
  await testAPI('Get Medical Claims', 'GET', '/medical-claims', null, testData.tokens.supervisor);
  await testAPI('Get Material Requests', 'GET', '/material-requests', null, testData.tokens.supervisor);
  
  // 11. Supervisor Materials & Tools APIs
  log.subsection('Supervisor Materials & Tools APIs');
  await testAPI('Get Project Materials', 'GET', '/project/materials', null, testData.tokens.supervisor);
  await testAPI('Get Project Tools', 'GET', '/project/tools', null, testData.tokens.supervisor);
  
  // 12. Pending Approvals APIs
  log.subsection('Pending Approvals APIs');
  await testAPI('Get Pending Approvals', 'GET', '/supervisor/pending-approvals', null, testData.tokens.supervisor);
}

/**
 * Print test summary
 */
function printTestSummary() {
  log.section('📊 TEST SUMMARY');
  
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
  
  if (testResults.errors.length > 0) {
    log.subsection('Failed Tests');
    testResults.errors.forEach((err, index) => {
      console.log(`${index + 1}. ${err.name}: ${err.error}`);
    });
  }
  
  log.section('✨ TEST EXECUTION COMPLETED');
}

/**
 * Main execution
 */
async function main() {
  console.log(`
${colors.cyan}╔════════════════════════════════════════════════════════════╗
║                                                            ║
║        🚀 COMPREHENSIVE API TESTING & DATA SETUP 🚀        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝${colors.reset}
  `);
  
  try {
    // Step 1: Insert sample data
    await insertSampleData();
    
    // Wait a bit for data to be ready
    log.info('Waiting 2 seconds for data to be ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Test all APIs
    await testAllAPIs();
    
    // Step 3: Print summary
    printTestSummary();
    
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    console.error(error);
  }
}

// Run the script
main();
