// Debug script to check supervisor assignment issue
import mongoose from 'mongoose';
import Employee from './src/modules/employee/Employee.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function debugSupervisorIssue() {
  try {
    console.log('🔍 Debugging supervisor issue...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    console.log('✅ Connected to database');

    // Find Employee 107 (Raj Kumar)
    const employee = await Employee.findOne({ id: 107 });
    if (!employee) {
      console.log('❌ Employee 107 not found');
      return;
    }
    
    console.log('📋 Employee 107 data:');
    console.log('  - ID:', employee.id);
    console.log('  - Full Name:', employee.fullName);
    console.log('  - User ID:', employee.userId);

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Today:', today);

    // Find task assignments for today
    const assignments = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      date: today
    }).sort({ sequence: 1 });

    console.log('\n📋 Task assignments for today:', assignments.length);
    
    if (assignments.length === 0) {
      console.log('❌ No task assignments found for today');
      return;
    }

    // Check supervisor assignments
    console.log('\n👨‍💼 Supervisor Information:');
    for (let i = 0; i < assignments.length; i++) {
      const assignment = assignments[i];
      console.log(`\n📝 Assignment ${i + 1}:`);
      console.log(`  - Assignment ID: ${assignment.id}`);
      console.log(`  - Task ID: ${assignment.taskId}`);
      console.log(`  - Supervisor ID: ${assignment.supervisorId || 'NOT SET'}`);
      console.log(`  - Project ID: ${assignment.projectId}`);
      console.log(`  - Work Area: ${assignment.workArea}`);
      
      if (assignment.supervisorId) {
        // Try to find the supervisor
        const supervisor = await Employee.findOne({ id: assignment.supervisorId });
        if (supervisor) {
          console.log(`  ✅ Supervisor found:`);
          console.log(`    - ID: ${supervisor.id}`);
          console.log(`    - Name: ${supervisor.fullName}`);
          console.log(`    - Phone: ${supervisor.phone || 'N/A'}`);
          console.log(`    - Status: ${supervisor.status}`);
          console.log(`    - Job Title: ${supervisor.jobTitle || 'N/A'}`);
        } else {
          console.log(`  ❌ Supervisor with ID ${assignment.supervisorId} not found in Employee table`);
        }
      } else {
        console.log(`  ⚠️ No supervisor assigned to this task`);
      }
    }

    // Check if there are any supervisors in the system
    console.log('\n🔍 Checking all supervisors in the system...');
    const allSupervisors = await Employee.find({
      companyId: employee.companyId,
      status: 'ACTIVE',
      $or: [
        { jobTitle: /supervisor/i },
        { jobTitle: /manager/i },
        { jobTitle: /lead/i }
      ]
    });

    console.log(`📊 Found ${allSupervisors.length} potential supervisors:`);
    allSupervisors.forEach((sup, index) => {
      console.log(`  ${index + 1}. ID: ${sup.id}, Name: ${sup.fullName}, Title: ${sup.jobTitle}`);
    });

    // Check if we can find any employees with supervisor-like roles
    if (allSupervisors.length === 0) {
      console.log('\n🔍 Checking all employees in the company...');
      const allEmployees = await Employee.find({
        companyId: employee.companyId,
        status: 'ACTIVE'
      }).select('id fullName jobTitle');

      console.log(`📊 Found ${allEmployees.length} active employees:`);
      allEmployees.forEach((emp, index) => {
        console.log(`  ${index + 1}. ID: ${emp.id}, Name: ${emp.fullName}, Title: ${emp.jobTitle || 'N/A'}`);
      });
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the debug
debugSupervisorIssue();