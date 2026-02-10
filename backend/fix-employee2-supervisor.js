/**
 * Fix supervisor assignment for employeeId=2
 * This script will:
 * 1. Check if supervisor is assigned
 * 2. If not, find an available supervisor and assign them
 * 3. Verify the fix works
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

const Employee = mongoose.model('Employee', employeeSchema);
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', workerTaskAssignmentSchema);

async function fixEmployee2Supervisor() {
  try {
    console.log('🔧 Fixing Supervisor Assignment for employeeId=2\n');
    console.log('=' .repeat(70));

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Find the employee
    console.log('1️⃣ Finding Employee with id=2...');
    const employee = await Employee.findOne({ id: 2 });
    
    if (!employee) {
      console.log('❌ Employee with id=2 not found!');
      return;
    }

    console.log('✅ Employee Found:', employee.fullName);

    // Step 2: Find task assignments
    console.log('\n2️⃣ Finding Task Assignments...');
    const today = new Date().toISOString().split('T')[0];
    
    let assignments = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: today
    });

    if (!assignments || assignments.length === 0) {
      console.log('⚠️  No assignments for today, checking all assignments...');
      assignments = await WorkerTaskAssignment.find({
        employeeId: 2
      }).sort({ date: -1 }).limit(10);
    }

    if (!assignments || assignments.length === 0) {
      console.log('❌ No assignments found for employeeId=2!');
      return;
    }

    console.log(`✅ Found ${assignments.length} assignment(s)`);

    // Step 3: Check current supervisor assignments
    console.log('\n3️⃣ Checking Current Supervisor Assignments...');
    const assignmentsWithoutSupervisor = assignments.filter(a => !a.supervisorId);
    const assignmentsWithSupervisor = assignments.filter(a => a.supervisorId);

    console.log(`   With supervisor: ${assignmentsWithSupervisor.length}`);
    console.log(`   Without supervisor: ${assignmentsWithoutSupervisor.length}`);

    if (assignmentsWithoutSupervisor.length === 0) {
      console.log('\n✅ All assignments already have supervisors assigned');
      
      // Verify the supervisors exist
      console.log('\n4️⃣ Verifying Supervisor Records...');
      for (const assignment of assignmentsWithSupervisor) {
        const supervisor = await Employee.findOne({ id: assignment.supervisorId });
        if (!supervisor) {
          console.log(`❌ Assignment ${assignment.id}: Supervisor ID ${assignment.supervisorId} NOT FOUND in employees`);
        } else if (supervisor.status !== 'ACTIVE') {
          console.log(`⚠️  Assignment ${assignment.id}: Supervisor ${supervisor.fullName} is ${supervisor.status}`);
        } else {
          console.log(`✅ Assignment ${assignment.id}: Supervisor ${supervisor.fullName} (${supervisor.jobTitle})`);
        }
      }
      return;
    }

    // Step 4: Find available supervisors
    console.log('\n4️⃣ Finding Available Supervisors...');
    const supervisors = await Employee.find({
      companyId: employee.companyId,
      status: 'ACTIVE',
      $or: [
        { jobTitle: /supervisor/i },
        { jobTitle: /manager/i },
        { jobTitle: /foreman/i },
        { jobTitle: /lead/i }
      ]
    });

    if (supervisors.length === 0) {
      console.log('❌ No active supervisors found in the company!');
      console.log('\n💡 You need to:');
      console.log('   1. Create a supervisor employee record, OR');
      console.log('   2. Update an existing employee\'s jobTitle to include "supervisor"');
      return;
    }

    console.log(`✅ Found ${supervisors.length} available supervisor(s):`);
    supervisors.forEach((s, idx) => {
      console.log(`   ${idx + 1}. ID: ${s.id}, Name: ${s.fullName}, Title: ${s.jobTitle}`);
    });

    // Step 5: Assign supervisor to assignments without one
    console.log('\n5️⃣ Assigning Supervisor to Tasks...');
    const selectedSupervisor = supervisors[0]; // Use the first available supervisor
    console.log(`   Selected Supervisor: ${selectedSupervisor.fullName} (ID: ${selectedSupervisor.id})`);

    let updatedCount = 0;
    for (const assignment of assignmentsWithoutSupervisor) {
      const result = await WorkerTaskAssignment.updateOne(
        { id: assignment.id },
        { $set: { supervisorId: selectedSupervisor.id } }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`   ✅ Updated Assignment ${assignment.id}`);
        updatedCount++;
      } else {
        console.log(`   ⚠️  Failed to update Assignment ${assignment.id}`);
      }
    }

    console.log(`\n   Total assignments updated: ${updatedCount}`);

    // Step 6: Verify the fix
    console.log('\n6️⃣ Verifying the Fix...');
    const verifyAssignments = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: today
    });

    if (verifyAssignments.length > 0) {
      const allHaveSupervisor = verifyAssignments.every(a => a.supervisorId);
      
      if (allHaveSupervisor) {
        console.log('✅ All assignments now have supervisors assigned!');
        
        const supervisor = await Employee.findOne({ id: verifyAssignments[0].supervisorId });
        console.log('\n📋 Supervisor Details:');
        console.log('   ID:', supervisor.id);
        console.log('   Name:', supervisor.fullName);
        console.log('   Phone:', supervisor.phone || 'N/A');
        console.log('   Email:', supervisor.email || 'N/A');
      } else {
        console.log('⚠️  Some assignments still missing supervisors');
      }
    }

    // Summary
    console.log('\n' + '=' .repeat(70));
    console.log('📊 FIX SUMMARY');
    console.log('=' .repeat(70));
    console.log(`✅ Updated ${updatedCount} assignment(s)`);
    console.log(`✅ Assigned supervisor: ${selectedSupervisor.fullName}`);
    console.log('\n🧪 Next Steps:');
    console.log('   1. Run: node check-employee2-supervisor.js (to verify)');
    console.log('   2. Run: node test-supervisor-display-fix.js (to test API)');
    console.log('   3. Test in mobile app dashboard');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the fix
fixEmployee2Supervisor();
