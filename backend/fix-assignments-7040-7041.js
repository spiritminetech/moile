// Fix specific assignments 7040 and 7041 that are both "in_progress"
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// Import models
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function fixSpecificAssignments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the specific assignments (try both id and assignmentId fields)
    let assignment7040 = await WorkerTaskAssignment.findOne({ id: 7040 });
    if (!assignment7040) {
      assignment7040 = await WorkerTaskAssignment.findOne({ assignmentId: 7040 });
    }
    
    let assignment7041 = await WorkerTaskAssignment.findOne({ id: 7041 });
    if (!assignment7041) {
      assignment7041 = await WorkerTaskAssignment.findOne({ assignmentId: 7041 });
    }

    console.log('🔍 CHECKING SPECIFIC ASSIGNMENTS:');
    console.log('='.repeat(80));
    
    if (assignment7040) {
      console.log('\nAssignment 7040:');
      console.log(`  Task Name: ${assignment7040.taskName}`);
      console.log(`  Status: ${assignment7040.status}`);
      console.log(`  Started At: ${assignment7040.startedAt}`);
      console.log(`  Employee ID: ${assignment7040.employeeId}`);
    } else {
      console.log('\n❌ Assignment 7040 not found');
    }

    if (assignment7041) {
      console.log('\nAssignment 7041:');
      console.log(`  Task Name: ${assignment7041.taskName}`);
      console.log(`  Status: ${assignment7041.status}`);
      console.log(`  Started At: ${assignment7041.startedAt}`);
      console.log(`  Employee ID: ${assignment7041.employeeId}`);
    } else {
      console.log('\n❌ Assignment 7041 not found');
    }

    console.log('\n' + '='.repeat(80));

    // Check if both are in_progress
    if (assignment7040 && assignment7041 && 
        assignment7040.status === 'in_progress' && 
        assignment7041.status === 'in_progress') {
      
      console.log('\n🔴 PROBLEM CONFIRMED:');
      console.log('Both assignments have status "in_progress"!');
      console.log('');

      // Determine which one started more recently
      const time7040 = new Date(assignment7040.startedAt).getTime();
      const time7041 = new Date(assignment7041.startedAt).getTime();

      let keepActive, setPaused;
      if (time7040 > time7041) {
        keepActive = assignment7040;
        setPaused = assignment7041;
      } else {
        keepActive = assignment7041;
        setPaused = assignment7040;
      }

      console.log('🔧 FIX STRATEGY:');
      console.log('='.repeat(80));
      console.log('✅ KEEP ACTIVE:');
      console.log(`   Assignment ${keepActive.id}: ${keepActive.taskName}`);
      console.log(`   Started: ${keepActive.startedAt}`);
      console.log('');
      console.log('⏸️ PAUSE THIS:');
      console.log(`   Assignment ${setPaused.id}: ${setPaused.taskName}`);
      console.log(`   Started: ${setPaused.startedAt}`);
      console.log('='.repeat(80));
      console.log('');

      // Pause the older task
      const now = new Date();
      await WorkerTaskAssignment.updateOne(
        { id: setPaused.id },
        {
          $set: {
            status: 'paused',
            pauseTime: now,
            updatedAt: now
          }
        }
      );

      console.log(`✅ Assignment ${setPaused.id} status changed to "paused"`);
      console.log('');
      console.log('='.repeat(80));
      console.log('✅ FIX COMPLETE!');
      console.log('='.repeat(80));
      console.log('');
      console.log('📊 RESULT:');
      console.log(`   Active: Assignment ${keepActive.id} (${keepActive.taskName})`);
      console.log(`   Paused: Assignment ${setPaused.id} (${setPaused.taskName})`);
      console.log('');
      console.log('🔄 NEXT STEPS:');
      console.log('   1. Refresh the mobile app');
      console.log('   2. You should now see only ONE "Continue Working" button');
      console.log('   3. The other task will show "Resume Task" button');
      console.log('');

    } else if (assignment7040 && assignment7041) {
      console.log('\n✅ NO PROBLEM FOUND:');
      console.log('Not both tasks are "in_progress"');
      console.log(`  Assignment 7040 status: ${assignment7040.status}`);
      console.log(`  Assignment 7041 status: ${assignment7041.status}`);
    } else {
      console.log('\n❌ One or both assignments not found in database');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB\n');
  }
}

fixSpecificAssignments();
