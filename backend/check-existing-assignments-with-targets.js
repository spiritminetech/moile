import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

const checkAssignments = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all assignments for today
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Checking assignments for date:', today);

    const assignments = await WorkerTaskAssignment.find({
      date: today
    }).sort({ employeeId: 1, sequence: 1 }).limit(5);

    console.log(`\n📋 Found ${assignments.length} assignments for today\n`);

    if (assignments.length === 0) {
      console.log('❌ No assignments found for today');
      console.log('   Try running: node create-todays-assignments-for-worker.js');
    } else {
      assignments.forEach((assignment, index) => {
        console.log(`${index + 1}. Assignment ID: ${assignment.id}`);
        console.log(`   Employee ID: ${assignment.employeeId}`);
        console.log(`   Task Name: ${assignment.taskName}`);
        console.log(`   Status: ${assignment.status}`);
        console.log(`   Date: ${assignment.date}`);
        console.log(`   Daily Target:`);
        if (assignment.dailyTarget) {
          console.log(`      - Description: ${assignment.dailyTarget.description || 'N/A'}`);
          console.log(`      - Quantity: ${assignment.dailyTarget.quantity || 0}`);
          console.log(`      - Unit: ${assignment.dailyTarget.unit || 'N/A'}`);
          console.log(`      - Target Type: ${assignment.dailyTarget.targetType || 'N/A'}`);
          console.log(`      - Area Level: ${assignment.dailyTarget.areaLevel || 'N/A'}`);
          console.log(`      - Progress Today: ${assignment.dailyTarget.progressToday || 'N/A'}`);
        } else {
          console.log(`      ⚠️ No daily target data`);
        }
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
};

checkAssignments();
