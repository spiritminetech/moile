// Fix ALL assignments for employee 107 to have proper daily targets

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function fixAllOldAssignmentsDailyTargets() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find ALL assignments for employee 107
    const assignments = await WorkerTaskAssignment.find({ employeeId: 107 });

    console.log(`📊 Found ${assignments.length} assignments for employee 107\n`);

    if (assignments.length === 0) {
      console.log('❌ No assignments found');
      return;
    }

    let fixedCount = 0;

    for (const assignment of assignments) {
      console.log(`\nChecking Assignment ${assignment.assignmentId}: ${assignment.taskName}`);
      
      let needsFix = false;
      
      if (!assignment.dailyTarget) {
        console.log('  ⚠️ No dailyTarget object');
        needsFix = true;
      } else if (!assignment.dailyTarget.quantity || assignment.dailyTarget.quantity === 0) {
        console.log(`  ⚠️ Quantity is ${assignment.dailyTarget.quantity || 'missing'}`);
        needsFix = true;
      } else {
        console.log(`  ✅ Has proper quantity: ${assignment.dailyTarget.quantity} ${assignment.dailyTarget.unit}`);
      }

      if (needsFix) {
        // Determine appropriate quantity based on task name
        let quantity = 100;
        let unit = 'sqm';
        let description = `Complete ${quantity} ${unit} of work`;

        if (assignment.taskName.toLowerCase().includes('plaster')) {
          quantity = 150;
          description = `Complete ${quantity} sqm of plastering work`;
        } else if (assignment.taskName.toLowerCase().includes('tile') || assignment.taskName.toLowerCase().includes('tiling')) {
          quantity = 80;
          description = `Install ${quantity} sqm of tiles`;
        } else if (assignment.taskName.toLowerCase().includes('paint')) {
          quantity = 120;
          description = `Paint ${quantity} sqm of walls`;
        } else if (assignment.taskName.toLowerCase().includes('brick')) {
          quantity = 200;
          unit = 'bricks';
          description = `Lay ${quantity} bricks`;
        }

        assignment.dailyTarget = {
          description: description,
          quantity: quantity,
          unit: unit,
          targetCompletion: 'end_of_day',
          targetType: 'quantity',
          areaLevel: 'general',
          startTime: '08:00',
          expectedFinish: '17:00',
          progressToday: {
            completed: assignment.actualOutput || 0,
            total: quantity,
            percentage: assignment.progress || 0
          }
        };

        await assignment.save();
        fixedCount++;
        console.log(`  ✅ FIXED - Set quantity to: ${quantity} ${unit}`);
      }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ Fixed ${fixedCount} out of ${assignments.length} assignments`);
    console.log(`${'='.repeat(80)}\n`);

    // Show summary
    console.log('📋 All Assignments Summary:\n');
    const updatedAssignments = await WorkerTaskAssignment.find({ employeeId: 107 }).sort({ assignmentId: 1 });
    
    updatedAssignments.forEach(assignment => {
      console.log(`${assignment.assignmentId}. ${assignment.taskName}`);
      console.log(`   Expected Output: ${assignment.dailyTarget?.quantity || 0} ${assignment.dailyTarget?.unit || 'units'}`);
      console.log(`   Actual Output: ${assignment.actualOutput || 0} ${assignment.dailyTarget?.unit || 'units'}`);
      console.log(`   Status: ${assignment.status}`);
      console.log('');
    });

    console.log('✅ All done! Restart backend and clear app cache to see changes.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixAllOldAssignmentsDailyTargets();
