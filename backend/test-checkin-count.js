/**
 * Test the driver checked-in count fix
 * Run from moile/backend directory: node test-checkin-count.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FleetTask from './src/modules/fleetTask/models/FleetTask.js';
import FleetTaskPassenger from './src/modules/fleetTask/submodules/fleetTaskPassenger/FleetTaskPassenger.js';
import Attendance from './src/modules/attendance/Attendance.js';

dotenv.config();

async function testCheckedInCount() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const taskId = 10003;
    const taskIds = [taskId];

    console.log('📊 Testing Aggregation Query for Task', taskId);
    console.log('═'.repeat(60));

    // Test the EXACT query from getTodaysTasks
    const checkedInCounts = await FleetTaskPassenger.aggregate([
      { $match: { fleetTaskId: { $in: taskIds } } },
      // First, lookup the FleetTask to get projectId
      {
        $lookup: {
          from: 'fleetTasks',
          localField: 'fleetTaskId',
          foreignField: 'id',
          as: 'task'
        }
      },
      { $unwind: '$task' },
      // Then lookup attendance records
      {
        $lookup: {
          from: 'attendance',  // Fixed: singular
          let: { employeeId: '$workerEmployeeId', projectId: '$task.projectId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$employeeId', '$$employeeId'] },
                    { $eq: ['$projectId', '$$projectId'] },
                    { $ne: ['$checkIn', null] }
                  ]
                }
              }
            }
          ],
          as: 'attendance'
        }
      },
      // Only count workers who have attendance with checkIn
      { $match: { 'attendance.0': { $exists: true } } },
      { $group: { _id: "$fleetTaskId", count: { $sum: 1 } } }
    ]);

    const checkedInCount = checkedInCounts[0]?.count || 0;

    console.log('\n📊 RESULT:');
    console.log('═'.repeat(60));
    console.log(`Task ID: ${taskId}`);
    console.log(`Checked-In Workers: ${checkedInCount}`);
    console.log('═'.repeat(60));

    if (checkedInCount > 0) {
      console.log('\n✅ SUCCESS! The fix is working correctly.');
      console.log('   Workers with attendance check-in are being counted.');
      console.log('\n🎯 Next Steps:');
      console.log('   1. Restart your backend server');
      console.log('   2. Refresh the mobile app');
      console.log('   3. Check the Driver Dashboard');
    } else {
      console.log('\n⚠️  Still showing 0. Let me check the data...\n');
      
      // Debug: Check passengers
      const passengers = await FleetTaskPassenger.find({ fleetTaskId: taskId }).lean();
      console.log(`🔍 Debug Info:`);
      console.log(`   Total passengers for task ${taskId}: ${passengers.length}`);
      
      if (passengers.length > 0) {
        console.log(`   First passenger employeeId: ${passengers[0].workerEmployeeId}`);
        
        // Check task
        const task = await FleetTask.findOne({ id: taskId }).lean();
        console.log(`   Task projectId: ${task?.projectId || 'NOT FOUND'}`);
        
        // Check attendance
        if (task) {
          const attendance = await Attendance.findOne({
            employeeId: passengers[0].workerEmployeeId,
            projectId: task.projectId
          }).lean();
          
          console.log(`   Attendance record found: ${attendance ? 'YES' : 'NO'}`);
          if (attendance) {
            console.log(`   Has checkIn: ${attendance.checkIn ? 'YES' : 'NO'}`);
            if (attendance.checkIn) {
              console.log(`   checkIn timestamp: ${attendance.checkIn}`);
            }
          } else {
            console.log(`   ❌ No attendance record for employeeId: ${passengers[0].workerEmployeeId}, projectId: ${task.projectId}`);
          }
        }
      } else {
        console.log(`   ❌ No passengers found for task ${taskId}`);
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testCheckedInCount();
