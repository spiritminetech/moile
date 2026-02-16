import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkCorrectCollection() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check the SINGULAR collection (what the model uses)
    console.log('🔍 Checking "workerTaskAssignment" collection (SINGULAR - what model uses)...');
    const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workerTaskAssignment' }));
    const tasks = await WorkerTaskAssignment.find({ employeeId: 2 }).lean();
    console.log(`   Found ${tasks.length} tasks with employeeId: 2\n`);
    
    tasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.taskName || 'Unnamed'} (ID: ${task.id}, Status: ${task.status}, Date: ${task.date})`);
    });

    // Find the old tasks
    console.log('\n🔍 Looking for old tasks with IDs 84394, 84395, 3...');
    const oldTasks = await WorkerTaskAssignment.find({
      employeeId: 2,
      id: { $in: [84394, 84395, 3] }
    }).lean();
    console.log(`   Found ${oldTasks.length} old tasks\n`);
    
    oldTasks.forEach(task => {
      console.log(`   - ${task.taskName || 'Unnamed'} (ID: ${task.id})`);
    });

    if (oldTasks.length > 0) {
      console.log('\n🗑️ Deleting old tasks...');
      const deleteResult = await WorkerTaskAssignment.deleteMany({
        employeeId: 2,
        id: { $in: [84394, 84395, 3] }
      });
      console.log(`✅ Deleted ${deleteResult.deletedCount} tasks\n`);

      // Check remaining
      console.log('📊 Checking remaining tasks...');
      const remaining = await WorkerTaskAssignment.find({ employeeId: 2 }).lean();
      console.log(`   Found ${remaining.length} tasks\n`);
      
      remaining.forEach((task, index) => {
        console.log(`   ${index + 1}. ${task.taskName || 'Unnamed'} (ID: ${task.id}, Status: ${task.status})`);
      });
    }

    console.log('\n🎉 Done! Restart backend to see changes.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCorrectCollection();
