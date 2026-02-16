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

async function finalFixDriverTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // The JWT token shows userId: 50, so let's use that as the employeeId
    const targetEmployeeId = 50;

    // Find driver user
    const driverUser = await User.findOne({ email: 'driver1@gmail.com' });
    if (!driverUser) {
      console.log('❌ Driver user not found');
      return;
    }
    
    console.log('✅ Found driver user:', driverUser.email);

    // Find driver employee
    let driverEmployee = await Employee.findOne({ email: 'driver1@gmail.com' });
    
    if (!driverEmployee) {
      const driverEmployees = await Employee.find({ role: 'driver' });
      if (driverEmployees.length > 0) {
        driverEmployee = driverEmployees[0];
      } else {
        console.log('❌ No driver employees found');
        return;
      }
    }

    console.log('\n👷 Current Driver Employee:');
    console.log(`   Name: ${driverEmployee.name || 'N/A'}`);
    console.log(`   EmployeeID: ${driverEmployee.employeeId || 'undefined'}`);

    // Update employee with proper values
    console.log(`\n🔧 Updating employee to use employeeId: ${targetEmployeeId}`);
    
    driverEmployee.employeeId = targetEmployeeId;
    driverEmployee.name = 'Rajesh Kumar';
    driverEmployee.userId = driverUser._id;
    driverEmployee.email = 'driver1@gmail.com';
    driverEmployee.role = 'driver';
    driverEmployee.isActive = true;
    
    await driverEmployee.save();
    console.log('✅ Employee updated');

    // Find and update tasks
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const tasks = await FleetTask.find({
      taskDate: { $gte: startOfDay, $lte: endOfDay }
    });

    console.log(`\n📋 Found ${tasks.length} tasks for today`);

    if (tasks.length > 0) {
      console.log(`\n🔧 Updating tasks to use driverId: ${targetEmployeeId}`);
      
      for (const task of tasks) {
        task.driverId = targetEmployeeId;
        await task.save();
        console.log(`   ✅ Updated Task ${task.id}: ${task.notes}`);
      }
    }

    // Verify the fix
    console.log('\n📊 Verification:');
    const verifyTasks = await FleetTask.find({
      driverId: targetEmployeeId,
      taskDate: { $gte: startOfDay, $lte: endOfDay }
    });

    console.log(`   Tasks with driverId ${targetEmployeeId}: ${verifyTasks.length}`);
    
    for (const task of verifyTasks) {
      const time = task.plannedPickupTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      console.log(`   • ${task.notes} - ${time}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! Driver and tasks are now properly configured');
    console.log('='.repeat(60));
    console.log(`\n📱 Login Credentials:`);
    console.log(`   Email: driver1@gmail.com`);
    console.log(`   Password: Password123@`);
    console.log(`\n👤 Driver: ${driverEmployee.name} (EmployeeID: ${driverEmployee.employeeId})`);
    console.log(`\n📋 ${verifyTasks.length} transport tasks ready for today`);
    console.log(`\n✅ Restart the mobile app to see the tasks!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

finalFixDriverTasks();
