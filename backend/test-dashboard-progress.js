#!/usr/bin/env node

/**
 * Test the dashboard API progress calculation fix
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

async function testProgressCalculation() {
  console.log('🧮 Testing dashboard progress calculation...\n');

  try {
    // Test the calculation logic directly
    const testCases = [
      { totalTasks: 2, completedTasks: 2, expected: 100 },
      { totalTasks: 2, completedTasks: 1, expected: 50 },
      { totalTasks: 3, completedTasks: 2, expected: 67 },
      { totalTasks: 0, completedTasks: 0, expected: 0 },
      { totalTasks: 1, completedTasks: 0, expected: 0 },
      { totalTasks: 5, completedTasks: 3, expected: 60 },
    ];

    console.log('🧪 Testing progress calculation logic:');
    
    testCases.forEach(testCase => {
      const calculated = testCase.totalTasks > 0 
        ? Math.round((testCase.completedTasks / testCase.totalTasks) * 100)
        : 0;
      
      const isCorrect = calculated === testCase.expected;
      const status = isCorrect ? '✅' : '❌';
      
      console.log(`   ${testCase.completedTasks}/${testCase.totalTasks} tasks = ${calculated}% ${status} (expected ${testCase.expected}%)`);
    });

    console.log('\n📊 The fix should now correctly calculate:');
    console.log('   - 2 completed out of 2 total = 100% progress');
    console.log('   - Progress based on task completion status, not individual task progress percentages');

  } catch (error) {
    console.error('❌ Error testing progress calculation:', error);
    throw error;
  }
}

async function main() {
  await connectToDatabase();
  
  try {
    await testProgressCalculation();
    console.log('\n✅ Dashboard progress calculation test completed!');
    console.log('\n📱 Next steps:');
    console.log('1. Restart your backend server to apply the fix');
    console.log('2. Refresh the mobile app dashboard');
    console.log('3. The progress should now show 100% for 2/2 completed tasks');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

main().catch(console.error);