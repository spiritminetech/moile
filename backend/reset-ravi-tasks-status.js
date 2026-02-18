import mongoose from 'mongoose';
import dotenv from 'dotenv';
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

const resetRaviTasksStatus = async () => {
  try {
    console.log('\n🔄 Resetting Task Status for Ravi Smith...\n');

    // Find the worker
    const user = await User.findOne({ email: 'worker@gmail.com' }).lean();
    const employee = await Employee.findOne({ userId: user.userId }).lean();
    
    console.log(`Worker: ${employee.name || 'Ravi Smith'} (Employee ID: ${employee.id})`);

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log(`Today's Date: ${today}\n`);

    // Find today's assignments
    const todayAssignments = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      date: today
    });

    console.log(`Found ${todayAssignments.length} assignments for today\n`);

    // Reset all to 'queued' status
    for (const assignment of todayAssignments) {
      console.log(`Resetting Assignment ${assignment.id}:`);
      console.log(`  Task ID: ${assignment.taskId}`);
      console.log(`  Old Status: ${assignment.status}`);
      
      assignment.status = 'queued';
      assignment.startTime = null;
      assignment.endTime = null;
      assignment.completedAt = null;
      await assignment.save();
      
      console.log(`  New Status: queued ✅\n`);
    }

    console.log('✅ All tasks reset to queued status!');
    console.log('\n📱 Now try refreshing the mobile app to see both tasks.');

  } catch (error) {
    console.error('❌ Error resetting tasks:', error);
  }
};

const main = async () => {
  await connectDB();
  await resetRaviTasksStatus();
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Script execution error:', error);
  process.exit(1);
});
