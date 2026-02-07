import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function debugActiveTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Check supervisor
    const user = await db.collection('users').findOne({ email: 'supervisor@gmail.com' });
    console.log('👤 User:', user ? `ID ${user.id}` : 'NOT FOUND');

    const supervisor = await db.collection('supervisors').findOne({ userId: user?.id });
    console.log('📋 Supervisor:', supervisor ? `ID ${supervisor.id}` : 'NOT FOUND');

    // Check projects
    const projects = await db.collection('projects').find({ supervisorId: supervisor?.id }).toArray();
    console.log(`📍 Projects: ${projects.length}`);
    projects.forEach(p => {
      console.log(`   - Project ${p.id}: ${p.projectName}`);
    });

    // Check ALL task assignments
    console.log('\n🔍 Checking ALL task assignments...\n');
    const allAssignments = await db.collection('workertaskassignments').find({}).toArray();
    console.log(`Total assignments in database: ${allAssignments.length}\n`);

    if (allAssignments.length > 0) {
      console.log('All assignments:');
      allAssignments.forEach(a => {
        console.log(`\n  Assignment ID: ${a.id}`);
        console.log(`  Employee ID: ${a.employeeId}`);
        console.log(`  Task ID: ${a.taskId}`);
        console.log(`  Project ID: ${a.projectId}`);
        console.log(`  Status: ${a.status}`);
        console.log(`  Date: ${a.date}`);
        console.log(`  Daily Target: ${JSON.stringify(a.dailyTarget)}`);
      });
    }

    // Check what the API is looking for
    console.log('\n\n🔍 What the API is looking for:\n');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`Today's date (midnight): ${today.toISOString()}`);
    console.log(`Project ID: 1`);
    console.log(`Status: queued or in_progress`);
    console.log(`Date: >= ${today.toISOString()}`);

    // Try to find matching assignments
    const matchingAssignments = await db.collection('workertaskassignments').find({
      projectId: 1,
      date: { $gte: today },
      status: { $in: ['queued', 'in_progress'] }
    }).toArray();

    console.log(`\n✅ Matching assignments found: ${matchingAssignments.length}\n`);

    if (matchingAssignments.length > 0) {
      matchingAssignments.forEach(a => {
        console.log(`  - Assignment ${a.id}: Employee ${a.employeeId}, Task ${a.taskId}, Status: ${a.status}`);
      });
    } else {
      console.log('❌ No matching assignments found!\n');
      
      // Debug why
      console.log('Debugging reasons:\n');
      
      const wrongProject = await db.collection('workertaskassignments').find({
        projectId: { $ne: 1 }
      }).toArray();
      if (wrongProject.length > 0) {
        console.log(`⚠️ ${wrongProject.length} assignments have wrong project ID:`);
        wrongProject.forEach(a => {
          console.log(`   - Assignment ${a.id}: Project ID ${a.projectId} (should be 1)`);
        });
      }

      const wrongStatus = await db.collection('workertaskassignments').find({
        projectId: 1,
        status: { $nin: ['queued', 'in_progress'] }
      }).toArray();
      if (wrongStatus.length > 0) {
        console.log(`\n⚠️ ${wrongStatus.length} assignments have wrong status:`);
        wrongStatus.forEach(a => {
          console.log(`   - Assignment ${a.id}: Status '${a.status}' (should be 'queued' or 'in_progress')`);
        });
      }

      const wrongDate = await db.collection('workertaskassignments').find({
        projectId: 1,
        status: { $in: ['queued', 'in_progress'] },
        date: { $lt: today }
      }).toArray();
      if (wrongDate.length > 0) {
        console.log(`\n⚠️ ${wrongDate.length} assignments have old dates:`);
        wrongDate.forEach(a => {
          console.log(`   - Assignment ${a.id}: Date ${a.date} (should be >= ${today.toISOString()})`);
        });
      }

      // Check if date field exists
      const noDate = await db.collection('workertaskassignments').find({
        projectId: 1,
        date: { $exists: false }
      }).toArray();
      if (noDate.length > 0) {
        console.log(`\n⚠️ ${noDate.length} assignments have NO date field:`);
        noDate.forEach(a => {
          console.log(`   - Assignment ${a.id}`);
        });
      }
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

debugActiveTasks();
