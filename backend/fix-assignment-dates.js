import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixAssignmentDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Get today's date at midnight UTC
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log(`Setting all assignment dates to: ${today.toISOString()}\n`);

    // Update all assignments with project ID 1 to today's date
    const result = await db.collection('workertaskassignments').updateMany(
      { 
        projectId: 1,
        status: 'queued'
      },
      { 
        $set: { 
          date: today,
          updatedAt: new Date()
        } 
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} assignments\n`);

    // Verify
    const assignments = await db.collection('workertaskassignments').find({
      projectId: 1,
      status: 'queued'
    }).toArray();

    console.log('Updated assignments:');
    assignments.forEach(a => {
      console.log(`  - Assignment ${a.id}: Date = ${a.date.toISOString()}`);
    });

    // Test the query that the API uses
    console.log('\n🧪 Testing API query...');
    const testToday = new Date();
    testToday.setHours(0, 0, 0, 0);

    const matching = await db.collection('workertaskassignments').find({
      projectId: 1,
      date: { $gte: testToday },
      status: { $in: ['queued', 'in_progress'] }
    }).toArray();

    console.log(`✅ API query would return: ${matching.length} assignments\n`);

    if (matching.length > 0) {
      console.log('Matching assignments:');
      matching.forEach(a => {
        console.log(`  - Assignment ${a.id}: Employee ${a.employeeId}, Task ${a.taskId}`);
      });
    }

    console.log('\n✅ Done! Try the API again in Postman.\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

fixAssignmentDates();
