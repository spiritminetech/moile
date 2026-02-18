// Check if sequence field is populated in WorkerTaskAssignment
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

async function checkSequenceField() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Checking tasks for date:', today);

    // Find all assignments for today
    const assignments = await WorkerTaskAssignment.find({
      date: today
    }).sort({ employeeId: 1, sequence: 1 });

    console.log(`\n📊 Found ${assignments.length} task assignments for today\n`);

    if (assignments.length === 0) {
      console.log('⚠️ No tasks found for today. Checking all tasks...\n');
      
      const allAssignments = await WorkerTaskAssignment.find({})
        .sort({ date: -1, employeeId: 1, sequence: 1 })
        .limit(20);
      
      console.log(`📊 Showing last 20 task assignments:\n`);
      
      allAssignments.forEach((assignment, index) => {
        console.log(`${index + 1}. Assignment ID: ${assignment.id}`);
        console.log(`   Employee ID: ${assignment.employeeId}`);
        console.log(`   Date: ${assignment.date}`);
        console.log(`   Task ID: ${assignment.taskId}`);
        console.log(`   Sequence: ${assignment.sequence} ${assignment.sequence === undefined ? '❌ UNDEFINED' : assignment.sequence === null ? '❌ NULL' : assignment.sequence === 0 ? '⚠️ ZERO' : '✅'}`);
        console.log(`   Status: ${assignment.status}`);
        console.log('');
      });
    } else {
      // Group by employee
      const byEmployee = {};
      assignments.forEach(assignment => {
        if (!byEmployee[assignment.employeeId]) {
          byEmployee[assignment.employeeId] = [];
        }
        byEmployee[assignment.employeeId].push(assignment);
      });

      console.log('📋 Tasks grouped by employee:\n');
      
      Object.keys(byEmployee).forEach(employeeId => {
        const tasks = byEmployee[employeeId];
        console.log(`👤 Employee ID: ${employeeId} (${tasks.length} tasks)`);
        
        tasks.forEach((assignment, index) => {
          console.log(`   ${index + 1}. Assignment ID: ${assignment.id}`);
          console.log(`      Task ID: ${assignment.taskId}`);
          console.log(`      Sequence: ${assignment.sequence} ${assignment.sequence === undefined ? '❌ UNDEFINED' : assignment.sequence === null ? '❌ NULL' : assignment.sequence === 0 ? '⚠️ ZERO' : '✅'}`);
          console.log(`      Status: ${assignment.status}`);
        });
        console.log('');
      });
    }

    // Check if any assignments have undefined or null sequence
    const missingSequence = await WorkerTaskAssignment.countDocuments({
      $or: [
        { sequence: { $exists: false } },
        { sequence: null }
      ]
    });

    console.log(`\n📊 Statistics:`);
    console.log(`   Total assignments with missing sequence: ${missingSequence}`);
    
    if (missingSequence > 0) {
      console.log(`\n⚠️ WARNING: ${missingSequence} assignments have undefined or null sequence!`);
      console.log(`   This will cause "#0" to display in the mobile app.`);
      console.log(`\n💡 Solution: Update these assignments with proper sequence numbers.`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSequenceField();
