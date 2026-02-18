import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

async function checkDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the three assignments
    const assignments = await WorkerTaskAssignment.find({
      id: { $in: [7034, 7035, 7036] }
    }).lean();

    console.log(`\nFound ${assignments.length} assignments`);
    
    assignments.forEach(a => {
      console.log(`\n📋 Assignment ${a.id}:`);
      console.log(`  Employee: ${a.employeeId}`);
      console.log(`  Supervisor: ${a.supervisorId}`);
      console.log(`  Date field: ${a.date}`);
      console.log(`  Date type: ${typeof a.date}`);
      console.log(`  Date ISO: ${a.date instanceof Date ? a.date.toISOString() : 'Not a Date object'}`);
      console.log(`  Created: ${a.createdAt}`);
    });

    // Try different date queries
    console.log('\n\n🔍 Testing different date queries:');
    
    // Query 1: Exact date string
    const query1 = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: '2026-02-14'
    }).lean();
    console.log(`\nQuery 1 (date: '2026-02-14'): ${query1.length} results`);

    // Query 2: Date object
    const query2 = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: new Date('2026-02-14')
    }).lean();
    console.log(`Query 2 (date: new Date('2026-02-14')): ${query2.length} results`);

    // Query 3: Range query with UTC
    const todayStart = new Date('2026-02-14T00:00:00.000Z');
    const todayEnd = new Date('2026-02-14T23:59:59.999Z');
    const query3 = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: { $gte: todayStart, $lte: todayEnd }
    }).lean();
    console.log(`Query 3 (UTC range): ${query3.length} results`);

    // Query 4: Check what the actual date value is
    const query4 = await WorkerTaskAssignment.find({
      employeeId: 2,
      id: { $in: [7034, 7035, 7036] }
    }).lean();
    console.log(`\nQuery 4 (by ID): ${query4.length} results`);
    if (query4.length > 0) {
      console.log('Date values:');
      query4.forEach(a => {
        const dateValue = a.date;
        console.log(`  Assignment ${a.id}: ${dateValue} (${typeof dateValue})`);
        if (dateValue instanceof Date) {
          console.log(`    ISO: ${dateValue.toISOString()}`);
          console.log(`    Time: ${dateValue.getTime()}`);
        }
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

checkDates();
