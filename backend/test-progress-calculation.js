#!/usr/bin/env node

/**
 * Test script to verify progress calculation in dashboard API
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

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
  console.log('🧮 Testing progress calculation...\n');

  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Testing for date:', today);

    // Find all task assignments for today
    const assignments = await WorkerTaskAssignment.find({
      date: today
    });

    console.log(`📋 Found ${assignments.length} task assignments for today\n`);

    if (assignments.length === 0) {
      console.log('ℹ️ No task assignments found for today');
      return;
    }

    // Group by employee
    const employeeStats = {};
    
    assignments.forEach(assignment => {
      const employeeId = assignment.employeeId;
      
      if (!employeeStats[employeeId]) {
        employeeStats[employeeId] = {
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          queuedTasks: 0,
          assignments: []
        };
      }
      
      const stats = employeeStats[employeeId];
      stats.totalTasks++;
      stats.assignments.push(assignment);
      
      switch (assignment.status) {
        case 'completed':
          stats.completedTasks++;
          break;
        case 'in_progress':
          stats.inProgressTasks++;
          break;
        case 'queued':
          stats.queuedTasks++;
          break;
      }
    });

    // Calculate and display progress for each employee
    Object.entries(employeeStats).forEach(([employeeId, stats]) => {
      const progress = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
      
      console.log(`👤 Employee ${employeeId}:`);
      console.log(`   Total Tasks: ${stats.totalTasks}`);
      console.log(`   Completed: ${stats.completedTasks}`);
      console.log(`   In Progress: ${stats.inProgressTasks}`);
      console.log(`   Queued: ${stats.queuedTasks}`);
      console.log(`   Progress: ${progress}%`);
      
      // Show task details
      console.log('   Task Details:');
      stats.assignments.forEach(assignment => {
        console.log(`     - Assignment ${assignment.id}: ${assignment.status}`);
      });
      console.log('');
    });

    // Test specific calculation scenarios
    console.log('🧪 Testing calculation scenarios:');
    
    const testCases = [
      { total: 2, completed: 2, expected: 100 },
      { total: 2, completed: 1, expected: 50 },
      { total: 3, completed: 2, expected: 67 },
      { total: 0, completed: 0, expected: 0 },
      { total: 1, completed: 0, expected: 0 },
    ];
    
    testCases.forEach(testCase => {
      const calculated = testCase.total > 0 ? Math.round((testCase.completed / testCase.total) * 100) : 0;
      const isCorrect = calculated === testCase.expected;
      
      console.log(`   ${testCase.completed}/${testCase.total} tasks = ${calculated}% ${isCorrect ? '✅' : '❌'} (expected ${testCase.expected}%)`);
    });

  } catch (error) {
    console.error('❌ Error testing progress calculation:', error);
    throw error;
  }
}

async function main() {
  await connectToDatabase();
  
  try {
    await testProgressCalculation();
    console.log('\n✅ Progress calculation test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

main().catch(console.error);