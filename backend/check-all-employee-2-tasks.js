import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function checkAllEmployee2Tasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get ALL tasks for employee 2
    const allTasks = await WorkerTaskAssignment.find({ employeeId: 2 })
      .sort({ id: 1 })
      .limit(5);

    console.log(`📋 FIRST 5 TASKS FOR EMPLOYEE 2:`);
    console.log('================================');
    
    if (allTasks.length === 0) {
      console.log('❌ No tasks found for employee 2\n');
    } else {
      allTasks.forEach(task => {
        console.log(`\nTask ID: ${task.id} (type: ${typeof task.id})`);
        console.log(`  _id: ${task._id}`);
        console.log(`  taskName: ${task.taskName}`);
        console.log(`  date: ${task.date}`);
        console.log(`  assignedDate: ${task.assignedDate}`);
        console.log(`  status: ${task.status}`);
      });
    }

    // Count total
    const count = await WorkerTaskAssignment.countDocuments({ employeeId: 2 });
    console.log(`\n📊 Total tasks for employee 2: ${count}`);

    // Check today's date format
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    console.log(`\n📅 Today's date string: ${todayStr}`);

    // Try to find tasks with today's date
    const todayTasks = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: todayStr
    });
    console.log(`📋 Tasks with date="${todayStr}": ${todayTasks.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkAllEmployee2Tasks();
