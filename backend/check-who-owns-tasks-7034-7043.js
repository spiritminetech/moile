import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));

async function checkTaskOwnership() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find tasks 7034-7043
    const tasks = await WorkerTaskAssignment.find({
      id: { $gte: 7034, $lte: 7043 }
    }).select('id taskName employeeId status').sort({ id: 1 });

    console.log('📋 TASKS 7034-7043:');
    console.log('===================');
    
    if (tasks.length === 0) {
      console.log('❌ No tasks found in range 7034-7043\n');
    } else {
      for (const task of tasks) {
        const employee = await Employee.findOne({ id: task.employeeId });
        console.log(`Task ${task.id}: ${task.taskName}`);
        console.log(`  Employee ID: ${task.employeeId}`);
        console.log(`  Employee Name: ${employee ? employee.name : 'NOT FOUND'}`);
        console.log(`  Status: ${task.status}\n`);
      }
    }

    // Check which user is logged in (employee 107)
    const user107 = await User.findOne({ employeeId: 107 });
    if (user107) {
      console.log('👤 USER WITH EMPLOYEE ID 107:');
      console.log('============================');
      console.log(`Email: ${user107.email}`);
      console.log(`Role: ${user107.role}`);
      console.log(`Employee ID: ${user107.employeeId}\n`);
    }

    // Find all tasks for employee 107
    const tasks107 = await WorkerTaskAssignment.find({ employeeId: 107 })
      .select('id taskName status')
      .sort({ id: 1 });

    console.log('📋 ALL TASKS FOR EMPLOYEE 107:');
    console.log('===============================');
    if (tasks107.length === 0) {
      console.log('❌ No tasks found for employee 107\n');
    } else {
      tasks107.forEach(task => {
        console.log(`Task ${task.id}: ${task.taskName} (${task.status})`);
      });
    }

    // Check the new tasks we just created
    const newTasks = await WorkerTaskAssignment.find({
      id: { $in: [7044, 7045] }
    }).select('id taskName employeeId status');

    console.log('\n🆕 NEW TASKS (7044-7045):');
    console.log('=========================');
    newTasks.forEach(task => {
      console.log(`Task ${task.id}: ${task.taskName}`);
      console.log(`  Employee ID: ${task.employeeId}`);
      console.log(`  Status: ${task.status}\n`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

checkTaskOwnership();
