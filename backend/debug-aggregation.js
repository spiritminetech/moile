/**
 * Debug the aggregation step by step
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FleetTaskPassenger from './src/modules/fleetTask/submodules/fleetTaskPassenger/FleetTaskPassenger.js';

dotenv.config();

async function debugAggregation() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const taskId = 10003;
    const taskIds = [taskId];

    console.log('Step 1: Get passengers');
    console.log('═'.repeat(60));
    const step1 = await FleetTaskPassenger.aggregate([
      { $match: { fleetTaskId: { $in: taskIds } } }
    ]);
    console.log('Passengers found:', step1.length);
    console.log('First passenger:', JSON.stringify(step1[0], null, 2));

    console.log('\nStep 2: Lookup FleetTask');
    console.log('═'.repeat(60));
    const step2 = await FleetTaskPassenger.aggregate([
      { $match: { fleetTaskId: { $in: taskIds } } },
      {
        $lookup: {
          from: 'fleetTasks',
          localField: 'fleetTaskId',
          foreignField: 'id',
          as: 'task'
        }
      }
    ]);
    console.log('After FleetTask lookup:', step2.length);
    console.log('First result:', JSON.stringify(step2[0], null, 2));

    console.log('\nStep 3: Unwind task');
    console.log('═'.repeat(60));
    const step3 = await FleetTaskPassenger.aggregate([
      { $match: { fleetTaskId: { $in: taskIds } } },
      {
        $lookup: {
          from: 'fleetTasks',
          localField: 'fleetTaskId',
          foreignField: 'id',
          as: 'task'
        }
      },
      { $unwind: '$task' }
    ]);
    console.log('After unwind:', step3.length);
    console.log('First result task.projectId:', step3[0]?.task?.projectId);
    console.log('First result workerEmployeeId:', step3[0]?.workerEmployeeId);

    console.log('\nStep 4: Lookup Attendance');
    console.log('═'.repeat(60));
    const step4 = await FleetTaskPassenger.aggregate([
      { $match: { fleetTaskId: { $in: taskIds } } },
      {
        $lookup: {
          from: 'fleetTasks',
          localField: 'fleetTaskId',
          foreignField: 'id',
          as: 'task'
        }
      },
      { $unwind: '$task' },
      {
        $lookup: {
          from: 'attendances',
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
      }
    ]);
    console.log('After attendance lookup:', step4.length);
    console.log('First result attendance array length:', step4[0]?.attendance?.length);
    if (step4[0]?.attendance?.length > 0) {
      console.log('Attendance found:', JSON.stringify(step4[0].attendance[0], null, 2));
    } else {
      console.log('❌ No attendance matched!');
      console.log('Variables used in lookup:');
      console.log('  employeeId:', step4[0]?.workerEmployeeId);
      console.log('  projectId:', step4[0]?.task?.projectId);
    }

    console.log('\nStep 5: Filter only matched');
    console.log('═'.repeat(60));
    const step5 = await FleetTaskPassenger.aggregate([
      { $match: { fleetTaskId: { $in: taskIds } } },
      {
        $lookup: {
          from: 'fleetTasks',
          localField: 'fleetTaskId',
          foreignField: 'id',
          as: 'task'
        }
      },
      { $unwind: '$task' },
      {
        $lookup: {
          from: 'attendances',
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
      { $match: { 'attendance.0': { $exists: true } } }
    ]);
    console.log('After filtering (attendance exists):', step5.length);

    console.log('\nStep 6: Group and count');
    console.log('═'.repeat(60));
    const step6 = await FleetTaskPassenger.aggregate([
      { $match: { fleetTaskId: { $in: taskIds } } },
      {
        $lookup: {
          from: 'fleetTasks',
          localField: 'fleetTaskId',
          foreignField: 'id',
          as: 'task'
        }
      },
      { $unwind: '$task' },
      {
        $lookup: {
          from: 'attendances',
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
      { $match: { 'attendance.0': { $exists: true } } },
      { $group: { _id: "$fleetTaskId", count: { $sum: 1 } } }
    ]);
    console.log('Final count:', step6[0]?.count || 0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugAggregation();
