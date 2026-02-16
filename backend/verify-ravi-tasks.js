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

const verifyRaviTasks = async () => {
  try {
    console.log('\n📋 Verifying Ravi Smith\'s Tasks...\n');

    // Find the worker
    const user = await User.findOne({ email: 'worker@gmail.com' }).lean();
    const employee = await Employee.findOne({ userId: user.userId }).lean();
    
    console.log(`Worker: ${employee.name} (Employee ID: ${employee.id})`);

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log(`Date: ${today}\n`);

    // Find all assignments for today
    const assignments = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      date: today
    }).lean();

    console.log(`📊 Total Assignments Today: ${assignments.length}\n`);

    // Get task details for each assignment
    for (const assignment of assignments) {
      const task = await Task.findOne({ id: assignment.taskId }).lean();
      
      console.log(`Task ${assignment.taskId}:`);
      console.log(`  Name: ${task?.taskName || 'Unknown'}`);
      console.log(`  Description: ${task?.description || 'N/A'}`);
      console.log(`  Status: ${assignment.status}`);
      console.log(`  Priority: ${assignment.priority || 'N/A'}`);
      console.log(`  Assignment ID: ${assignment.id}`);
      console.log('');
    }

    console.log('✅ Verification complete!');

  } catch (error) {
    console.error('❌ Error verifying tasks:', error);
  }
};

const main = async () => {
  await connectDB();
  await verifyRaviTasks();
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Script execution error:', error);
  process.exit(1);
});
