/**
 * Complete Test Data Setup for Supervisor ID 4
 * Creates: Supervisor, Projects, Workers, Task Assignments, and Attendance Records
 * Run: node create-supervisor-4-complete-test-data.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Import models
import User from './src/modules/user/User.js';
import CompanyUser from './src/modules/companyUser/CompanyUser.js';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import Task from './src/modules/task/Task.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Attendance from './src/modules/attendance/Attendance.js';

async function createCompleteTestData() {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI, { 
      dbName: process.env.DB_NAME || 'erp'
    });
    console.log('✅ Connected to MongoDB\n');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // ========================================
    // STEP 1: Create/Verify Supervisor User
    // ========================================
    console.log('📋 STEP 1: Setting up Supervisor User...');
    
    let supervisorUser = await User.findOne({ email: 'supervisor@gmail.com' });
    if (!supervisorUser) {
      const lastUser = await User.findOne().sort({ id: -1 });
      const nextUserId = lastUser ? lastUser.id + 1 : 1;
      
      supervisorUser = await User.create({
        id: nextUserId,
        email: 'supervisor@gmail.com',
        password: await bcrypt.hash('password123', 10),
        role: 'supervisor',
        createdAt: new Date()
      });
      console.log(`✅ Created User: ${supervisorUser.email} (ID: ${supervisorUser.id})`);
    } else {
      console.log(`✅ Found existing User: ${supervisorUser.email} (ID: ${supervisorUser.id})`);
    }

    // Create CompanyUser
    let companyUser = await CompanyUser.findOne({ email: 'supervisor@gmail.com' });
    if (!companyUser) {
      const lastCompanyUser = await CompanyUser.findOne().sort({ id: -1 });
      const nextCompanyUserId = lastCompanyUser ? lastCompanyUser.id + 1 : 1;
      
      companyUser = await CompanyUser.create({
        id: nextCompanyUserId,
        userId: supervisorUser.id,
        email: 'supervisor@gmail.com',
        role: 'supervisor',
        roleId: 2, // Supervisor role
        companyId: 1,
        createdAt: new Date()
      });
      console.log(`✅ Created CompanyUser: ${companyUser.email} (ID: ${companyUser.id})`);
    } else {
      console.log(`✅ Found existing CompanyUser: ${companyUser.email} (ID: ${companyUser.id})`);
    }

    // Create Employee record for supervisor
    let supervisorEmployee = await Employee.findOne({ userId: supervisorUser.id });
    if (!supervisorEmployee) {
      const lastEmployee = await Employee.findOne().sort({ id: -1 });
      const nextEmployeeId = lastEmployee ? lastEmployee.id + 1 : 4;
      
      supervisorEmployee = await Employee.create({
        id: nextEmployeeId,
        userId: supervisorUser.id,
        fullName: 'Supervisor Four',
        email: 'supervisor@gmail.com',
        phone: '+1234567890',
        role: 'supervisor',
        status: 'ACTIVE',
        companyId: 1,
        createdAt: new Date()
      });
      console.log(`✅ Created Employee: ${supervisorEmployee.fullName} (ID: ${supervisorEmployee.id})`);
    } else {
      console.log(`✅ Found existing Employee: ${supervisorEmployee.fullName} (ID: ${supervisorEmployee.id})`);
    }

    const supervisorEmployeeId = supervisorEmployee.id;
    console.log(`\n🎯 Supervisor Employee ID: ${supervisorEmployeeId}\n`);

    // ========================================
    // STEP 2: Create Projects
    // ========================================
    console.log('📋 STEP 2: Creating Projects...');
    
    const projectsData = [
      {
        id: 1,
        projectName: 'Downtown Construction Site',
        location: 'Downtown, City Center',
        status: 'active',
        latitude: 12.9716,
        longitude: 77.5946,
        geofenceRadius: 100
      },
      {
        id: 2,
        projectName: 'Bangalore Tech Park',
        location: 'Whitefield, Bangalore',
        status: 'active',
        latitude: 12.9698,
        longitude: 77.7500,
        geofenceRadius: 150
      }
    ];

    const createdProjects = [];
    for (const projectData of projectsData) {
      let project = await Project.findOne({ id: projectData.id });
      if (!project) {
        project = await Project.create({
          ...projectData,
          supervisorId: supervisorEmployeeId,
          companyId: 1,
          startDate: new Date(),
          createdAt: new Date()
        });
        console.log(`✅ Created Project: ${project.projectName} (ID: ${project.id})`);
      } else {
        // Update supervisorId if project exists
        project.supervisorId = supervisorEmployeeId;
        await project.save();
        console.log(`✅ Updated Project: ${project.projectName} (ID: ${project.id})`);
      }
      createdProjects.push(project);
    }

    // ========================================
    // STEP 3: Create Tasks for Projects
    // ========================================
    console.log('\n📋 STEP 3: Creating Tasks...');
    
    const tasksData = [
      // Project 1 tasks
      { id: 1, projectId: 1, taskName: 'Concrete Pouring', description: 'Pour concrete for foundation' },
      { id: 2, projectId: 1, taskName: 'Steel Fixing', description: 'Install steel reinforcement' },
      { id: 3, projectId: 1, taskName: 'Bricklaying', description: 'Build walls with bricks' },
      { id: 4, projectId: 1, taskName: 'Plastering', description: 'Apply plaster to walls' },
      // Project 2 tasks
      { id: 5, projectId: 2, taskName: 'Excavation', description: 'Excavate foundation area' },
      { id: 6, projectId: 2, taskName: 'Formwork', description: 'Install formwork for concrete' },
      { id: 7, projectId: 2, taskName: 'Electrical Wiring', description: 'Install electrical conduits' },
      { id: 8, projectId: 2, taskName: 'Plumbing', description: 'Install plumbing pipes' }
    ];

    for (const taskData of tasksData) {
      let task = await Task.findOne({ id: taskData.id });
      if (!task) {
        task = await Task.create({
          ...taskData,
          status: 'pending',
          priority: 'medium',
          createdAt: new Date()
        });
        console.log(`✅ Created Task: ${task.taskName} (ID: ${task.id}) for Project ${task.projectId}`);
      } else {
        console.log(`✅ Found existing Task: ${task.taskName} (ID: ${task.id})`);
      }
    }

    // ========================================
    // STEP 4: Create Worker Employees
    // ========================================
    console.log('\n📋 STEP 4: Creating Worker Employees...');
    
    const workersData = [
      { id: 101, fullName: 'John Smith', email: 'john.smith@example.com', phone: '+1234567101', projectId: 1 },
      { id: 102, fullName: 'Jane Doe', email: 'jane.doe@example.com', phone: '+1234567102', projectId: 1 },
      { id: 103, fullName: 'Mike Johnson', email: 'mike.johnson@example.com', phone: '+1234567103', projectId: 1 },
      { id: 104, fullName: 'Sarah Williams', email: 'sarah.williams@example.com', phone: '+1234567104', projectId: 1 },
      { id: 105, fullName: 'Robert Brown', email: 'robert.brown@example.com', phone: '+1234567105', projectId: 2 },
      { id: 106, fullName: 'Emily Davis', email: 'emily.davis@example.com', phone: '+1234567106', projectId: 2 },
      { id: 107, fullName: 'David Wilson', email: 'david.wilson@example.com', phone: '+1234567107', projectId: 2 },
      { id: 108, fullName: 'Lisa Anderson', email: 'lisa.anderson@example.com', phone: '+1234567108', projectId: 2 }
    ];

    const createdWorkers = [];
    for (const workerData of workersData) {
      let worker = await Employee.findOne({ id: workerData.id });
      if (!worker) {
        worker = await Employee.create({
          id: workerData.id,
          fullName: workerData.fullName,
          email: workerData.email,
          phone: workerData.phone,
          role: 'worker',
          status: 'ACTIVE',
          companyId: 1,
          createdAt: new Date()
        });
        console.log(`✅ Created Worker: ${worker.fullName} (ID: ${worker.id})`);
      } else {
        console.log(`✅ Found existing Worker: ${worker.fullName} (ID: ${worker.id})`);
      }
      createdWorkers.push({ ...worker.toObject(), projectId: workerData.projectId });
    }

    // ========================================
    // STEP 5: Create Task Assignments
    // ========================================
    console.log('\n📋 STEP 5: Creating Task Assignments for Today...');
    
    // Clear existing assignments for today
    await WorkerTaskAssignment.deleteMany({ date: todayStr });
    console.log('🗑️  Cleared existing task assignments for today');

    const assignments = [
      // Project 1 assignments
      { employeeId: 101, projectId: 1, taskId: 1, sequence: 1 },
      { employeeId: 101, projectId: 1, taskId: 2, sequence: 2 },
      { employeeId: 102, projectId: 1, taskId: 3, sequence: 1 },
      { employeeId: 103, projectId: 1, taskId: 4, sequence: 1 },
      { employeeId: 104, projectId: 1, taskId: 1, sequence: 1 },
      // Project 2 assignments
      { employeeId: 105, projectId: 2, taskId: 5, sequence: 1 },
      { employeeId: 106, projectId: 2, taskId: 6, sequence: 1 },
      { employeeId: 107, projectId: 2, taskId: 7, sequence: 1 },
      { employeeId: 108, projectId: 2, taskId: 8, sequence: 1 }
    ];

    const lastAssignment = await WorkerTaskAssignment.findOne().sort({ id: -1 });
    let nextAssignmentId = lastAssignment ? lastAssignment.id + 1 : 1;

    for (const assignment of assignments) {
      const task = await Task.findOne({ id: assignment.taskId });
      await WorkerTaskAssignment.create({
        id: nextAssignmentId++,
        employeeId: assignment.employeeId,
        projectId: assignment.projectId,
        taskId: assignment.taskId,
        taskName: task.taskName,
        date: todayStr,
        status: 'queued',
        sequence: assignment.sequence,
        supervisorId: supervisorEmployeeId,
        createdAt: new Date()
      });
      console.log(`✅ Assigned Task ${assignment.taskId} to Worker ${assignment.employeeId} for Project ${assignment.projectId}`);
    }

    // ========================================
    // STEP 6: Create Attendance Records
    // ========================================
    console.log('\n📋 STEP 6: Creating Attendance Records for Today...');
    
    // Clear existing attendance for today
    await Attendance.deleteMany({ 
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });
    console.log('🗑️  Cleared existing attendance records for today');

    const attendanceData = [
      // Project 1 - On time workers
      { 
        employeeId: 101, 
        projectId: 1, 
        checkIn: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8:00 AM
        checkOut: null,
        insideGeofenceAtCheckin: true,
        status: 'present'
      },
      { 
        employeeId: 102, 
        projectId: 1, 
        checkIn: new Date(today.getTime() + 7.75 * 60 * 60 * 1000), // 7:45 AM
        checkOut: new Date(today.getTime() + 17 * 60 * 60 * 1000), // 5:00 PM
        insideGeofenceAtCheckin: true,
        status: 'present'
      },
      // Project 1 - Late worker
      { 
        employeeId: 103, 
        projectId: 1, 
        checkIn: new Date(today.getTime() + 9.5 * 60 * 60 * 1000), // 9:30 AM (Late)
        checkOut: null,
        insideGeofenceAtCheckin: true,
        status: 'present'
      },
      // Project 1 - Absent worker (104 - no record)
      
      // Project 2 - On time workers
      { 
        employeeId: 105, 
        projectId: 2, 
        checkIn: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8:00 AM
        checkOut: null,
        insideGeofenceAtCheckin: true,
        status: 'present'
      },
      { 
        employeeId: 106, 
        projectId: 2, 
        checkIn: new Date(today.getTime() + 8.25 * 60 * 60 * 1000), // 8:15 AM
        checkOut: null,
        insideGeofenceAtCheckin: true,
        status: 'present'
      },
      // Project 2 - Late worker
      { 
        employeeId: 107, 
        projectId: 2, 
        checkIn: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9:00 AM (Late)
        checkOut: null,
        insideGeofenceAtCheckin: false, // Geofence violation
        status: 'present'
      }
      // Project 2 - Absent worker (108 - no record)
    ];

    const lastAttendance = await Attendance.findOne().sort({ id: -1 });
    let nextAttendanceId = lastAttendance ? lastAttendance.id + 1 : 1;

    for (const attData of attendanceData) {
      await Attendance.create({
        id: nextAttendanceId++,
        employeeId: attData.employeeId,
        projectId: attData.projectId,
        date: today,
        checkIn: attData.checkIn,
        checkOut: attData.checkOut,
        insideGeofenceAtCheckin: attData.insideGeofenceAtCheckin,
        status: attData.status,
        createdAt: new Date()
      });
      const worker = createdWorkers.find(w => w.id === attData.employeeId);
      const checkInTime = attData.checkIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      console.log(`✅ Created Attendance: ${worker.fullName} - Project ${attData.projectId} - Check-in: ${checkInTime}`);
    }

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST DATA CREATION COMPLETE!');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   - Supervisor Employee ID: ${supervisorEmployeeId}`);
    console.log(`   - Projects Created: ${createdProjects.length}`);
    console.log(`   - Workers Created: ${createdWorkers.length}`);
    console.log(`   - Task Assignments: ${assignments.length}`);
    console.log(`   - Attendance Records: ${attendanceData.length}`);
    
    console.log(`\n🎯 Test URLs for Postman:\n`);
    
    console.log(`1️⃣  Workers Assigned (Project 1):`);
    console.log(`   GET http://192.168.1.8:5002/api/supervisor/workers-assigned?projectId=1`);
    console.log(`   Expected: 4 workers (2 present, 1 late, 1 absent)\n`);
    
    console.log(`2️⃣  Workers Assigned (Project 2):`);
    console.log(`   GET http://192.168.1.8:5002/api/supervisor/workers-assigned?projectId=2`);
    console.log(`   Expected: 4 workers (2 present, 1 late, 1 absent)\n`);
    
    console.log(`3️⃣  Late/Absent Workers (Project 1):`);
    console.log(`   GET http://192.168.1.8:5002/api/supervisor/late-absent-workers?projectId=1`);
    console.log(`   Expected: 1 late (ID: 103), 1 absent (ID: 104)\n`);
    
    console.log(`4️⃣  Late/Absent Workers (Project 2):`);
    console.log(`   GET http://192.168.1.8:5002/api/supervisor/late-absent-workers?projectId=2`);
    console.log(`   Expected: 1 late (ID: 107), 1 absent (ID: 108)\n`);
    
    console.log(`5️⃣  Geofence Violations (Project 2):`);
    console.log(`   GET http://192.168.1.8:5002/api/supervisor/geofence-violations?projectId=2`);
    console.log(`   Expected: Currently returns empty (feature ready for implementation)\n`);
    
    console.log(`6️⃣  Manual Attendance Override:`);
    console.log(`   POST http://192.168.1.8:5002/api/supervisor/manual-attendance-override`);
    console.log(`   Body: {`);
    console.log(`     "supervisorId": ${supervisorEmployeeId},`);
    console.log(`     "workerId": 104,`);
    console.log(`     "projectId": 1,`);
    console.log(`     "date": "${todayStr}",`);
    console.log(`     "checkInTime": "08:00",`);
    console.log(`     "checkOutTime": "17:00",`);
    console.log(`     "reason": "Network issue",`);
    console.log(`     "overrideType": "full_day"`);
    console.log(`   }\n`);

    console.log(`\n📝 Login Credentials:`);
    console.log(`   Email: supervisor@gmail.com`);
    console.log(`   Password: password123`);
    console.log(`   POST http://192.168.1.8:5002/api/auth/login\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

createCompleteTestData();
