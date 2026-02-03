// Check what project the worker should be assigned to
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

async function checkWorkerProjectAssignment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the worker employee
    const employee = await Employee.findOne({ userId: 64 });
    if (!employee) {
      console.log('❌ Employee not found');
      return;
    }

    console.log(`👤 Worker: ${employee.fullName} (ID: ${employee.id})`);
    console.log(`🏢 Company: ${employee.companyId}`);
    console.log(`📋 Current Project: ${JSON.stringify(employee.currentProject)}`);

    // Check all task assignments for this worker
    console.log('\n📋 All task assignments for this worker:');
    const assignments = await WorkerTaskAssignment.find({ employeeId: employee.id });
    
    if (assignments.length === 0) {
      console.log('❌ No task assignments found');
      return;
    }

    console.log(`Found ${assignments.length} assignments:`);
    assignments.forEach(assignment => {
      console.log(`  - Project ${assignment.projectId}, Date: ${assignment.date}, Task: ${assignment.taskName}`);
    });

    // Check today's assignments
    const today = new Date().toISOString().split("T")[0];
    console.log(`\n📅 Today's assignments (${today}):`);
    const todayAssignments = assignments.filter(a => a.date === today);
    
    if (todayAssignments.length === 0) {
      console.log('❌ No assignments for today');
    } else {
      todayAssignments.forEach(assignment => {
        console.log(`  ✅ Project ${assignment.projectId}: ${assignment.taskName}`);
      });
      
      // Recommend which project to use
      const recommendedProjectId = todayAssignments[0].projectId;
      console.log(`\n💡 RECOMMENDATION: Use projectId ${recommendedProjectId} for clock-in`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkWorkerProjectAssignment();