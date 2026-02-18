// Check daily target issue - why expected output is 0

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function checkDailyTargetIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all assignments for worker@gmail.com (employee 107)
    const assignments = await WorkerTaskAssignment.find({
      employeeId: 107
    }).sort({ assignmentId: 1 });

    console.log(`📊 Found ${assignments.length} assignments for employee 107\n`);

    assignments.forEach((assignment, index) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Assignment ${index + 1}:`);
      console.log(`${'='.repeat(80)}`);
      console.log(`Assignment ID: ${assignment.assignmentId}`);
      console.log(`Task Name: ${assignment.taskName}`);
      console.log(`Status: ${assignment.status}`);
      console.log(`Date: ${assignment.date}`);
      
      console.log(`\n📋 Daily Target:`);
      if (assignment.dailyTarget) {
        console.log(`  Type: ${typeof assignment.dailyTarget}`);
        console.log(`  Full Object:`, JSON.stringify(assignment.dailyTarget, null, 2));
        
        console.log(`\n  Field Breakdown:`);
        console.log(`    description: "${assignment.dailyTarget.description || 'MISSING'}"`);
        console.log(`    quantity: ${assignment.dailyTarget.quantity} (type: ${typeof assignment.dailyTarget.quantity})`);
        console.log(`    unit: "${assignment.dailyTarget.unit || 'MISSING'}"`);
        console.log(`    targetCompletion: "${assignment.dailyTarget.targetCompletion || 'MISSING'}"`);
        console.log(`    targetType: "${assignment.dailyTarget.targetType || 'MISSING'}"`);
        console.log(`    areaLevel: "${assignment.dailyTarget.areaLevel || 'MISSING'}"`);
        console.log(`    startTime: "${assignment.dailyTarget.startTime || 'MISSING'}"`);
        console.log(`    expectedFinish: "${assignment.dailyTarget.expectedFinish || 'MISSING'}"`);
        
        if (assignment.dailyTarget.progressToday) {
          console.log(`\n  Progress Today:`);
          console.log(`    completed: ${assignment.dailyTarget.progressToday.completed}`);
          console.log(`    total: ${assignment.dailyTarget.progressToday.total}`);
          console.log(`    percentage: ${assignment.dailyTarget.progressToday.percentage}%`);
        } else {
          console.log(`\n  Progress Today: MISSING`);
        }
        
        // Check if quantity is 0
        if (assignment.dailyTarget.quantity === 0 || assignment.dailyTarget.quantity === '0') {
          console.log(`\n  ⚠️ WARNING: Quantity is 0! This will show "Expected Output: 0"`);
        }
      } else {
        console.log(`  ❌ No dailyTarget object`);
      }
      
      console.log(`\n📊 Actual Output: ${assignment.actualOutput || 0}`);
      console.log(`📈 Progress: ${assignment.progress || 0}%`);
    });

    console.log(`\n${'='.repeat(80)}`);
    console.log(`\n✅ Check complete!`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkDailyTargetIssue();
