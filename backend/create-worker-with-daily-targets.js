// Create worker with proper daily target assignments

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));
const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false, collection: 'projects' }));

async function createWorkerWithDailyTargets() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find or create worker user
    let workerUser = await User.findOne({ email: 'worker@gmail.com' });
    
    if (!workerUser) {
      console.log('❌ worker@gmail.com user not found');
      return;
    }

    console.log(`✅ Found worker user: ${workerUser.email}`);
    console.log(`   User ID: ${workerUser._id}`);
    console.log(`   Employee ID: ${workerUser.employeeId}\n`);

    // Find or create employee
    let employee = await Employee.findOne({ employeeId: workerUser.employeeId });
    
    if (!employee) {
      console.log('📝 Creating employee record...');
      employee = await Employee.create({
        employeeId: workerUser.employeeId,
        name: 'Ravi Kumar',
        email: 'worker@gmail.com',
        phone: '+91 9876543210',
        role: 'worker',
        designation: 'Construction Worker',
        department: 'Construction',
        status: 'active',
        joiningDate: new Date('2024-01-01'),
        userId: workerUser._id
      });
      console.log(`✅ Created employee: ${employee.name}\n`);
    } else {
      console.log(`✅ Found employee: ${employee.name}\n`);
    }

    // Find a project
    const project = await Project.findOne({ projectId: 1003 });
    if (!project) {
      console.log('❌ Project 1003 not found. Please create a project first.');
      return;
    }

    console.log(`✅ Found project: ${project.projectName}\n`);

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Delete old assignments for today
    await WorkerTaskAssignment.deleteMany({
      employeeId: employee.employeeId,
      date: { $gte: today }
    });

    console.log('🗑️ Cleared old assignments\n');

    // Create 3 new assignments with proper daily targets
    const assignments = [
      {
        assignmentId: 7001,
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
        supervisorId: 4,
        supervisorName: 'Supervisor Gmail',
        supervisorContact: '+91 9876543211',
        projectGeofence: project.geofence || {
          latitude: 13.0827,
          longitude: 80.2707,
          radius: 50000,
          allowedVariance: 5000
        },
        dailyTarget: {
          description: 'Complete 150 sqm of wall plastering',
          quantity: 150,
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
        assignmentId: 7002,
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
        dependencies: [7001],
        estimatedHours: 6,
        progress: 0,
        actualOutput: 0,
        supervisorId: 4,
        supervisorName: 'Supervisor Gmail',
        supervisorContact: '+91 9876543211',
        projectGeofence: project.geofence || {
          latitude: 13.0827,
          longitude: 80.2707,
          radius: 50000,
          allowedVariance: 5000
        },
        dailyTarget: {
          description: 'Install 80 sqm of floor tiles',
          quantity: 80,
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
        assignmentId: 7003,
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
        dependencies: [7001, 7002],
        estimatedHours: 8,
        progress: 0,
        actualOutput: 0,
        supervisorId: 4,
        supervisorName: 'Supervisor Gmail',
        supervisorContact: '+91 9876543211',
        projectGeofence: project.geofence || {
          latitude: 13.0827,
          longitude: 80.2707,
          radius: 50000,
          allowedVariance: 5000
        },
        dailyTarget: {
          description: 'Paint 200 sqm of exterior walls',
          quantity: 200,
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

    console.log('📝 Creating assignments with proper daily targets...\n');

    for (const assignmentData of assignments) {
      const assignment = await WorkerTaskAssignment.create(assignmentData);
      console.log(`✅ Created Assignment ${assignment.assignmentId}: ${assignment.taskName}`);
      console.log(`   Daily Target: ${assignment.dailyTarget.quantity} ${assignment.dailyTarget.unit}`);
      console.log(`   Description: ${assignment.dailyTarget.description}`);
      console.log('');
    }

    console.log('✅ All assignments created successfully!\n');

    // Verify
    console.log('🔍 Verifying assignments...\n');
    const createdAssignments = await WorkerTaskAssignment.find({
      employeeId: employee.employeeId,
      date: { $gte: today }
    }).sort({ sequence: 1 });

    console.log(`Found ${createdAssignments.length} assignments:\n`);
    createdAssignments.forEach(assignment => {
      console.log(`${assignment.sequence}. ${assignment.taskName}`);
      console.log(`   Status: ${assignment.status}`);
      console.log(`   Daily Target: ${assignment.dailyTarget.quantity} ${assignment.dailyTarget.unit}`);
      console.log(`   Expected Output: ${assignment.dailyTarget.quantity} ${assignment.dailyTarget.unit}`);
      console.log(`   Actual Output: ${assignment.actualOutput || 0} ${assignment.dailyTarget.unit}`);
      console.log(`   Progress: ${assignment.progress || 0}%`);
      console.log('');
    });

    console.log('✅ Setup complete! Worker can now see and update daily targets.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createWorkerWithDailyTargets();
