// Check and create employee 2 properly

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function checkAndCreateEmployee2() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find user with worker@gmail.com
    const user = await User.findOne({ email: 'worker@gmail.com' });
    console.log('👤 User Account (worker@gmail.com):');
    console.log(`   Employee ID: ${user.employeeId}\n`);

    // Check if employee 2 exists
    let employee2 = await Employee.findOne({ employeeId: 2 });
    
    if (!employee2) {
      console.log('❌ Employee 2 not found\n');
      
      // Check if there's an employee with email worker@gmail.com
      const existingEmployee = await Employee.findOne({ email: 'worker@gmail.com' });
      if (existingEmployee) {
        console.log('✅ Found existing employee with worker@gmail.com:');
        console.log(`   Employee ID: ${existingEmployee.employeeId}`);
        console.log(`   Name: ${existingEmployee.name}\n`);
        
        // Update user to use this employee ID
        await User.updateOne(
          { email: 'worker@gmail.com' },
          { $set: { employeeId: existingEmployee.employeeId } }
        );
        console.log(`✅ Updated user to use employee ID ${existingEmployee.employeeId}\n`);
        
        employee2 = existingEmployee;
      } else {
        console.log('Creating new employee 2...\n');
        
        // Create without the 'id' field that's causing the duplicate key error
        employee2 = new Employee({
          employeeId: 2,
          name: 'Ravi Smith',
          email: 'worker@gmail.com',
          role: 'worker',
          status: 'ACTIVE'
        });
        
        await employee2.save();
        console.log('✅ Created employee 2\n');
        
        // Update user
        await User.updateOne(
          { email: 'worker@gmail.com' },
          { $set: { employeeId: 2 } }
        );
        console.log('✅ Updated user to use employee ID 2\n');
      }
    } else {
      console.log('✅ Employee 2 exists:');
      console.log(`   Name: ${employee2.name}`);
      console.log(`   Email: ${employee2.email}\n`);
    }

    // Now create assignments for this employee
    const employeeId = employee2.employeeId;
    console.log(`📝 Creating assignments for employee ${employeeId}...\n`);

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Delete any existing assignments for today
    await WorkerTaskAssignment.deleteMany({ 
      employeeId: employeeId,
      date: { $gte: today }
    });

    // Create 3 new assignments with daily targets
    const newAssignments = [
      {
        assignmentId: 9001,
        employeeId: employeeId,
        taskId: 1001,
        taskName: 'Wall Plastering - Ground Floor',
        projectId: 1003,
        projectName: 'School Campus Construction',
        date: today,
        status: 'pending',
        sequence: 1,
        dailyTarget: {
          quantity: 150,
          unit: 'sqm',
          description: 'Complete 150 sqm of wall plastering'
        },
        actualOutput: 0,
        progressToday: 0
      },
      {
        assignmentId: 9002,
        employeeId: employeeId,
        taskId: 1002,
        taskName: 'Floor Tiling - First Floor',
        projectId: 1003,
        projectName: 'School Campus Construction',
        date: today,
        status: 'pending',
        sequence: 2,
        dailyTarget: {
          quantity: 80,
          unit: 'sqm',
          description: 'Install 80 sqm of floor tiles'
        },
        actualOutput: 0,
        progressToday: 0
      },
      {
        assignmentId: 9003,
        employeeId: employeeId,
        taskId: 1003,
        taskName: 'Painting - Exterior Walls',
        projectId: 1003,
        projectName: 'School Campus Construction',
        date: today,
        status: 'pending',
        sequence: 3,
        dailyTarget: {
          quantity: 200,
          unit: 'sqm',
          description: 'Paint 200 sqm of exterior walls'
        },
        actualOutput: 0,
        progressToday: 0
      }
    ];

    await WorkerTaskAssignment.insertMany(newAssignments);
    console.log('✅ Created 3 new assignments with daily targets\n');

    console.log('📋 New Assignments:\n');
    newAssignments.forEach(assignment => {
      console.log(`${assignment.sequence}. ${assignment.taskName} (ID: ${assignment.assignmentId})`);
      console.log(`   Expected Output: ${assignment.dailyTarget.quantity} ${assignment.dailyTarget.unit}`);
      console.log(`   Status: ${assignment.status}\n`);
    });

    console.log('✅ All done!');
    console.log('📱 Next steps:');
    console.log('   1. Restart the backend server');
    console.log('   2. Clear mobile app cache (reload app)');
    console.log('   3. Login with worker@gmail.com / password123');
    console.log('   4. You should see 3 tasks with proper daily targets');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAndCreateEmployee2();
