import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Task from './src/modules/task/Task.js';
import Attendance from './src/modules/attendance/Attendance.js';
import User from './src/modules/user/User.js';
import CompanyUser from './src/modules/companyUser/CompanyUser.js';

// Load environment variables
dotenv.config();

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

/**
 * Check existing data and setup sample data if needed
 */
async function checkAndSetupSupervisorData() {
  console.log('🔍 CHECKING AND SETTING UP SUPERVISOR DATA');
  console.log('='.repeat(60));

  await connectDB();

  try {
    // Step 1: Check supervisor user
    console.log('\n👤 STEP 1: Checking Supervisor User');
    console.log('-'.repeat(40));

    const supervisorUser = await User.findOne({ email: 'supervisor@gmail.com' });
    if (supervisorUser) {
      console.log('✅ Supervisor user found');
      console.log(`   User ID: ${supervisorUser.id}`);
      console.log(`   Name: ${supervisorUser.fullName || supervisorUser.name}`);
      console.log(`   Email: ${supervisorUser.email}`);
    } else {
      console.log('❌ Supervisor user not found');
      return;
    }

    // Check CompanyUser role
    const companyUser = await CompanyUser.findOne({ userId: supervisorUser.id });
    if (companyUser) {
      console.log(`   Company Role: ${companyUser.role}`);
      console.log(`   Company ID: ${companyUser.companyId}`);
    }

    // Step 2: Check projects assigned to supervisor
    console.log('\n🏗️  STEP 2: Checking Projects');
    console.log('-'.repeat(40));

    const projects = await Project.find({ supervisorId: supervisorUser.id });
    console.log(`✅ Found ${projects.length} projects assigned to supervisor`);
    
    projects.forEach((project, index) => {
      console.log(`   Project ${index + 1}:`);
      console.log(`     - ID: ${project.id}`);
      console.log(`     - Name: ${project.projectName || project.name}`);
      console.log(`     - Location: ${project.location || 'N/A'}`);
    });

    if (projects.length === 0) {
      console.log('⚠️  No projects found. Dashboard will be empty.');
      return;
    }

    // Step 3: Check employees/workers
    console.log('\n👥 STEP 3: Checking Employees/Workers');
    console.log('-'.repeat(40));

    const allEmployees = await Employee.find();
    console.log(`✅ Found ${allEmployees.length} total employees in database`);

    // Check if any employees are linked to projects
    const projectIds = projects.map(p => p.id);
    const assignments = await WorkerTaskAssignment.find({ 
      projectId: { $in: projectIds } 
    });
    
    const assignedEmployeeIds = [...new Set(assignments.map(a => a.employeeId))];
    console.log(`✅ Found ${assignedEmployeeIds.length} employees with task assignments`);

    if (assignedEmployeeIds.length === 0) {
      console.log('\n⚠️  NO WORKERS ASSIGNED TO PROJECTS');
      console.log('   Creating sample worker assignments...');
      
      // Create sample assignments if we have employees
      if (allEmployees.length > 0) {
        await createSampleAssignments(projects, allEmployees);
      } else {
        console.log('❌ No employees found in database to assign');
        return;
      }
    }

    // Step 4: Check tasks
    console.log('\n📋 STEP 4: Checking Tasks');
    console.log('-'.repeat(40));

    const allTasks = await Task.find({ projectId: { $in: projectIds } });
    console.log(`✅ Found ${allTasks.length} tasks for supervisor's projects`);

    if (allTasks.length === 0) {
      console.log('\n⚠️  NO TASKS FOUND');
      console.log('   Creating sample tasks...');
      await createSampleTasks(projects);
    }

    // Step 5: Check attendance
    console.log('\n📊 STEP 5: Checking Attendance');
    console.log('-'.repeat(40));

    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await Attendance.find({
      projectId: { $in: projectIds },
      date: {
        $gte: new Date(today),
        $lt: new Date(new Date(today).setDate(new Date(today).getDate() + 1))
      }
    });

    console.log(`✅ Found ${todayAttendance.length} attendance records for today`);

    if (todayAttendance.length === 0 && assignedEmployeeIds.length > 0) {
      console.log('\n⚠️  NO ATTENDANCE RECORDS FOR TODAY');
      console.log('   Creating sample attendance records...');
      await createSampleAttendance(projects, assignedEmployeeIds, today);
    }

    // Step 6: Final verification
    console.log('\n🎯 STEP 6: Final Dashboard Data Check');
    console.log('-'.repeat(40));

    // Re-check assignments after potential creation
    const finalAssignments = await WorkerTaskAssignment.find({ 
      projectId: { $in: projectIds } 
    });
    const finalEmployeeIds = [...new Set(finalAssignments.map(a => a.employeeId))];
    const finalTasks = await Task.find({ projectId: { $in: projectIds } });
    const finalAttendance = await Attendance.find({
      projectId: { $in: projectIds },
      date: {
        $gte: new Date(today),
        $lt: new Date(new Date(today).setDate(new Date(today).getDate() + 1))
      }
    });

    console.log('📊 FINAL STATUS:');
    console.log(`   Projects: ${projects.length}`);
    console.log(`   Assigned Workers: ${finalEmployeeIds.length}`);
    console.log(`   Tasks: ${finalTasks.length}`);
    console.log(`   Today's Attendance: ${finalAttendance.length}`);

    if (projects.length > 0 && finalEmployeeIds.length > 0 && finalTasks.length > 0) {
      console.log('\n✅ DASHBOARD DATA IS NOW AVAILABLE!');
      console.log('   The supervisor dashboard should now show meaningful data.');
    } else {
      console.log('\n⚠️  DASHBOARD DATA IS STILL LIMITED');
      console.log('   Some components may still show empty states.');
    }

  } catch (error) {
    console.error('❌ Error during setup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🏁 SETUP COMPLETED');
    console.log('='.repeat(60));
  }
}

/**
 * Create sample worker task assignments
 */
async function createSampleAssignments(projects, employees) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get the last assignment ID to generate new ones
    const lastAssignment = await WorkerTaskAssignment.findOne().sort({ id: -1 });
    let nextId = lastAssignment ? lastAssignment.id + 1 : 1;

    const assignments = [];
    
    // Assign first few employees to first project
    const employeesToAssign = employees.slice(0, Math.min(3, employees.length));
    
    for (const employee of employeesToAssign) {
      assignments.push({
        id: nextId++,
        employeeId: employee.id,
        projectId: projects[0].id,
        taskId: 1, // We'll create this task
        date: today,
        status: 'queued',
        sequence: 1,
        createdAt: new Date()
      });
    }

    if (assignments.length > 0) {
      await WorkerTaskAssignment.insertMany(assignments);
      console.log(`   ✅ Created ${assignments.length} sample task assignments`);
    }

  } catch (error) {
    console.error('   ❌ Error creating sample assignments:', error);
  }
}

/**
 * Create sample tasks
 */
async function createSampleTasks(projects) {
  try {
    // Get the last task ID to generate new ones
    const lastTask = await Task.findOne().sort({ id: -1 });
    let nextId = lastTask ? lastTask.id + 1 : 1;

    const sampleTasks = [
      {
        id: nextId++,
        taskName: 'Site Preparation',
        description: 'Prepare the construction site for work',
        projectId: projects[0].id,
        status: 'active',
        priority: 'high',
        estimatedHours: 8,
        createdAt: new Date()
      },
      {
        id: nextId++,
        taskName: 'Foundation Work',
        description: 'Lay foundation for the building',
        projectId: projects[0].id,
        status: 'active',
        priority: 'medium',
        estimatedHours: 16,
        createdAt: new Date()
      },
      {
        id: nextId++,
        taskName: 'Material Inspection',
        description: 'Inspect incoming construction materials',
        projectId: projects[0].id,
        status: 'active',
        priority: 'medium',
        estimatedHours: 4,
        createdAt: new Date()
      }
    ];

    await Task.insertMany(sampleTasks);
    console.log(`   ✅ Created ${sampleTasks.length} sample tasks`);

  } catch (error) {
    console.error('   ❌ Error creating sample tasks:', error);
  }
}

/**
 * Create sample attendance records
 */
async function createSampleAttendance(projects, employeeIds, date) {
  try {
    const attendanceRecords = [];
    
    // Create attendance for some employees (simulate realistic scenario)
    const presentEmployees = employeeIds.slice(0, Math.ceil(employeeIds.length * 0.8)); // 80% present
    
    for (const employeeId of presentEmployees) {
      const checkInTime = new Date(date);
      checkInTime.setHours(8, Math.floor(Math.random() * 30), 0, 0); // 8:00-8:30 AM
      
      attendanceRecords.push({
        employeeId: employeeId,
        projectId: projects[0].id,
        date: new Date(date),
        checkIn: checkInTime,
        checkOut: null, // Still working
        insideGeofenceAtCheckin: true,
        location: {
          latitude: 12.9716,
          longitude: 77.5946
        },
        createdAt: new Date()
      });
    }

    if (attendanceRecords.length > 0) {
      await Attendance.insertMany(attendanceRecords);
      console.log(`   ✅ Created ${attendanceRecords.length} sample attendance records`);
    }

  } catch (error) {
    console.error('   ❌ Error creating sample attendance:', error);
  }
}

// Run the setup
checkAndSetupSupervisorData().catch(error => {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
});