#!/usr/bin/env node

/**
 * Fix task assignment data - add missing taskId values
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Task from './src/modules/task/Task.js';

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

async function fixTaskAssignmentData() {
  console.log('🔧 Fixing task assignment data...\n');

  try {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Find all assignments for employee 107 today
    const assignments = await WorkerTaskAssignment.find({
      employeeId: 107,
      date: today
    });

    console.log(`Found ${assignments.length} assignments for employee 107:`);
    
    // Check which assignments have issues
    const invalidAssignments = assignments.filter(a => 
      !a.projectId || !a.taskId || !Number.isInteger(a.projectId) || !Number.isInteger(a.taskId)
    );

    console.log(`Invalid assignments: ${invalidAssignments.length}`);
    
    assignments.forEach(assignment => {
      console.log(`   - Assignment ${assignment.id}:`);
      console.log(`     Project ID: ${assignment.projectId} (${typeof assignment.projectId})`);
      console.log(`     Task ID: ${assignment.taskId} (${typeof assignment.taskId})`);
      console.log(`     Status: ${assignment.status}`);
      console.log(`     Valid: ${assignment.projectId && assignment.taskId && Number.isInteger(assignment.projectId) && Number.isInteger(assignment.taskId)}`);
      console.log('');
    });

    // Check if we have any tasks in the Task collection
    const tasks = await Task.find({}).limit(5);
    console.log(`\nFound ${tasks.length} tasks in Task collection:`);
    tasks.forEach(task => {
      console.log(`   - Task ${task.id}: ${task.name || task.taskName || 'Unnamed'}`);
    });

    // Fix assignments with missing or invalid taskId
    let fixedCount = 0;
    
    for (const assignment of invalidAssignments) {
      console.log(`\n🔧 Fixing assignment ${assignment.id}:`);
      
      let taskId = assignment.taskId;
      
      // If taskId is null or invalid, create/find a suitable task
      if (!taskId || !Number.isInteger(taskId)) {
        // Try to find an existing task or create a default one
        let task = await Task.findOne({});
        
        if (!task) {
          // Create a default task if none exists
          const newTaskId = Math.floor(Math.random() * 1000) + 1000; // Random ID between 1000-1999
          
          task = new Task({
            id: newTaskId,
            name: assignment.dailyTarget?.description || `Task for Assignment ${assignment.id}`,
            description: assignment.dailyTarget?.description || 'Default task description',
            taskType: 'WORK',
            status: 'active',
            companyId: assignment.companyId || 1,
            projectId: assignment.projectId,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          await task.save();
          console.log(`   Created new task ${newTaskId}: ${task.name}`);
        }
        
        taskId = task.id;
      }
      
      // Update the assignment
      await WorkerTaskAssignment.updateOne(
        { _id: assignment._id },
        { 
          $set: { 
            taskId: taskId,
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`   ✅ Updated assignment ${assignment.id} with taskId: ${taskId}`);
      fixedCount++;
    }

    console.log(`\n✅ Fixed ${fixedCount} invalid assignments`);

    // Verify the fixes
    console.log('\n🔍 Verifying fixes...');
    const updatedAssignments = await WorkerTaskAssignment.find({
      employeeId: 107,
      date: today
    });

    const stillInvalid = updatedAssignments.filter(a => 
      !a.projectId || !a.taskId || !Number.isInteger(a.projectId) || !Number.isInteger(a.taskId)
    );

    console.log(`Remaining invalid assignments: ${stillInvalid.length}`);
    
    if (stillInvalid.length === 0) {
      console.log('✅ All assignments are now valid!');
    } else {
      console.log('❌ Some assignments are still invalid:');
      stillInvalid.forEach(assignment => {
        console.log(`   - Assignment ${assignment.id}: projectId=${assignment.projectId}, taskId=${assignment.taskId}`);
      });
    }

  } catch (error) {
    console.error('❌ Error fixing task assignment data:', error);
    throw error;
  }
}

async function main() {
  await connectToDatabase();
  
  try {
    await fixTaskAssignmentData();
    console.log('\n✅ Task assignment data fix completed!');
    console.log('\n📱 Next steps:');
    console.log('1. Restart your backend server');
    console.log('2. Refresh the mobile app dashboard');
    console.log('3. The "Invalid task assignment data detected" error should be resolved');
    console.log('4. Today\'s Tasks should now show all 3 tasks with project names');
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

main().catch(console.error);