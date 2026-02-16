import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from './src/modules/task/Task.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';
import Project from './src/modules/project/models/Project.js';

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

const checkCompletedTasks = async () => {
  try {
    console.log('\n📋 Checking Completed Tasks for Ravi Smith...\n');

    // Find the worker
    const user = await User.findOne({ email: 'worker@gmail.com' }).lean();
    const employee = await Employee.findOne({ userId: user.userId }).lean();
    
    console.log(`Worker: ${employee.name || 'Ravi Smith'} (Employee ID: ${employee.id})\n`);

    // Find School Campus Renovation project
    const project = await Project.findOne({ projectName: 'School Campus Renovation' }).lean();
    console.log(`Project: ${project?.projectName} (ID: ${project?.id})\n`);

    // Find all assignments for this project
    const projectAssignments = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      projectId: project.id
    }).sort({ date: -1 }).lean();

    console.log(`📊 Total Assignments for School Campus Renovation: ${projectAssignments.length}\n`);

    for (const assignment of projectAssignments) {
      const task = await Task.findOne({ id: assignment.taskId }).lean();
      
      console.log(`Assignment ${assignment.id}:`);
      console.log(`  Date: ${assignment.date}`);
      console.log(`  Task: ${task?.taskName || 'Unknown'}`);
      console.log(`  Status: ${assignment.status}`);
      console.log(`  Task Status: ${task?.status || 'N/A'}`);
      console.log('');
    }

    // Check for completed status
    const completedAssignments = projectAssignments.filter(a => a.status === 'completed');
    console.log(`\n✅ Completed Tasks: ${completedAssignments.length}`);
    
    const queuedAssignments = projectAssignments.filter(a => a.status === 'queued');
    console.log(`⏳ Queued Tasks: ${queuedAssignments.length}`);
    
    const inProgressAssignments = projectAssignments.filter(a => a.status === 'in_progress');
    console.log(`🔄 In Progress Tasks: ${inProgressAssignments.length}`);

  } catch (error) {
    console.error('❌ Error checking tasks:', error);
  }
};

const main = async () => {
  await connectDB();
  await checkCompletedTasks();
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Script execution error:', error);
  process.exit(1);
});
