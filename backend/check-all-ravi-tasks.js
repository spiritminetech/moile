import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function checkAllRaviTasks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check all tasks for employee 2 without date filter
    const allTasks = await WorkerTaskAssignment.find({ 
      employeeId: 2
    }).sort({ assignedDate: -1, sequence: 1 });

    console.log(`\n📊 Total tasks for Employee ID 2: ${allTasks.length}`);

    allTasks.forEach((task, index) => {
      console.log(`\nTask ${index + 1}:`);
      console.log(`  Task ID: ${task.taskId}`);
      console.log(`  Name: ${task.taskName}`);
      console.log(`  Status: ${task.status}`);
      console.log(`  Assigned Date: ${task.assignedDate}`);
      console.log(`  Sequence: ${task.sequence}`);
    });

    // Check today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`\n📅 Today's date (for comparison): ${today}`);

    // Check tasks with today's date
    const todayTasks = await WorkerTaskAssignment.find({ 
      employeeId: 2,
      assignedDate: { $gte: today }
    }).sort({ sequence: 1 });

    console.log(`\n📊 Tasks assigned today or later: ${todayTasks.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkAllRaviTasks();
