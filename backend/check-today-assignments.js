import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];

    console.log(`📅 Today: ${todayString}\n`);

    // Check all assignments
    const allAssignments = await WorkerTaskAssignment.find().sort({ date: -1 }).limit(20);
    console.log('Recent assignments:');
    allAssignments.forEach(a => {
      console.log(`  Date: ${a.date}, Employee: ${a.employeeId}, Project: ${a.projectId}`);
    });

    // Check today's assignments
    const todayAssignments = await WorkerTaskAssignment.find({ date: todayString });
    console.log(`\n📊 Assignments for ${todayString}: ${todayAssignments.length}`);

    // Try different date formats
    const todayAssignments2 = await WorkerTaskAssignment.find({ 
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 3600000) }
    });
    console.log(`📊 Assignments using date range: ${todayAssignments2.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

check();
