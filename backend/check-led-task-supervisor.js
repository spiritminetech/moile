import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function checkLEDTaskSupervisor() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Task = mongoose.connection.collection('tasks');
    const WorkerTaskAssignment = mongoose.connection.collection('workertaskassignments');
    const Employee = mongoose.connection.collection('employees');

    // Find the LED lighting task
    console.log('\n🔍 Searching for LED lighting task...');
    let ledTask = await Task.findOne({
      taskName: { $regex: /LED lighting/i }
    });

    if (!ledTask) {
      console.log('⚠️ Exact match not found, searching for "lighting"...');
      ledTask = await Task.findOne({
        taskName: { $regex: /lighting/i }
      });
    }

    if (!ledTask) {
      console.log('⚠️ Still not found, searching by description...');
      ledTask = await Task.findOne({
        description: { $regex: /LED lighting fixtures in classrooms/i }
      });
    }

    if (!ledTask) {
      console.log('❌ LED lighting task not found');
      return;
    }

    console.log('\n📋 Task Found:');
    console.log({
      id: ledTask.id,
      taskName: ledTask.taskName,
      description: ledTask.description,
      projectId: ledTask.projectId
    });

    // Find all assignments for this task
    console.log('\n🔍 Checking all assignments in the database...');
    const allAssignments = await WorkerTaskAssignment.find({}).sort({ id: -1 }).limit(10).toArray();
    
    console.log(`\n📊 Latest 10 assignments:`);
    allAssignments.forEach(a => {
      console.log({
        id: a.id,
        taskId: a.taskId,
        employeeId: a.employeeId,
        supervisorId: a.supervisorId,
        status: a.status,
        date: a.date
      });
    });

    // Check supervisor with ID 4
    console.log('\n' + '='.repeat(60));
    console.log('\n🔍 Checking supervisor with ID 4...');
    const supervisor4 = await Employee.findOne({ id: 4 });
    
    if (supervisor4) {
      console.log('\n👔 Supervisor ID 4:');
      console.log({
        id: supervisor4.id,
        fullName: supervisor4.fullName,
        phone: supervisor4.phone,
        email: supervisor4.email,
        userId: supervisor4.userId,
        status: supervisor4.status,
        jobTitle: supervisor4.jobTitle,
        projectId: supervisor4.projectId
      });
    } else {
      console.log('❌ Supervisor with ID 4 not found');
    }

    // Check if there's a supervisor for project 1003
    console.log('\n' + '='.repeat(60));
    console.log('\n🔍 Checking all supervisors for project 1003...');
    const projectSupervisors = await Employee.find({
      projectId: 1003,
      jobTitle: { $regex: /supervisor/i }
    }).toArray();

    console.log(`\n📊 Found ${projectSupervisors.length} supervisor(s) for project 1003:`);
    projectSupervisors.forEach(sup => {
      console.log({
        id: sup.id,
        name: sup.fullName,
        phone: sup.phone,
        email: sup.email,
        status: sup.status
      });
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkLEDTaskSupervisor();
