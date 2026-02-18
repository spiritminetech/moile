import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function checkAssignment7043() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const WorkerTaskAssignment = mongoose.connection.collection('workertaskassignments');
    
    const assignment = await WorkerTaskAssignment.findOne({ id: 7043 });
    
    if (!assignment) {
      console.log('❌ Assignment 7043 not found');
      return;
    }

    console.log('\n📋 Assignment 7043 Details:');
    console.log('   ID:', assignment.id);
    console.log('   Task Name:', assignment.taskName);
    console.log('   Status:', assignment.status);
    console.log('   Employee ID:', assignment.employeeId);
    console.log('   Start Time:', assignment.startTime);
    console.log('   Progress:', assignment.progressPercent || 0, '%');
    console.log('   Pause History:', assignment.pauseHistory?.length || 0, 'pauses');
    
    if (assignment.pauseHistory && assignment.pauseHistory.length > 0) {
      console.log('\n⏸️  Pause History:');
      assignment.pauseHistory.forEach((pause, i) => {
        console.log(`   ${i + 1}. Paused at:`, pause.pausedAt);
        console.log(`      Resumed at:`, pause.resumedAt || 'NOT RESUMED');
      });
    }

    console.log('\n🔍 Current State Analysis:');
    if (assignment.status === 'queued') {
      if (assignment.pauseHistory && assignment.pauseHistory.length > 0) {
        const lastPause = assignment.pauseHistory[assignment.pauseHistory.length - 1];
        if (!lastPause.resumedAt) {
          console.log('   ⚠️  Task is PAUSED (queued with unresumed pause)');
          console.log('   ✅ Can be resumed');
        } else {
          console.log('   ⚠️  Task is QUEUED but all pauses are resumed');
          console.log('   ❓ Unexpected state - should be in_progress');
        }
      } else if (assignment.startTime) {
        console.log('   ⚠️  Task was started but is now queued (paused without history)');
        console.log('   ✅ Can be resumed');
      } else {
        console.log('   ℹ️  Task is QUEUED and never started');
        console.log('   ❌ Cannot be resumed - must be started first');
      }
    } else if (assignment.status === 'in_progress') {
      console.log('   ✅ Task is IN PROGRESS');
      console.log('   ✅ Can update progress');
    } else {
      console.log('   Status:', assignment.status);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkAssignment7043();
