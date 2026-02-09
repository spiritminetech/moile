/**
 * Test what the API actually returns
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FleetTask from './src/modules/fleetTask/models/FleetTask.js';
import FleetTaskPassenger from './src/modules/fleetTask/submodules/fleetTaskPassenger/FleetTaskPassenger.js';
import FleetVehicle from './src/modules/fleetTask/submodules/fleetvehicle/FleetVehicle.js';
import Project from './src/modules/project/models/Project.js';
import Employee from './src/modules/employee/Employee.js';

dotenv.config();

async function testApiResponse() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // Simulate the getTodaysTasks function
    const driverId = 50;
    const companyId = 1;

    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    console.log('📅 Fetching tasks for today:', now.toISOString().split('T')[0]);
    console.log('   Driver ID:', driverId);
    console.log('   Company ID:', companyId);
    console.log('');

    const tasks = await FleetTask.find({
      driverId,
      companyId,
      taskDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).lean();

    console.log('📊 Found', tasks.length, 'tasks');
    console.log('');

    if (tasks.length === 0) {
      console.log('❌ No tasks found for today!');
      console.log('   This might be why the UI shows 0.');
      console.log('');
      console.log('🔍 Checking all tasks for this driver...');
      const allTasks = await FleetTask.find({ driverId, companyId }).lean();
      console.log('   Total tasks for driver:', allTasks.length);
      if (allTasks.length > 0) {
        console.log('   Task dates:');
        allTasks.forEach(t => {
          console.log('     Task', t.id, '- Date:', new Date(t.taskDate).toISOString().split('T')[0]);
        });
      }
      await mongoose.connection.close();
      return;
    }

    const projectIds = [...new Set(tasks.map(t => t.projectId))];
    const vehicleIds = [...new Set(tasks.map(t => t.vehicleId))];
    const taskIds = tasks.map(t => t.id);

    console.log('🔍 Task IDs:', taskIds);
    console.log('');

    const [projects, vehicles, passengerCounts, checkedInCounts, driver] = await Promise.all([
      Project.find({ id: { $in: projectIds } }).lean(),
      FleetVehicle.find({ id: { $in: vehicleIds } }).lean(),
      FleetTaskPassenger.aggregate([
        { $match: { fleetTaskId: { $in: taskIds } } },
        { $group: { _id: "$fleetTaskId", count: { $sum: 1 } } }
      ]),
      // Count checked-in workers
      FleetTaskPassenger.aggregate([
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
            from: 'attendance',
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
      ]),
      Employee.findOne({ id: driverId, companyId }).lean()
    ]);

    const projectMap = Object.fromEntries(projects.map(p => [p.id, p]));
    const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));
    const passengerCountMap = Object.fromEntries(passengerCounts.map(p => [p._id, p.count]));
    const checkedInCountMap = Object.fromEntries(checkedInCounts.map(p => [p._id, p.count]));

    console.log('📊 Aggregation Results:');
    console.log('   Passenger counts:', passengerCounts);
    console.log('   Checked-in counts:', checkedInCounts);
    console.log('');

    const formatTime = (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    };

    const taskList = tasks.map(task => ({
      taskId: task.id,
      projectName: projectMap[task.projectId]?.projectName || 'Unknown Project',
      startTime: formatTime(task.plannedPickupTime),
      endTime: formatTime(task.plannedDropTime),
      vehicleNumber: vehicleMap[task.vehicleId]?.registrationNo || 'N/A',
      passengers: passengerCountMap[task.id] || 0,
      totalWorkers: passengerCountMap[task.id] || 0,
      checkedInWorkers: checkedInCountMap[task.id] || 0,
      status: task.status,
      pickupLocation: task.pickupAddress || task.pickupLocation || 'Location not specified',
      dropLocation: task.dropAddress || task.dropLocation || 'Location not specified',
      driverName: driver?.fullName || 'Unknown Driver',
      driverPhone: driver?.phone || 'Not available',
      driverPhoto: driver?.photoUrl || driver?.photo_url || null,
      employeeId: driver?.id || null
    }));

    console.log('═'.repeat(70));
    console.log('📤 API RESPONSE (what mobile app receives):');
    console.log('═'.repeat(70));
    console.log(JSON.stringify({
      success: true,
      message: `Found ${taskList.length} tasks for today`,
      data: taskList
    }, null, 2));
    console.log('═'.repeat(70));

    console.log('\n📱 Mobile App Will Display:');
    taskList.forEach(task => {
      console.log(`\nTask #${task.taskId}:`);
      console.log(`  Total Workers: ${task.totalWorkers}`);
      console.log(`  Checked In: ${task.checkedInWorkers}`);
      console.log(`  Status: ${task.status}`);
    });

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testApiResponse();
