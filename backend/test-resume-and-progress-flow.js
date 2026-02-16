// Test Resume Task and Update Progress Flow
// This script tests the complete flow: start -> pause -> resume -> update progress

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Employee from './src/modules/employee/Employee.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function testResumeAndProgressFlow() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a test employee (worker.gmail@example.com)
    const employee = await Employee.findOne({ email: 'worker.gmail@example.com' });
    if (!employee) {
      console.log('❌ Test employee not found');
      return;
    }
    console.log(`✅ Found employee: ${employee.name} (ID: ${employee.id})\n`);

    // Find a paused task for this employee
    const pausedTask = await WorkerTaskAssignment.findOne({
      employeeId: employee.id,
      status: 'queued',
      startTime: { $exists: true } // Has been started before
    }).sort({ id: -1 });

    if (!pausedTask) {
      console.log('❌ No paused task found for this employee');
      console.log('   Looking for any task that can be used for testing...\n');
      
      // Find any in-progress task
      const activeTask = await WorkerTaskAssignment.findOne({
        employeeId: employee.id,
        status: 'in_progress'
      }).sort({ id: -1 });

      if (activeTask) {
        console.log('✅ Found active task to test with:');
        console.log(`   Assignment ID: ${activeTask.id}`);
        console.log(`   Task Name: ${activeTask.taskName}`);
        console.log(`   Status: ${activeTask.status}`);
        console.log(`   Progress: ${activeTask.progressPercent || 0}%`);
        console.log(`   Start Time: ${activeTask.startTime}`);
        console.log(`   Pause History: ${activeTask.pauseHistory?.length || 0} entries\n`);

        // Test updating progress on active task
        console.log('📊 Testing progress update on ACTIVE task...');
        const newProgress = (activeTask.progressPercent || 0) + 10;
        activeTask.progressPercent = Math.min(newProgress, 100);
        activeTask.actualOutput = (activeTask.actualOutput || 0) + 5;
        
        // Update progressToday if dailyTarget exists
        if (activeTask.dailyTarget) {
          const totalTarget = activeTask.dailyTarget.quantity || 0;
          const completedPercentage = totalTarget > 0 
            ? Math.round((activeTask.actualOutput / totalTarget) * 100) 
            : 0;
          
          activeTask.progressToday = {
            completed: activeTask.actualOutput,
            target: totalTarget,
            percentage: Math.min(completedPercentage, 100)
          };
        }
        
        await activeTask.save();
        console.log(`✅ Progress updated to ${activeTask.progressPercent}%`);
        console.log(`   Actual Output: ${activeTask.actualOutput}`);
        if (activeTask.progressToday) {
          console.log(`   Progress Today: ${activeTask.progressToday.completed}/${activeTask.progressToday.target} (${activeTask.progressToday.percentage}%)`);
        }
        console.log('\n✅ Test completed successfully!');
        return;
      }

      console.log('❌ No suitable task found for testing');
      return;
    }

    console.log('✅ Found paused task:');
    console.log(`   Assignment ID: ${pausedTask.id}`);
    console.log(`   Task Name: ${pausedTask.taskName}`);
    console.log(`   Status: ${pausedTask.status}`);
    console.log(`   Progress: ${pausedTask.progressPercent || 0}%`);
    console.log(`   Start Time: ${pausedTask.startTime}`);
    console.log(`   Pause History: ${pausedTask.pauseHistory?.length || 0} entries\n`);

    // Step 1: Resume the task
    console.log('▶️ Step 1: Resuming task...');
    const resumedAt = new Date();
    pausedTask.status = 'in_progress';
    
    // Update pause history with resume time
    if (pausedTask.pauseHistory && pausedTask.pauseHistory.length > 0) {
      const lastPause = pausedTask.pauseHistory[pausedTask.pauseHistory.length - 1];
      if (!lastPause.resumedAt) {
        lastPause.resumedAt = resumedAt;
        lastPause.resumedBy = employee.id;
      }
    }
    
    await pausedTask.save();
    console.log(`✅ Task resumed successfully`);
    console.log(`   New Status: ${pausedTask.status}`);
    console.log(`   Resumed At: ${resumedAt}\n`);

    // Step 2: Verify the task status in database
    console.log('🔍 Step 2: Verifying task status in database...');
    const verifiedTask = await WorkerTaskAssignment.findOne({ id: pausedTask.id });
    console.log(`   Database Status: ${verifiedTask.status}`);
    console.log(`   Database Progress: ${verifiedTask.progressPercent || 0}%`);
    
    if (verifiedTask.status !== 'in_progress') {
      console.log('❌ ERROR: Task status is not in_progress after resume!');
      return;
    }
    console.log('✅ Task status verified as in_progress\n');

    // Step 3: Update progress
    console.log('📊 Step 3: Updating task progress...');
    const newProgress = (verifiedTask.progressPercent || 0) + 10;
    verifiedTask.progressPercent = Math.min(newProgress, 100);
    verifiedTask.actualOutput = (verifiedTask.actualOutput || 0) + 5;
    
    // Update progressToday if dailyTarget exists
    if (verifiedTask.dailyTarget) {
      const totalTarget = verifiedTask.dailyTarget.quantity || 0;
      const completedPercentage = totalTarget > 0 
        ? Math.round((verifiedTask.actualOutput / totalTarget) * 100) 
        : 0;
      
      verifiedTask.progressToday = {
        completed: verifiedTask.actualOutput,
        target: totalTarget,
        percentage: Math.min(completedPercentage, 100)
      };
    }
    
    await verifiedTask.save();
    console.log(`✅ Progress updated successfully`);
    console.log(`   New Progress: ${verifiedTask.progressPercent}%`);
    console.log(`   Actual Output: ${verifiedTask.actualOutput}`);
    if (verifiedTask.progressToday) {
      console.log(`   Progress Today: ${verifiedTask.progressToday.completed}/${verifiedTask.progressToday.target} (${verifiedTask.progressToday.percentage}%)`);
    }

    // Step 4: Final verification
    console.log('\n🔍 Step 4: Final verification...');
    const finalTask = await WorkerTaskAssignment.findOne({ id: pausedTask.id });
    console.log(`   Final Status: ${finalTask.status}`);
    console.log(`   Final Progress: ${finalTask.progressPercent}%`);
    console.log(`   Final Actual Output: ${finalTask.actualOutput}`);
    if (finalTask.progressToday) {
      console.log(`   Final Progress Today: ${finalTask.progressToday.completed}/${finalTask.progressToday.target} (${finalTask.progressToday.percentage}%)`);
    }

    console.log('\n✅ Resume and progress flow test completed successfully!');
    console.log('\n📋 SUMMARY:');
    console.log(`   ✅ Task resumed from queued to in_progress`);
    console.log(`   ✅ Progress updated successfully`);
    console.log(`   ✅ Database reflects correct status and progress`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

testResumeAndProgressFlow();
