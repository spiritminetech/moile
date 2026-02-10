/**
 * Fix Leave Requests Filtering Issue
 * The supervisor controller is looking for currentProjectId but employees have currentProject object
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Import models
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

async function fixLeaveRequestsFiltering() {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI, { 
      dbName: process.env.DB_NAME || 'erp'
    });
    console.log('✅ Connected to MongoDB\n');

    const supervisorId = 4;
    console.log(`🎯 Fixing Leave Requests Filtering for Supervisor ID: ${supervisorId}\n`);

    // ========================================
    // STEP 1: Update Employee records with currentProject info
    // ========================================
    console.log('📋 STEP 1: Updating Employee records with currentProject info...');
    
    // Get supervisor's projects
    const projects = await Project.find({ supervisorId: supervisorId });
    const projectIds = projects.map(p => p.id);
    console.log(`✅ Found ${projects.length} projects: ${projectIds.join(', ')}`);

    // Get workers assigned to these projects
    const assignments = await WorkerTaskAssignment.find({ 
      projectId: { $in: projectIds }
    });
    
    // Group assignments by employee
    const employeeProjectMap = {};
    assignments.forEach(assignment => {
      if (!employeeProjectMap[assignment.employeeId]) {
        employeeProjectMap[assignment.employeeId] = [];
      }
      employeeProjectMap[assignment.employeeId].push(assignment.projectId);
    });

    console.log(`📋 Found assignments for ${Object.keys(employeeProjectMap).length} employees`);

    // Update each employee with their current project
    let updatedCount = 0;
    for (const [employeeId, projectIdsList] of Object.entries(employeeProjectMap)) {
      const primaryProjectId = projectIdsList[0]; // Use first project as primary
      const project = projects.find(p => p.id === primaryProjectId);
      
      if (project) {
        await Employee.updateOne(
          { id: parseInt(employeeId) },
          { 
            $set: { 
              currentProject: {
                id: project.id,
                name: project.projectName || project.name,
                code: `PRJ-${project.id}`
              },
              currentProjectId: project.id // Add this field for backward compatibility
            }
          }
        );
        updatedCount++;
        console.log(`✅ Updated Employee ${employeeId} with project ${project.projectName || project.name}`);
      }
    }

    console.log(`✅ Updated ${updatedCount} employee records with current project info`);

    // ========================================
    // STEP 2: Verify the fix by checking employee data
    // ========================================
    console.log('\n📋 STEP 2: Verifying employee project assignments...');
    
    const employeesWithProjects = await Employee.find({ 
      currentProjectId: { $in: projectIds }
    });
    
    console.log(`✅ Found ${employeesWithProjects.length} employees with current project assignments:`);
    employeesWithProjects.forEach((emp, index) => {
      console.log(`  ${index + 1}. ${emp.fullName} (ID: ${emp.id}) - Project: ${emp.currentProject?.name || 'Unknown'}`);
    });

    // ========================================
    // STEP 3: Test the leave request filtering logic
    // ========================================
    console.log('\n📋 STEP 3: Testing leave request filtering logic...');
    
    // Simulate the supervisor controller logic
    const supervisor = await Employee.findOne({ id: supervisorId });
    if (supervisor) {
      console.log(`✅ Found supervisor: ${supervisor.fullName}`);
      
      // Get supervisor's projects (same as controller)
      const supervisorProjects = await Project.find({ supervisorId: supervisor.id });
      const supervisorProjectIds = supervisorProjects.map(p => p.id);
      console.log(`📊 Supervisor's projects: ${supervisorProjectIds.join(', ')}`);
      
      // Get employees assigned to supervisor's projects (same as controller)
      const assignedEmployees = await Employee.find({ 
        currentProjectId: { $in: supervisorProjectIds }
      });
      const assignedEmployeeIds = assignedEmployees.map(e => e.id);
      console.log(`📊 Assigned employees: ${assignedEmployeeIds.length} found`);
      
      // Import LeaveRequest model
      const LeaveRequest = (await import('./src/modules/leaveRequest/models/LeaveRequest.js')).default;
      
      // Get pending leave requests for these employees (same as controller)
      const pendingLeaveRequests = await LeaveRequest.find({ 
        employeeId: { $in: assignedEmployeeIds },
        status: 'PENDING' 
      });
      
      console.log(`✅ Found ${pendingLeaveRequests.length} pending leave requests for supervisor's employees`);
      
      if (pendingLeaveRequests.length > 0) {
        console.log('\n📋 Pending Leave Requests:');
        pendingLeaveRequests.forEach((request, index) => {
          const employee = assignedEmployees.find(e => e.id === request.employeeId);
          console.log(`  ${index + 1}. ${employee?.fullName || 'Unknown'} - ${request.leaveType} (${request.totalDays} days)`);
          console.log(`     From: ${request.fromDate.toDateString()} To: ${request.toDate.toDateString()}`);
          console.log(`     Reason: ${request.reason.substring(0, 50)}...`);
        });
      }
    }

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ LEAVE REQUESTS FILTERING FIX COMPLETE!');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   - Employee records updated: ${updatedCount}`);
    console.log(`   - Employees with project assignments: ${employeesWithProjects.length}`);
    console.log(`   - Supervisor's projects: ${projects.length}`);
    
    console.log(`\n🎯 Now test the APIs again:`);
    console.log(`   GET http://192.168.0.3:5002/api/supervisor/pending-leave-requests`);
    console.log(`   Expected: Should now show leave requests for supervisor's workers`);

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

fixLeaveRequestsFiltering();