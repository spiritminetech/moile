import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function debugTodaysTaskDateIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const employeeId = 2;
    
    // Check what date the backend would use
    const backendDate = new Date().toISOString().split("T")[0];
    console.log('📅 Date Comparison:');
    console.log('   Backend calculates today as:', backendDate);
    console.log('   Your task has date:', '2026-02-16');
    console.log('   Match:', backendDate === '2026-02-16' ? '✅ YES' : '❌ NO');
    console.log('');

    // Check current system date/time
    const now = new Date();
    console.log('🕐 System Date/Time:');
    console.log('   Full ISO:', now.toISOString());
    console.log('   Date only:', now.toISOString().split("T")[0]);
    console.log('   Local string:', now.toLocaleString());
    console.log('   Timezone offset:', now.getTimezoneOffset(), 'minutes');
    console.log('');

    // Query 1: Find the task you mentioned
    console.log('🔍 Query 1: Looking for the specific task (ID: 7059)...');
    const specificTask = await WorkerTaskAssignment.findOne({ id: 7059 });
    if (specificTask) {
      console.log('✅ Found task:');
      console.log('   ID:', specificTask.id);
      console.log('   Task Name:', specificTask.taskName || specificTask.dailyTarget?.description);
      console.log('   Employee ID:', specificTask.employeeId);
      console.log('   Date:', specificTask.date);
      console.log('   Date Type:', typeof specificTask.date);
      console.log('   Status:', specificTask.status);
    } else {
      console.log('❌ Task 7059 not found');
    }
    console.log('');

    // Query 2: Find all tasks for employee 2 with date "2026-02-16"
    console.log('🔍 Query 2: All tasks for employee 2 with date "2026-02-16"...');
    const tasksWithExactDate = await WorkerTaskAssignment.find({
      employeeId: employeeId,
      date: "2026-02-16"
    });
    console.log(`   Found ${tasksWithExactDate.length} tasks`);
    tasksWithExactDate.forEach((task, i) => {
      console.log(`   ${i+1}. ID: ${task.id}, Date: ${task.date}, Status: ${task.status}`);
    });
    console.log('');

    // Query 3: Find all tasks for employee 2 with backend's calculated date
    console.log(`🔍 Query 3: All tasks for employee 2 with date "${backendDate}"...`);
    const tasksWithBackendDate = await WorkerTaskAssignment.find({
      employeeId: employeeId,
      date: backendDate
    });
    console.log(`   Found ${tasksWithBackendDate.length} tasks`);
    tasksWithBackendDate.forEach((task, i) => {
      console.log(`   ${i+1}. ID: ${task.id}, Date: ${task.date}, Status: ${task.status}`);
    });
    console.log('');

    // Query 4: Find ALL tasks for employee 2 regardless of date
    console.log('🔍 Query 4: ALL tasks for employee 2 (any date)...');
    const allTasks = await WorkerTaskAssignment.find({ employeeId: employeeId })
      .sort({ date: -1 })
      .limit(10);
    console.log(`   Found ${allTasks.length} tasks (showing last 10)`);
    allTasks.forEach((task, i) => {
      console.log(`   ${i+1}. ID: ${task.id}, Date: ${task.date}, Status: ${task.status}`);
    });
    console.log('');

    // Diagnosis
    console.log('🔬 DIAGNOSIS:');
    console.log('='.repeat(80));
    if (backendDate !== '2026-02-16') {
      console.log('❌ DATE MISMATCH DETECTED!');
      console.log('   The backend is looking for tasks with date:', backendDate);
      console.log('   But your task has date: 2026-02-16');
      console.log('');
      console.log('💡 SOLUTION:');
      console.log('   Your system date might be incorrect, or there\'s a timezone issue.');
      console.log('   The task was created for 2026-02-16, but the backend is querying');
      console.log(`   for ${backendDate} based on the current system time.`);
      console.log('');
      console.log('   Options:');
      console.log('   1. Update the task date to match today\'s date');
      console.log('   2. Check your system date/time settings');
      console.log('   3. Check if there\'s a timezone configuration issue');
    } else {
      console.log('✅ Dates match! The issue might be elsewhere.');
      console.log('   Checking other possibilities...');
      console.log('');
      if (tasksWithExactDate.length === 0) {
        console.log('❌ No tasks found for employee 2 with date 2026-02-16');
        console.log('   The task might not have been saved correctly.');
      } else {
        console.log('✅ Tasks exist for the correct date.');
        console.log('   The issue might be in the mobile app or API response.');
      }
    }
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

debugTodaysTaskDateIssue();
