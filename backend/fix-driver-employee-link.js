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

async function fixDriverEmployeeLink() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find driver user
    const driverUser = await User.findOne({ email: 'driver1@gmail.com' });
    if (!driverUser) {
      console.log('❌ Driver user not found');
      return;
    }
    
    console.log('✅ Found driver user:', driverUser.email);

    // Find driver employee by email
    let driverEmployee = await Employee.findOne({ email: 'driver1@gmail.com' });
    
    if (!driverEmployee) {
      // Try to find by role
      const driverEmployees = await Employee.find({ role: 'driver' });
      console.log(`\nFound ${driverEmployees.length} driver employees`);
      
      if (driverEmployees.length > 0) {
        driverEmployee = driverEmployees[0];
        console.log(`Using: ${driverEmployee.name}`);
      } else {
        console.log('❌ No driver employees found');
        return;
      }
    }

    console.log('\n👷 Driver Employee:');
    console.log(`   Name: ${driverEmployee.name}`);
    console.log(`   EmployeeID: ${driverEmployee.employeeId}`);
    console.log(`   Current userId: ${driverEmployee.userId}`);
    console.log(`   Email: ${driverEmployee.email}`);

    // Update the employee to link to the user
    driverEmployee.userId = driverUser._id;
    driverEmployee.email = 'driver1@gmail.com';
    await driverEmployee.save();
    
    console.log('\n✅ Updated employee record to link to driver1@gmail.com user');

    // Check for tasks
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const tasks = await FleetTask.find({
      taskDate: { $gte: startOfDay, $lte: endOfDay }
    });

    console.log(`\n📋 Tasks for today: ${tasks.length}`);
    
    if (tasks.length > 0) {
      console.log('\nTask details:');
      for (const task of tasks) {
        console.log(`   Task ${task.id}: driverId=${task.driverId}, status=${task.status}`);
      }
      
      // Check if driverId matches
      const matchingTasks = tasks.filter(t => t.driverId === driverEmployee.employeeId);
      console.log(`\n✅ Tasks matching employeeId ${driverEmployee.employeeId}: ${matchingTasks.length}`);
      
      // Fix if employeeId is undefined
      if (driverEmployee.employeeId === undefined) {
          console.log('\n🔧 Employee has undefined employeeId. Checking all employees...');
          
          const allEmployees = await Employee.find({});
          const numericEmployees = allEmployees.filter(e => typeof e.employeeId === 'number');
          
          if (numericEmployees.length > 0) {
            numericEmployees.sort((a, b) => b.employeeId - a.employeeId);
            const maxEmpId = numericEmployees[0].employeeId;
            const nextId = maxEmpId + 1;
            
            console.log(`   Max employeeId in DB: ${maxEmpId}`);
            console.log(`   Assigning employeeId: ${nextId}`);
            
            driverEmployee.employeeId = nextId;
            await driverEmployee.save();
            
            console.log(`\n✅ Updated employee with employeeId: ${nextId}`);
            
            // Update all tasks to use this employeeId
            console.log(`\n🔧 Updating ${tasks.length} tasks to use driverId: ${nextId}`);
            for (const task of tasks) {
              task.driverId = nextId;
              await task.save();
            }
            console.log('✅ All tasks updated');
          }
        }
      } else {
      console.log('\n⚠️  No tasks found for today. Need to create them.');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Driver setup complete!');
    console.log('='.repeat(60));
    console.log(`\n📱 Login: driver1@gmail.com / Password123@`);
    console.log(`👤 Driver: ${driverEmployee.name} (ID: ${driverEmployee.employeeId})`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixDriverEmployeeLink();
