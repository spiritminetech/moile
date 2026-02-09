// Check today's fleet tasks and their passengers
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkTodaysPassengers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const fleetTasksCol = db.collection('fleetTasks');
    const passengersCol = db.collection('fleetTaskPassengers');

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('📅 Checking for today:', today.toLocaleDateString());
    console.log('─'.repeat(60));

    // Find all fleet tasks
    const allTasks = await fleetTasksCol.find({}).sort({ id: -1 }).limit(10).toArray();
    
    console.log(`\n📋 Found ${allTasks.length} recent fleet tasks\n`);

    for (const task of allTasks) {
      console.log(`\n🚛 Task ID: ${task.id}`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Driver ID: ${task.driverId}`);
      console.log(`   Created: ${task.createdAt}`);
      
      // Get passengers for this task
      const passengers = await passengersCol.find({ fleetTaskId: task.id }).toArray();
      
      console.log(`   Total Passengers: ${passengers.length}`);
      
      if (passengers.length > 0) {
        const checkedIn = passengers.filter(p => p.status === 'checked-in');
        console.log(`   ✅ Checked In: ${checkedIn.length}`);
        console.log(`   📊 Status breakdown:`);
        
        const statusCounts = {};
        passengers.forEach(p => {
          const status = p.status || 'NO_STATUS';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        Object.entries(statusCounts).forEach(([status, count]) => {
          console.log(`      ${status}: ${count}`);
        });
        
        console.log(`\n   Passenger Details:`);
        passengers.forEach((p, idx) => {
          console.log(`   ${idx + 1}. Worker ID: ${p.workerEmployeeId} | Status: ${p.status || 'NO_STATUS'}`);
          if (p.checkInTime) {
            console.log(`      Check-in Time: ${p.checkInTime}`);
          }
          if (p.checkInLocation) {
            console.log(`      Check-in Location: ${p.checkInLocation.latitude}, ${p.checkInLocation.longitude}`);
          }
        });
      }
    }

    // Summary
    const totalPassengers = await passengersCol.countDocuments();
    const checkedInPassengers = await passengersCol.countDocuments({ status: 'checked-in' });
    
    console.log('\n' + '═'.repeat(60));
    console.log('📊 DATABASE SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Total Passengers in DB: ${totalPassengers}`);
    console.log(`Total Checked-In: ${checkedInPassengers}`);
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkTodaysPassengers();
