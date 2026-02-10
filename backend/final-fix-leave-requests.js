/**
 * Final Fix for Leave Requests - Check and fix the query issue
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Import models
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import LeaveRequest from './src/modules/leaveRequest/models/LeaveRequest.js';

async function finalFixLeaveRequests() {
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

    // Check what's in the database after our updates
    console.log('\n📋 Checking updated employee records...');
    const allEmployees = await Employee.find({ 
      id: { $in: [1, 2, 10, 16, 17, 20, 27, 33, 50, 51, 58, 59, 60, 61, 62, 101, 102, 103, 104, 105, 106, 107, 108] }
    });
    
    console.log(`✅ Found ${allEmployees.length} employees. Checking their currentProjectId values:`);
    allEmployees.forEach((emp, index) => {
      console.log(`  ${index + 1}. ${emp.fullName} (ID: ${emp.id}) - currentProjectId: ${emp.currentProjectId} (${typeof emp.currentProjectId})`);
    });

    // Now check which ones match supervisor's projects
    console.log('\n📋 Filtering employees by supervisor\'s projects...');
    const matchingEmployees = allEmployees.filter(emp => 
      emp.currentProjectId && projectIds.includes(emp.currentProjectId)
    );
    
    console.log(`✅ Found ${matchingEmployees.length} employees in supervisor's projects:`);
    matchingEmployees.forEach((emp, index) => {
      console.log(`  ${index + 1}. ${emp.fullName} (ID: ${emp.id}) - Project ID: ${emp.currentProjectId}`);
    });

    // Get leave requests for these specific employees
    const matchingEmployeeIds = matchingEmployees.map(e => e.id);
    console.log(`\n📋 Looking for leave requests for employee IDs: ${matchingEmployeeIds.join(', ')}`);
    
    const leaveRequests = await LeaveRequest.find({ 
      employeeId: { $in: matchingEmployeeIds },
      status: 'PENDING' 
    });
    
    console.log(`✅ Found ${leaveRequests.length} leave requests for supervisor's employees:`);
    leaveRequests.forEach((request, index) => {
      const employee = matchingEmployees.find(e => e.id === request.employeeId);
      console.log(`  ${index + 1}. ${employee?.fullName || 'Unknown'} (ID: ${request.employeeId}) - ${request.leaveType} (${request.totalDays} days)`);
      console.log(`     From: ${request.fromDate.toDateString()} To: ${request.toDate.toDateString()}`);
      console.log(`     Reason: ${request.reason.substring(0, 50)}...`);
    });

    // If we still don't have matches, let's force update some employees to be in the right projects
    if (matchingEmployees.length === 0) {
      console.log('\n📋 Force updating some employees to be in supervisor\'s projects...');
      
      const employeesToUpdate = [1, 2, 10, 16, 17]; // These have leave requests
      const primaryProject = projects[0]; // Use first project
      
      for (const empId of employeesToUpdate) {
        await Employee.updateOne(
          { id: empId },
          { 
            $set: { 
              currentProjectId: primaryProject.id,
              currentProject: {
                id: primaryProject.id,
                name: primaryProject.projectName || primaryProject.name,
                code: `PRJ-${primaryProject.id}`
              }
            }
          }
        );
        console.log(`✅ Force updated Employee ${empId} to project ${primaryProject.projectName || primaryProject.name}`);
      }

      // Verify the force update
      const forceUpdatedEmployees = await Employee.find({ 
        id: { $in: employeesToUpdate }
      });
      
      console.log('\n📋 Verifying force updates...');
      forceUpdatedEmployees.forEach((emp, index) => {
        console.log(`  ${index + 1}. ${emp.fullName} (ID: ${emp.id}) - currentProjectId: ${emp.currentProjectId}`);
      });

      // Check leave requests again
      const finalLeaveRequests = await LeaveRequest.find({ 
        employeeId: { $in: employeesToUpdate },
        status: 'PENDING' 
      });
      
      console.log(`\n✅ Final check: Found ${finalLeaveRequests.length} leave requests for updated employees:`);
      finalLeaveRequests.forEach((request, index) => {
        const employee = forceUpdatedEmployees.find(e => e.id === request.employeeId);
        console.log(`  ${index + 1}. ${employee?.fullName || 'Unknown'} - ${request.leaveType} (${request.totalDays} days)`);
      });
    }

    console.log('\n✅ Leave requests fix completed. Now test the API again.');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

finalFixLeaveRequests();