// Fix the date field for new tasks 7001 and 7002
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function fixDateField() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // "2026-02-15"
    
    console.log(`📅 Today's date string: ${todayStr}`);

    // Update tasks 7001 and 7002 to have the 'date' field
    const result = await WorkerTaskAssignment.updateMany(
      { assignmentId: { $in: [7001, 7002] } },
      { 
        $set: { 
          date: todayStr,
          assignedDate: today
        } 
      }
    );

    console.log(`\n✅ Updated ${result.modifiedCount} tasks`);

    // Verify the update
    const tasks = await WorkerTaskAssignment.find({ assignmentId: { $in: [7001, 7002] } });
    console.log('\n📊 Verified tasks:');
    tasks.forEach(task => {
      console.log(`\n${task.taskName}`);
      console.log(`  Assignment ID: ${task.assignmentId}`);
      console.log(`  date field: ${task.date}`);
      console.log(`  assignedDate field: ${task.assignedDate}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

fixDateField();
