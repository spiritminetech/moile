// Verify Daily Target Fields - Complete Check
// This script verifies that all enhanced daily target fields are present in the database and API response

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

async function verifyDailyTargetFields() {
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
    console.log('=' .repeat(60));
    
    // Check basic fields
    console.log('\n✅ Basic Fields:');
    console.log(`   Task Name: ${assignment.taskName || 'N/A'}`);
    console.log(`   Employee ID: ${assignment.employeeId}`);
    console.log(`   Date: ${assignment.date}`);
    console.log(`   Status: ${assignment.status}`);

    // Check if dailyTarget exists
    if (!assignment.dailyTarget) {
      console.log('\n❌ ERROR: dailyTarget object is missing!');
      return;
    }

    console.log('\n✅ Daily Target Object Exists');
    console.log('=' .repeat(60));

    // Check basic daily target fields
    console.log('\n📊 Basic Daily Target Fields:');
    console.log(`   ✓ description: "${assignment.dailyTarget.description || 'N/A'}"`);
    console.log(`   ✓ quantity: ${assignment.dailyTarget.quantity || 'N/A'}`);
    console.log(`   ✓ unit: "${assignment.dailyTarget.unit || 'N/A'}"`);
    console.log(`   ✓ targetCompletion: ${assignment.dailyTarget.targetCompletion || 'N/A'}%`);

    // Check enhanced daily target fields
    console.log('\n🎯 Enhanced Daily Target Fields:');
    const enhancedFields = {
      targetType: assignment.dailyTarget.targetType,
      areaLevel: assignment.dailyTarget.areaLevel,
      startTime: assignment.dailyTarget.startTime,
      expectedFinish: assignment.dailyTarget.expectedFinish,
      progressToday: assignment.dailyTarget.progressToday
    };

    let allFieldsPresent = true;

    Object.entries(enhancedFields).forEach(([field, value]) => {
      if (value !== undefined && value !== null) {
        if (field === 'progressToday') {
          console.log(`   ✓ ${field}:`);
          console.log(`      - completed: ${value.completed || 0}`);
          console.log(`      - total: ${value.total || 0}`);
          console.log(`      - percentage: ${value.percentage || 0}%`);
        } else {
          console.log(`   ✓ ${field}: "${value}"`);
        }
      } else {
        console.log(`   ❌ ${field}: MISSING`);
        allFieldsPresent = false;
      }
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    if (allFieldsPresent) {
      console.log('✅ SUCCESS: All enhanced daily target fields are present in database!');
      console.log('\n📱 Expected Mobile App Display:');
      console.log('   🎯 DAILY JOB TARGET');
      console.log('   --------------------------------------------------');
      console.log(`   Target Type:        ${assignment.dailyTarget.targetType}`);
      console.log(`   Expected Output:    ${assignment.dailyTarget.quantity} ${assignment.dailyTarget.unit}`);
      console.log(`   Area/Level:         ${assignment.dailyTarget.areaLevel}`);
      console.log(`   Start Time:         ${assignment.dailyTarget.startTime}`);
      console.log(`   Expected Finish:    ${assignment.dailyTarget.expectedFinish}`);
      console.log(`   Progress Today:`);
      console.log(`   Completed: ${assignment.dailyTarget.progressToday.completed} / ${assignment.dailyTarget.progressToday.total} ${assignment.dailyTarget.unit}`);
      console.log(`   Progress: ${assignment.dailyTarget.progressToday.percentage}%`);
      
      console.log('\n⚠️  IF YOU ONLY SEE "Expected Output" IN THE APP:');
      console.log('   The mobile app needs to be rebuilt to apply the code fix.');
      console.log('\n   Run these commands:');
      console.log('   cd ConstructionERPMobile');
      console.log('   npx expo start --clear');
      console.log('   Then press "a" for Android or "i" for iOS');
    } else {
      console.log('❌ ERROR: Some enhanced fields are missing from database!');
      console.log('   Run: node backend/fix-daily-target-complete-fields.js');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

verifyDailyTargetFields();
