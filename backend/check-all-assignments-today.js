import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

async function checkAssignments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check all assignments for today
    const today = '2026-02-14';
    const todayStart = new Date(today + 'T00:00:00.000Z');
    const todayEnd = new Date(today + 'T23:59:59.999Z');

    console.log('\n📋 Checking assignments for today:', today);
    console.log('Date range:', todayStart, 'to', todayEnd);

    const allAssignments = await WorkerTaskAssignment.find({
      date: { $gte: todayStart, $lte: todayEnd }
    }).lean();

    console.log(`\nFound ${allAssignments.length} total assignments for today`);
    
    if (allAssignments.length > 0) {
      console.log('\nAssignments:');
      allAssignments.forEach(a => {
        console.log(`  - ID: ${a.id}, Employee: ${a.employeeId}, Supervisor: ${a.supervisorId}, Task: ${a.taskId}`);
      });
    }

    // Check specifically for employee 2
    const employee2Assignments = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: { $gte: todayStart, $lte: todayEnd }
    }).lean();

    console.log(`\n👤 Employee 2 has ${employee2Assignments.length} assignments`);
    
    if (employee2Assignments.length > 0) {
      employee2Assignments.forEach(a => {
        console.log(`  - Assignment ${a.id}: supervisorId = ${a.supervisorId}`);
      });
    }

    // Check if there are any assignments at all
    const totalCount = await WorkerTaskAssignment.countDocuments();
    console.log(`\n📊 Total assignments in database: ${totalCount}`);

    // Check recent assignments
    const recentAssignments = await WorkerTaskAssignment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    console.log('\n🕐 Most recent 5 assignments:');
    recentAssignments.forEach(a => {
      console.log(`  - ID: ${a.id}, Employee: ${a.employeeId}, Date: ${a.date}, Created: ${a.createdAt}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

checkAssignments();
