// Verify what dates the assignments actually have

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verifyAssignmentDates() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get today's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log(`📅 Today's date: ${todayStr}`);
    console.log(`📅 Today's full ISO: ${today.toISOString()}\n`);

    // Find all assignments for employee 2
    const allAssignments = await WorkerTaskAssignment.find({
      employeeId: 2
    }).sort({ date: -1 });

    console.log(`✅ Found ${allAssignments.length} total assignments for employee 2\n`);

    console.log('📋 Assignment dates:');
    for (const assignment of allAssignments) {
      console.log(`  Assignment ${assignment.id}: date="${assignment.date}" (type: ${typeof assignment.date})`);
    }

    // Check for today specifically
    console.log(`\n🔍 Checking for assignments on ${todayStr}...`);
    const todayAssignments = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: todayStr
    });

    console.log(`Found ${todayAssignments.length} assignments for today`);
    
    if (todayAssignments.length > 0) {
      console.log('\n✅ Assignments found for today:');
      for (const assignment of todayAssignments) {
        console.log(`  - Assignment ${assignment.id}`);
        if (assignment.dailyTarget) {
          console.log(`    Daily Target: ${assignment.dailyTarget.quantity} ${assignment.dailyTarget.unit}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

verifyAssignmentDates();
