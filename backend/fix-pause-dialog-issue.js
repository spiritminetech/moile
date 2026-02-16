// Fix the pause dialog issue by ensuring only ONE task is active

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function fix() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔧 FIXING PAUSE DIALOG ISSUE');
    console.log('='.repeat(80));

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Find all in_progress tasks for today
    const activeTasks = await WorkerTaskAssignment.find({
      status: 'in_progress',
      date: today
    }).sort({ sequence: 1 });

    console.log(`\n📊 Found ${activeTasks.length} active tasks`);

    if (activeTasks.length === 0) {
      console.log('\n✅ No active tasks - this is fine');
      console.log('   Start one task in the app, then try to start another');
    } else if (activeTasks.length === 1) {
      console.log('\n✅ Exactly ONE active task - this is correct!');
      console.log(`   Active Task: ${activeTasks[0].taskName || 'Task ' + activeTasks[0].id}`);
      console.log('   Now try to start another task - dialog should appear');
    } else {
      console.log('\n⚠️  MULTIPLE ACTIVE TASKS - Fixing...');
      
      // Keep only the first one active
      const keepActive = activeTasks[0];
      console.log(`\n✅ Keeping active: ${keepActive.taskName || 'Task ' + keepActive.id}`);
      console.log(`   ID: ${keepActive.id}`);
      
      // Set others to queued
      for (let i = 1; i < activeTasks.length; i++) {
        const task = activeTasks[i];
        console.log(`\n🔄 Changing to queued: ${task.taskName || 'Task ' + task.id}`);
        console.log(`   ID: ${task.id}`);
        
        task.status = 'queued';  // Use 'queued' not 'pending'
        task.startTime = null;
        await task.save();
        
        console.log('   ✅ Changed to queued');
      }
    }

    // Verify final state
    console.log('\n' + '='.repeat(80));
    console.log('✅ VERIFICATION');
    console.log('='.repeat(80));

    const finalActiveTasks = await WorkerTaskAssignment.find({
      status: 'in_progress',
      date: today
    });

    console.log(`\nActive tasks now: ${finalActiveTasks.length}`);
    
    if (finalActiveTasks.length === 1) {
      console.log('✅ Perfect! Only ONE task is active');
      console.log(`   Active: ${finalActiveTasks[0].taskName || 'Task ' + finalActiveTasks[0].id}`);
      console.log('');
      console.log('📱 NOW TEST IN APP:');
      console.log('   1. Go to Today\'s Tasks screen');
      console.log('   2. You should see one task "In Progress"');
      console.log('   3. Click "Start Task" on ANY OTHER task');
      console.log('   4. Dialog should appear: "You are working on [task name]. Pause and start this task?"');
    } else if (finalActiveTasks.length === 0) {
      console.log('ℹ️  No active tasks');
      console.log('');
      console.log('📱 TO TEST:');
      console.log('   1. Start one task first');
      console.log('   2. Then try to start another');
      console.log('   3. Dialog should appear');
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ FIX COMPLETE');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
  }
}

fix();
