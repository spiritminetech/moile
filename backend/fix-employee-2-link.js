// Fix employee 2 link and add daily targets to assignments

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function fixEmployee2Link() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find user with worker@gmail.com
    const user = await User.findOne({ email: 'worker@gmail.com' });
    if (!user) {
      console.log('❌ User worker@gmail.com not found');
      return;
    }

    console.log('👤 Current User Account:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Employee ID: ${user.employeeId}`);
    console.log(`   Name: ${user.name}\n`);

    // Find employee with ID 2
    let employee2 = await Employee.findOne({ employeeId: 2 });
    
    if (!employee2) {
      console.log('❌ Employee 2 not found. Creating employee record...\n');
      
      // Create employee 2 record
      employee2 = await Employee.create({
        employeeId: 2,
        name: 'Ravi Smith',
        email: 'worker@gmail.com',
        role: 'worker',
        status: 'ACTIVE',
        phone: '+91-9876543210',
        address: 'Mumbai, India',
        dateOfJoining: new Date('2024-01-15'),
        department: 'Construction',
        designation: 'Construction Worker'
      });
      
      console.log('✅ Created employee 2 record\n');
    } else {
      console.log('✅ Employee 2 exists:');
      console.log(`   Name: ${employee2.name}`);
      console.log(`   Email: ${employee2.email}\n`);
    }

    // Update user to link to employee 2
    if (user.employeeId !== 2) {
      await User.updateOne(
        { email: 'worker@gmail.com' },
        { $set: { employeeId: 2 } }
      );
      console.log('✅ Updated user account to link to employee ID 2\n');
    }

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all assignments for employee 2
    const assignments = await WorkerTaskAssignment.find({ 
      employeeId: 2,
      date: { $gte: today }
    }).sort({ assignmentId: 1 });

    console.log(`📊 Found ${assignments.length} assignments for employee 2\n`);

    if (assignments.length === 0) {
      console.log('📝 Creating 3 new assignments with daily targets...\n');

      // Delete any old assignments for employee 2
      await WorkerTaskAssignment.deleteMany({ employeeId: 2 });

      // Create 3 new assignments
      const newAssignments = [
        {
          assignmentId: 9001,
          employeeId: 2,
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
          employeeId: 2,
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
          employeeId: 2,
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
    } else {
      console.log('📋 Existing Assignments:\n');
      let fixed = 0;

      for (const assignment of assignments) {
        console.log(`Checking Assignment ${assignment.assignmentId}: ${assignment.taskName || 'Unnamed'}`);
        
        // Fix missing daily target
        if (!assignment.dailyTarget || !assignment.dailyTarget.quantity || assignment.dailyTarget.quantity === 0) {
          const defaultQuantity = 100;
          const defaultUnit = 'sqm';
          
          await WorkerTaskAssignment.updateOne(
            { _id: assignment._id },
            {
              $set: {
                'dailyTarget.quantity': defaultQuantity,
                'dailyTarget.unit': defaultUnit,
                'dailyTarget.description': `Complete ${defaultQuantity} ${defaultUnit} of work`
              }
            }
          );
          
          console.log(`  ✅ Added daily target: ${defaultQuantity} ${defaultUnit}\n`);
          fixed++;
        } else {
          console.log(`  ✅ Already has daily target: ${assignment.dailyTarget.quantity} ${assignment.dailyTarget.unit}\n`);
        }
      }

      console.log(`✅ Fixed ${fixed} out of ${assignments.length} assignments\n`);
    }

    console.log('✅ All done! Restart backend and clear app cache to see changes.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixEmployee2Link();
