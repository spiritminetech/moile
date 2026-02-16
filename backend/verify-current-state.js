import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Attendance from './src/modules/attendance/Attendance.js';

dotenv.config();

async function verifyCurrentState() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('=' .repeat(70));
    console.log('📅 CURRENT STATE FOR EMPLOYEE 2 (Ravi Smith / worker@gmail.com)');
    console.log('=' .repeat(70) + '\n');

    // 1. Check Attendance
    console.log('1️⃣  ATTENDANCE STATUS:');
    console.log('-' .repeat(70));
    const attendance = await Attendance.findOne({
      employeeId: 2,
      date: { $gte: new Date('2026-02-15T00:00:00.000Z'), $lte: new Date('2026-02-15T23:59:59.999Z') }
    }).lean();

    if (attendance) {
      console.log(`   ✅ Checked in at: ${new Date(attendance.checkInTime).toLocaleString()}`);
      console.log(`   Status: ${attendance.status}`);
      console.log(`   Location: ${attendance.checkInLocation?.coordinates?.join(', ')}`);
      console.log(`   Project ID: ${attendance.projectId}`);
    } else {
      console.log('   ❌ Not checked in today');
    }

    // 2. Check Tasks
    console.log('\n2️⃣  TASK ASSIGNMENTS (Date: 2026-02-15):');
    console.log('-' .repeat(70));
    
    // Query using string date since that's how it's stored
    const tasks = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: '2026-02-15'
    }).sort({ id: 1 }).lean();

    console.log(`   Found ${tasks.length} tasks\n`);

    if (tasks.length > 0) {
      tasks.forEach((task, index) => {
        const statusEmoji = task.status === 'in_progress' ? '🔄' : 
                           task.status === 'queued' ? '⏳' : 
                           task.status === 'completed' ? '✅' : '❓';
        
        console.log(`   ${statusEmoji} Task ${index + 1}: Assignment ID ${task.id}`);
        console.log(`      Task ID: ${task.taskId}`);
        console.log(`      Status: ${task.status}`);
        console.log(`      Project: ${task.projectId}`);
        console.log(`      Supervisor: ${task.supervisorId}`);
        if (task.startTime) {
          console.log(`      Started: ${new Date(task.startTime).toLocaleString()}`);
        }
        console.log('');
      });

      // Summary
      const statusCounts = tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {});

      console.log('   ' + '-' .repeat(66));
      console.log('   📊 Summary:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`      ${status}: ${count}`);
      });
    }

    console.log('\n' + '=' .repeat(70));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('=' .repeat(70));
    console.log('\n📱 Ready to test in mobile app:');
    console.log('   Login: worker@gmail.com / password123');
    console.log('   ⚠️  RESTART BACKEND SERVER to see changes in API');
    console.log('=' .repeat(70));

    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

verifyCurrentState();
