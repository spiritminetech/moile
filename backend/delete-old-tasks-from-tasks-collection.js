import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function deleteOldTasksFromTasksCollection() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Task = mongoose.model('Task', new mongoose.Schema({}, { strict: false, collection: 'tasks' }));

    // Find old tasks
    console.log('🔍 Finding old tasks in "tasks" collection...');
    const oldTasks = await Task.find({ 
      employeeId: 2,
      id: { $in: [84394, 84395, 3] }
    }).lean();
    
    console.log(`   Found ${oldTasks.length} old tasks:`);
    oldTasks.forEach(task => {
      console.log(`   - ${task.taskName || 'Unnamed'} (ID: ${task.id})`);
    });

    // Delete them
    console.log('\n🗑️ Deleting old tasks...');
    const deleteResult = await Task.deleteMany({
      employeeId: 2,
      id: { $in: [84394, 84395, 3] }
    });
    console.log(`✅ Deleted ${deleteResult.deletedCount} tasks\n`);

    // Verify
    console.log('📊 Checking remaining tasks in "tasks" collection...');
    const remainingTasks = await Task.find({ employeeId: 2 }).lean();
    console.log(`   Found ${remainingTasks.length} tasks with employeeId: 2\n`);

    // Now check workertaskassignments
    console.log('📊 Checking "workertaskassignments" collection...');
    const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));
    const workerTasks = await WorkerTaskAssignment.find({ employeeId: 2 }).lean();
    console.log(`   Found ${workerTasks.length} tasks with employeeId: 2`);
    workerTasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.taskName || 'Unnamed'} (Status: ${task.status})`);
    });

    console.log('\n🎉 Done! Restart backend to see changes.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteOldTasksFromTasksCollection();
