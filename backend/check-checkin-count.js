/**
 * Check how many workers are checked-in today
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Import models
import FleetTask from './src/modules/fleetTask/models/FleetTask.js';
import FleetTaskPassenger from './src/modules/fleetTask/submodules/fleetTaskPassenger/FleetTaskPassenger.js';
import Employee from './src/models/Employee.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    console.log('✅ Connected to MongoDB\n');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

const checkCheckinCount = async () => {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Checking Worker Check-In Status');
    console.log('═══════════════════════════════════════════════════════\n');

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('📅 Date Range:');
    console.log(`   From: ${today.toISOString()}`);
    console.log(`   To: ${tomorrow.toISOString()}\n`);

    // Find today's tasks for driver 50
    const todaysTasks = await FleetTask.find({
      driverId: 50,
      companyId: 1,
      taskDate: {
        $gte: today,
        $lt: tomorrow
      }
    }).lean();

    console.log(`📋 Found ${todaysTasks.length} tasks for driver 50 today\n`);

    if (todaysTasks.length === 0) {
      console.log('⚠️ No tasks found for today');
      return;
    }

    // Get task IDs
    const taskIds = todaysTasks.map(t => t.id);
    console.log('📌 Task IDs:', taskIds.join(', '), '\n');

    // Get all passengers for these tasks
    const allPassengers = await FleetTaskPassenger.find({
      fleetTaskId: { $in: taskIds }
    }).lean();

    console.log(`👥 Total passengers across all tasks: ${allPassengers.length}\n`);

    // Count by status
    const statusCounts = {};
    allPassengers.forEach(p => {
      const status = p.status || 'no-status';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('📊 Status Breakdown:');
    console.log('═══════════════════════════════════════════════════════');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    console.log('═══════════════════════════════════════════════════════\n');

    // Count checked-in workers
    const checkedInWorkers = allPassengers.filter(p => p.status === 'checked-in');
    console.log(`✅ Checked-In Workers: ${checkedInWorkers.length}\n`);

    if (checkedInWorkers.length > 0) {
      console.log('📋 Checked-In Worker Details:');
      console.log('═══════════════════════════════════════════════════════');
      
      for (const passenger of checkedInWorkers) {
        const employee = await Employee.findOne({ id: passenger.employeeId }).lean();
        console.log(`   Worker ID: ${passenger.employeeId}`);
        console.log(`   Name: ${employee?.fullName || 'Unknown'}`);
        console.log(`   Task ID: ${passenger.fleetTaskId}`);
        console.log(`   Status: ${passenger.status}`);
        console.log(`   Check-In Time: ${passenger.checkInTime || 'Not set'}`);
        console.log('   ---');
      }
      console.log('═══════════════════════════════════════════════════════\n');
    }

    // Show per-task breakdown
    console.log('📊 Per-Task Breakdown:');
    console.log('═══════════════════════════════════════════════════════');
    
    for (const task of todaysTasks) {
      const taskPassengers = allPassengers.filter(p => p.fleetTaskId === task.id);
      const taskCheckedIn = taskPassengers.filter(p => p.status === 'checked-in').length;
      
      console.log(`\nTask ID: ${task.id}`);
      console.log(`   Route: ${task.route || 'N/A'}`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Total Workers: ${taskPassengers.length}`);
      console.log(`   Checked-In: ${taskCheckedIn}`);
      console.log(`   Pending: ${taskPassengers.length - taskCheckedIn}`);
    }
    console.log('\n═══════════════════════════════════════════════════════');

    // Summary
    console.log('\n📊 SUMMARY FOR DRIVER 50 TODAY:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`   Total Tasks: ${todaysTasks.length}`);
    console.log(`   Total Workers: ${allPassengers.length}`);
    console.log(`   Checked-In: ${checkedInWorkers.length}`);
    console.log(`   Pending: ${allPassengers.length - checkedInWorkers.length}`);
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
};

const main = async () => {
  await connectDB();
  await checkCheckinCount();
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB\n');
};

main();
