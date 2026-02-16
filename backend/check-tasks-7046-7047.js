import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function checkTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check tasks 7046 and 7047
    const tasks = await WorkerTaskAssignment.find({ id: { $in: [7046, 7047] } });

    console.log('📋 TASKS 7046 & 7047:');
    console.log('=====================');
    tasks.forEach(task => {
      console.log(`\nTask ${task.id}:`);
      console.log(`  taskName: ${task.taskName}`);
      console.log(`  employeeId: ${task.employeeId}`);
      console.log(`  date field: ${task.date}`);
      console.log(`  assignedDate: ${task.assignedDate}`);
      console.log(`  status: ${task.status}`);
      console.log(`  priority: ${task.priority}`);
      console.log(`  natureOfWork: ${task.natureOfWork}`);
    });

    // Check what date format the API expects
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    console.log(`\n📅 Today's date: ${todayStr}`);

    // Check tasks for employee 2 with today's date
    const todayTasks = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: todayStr
    });

    console.log(`\n📋 TASKS FOR EMPLOYEE 2 WITH DATE ${todayStr}:`);
    console.log('='.repeat(50));
    console.log(`Found ${todayTasks.length} tasks`);
    todayTasks.forEach(task => {
      console.log(`  Task ${task.id}: ${task.taskName || 'UNDEFINED'} (${task.status})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkTasks();
