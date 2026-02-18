import mongoose from 'mongoose';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

const MONGODB_URI = 'mongodb://anbarasus2410_db_user:Anbu24102002@ac-vtmilrh-shard-00-00.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-01.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-02.hlff2qz.mongodb.net:27017/erp?tls=true&replicaSet=atlas-qbnji8-shard-0&authSource=admin&retryWrites=true&w=majority';

async function checkDailyTarget() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get assignment 7035
    const assignment = await WorkerTaskAssignment.findOne({ id: 7035 }).lean();

    if (!assignment) {
      console.log('❌ Assignment 7035 not found');
      return;
    }

    console.log('📋 Assignment 7035 Daily Target:');
    console.log(JSON.stringify(assignment.dailyTarget, null, 2));

    console.log('\n🔍 Checking for enhanced fields:');
    console.log('  targetType:', assignment.dailyTarget?.targetType || '❌ MISSING');
    console.log('  areaLevel:', assignment.dailyTarget?.areaLevel || '❌ MISSING');
    console.log('  startTime:', assignment.dailyTarget?.startTime || '❌ MISSING');
    console.log('  expectedFinish:', assignment.dailyTarget?.expectedFinish || '❌ MISSING');
    console.log('  progressToday:', assignment.dailyTarget?.progressToday ? '✅ EXISTS' : '❌ MISSING');

    await mongoose.disconnect();
    console.log('\n✅ Done');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

checkDailyTarget();
