// Check task supervisor information
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));

async function checkTaskSupervisorInfo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the specific task
    const task = await WorkerTaskAssignment.findOne({ 
      taskName: "Install Classroom Lighting Fixtures" 
    }).lean();

    if (!task) {
      console.log('❌ Task not found');
      return;
    }

    console.log('📋 Task Found:');
    console.log('  Task Name:', task.taskName);
    console.log('  Assignment ID:', task.assignmentId);
    console.log('  Employee ID:', task.employeeId);
    console.log('  Project ID:', task.projectId);
    console.log('\n📊 Supervisor Fields in Task:');
    console.log('  supervisorId:', task.supervisorId);
    console.log('  supervisorName:', task.supervisorName);
    console.log('  supervisorContact:', task.supervisorContact);
    console.log('  reportingTo:', task.reportingTo);

    // Check if employee has supervisor info
    if (task.employeeId) {
      const employee = await Employee.findOne({ employeeId: task.employeeId }).lean();
      if (employee) {
        console.log('\n👤 Employee Info:');
        console.log('  Name:', employee.name);
        console.log('  Employee ID:', employee.employeeId);
        console.log('  Supervisor ID:', employee.supervisorId);
        console.log('  Reporting To:', employee.reportingTo);
      }
    }

    // Check if there's a supervisor field
    if (task.supervisorId) {
      const supervisor = await Employee.findOne({ employeeId: task.supervisorId }).lean();
      if (supervisor) {
        console.log('\n👨‍💼 Supervisor Info:');
        console.log('  Name:', supervisor.name);
        console.log('  Employee ID:', supervisor.employeeId);
        console.log('  Contact:', supervisor.contactNumber);
        console.log('  Email:', supervisor.email);
      }
    }

    // Check all tasks for this employee
    console.log('\n📋 All Tasks for Employee:', task.employeeId);
    const allTasks = await WorkerTaskAssignment.find({ 
      employeeId: task.employeeId 
    }).select('taskName supervisorId supervisorName supervisorContact').lean();

    allTasks.forEach((t, index) => {
      console.log(`\n  Task ${index + 1}: ${t.taskName}`);
      console.log(`    supervisorId: ${t.supervisorId || 'NOT SET'}`);
      console.log(`    supervisorName: ${t.supervisorName || 'NOT SET'}`);
      console.log(`    supervisorContact: ${t.supervisorContact || 'NOT SET'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkTaskSupervisorInfo();
