import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Define schemas
const WorkerTaskAssignmentSchema = new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' });
const WorkerTaskProgressSchema = new mongoose.Schema({}, { strict: false, collection: 'workertaskprogresses' });

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);
const WorkerTaskProgress = mongoose.model('WorkerTaskProgress', WorkerTaskProgressSchema);

async function fixData() {
  try {
    console.log('🔧 Fixing Daily Progress Data...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Today's date: ${today}\n`);

    // Step 1: Clear old data for today
    console.log('🗑️  Clearing old data for today...');
    await WorkerTaskAssignment.deleteMany({ date: today, projectId: 1 });
    await WorkerTaskProgress.deleteMany({ date: today, projectId: 1 });
    console.log('✅ Old data cleared\n');

    // Step 2: Create 3 worker task assignments
    console.log('📋 Creating worker task assignments...');
    
    // Get max ID
    const lastAssignment = await WorkerTaskAssignment.findOne().sort({ id: -1 });
    let nextId = lastAssignment && lastAssignment.id ? lastAssignment.id + 1 : 1000;
    
    const assignments = [];
    for (let i = 1; i <= 3; i++) {
      const assignment = await WorkerTaskAssignment.create({
        id: nextId++,
        employeeId: 100 + i,
        taskId: i,
        projectId: 1,
        date: today,
        status: 'assigned',
        assignedBy: 4,
        assignedAt: new Date()
      });
      assignments.push(assignment);
      console.log(`   ✅ Assignment ${i} created (ID: ${assignment.id})`);
    }

    // Step 3: Create APPROVED progress for each assignment
    console.log('\n📊 Creating APPROVED progress records...');
    
    // Get max ID
    const lastProgress = await WorkerTaskProgress.findOne().sort({ id: -1 });
    let nextProgressId = lastProgress && lastProgress.id ? lastProgress.id + 1 : 2000;
    
    const progressPercentages = [75, 80, 70];
    
    for (let i = 0; i < assignments.length; i++) {
      const progress = await WorkerTaskProgress.create({
        id: nextProgressId++,
        workerTaskAssignmentId: assignments[i].id,
        employeeId: 100 + i + 1,
        taskId: i + 1,
        projectId: 1,
        date: today,
        progressPercent: progressPercentages[i],
        description: `Completed ${progressPercentages[i]}% of work`,
        status: 'APPROVED',
        submittedAt: new Date(),
        approvedAt: new Date(),
        approvedBy: 4,
        photos: [],
        remarks: 'Good progress'
      });
      console.log(`   ✅ Progress ${i + 1} created - ${progressPercentages[i]}% (Status: APPROVED)`);
    }

    // Step 4: Verify
    console.log('\n🔍 Verifying data...');
    const assignmentCount = await WorkerTaskAssignment.countDocuments({ date: today, projectId: 1 });
    const assignmentIds = assignments.map(a => a.id);
    const approvedCount = await WorkerTaskProgress.countDocuments({
      workerTaskAssignmentId: { $in: assignmentIds },
      status: 'APPROVED'
    });

    console.log(`   ✅ Assignments: ${assignmentCount}`);
    console.log(`   ✅ Approved Progress: ${approvedCount}`);

    if (assignmentCount > 0 && approvedCount > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('🎉 SUCCESS! Data created successfully!');
      console.log('='.repeat(60));
      console.log('\n✅ You can now test the API in Postman!');
      console.log('   The "No approved worker progress found" error is fixed!\n');
      console.log('📝 Test with this body:');
      console.log(JSON.stringify({
        projectId: 1,
        remarks: "Good progress today. Foundation work completed.",
        issues: "No major issues."
      }, null, 2));
    } else {
      console.log('\n❌ WARNING: Data creation incomplete!');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

fixData();
