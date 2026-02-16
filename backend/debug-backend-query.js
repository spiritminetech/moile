import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const FleetTask = mongoose.model('FleetTask', new mongoose.Schema({}, { strict: false }), 'fleettasks');

async function debugBackendQuery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`📊 Host: ${mongoose.connection.host}\n`);

    const driverId = 50;
    const companyId = 1;

    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    console.log('🔍 Query parameters:');
    console.log(`   driverId: ${driverId} (type: ${typeof driverId})`);
    console.log(`   companyId: ${companyId} (type: ${typeof companyId})`);
    console.log(`   startOfDay: ${startOfDay.toISOString()}`);
    console.log(`   endOfDay: ${endOfDay.toISOString()}\n`);

    // Exact query from backend
    const query = {
      driverId,
      companyId,
      taskDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    };

    console.log('📋 Executing query:', JSON.stringify(query, null, 2));

    const tasks = await FleetTask.find(query).lean();

    console.log(`\n✅ Found ${tasks.length} tasks\n`);

    if (tasks.length > 0) {
      for (const task of tasks) {
        console.log(`Task ${task.id}:`);
        console.log(`   _id: ${task._id}`);
        console.log(`   driverId: ${task.driverId} (${typeof task.driverId})`);
        console.log(`   companyId: ${task.companyId} (${typeof task.companyId})`);
        console.log(`   taskDate: ${task.taskDate}`);
        console.log(`   status: ${task.status}`);
        console.log(`   notes: ${task.notes}\n`);
      }
    } else {
      console.log('⚠️  No tasks found. Checking all tasks...\n');
      
      const allTasks = await FleetTask.find({}).limit(10).lean();
      console.log(`Total tasks in database: ${await FleetTask.countDocuments()}`);
      console.log(`\nFirst 10 tasks:`);
      
      for (const task of allTasks) {
        console.log(`\nTask ${task.id}:`);
        console.log(`   driverId: ${task.driverId} (${typeof task.driverId})`);
        console.log(`   companyId: ${task.companyId} (${typeof task.companyId})`);
        console.log(`   taskDate: ${task.taskDate}`);
        console.log(`   Match driverId? ${task.driverId === driverId} (${task.driverId} === ${driverId})`);
        console.log(`   Match companyId? ${task.companyId === companyId} (${task.companyId} === ${companyId})`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

debugBackendQuery();
