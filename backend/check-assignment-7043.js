// Check assignment 7043 and add daily target if missing

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function checkAssignment7043() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find assignment 7043
    const assignment = await WorkerTaskAssignment.findOne({ assignmentId: 7043 });

    if (!assignment) {
      console.log('❌ Assignment 7043 not found');
      return;
    }

    console.log('📋 Assignment 7043 Details:\n');
    console.log(`Task Name: ${assignment.taskName}`);
    console.log(`Status: ${assignment.status}`);
    console.log(`Employee ID: ${assignment.employeeId}`);
    console.log(`Date: ${assignment.date}`);
    console.log(`\nDaily Target:`);
    
    if (assignment.dailyTarget) {
      console.log(JSON.stringify(assignment.dailyTarget, null, 2));
      
      if (!assignment.dailyTarget.quantity || assignment.dailyTarget.quantity === 0) {
        console.log('\n⚠️ Daily target quantity is 0 or missing - fixing...\n');
        
        assignment.dailyTarget = {
          description: 'Paint 120 sqm of interior walls',
          quantity: 120,
          unit: 'sqm',
          targetCompletion: 'end_of_day',
          targetType: 'quantity',
          areaLevel: 'interior',
          startTime: '08:00',
          expectedFinish: '17:00',
          progressToday: {
            completed: assignment.actualOutput || 0,
            total: 120,
            percentage: assignment.progress || 0
          }
        };
        
        await assignment.save();
        console.log('✅ Updated assignment 7043 with proper daily target');
        console.log(`   Expected Output: 120 sqm`);
        console.log(`   Actual Output: ${assignment.actualOutput || 0} sqm`);
      } else {
        console.log('\n✅ Daily target already has proper quantity');
      }
    } else {
      console.log('❌ No dailyTarget object - creating one...\n');
      
      assignment.dailyTarget = {
        description: 'Paint 120 sqm of interior walls',
        quantity: 120,
        unit: 'sqm',
        targetCompletion: 'end_of_day',
        targetType: 'quantity',
        areaLevel: 'interior',
        startTime: '08:00',
        expectedFinish: '17:00',
        progressToday: {
          completed: assignment.actualOutput || 0,
          total: 120,
          percentage: assignment.progress || 0
        }
      };
      
      await assignment.save();
      console.log('✅ Created daily target for assignment 7043');
      console.log(`   Expected Output: 120 sqm`);
      console.log(`   Actual Output: ${assignment.actualOutput || 0} sqm`);
    }

    console.log('\n✅ Fix complete! Restart backend and reload app to see changes.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAssignment7043();
