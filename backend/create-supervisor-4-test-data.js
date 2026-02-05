import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './src/modules/user/User.js';
import CompanyUser from './src/modules/companyUser/CompanyUser.js';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Task from './src/modules/task/Task.js';
import Attendance from './src/modules/attendance/Attendance.js';
import Role from './src/modules/role/Role.js';
import Company from './src/modules/company/Company.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('🔍 Database name:', mongoose.connection.name);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Get next available ID for a collection
const getNextId = async (Model) => {
  const lastRecord = await Model.findOne().sort({ id: -1 });
  const nextId = lastRecord ? lastRecord.id + 1 : 1;
  
  // Double-check that this ID doesn't exist
  const existing = await Model.findOne({ id: nextId });
  if (existing) {
    // If it exists, find the highest ID and add 1
    const allRecords = await Model.find({}, { id: 1 }).sort({ id: -1 }).limit(10);
    const maxId = Math.max(...allRecords.map(r => r.id), 0);
    return maxId + 1;
  }
  
  return nextId;
};

const createSupervisor4TestData = async () => {
  try {
    console.log('🏗️ Creating test data for Supervisor ID 4...\n');

    // 1. Ensure Company exists
    let company = await Company.findOne({ id: 1 });
    if (!company) {
      company = new Company({
        id: 1,
        name: 'Harrison Lifting & Logistics Pte Ltd',
        tenantCode: 'HARRISON001',
        isActive: true
      });
      await company.save();
      console.log('✅ Created Harrison Company');
    } else {
      console.log('✅ Company already exists:', company.name);
    }

    // 2. Ensure Roles exist
    const roles = [
      { id: 1, name: 'Worker', level: 1 },
      { id: 2, name: 'Supervisor', level: 2 },
      { id: 3, name: 'Manager', level: 3 }
    ];

    for (const roleData of roles) {
      let role = await Role.findOne({ id: roleData.id });
      if (!role) {
        role = new Role({
          id: roleData.id,
          name: roleData.name,
          level: roleData.level,
          isSystemRole: true
        });
        await role.save();
        console.log(`✅ Created ${roleData.name} role`);
      } else {
        console.log(`✅ ${roleData.name} role already exists`);
      }
    }

    // 3. Create Supervisor User (Kawaja)
    const supervisorEmail = 'kawaja@harrison.com';
    let supervisorUser = await User.findOne({ email: supervisorEmail });
    
    if (!supervisorUser) {
      const userId = await getNextId(User);
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      supervisorUser = new User({
        id: userId,
        email: supervisorEmail,
        passwordHash: hashedPassword,
        isActive: true
      });
      await supervisorUser.save();
      console.log(`✅ Created supervisor user: ${userId}, ${supervisorEmail}`);
    } else {
      console.log(`✅ Supervisor user already exists: ${supervisorUser.id}, ${supervisorUser.email}`);
    }

    // 4. Create Supervisor CompanyUser
    let supervisorCompanyUser = await CompanyUser.findOne({ userId: supervisorUser.id });
    if (!supervisorCompanyUser) {
      const companyUserId = await getNextId(CompanyUser);
      supervisorCompanyUser = new CompanyUser({
        id: companyUserId,
        userId: supervisorUser.id,
        companyId: 1,
        roleId: 2, // Supervisor role
        role: 'supervisor',
        isActive: true,
        status: 'ACTIVE'
      });
      await supervisorCompanyUser.save();
      console.log(`✅ Created supervisor CompanyUser: ${companyUserId}`);
    } else {
      console.log(`✅ Supervisor CompanyUser already exists: ${supervisorCompanyUser.id}`);
    }

    // 5. Create/Update Supervisor Employee (ID 4)
    let supervisorEmployee = await Employee.findOne({ id: 4 });
    if (!supervisorEmployee) {
      supervisorEmployee = new Employee({
        id: 4,
        fullName: 'Kawaja',
        email: supervisorEmail,
        phone: '+65-9876-5432',
        role: 'Supervisor',
        userId: supervisorUser.id,
        companyId: 1,
        status: 'ACTIVE',
        position: 'Site Supervisor',
        department: 'Operations'
      });
      await supervisorEmployee.save();
      console.log(`✅ Created supervisor employee: ${supervisorEmployee.fullName}`);
    } else {
      // Update existing supervisor employee
      supervisorEmployee.userId = supervisorUser.id;
      supervisorEmployee.fullName = 'Kawaja';
      supervisorEmployee.email = supervisorEmail;
      supervisorEmployee.role = 'Supervisor';
      await supervisorEmployee.save();
      console.log(`✅ Updated supervisor employee: ${supervisorEmployee.fullName}`);
    }

    // 6. Create Projects for Supervisor 4
    const projects = [
      {
        id: 101,
        projectName: 'High-rise Apartment',
        location: 'Orchard Road, Singapore',
        supervisorId: 4,
        latitude: 1.3048,
        longitude: 103.8318,
        geofenceRadius: 100,
        status: 'ACTIVE'
      },
      {
        id: 102,
        projectName: 'Commercial Plaza',
        location: 'Marina Bay, Singapore',
        supervisorId: 4,
        latitude: 1.2834,
        longitude: 103.8607,
        geofenceRadius: 150,
        status: 'ACTIVE'
      }
    ];

    for (const projectData of projects) {
      let project = await Project.findOne({ id: projectData.id });
      if (!project) {
        project = new Project(projectData);
        await project.save();
        console.log(`✅ Created project: ${projectData.projectName}`);
      } else {
        // Update existing project
        Object.assign(project, projectData);
        await project.save();
        console.log(`✅ Updated project: ${projectData.projectName}`);
      }
    }

    // 7. Create Worker Employees
    const workers = [
      {
        id: 201,
        fullName: 'Ahmad Rahman',
        email: 'ahmad@harrison.com',
        phone: '+65-8123-4567',
        role: 'Construction Worker',
        position: 'Senior Worker',
        department: 'Construction'
      },
      {
        id: 202,
        fullName: 'Raj Kumar',
        email: 'raj@harrison.com',
        phone: '+65-8234-5678',
        role: 'Construction Worker',
        position: 'Equipment Operator',
        department: 'Construction'
      },
      {
        id: 203,
        fullName: 'Chen Wei Ming',
        email: 'chen@harrison.com',
        phone: '+65-8345-6789',
        role: 'Construction Worker',
        position: 'Safety Officer',
        department: 'Safety'
      }
    ];

    for (const workerData of workers) {
      // Create user for worker
      let workerUser = await User.findOne({ email: workerData.email });
      if (!workerUser) {
        const userId = await getNextId(User);
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        workerUser = new User({
          id: userId,
          email: workerData.email,
          passwordHash: hashedPassword,
          isActive: true
        });
        await workerUser.save();
        console.log(`✅ Created worker user: ${workerData.email}`);
      }

      // Create CompanyUser for worker
      let workerCompanyUser = await CompanyUser.findOne({ userId: workerUser.id });
      if (!workerCompanyUser) {
        const companyUserId = await getNextId(CompanyUser);
        workerCompanyUser = new CompanyUser({
          id: companyUserId,
          userId: workerUser.id,
          companyId: 1,
          roleId: 1, // Worker role
          role: 'worker',
          isActive: true,
          status: 'ACTIVE'
        });
        await workerCompanyUser.save();
        console.log(`✅ Created worker CompanyUser for: ${workerData.fullName}`);
      }

      // Create/Update Employee
      let employee = await Employee.findOne({ id: workerData.id });
      if (!employee) {
        employee = new Employee({
          ...workerData,
          userId: workerUser.id,
          companyId: 1,
          status: 'ACTIVE'
        });
        await employee.save();
        console.log(`✅ Created worker employee: ${workerData.fullName}`);
      } else {
        // Update existing employee
        Object.assign(employee, {
          ...workerData,
          userId: workerUser.id,
          companyId: 1,
          status: 'ACTIVE'
        });
        await employee.save();
        console.log(`✅ Updated worker employee: ${workerData.fullName}`);
      }
    }

    // 8. Create Tasks for Projects
    const tasks = [
      // High-rise Apartment tasks
      { id: 301, taskName: 'Foundation Work', projectId: 101, description: 'Excavation and foundation laying' },
      { id: 302, taskName: 'Steel Framework', projectId: 101, description: 'Steel structure assembly' },
      { id: 303, taskName: 'Concrete Pouring', projectId: 101, description: 'Floor concrete pouring' },
      
      // Commercial Plaza tasks
      { id: 304, taskName: 'Site Preparation', projectId: 102, description: 'Site clearing and preparation' },
      { id: 305, taskName: 'Electrical Installation', projectId: 102, description: 'Main electrical systems' },
      { id: 306, taskName: 'Plumbing Work', projectId: 102, description: 'Water and drainage systems' }
    ];

    for (const taskData of tasks) {
      let task = await Task.findOne({ id: taskData.id });
      if (!task) {
        task = new Task(taskData);
        await task.save();
        console.log(`✅ Created task: ${taskData.taskName}`);
      } else {
        Object.assign(task, taskData);
        await task.save();
        console.log(`✅ Updated task: ${taskData.taskName}`);
      }
    }

    // 9. Create Worker Task Assignments for Today
    const today = new Date().toISOString().split('T')[0];
    const assignments = [
      // High-rise Apartment assignments
      { employeeId: 201, projectId: 101, taskId: 301, date: today, status: 'in_progress', supervisorId: 4 },
      { employeeId: 202, projectId: 101, taskId: 302, date: today, status: 'queued', supervisorId: 4 },
      
      // Commercial Plaza assignments
      { employeeId: 203, projectId: 102, taskId: 304, date: today, status: 'completed', supervisorId: 4 }
    ];

    for (const assignmentData of assignments) {
      // Check if assignment already exists
      let assignment = await WorkerTaskAssignment.findOne({
        employeeId: assignmentData.employeeId,
        projectId: assignmentData.projectId,
        taskId: assignmentData.taskId,
        date: assignmentData.date
      });

      if (!assignment) {
        const assignmentId = await getNextId(WorkerTaskAssignment);
        assignment = new WorkerTaskAssignment({
          id: assignmentId,
          ...assignmentData,
          sequence: 1,
          createdAt: new Date()
        });
        await assignment.save();
        console.log(`✅ Created task assignment: Employee ${assignmentData.employeeId} -> Task ${assignmentData.taskId}`);
      } else {
        Object.assign(assignment, assignmentData);
        await assignment.save();
        console.log(`✅ Updated task assignment: Employee ${assignmentData.employeeId} -> Task ${assignmentData.taskId}`);
      }
    }

    // 10. Create Attendance Records for Today
    const attendanceRecords = [
      // Present workers
      {
        employeeId: 201,
        projectId: 101,
        date: today,
        checkIn: new Date(new Date().setHours(8, 15, 0, 0)), // 8:15 AM (late)
        checkOut: null,
        insideGeofenceAtCheckin: true,
        pendingCheckout: true
      },
      {
        employeeId: 203,
        projectId: 102,
        date: today,
        checkIn: new Date(new Date().setHours(7, 45, 0, 0)), // 7:45 AM (on time)
        checkOut: new Date(new Date().setHours(17, 30, 0, 0)), // 5:30 PM
        insideGeofenceAtCheckin: true,
        insideGeofenceAtCheckout: true,
        pendingCheckout: false
      }
      // Employee 202 will be absent (no attendance record)
    ];

    for (const attendanceData of attendanceRecords) {
      let attendance = await Attendance.findOne({
        employeeId: attendanceData.employeeId,
        projectId: attendanceData.projectId,
        date: {
          $gte: new Date(today),
          $lt: new Date(new Date(today).setDate(new Date(today).getDate() + 1))
        }
      });

      if (!attendance) {
        attendance = new Attendance(attendanceData);
        await attendance.save();
        console.log(`✅ Created attendance: Employee ${attendanceData.employeeId} - ${attendanceData.checkOut ? 'Present' : 'Checked In'}`);
      } else {
        Object.assign(attendance, attendanceData);
        await attendance.save();
        console.log(`✅ Updated attendance: Employee ${attendanceData.employeeId} - ${attendanceData.checkOut ? 'Present' : 'Checked In'}`);
      }
    }

    console.log('\n🎉 Test data creation completed!');
    console.log('📊 Summary for Supervisor ID 4 (Kawaja):');
    console.log('   - 2 Projects: High-rise Apartment, Commercial Plaza');
    console.log('   - 3 Workers: Ahmad (Late), Raj (Absent), Chen (Present)');
    console.log('   - 6 Tasks assigned across projects');
    console.log('   - Today\'s attendance: 1 Present, 1 Late, 1 Absent');
    console.log('\n📋 Login credentials for supervisor:');
    console.log('   Email: kawaja@harrison.com');
    console.log('   Password: password123');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await createSupervisor4TestData();
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Script execution error:', error);
  process.exit(1);
});