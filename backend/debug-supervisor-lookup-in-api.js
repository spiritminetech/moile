import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function debugSupervisorLookup() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const WorkerTaskAssignment = mongoose.connection.collection('workertaskassignments');
    const Employee = mongoose.connection.collection('employees');
    const User = mongoose.connection.collection('users');

    // Find worker@gmail.com user
    console.log('\n🔍 Finding worker@gmail.com user...');
    const workerUser = await User.findOne({ email: 'worker@gmail.com' });
    
    if (!workerUser) {
      console.log('❌ worker@gmail.com user not found');
      return;
    }

    console.log('✅ Worker user found:');
    console.log({
      id: workerUser.id,
      email: workerUser.email,
      role: workerUser.role
    });

    // Find worker employee record
    const workerEmployee = await Employee.findOne({ userId: workerUser.id });
    
    if (!workerEmployee) {
      console.log('❌ Worker employee record not found');
      return;
    }

    console.log('\n✅ Worker employee found:');
    console.log({
      id: workerEmployee.id,
      fullName: workerEmployee.fullName,
      userId: workerEmployee.userId,
      companyId: workerEmployee.companyId
    });

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log('\n📅 Today:', today);

    // Find assignments for this worker today
    console.log('\n🔍 Finding assignments for worker...');
    const assignments = await WorkerTaskAssignment.find({
      employeeId: workerEmployee.id,
      date: today
    }).toArray();

    console.log(`\n📊 Found ${assignments.length} assignments`);

    if (assignments.length === 0) {
      console.log('\n⚠️ No assignments found for today');
      console.log('Checking all assignments for this employee...');
      
      const allAssignments = await WorkerTaskAssignment.find({
        employeeId: workerEmployee.id
      }).limit(5).toArray();
      
      console.log(`Found ${allAssignments.length} total assignments:`);
      allAssignments.forEach(a => {
        console.log({
          id: a.id,
          employeeId: a.employeeId,
          projectId: a.projectId,
          supervisorId: a.supervisorId,
          date: a.date,
          status: a.status
        });
      });
      return;
    }

    // Check supervisor for each assignment
    for (const assignment of assignments) {
      console.log('\n' + '='.repeat(60));
      console.log(`Assignment ID: ${assignment.id}`);
      console.log({
        employeeId: assignment.employeeId,
        projectId: assignment.projectId,
        supervisorId: assignment.supervisorId,
        date: assignment.date,
        status: assignment.status
      });

      if (assignment.supervisorId) {
        console.log(`\n🔍 Looking up supervisor with ID: ${assignment.supervisorId}`);
        
        const supervisor = await Employee.findOne({ id: assignment.supervisorId });
        
        if (supervisor) {
          console.log('✅ Supervisor found:');
          console.log({
            id: supervisor.id,
            fullName: supervisor.fullName,
            phone: supervisor.phone,
            email: supervisor.email,
            status: supervisor.status
          });
        } else {
          console.log('❌ Supervisor NOT found in employees collection');
          
          // Check if there's any employee with this ID
          const anyEmployee = await Employee.findOne({ id: assignment.supervisorId });
          console.log('Any employee with this ID?', anyEmployee ? 'Yes' : 'No');
        }
      } else {
        console.log('⚠️ No supervisorId in assignment');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

debugSupervisorLookup();
