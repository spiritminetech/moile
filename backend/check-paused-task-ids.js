import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkPausedTaskIds() {
  try {
    console.log('🔍 Checking Paused Task IDs...\n');

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workerTaskAssignment' }));
    
    const pausedTasks = await WorkerTaskAssignment.find({ 
      status: 'paused',
      employeeId: 2
    });

    console.log(`Found ${pausedTasks.length} paused tasks for employee 2:\n`);
    
    pausedTasks.forEach(task => {
      console.log('Task Details:');
      console.log(`  _id: ${task._id}`);
      console.log(`  id: ${task.id}`);
      console.log(`  taskId: ${task.taskId}`);
      console.log(`  taskName: ${task.taskName}`);
      console.log(`  status: ${task.status}`);
      console.log(`  employeeId: ${task.employeeId}`);
      console.log('');
    });

    const activeTasks = await WorkerTaskAssignment.find({ 
      status: 'in_progress',
      employeeId: 2
    });

    console.log(`Found ${activeTasks.length} active tasks for employee 2:\n`);
    
    activeTasks.forEach(task => {
      console.log('Task Details:');
      console.log(`  _id: ${task._id}`);
      console.log(`  id: ${task.id}`);
      console.log(`  taskId: ${task.taskId}`);
      console.log(`  taskName: ${task.taskName}`);
      console.log(`  status: ${task.status}`);
      console.log(`  employeeId: ${task.employeeId}`);
      console.log('');
    });

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

checkPausedTaskIds();
