import mongoose from 'mongoose';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

const MONGODB_URI = 'mongodb://anbarasus2410_db_user:Anbu24102002@ac-vtmilrh-shard-00-00.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-01.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-02.hlff2qz.mongodb.net:27017/erp?tls=true&replicaSet=atlas-qbnji8-shard-0&authSource=admin&retryWrites=true&w=majority';

async function debugQuery() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const employeeId = 2;
    const today = '2026-02-15';

    console.log('🔍 Query parameters:');
    console.log(`  employeeId: ${employeeId}`);
    console.log(`  date: ${today}`);
    console.log(`  date type: ${typeof today}\n`);

    // Query 1: Exact match (what API uses)
    console.log('Query 1: Exact string match');
    const result1 = await WorkerTaskAssignment.find({
      employeeId: employeeId,
      date: today
    }).lean();
    console.log(`  Found: ${result1.length} assignments`);
    if (result1.length > 0) {
      result1.forEach(a => {
        console.log(`    - Assignment ${a.id}: date="${a.date}" (type: ${typeof a.date})`);
      });
    }

    // Query 2: Check all assignments for this employee
    console.log('\nQuery 2: All assignments for employee 2');
    const result2 = await WorkerTaskAssignment.find({
      employeeId: employeeId
    }).lean();
    console.log(`  Found: ${result2.length} assignments`);
    if (result2.length > 0) {
      result2.forEach(a => {
        console.log(`    - Assignment ${a.id}: date="${a.date}" (type: ${typeof a.date})`);
      });
    }

    // Query 3: Check specific assignments
    console.log('\nQuery 3: Check assignments 7034, 7035, 7036');
    const result3 = await WorkerTaskAssignment.find({
      id: { $in: [7034, 7035, 7036] }
    }).lean();
    console.log(`  Found: ${result3.length} assignments`);
    if (result3.length > 0) {
      result3.forEach(a => {
        console.log(`    - Assignment ${a.id}:`);
        console.log(`        employeeId: ${a.employeeId}`);
        console.log(`        date: "${a.date}" (type: ${typeof a.date})`);
        console.log(`        status: ${a.status}`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Done');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

debugQuery();
