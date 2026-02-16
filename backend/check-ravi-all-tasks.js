import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from './src/modules/task/Task.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Employee from './src/modules/employee/Employee.js';
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

const checkRaviAllTasks = async () => {
  try {
    console.log('\n📋 Checking All Tasks for Ravi Smith...\n');

    // Find the worker
    const user = await User.findOne({ email: 'worker@gmail.com' }).lean();
    const employee = await Employee.findOne({ userId: user.userId }).lean();
    
    console.log(`Worker: ${employee.name || 'Ravi Smith'} (Employee ID: ${employee.id})`);

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log(`Today's Date: ${today}\n`);

    // Find ALL assignments for this employee (not just today)
    const allAssignments = await WorkerTaskAssignment.find({
      employeeId: employee.id
    }).sort({ date: -1 }).limit(10).lean();

    console.log(`📊 Recent Assignments (last 10): ${allAssignments.length}\n`);

    for (const assignment of allAssignments) {
      const task = await Task.findOne({ id: assignment.taskId }).lean();
      
      console.log(`Assignment ${assignment.id}:`);
      console.log(`  Date: ${assignment.date}`);
      console.log(`  Task ID: ${assignment.taskId}`);
      console.log(`  Task Name: ${task?.taskName || 'Unknown'}`);
      console.log(`  Status: ${assignment.status}`);
      console.log(`  Priority: ${assignment.priority || 'N/A'}`);
      console.log(`  Project ID: ${assignment.projectId}`);
      console.log('');
    }

    // Check specifically for today
    console.log('\n📅 Today\'s Assignments Only:\n');
    const todayAssignments = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      date: today
    }).lean();

    console.log(`Total for today: ${todayAssignments.length}`);
    
    for (const assignment of todayAssignments) {
      const task = await Task.findOne({ id: assignment.taskId }).lean();
      console.log(`  - Task ${assignment.taskId}: ${task?.taskName || 'Unknown'} (${assignment.status})`);
    }

  } catch (error) {
    console.error('❌ Error checking tasks:', error);
  }
};

const main = async () => {
  await connectDB();
  await checkRaviAllTasks();
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Script execution error:', error);
  process.exit(1);
});
