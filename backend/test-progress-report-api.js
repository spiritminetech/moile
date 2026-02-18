import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Define schemas
const ProjectSchema = new mongoose.Schema({}, { strict: false, collection: 'projects' });
const WorkerTaskAssignmentSchema = new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' });
const WorkerTaskProgressSchema = new mongoose.Schema({}, { strict: false, collection: 'workertaskprogresses' });
const EmployeeSchema = new mongoose.Schema({}, { strict: false, collection: 'employees' });
const TaskSchema = new mongoose.Schema({}, { strict: false, collection: 'tasks' });
const AttendanceSchema = new mongoose.Schema({}, { strict: false, collection: 'attendances' });

const Project = mongoose.model('Project', ProjectSchema);
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);
const WorkerTaskProgress = mongoose.model('WorkerTaskProgress', WorkerTaskProgressSchema);
const Employee = mongoose.model('Employee', EmployeeSchema);
const Task = mongoose.model('Task', TaskSchema);
const Attendance = mongoose.model('Attendance', AttendanceSchema);

// Test configuration
const TEST_SUPERVISOR_ID = 4;
const TEST_PROJECT_ID = 1002;
const TODAY = new Date().toISOString().split('T')[0]; // "2026-02-16"

async function testProgressReportAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    console.log('='.repeat(80));
    console.log('🧪 TESTING PROGRESS REPORT API DATA');
    console.log('='.repeat(80));
    console.log(`📅 Test Date: ${TODAY}`);
    console.log(`👤 Supervisor ID: ${TEST_SUPERVISOR_ID}`);
    console.log(`🏗️  Project ID: ${TEST_PROJECT_ID}\n`);

    // ============================================
    // STEP 1: Check Supervisor-Project Assignment
    // ============================================
    console.log('1️⃣  CHECKING SUPERVISOR-PROJECT ASSIGNMENT');
    console.log('-'.repeat(80));
    
    const project = await Project.findOne({ 
      $or: [
        { id: TEST_PROJECT_ID },
        { projectId: TEST_PROJECT_ID }
      ]
    });
    
    if (!project) {
      console.log(`❌ Project ${TEST_PROJECT_ID} NOT FOUND in database`);
      console.log('\n💡 SOLUTION: Create project with ID 1002\n');
      return;
    }
    
    console.log(`✅ Project Found: ${project.projectName || project.name || 'Unnamed Project'}`);
    console.log(`   Project ID (numeric): ${project.id || project.projectId || 'N/A'}`);
    console.log(`   Project _id (MongoDB): ${project._id}`);
    console.log(`   Supervisor ID: ${project.supervisorId}`);
    console.log(`   Status: ${project.status || project.projectStatus}`);
    
    if (project.supervisorId !== TEST_SUPERVISOR_ID) {
      console.log(`\n⚠️  WARNING: Project supervisor (${project.supervisorId}) does NOT match test supervisor (${TEST_SUPERVISOR_ID})`);
      console.log(`\n💡 SOLUTION: Update project supervisorId to ${TEST_SUPERVISOR_ID}`);
      console.log(`   Run: db.projects.updateOne({ id: ${TEST_PROJECT_ID} }, { $set: { supervisorId: ${TEST_SUPERVISOR_ID} } })\n`);
    } else {
      console.log(`✅ Supervisor ${TEST_SUPERVISOR_ID} is assigned to Project ${TEST_PROJECT_ID}\n`);
    }

    // ============================================
    // STEP 2: Check Worker Task Assignments
    // ============================================
    console.log('2️⃣  CHECKING WORKER TASK ASSIGNMENTS FOR TODAY');
    console.log('-'.repeat(80));
    
    console.log(`🔍 Searching for assignments with:`);
    console.log(`   projectId: ${TEST_PROJECT_ID} (numeric)`);
    console.log(`   date: "${TODAY}" (string format)\n`);
    
    // Try multiple query formats to handle different date storage formats
    let assignments = await WorkerTaskAssignment.find({
      projectId: TEST_PROJECT_ID,
      date: TODAY
    });
    
    // If no results, try with Date object
    if (assignments.length === 0) {
      console.log('⚠️  No results with string date, trying Date object format...\n');
      const todayDate = new Date(TODAY);
      assignments = await WorkerTaskAssignment.find({
        projectId: TEST_PROJECT_ID,
        date: todayDate
      });
    }
    
    // If still no results, try date range query
    if (assignments.length === 0) {
      console.log('⚠️  No results with Date object, trying date range query...\n');
      const startOfDay = new Date(TODAY + 'T00:00:00.000Z');
      const endOfDay = new Date(TODAY + 'T23:59:59.999Z');
      assignments = await WorkerTaskAssignment.find({
        projectId: TEST_PROJECT_ID,
        date: { $gte: startOfDay, $lte: endOfDay }
      });
    }
    
    // If STILL no results, show all assignments for this project
    if (assignments.length === 0) {
      console.log('⚠️  No results with date range, checking ALL assignments for this project...\n');
      const allAssignments = await WorkerTaskAssignment.find({
        projectId: TEST_PROJECT_ID
      }).limit(10);
      
      if (allAssignments.length > 0) {
        console.log(`📋 Found ${allAssignments.length} total assignments for project ${TEST_PROJECT_ID}:`);
        allAssignments.forEach(a => {
          console.log(`   - Assignment ${a.id}: date = ${a.date} (type: ${typeof a.date})`);
        });
        console.log('');
      }
    }
    
    console.log(`📋 Found ${assignments.length} task assignments for today\n`);
    
    if (assignments.length === 0) {
      console.log('❌ NO TASK ASSIGNMENTS found for today');
      console.log('\n💡 SOLUTION: Create worker task assignments for today');
      console.log(`   - projectId: ${TEST_PROJECT_ID}`);
      console.log(`   - date: "${TODAY}"`);
      console.log(`   - supervisorId: ${TEST_SUPERVISOR_ID}\n`);
      return;
    }
    
    // Check if assignments have correct supervisorId
    const assignmentsWithWrongSupervisor = assignments.filter(a => a.supervisorId !== TEST_SUPERVISOR_ID);
    if (assignmentsWithWrongSupervisor.length > 0) {
      console.log(`⚠️  WARNING: ${assignmentsWithWrongSupervisor.length} assignments have different supervisorId:`);
      assignmentsWithWrongSupervisor.forEach(a => {
        console.log(`   - Assignment ID ${a.id}: supervisorId = ${a.supervisorId}`);
      });
      console.log('');
    }
    
    // Display assignment details
    for (const assignment of assignments) {
      console.log(`📌 Assignment ID: ${assignment.id}`);
      console.log(`   Employee ID: ${assignment.employeeId}`);
      console.log(`   Task ID: ${assignment.taskId}`);
      console.log(`   Supervisor ID: ${assignment.supervisorId}`);
      console.log(`   Status: ${assignment.status}`);
      console.log(`   Date: ${assignment.date}`);
      
      // Get employee name
      const employee = await Employee.findOne({ id: assignment.employeeId });
      if (employee) {
        console.log(`   Worker Name: ${employee.fullName || employee.name || 'Unknown'}`);
      }
      
      // Get task name
      const task = await Task.findOne({ id: assignment.taskId });
      if (task) {
        console.log(`   Task Name: ${task.taskName || task.name || 'Unknown'}`);
      }
      
      console.log('');
    }

    // ============================================
    // STEP 3: Check Worker Task Progress
    // ============================================
    console.log('3️⃣  CHECKING WORKER TASK PROGRESS SUBMISSIONS');
    console.log('-'.repeat(80));
    
    const assignmentIds = assignments.map(a => a.id);
    
    const progresses = await WorkerTaskProgress.find({
      workerTaskAssignmentId: { $in: assignmentIds },
      status: { $in: ["SUBMITTED", "APPROVED"] }
    });
    
    console.log(`📊 Found ${progresses.length} progress submissions\n`);
    
    if (progresses.length === 0) {
      console.log('❌ NO PROGRESS SUBMISSIONS found');
      console.log('\n💡 SOLUTION: Workers need to submit progress for their tasks');
      console.log('   OR create test progress data using the worker app\n');
      return;
    }
    
    // Display progress details
    for (const progress of progresses) {
      const assignment = assignments.find(a => a.id === progress.workerTaskAssignmentId);
      
      console.log(`📈 Progress ID: ${progress.id}`);
      console.log(`   Assignment ID: ${progress.workerTaskAssignmentId}`);
      console.log(`   Employee ID: ${progress.employeeId}`);
      console.log(`   Progress: ${progress.progressPercent}%`);
      console.log(`   Status: ${progress.status}`);
      console.log(`   Description: ${progress.description}`);
      console.log(`   Submitted At: ${progress.submittedAt}`);
      
      if (assignment) {
        const employee = await Employee.findOne({ id: assignment.employeeId });
        const task = await Task.findOne({ id: assignment.taskId });
        console.log(`   Worker: ${employee?.fullName || 'Unknown'}`);
        console.log(`   Task: ${task?.taskName || 'Unknown'}`);
      }
      
      console.log('');
    }

    // ============================================
    // STEP 4: Check Attendance Records
    // ============================================
    console.log('4️⃣  CHECKING ATTENDANCE RECORDS FOR TODAY');
    console.log('-'.repeat(80));
    
    const today = new Date();
    const startOfDayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0));
    const endOfDayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59));
    
    const employeeIds = assignments.map(a => a.employeeId);
    
    const attendances = await Attendance.find({
      employeeId: { $in: employeeIds },
      projectId: TEST_PROJECT_ID,
      date: { $gte: startOfDayUTC, $lte: endOfDayUTC },
      checkIn: { $ne: null }
    });
    
    console.log(`👥 Found ${attendances.length} attendance records\n`);
    
    if (attendances.length === 0) {
      console.log('⚠️  WARNING: No attendance records found for today');
      console.log('   Workers may not have checked in yet\n');
    } else {
      for (const attendance of attendances) {
        const employee = await Employee.findOne({ id: attendance.employeeId });
        console.log(`✅ Employee ID ${attendance.employeeId} (${employee?.fullName || 'Unknown'})`);
        console.log(`   Check-in: ${attendance.checkIn}`);
        console.log(`   Check-out: ${attendance.checkOut || 'Not checked out'}`);
        console.log('');
      }
    }

    // ============================================
    // STEP 5: Simulate API Response
    // ============================================
    console.log('5️⃣  SIMULATING API RESPONSE');
    console.log('-'.repeat(80));
    console.log('API Endpoint: GET /api/supervisor/projects/:projectId/worker-submissions/today');
    console.log(`URL: /api/supervisor/projects/${TEST_PROJECT_ID}/worker-submissions/today\n`);
    
    const apiResponse = [];
    
    for (const progress of progresses) {
      const assignment = assignments.find(a => a.id === progress.workerTaskAssignmentId);
      if (!assignment) continue;
      
      const worker = await Employee.findOne({ id: assignment.employeeId });
      const task = await Task.findOne({ id: assignment.taskId });
      const attendance = attendances.find(a => a.employeeId === assignment.employeeId);
      
      apiResponse.push({
        progressId: progress.id,
        assignmentId: assignment.id,
        workerName: worker ? worker.fullName : "Unknown Worker",
        taskName: task ? task.taskName : "Unknown Task",
        attendanceChecked: !!attendance,
        progressPercent: progress.progressPercent,
        description: progress.description,
        status: progress.status,
        photos: [] // Photos would be fetched separately
      });
    }
    
    console.log('📤 API Response:');
    console.log(JSON.stringify(apiResponse, null, 2));
    console.log('');

    // ============================================
    // STEP 6: Summary and Recommendations
    // ============================================
    console.log('6️⃣  SUMMARY AND RECOMMENDATIONS');
    console.log('-'.repeat(80));
    
    const issues = [];
    const recommendations = [];
    
    if (!project) {
      issues.push(`Project ${TEST_PROJECT_ID} does not exist`);
      recommendations.push(`Create project with ID ${TEST_PROJECT_ID}`);
    } else if (project.supervisorId !== TEST_SUPERVISOR_ID) {
      issues.push(`Project supervisor mismatch (expected: ${TEST_SUPERVISOR_ID}, actual: ${project.supervisorId})`);
      recommendations.push(`Update project supervisorId to ${TEST_SUPERVISOR_ID}`);
    }
    
    if (assignments.length === 0) {
      issues.push('No task assignments for today');
      recommendations.push(`Create worker task assignments for date "${TODAY}"`);
    }
    
    if (progresses.length === 0) {
      issues.push('No progress submissions found');
      recommendations.push('Workers need to submit progress through the mobile app');
    }
    
    if (attendances.length === 0) {
      issues.push('No attendance records for today');
      recommendations.push('Workers need to check in through the mobile app');
    }
    
    if (issues.length === 0) {
      console.log('✅ ALL CHECKS PASSED!');
      console.log('   The Progress Report API should work correctly.');
      console.log(`   Data is ready for Supervisor ${TEST_SUPERVISOR_ID} on Project ${TEST_PROJECT_ID}\n`);
    } else {
      console.log('⚠️  ISSUES FOUND:');
      issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
      console.log('');
      
      console.log('💡 RECOMMENDATIONS:');
      recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
      console.log('');
    }

    // ============================================
    // STEP 7: Test Data Requirements
    // ============================================
    console.log('7️⃣  REQUIRED DATA FOR PROGRESS REPORT API');
    console.log('-'.repeat(80));
    console.log('To test the Progress Report API, you need:\n');
    
    console.log('📋 1. PROJECT DATA:');
    console.log('   {');
    console.log(`     "id": ${TEST_PROJECT_ID},`);
    console.log(`     "supervisorId": ${TEST_SUPERVISOR_ID},`);
    console.log('     "projectName": "Test Project",');
    console.log('     "status": "Ongoing"');
    console.log('   }\n');
    
    console.log('📋 2. WORKER TASK ASSIGNMENT:');
    console.log('   {');
    console.log('     "id": 7061,');
    console.log(`     "projectId": ${TEST_PROJECT_ID},`);
    console.log('     "employeeId": 2,');
    console.log(`     "supervisorId": ${TEST_SUPERVISOR_ID},`);
    console.log('     "taskId": 84410,');
    console.log(`     "date": "${TODAY}",`);
    console.log('     "status": "in_progress"');
    console.log('   }\n');
    
    console.log('📋 3. WORKER TASK PROGRESS:');
    console.log('   {');
    console.log('     "id": 44,');
    console.log('     "workerTaskAssignmentId": 7061,');
    console.log('     "employeeId": 2,');
    console.log('     "progressPercent": 75,');
    console.log('     "description": "Completed sinks and toilet",');
    console.log('     "status": "SUBMITTED",');
    console.log(`     "submittedAt": "${new Date().toISOString()}"`);
    console.log('   }\n');
    
    console.log('📋 4. ATTENDANCE RECORD (Optional but recommended):');
    console.log('   {');
    console.log('     "employeeId": 2,');
    console.log(`     "projectId": ${TEST_PROJECT_ID},`);
    console.log(`     "date": "${new Date().toISOString()}",`);
    console.log(`     "checkIn": "${new Date().toISOString()}"`);
    console.log('   }\n');

    console.log('='.repeat(80));
    console.log('✅ TEST COMPLETE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

testProgressReportAPI();
