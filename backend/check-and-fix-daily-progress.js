import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignmentSchema = new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' });
const WorkerTaskProgressSchema = new mongoose.Schema({}, { strict: false, collection: 'workertaskprogresses' });

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);
const WorkerTaskProgress = mongoose.model('WorkerTaskProgress', WorkerTaskProgressSchema);

async function checkAndFix() {
  try {
    console.log('🔍 Checking Daily Progress Data...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Today's date: ${today}\n`);

    // Check existing assignments
    console.log('📋 Checking existing assignments for today...');
    const existingAssignments = await WorkerTaskAssignment.find({ date: today, projectId: 1 });
    console.log(`   Found ${existingAssignments.length} assignments`);

    if (existingAssignments.length > 0) {
      console.log('\n   Assignment IDs:');
      existingAssignments.forEach(a => {
        console.log(`   - ID: ${a.id}, Employee: ${a.employeeId}, Task: ${a.taskId}`);
      });

      // Check progress for these assignments
      const assignmentIds = existingAssignments.map(a => a.id);
      const existingProgress = await WorkerTaskProgress.find({
        workerTaskAssignmentId: { $in: assignmentIds }
      });

      console.log(`\n📊 Found ${existingProgress.length} progress records`);
      
      if (existingProgress.length > 0) {
        console.log('\n   Progress Records:');
        existingProgress.forEach(p => {
          console.log(`   - ID: ${p.id}, Status: ${p.status}, Progress: ${p.progressPercent}%`);
        });

        // Check how many are APPROVED
        const approvedCount = existingProgress.filter(p => p.status === 'APPROVED').length;
        console.log(`\n   ✅ APPROVED records: ${approvedCount}`);
        console.log(`   ⏳ Other status: ${existingProgress.length - approvedCount}`);

        if (approvedCount === 0) {
          console.log('\n⚠️  PROBLEM FOUND: No APPROVED progress records!');
          console.log('   Updating all progress records to APPROVED...');
          
          for (const progress of existingProgress) {
            progress.status = 'APPROVED';
            progress.approvedAt = new Date();
            progress.approvedBy = 4;
            await progress.save();
            console.log(`   ✅ Updated progress ${progress.id} to APPROVED`);
          }

          console.log('\n🎉 All progress records are now APPROVED!');
        } else {
          console.log('\n✅ Data looks good! You should be able to submit daily progress now.');
        }
      } else {
        console.log('\n⚠️  PROBLEM: Assignments exist but no progress records!');
        console.log('   Creating APPROVED progress records...');

        const progressPercentages = [75, 80, 70];
        const lastProgress = await WorkerTaskProgress.findOne().sort({ id: -1 });
        let nextId = lastProgress && lastProgress.id ? lastProgress.id + 1 : 2000;

        for (let i = 0; i < existingAssignments.length; i++) {
          const assignment = existingAssignments[i];
          await WorkerTaskProgress.create({
            id: nextId++,
            workerTaskAssignmentId: assignment.id,
            employeeId: assignment.employeeId,
            taskId: assignment.taskId,
            projectId: 1,
            date: today,
            progressPercent: progressPercentages[i] || 75,
            description: `Completed ${progressPercentages[i] || 75}% of work`,
            status: 'APPROVED',
            submittedAt: new Date(),
            approvedAt: new Date(),
            approvedBy: 4,
            photos: [],
            remarks: 'Good progress'
          });
          console.log(`   ✅ Created APPROVED progress for assignment ${assignment.id}`);
        }

        console.log('\n🎉 Progress records created!');
      }
    } else {
      console.log('\n⚠️  PROBLEM: No assignments found for today!');
      console.log('   Creating assignments and progress...');

      // Remove null ID records first
      console.log('\n🗑️  Cleaning up null ID records...');
      await WorkerTaskAssignment.deleteMany({ id: null });
      await WorkerTaskProgress.deleteMany({ id: null });
      console.log('   ✅ Cleanup complete');

      // Get max IDs
      const lastAssignment = await WorkerTaskAssignment.findOne().sort({ id: -1 });
      const lastProgress = await WorkerTaskProgress.findOne().sort({ id: -1 });
      
      let nextAssignmentId = lastAssignment && lastAssignment.id ? lastAssignment.id + 1 : 1000;
      let nextProgressId = lastProgress && lastProgress.id ? lastProgress.id + 1 : 2000;

      console.log(`\n   Next Assignment ID: ${nextAssignmentId}`);
      console.log(`   Next Progress ID: ${nextProgressId}`);

      const progressPercentages = [75, 80, 70];
      const newAssignments = [];

      for (let i = 0; i < 3; i++) {
        // Create assignment
        const assignment = await WorkerTaskAssignment.create({
          id: nextAssignmentId++,
          employeeId: 100 + i,
          taskId: i + 1,
          projectId: 1,
          date: today,
          status: 'assigned',
          assignedBy: 4,
          assignedAt: new Date()
        });
        newAssignments.push(assignment);
        console.log(`   ✅ Created assignment ${assignment.id}`);

        // Create APPROVED progress
        await WorkerTaskProgress.create({
          id: nextProgressId++,
          workerTaskAssignmentId: assignment.id,
          employeeId: assignment.employeeId,
          taskId: assignment.taskId,
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
        console.log(`   ✅ Created APPROVED progress ${progressPercentages[i]}%`);
      }

      console.log('\n🎉 All data created successfully!');
    }

    // Final verification
    console.log('\n' + '='.repeat(60));
    console.log('🔍 FINAL VERIFICATION');
    console.log('='.repeat(60));

    const finalAssignments = await WorkerTaskAssignment.find({ date: today, projectId: 1 });
    const finalAssignmentIds = finalAssignments.map(a => a.id);
    const finalProgress = await WorkerTaskProgress.find({
      workerTaskAssignmentId: { $in: finalAssignmentIds },
      status: 'APPROVED'
    });

    console.log(`✅ Assignments for today: ${finalAssignments.length}`);
    console.log(`✅ APPROVED progress records: ${finalProgress.length}`);

    if (finalAssignments.length > 0 && finalProgress.length > 0) {
      const avgProgress = Math.round(
        finalProgress.reduce((sum, p) => sum + p.progressPercent, 0) / finalProgress.length
      );
      console.log(`✅ Average progress: ${avgProgress}%`);
      console.log('\n🎉 SUCCESS! You can now test the API in Postman!');
      console.log('   The "No approved worker progress found" error is fixed!\n');
    } else {
      console.log('\n❌ Still have issues. Please check the data manually.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

checkAndFix();
