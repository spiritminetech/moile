/**
 * Update Driver Transport Tasks to Today's Date
 * This script updates existing transport tasks to today's date
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DRIVER_ID = 50;

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

// Define FleetTask Schema
const fleetTaskSchema = new mongoose.Schema({
  id: Number,
  companyId: Number,
  projectId: Number,
  driverId: Number,
  vehicleId: Number,
  taskDate: Date,
  plannedPickupTime: Date,
  plannedDropTime: Date,
  pickupLocation: String,
  pickupAddress: String,
  dropLocation: String,
  dropAddress: String,
  expectedPassengers: Number,
  actualStartTime: Date,
  actualEndTime: Date,
  routeLog: Array,
  status: String,
  notes: String,
  createdBy: Number,
  createdAt: Date,
  updatedAt: Date,
});

const FleetTask = mongoose.model('FleetTask', fleetTaskSchema, 'fleetTasks');

async function updateTasksToToday() {
  try {
    console.log('\n🔄 Updating transport tasks to today\'s date...');
    
    // Get today's date in UTC (same as backend)
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    
    console.log(`📅 Today's date (UTC): ${today.toISOString()}`);
    console.log(`📅 Today's date (Local): ${today.toLocaleString()}`);
    
    // Find all tasks for driver 50
    const tasks = await FleetTask.find({ driverId: DRIVER_ID });
    
    console.log(`📊 Found ${tasks.length} tasks for driver ${DRIVER_ID}`);
    
    if (tasks.length === 0) {
      console.log('\n⚠️  No tasks found. Creating new tasks for today...');
      await createTasksForToday(today);
      return;
    }
    
    // Update each task to today's date
    for (const task of tasks) {
      const oldDate = new Date(task.taskDate);
      
      // Calculate time offset from midnight
      const pickupTime = task.plannedPickupTime ? new Date(task.plannedPickupTime) : null;
      const dropTime = task.plannedDropTime ? new Date(task.plannedDropTime) : null;
      
      let pickupHour = 7;
      let pickupMinute = 0;
      let dropHour = 8;
      let dropMinute = 0;
      
      if (pickupTime) {
        pickupHour = pickupTime.getUTCHours();
        pickupMinute = pickupTime.getUTCMinutes();
      }
      
      if (dropTime) {
        dropHour = dropTime.getUTCHours();
        dropMinute = dropTime.getUTCMinutes();
      }
      
      // Create new dates for today in UTC
      const newPickupTime = new Date(today);
      newPickupTime.setUTCHours(pickupHour, pickupMinute, 0, 0);
      
      const newDropTime = new Date(today);
      newDropTime.setUTCHours(dropHour, dropMinute, 0, 0);
      
      // Update the task
      task.taskDate = today;
      task.plannedPickupTime = newPickupTime;
      task.plannedDropTime = newDropTime;
      task.status = 'PLANNED';
      task.actualStartTime = null;
      task.actualEndTime = null;
      task.updatedAt = new Date();
      
      await task.save();
      
      console.log(`✅ Updated task ${task.id}: ${task.pickupLocation} → ${task.dropLocation}`);
      console.log(`   Old date: ${oldDate.toISOString()}`);
      console.log(`   New date: ${today.toISOString()}`);
      console.log(`   Pickup time: ${newPickupTime.toLocaleTimeString()}`);
      console.log(`   Drop time: ${newDropTime.toLocaleTimeString()}`);
    }
    
    console.log('\n✅ All tasks updated to today\'s date!');
    
  } catch (error) {
    console.error('❌ Error updating tasks:', error);
    throw error;
  }
}

async function createTasksForToday(today) {
  const tasks = [
    {
      id: 10001,
      companyId: 1,
      projectId: 201,
      driverId: DRIVER_ID,
      vehicleId: 101,
      taskDate: today,
      plannedPickupTime: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 1, 30, 0, 0)), // 7:00 AM IST = 1:30 AM UTC
      plannedDropTime: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 2, 30, 0, 0)), // 8:00 AM IST = 2:30 AM UTC
      pickupLocation: 'Worker Dormitory A',
      pickupAddress: '123 Main St, City',
      dropLocation: 'Construction Site Alpha',
      dropAddress: '456 Project Rd, City',
      expectedPassengers: 10,
      status: 'PLANNED',
      notes: 'Morning pickup - Site Alpha Development',
      createdBy: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 10002,
      companyId: 1,
      projectId: 201,
      driverId: DRIVER_ID,
      vehicleId: 101,
      taskDate: today,
      plannedPickupTime: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 2, 0, 0, 0)), // 7:30 AM IST = 2:00 AM UTC
      plannedDropTime: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 3, 0, 0, 0)), // 8:30 AM IST = 3:00 AM UTC
      pickupLocation: 'Worker Dormitory B',
      pickupAddress: '789 Second Ave, City',
      dropLocation: 'Construction Site Alpha',
      dropAddress: '456 Project Rd, City',
      expectedPassengers: 8,
      status: 'PLANNED',
      notes: 'Morning pickup - Site Alpha Development',
      createdBy: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 10003,
      companyId: 1,
      projectId: 201,
      driverId: DRIVER_ID,
      vehicleId: 101,
      taskDate: today,
      plannedPickupTime: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 11, 30, 0, 0)), // 5:00 PM IST = 11:30 AM UTC
      plannedDropTime: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12, 30, 0, 0)), // 6:00 PM IST = 12:30 PM UTC
      pickupLocation: 'Construction Site Alpha',
      pickupAddress: '456 Project Rd, City',
      dropLocation: 'Worker Dormitory A',
      dropAddress: '123 Main St, City',
      expectedPassengers: 10,
      status: 'PLANNED',
      notes: 'Evening drop - Return to dormitory',
      createdBy: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const task of tasks) {
    await FleetTask.findOneAndUpdate(
      { id: task.id },
      task,
      { upsert: true, new: true }
    );
    console.log(`✅ Created task ${task.id}: ${task.pickupLocation} → ${task.dropLocation}`);
  }
}

async function main() {
  console.log('🚀 Starting Task Date Update Script...');
  console.log(`🔑 Driver ID: ${DRIVER_ID}`);
  console.log('─'.repeat(60));

  try {
    await connectDB();
    await updateTasksToToday();

    console.log('\n' + '─'.repeat(60));
    console.log('✅ Task update completed successfully!');
    console.log('\n📱 You can now refresh your mobile app to see today\'s tasks');
    console.log('─'.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

main();
