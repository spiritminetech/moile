// Fix missing sequence numbers in WorkerTaskAssignment
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

async function fixSequenceNumbers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all assignments with missing sequence
    const assignmentsWithoutSequence = await WorkerTaskAssignment.find({
      $or: [
        { sequence: { $exists: false } },
        { sequence: null }
      ]
    }).sort({ date: 1, employeeId: 1, createdAt: 1 });

    console.log(`📊 Found ${assignmentsWithoutSequence.length} assignments without sequence numbers\n`);

    if (assignmentsWithoutSequence.length === 0) {
      console.log('✅ All assignments already have sequence numbers!');
      await mongoose.disconnect();
      return;
    }

    // Group by employee and date
    const grouped = {};
    assignmentsWithoutSequence.forEach(assignment => {
      const key = `${assignment.employeeId}_${assignment.date}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(assignment);
    });

    console.log('🔧 Assigning sequence numbers...\n');

    let updatedCount = 0;

    // Assign sequence numbers for each employee-date combination
    for (const key of Object.keys(grouped)) {
      const [employeeId, date] = key.split('_');
      const assignments = grouped[key];

      console.log(`👤 Employee ${employeeId} on ${date}: ${assignments.length} tasks`);

      // Sort by creation time to maintain order
      assignments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      // Assign sequence numbers starting from 1
      for (let i = 0; i < assignments.length; i++) {
        const assignment = assignments[i];
        const sequenceNumber = i + 1;

        await WorkerTaskAssignment.updateOne(
          { id: assignment.id },
          { $set: { sequence: sequenceNumber } }
        );

        console.log(`   ✅ Assignment ${assignment.id}: sequence = ${sequenceNumber}`);
        updatedCount++;
      }
      console.log('');
    }

    console.log(`\n✅ Successfully updated ${updatedCount} assignments with sequence numbers!`);

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const stillMissing = await WorkerTaskAssignment.countDocuments({
      $or: [
        { sequence: { $exists: false } },
        { sequence: null }
      ]
    });

    if (stillMissing === 0) {
      console.log('✅ All assignments now have sequence numbers!');
    } else {
      console.log(`⚠️ Warning: ${stillMissing} assignments still missing sequence numbers`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixSequenceNumbers();
