import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const FleetTask = mongoose.model('FleetTask', new mongoose.Schema({}, { strict: false }), 'fleettasks');
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false }), 'employees');

async function testDriverApiQuery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // These are the values from the JWT token
    const driverId = 50;
    const companyId = 1;

    console.log('🔍 Testing API query with:');
    console.log(`   driverId: ${driverId}`);
    console.log(`   companyId: ${companyId}\n`);

    // Check employee
    const employee = await Employee.findOne({ email: 'driver1@gmail.com' });
    console.log('👤 Driver Employee:');
    console.log(`   employeeId: ${employee?.employeeId}`);
    console.log(`   companyId: ${employee?.companyId}\n`);

    // Get today's date range (same as API)
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    console.log('📅 Date range:');
    console.log(`   Start: ${startOfDay.toISOString()}`);
    console.log(`   End: ${endOfDay.toISOString()}\n`);

    // Query exactly as the API does
    const query = {
      driverId: driverId,
      companyId: companyId,
      taskDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    };

    console.log('🔍 Query:', JSON.stringify(query, null, 2));

    const tasks = await FleetTask.find(query).lean();

    console.log(`\n📋 Found ${tasks.length} tasks\n`);

    if (tasks.length > 0) {
      for (const task of tasks) {
        console.log(`Task ${task.id}:`);
        console.log(`   driverId: ${task.driverId}`);
        console.log(`   companyId: ${task.companyId}`);
        console.log(`   taskDate: ${task.taskDate}`);
        console.log(`   status: ${task.status}`);
        console.log(`   notes: ${task.notes}\n`);
      }
    } else {
      console.log('⚠️  No tasks found. Checking all tasks for today...\n');
      
      const allTasksToday = await FleetTask.find({
        taskDate: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }).lean();

      console.log(`📊 Total tasks for today (any driver): ${allTasksToday.length}\n`);
      
      if (allTasksToday.length > 0) {
        for (const task of allTasksToday) {
          console.log(`Task ${task.id}:`);
          console.log(`   driverId: ${task.driverId} (type: ${typeof task.driverId})`);
          console.log(`   companyId: ${task.companyId} (type: ${typeof task.companyId})`);
          console.log(`   Match driverId? ${task.driverId === driverId}`);
          console.log(`   Match companyId? ${task.companyId === companyId}\n`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testDriverApiQuery();
