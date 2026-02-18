import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Define schemas
const WorkerTaskAssignmentSchema = new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' });
const WorkerTaskProgressSchema = new mongoose.Schema({}, { strict: false, collection: 'workertaskprogresses' });
const EmployeeSchema = new mongoose.Schema({}, { strict: false, collection: 'employees' });
const TaskSchema = new mongoose.Schema({}, { strict: false, collection: 'tasks' });

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);
const WorkerTaskProgress = mongoose.model('WorkerTaskProgress', WorkerTaskProgressSchema);
const Employee = mongoose.model('Employee', EmployeeSchema);
const Task = mongoose.model('Task', TaskSchema);

async function verifyAssignment7061() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    console.log('='.repeat(80));
    console.log('🔍 VERIFYING ASSIGNMENT 7061 AND ITS PROGRESS DATA');
    console.log('='.repeat(80));
    console.log('');

    // ============================================
    // STEP 1: Find the specific assignment
    // ============================================
    console.log('1️⃣  CHECKING ASSIGNMENT 7061');
    console.log('-'.repeat(80));
    
    const assignment = await WorkerTaskAssignment.findOne({ id: 7061 });
    
    if (!assignment) {
      console.log('❌ Assignment 7061 NOT FOUND\n');
      return;
    }
    
    console.log('✅ Assignment 7061 FOUND\n');
    console.log('📋 Assignment Details:');
    console.log(`   ID: ${assignment.id}`);
    console.log(`   Project ID: ${assignment.projectId}`);
    console.log(`   Employee ID: ${assignment.employeeId}`);
    console.log(`   Supervisor ID: ${assignment.supervisorId}`);
    console.log(`   Task ID: ${assignment.taskId}`);
    console.log(`   Date: ${assignment.date} (type: ${typeof assignment.date})`);
    console.log(`   Status: ${assignment.status}`);
    
    if (assignment.dailyTarget) {
      console.log(`   Daily Target: ${assignment.dailyTarget.description}`);
      console.log(`   Target Quantity: ${assignment.dailyTarget.quantity} ${assignment.dailyTarget.unit}`);
    }
    
    console.log('');

    // ============================================
    // STEP 2: Get Employee Info
    // ============================================
    console.log('2️⃣  CHECKING EMPLOYEE DATA');
    console.log('-'.repeat(80));
    
    const employee = await Employee.findOne({ id: assignment.employeeId });
    
    if (employee) {
      console.log(`✅ Employee Found: ${employee.fullName || employee.name || 'Unknown'}`);
      console.log(`   Employee ID: ${employee.id}`);
      console.log(`   Role: ${employee.role || 'N/A'}`);
    } else {
      console.log(`⚠️  Employee ${assignment.employeeId} not found`);
    }
    console.log('');

    // ============================================
    // STEP 3: Get Task Info
    // ============================================
    console.log('3️⃣  CHECKING TASK DATA');
    console.log('-'.repeat(80));
    
    const task = await Task.findOne({ id: assignment.taskId });
    
    if (task) {
      console.log(`✅ Task Found: ${task.taskName || task.name || 'Unknown'}`);
      console.log(`   Task ID: ${task.id}`);
      console.log(`   Description: ${task.description || 'N/A'}`);
    } else {
      console.log(`⚠️  Task ${assignment.taskId} not found`);
    }
    console.log('');

    // ============================================
    // STEP 4: Find Progress Records
    // ============================================
    console.log('4️⃣  CHECKING PROGRESS SUBMISSIONS');
    console.log('-'.repeat(80));
    
    const progresses = await WorkerTaskProgress.find({
      workerTaskAssignmentId: 7061
    }).sort({ submittedAt: 1 });
    
    console.log(`📊 Found ${progresses.length} progress submission(s)\n`);
    
    if (progresses.length === 0) {
      console.log('❌ NO PROGRESS SUBMISSIONS found for assignment 7061\n');
    } else {
      progresses.forEach((progress, index) => {
        console.log(`📈 Progress #${index + 1}:`);
        console.log(`   Progress ID: ${progress.id}`);
        console.log(`   Assignment ID: ${progress.workerTaskAssignmentId}`);
        console.log(`   Employee ID: ${progress.employeeId}`);
        console.log(`   Progress: ${progress.progressPercent}%`);
        console.log(`   Status: ${progress.status}`);
        console.log(`   Description: ${progress.description}`);
        console.log(`   Notes: ${progress.notes || 'N/A'}`);
        console.log(`   Completed Quantity: ${progress.completedQuantity || 'N/A'}`);
        console.log(`   Submitted At: ${progress.submittedAt}`);
        console.log(`   Created At: ${progress.createdAt}`);
        console.log('');
      });
    }

    // ============================================
    // STEP 5: Check API Query Compatibility
    // ============================================
    console.log('5️⃣  TESTING API QUERY COMPATIBILITY');
    console.log('-'.repeat(80));
    
    const today = new Date().toISOString().split('T')[0];
    console.log(`Today's date (API format): "${today}"`);
    console.log(`Assignment date: "${assignment.date}" (type: ${typeof assignment.date})`);
    console.log('');
    
    // Test different query formats
    console.log('🧪 Testing Query Format #1: String comparison');
    const test1 = await WorkerTaskAssignment.find({
      projectId: assignment.projectId,
      date: today
    });
    console.log(`   Result: ${test1.length} assignment(s) found`);
    
    console.log('🧪 Testing Query Format #2: Date object comparison');
    const todayDate = new Date(today);
    const test2 = await WorkerTaskAssignment.find({
      projectId: assignment.projectId,
      date: todayDate
    });
    console.log(`   Result: ${test2.length} assignment(s) found`);
    
    console.log('🧪 Testing Query Format #3: Date range comparison');
    const startOfDay = new Date(today + 'T00:00:00.000Z');
    const endOfDay = new Date(today + 'T23:59:59.999Z');
    const test3 = await WorkerTaskAssignment.find({
      projectId: assignment.projectId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    console.log(`   Result: ${test3.length} assignment(s) found`);
    
    console.log('');
    
    // Determine which format works
    let workingFormat = null;
    if (test1.length > 0) workingFormat = 'String comparison';
    else if (test2.length > 0) workingFormat = 'Date object comparison';
    else if (test3.length > 0) workingFormat = 'Date range comparison';
    
    if (workingFormat) {
      console.log(`✅ Working query format: ${workingFormat}\n`);
    } else {
      console.log('❌ None of the query formats found the assignment\n');
      console.log('💡 This means the date format in the database is different from expected\n');
    }

    // ============================================
    // STEP 6: Simulate API Response
    // ============================================
    console.log('6️⃣  SIMULATING API RESPONSE');
    console.log('-'.repeat(80));
    
    if (progresses.length > 0) {
      const apiResponse = progresses
        .filter(p => p.status === 'SUBMITTED' || p.status === 'APPROVED')
        .map(progress => ({
          progressId: progress.id,
          assignmentId: assignment.id,
          workerName: employee ? employee.fullName : "Unknown Worker",
          taskName: task ? task.taskName : "Unknown Task",
          attendanceChecked: false, // Would need to check attendance collection
          progressPercent: progress.progressPercent,
          description: progress.description,
          status: progress.status,
          photos: []
        }));
      
      console.log('📤 Expected API Response:');
      console.log(JSON.stringify(apiResponse, null, 2));
      console.log('');
      
      if (apiResponse.length === 0) {
        console.log('⚠️  No progress with status SUBMITTED or APPROVED');
        console.log('   Only these statuses are returned by the API\n');
      }
    } else {
      console.log('❌ Cannot simulate API response - no progress data found\n');
    }

    // ============================================
    // STEP 7: Summary
    // ============================================
    console.log('7️⃣  SUMMARY');
    console.log('-'.repeat(80));
    
    const checks = {
      'Assignment 7061 exists': !!assignment,
      'Employee data exists': !!employee,
      'Task data exists': !!task,
      'Progress submissions exist': progresses.length > 0,
      'Progress has correct status': progresses.some(p => p.status === 'SUBMITTED' || p.status === 'APPROVED'),
      'Date query works': workingFormat !== null
    };
    
    console.log('Checklist:');
    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${check}`);
    });
    console.log('');
    
    const allPassed = Object.values(checks).every(v => v);
    
    if (allPassed) {
      console.log('🎉 ALL CHECKS PASSED!');
      console.log('   The data is ready for the Progress Report API\n');
      
      if (!workingFormat || workingFormat !== 'String comparison') {
        console.log('⚠️  WARNING: The API uses string comparison for dates');
        console.log('   Your assignment date format may not match');
        console.log(`   Assignment date: ${assignment.date} (${typeof assignment.date})`);
        console.log(`   Expected format: "2026-02-16" (string)\n`);
      }
    } else {
      console.log('⚠️  SOME CHECKS FAILED');
      console.log('   Review the issues above\n');
    }

    console.log('='.repeat(80));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

verifyAssignment7061();
