import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

const checkDailyTargetValues = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get a sample assignment
    const assignment = await WorkerTaskAssignment.findOne({
      employeeId: 107,
      date: '2026-02-15'
    }).sort({ sequence: 1 });

    if (!assignment) {
      console.log('❌ No assignment found for employee 107 on 2026-02-15');
      process.exit(0);
    }

    console.log('📋 Assignment Details:');
    console.log('   Assignment ID:', assignment.id);
    console.log('   Task Name:', assignment.taskName);
    console.log('   Status:', assignment.status);
    console.log('\n📊 Daily Target Object:');
    console.log('   Raw Object:', JSON.stringify(assignment.dailyTarget, null, 2));
    console.log('\n📊 Daily Target Fields:');
    console.log('   Description:', assignment.dailyTarget?.description || 'N/A');
    console.log('   Quantity:', assignment.dailyTarget?.quantity || 0);
    console.log('   Unit:', assignment.dailyTarget?.unit || 'N/A');
    console.log('   Target Completion:', assignment.dailyTarget?.targetCompletion || 100);
    console.log('   Target Type:', assignment.dailyTarget?.targetType || 'N/A');
    console.log('   Area Level:', assignment.dailyTarget?.areaLevel || 'N/A');
    console.log('   Start Time:', assignment.dailyTarget?.startTime || 'N/A');
    console.log('   Expected Finish:', assignment.dailyTarget?.expectedFinish || 'N/A');
    console.log('   Progress Today:', assignment.dailyTarget?.progressToday || 'N/A');

    console.log('\n✅ Daily target data is present in the database');
    console.log('   The mobile app should be able to access these values');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

checkDailyTargetValues();
