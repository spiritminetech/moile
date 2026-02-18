// Create worker assignments with any available project

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));
const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false, collection: 'projects' }));

async function createWorkerAssignmentsAnyProject() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find worker user
    const workerUser = await User.findOne({ email: 'worker@gmail.com' });
    if (!workerUser) {
      console.log('❌ worker@gmail.com user not found');
      return;
    }

    console.log(`✅ Found worker user: ${workerUser.email}`);
    console.log(`   Employee ID: ${workerUser.employeeId}\n`);

    // Find or create employee
    let employee = await Employee.findOne({ employeeId: workerUser.employeeId });
    if (!employee) {
      employee = await Employee.create({
        employeeId: workerUser.employeeId,
        name: 'Ravi Smith',
        email: 'worker@gmail.com',
        phone: '+91 9876543210',
        role: 'worker',
        status: 'active',
        userId: workerUser._id
      });
      console.log(`✅ Created employee: ${employee.name}\n`);
    } else {
      console.log(`✅ Found employee: ${employee.name}\n`);
    }

    // Find ANY project
    const project = await Project.findOne({});
    if (!project) {
      console.log('❌ No projects found. Creating a default project...');
      
      const newProject = await Project.create({
        projectId: 1,
        projectCode: 'PROJ-001',
        projectName: 'School Campus Construction',
        clientName: 'Education Department',
        siteName: 'Main Campus',
        status: 'active',
        startDate: new Date('2024-01-01'),
        geofence: {
          latitude: 13.0827,
          longitude: 80.2707,
          radius: 50000,
          allowedVariance: 5000
        }
      });
      
      console.log(`✅ Created project: ${newProject.projectName}\n`);
      await createAssignments(employee, newProject);
      return;
    }

    console.log(`✅ Found project: ${project.projectName} (ID: ${project.projectId})\n`);
    await createAssignments(employee, project);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

async function createAssignments(employee, project) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Delete old assignments
  await WorkerTaskAssignment.deleteMany({
    employeeId: employee.employeeId,
    date: { $gte: today }
  });

  console.log('🗑️ Cleared old assignments\n');

  // Create assignments with PROPER daily targets (non-zero quantities)
  const assignments = [
    {
      assignmentId: 8001,
      taskName: 'Wall Plastering - Ground Floor',
      description: 'Complete plastering work for ground floor walls',
      projectId: project.projectId,
      projectCode: project.projectCode,
      projectName: project.projectName,
      employeeId: employee.employeeId,
      employeeName: employee.name,
      date: today,
      status: 'pending',
      priority: 'high',
      sequence: 1,
      dependencies: [],
      estimatedHours: 8,
      progress: 0,
      actualOutput: 0,
      projectGeofence: project.geofence || {
        latitude: 13.0827,
        longitude: 80.2707,
        radius: 50000,
        allowedVariance: 5000
      },
      dailyTarget: {
        description: 'Complete 150 sqm of wall plastering',
        quantity: 150,  // NON-ZERO quantity
        unit: 'sqm',
        targetCompletion: 'end_of_day',
        targetType: 'quantity',
        areaLevel: 'ground_floor',
        startTime: '08:00',
        expectedFinish: '17:00',
        progressToday: {
          completed: 0,
          total: 150,
          percentage: 0
        }
      }
    },
    {
      assignmentId: 8002,
      taskName: 'Floor Tiling - First Floor',
      description: 'Install ceramic tiles on first floor',
      projectId: project.projectId,
      projectCode: project.projectCode,
      projectName: project.projectName,
      employeeId: employee.employeeId,
      employeeName: employee.name,
      date: today,
      status: 'pending',
      priority: 'medium',
      sequence: 2,
      dependencies: [8001],
      estimatedHours: 6,
      progress: 0,
      actualOutput: 0,
      projectGeofence: project.geofence || {
        latitude: 13.0827,
        longitude: 80.2707,
        radius: 50000,
        allowedVariance: 5000
      },
      dailyTarget: {
        description: 'Install 80 sqm of floor tiles',
        quantity: 80,  // NON-ZERO quantity
        unit: 'sqm',
        targetCompletion: 'end_of_day',
        targetType: 'quantity',
        areaLevel: 'first_floor',
        startTime: '08:00',
        expectedFinish: '15:00',
        progressToday: {
          completed: 0,
          total: 80,
          percentage: 0
        }
      }
    },
    {
      assignmentId: 8003,
      taskName: 'Painting - Exterior Walls',
      description: 'Apply primer and paint to exterior walls',
      projectId: project.projectId,
      projectCode: project.projectCode,
      projectName: project.projectName,
      employeeId: employee.employeeId,
      employeeName: employee.name,
      date: today,
      status: 'pending',
      priority: 'low',
      sequence: 3,
      dependencies: [8001, 8002],
      estimatedHours: 8,
      progress: 0,
      actualOutput: 0,
      projectGeofence: project.geofence || {
        latitude: 13.0827,
        longitude: 80.2707,
        radius: 50000,
        allowedVariance: 5000
      },
      dailyTarget: {
        description: 'Paint 200 sqm of exterior walls',
        quantity: 200,  // NON-ZERO quantity
        unit: 'sqm',
        targetCompletion: 'end_of_day',
        targetType: 'quantity',
        areaLevel: 'exterior',
        startTime: '08:00',
        expectedFinish: '17:00',
        progressToday: {
          completed: 0,
          total: 200,
          percentage: 0
        }
      }
    }
  ];

  console.log('📝 Creating assignments with NON-ZERO daily targets...\n');

  for (const assignmentData of assignments) {
    const assignment = await WorkerTaskAssignment.create(assignmentData);
    console.log(`✅ Created Assignment ${assignment.assignmentId}: ${assignment.taskName}`);
    console.log(`   Expected Output: ${assignment.dailyTarget.quantity} ${assignment.dailyTarget.unit}`);
    console.log(`   Actual Output: ${assignment.actualOutput || 0} ${assignment.dailyTarget.unit}`);
    console.log('');
  }

  console.log('✅ All assignments created!\n');
  console.log('🎯 DAILY TARGET FIX SUMMARY:');
  console.log('   - All assignments have NON-ZERO quantities');
  console.log('   - Expected Output will show proper values (150, 80, 200)');
  console.log('   - Workers can now update progress\n');
  
  console.log('📱 NEXT STEPS:');
  console.log('   1. Restart the backend server');
  console.log('   2. Clear mobile app cache (or reload)');
  console.log('   3. Login as worker@gmail.com');
  console.log('   4. Check Today\'s Tasks - you should see proper daily targets\n');
}

createWorkerAssignmentsAnyProject();
