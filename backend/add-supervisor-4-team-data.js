import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Task from './src/modules/task/Task.js';
import Attendance from './src/modules/attendance/Attendance.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Get next available ID for a collection
const getNextId = async (Model) => {
  const lastRecord = await Model.findOne().sort({ id: -1 });
  return lastRecord ? lastRecord.id + 1 : 1;
};

const addSupervisor4TeamData = async () => {
  try {
    console.log('🏗️ Adding team data for Supervisor ID 4...\n');

    // 1. Check if supervisor employee exists, if not create one
    let supervisorEmployee = await Employee.findOne({ id: 4 });
    if (!supervisorEmployee) {
      supervisorEmployee = new Employee({
        id: 4,
        fullName: 'Kawaja',
        email: 'supervisor@gmail.com',
        phone: '+65-9876-5432',
        role: 'Supervisor',
        userId: 4, // Links to existing supervisor user
        companyId: 1,
        status: 'ACTIVE',
        position: 'Site Supervisor',
        department: 'Operations',
        employeeCode: 'SUP004'
      });
      await supervisorEmployee.save();
      console.log('✅ Created supervisor employee: Kawaja');
    } else {
      console.log('✅ Supervisor employee already exists:', supervisorEmployee.fullName);
    }

    // 2. Create Projects for Supervisor 4
    const projects = [
      {
        id: 101,
        projectCode: 'HRA-101',
        projectName: 'High-rise Apartment',
        address: 'Orchard Road, Singapore',
        supervisorId: 4,
        latitude: 1.3048,
        longitude: 103.8318,
        geofenceRadius: 100,
        status: 'Ongoing',
        geofence: {
          center: {
            latitude: 1.3048,
            longitude: 103.8318
          },
          radius: 100,
          strictMode: true,
          allowedVariance: 10
        }
      },
      {
        id: 102,
        projectCode: 'CP-102',
        projectName: 'Commercial Plaza',
        address: 'Marina Bay, Singapore',
        supervisorId: 4,
        latitude: 1.2834,
        longitude: 103.8607,
        geofenceRadius: 150,
        status: 'Ongoing',
        geofence: {
          center: {
            latitude: 1.2834,
            longitude: 103.8607
          },
          radius: 150,
          strictMode: true,
          allowedVariance: 10
        }
      }
    ];

    for (const projectData of projects) {
      let project = await Project.findOne({ id: projectData.id });
      if (!project) {
        project = new Project(projectData);
        await project.save();
        console.log(`✅ Created project: ${projectData.projectName}`);
      } else {
        // Update supervisor assignment
        project.supervisorId = 4;
        await project.save();
        console.log(`✅ Updated project supervisor: ${projectData.projectName}`);
      }
    }

    // 3. Create Worker Employees
    const workers = [
      {
        id: 201,
        fullName: 'Ahmad Rahman',
        email: 'ahmad@harrison.com',
        phone: '+65-8123-4567',
        role: 'Construction Worker',
        position: 'Senior Worker',
        department: 'Construction',
        employeeCode: 'WRK201',
        companyId: 1,
        status: 'ACTIVE'
      },
      {
        id: 202,
        fullName: 'Raj Kumar',
        email: 'raj@harrison.com',
        phone: '+65-8234-5678',
        role: 'Construction Worker',
        position: 'Equipment Operator',
        department: 'Construction',
        employeeCode: 'WRK202',
        companyId: 1,
        status: 'ACTIVE'
      },
      {
        id: 203,
        fullName: 'Chen Wei Ming',
        email: 'chen@harrison.com',
        phone: '+65-8345-6789',
        role: 'Construction Worker',
        position: 'Safety Officer',
        department: 'Safety',
        employeeCode: 'WRK203',
        companyId: 1,
        status: 'ACTIVE'
      }
    ];

    for (const workerData of workers) {
      let employee = await Employee.findOne({ id: workerData.id });
      if (!employee) {
        employee = new Employee(workerData);
        await employee.save();
        console.log(`✅ Created worker: ${workerData.fullName}`);
      } else {
        Object.assign(employee, workerData);
        await employee.save();
        console.log(`✅ Updated worker: ${workerData.fullName}`);
      }
    }

    // 4. Create Tasks for Projects
    const tasks = [
      // High-rise Apartment tasks
      { 
        id: 301, 
        taskName: 'Foundation Work', 
        projectId: 101, 
        companyId: 1,
        taskType: 'WORK',
        description: 'Excavation and foundation laying',
        status: 'PLANNED'
      },
      { 
        id: 302, 
        taskName: 'Steel Framework', 
        projectId: 101, 
        companyId: 1,
        taskType: 'WORK',
        description: 'Steel structure assembly',
        status: 'PLANNED'
      },
      { 
        id: 303, 
        taskName: 'Concrete Pouring', 
        projectId: 101, 
        companyId: 1,
        taskType: 'WORK',
        description: 'Floor concrete pouring',
        status: 'PLANNED'
      },
      
      // Commercial Plaza tasks
      { 
        id: 304, 
        taskName: 'Site Preparation', 
        projectId: 102, 
        companyId: 1,
        taskType: 'WORK',
        description: 'Site clearing and preparation',
        status: 'PLANNED'
      },
      { 
        id: 305, 
        taskName: 'Electrical Installation', 
        projectId: 102, 
        companyId: 1,
        taskType: 'WORK',
        description: 'Main electrical systems',
        status: 'PLANNED'
      },
      { 
        id: 306, 
        taskName: 'Plumbing Work', 
        projectId: 102, 
        companyId: 1,
        taskType: 'WORK',
        description: 'Water and drainage systems',
        status: 'PLANNED'
      }
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

    // 5. Create Worker Task Assignments for Today
    const today = new Date().toISOString().split('T')[0];
    const assignments = [
      // High-rise Apartment assignments
      { employeeId: 201, projectId: 101, taskId: 301, date: today, status: 'in_progress', supervisorId: 4, sequence: 1 },
      { employeeId: 202, projectId: 101, taskId: 302, date: today, status: 'queued', supervisorId: 4, sequence: 1 },
      
      // Commercial Plaza assignments
      { employeeId: 203, projectId: 102, taskId: 304, date: today, status: 'completed', supervisorId: 4, sequence: 1 }
    ];

    for (const assignmentData of assignments) {
      // Remove existing assignments for today to avoid duplicates
      await WorkerTaskAssignment.deleteMany({
        employeeId: assignmentData.employeeId,
        projectId: assignmentData.projectId,
        date: assignmentData.date
      });

      const assignmentId = await getNextId(WorkerTaskAssignment);
      const assignment = new WorkerTaskAssignment({
        id: assignmentId,
        ...assignmentData,
        createdAt: new Date()
      });
      await assignment.save();
      console.log(`✅ Created assignment: Employee ${assignmentData.employeeId} -> Task ${assignmentData.taskId}`);
    }

    // 6. Create Attendance Records for Today
    const attendanceRecords = [
      // Present workers
      {
        employeeId: 201,
        projectId: 101,
        date: new Date(today),
        checkIn: new Date(new Date().setHours(8, 15, 0, 0)), // 8:15 AM (late)
        checkOut: null,
        insideGeofenceAtCheckin: true,
        pendingCheckout: true
      },
      {
        employeeId: 203,
        projectId: 102,
        date: new Date(today),
        checkIn: new Date(new Date().setHours(7, 45, 0, 0)), // 7:45 AM (on time)
        checkOut: new Date(new Date().setHours(17, 30, 0, 0)), // 5:30 PM
        insideGeofenceAtCheckin: true,
        insideGeofenceAtCheckout: true,
        pendingCheckout: false
      }
      // Employee 202 will be absent (no attendance record)
    ];

    for (const attendanceData of attendanceRecords) {
      // Remove existing attendance for today
      await Attendance.deleteMany({
        employeeId: attendanceData.employeeId,
        projectId: attendanceData.projectId,
        date: {
          $gte: new Date(today),
          $lt: new Date(new Date(today).setDate(new Date(today).getDate() + 1))
        }
      });

      const attendance = new Attendance(attendanceData);
      await attendance.save();
      console.log(`✅ Created attendance: Employee ${attendanceData.employeeId} - ${attendanceData.checkOut ? 'Present' : 'Checked In'}`);
    }

    console.log('\n🎉 Team data creation completed!');
    console.log('📊 Summary for Supervisor ID 4:');
    console.log('   - 2 Projects: High-rise Apartment, Commercial Plaza');
    console.log('   - 3 Workers: Ahmad (Late), Raj (Absent), Chen (Present)');
    console.log('   - 6 Tasks assigned across projects');
    console.log('   - Today\'s attendance: 1 Present, 1 Late, 1 Absent');
    console.log('\n📱 Dashboard should now show:');
    console.log('   - Total Team: 3');
    console.log('   - Present: 1');
    console.log('   - Absent: 1');
    console.log('   - Late: 1');

  } catch (error) {
    console.error('❌ Error creating team data:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await addSupervisor4TeamData();
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Script execution error:', error);
  process.exit(1);
});