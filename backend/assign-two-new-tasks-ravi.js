import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from './src/modules/task/Task.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import User from './src/modules/user/User.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const assignTwoNewTasks = async () => {
  try {
    console.log('\n📋 Assigning 2 New Tasks to Ravi Smith...\n');

    // Find the worker by email
    const user = await User.findOne({ email: 'worker@gmail.com' }).lean();
    if (!user) {
      console.log('❌ User not found with email: worker@gmail.com');
      return;
    }
    console.log(`✅ Found user: ${user.email}, userId: ${user.userId}`);

    // Find the employee record
    const employee = await Employee.findOne({ userId: user.userId }).lean();
    if (!employee) {
      console.log('❌ Employee not found for userId:', user.userId);
      return;
    }
    console.log(`✅ Found employee: ${employee.name}, employeeId: ${employee.id}`);

    // Find the project
    const project = await Project.findOne({ projectName: 'School Campus Renovation' }).lean();
    if (!project) {
      console.log('❌ Project not found: School Campus Renovation');
      return;
    }
    console.log(`✅ Found project: ${project.projectName}, projectId: ${project.id}`);

    // Get the highest task ID to create new ones
    const highestTask = await Task.findOne().sort({ id: -1 }).lean();
    const nextTaskId = (highestTask?.id || 0) + 1;

    console.log(`\n📝 Creating 2 new tasks starting from ID: ${nextTaskId}\n`);

    // Create 2 new tasks
    const newTasks = [
      {
        id: nextTaskId,
        taskName: 'Install Classroom Lighting Fixtures',
        description: 'Install LED lighting fixtures in classrooms on the second floor',
        projectId: project.id,
        companyId: project.companyId || 1,
        taskType: 'WORK',
        status: 'PLANNED',
        priority: 'high',
        estimatedHours: 6,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: nextTaskId + 1,
        taskName: 'Paint Corridor Walls',
        description: 'Apply fresh coat of paint to main corridor walls',
        projectId: project.id,
        companyId: project.companyId || 1,
        taskType: 'WORK',
        status: 'PLANNED',
        priority: 'medium',
        estimatedHours: 8,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert tasks
    const createdTasks = await Task.insertMany(newTasks);
    console.log(`✅ Created ${createdTasks.length} tasks`);
    createdTasks.forEach(task => {
      console.log(`   - Task ${task.id}: ${task.taskName}`);
    });

    // Get the highest assignment ID
    const highestAssignment = await WorkerTaskAssignment.findOne().sort({ id: -1 }).lean();
    const nextAssignmentId = (highestAssignment?.id || 0) + 1;

    // Create assignments for today
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    const assignments = [
      {
        id: nextAssignmentId,
        employeeId: employee.id,
        taskId: nextTaskId,
        projectId: project.id,
        date: dateString,
        status: 'queued',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: nextAssignmentId + 1,
        employeeId: employee.id,
        taskId: nextTaskId + 1,
        projectId: project.id,
        date: dateString,
        status: 'queued',
        priority: 'medium',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert assignments
    const createdAssignments = await WorkerTaskAssignment.insertMany(assignments);
    console.log(`\n✅ Created ${createdAssignments.length} task assignments`);
    createdAssignments.forEach(assignment => {
      console.log(`   - Assignment ${assignment.id}: Task ${assignment.taskId} → Employee ${assignment.employeeId}`);
    });

    // Verification
    console.log('\n📊 Verification:');
    const workerAssignments = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      date: dateString
    }).lean();
    console.log(`  Total assignments for Ravi Smith today: ${workerAssignments.length}`);

    console.log('\n✅ Task assignment complete!');
    console.log('\n📱 Next Steps:');
    console.log('   1. Login to mobile app with: worker@gmail.com / password123');
    console.log('   2. Select project: School Campus Renovation');
    console.log('   3. Navigate to Tasks screen to see the new tasks');

  } catch (error) {
    console.error('❌ Error assigning tasks:', error);
  }
};

const main = async () => {
  await connectDB();
  await assignTwoNewTasks();
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Script execution error:', error);
  process.exit(1);
});
