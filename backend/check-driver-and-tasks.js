import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false }), 'employees');
const FleetTask = mongoose.model('FleetTask', new mongoose.Schema({}, { strict: false }), 'fleettasks');

async function checkDriverAndTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find driver user
    const driverUser = await User.findOne({ email: 'driver1@gmail.com' });
    if (!driverUser) {
      console.log('❌ Driver user not found');
      return;
    }
    
    console.log('👤 Driver User:');
    console.log(`   Email: ${driverUser.email}`);
    console.log(`   User ID: ${driverUser._id}`);

    // Find employee
    const driverEmployee = await Employee.findOne({ userId: driverUser._id });
    if (!driverEmployee) {
      console.log('❌ No employee record found');
      return;
    }

    console.log('\n👷 Driver Employee:');
    console.log(`   Name: ${driverEmployee.name}`);
    console.log(`   EmployeeID: ${driverEmployee.employeeId}`);
    console.log(`   Email: ${driverEmployee.email}`);
    console.log(`   Role: ${driverEmployee.role}`);
    console.log(`   Company ID: ${driverEmployee.companyId}`);

    // Check for tasks
    console.log('\n📋 Checking for tasks...');
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Try to find tasks by employeeId
    const tasksByEmployeeId = await FleetTask.find({
      driverId: driverEmployee.employeeId,
      taskDate: { $gte: startOfDay, $lte: endOfDay }
    });

    console.log(`\n🔍 Tasks found by employeeId (${driverEmployee.employeeId}): ${tasksByEmployeeId.length}`);
    
    if (tasksByEmployeeId.length > 0) {
      for (const task of tasksByEmployeeId) {
        console.log(`   Task ${task.id}: ${task.notes} - ${task.status}`);
      }
    }

    // Try to find ALL tasks for today
    const allTasksToday = await FleetTask.find({
      taskDate: { $gte: startOfDay, $lte: endOfDay }
    });

    console.log(`\n📊 Total tasks for today: ${allTasksToday.length}`);
    
    if (allTasksToday.length > 0) {
      console.log('\n📋 All tasks for today:');
      for (const task of allTasksToday) {
        console.log(`   Task ${task.id}:`);
        console.log(`      Driver ID: ${task.driverId}`);
        console.log(`      Status: ${task.status}`);
        console.log(`      Notes: ${task.notes}`);
        console.log(`      Pickup: ${task.pickupLocation}`);
        console.log(`      Drop: ${task.dropLocation}`);
        console.log('');
      }
    }

    // Check what the JWT token says
    console.log('\n🔑 JWT Token Info (from logs):');
    console.log(`   userId: 50`);
    console.log(`   Expected driverId in tasks: ${driverEmployee.employeeId || 'undefined'}`);
    
    if (driverEmployee.employeeId === undefined) {
      console.log('\n⚠️  PROBLEM FOUND: employeeId is undefined!');
      console.log('   The tasks were created but the employee record has no employeeId');
      console.log('   Need to update the employee record with a proper employeeId');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkDriverAndTasks();
