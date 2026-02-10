/**
 * Check supervisor assignment for employeeId=2
 * Verifies the supervisor data path from WorkerTaskAssignment -> Employee collection
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

// Define schemas
const employeeSchema = new mongoose.Schema({
  id: Number,
  fullName: String,
  email: String,
  phone: String,
  jobTitle: String,
  status: String,
  companyId: Number
}, { collection: 'employees' });

const workerTaskAssignmentSchema = new mongoose.Schema({
  id: Number,
  employeeId: Number,
  projectId: Number,
  taskId: Number,
  supervisorId: Number,
  date: String,
  status: String,
  sequence: Number
}, { collection: 'workertaskassignments' });

const projectSchema = new mongoose.Schema({
  id: Number,
  projectName: String,
  projectCode: String,
  address: String
}, { collection: 'projects' });

const Employee = mongoose.model('Employee', employeeSchema);
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', workerTaskAssignmentSchema);
const Project = mongoose.model('Project', projectSchema);

async function checkEmployee2Supervisor() {
  try {
    console.log('🔍 Checking Supervisor Assignment for employeeId=2\n');
    console.log('=' .repeat(70));

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Find the employee with id=2
    console.log('1️⃣ Finding Employee with id=2...');
    const employee = await Employee.findOne({ id: 2 });
    
    if (!employee) {
      console.log('❌ Employee with id=2 not found!');
      return;
    }

    console.log('✅ Employee Found:');
    console.log('   ID:', employee.id);
    console.log('   Name:', employee.fullName);
    console.log('   Email:', employee.email);
    console.log('   Job Title:', employee.jobTitle);
    console.log('   Status:', employee.status);
    console.log('   Company ID:', employee.companyId);

    // Step 2: Find today's task assignments for this employee
    console.log('\n2️⃣ Finding Today\'s Task Assignments...');
    const today = new Date().toISOString().split('T')[0];
    console.log('   Date:', today);

    const assignments = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: today
    }).sort({ sequence: 1 });

    if (!assignments || assignments.length === 0) {
      console.log('⚠️  No task assignments found for today');
      console.log('   Checking all assignments for this employee...');
      
      const allAssignments = await WorkerTaskAssignment.find({
        employeeId: 2
      }).sort({ date: -1 }).limit(5);
      
      if (allAssignments.length > 0) {
        console.log(`\n   Found ${allAssignments.length} assignment(s) (showing latest):`);
        allAssignments.forEach((a, idx) => {
          console.log(`   ${idx + 1}. Assignment ID: ${a.id}, Date: ${a.date}, SupervisorId: ${a.supervisorId || 'NOT SET'}`);
        });
        
        // Use the first assignment for testing
        if (allAssignments[0].supervisorId) {
          assignments.push(allAssignments[0]);
          console.log('\n   Using latest assignment for supervisor check...');
        }
      } else {
        console.log('❌ No assignments found for employeeId=2 at all!');
        return;
      }
    } else {
      console.log(`✅ Found ${assignments.length} assignment(s) for today:`);
      assignments.forEach((a, idx) => {
        console.log(`   ${idx + 1}. Assignment ID: ${a.id}, Task ID: ${a.taskId}, SupervisorId: ${a.supervisorId || 'NOT SET'}`);
      });
    }

    // Step 3: Check supervisor information
    console.log('\n3️⃣ Checking Supervisor Information...');
    const supervisorId = assignments[0].supervisorId;

    if (!supervisorId) {
      console.log('❌ No supervisorId set in the assignment!');
      console.log('   This is why "N/A" appears in the dashboard');
      console.log('\n💡 Solution: Assign a supervisor to this task assignment');
      console.log('   Update WorkerTaskAssignment with a valid supervisorId');
      return;
    }

    console.log('   Supervisor ID from assignment:', supervisorId);
    console.log('   Looking up supervisor in employees collection...');

    const supervisor = await Employee.findOne({ id: supervisorId });

    if (!supervisor) {
      console.log('❌ Supervisor NOT FOUND in employees collection!');
      console.log('   SupervisorId:', supervisorId);
      console.log('   This is why "N/A" appears in the dashboard');
      console.log('\n💡 Solution Options:');
      console.log('   1. Create an employee record with id=' + supervisorId);
      console.log('   2. Update the assignment with a valid supervisorId');
      
      // Check if there are any employees with supervisor/manager roles
      console.log('\n   Checking for available supervisors...');
      const supervisors = await Employee.find({
        companyId: employee.companyId,
        status: 'ACTIVE',
        $or: [
          { jobTitle: /supervisor/i },
          { jobTitle: /manager/i },
          { jobTitle: /foreman/i }
        ]
      }).limit(5);
      
      if (supervisors.length > 0) {
        console.log(`   Found ${supervisors.length} potential supervisor(s):`);
        supervisors.forEach((s, idx) => {
          console.log(`   ${idx + 1}. ID: ${s.id}, Name: ${s.fullName}, Title: ${s.jobTitle}`);
        });
      } else {
        console.log('   No supervisors found in the company');
      }
      
      return;
    }

    console.log('✅ Supervisor Found in Employees Collection:');
    console.log('   ID:', supervisor.id);
    console.log('   Name:', supervisor.fullName);
    console.log('   Email:', supervisor.email);
    console.log('   Phone:', supervisor.phone);
    console.log('   Job Title:', supervisor.jobTitle);
    console.log('   Status:', supervisor.status);

    // Check if supervisor is active
    if (supervisor.status !== 'ACTIVE') {
      console.log('\n⚠️  WARNING: Supervisor status is not ACTIVE!');
      console.log('   Current status:', supervisor.status);
      console.log('   This might cause issues in the dashboard');
    }

    // Check if supervisor has required fields
    console.log('\n4️⃣ Validating Supervisor Data:');
    const issues = [];
    
    if (!supervisor.fullName || supervisor.fullName.trim() === '') {
      issues.push('Missing fullName');
    }
    if (!supervisor.phone || supervisor.phone.trim() === '') {
      issues.push('Missing phone');
    }
    if (!supervisor.email || supervisor.email.trim() === '') {
      issues.push('Missing email');
    }

    if (issues.length > 0) {
      console.log('⚠️  Data Quality Issues:');
      issues.forEach(issue => console.log('   -', issue));
    } else {
      console.log('✅ All required supervisor fields are present');
    }

    // Step 5: Check project information
    console.log('\n5️⃣ Checking Project Information...');
    const projectId = assignments[0].projectId;
    const project = await Project.findOne({ id: projectId });

    if (project) {
      console.log('✅ Project Found:');
      console.log('   ID:', project.id);
      console.log('   Name:', project.projectName);
      console.log('   Code:', project.projectCode);
    } else {
      console.log('⚠️  Project not found for ID:', projectId);
    }

    // Summary
    console.log('\n' + '=' .repeat(70));
    console.log('📊 SUMMARY');
    console.log('=' .repeat(70));
    
    if (supervisor && supervisor.fullName && supervisor.status === 'ACTIVE') {
      console.log('✅ Supervisor data is complete and valid');
      console.log('   Name:', supervisor.fullName);
      console.log('   The dashboard should display this name correctly');
      console.log('\n   If "N/A" still appears, check:');
      console.log('   1. Backend API is returning the correct data');
      console.log('   2. Frontend is properly handling the supervisor object');
      console.log('   3. Run: node test-supervisor-display-fix.js');
    } else {
      console.log('❌ Issues found with supervisor data');
      console.log('   This explains why "N/A" appears in the dashboard');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the check
checkEmployee2Supervisor();
