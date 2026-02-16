import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function findAllTaskCollections() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all collection names
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 All collections in database:');
    collections.forEach(col => {
      if (col.name.toLowerCase().includes('task') || col.name.toLowerCase().includes('assignment')) {
        console.log(`   - ${col.name}`);
      }
    });

    console.log('\n🔍 Checking workertaskassignments collection...');
    const WorkerTaskAssignment1 = mongoose.model('WorkerTaskAssignment1', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));
    const tasks1 = await WorkerTaskAssignment1.find({ employeeId: 2 }).limit(5).lean();
    console.log(`   Found ${tasks1.length} tasks with employeeId: 2`);
    tasks1.forEach(task => {
      console.log(`   - ${task.taskName || 'Unnamed'} (id: ${task.id}, _id: ${task._id})`);
    });

    console.log('\n🔍 Checking taskassignments collection...');
    const TaskAssignment = mongoose.model('TaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'taskassignments' }));
    const tasks2 = await TaskAssignment.find({ employeeId: 2 }).limit(5).lean();
    console.log(`   Found ${tasks2.length} tasks with employeeId: 2`);
    tasks2.forEach(task => {
      console.log(`   - ${task.taskName || 'Unnamed'} (id: ${task.id}, _id: ${task._id})`);
    });

    console.log('\n🔍 Checking tasks collection...');
    const Task = mongoose.model('Task', new mongoose.Schema({}, { strict: false, collection: 'tasks' }));
    const tasks3 = await Task.find({ employeeId: 2 }).limit(5).lean();
    console.log(`   Found ${tasks3.length} tasks with employeeId: 2`);
    tasks3.forEach(task => {
      console.log(`   - ${task.taskName || 'Unnamed'} (id: ${task.id}, _id: ${task._id})`);
    });

    // Check for tasks with the specific IDs
    console.log('\n🔍 Searching for tasks with IDs 84394, 84395, 3 in all collections...');
    
    const oldTask1 = await WorkerTaskAssignment1.findOne({ id: 84394 }).lean();
    if (oldTask1) console.log('   Found in workertaskassignments:', oldTask1.taskName, oldTask1.id);
    
    const oldTask2 = await TaskAssignment.findOne({ id: 84394 }).lean();
    if (oldTask2) console.log('   Found in taskassignments:', oldTask2.taskName, oldTask2.id);
    
    const oldTask3 = await Task.findOne({ id: 84394 }).lean();
    if (oldTask3) console.log('   Found in tasks:', oldTask3.taskName, oldTask3.id);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

findAllTaskCollections();
