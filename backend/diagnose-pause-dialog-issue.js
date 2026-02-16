// Diagnostic script to find why pause dialog is not appearing

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Task from './src/modules/task/Task.js';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';
import Attendance from './src/modules/attendance/Attendance.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function diagnose() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 DIAGNOSING PAUSE DIALOG ISSUE');
    console.log('='.repeat(80));

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find worker
    const user = await User.findOne({ email: 'worker@gmail.com' });
    if (!user) {
      console.log('\n❌ Worker user not found with email: worker@gmail.com');
      console.log('💡 Try finding any worker user...');
      
      const anyWorker = await User.findOne({ role: 'worker' });
      if (anyWorker) {
        console.log('✅ Found a worker:', anyWorker.email);
        console.log('   Use this email to login instead');
      }
      process.exit(1);
    }

    const employee = await Employee.findOne({ userId: user.id });
    if (!employee) {
      console.log('\n❌ Employee not found for user');
      process.exit(1);
    }

    console.log('\n👤 Worker Information:');
    console.log('   Email:', user.email);
    console.log('   User ID:', user.id);
    console.log('   Employee ID:', employee.id);
    console.log('   Name:', employee.fullName);

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log('\n📅 Today:', today);

    // Check attendance
    const todayStart = new Date(today + 'T00:00:00.000Z');
    const todayEnd = new Date(today + 'T23:59:59.999Z');
    
    const attendance = await Attendance.findOne({
      employeeId: employee.id,
      date: { $gte: todayStart, $lte: todayEnd }
    });

    console.log('\n📋 Attendance Status:');
    if (attendance) {
      console.log('   ✅ Attendance logged');
      console.log('   Check-in:', attendance.checkIn);
      console.log('   Status:', attendance.status);
    } else {
      console.log('   ❌ NO ATTENDANCE LOGGED');
      console.log('   ⚠️  Worker must check in before starting tasks');
      console.log('   💡 This will prevent task start, but not the dialog issue');
    }

    // Find all tasks for today
    const allTasks = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      date: today
    }).sort({ sequence: 1 });

    console.log('\n📊 Tasks for Today:', allTasks.length);

    if (allTasks.length === 0) {
      console.log('   ❌ NO TASKS ASSIGNED');
      console.log('   💡 Need to assign tasks first');
      process.exit(1);
    }

    // Display all tasks with status
    console.log('\n📝 Task List:');
    let activeTaskCount = 0;
    let activeTask = null;
    
    for (const task of allTasks) {
      const statusIcon = task.status === 'in_progress' ? '▶️' : 
                        task.status === 'paused' ? '⏸️' : 
                        task.status === 'completed' ? '✅' : '⏹️';
      
      console.log(`   ${statusIcon} ${task.sequence}. ${task.taskName}`);
      console.log(`      ID: ${task.id}`);
      console.log(`      Status: ${task.status}`);
      console.log(`      Task ID: ${task.taskId}`);
      
      if (task.status === 'in_progress') {
        activeTaskCount++;
        activeTask = task;
      }
      console.log('');
    }

    // CRITICAL CHECK: Is there an active task?
    console.log('\n' + '='.repeat(80));
    console.log('🎯 CRITICAL CHECK: ACTIVE TASK STATUS');
    console.log('='.repeat(80));
    
    console.log('\nActive Tasks Count:', activeTaskCount);
    
    if (activeTaskCount === 0) {
      console.log('\n❌ NO ACTIVE TASK FOUND');
      console.log('   This is why the dialog is NOT appearing!');
      console.log('');
      console.log('📝 TO FIX:');
      console.log('   1. Start one task first');
      console.log('   2. Then try to start another task');
      console.log('   3. Dialog should appear');
      console.log('');
      console.log('🔧 QUICK FIX - Setting first task to in_progress:');
      
      if (allTasks.length > 0) {
        const firstTask = allTasks[0];
        firstTask.status = 'in_progress';
        firstTask.startTime = new Date();
        await firstTask.save();
        
        console.log(`   ✅ Set "${firstTask.taskName}" to in_progress`);
        console.log('   Now try to start another task in the app');
        console.log('   Dialog should appear!');
      }
    } else if (activeTaskCount === 1) {
      console.log('\n✅ ONE ACTIVE TASK FOUND');
      console.log(`   Active Task: ${activeTask.taskName}`);
      console.log(`   Assignment ID: ${activeTask.id}`);
      console.log(`   Status: ${activeTask.status}`);
      console.log('');
      console.log('📱 TESTING SCENARIO:');
      console.log('   1. This task is currently active');
      console.log('   2. Try to start ANY OTHER task');
      console.log('   3. Dialog SHOULD appear');
      console.log('');
      console.log('🔍 IF DIALOG STILL NOT APPEARING:');
      console.log('   Check these:');
      console.log('   - Is backend running?');
      console.log('   - Check browser console for errors');
      console.log('   - Check network tab for API response');
      console.log('   - Try clearing app cache');
    } else {
      console.log('\n⚠️  MULTIPLE ACTIVE TASKS FOUND');
      console.log('   This should not happen!');
      console.log('   Fixing by keeping only the first one active...');
      
      for (let i = 1; i < allTasks.length; i++) {
        if (allTasks[i].status === 'in_progress') {
          allTasks[i].status = 'pending';
          await allTasks[i].save();
          console.log(`   Fixed: ${allTasks[i].taskName} → pending`);
        }
      }
    }

    // Test the backend validation logic
    console.log('\n' + '='.repeat(80));
    console.log('🧪 TESTING BACKEND VALIDATION LOGIC');
    console.log('='.repeat(80));

    if (allTasks.length >= 2) {
      const task1 = allTasks[0];
      const task2 = allTasks[1];

      console.log('\nScenario: Try to start Task 2 while Task 1 is active');
      console.log(`   Task 1: ${task1.taskName} (Status: ${task1.status})`);
      console.log(`   Task 2: ${task2.taskName} (Status: ${task2.status})`);

      // Simulate backend check
      const activeTaskCheck = await WorkerTaskAssignment.findOne({
        employeeId: employee.id,
        status: 'in_progress',
        id: { $ne: task2.id }
      });

      if (activeTaskCheck) {
        const activeTaskDetails = await Task.findOne({ id: activeTaskCheck.taskId });
        
        console.log('\n✅ Backend would detect active task:');
        console.log('   Active Task ID:', activeTaskCheck.id);
        console.log('   Active Task Name:', activeTaskDetails?.taskName || activeTaskCheck.taskName);
        console.log('');
        console.log('📤 Backend would return:');
        console.log(JSON.stringify({
          success: false,
          error: "ANOTHER_TASK_ACTIVE",
          message: "You have another task in progress",
          data: {
            activeTaskId: activeTaskCheck.id,
            activeTaskName: activeTaskDetails?.taskName || activeTaskCheck.taskName,
            requiresPause: true
          }
        }, null, 2));
        console.log('');
        console.log('📱 Frontend should show dialog:');
        console.log('   Title: "Another Task Active"');
        console.log(`   Message: "You are working on ${activeTaskDetails?.taskName}. Pause and start this task?"`);
        console.log('   Buttons: [Cancel] [Confirm]');
      } else {
        console.log('\n❌ Backend would NOT detect active task');
        console.log('   No dialog would appear');
        console.log('   Task would start normally (or fail for other reasons)');
      }
    }

    // Check frontend code
    console.log('\n' + '='.repeat(80));
    console.log('📱 FRONTEND CODE CHECK');
    console.log('='.repeat(80));
    
    console.log('\nThe dialog code is in:');
    console.log('   File: ConstructionERPMobile/src/screens/worker/TodaysTasksScreen.tsx');
    console.log('   Lines: 380-420');
    console.log('');
    console.log('The code checks for:');
    console.log('   if (response.error === "ANOTHER_TASK_ACTIVE") {');
    console.log('     Alert.alert("Another Task Active", ...)');
    console.log('   }');
    console.log('');
    console.log('🔍 Debug steps:');
    console.log('   1. Add console.log before Alert.alert');
    console.log('   2. Check if this code block is reached');
    console.log('   3. Check response.error value');
    console.log('   4. Check response.data.activeTaskName');

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📋 DIAGNOSIS SUMMARY');
    console.log('='.repeat(80));
    
    if (activeTaskCount === 0) {
      console.log('\n❌ ISSUE FOUND: No active task');
      console.log('   Solution: Start one task first, then try to start another');
      console.log('   Status: I just set the first task to active for you');
      console.log('   Action: Try starting another task in the app now');
    } else if (activeTaskCount === 1) {
      console.log('\n✅ Active task exists');
      console.log('   Backend validation should work');
      console.log('   Dialog should appear when starting another task');
      console.log('');
      console.log('   If dialog still not appearing:');
      console.log('   1. Check browser/app console for errors');
      console.log('   2. Check network tab - look for startTask API call');
      console.log('   3. Verify response has error: "ANOTHER_TASK_ACTIVE"');
      console.log('   4. Clear app cache and rebuild');
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ DIAGNOSIS COMPLETE');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
  }
}

diagnose();
