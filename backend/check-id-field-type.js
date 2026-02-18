import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkIdFieldType() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('workerTaskAssignment');

    // Get a sample of tasks
    const tasks = await collection.find({ employeeId: 2 }).limit(5).toArray();

    console.log('Sample tasks:\n');
    tasks.forEach(task => {
      console.log(`Task _id: ${task._id}`);
      console.log(`  id field: ${task.id}`);
      console.log(`  id type: ${typeof task.id}`);
      console.log(`  id is number: ${typeof task.id === 'number'}`);
      console.log(`  status: ${task.status}`);
      console.log('');
    });

    // Find tasks where id is actually a number
    const numericTasks = await collection.find({
      employeeId: 2,
      id: { $exists: true, $type: 16 } // 16 = 32-bit integer, 18 = 64-bit integer
    }).toArray();

    console.log(`\nTasks with numeric id (32-bit int): ${numericTasks.length}`);

    const numericTasks64 = await collection.find({
      employeeId: 2,
      id: { $exists: true, $type: 18 } // 18 = 64-bit integer
    }).toArray();

    console.log(`Tasks with numeric id (64-bit int): ${numericTasks64.length}`);

    // Try finding by specific numeric IDs
    const task7034 = await collection.findOne({ id: 7034 });
    const task7037 = await collection.findOne({ id: 7037 });
    const task7040 = await collection.findOne({ id: 7040 });

    console.log('\nSearching for specific numeric IDs:');
    console.log(`  Task 7034: ${task7034 ? 'Found' : 'Not found'}`);
    console.log(`  Task 7037: ${task7037 ? 'Found' : 'Not found'}`);
    console.log(`  Task 7040: ${task7040 ? 'Found' : 'Not found'}`);

    if (task7034) {
      console.log('\nTask 7034 details:');
      console.log(`  _id: ${task7034._id}`);
      console.log(`  id: ${task7034.id}`);
      console.log(`  status: ${task7034.status}`);
      console.log(`  employeeId: ${task7034.employeeId}`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

checkIdFieldType();
