import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function checkWorkerGmailLogin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user with worker@gmail.com
    const user = await User.findOne({ email: 'worker@gmail.com' });
    
    if (!user) {
      console.log('❌ User with email worker@gmail.com not found!');
      return;
    }

    console.log('\n👤 User found:');
    console.log(`   User ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Employee ID: ${user.employeeId}`);

    // Find employee record
    const employee = await Employee.findOne({ 
      $or: [
        { _id: user.employeeId },
        { employeeId: user.employeeId }
      ]
    });

    if (employee) {
      console.log('\n👷 Employee found:');
      console.log(`   Employee ID: ${employee.employeeId || employee._id}`);
      console.log(`   Name: ${employee.name}`);
      console.log(`   Trade: ${employee.trade}`);
    } else {
      console.log('\n❌ Employee record not found!');
    }

    // Check tasks for this employee
    const employeeId = user.employeeId;
    console.log(`\n📋 Checking tasks for Employee ID: ${employeeId}...`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = await WorkerTaskAssignment.find({ 
      employeeId: employeeId,
      assignedDate: { $gte: today }
    }).sort({ sequence: 1 });

    console.log(`\n✅ Found ${tasks.length} tasks for today`);

    if (tasks.length > 0) {
      tasks.forEach((task, index) => {
        console.log(`\n${index + 1}. ${task.taskName || 'Unnamed Task'} (ID: ${task.taskId})`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Priority: ${task.priority}`);
        console.log(`   Sequence: ${task.sequence}`);
      });
    } else {
      console.log('\n⚠️ No tasks found for this employee!');
      console.log('\n🔍 Let me check if tasks exist for Employee ID: 2 (Ravi)...');
      
      const raviTasks = await WorkerTaskAssignment.find({ 
        employeeId: 2,
        assignedDate: { $gte: today }
      }).sort({ sequence: 1 });

      console.log(`\n📊 Found ${raviTasks.length} tasks for Employee ID: 2`);
      
      if (raviTasks.length > 0) {
        console.log('\n💡 The tasks were created for Employee ID: 2, but worker@gmail.com is linked to Employee ID:', employeeId);
        console.log('\n🔧 We need to either:');
        console.log('   1. Update worker@gmail.com to use Employee ID: 2');
        console.log('   2. Create tasks for Employee ID:', employeeId);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkWorkerGmailLogin();
