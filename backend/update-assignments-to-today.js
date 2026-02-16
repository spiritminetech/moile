// Update assignments to today's date so they appear in the API

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function updateAssignmentsToToday() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log(`📅 Current date: ${todayStr}`);
    console.log(`📅 Updating assignments from 2026-02-14 to ${todayStr}...\n`);

    // Find assignments for employee 2 on 2026-02-14
    const oldDate = '2026-02-14';
    const assignments = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: oldDate
    });

    if (assignments.length === 0) {
      console.log('❌ No assignments found for 2026-02-14');
      await mongoose.disconnect();
      return;
    }

    console.log(`✅ Found ${assignments.length} assignments to update\n`);

    // Update each assignment to today's date
    for (const assignment of assignments) {
      assignment.date = todayStr;
      await assignment.save();
      
      console.log(`✅ Updated assignment ${assignment.id} to ${todayStr}`);
    }

    console.log(`\n✅ All ${assignments.length} assignments updated to today's date!`);
    console.log('\n📝 Next steps:');
    console.log('1. Refresh the mobile app');
    console.log('2. Tasks should now appear in Today\'s Tasks screen');
    console.log('3. Daily Job Target section will be visible when expanded');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

updateAssignmentsToToday();
