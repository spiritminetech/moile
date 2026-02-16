// Fix daily target showing 0 - create proper test data with valid quantities

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));

async function fixDailyTargetZeroIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find worker@gmail.com user
    const workerUser = await User.findOne({ email: 'worker@gmail.com' });
    if (!workerUser) {
      console.log('❌ worker@gmail.com user not found');
      return;
    }

    console.log(`✅ Found worker user: ${workerUser.email}`);
    console.log(`   User ID: ${workerUser._id}`);
    console.log(`   Employee ID: ${workerUser.employeeId}\n`);

    // Find the employee record
    const employee = await Employee.findOne({ employeeId: workerUser.employeeId });
    if (!employee) {
      console.log(`❌ Employee ${workerUser.employeeId} not found`);
      return;
    }

    console.log(`✅ Found employee: ${employee.name}`);
    console.log(`   Employee ID: ${employee.employeeId}\n`);

    // Get today's date at start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check existing assignments
    const existingAssignments = await WorkerTaskAssignment.find({
      employeeId: employee.employeeId,
      date: { $gte: today }
    });

    console.log(`📊 Found ${existingAssignments.length} existing assignments for today\n`);

    if (existingAssignments.length > 0) {
      console.log('🔧 Updating existing assignments with proper daily targets...\n');
      
      for (const assignment of existingAssignments) {
        console.log(`Updating Assignment ${assignment.assignmentId}: ${assignment.taskName}`);
        
        // Check current dailyTarget
        if (assignment.dailyTarget) {
          console.log(`  Current quantity: ${assignment.dailyTarget.quantity}`);
          
          if (assignment.dailyTarget.quantity === 0 || assignment.dailyTarget.quantity === '0' || !assignment.dailyTarget.quantity) {
            console.log(`  ⚠️ Quantity is 0 or missing - fixing...`);
            
            // Update with proper quantity
            assignment.dailyTarget.quantity = 100; // Set to 100 as default
            assignment.dailyTarget.unit = assignment.dailyTarget.unit || 'sqm';
            assignment.dailyTarget.description = assignment.dailyTarget.description || 'Daily work target';
            assignment.dailyTarget.targetCompletion = assignment.dailyTarget.targetCompletion || 'end_of_day';
            assignment.dailyTarget.targetType = assignment.dailyTarget.targetType || 'quantity';
            
            // Initialize progressToday if missing
            if (!assignment.dailyTarget.progressToday) {
              assignment.dailyTarget.progressToday = {
                completed: assignment.actualOutput || 0,
                total: 100,
                percentage: assignment.progress || 0
              };
            }
            
            await assignment.save();
            console.log(`  ✅ Updated quantity to: ${assignment.dailyTarget.quantity} ${assignment.dailyTarget.unit}`);
          } else {
            console.log(`  ✅ Quantity is already set: ${assignment.dailyTarget.quantity} ${assignment.dailyTarget.unit}`);
          }
        } else {
          console.log(`  ⚠️ No dailyTarget object - creating one...`);
          
          assignment.dailyTarget = {
            description: 'Daily work target',
            quantity: 100,
            unit: 'sqm',
            targetCompletion: 'end_of_day',
            targetType: 'quantity',
            areaLevel: 'ground_floor',
            startTime: '08:00',
            expectedFinish: '17:00',
            progressToday: {
              completed: assignment.actualOutput || 0,
              total: 100,
              percentage: assignment.progress || 0
            }
          };
          
          await assignment.save();
          console.log(`  ✅ Created dailyTarget with quantity: 100 sqm`);
        }
        
        console.log('');
      }
      
      console.log('✅ All assignments updated!\n');
      
      // Verify the updates
      console.log('🔍 Verifying updates...\n');
      const updatedAssignments = await WorkerTaskAssignment.find({
        employeeId: employee.employeeId,
        date: { $gte: today }
      });
      
      updatedAssignments.forEach(assignment => {
        console.log(`Assignment ${assignment.assignmentId}: ${assignment.taskName}`);
        console.log(`  Daily Target Quantity: ${assignment.dailyTarget?.quantity || 'MISSING'} ${assignment.dailyTarget?.unit || ''}`);
        console.log(`  Actual Output: ${assignment.actualOutput || 0}`);
        console.log(`  Progress: ${assignment.progress || 0}%`);
        console.log('');
      });
      
    } else {
      console.log('❌ No assignments found for today. Please create assignments first.');
    }

    console.log('✅ Fix complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixDailyTargetZeroIssue();
