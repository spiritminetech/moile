import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function checkNewTasksIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all tasks for employee 107
    const allTasks = await WorkerTaskAssignment.find({ employeeId: 107 })
      .select('id _id taskName status assignedDate')
      .sort({ _id: -1 });

    console.log('📋 ALL TASKS FOR EMPLOYEE 107:');
    console.log('================================');
    allTasks.forEach(task => {
      console.log(`Task: ${task.taskName}`);
      console.log(`  id field: ${task.id} (type: ${typeof task.id})`);
      console.log(`  _id field: ${task._id}`);
      console.log(`  Status: ${task.status}`);
      console.log(`  Assigned Date: ${task.assignedDate}\n`);
    });

    // Check if there are tasks with ObjectId in the id field
    const tasksWithObjectIdInId = await WorkerTaskAssignment.find({
      employeeId: 107,
      id: { $type: 'objectId' }
    });

    if (tasksWithObjectIdInId.length > 0) {
      console.log('❌ PROBLEM FOUND:');
      console.log(`${tasksWithObjectIdInId.length} tasks have ObjectId in the 'id' field instead of numeric ID`);
      console.log('These tasks will NOT appear in the API response\n');
      
      console.log('🔧 SOLUTION:');
      console.log('We need to delete these tasks and recreate them with proper numeric IDs');
    }

    // Get the highest numeric ID
    const tasksWithNumericId = await WorkerTaskAssignment.find({
      employeeId: 107,
      id: { $type: 'number' }
    }).sort({ id: -1 }).limit(1);

    if (tasksWithNumericId.length > 0) {
      console.log(`\n✅ Highest numeric ID: ${tasksWithNumericId[0].id}`);
      console.log(`Next ID should be: ${tasksWithNumericId[0].id + 1}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkNewTasksIssue();
