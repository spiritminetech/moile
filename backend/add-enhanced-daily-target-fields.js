// Script to add enhanced daily target fields to existing assignments
// Adds: targetType, areaLevel, startTime, expectedFinish, progressToday

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function addEnhancedDailyTargetFields() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get today's date in YYYY-MM-DD format (2026-02-14 based on context)
    const dateStr = '2026-02-14';

    console.log(`📅 Looking for assignments on ${dateStr}...\n`);

    // Find all assignments for today with employee ID 2 (Ravi Smith)
    const assignments = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: dateStr
    });

    if (assignments.length === 0) {
      console.log('❌ No assignments found for employee ID 2 on 2026-02-14');
      await mongoose.disconnect();
      return;
    }

    console.log(`✅ Found ${assignments.length} assignments\n`);

    // Enhanced daily target data for each task
    const enhancedTargets = {
      7035: { // LED Lighting task
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
      const enhancedData = enhancedTargets[assignment.id];
      
      if (!enhancedData) {
        console.log(`⚠️  No enhanced data for assignment ${assignment.id}, skipping...`);
        continue;
      }

      // Ensure dailyTarget exists
      if (!assignment.dailyTarget) {
        assignment.dailyTarget = {};
      }

      // Add enhanced fields to dailyTarget
      assignment.dailyTarget.targetType = enhancedData.targetType;
      assignment.dailyTarget.areaLevel = enhancedData.areaLevel;
      assignment.dailyTarget.startTime = enhancedData.startTime;
      assignment.dailyTarget.expectedFinish = enhancedData.expectedFinish;
      assignment.dailyTarget.progressToday = enhancedData.progressToday;

      await assignment.save();

      console.log(`✅ Updated assignment ${assignment.id}:`);
      console.log(`   Target Type: ${enhancedData.targetType}`);
      console.log(`   Area/Level: ${enhancedData.areaLevel}`);
      console.log(`   Start Time: ${enhancedData.startTime}`);
      console.log(`   Expected Finish: ${enhancedData.expectedFinish}`);
      console.log(`   Progress: ${enhancedData.progressToday.completed}/${enhancedData.progressToday.total} (${enhancedData.progressToday.percentage}%)\n`);
    }

    console.log('✅ All assignments updated successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart the backend server');
    console.log('2. The API will now return enhanced daily target fields');
    console.log('3. Frontend TaskCard will display the comprehensive daily target section');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

addEnhancedDailyTargetFields();
