import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function findNumericIdTasks() {
  try {
    console.log('🔍 Finding Tasks with Numeric IDs...\n');

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workerTaskAssignment' }));
    
    // Find tasks where id is a number
    const numericIdTasks = await WorkerTaskAssignment.find({ 
      id: { $type: 'number' }
    }).sort({ id: 1 });

    console.log(`Found ${numericIdTasks.length} tasks with numeric IDs:\n`);
    
    numericIdTasks.forEach(task => {
      console.log(`Task ${task.id}: ${task.taskName || 'Unnamed'} - ${task.status} (employeeId: ${task.employeeId})`);
    });

    // Check specifically for tasks 7034, 7037, 7040
    console.log('\n🔍 Checking for specific tasks 7034, 7037, 7040...\n');
    
    const specificTasks = await WorkerTaskAssignment.find({
      id: { $in: [7034, 7037, 7040] }
    });

    if (specificTasks.length > 0) {
      console.log(`Found ${specificTasks.length} specific tasks:\n`);
      specificTasks.forEach(task => {
        console.log(`Task ${task.id}:`);
        console.log(`  status: ${task.status}`);
        console.log(`  employeeId: ${task.employeeId}`);
        console.log(`  taskName: ${task.taskName}`);
        console.log('');
      });
    } else {
      console.log('⚠️  Tasks 7034, 7037, 7040 not found!');
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

findNumericIdTasks();
