/**
 * Fix Employee Project Assignment Properly
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Import models
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

async function fixEmployeeProjectAssignmentProperly() {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI, { 
      dbName: process.env.DB_NAME || 'erp'
    });
    console.log('✅ Connected to MongoDB\n');

    const supervisorId = 4;
    
    // Get supervisor's projects
    const projects = await Project.find({ supervisorId: supervisorId });
    const projectIds = projects.map(p => p.id);
    console.log(`📊 Supervisor's projects: ${projectIds.join(', ')}`);

    // Get all task assignments for these projects
    const assignments = await WorkerTaskAssignment.find({ 
      projectId: { $in: projectIds }
    });
    
    console.log(`📋 Found ${assignments.length} task assignments`);
    
    // Get unique employee IDs
    const employeeIds = [...new Set(assignments.map(a => a.employeeId))];
    console.log(`📊 Unique employee IDs: ${employeeIds.join(', ')}`);

    // Check if these employees exist
    const existingEmployees = await Employee.find({ 
      id: { $in: employeeIds }
    });
    console.log(`✅ Found ${existingEmployees.length} existing employees`);

    // Update each employee with project assignment
    let updateCount = 0;
    for (const employee of existingEmployees) {
      // Find the most recent assignment for this employee
      const employeeAssignments = assignments.filter(a => a.employeeId === employee.id);
      if (employeeAssignments.length > 0) {
        const latestAssignment = employeeAssignments.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        const project = projects.find(p => p.id === latestAssignment.projectId);
        
        if (project) {
          // Update the employee record
          const updateResult = await Employee.updateOne(
            { id: employee.id },
            { 
              $set: { 
                currentProjectId: project.id,
                currentProject: {
                  id: project.id,
                  name: project.projectName || project.name,
                  code: `PRJ-${project.id}`
                }
              }
            }
          );
          
          if (updateResult.modifiedCount > 0) {
            updateCount++;
            console.log(`✅ Updated ${employee.fullName} (ID: ${employee.id}) with project ${project.projectName || project.name}`);
          } else {
            console.log(`⚠️  Failed to update ${employee.fullName} (ID: ${employee.id})`);
          }
        }
      }
    }

    console.log(`\n✅ Updated ${updateCount} employees with project assignments`);

    // Verify the updates
    console.log('\n📋 Verifying updates...');
    const updatedEmployees = await Employee.find({ 
      currentProjectId: { $in: projectIds }
    });
    
    console.log(`✅ Found ${updatedEmployees.length} employees with supervisor's project assignments:`);
    updatedEmployees.forEach((emp, index) => {
      console.log(`  ${index + 1}. ${emp.fullName} (ID: ${emp.id}) - Project: ${emp.currentProject?.name} (ID: ${emp.currentProjectId})`);
    });

    // Now test the leave request logic
    console.log('\n📋 Testing leave request filtering...');
    
    const LeaveRequest = (await import('./src/modules/leaveRequest/models/LeaveRequest.js')).default;
    
    // Get pending leave requests for these employees
    const employeeIdsWithProjects = updatedEmployees.map(e => e.id);
    const pendingLeaveRequests = await LeaveRequest.find({ 
      employeeId: { $in: employeeIdsWithProjects },
      status: 'PENDING' 
    });
    
    console.log(`✅ Found ${pendingLeaveRequests.length} pending leave requests for employees with project assignments`);
    
    if (pendingLeaveRequests.length > 0) {
      console.log('\n📋 Pending Leave Requests:');
      pendingLeaveRequests.forEach((request, index) => {
        const employee = updatedEmployees.find(e => e.id === request.employeeId);
        console.log(`  ${index + 1}. ${employee?.fullName || 'Unknown'} - ${request.leaveType} (${request.totalDays} days)`);
        console.log(`     From: ${request.fromDate.toDateString()} To: ${request.toDate.toDateString()}`);
        console.log(`     Status: ${request.status}`);
      });
    }

    // Also check all pending leave requests to see what we have
    console.log('\n📋 All pending leave requests in system...');
    const allPendingLeaveRequests = await LeaveRequest.find({ 
      status: 'PENDING' 
    });
    
    console.log(`✅ Found ${allPendingLeaveRequests.length} total pending leave requests:`);
    allPendingLeaveRequests.forEach((request, index) => {
      console.log(`  ${index + 1}. Employee ID: ${request.employeeId} - ${request.leaveType} (${request.totalDays} days)`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

fixEmployeeProjectAssignmentProperly();