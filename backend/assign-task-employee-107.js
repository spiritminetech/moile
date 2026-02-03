#!/usr/bin/env node

/**
 * Assign one more task to employee ID 107 for testing progress calculation
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

async function assignNewTask() {
  console.log('📋 Assigning new task to employee 107...\n');

  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Check current assignments for employee 107
    const existingAssignments = await WorkerTaskAssignment.find({
      employeeId: 107,
      date: today
    });

    console.log(`📊 Current assignments for employee 107 on ${today}:`);
    existingAssignments.forEach(assignment => {
      console.log(`   - Assignment ${assignment.id}: ${assignment.status} (Project: ${assignment.projectId})`);
    });

    // Find the highest assignment ID to generate a new one
    const allAssignments = await WorkerTaskAssignment.find({}).sort({ id: -1 }).limit(1);
    const nextId = allAssignments.length > 0 ? allAssignments[0].id + 1 : 3000;

    // Create new task assignment
    const newAssignment = new WorkerTaskAssignment({
      id: nextId,
      projectId: 1016, // Same project as existing tasks
      employeeId: 107,
      supervisorId: 1, // Default supervisor
      taskId: null,
      date: today,
      status: 'queued', // Start as queued/pending
      companyId: 1, // Default company
      assignedAt: new Date(),
      
      // Mobile app fields
      dailyTarget: {
        description: 'Install electrical fixtures in Zone C',
        quantity: 15,
        unit: 'fixtures',
        targetCompletion: 100
      },
      
      workArea: 'Zone C',
      floor: 'Floor 2',
      zone: 'Electrical Section',
      
      timeEstimate: {
        estimated: 480, // 8 hours in minutes
        elapsed: 0,
        remaining: 480
      },
      
      priority: 'medium',
      sequence: 3, // Third task in sequence
      dependencies: [], // No dependencies for this task
      
      geofenceValidation: {
        required: true,
        lastValidated: null,
        validationLocation: {
          latitude: 12.9716,
          longitude: 77.5946
        }
      }
    });

    await newAssignment.save();

    console.log(`\n✅ Successfully assigned new task to employee 107:`);
    console.log(`   Assignment ID: ${nextId}`);
    console.log(`   Project ID: 1016`);
    console.log(`   Status: queued`);
    console.log(`   Work Area: Zone C`);
    console.log(`   Task: Install electrical fixtures in Zone C`);
    console.log(`   Estimated Time: 8 hours`);

    // Show updated summary
    const updatedAssignments = await WorkerTaskAssignment.find({
      employeeId: 107,
      date: today
    });

    const totalTasks = updatedAssignments.length;
    const completedTasks = updatedAssignments.filter(a => a.status === 'completed').length;
    const inProgressTasks = updatedAssignments.filter(a => a.status === 'in_progress').length;
    const queuedTasks = updatedAssignments.filter(a => a.status === 'queued').length;
    const expectedProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    console.log(`\n📊 Updated summary for employee 107:`);
    console.log(`   Total Tasks: ${totalTasks}`);
    console.log(`   Completed: ${completedTasks}`);
    console.log(`   In Progress: ${inProgressTasks}`);
    console.log(`   Queued: ${queuedTasks}`);
    console.log(`   Expected Progress: ${expectedProgress}%`);

    console.log(`\n🎯 This should now show in the dashboard:`);
    console.log(`   - Total Tasks: ${totalTasks}`);
    console.log(`   - Completed: ${completedTasks}`);
    console.log(`   - Progress: ${expectedProgress}%`);

  } catch (error) {
    console.error('❌ Error assigning task:', error);
    throw error;
  }
}

async function main() {
  await connectToDatabase();
  
  try {
    await assignNewTask();
    console.log('\n✅ Task assignment completed!');
    console.log('\n📱 Next steps:');
    console.log('1. Refresh the mobile app dashboard');
    console.log('2. Check Today\'s Progress section');
    console.log('3. Progress should now show 67% (2 completed out of 3 total)');
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

main().catch(console.error);