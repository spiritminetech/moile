// Script to check actual database state for checked-in workers
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import models
import FleetTask from './src/modules/fleetTask/models/FleetTask.js';
import FleetTaskPassenger from './src/modules/fleetTask/submodules/fleetTaskPassenger/FleetTaskPassenger.js';
import Employee from './src/modules/employee/Employee.js';

async function checkCheckinCount() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log('📍 MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'NOT FOUND');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB\n');

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('📅 Checking for today:', today.toLocaleDateString());
    console.log('─'.repeat(60));

    // Find all fleet tasks for today
    const todaysTasks = await FleetTask.find({
      createdAt: { $gte: today, $lt: tomorrow }
    }).lean();

    console.log(`\n📋 Found ${todaysTasks.length} fleet tasks for today\n`);

    if (todaysTasks.length === 0) {
      console.log('⚠️  No tasks found for today. Checking all tasks...\n');
      
      // Check all tasks
      const allTasks = await FleetTask.find({}).sort({ id: -1 }).limit(10).lean();
      console.log(`📋 Found ${allTasks.length} recent tasks\n`);
      
      for (const task of allTasks) {
        console.log(`\n🚛 Task ID: ${task.id}`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Created: ${task.createdAt}`);
        console.log(`   Driver ID: ${task.driverId}`);
        
        // Get passengers for this task
        const passengers = await FleetTaskPassenger.find({
          fleetTaskId: task.id
        }).lean();
        
        console.log(`   Total Passengers: ${passengers.length}`);
        
        if (passengers.length > 0) {
          const checkedIn = passengers.filter(p => p.status === 'checked-in');
          console.log(`   ✅ Checked In: ${checkedIn.length}`);
          console.log(`   ⏳ Pending: ${passengers.filter(p => p.status !== 'checked-in').length}`);
          
          // Show first few passengers
          console.log(`\n   Passenger Details:`);
          passengers.slice(0, 5).forEach((p, idx) => {
            console.log(`   ${idx + 1}. Employee ID: ${p.employeeId} | Status: ${p.status || 'Pending'}`);
            if (p.checkInTime) {
              console.log(`      Check-in Time: ${p.checkInTime}`);
            }
            if (p.checkInLocation) {
              console.log(`      Check-in Location: ${p.checkInLocation.latitude}, ${p.checkInLocation.longitude}`);
            }
          });
          
          if (passengers.length > 5) {
            console.log(`   ... and ${passengers.length - 5} more passengers`);
          }
        }
      }
    } else {
      // Check today's tasks
      let totalWorkers = 0;
      let totalCheckedIn = 0;

      for (const task of todaysTasks) {
        console.log(`\n🚛 Task ID: ${task.id}`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Driver ID: ${task.driverId}`);
        console.log(`   Project ID: ${task.projectId}`);
        
        // Get passengers for this task
        const passengers = await FleetTaskPassenger.find({
          fleetTaskId: task.id
        }).lean();
        
        const checkedIn = passengers.filter(p => p.status === 'checked-in');
        
        console.log(`   Total Passengers: ${passengers.length}`);
        console.log(`   ✅ Checked In: ${checkedIn.length}`);
        console.log(`   ⏳ Pending: ${passengers.length - checkedIn.length}`);
        
        totalWorkers += passengers.length;
        totalCheckedIn += checkedIn.length;
        
        // Show passenger details
        if (passengers.length > 0) {
          console.log(`\n   Passenger Details:`);
          passengers.forEach((p, idx) => {
            console.log(`   ${idx + 1}. Employee ID: ${p.employeeId} | Status: ${p.status || 'Pending'}`);
            if (p.checkInTime) {
              console.log(`      Check-in Time: ${p.checkInTime}`);
            }
          });
        }
      }

      console.log('\n' + '═'.repeat(60));
      console.log(`📊 SUMMARY FOR TODAY`);
      console.log('═'.repeat(60));
      console.log(`Total Tasks: ${todaysTasks.length}`);
      console.log(`Total Workers: ${totalWorkers}`);
      console.log(`✅ Checked In: ${totalCheckedIn}`);
      console.log(`⏳ Pending: ${totalWorkers - totalCheckedIn}`);
      console.log(`📈 Check-in Rate: ${totalWorkers > 0 ? ((totalCheckedIn / totalWorkers) * 100).toFixed(1) : 0}%`);
      console.log('═'.repeat(60));
    }

    // Check for any passengers with status 'checked-in' regardless of date
    console.log('\n\n🔍 Checking ALL checked-in passengers in database...\n');
    const allCheckedIn = await FleetTaskPassenger.find({
      status: 'checked-in'
    }).lean();
    
    console.log(`Found ${allCheckedIn.length} total checked-in passengers in database`);
    
    if (allCheckedIn.length > 0) {
      console.log('\nRecent check-ins:');
      allCheckedIn.slice(0, 10).forEach((p, idx) => {
        console.log(`${idx + 1}. Task: ${p.fleetTaskId} | Employee: ${p.employeeId} | Time: ${p.checkInTime || 'N/A'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the check
checkCheckinCount();
