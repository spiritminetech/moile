import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

// Define schemas
const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const EmployeeSchema = new mongoose.Schema({}, { strict: false, collection: 'employees' });
const ProjectSchema = new mongoose.Schema({}, { strict: false, collection: 'projects' });
const WorkerTaskAssignmentSchema = new mongoose.Schema({}, { strict: false, collection: 'workerTaskAssignment' });
const WorkerTaskProgressSchema = new mongoose.Schema({}, { strict: false, collection: 'workerTaskProgress' });

const User = mongoose.model('User', UserSchema);
const Employee = mongoose.model('Employee', EmployeeSchema);
const Project = mongoose.model('Project', ProjectSchema);
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);
const WorkerTaskProgress = mongoose.model('WorkerTaskProgress', WorkerTaskProgressSchema);

const SUPERVISOR_EMAIL = 'supervisor@gmail.com';
const SUPERVISOR_PASSWORD = 'password123';
const TODAY = new Date().toISOString().split('T')[0];

async function testSupervisorLoginAndProgress() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    console.log('='.repeat(80));
    console.log('🔍 TESTING SUPERVISOR LOGIN AND PROGRESS REPORT');
    console.log('='.repeat(80));
    console.log(`📧 Email: ${SUPERVISOR_EMAIL}`);
    console.log(`🔑 Password: ${SUPERVISOR_PASSWORD}`);
    console.log(`📅 Today: ${TODAY}\n`);

    // ============================================
    // STEP 1: Check Supervisor User Account
    // ============================================
    console.log('1️⃣  CHECKING SUPERVISOR USER ACCOUNT');
    console.log('-'.repeat(80));
    
    const user = await User.findOne({ email: SUPERVISOR_EMAIL });
    
    if (!user) {
      console.log(`❌ User with email "${SUPERVISOR_EMAIL}" NOT FOUND\n`);
      console.log('💡 SOLUTION: Create user account with this email\n');
      return;
    }
    
    console.log('✅ User account found');
    console.log(`   User _id (MongoDB): ${user._id}`);
    console.log(`   User id (numeric): ${user.toObject().id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    
    // Get the numeric id from the document
    const userId = user.toObject().id || user.get('id');
    console.log(`   Using User ID: ${userId} (type: ${typeof userId})`);
    
    // Test password
    const passwordMatch = await bcrypt.compare(SUPERVISOR_PASSWORD, user.password || user.passwordHash);
    if (passwordMatch) {
      console.log(`   Password: ✅ Correct`);
    } else {
      console.log(`   Password: ❌ Incorrect`);
      console.log(`\n💡 SOLUTION: Update password for ${SUPERVISOR_EMAIL}\n`);
      return;
    }
    console.log('');

    // ============================================
    // STEP 2: Check Employee Record
    // ============================================
    console.log('2️⃣  CHECKING EMPLOYEE RECORD');
    console.log('-'.repeat(80));
    
    // User has 'id' field, Employee has 'userId' field that links to User.id
    console.log(`Searching for employee with userId: ${userId}\n`);
    
    const employee = await Employee.findOne({ userId: userId });
    
    if (!employee) {
      console.log(`❌ Employee with userId ${userId} NOT FOUND\n`);
      
      // Check if employee exists with id: 4
      const employeeById = await Employee.findOne({ id: 4 });
      if (employeeById) {
        console.log('⚠️  Found employee with id: 4');
        console.log(`   Employee userId: ${employeeById.userId}`);
        console.log(`   Employee name: ${employeeById.fullName}`);
        console.log('');
        console.log('💡 SOLUTION: Update employee userId to match user id');
        console.log(`   Run: db.employees.updateOne({ id: 4 }, { $set: { userId: ${userId} } })\n`);
      } else {
        console.log('💡 SOLUTION: Create employee record with userId: ' + userId + '\n');
      }
      return;
    }
    
    console.log('✅ Employee record found');
    console.log(`   Employee _id (MongoDB): ${employee._id}`);
    console.log(`   Employee id (from .id): ${employee.id}`);
    console.log(`   Employee id (numeric): ${employee.toObject().id}`);
    console.log(`   User ID: ${employee.userId}`);
    console.log(`   Name: ${employee.fullName || employee.name}`);
    console.log(`   Email: ${employee.email}`);
    console.log(`   Status: ${employee.status}`);
    console.log('');
    
    // Get the numeric employee id
    const SUPERVISOR_ID = employee.toObject().id || employee.get('id');
    console.log(`👤 Supervisor ID: ${SUPERVISOR_ID}\n`);

    // ============================================
    // STEP 3: Check Projects Assigned to Supervisor
    // ============================================
    console.log('3️⃣  CHECKING PROJECTS ASSIGNED TO SUPERVISOR');
    console.log('-'.repeat(80));
    
    const projects = await Project.find({ supervisorId: SUPERVISOR_ID });
    
    console.log(`📋 Found ${projects.length} project(s) assigned to supervisor ${SUPERVISOR_ID}\n`);
    
    if (projects.length === 0) {
      console.log('❌ NO PROJECTS assigned to this supervisor\n');
      console.log('💡 SOLUTION: Assign projects to supervisorId: ' + SUPERVISOR_ID);
      console.log('   Run: db.projects.updateOne({ id: 1002 }, { $set: { supervisorId: ' + SUPERVISOR_ID + ' } })\n');
      return;
    }
    
    projects.forEach((project, index) => {
      const projectObj = project.toObject();
      console.log(`Project #${index + 1}:`);
      console.log(`   ID (numeric): ${projectObj.id}`);
      console.log(`   ID (from .id): ${project.id}`);
      console.log(`   Name: ${project.projectName || project.name}`);
      console.log(`   Status: ${project.status || project.projectStatus}`);
      console.log(`   Supervisor ID: ${project.supervisorId}`);
      console.log('');
    });

    // ============================================
    // STEP 4: Check Task Assignments for Today
    // ============================================
    console.log('4️⃣  CHECKING TASK ASSIGNMENTS FOR TODAY');
    console.log('-'.repeat(80));
    
    // Get numeric project IDs
    const projectIds = projects.map(p => p.toObject().id || p.get('id'));
    console.log(`Searching in projects (numeric IDs): [${projectIds.join(', ')}]`);
    console.log(`Date: "${TODAY}"\n`);
    
    const assignments = await WorkerTaskAssignment.find({
      projectId: { $in: projectIds },
      date: TODAY
    });
    
    console.log(`📋 Found ${assignments.length} task assignment(s) for today\n`);
    
    if (assignments.length === 0) {
      console.log('❌ NO TASK ASSIGNMENTS for today\n');
      console.log('💡 SOLUTION: Create task assignments for today');
      console.log(`   - projectId: ${projectIds[0] || 1002}`);
      console.log(`   - date: "${TODAY}"`);
      console.log(`   - supervisorId: ${SUPERVISOR_ID}\n`);
      
      // Check if assignments exist for other dates
      const anyAssignments = await WorkerTaskAssignment.find({
        projectId: { $in: projectIds }
      }).limit(5);
      
      if (anyAssignments.length > 0) {
        console.log('⚠️  Assignments exist for other dates:');
        anyAssignments.forEach(a => {
          console.log(`   - Assignment ${a.id}: date = "${a.date}"`);
        });
        console.log('');
      }
      
      return;
    }
    
    assignments.forEach((assignment, index) => {
      const assignmentObj = assignment.toObject();
      console.log(`Assignment #${index + 1}:`);
      console.log(`   ID (numeric): ${assignmentObj.id}`);
      console.log(`   ID (from .id): ${assignment.id}`);
      console.log(`   Project ID: ${assignment.projectId}`);
      console.log(`   Employee ID: ${assignment.employeeId}`);
      console.log(`   Task ID: ${assignment.taskId}`);
      console.log(`   Date: ${assignment.date}`);
      console.log(`   Status: ${assignment.status}`);
      console.log('');
    });

    // ============================================
    // STEP 5: Check Progress Submissions
    // ============================================
    console.log('5️⃣  CHECKING PROGRESS SUBMISSIONS');
    console.log('-'.repeat(80));
    
    // Get numeric assignment IDs
    const assignmentIds = assignments.map(a => a.toObject().id || a.get('id'));
    console.log(`Assignment IDs (numeric): [${assignmentIds.join(', ')}]`);
    console.log(`ID types: [${assignmentIds.map(id => typeof id).join(', ')}]\n`);
    
    const progresses = await WorkerTaskProgress.find({
      workerTaskAssignmentId: { $in: assignmentIds },
      status: { $in: ["SUBMITTED", "APPROVED"] }
    });
    
    console.log(`📊 Found ${progresses.length} progress submission(s) with SUBMITTED/APPROVED status\n`);
    
    if (progresses.length === 0) {
      console.log('❌ NO PROGRESS SUBMISSIONS found\n');
      
      // Check if progress exists with any status
      const anyProgress = await WorkerTaskProgress.find({
        workerTaskAssignmentId: { $in: assignmentIds }
      });
      
      if (anyProgress.length > 0) {
        console.log(`⚠️  Found ${anyProgress.length} progress record(s) with other statuses:`);
        anyProgress.forEach(p => {
          console.log(`   - Progress ${p.id}: status = "${p.status}"`);
        });
        console.log('');
      } else {
        console.log('💡 No progress records exist for these assignments\n');
      }
      
      return;
    }
    
    progresses.forEach((progress, index) => {
      console.log(`Progress #${index + 1}:`);
      console.log(`   ID: ${progress.id}`);
      console.log(`   Assignment ID: ${progress.workerTaskAssignmentId}`);
      console.log(`   Employee ID: ${progress.employeeId}`);
      console.log(`   Progress: ${progress.progressPercent}%`);
      console.log(`   Status: ${progress.status}`);
      console.log(`   Description: ${progress.description}`);
      console.log(`   Submitted: ${progress.submittedAt}`);
      console.log('');
    });

    // ============================================
    // STEP 6: Simulate API Response
    // ============================================
    console.log('6️⃣  SIMULATING API RESPONSE');
    console.log('-'.repeat(80));
    console.log('API Endpoint: GET /api/supervisor/projects/:projectId/worker-submissions/today\n');
    
    // Group by project
    for (const project of projects) {
      const projectAssignments = assignments.filter(a => a.projectId === project.id);
      if (projectAssignments.length === 0) continue;
      
      const projectAssignmentIds = projectAssignments.map(a => a.id);
      const projectProgresses = progresses.filter(p => projectAssignmentIds.includes(p.workerTaskAssignmentId));
      
      console.log(`📤 Project ${project.id} (${project.projectName || project.name}):`);
      console.log(`   URL: /api/supervisor/projects/${project.id}/worker-submissions/today`);
      console.log(`   Response: ${projectProgresses.length} progress record(s)\n`);
      
      if (projectProgresses.length > 0) {
        const response = projectProgresses.map(progress => ({
          progressId: progress.id,
          assignmentId: progress.workerTaskAssignmentId,
          workerName: `Employee ${progress.employeeId}`,
          taskName: `Task ${projectAssignments.find(a => a.id === progress.workerTaskAssignmentId)?.taskId}`,
          attendanceChecked: false,
          progressPercent: progress.progressPercent,
          description: progress.description,
          status: progress.status,
          photos: []
        }));
        
        console.log(JSON.stringify(response, null, 2));
        console.log('');
      }
    }

    // ============================================
    // STEP 7: Summary
    // ============================================
    console.log('7️⃣  SUMMARY');
    console.log('-'.repeat(80));
    
    const checks = {
      'Supervisor user exists': !!user,
      'Password is correct': passwordMatch,
      'Employee record exists': !!employee,
      'Projects assigned': projects.length > 0,
      'Task assignments for today': assignments.length > 0,
      'Progress submissions exist': progresses.length > 0
    };
    
    console.log('Checklist:');
    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${check}`);
    });
    console.log('');
    
    const allPassed = Object.values(checks).every(v => v);
    
    if (allPassed) {
      console.log('🎉 ALL CHECKS PASSED!');
      console.log('   Progress Report should show in the mobile app\n');
      console.log('📱 Mobile App Login:');
      console.log(`   Email: ${SUPERVISOR_EMAIL}`);
      console.log(`   Password: ${SUPERVISOR_PASSWORD}`);
      console.log(`   Expected Projects: ${projects.length}`);
      console.log(`   Expected Progress Records: ${progresses.length}\n`);
    } else {
      console.log('⚠️  SOME CHECKS FAILED\n');
      console.log('Review the issues above and fix them.\n');
    }

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

testSupervisorLoginAndProgress();
