import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignmentSchema = new mongoose.Schema({
  id: Number,
  employeeId: Number,
  projectId: Number,
  taskId: Number,
  date: String,
  status: String,
  sequence: Number,
  startTime: Date,
  endTime: Date,
}, { collection: 'workertaskassignments' });

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);

async function debugSequenceIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const employeeId = 105;
    const projectId = 2;
    const date = "2026-02-06";

    console.log('🔍 Checking existing assignments for:');
    console.log(`   Employee ID: ${employeeId}`);
    console.log(`   Project ID: ${projectId}`);
    console.log(`   Date: ${date}`);
    console.log('─'.repeat(60));

    // Find existing assignments
    const existing = await WorkerTaskAssignment.find({
      employeeId: employeeId,
      projectId: projectId,
      date: date
    });

    console.log(`\n📋 Found ${existing.length} existing assignments:`);
    existing.forEach(assignment => {
      console.log(`\n  Assignment ID: ${assignment.id}`);
      console.log(`    Task ID: ${assignment.taskId}`);
      console.log(`    Sequence: ${assignment.sequence} (type: ${typeof assignment.sequence})`);
      console.log(`    Status: ${assignment.status}`);
    });

    // Find last sequence
    const lastTask = await WorkerTaskAssignment
      .findOne({ employeeId, projectId, date })
      .sort({ sequence: -1 });

    console.log('\n─'.repeat(60));
    console.log('\n🔢 Last Task Query Result:');
    if (lastTask) {
      console.log(`  Found: YES`);
      console.log(`  Assignment ID: ${lastTask.id}`);
      console.log(`  Sequence: ${lastTask.sequence}`);
      console.log(`  Sequence type: ${typeof lastTask.sequence}`);
      console.log(`  Sequence is null: ${lastTask.sequence === null}`);
      console.log(`  Sequence is undefined: ${lastTask.sequence === undefined}`);
      console.log(`  Sequence is NaN: ${isNaN(lastTask.sequence)}`);
      
      const calculatedNext = lastTask.sequence + 1;
      console.log(`\n  Calculated next sequence: ${calculatedNext}`);
      console.log(`  Is NaN: ${isNaN(calculatedNext)}`);
    } else {
      console.log('  Found: NO');
      console.log('  Will start from sequence 1');
    }

    // Check all assignments for this employee/project (any date)
    console.log('\n─'.repeat(60));
    console.log('\n📋 All assignments for Employee 105, Project 2 (any date):');
    const allAssignments = await WorkerTaskAssignment.find({
      employeeId: employeeId,
      projectId: projectId
    }).sort({ date: 1, sequence: 1 });

    if (allAssignments.length === 0) {
      console.log('  No assignments found');
    } else {
      allAssignments.forEach(assignment => {
        console.log(`  Date: ${assignment.date}, Task: ${assignment.taskId}, Sequence: ${assignment.sequence}`);
      });
    }

    // Check for assignments with null/undefined sequence
    console.log('\n─'.repeat(60));
    console.log('\n⚠️  Checking for problematic sequence values:');
    const problematic = await WorkerTaskAssignment.find({
      $or: [
        { sequence: null },
        { sequence: undefined },
        { sequence: { $exists: false } }
      ]
    });

    if (problematic.length > 0) {
      console.log(`  Found ${problematic.length} assignments with null/undefined sequence:`);
      problematic.forEach(assignment => {
        console.log(`    Assignment ${assignment.id}: Employee ${assignment.employeeId}, Project ${assignment.projectId}, Sequence: ${assignment.sequence}`);
      });
    } else {
      console.log('  No problematic assignments found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Connection closed');
  }
}

debugSequenceIssue();
