import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));

async function debugTaskQueryIssue() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find employee with userId 2
    const employee = await Employee.findOne({ userId: 2 });
    
    if (!employee) {
      console.log('❌ Employee not found for userId: 2');
      return;
    }

    console.log('\n👤 Employee found:');
    console.log(`   Employee ID (id field): ${employee.id}`);
    console.log(`   Employee ID (_id field): ${employee._id}`);
    console.log(`   User ID: ${employee.userId}`);
    console.log(`   Name: ${employee.fullName}`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check what the controller is querying (using 'date' field)
    console.log('\n🔍 Query 1: Using date field (what controller uses)');
    const tasksWithDateField = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      date: today
    }).sort({ sequence: 1 });
    console.log(`   Found ${tasksWithDateField.length} tasks`);

    // Check what we created (using 'assignedDate' field)
    console.log('\n🔍 Query 2: Using assignedDate field (what we created)');
    const tasksWithAssignedDate = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      assignedDate: { $gte: today }
    }).sort({ sequence: 1 });
    console.log(`   Found ${tasksWithAssignedDate.length} tasks`);

    // Check with employeeId: 2 directly
    console.log('\n🔍 Query 3: Using employeeId: 2 directly');
    const tasksWithEmployeeId2 = await WorkerTaskAssignment.find({
      employeeId: 2,
      assignedDate: { $gte: today }
    }).sort({ sequence: 1 });
    console.log(`   Found ${tasksWithEmployeeId2.length} tasks`);

    // Show all tasks for employee.id
    console.log('\n📋 All tasks for employee.id:', employee.id);
    const allTasksForEmployeeId = await WorkerTaskAssignment.find({
      employeeId: employee.id
    });
    console.log(`   Total: ${allTasksForEmployeeId.length}`);
    allTasksForEmployeeId.forEach(task => {
      console.log(`   - ${task.taskName || 'Unnamed'} (date: ${task.date}, assignedDate: ${task.assignedDate})`);
    });

    // Show all tasks for employeeId: 2
    console.log('\n📋 All tasks for employeeId: 2');
    const allTasksForId2 = await WorkerTaskAssignment.find({
      employeeId: 2
    });
    console.log(`   Total: ${allTasksForId2.length}`);
    allTasksForId2.forEach(task => {
      console.log(`   - ${task.taskName || 'Unnamed'} (date: ${task.date}, assignedDate: ${task.assignedDate})`);
    });

    console.log('\n💡 Solution:');
    if (tasksWithDateField.length === 0 && tasksWithAssignedDate.length > 0) {
      console.log('   The controller is looking for "date" field, but tasks have "assignedDate" field.');
      console.log('   We need to either:');
      console.log('   1. Update tasks to have "date" field instead of "assignedDate"');
      console.log('   2. Update the controller to use "assignedDate" field');
    }

    if (employee.id !== 2) {
      console.log(`   Employee.id is ${employee.id}, but tasks are assigned to employeeId: 2`);
      console.log('   We need to update tasks to use employee.id:', employee.id);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

debugTaskQueryIssue();
