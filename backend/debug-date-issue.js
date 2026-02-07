import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function debugDateIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Get today's date like the API does
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('=== DATE COMPARISON ===\n');
    console.log('Today (API uses):', today);
    console.log('Today ISO:', today.toISOString());
    console.log('Today timestamp:', today.getTime());

    // Get all assignments for project 1
    console.log('\n=== ALL ASSIGNMENTS FOR PROJECT 1 ===\n');
    const allAssignments = await db.collection('workertaskassignments').find({
      projectId: 1
    }).toArray();

    console.log(`Total assignments for project 1: ${allAssignments.length}\n`);

    allAssignments.forEach(a => {
      console.log(`Assignment ${a.id}:`);
      console.log(`  Employee ID: ${a.employeeId}`);
      console.log(`  Task ID: ${a.taskId}`);
      console.log(`  Status: ${a.status}`);
      console.log(`  Date: ${a.date}`);
      console.log(`  Date type: ${typeof a.date}`);
      
      if (a.date) {
        const assignmentDate = new Date(a.date);
        console.log(`  Date parsed: ${assignmentDate}`);
        console.log(`  Date ISO: ${assignmentDate.toISOString()}`);
        console.log(`  Date timestamp: ${assignmentDate.getTime()}`);
        console.log(`  Is >= today? ${assignmentDate >= today ? 'YES ✅' : 'NO ❌'}`);
        console.log(`  Status matches? ${['queued', 'in_progress'].includes(a.status) ? 'YES ✅' : 'NO ❌'}`);
      } else {
        console.log(`  ❌ Date is null/undefined`);
      }
      console.log('');
    });

    // Try the exact query the API uses
    console.log('\n=== TESTING API QUERY ===\n');
    console.log('Query:', JSON.stringify({
      projectId: 1,
      date: { $gte: today },
      status: { $in: ['queued', 'in_progress'] }
    }, null, 2));

    const apiResults = await db.collection('workertaskassignments').find({
      projectId: 1,
      date: { $gte: today },
      status: { $in: ['queued', 'in_progress'] }
    }).toArray();

    console.log(`\nResults: ${apiResults.length} assignments found`);
    
    if (apiResults.length > 0) {
      apiResults.forEach(a => {
        console.log(`  - Assignment ${a.id}: Employee ${a.employeeId}, Task ${a.taskId}, Status: ${a.status}`);
      });
    }

    // Try without date filter
    console.log('\n=== TESTING WITHOUT DATE FILTER ===\n');
    const noDateResults = await db.collection('workertaskassignments').find({
      projectId: 1,
      status: { $in: ['queued', 'in_progress'] }
    }).toArray();

    console.log(`Results: ${noDateResults.length} assignments found`);
    if (noDateResults.length > 0) {
      noDateResults.forEach(a => {
        console.log(`  - Assignment ${a.id}: Employee ${a.employeeId}, Task ${a.taskId}, Status: ${a.status}, Date: ${a.date}`);
      });
    }

    console.log('\n');
    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

debugDateIssue();
