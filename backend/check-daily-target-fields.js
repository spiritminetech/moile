// Script to check what daily target fields are being returned by the API

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkDailyTargetFields() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const dateStr = '2026-02-14';

    console.log(`📅 Checking assignments for employee ID 2 on ${dateStr}...\n`);

    const assignments = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: dateStr
    });

    if (assignments.length === 0) {
      console.log('❌ No assignments found');
      await mongoose.disconnect();
      return;
    }

    console.log(`✅ Found ${assignments.length} assignments\n`);

    for (const assignment of assignments) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Assignment ID: ${assignment.id}`);
      console.log(`Task Name: ${assignment.taskId}`);
      console.log(`${'='.repeat(60)}`);
      
      if (assignment.dailyTarget) {
        console.log('\n📊 Daily Target Object:');
        console.log(JSON.stringify(assignment.dailyTarget, null, 2));
        
        console.log('\n📋 Field Breakdown:');
        console.log(`  ✓ description: ${assignment.dailyTarget.description || 'NOT SET'}`);
        console.log(`  ✓ quantity: ${assignment.dailyTarget.quantity || 'NOT SET'}`);
        console.log(`  ✓ unit: ${assignment.dailyTarget.unit || 'NOT SET'}`);
        console.log(`  ✓ targetCompletion: ${assignment.dailyTarget.targetCompletion || 'NOT SET'}`);
        console.log(`  ✓ targetType: ${assignment.dailyTarget.targetType || 'NOT SET'}`);
        console.log(`  ✓ areaLevel: ${assignment.dailyTarget.areaLevel || 'NOT SET'}`);
        console.log(`  ✓ startTime: ${assignment.dailyTarget.startTime || 'NOT SET'}`);
        console.log(`  ✓ expectedFinish: ${assignment.dailyTarget.expectedFinish || 'NOT SET'}`);
        
        if (assignment.dailyTarget.progressToday) {
          console.log(`  ✓ progressToday:`);
          console.log(`    - completed: ${assignment.dailyTarget.progressToday.completed}`);
          console.log(`    - total: ${assignment.dailyTarget.progressToday.total}`);
          console.log(`    - percentage: ${assignment.dailyTarget.progressToday.percentage}%`);
        } else {
          console.log(`  ✗ progressToday: NOT SET`);
        }
      } else {
        console.log('\n❌ No dailyTarget object found');
      }
    }

    console.log(`\n${'='.repeat(60)}\n`);
    console.log('✅ Check complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkDailyTargetFields();
