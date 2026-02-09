/**
 * Check Driver Tasks - Debug script
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DRIVER_ID = 50;

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

const fleetTaskSchema = new mongoose.Schema({
  id: Number,
  companyId: Number,
  driverId: Number,
  taskDate: Date,
  plannedPickupTime: Date,
  plannedDropTime: Date,
  pickupLocation: String,
  dropLocation: String,
  status: String,
});

const FleetTask = mongoose.model('FleetTask', fleetTaskSchema, 'fleetTasks');

async function checkTasks() {
  try {
    console.log('🔍 Checking tasks for driver', DRIVER_ID);
    console.log('─'.repeat(60));
    
    // Get all tasks for driver
    const allTasks = await FleetTask.find({ driverId: DRIVER_ID }).sort({ taskDate: -1 });
    
    console.log(`\n📊 Total tasks found: ${allTasks.length}\n`);
    
    if (allTasks.length === 0) {
      console.log('⚠️  No tasks found for driver', DRIVER_ID);
      return;
    }
    
    // Group by date
    const tasksByDate = {};
    allTasks.forEach(task => {
      const dateKey = task.taskDate.toISOString().split('T')[0];
      if (!tasksByDate[dateKey]) {
        tasksByDate[dateKey] = [];
      }
      tasksByDate[dateKey].push(task);
    });
    
    console.log('📅 Tasks by date:');
    console.log('─'.repeat(60));
    
    Object.keys(tasksByDate).sort().reverse().forEach(date => {
      const tasks = tasksByDate[date];
      console.log(`\n${date} (${tasks.length} tasks):`);
      tasks.forEach(task => {
        console.log(`  • Task ${task.id}: ${task.pickupLocation} → ${task.dropLocation}`);
        console.log(`    Status: ${task.status}`);
        console.log(`    Pickup: ${task.plannedPickupTime ? task.plannedPickupTime.toLocaleString() : 'N/A'}`);
      });
    });
    
    // Check what "today" means in different timezones
    console.log('\n' + '─'.repeat(60));
    console.log('🌍 Date Analysis:');
    console.log('─'.repeat(60));
    
    const now = new Date();
    console.log(`\nCurrent time (system): ${now.toLocaleString()}`);
    console.log(`Current time (ISO): ${now.toISOString()}`);
    console.log(`Current time (UTC): ${now.toUTCString()}`);
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    console.log(`\nToday start (local): ${todayStart.toLocaleString()}`);
    console.log(`Today start (ISO): ${todayStart.toISOString()}`);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    console.log(`\nToday end (local): ${todayEnd.toLocaleString()}`);
    console.log(`Today end (ISO): ${todayEnd.toISOString()}`);
    
    // Check tasks for today
    const todayTasks = await FleetTask.find({
      driverId: DRIVER_ID,
      taskDate: {
        $gte: todayStart,
        $lte: todayEnd
      }
    });
    
    console.log(`\n📌 Tasks for today (${todayStart.toISOString().split('T')[0]}): ${todayTasks.length}`);
    
    if (todayTasks.length > 0) {
      console.log('\nToday\'s tasks:');
      todayTasks.forEach(task => {
        console.log(`  • Task ${task.id}: ${task.pickupLocation} → ${task.dropLocation}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    await checkTasks();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n\n👋 Database connection closed');
    process.exit(0);
  }
}

main();
