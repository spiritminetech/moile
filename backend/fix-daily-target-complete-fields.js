// Script to fix daily target fields - add missing description, quantity, unit

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixDailyTargetCompleteFields() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const dateStr = '2026-02-14';

    console.log(`📅 Fixing assignments for employee ID 2 on ${dateStr}...\n`);

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

    // Complete daily target data for each task
    const completeTargets = {
      7035: { // LED Lighting task
        description: 'Install LED lighting fixtures',
        quantity: 25,
        unit: 'LED Lighting Installations',
        targetCompletion: 100,
        targetType: 'Quantity Based',
        areaLevel: 'Tower A – Level 2',
        startTime: '08:00 AM',
        expectedFinish: '05:00 PM',
        progressToday: {
          completed: 0,
          total: 25,
          percentage: 0
        }
      },
      7036: { // Painting task
        description: 'Paint corridor walls',
        quantity: 150,
        unit: 'Square Meters',
        targetCompletion: 100,
        targetType: 'Quantity Based',
        areaLevel: 'Main Corridor – Ground Floor',
        startTime: '08:00 AM',
        expectedFinish: '05:00 PM',
        progressToday: {
          completed: 0,
          total: 150,
          percentage: 0
        }
      },
      7034: { // Bricklaying task
        description: 'Build brick walls',
        quantity: 100,
        unit: 'Bricks',
        targetCompletion: 100,
        targetType: 'Quantity Based',
        areaLevel: 'Building A – Ground Floor',
        startTime: '08:00 AM',
        expectedFinish: '05:00 PM',
        progressToday: {
          completed: 0,
          total: 100,
          percentage: 0
        }
      }
    };

    // Update each assignment
    for (const assignment of assignments) {
      const completeData = completeTargets[assignment.id];
      
      if (!completeData) {
        console.log(`⚠️  No data for assignment ${assignment.id}, skipping...`);
        continue;
      }

      // Replace entire dailyTarget object with complete data
      assignment.dailyTarget = completeData;

      await assignment.save();

      console.log(`✅ Updated assignment ${assignment.id}:`);
      console.log(`   Description: ${completeData.description}`);
      console.log(`   Expected Output: ${completeData.quantity} ${completeData.unit}`);
      console.log(`   Target Type: ${completeData.targetType}`);
      console.log(`   Area/Level: ${completeData.areaLevel}`);
      console.log(`   Time: ${completeData.startTime} - ${completeData.expectedFinish}`);
      console.log(`   Progress: ${completeData.progressToday.completed}/${completeData.progressToday.total} (${completeData.progressToday.percentage}%)\n`);
    }

    console.log('✅ All assignments updated with complete daily target fields!');
    console.log('\n📝 Next steps:');
    console.log('1. The API will now return all daily target fields');
    console.log('2. Frontend will display comprehensive daily target section');
    console.log('3. Refresh the mobile app to see changes');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixDailyTargetCompleteFields();
