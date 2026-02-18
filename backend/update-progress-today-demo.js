// Update Progress Today - Demonstration Script
// This script shows how progressToday changes when worker completes units

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function updateProgressToday() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get assignment 7035 (LED Lighting task)
    const assignment = await WorkerTaskAssignment.findOne({ id: 7035 });

    if (!assignment) {
      console.log('❌ Assignment 7035 not found');
      return;
    }

    console.log('📋 Assignment 7035 - LED Lighting Installation');
    console.log('=' .repeat(70));
    console.log(`Target: ${assignment.dailyTarget.quantity} ${assignment.dailyTarget.unit}`);
    console.log('=' .repeat(70));

    // Show current state
    console.log('\n📊 CURRENT STATE:');
    console.log(`   Completed: ${assignment.dailyTarget.progressToday.completed} / ${assignment.dailyTarget.progressToday.total} ${assignment.dailyTarget.unit}`);
    console.log(`   Progress: ${assignment.dailyTarget.progressToday.percentage}%`);

    // Scenario 1: Worker completes 2 units
    console.log('\n' + '='.repeat(70));
    console.log('🔧 SCENARIO 1: Worker completes 2 LED lighting installations');
    console.log('='.repeat(70));
    
    const scenario1Completed = 2;
    const scenario1Percentage = Math.round((scenario1Completed / assignment.dailyTarget.quantity) * 100);
    
    console.log(`   Completed: ${scenario1Completed} / ${assignment.dailyTarget.quantity} ${assignment.dailyTarget.unit}`);
    console.log(`   Progress: ${scenario1Percentage}%`);
    console.log(`   📈 Change: +${scenario1Completed} units, +${scenario1Percentage}%`);

    // Scenario 2: Worker completes 3 more units (total 5)
    console.log('\n' + '='.repeat(70));
    console.log('🔧 SCENARIO 2: Worker completes 3 MORE installations (total 5)');
    console.log('='.repeat(70));
    
    const scenario2Completed = 5;
    const scenario2Percentage = Math.round((scenario2Completed / assignment.dailyTarget.quantity) * 100);
    
    console.log(`   Completed: ${scenario2Completed} / ${assignment.dailyTarget.quantity} ${assignment.dailyTarget.unit}`);
    console.log(`   Progress: ${scenario2Percentage}%`);
    console.log(`   📈 Change: +3 units, +${scenario2Percentage - scenario1Percentage}% (from previous)`);

    // Scenario 3: Worker completes 5 more units (total 10)
    console.log('\n' + '='.repeat(70));
    console.log('🔧 SCENARIO 3: Worker completes 5 MORE installations (total 10)');
    console.log('='.repeat(70));
    
    const scenario3Completed = 10;
    const scenario3Percentage = Math.round((scenario3Completed / assignment.dailyTarget.quantity) * 100);
    
    console.log(`   Completed: ${scenario3Completed} / ${assignment.dailyTarget.quantity} ${assignment.dailyTarget.unit}`);
    console.log(`   Progress: ${scenario3Percentage}%`);
    console.log(`   📈 Change: +5 units, +${scenario3Percentage - scenario2Percentage}% (from previous)`);

    // Scenario 4: Worker completes remaining 15 units (total 25 - COMPLETE)
    console.log('\n' + '='.repeat(70));
    console.log('🔧 SCENARIO 4: Worker completes remaining 15 installations (TASK COMPLETE)');
    console.log('='.repeat(70));
    
    const scenario4Completed = 25;
    const scenario4Percentage = 100;
    
    console.log(`   Completed: ${scenario4Completed} / ${assignment.dailyTarget.quantity} ${assignment.dailyTarget.unit}`);
    console.log(`   Progress: ${scenario4Percentage}%`);
    console.log(`   📈 Change: +15 units, +${scenario4Percentage - scenario3Percentage}% (from previous)`);
    console.log(`   ✅ TASK COMPLETED!`);

    // Ask user which scenario to apply
    console.log('\n' + '='.repeat(70));
    console.log('💾 UPDATE DATABASE?');
    console.log('='.repeat(70));
    console.log('\nWhich scenario would you like to apply to the database?');
    console.log('  1 - Set progress to 2 units (8%)');
    console.log('  2 - Set progress to 5 units (20%)');
    console.log('  3 - Set progress to 10 units (40%)');
    console.log('  4 - Set progress to 25 units (100% - COMPLETE)');
    console.log('  0 - Skip database update (just show scenarios)');
    
    // For automation, let's update to scenario 2 (5 units, 20%)
    const selectedScenario = 2;
    
    if (selectedScenario > 0) {
      let newCompleted, newPercentage;
      
      switch(selectedScenario) {
        case 1:
          newCompleted = 2;
          newPercentage = 8;
          break;
        case 2:
          newCompleted = 5;
          newPercentage = 20;
          break;
        case 3:
          newCompleted = 10;
          newPercentage = 40;
          break;
        case 4:
          newCompleted = 25;
          newPercentage = 100;
          break;
      }

      // Update the database
      await WorkerTaskAssignment.updateOne(
        { id: 7035 },
        {
          $set: {
            'dailyTarget.progressToday.completed': newCompleted,
            'dailyTarget.progressToday.percentage': newPercentage,
            updatedAt: new Date()
          }
        }
      );

      console.log(`\n✅ Database updated to Scenario ${selectedScenario}:`);
      console.log(`   Completed: ${newCompleted} / ${assignment.dailyTarget.quantity} ${assignment.dailyTarget.unit}`);
      console.log(`   Progress: ${newPercentage}%`);
      
      // Verify the update
      const updatedAssignment = await WorkerTaskAssignment.findOne({ id: 7035 });
      console.log('\n🔍 Verification:');
      console.log(`   Database now shows: ${updatedAssignment.dailyTarget.progressToday.completed} / ${updatedAssignment.dailyTarget.progressToday.total} (${updatedAssignment.dailyTarget.progressToday.percentage}%)`);
    } else {
      console.log('\n⏭️  Skipped database update');
    }

    // Show how this appears in the mobile app
    console.log('\n' + '='.repeat(70));
    console.log('📱 HOW THIS APPEARS IN MOBILE APP');
    console.log('='.repeat(70));
    console.log('\nWhen worker expands the task card, they will see:');
    console.log('\n   🎯 DAILY JOB TARGET');
    console.log('   --------------------------------------------------');
    console.log('   Target Type:        Quantity Based');
    console.log('   Expected Output:    25 LED Lighting Installations');
    console.log('   Area/Level:         Tower A – Level 2');
    console.log('   Start Time:         08:00 AM');
    console.log('   Expected Finish:    05:00 PM');
    console.log('   ');
    console.log('   Progress Today:');
    console.log(`   Completed: 5 / 25 LED Lighting Installations`);
    console.log('   [████░░░░░░░░░░░░░░░░] (Progress bar - 20% filled)');
    console.log('   Progress: 20%');

    // Explain the update mechanism
    console.log('\n' + '='.repeat(70));
    console.log('🔄 HOW PROGRESS UPDATES WORK');
    console.log('='.repeat(70));
    console.log('\n1. Worker uses "Update Progress" button in the mobile app');
    console.log('2. Worker enters completed quantity (e.g., "5 units completed")');
    console.log('3. Backend API receives the update request');
    console.log('4. Backend calculates percentage: (5 / 25) × 100 = 20%');
    console.log('5. Backend updates progressToday in database');
    console.log('6. Mobile app refreshes and shows new progress');
    console.log('7. Progress bar color changes based on percentage:');
    console.log('   - Red (0-49%): Behind schedule');
    console.log('   - Orange (50-74%): On track');
    console.log('   - Green (75-100%): Ahead of schedule');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

updateProgressToday();
