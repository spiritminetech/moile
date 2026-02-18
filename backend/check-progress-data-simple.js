import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Use EXACT collection names from the models
const WorkerTaskAssignmentSchema = new mongoose.Schema({}, { 
  strict: false, 
  collection: 'workerTaskAssignment'  // Singular, as per model
});

const WorkerTaskProgressSchema = new mongoose.Schema({}, { 
  strict: false, 
  collection: 'workerTaskProgress'  // Singular, as per model
});

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);
const WorkerTaskProgress = mongoose.model('WorkerTaskProgress', WorkerTaskProgressSchema);

async function checkProgressData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    console.log('='.repeat(80));
    console.log('� CHECKING PROGRESS DATA - SIMPLE VERSION');
    console.log('='.repeat(80));
    console.log('Collections: workerTaskAssignment + workerTaskProgress ONLY\n');

    // ============================================
    // STEP 1: Check Assignment 7061
    // ============================================
    console.log('1️⃣  CHECKING ASSIGNMENT 7061');
    console.log('-'.repeat(80));
    
    const assignment = await WorkerTaskAssignment.findOne({ id: 7061 });
    
    if (!assignment) {
      console.log('❌ Assignment 7061 NOT FOUND in workerTaskAssignment collection\n');
      
      // Check if any assignments exist
      const anyAssignment = await WorkerTaskAssignment.findOne();
      if (anyAssignment) {
        console.log('⚠️  Collection exists but assignment 7061 not found');
        console.log(`   Sample assignment ID: ${anyAssignment.id}\n`);
      } else {
        console.log('⚠️  Collection is empty or doesn\'t exist\n');
      }
      return;
    }
    
    console.log('✅ Assignment 7061 FOUND\n');
    console.log('📋 Assignment Data:');
    console.log(JSON.stringify(assignment.toObject(), null, 2));
    console.log('');

    // ============================================
    // STEP 2: Check Progress for Assignment 7061
    // ============================================
    console.log('2️⃣  CHECKING PROGRESS FOR ASSIGNMENT 7061');
    console.log('-'.repeat(80));
    
    const progresses = await WorkerTaskProgress.find({
      workerTaskAssignmentId: 7061
    }).sort({ submittedAt: 1 });
    
    console.log(`📊 Found ${progresses.length} progress record(s)\n`);
    
    if (progresses.length === 0) {
      console.log('❌ NO PROGRESS found for assignment 7061\n');
      
      // Check if any progress exists
      const anyProgress = await WorkerTaskProgress.findOne();
      if (anyProgress) {
        console.log('⚠️  Collection exists but no progress for assignment 7061');
        console.log(`   Sample progress assignmentId: ${anyProgress.workerTaskAssignmentId}\n`);
      } else {
        console.log('⚠️  Collection is empty or doesn\'t exist\n');
      }
      return;
    }
    
    progresses.forEach((progress, index) => {
      console.log(`📈 Progress Record #${index + 1}:`);
      console.log(JSON.stringify(progress.toObject(), null, 2));
      console.log('');
    });

    // ============================================
    // STEP 3: Test API Query (Date-based)
    // ============================================
    console.log('3️⃣  TESTING API QUERY (Date-based)');
    console.log('-'.repeat(80));
    
    const today = new Date().toISOString().split('T')[0]; // "2026-02-16"
    console.log(`Today's date: "${today}"`);
    console.log(`Assignment date: "${assignment.date}" (type: ${typeof assignment.date})\n`);
    
    // Test the exact query the API uses
    console.log('🧪 Testing API Query:');
    console.log(`   WorkerTaskAssignment.find({ projectId: ${assignment.projectId}, date: "${today}" })\n`);
    
    const apiQueryResult = await WorkerTaskAssignment.find({
      projectId: assignment.projectId,
      date: today
    });
    
    console.log(`   Result: ${apiQueryResult.length} assignment(s) found\n`);
    
    if (apiQueryResult.length === 0) {
      console.log('❌ API QUERY FAILED - No assignments found with today\'s date\n');
      console.log('💡 REASON: Date format mismatch');
      console.log(`   Assignment has: "${assignment.date}" (${typeof assignment.date})`);
      console.log(`   API searches for: "${today}" (string)`);
      console.log('');
      
      // Try to find what date format works
      console.log('🔍 Checking all assignments for this project:');
      const allProjectAssignments = await WorkerTaskAssignment.find({
        projectId: assignment.projectId
      }).limit(5);
      
      allProjectAssignments.forEach(a => {
        console.log(`   Assignment ${a.id}: date = "${a.date}" (${typeof a.date})`);
      });
      console.log('');
      
    } else {
      console.log('✅ API QUERY WORKS - Assignment found with date query\n');
      
      // Now check if progress would be returned
      // IMPORTANT: Use numeric 'id' field, not MongoDB '_id'
      const assignmentIds = apiQueryResult.map(a => a.id);
      console.log(`   Assignment IDs (numeric): [${assignmentIds.join(', ')}]\n`);
      
      const apiProgressResult = await WorkerTaskProgress.find({
        workerTaskAssignmentId: { $in: assignmentIds },
        status: { $in: ["SUBMITTED", "APPROVED"] }
      });
      
      console.log('🧪 Testing Progress Query:');
      console.log(`   WorkerTaskProgress.find({ workerTaskAssignmentId: { $in: [${assignmentIds.join(', ')}] }, status: ["SUBMITTED", "APPROVED"] })\n`);
      console.log(`   Result: ${apiProgressResult.length} progress record(s) found\n`);
      
      if (apiProgressResult.length === 0) {
        console.log('❌ NO PROGRESS with SUBMITTED/APPROVED status\n');
        console.log('💡 Progress exists but status might be different:');
        progresses.forEach(p => {
          console.log(`   Progress ${p.id}: status = "${p.status}"`);
        });
        console.log('');
      } else {
        console.log('✅ PROGRESS QUERY WORKS\n');
      }
    }

    // ============================================
    // STEP 4: Simulate API Response
    // ============================================
    console.log('4️⃣  SIMULATED API RESPONSE');
    console.log('-'.repeat(80));
    
    if (apiQueryResult.length > 0) {
      const assignmentIds = apiQueryResult.map(a => a.id);
      const apiProgresses = await WorkerTaskProgress.find({
        workerTaskAssignmentId: { $in: assignmentIds },
        status: { $in: ["SUBMITTED", "APPROVED"] }
      });
      
      const response = apiProgresses.map(progress => ({
        progressId: progress.id,
        assignmentId: progress.workerTaskAssignmentId,
        workerName: `Employee ${progress.employeeId}`,  // Would come from employees collection
        taskName: `Task ${assignment.taskId}`,  // Would come from tasks collection
        attendanceChecked: false,  // Would come from attendances collection
        progressPercent: progress.progressPercent,
        description: progress.description,
        status: progress.status,
        photos: []  // Would come from workerTaskPhotos collection
      }));
      
      console.log('📤 API Response (simplified):');
      console.log(JSON.stringify(response, null, 2));
      console.log('');
    } else {
      console.log('❌ Cannot simulate - API query returned no assignments\n');
    }

    // ============================================
    // STEP 5: Summary
    // ============================================
    console.log('5️⃣  SUMMARY');
    console.log('-'.repeat(80));
    
    const checks = {
      'Assignment 7061 exists': !!assignment,
      'Progress records exist': progresses.length > 0,
      'Progress has SUBMITTED/APPROVED status': progresses.some(p => p.status === 'SUBMITTED' || p.status === 'APPROVED'),
      'API date query works': apiQueryResult.length > 0
    };
    
    console.log('Checklist:');
    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${check}`);
    });
    console.log('');
    
    const allPassed = Object.values(checks).every(v => v);
    
    if (allPassed) {
      console.log('🎉 ALL CHECKS PASSED!');
      console.log('   The Progress Report API should work correctly\n');
    } else {
      console.log('⚠️  SOME CHECKS FAILED\n');
      
      if (!checks['API date query works']) {
        console.log('� MAIN ISSUE: Date format mismatch');
        console.log('   The API cannot find assignments because the date format doesn\'t match');
        console.log(`   Assignment date: "${assignment.date}" (${typeof assignment.date})`);
        console.log(`   API expects: "${today}" (string in YYYY-MM-DD format)\n`);
        console.log('   SOLUTION: Ensure assignment.date is stored as string "YYYY-MM-DD"\n');
      }
      
      if (!checks['Progress has SUBMITTED/APPROVED status']) {
        console.log('💡 ISSUE: Progress status');
        console.log('   The API only returns progress with status "SUBMITTED" or "APPROVED"');
        console.log('   Current status:');
        progresses.forEach(p => {
          console.log(`   - Progress ${p.id}: "${p.status}"`);
        });
        console.log('');
      }
    }

    console.log('='.repeat(80));
    console.log('✅ CHECK COMPLETE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkProgressData();
