import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkAssignments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const db = mongoose.connection.db;

    // Count all assignments
    const total = await db.collection('workertaskassignments').countDocuments({});
    console.log(`Total assignments: ${total}\n`);

    if (total > 0) {
      const assignments = await db.collection('workertaskassignments').find({}).limit(10).toArray();
      
      console.log('Sample assignments:');
      assignments.forEach(a => {
        console.log(`\nID: ${a.id}`);
        console.log(`  Project: ${a.projectId}`);
        console.log(`  Employee: ${a.employeeId}`);
        console.log(`  Task: ${a.taskId}`);
        console.log(`  Status: ${a.status}`);
        console.log(`  Date: ${a.date}`);
      });

      // Check today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      console.log(`\n\nToday (midnight): ${today.toISOString()}`);

      // Count by criteria
      const project1 = await db.collection('workertaskassignments').countDocuments({ projectId: 1 });
      const queued = await db.collection('workertaskassignments').countDocuments({ status: 'queued' });
      const todayCount = await db.collection('workertaskassignments').countDocuments({ 
        date: { $gte: today } 
      });

      console.log(`\nProject ID 1: ${project1}`);
      console.log(`Status 'queued': ${queued}`);
      console.log(`Date >= today: ${todayCount}`);

      // Try exact match
      const match = await db.collection('workertaskassignments').countDocuments({
        projectId: 1,
        status: { $in: ['queued', 'in_progress'] },
        date: { $gte: today }
      });

      console.log(`\n✅ Matching all criteria: ${match}`);
    }

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkAssignments();
