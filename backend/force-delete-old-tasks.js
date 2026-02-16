import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function forceDeleteOldTasks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

    // First, let's see ALL tasks for employeeId 2
    console.log('📊 Checking ALL tasks with employeeId: 2...');
    const allTasks = await WorkerTaskAssignment.find({ employeeId: 2 }).lean();
    console.log(`   Found ${allTasks.length} tasks total\n`);
    
    allTasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.taskName || 'Unnamed'} (ID: ${task.id}, _id: ${task._id}, Date: ${task.date})`);
    });

    // Delete tasks with IDs 84394, 84395, 3
    console.log('\n🗑️ Deleting old tasks with IDs: 84394, 84395, 3...');
    const deleteResult = await WorkerTaskAssignment.deleteMany({
      employeeId: 2,
      id: { $in: [84394, 84395, 3] }
    });
    console.log(`✅ Deleted ${deleteResult.deletedCount} tasks\n`);

    // Check remaining tasks
    console.log('📊 Checking remaining tasks...');
    const remainingTasks = await WorkerTaskAssignment.find({ employeeId: 2 }).lean();
    console.log(`   Found ${remainingTasks.length} tasks\n`);
    
    remainingTasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.taskName || 'Unnamed'} (ID: ${task.id}, Status: ${task.status})`);
    });

    console.log('\n🎉 Done! Restart backend to see changes.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

forceDeleteOldTasks();
