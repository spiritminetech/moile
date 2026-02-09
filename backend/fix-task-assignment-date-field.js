import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

const WorkerTaskAssignmentSchema = new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' });
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);

async function fixDateField() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const today = '2026-02-08';

    // Find all task assignments with assignedDate but no date field
    const assignments = await WorkerTaskAssignment.find({
      assignedDate: today,
      projectId: 1
    });

    console.log(`📋 Found ${assignments.length} task assignments with assignedDate field`);

    if (assignments.length > 0) {
      console.log('\n🔧 Fixing date field...');
      
      for (const assignment of assignments) {
        await WorkerTaskAssignment.updateOne(
          { _id: assignment._id },
          { 
            $set: { date: today },
            $unset: { assignedDate: 1 }
          }
        );
        console.log(`  ✅ Fixed assignment ${assignment._id}`);
      }

      console.log('\n✅ Successfully fixed all task assignments!');
    }

    // Verify the fix
    const verifyAssignments = await WorkerTaskAssignment.find({
      date: today,
      projectId: 1
    });

    console.log(`\n📊 Verification: ${verifyAssignments.length} task assignments now have correct date field`);

    await mongoose.disconnect();
    console.log('\n👋 Done');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

fixDateField();
