import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

async function verifyCollectionFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const employeeId = 2;
    const today = new Date().toISOString().split("T")[0];
    
    console.log('🔍 Testing WorkerTaskAssignment model...');
    console.log('   Collection name:', WorkerTaskAssignment.collection.name);
    console.log('   Employee ID:', employeeId);
    console.log('   Date:', today);
    console.log('');

    // Query using the model (this is what the backend does)
    const tasks = await WorkerTaskAssignment.find({
      employeeId: employeeId,
      date: today
    }).sort({ sequence: 1 });

    console.log(`✅ Found ${tasks.length} tasks for employee ${employeeId} on ${today}`);
    console.log('');

    if (tasks.length > 0) {
      console.log('📋 Tasks:');
      tasks.forEach((task, i) => {
        console.log(`   ${i+1}. ID: ${task.id}`);
        console.log(`      Status: ${task.status}`);
        console.log(`      Priority: ${task.priority}`);
        console.log(`      Daily Target: ${task.dailyTarget?.description || 'N/A'}`);
        console.log('');
      });

      console.log('✅ SUCCESS! The model is now reading from the correct collection.');
      console.log('   Tasks for today are now visible to the backend API.');
    } else {
      console.log('❌ No tasks found. This might mean:');
      console.log('   1. There are no tasks for today');
      console.log('   2. The collection name is still incorrect');
      console.log('   3. The date format doesn\'t match');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

verifyCollectionFix();
