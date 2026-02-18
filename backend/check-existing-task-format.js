import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function checkExistingFormat() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get one existing task for employee 2
    const existingTask = await WorkerTaskAssignment.findOne({ 
      employeeId: 2,
      id: { $type: 'number' }
    }).sort({ id: -1 });

    if (existingTask) {
      console.log('📋 EXISTING TASK FORMAT:');
      console.log('========================');
      console.log(JSON.stringify(existingTask, null, 2));
    } else {
      console.log('❌ No existing tasks found for employee 2');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkExistingFormat();
