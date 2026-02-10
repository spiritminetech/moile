/**
 * Debug Employee Project Assignment Issue
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Import models
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';

async function debugEmployeeProjectAssignment() {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI, { 
      dbName: process.env.DB_NAME || 'erp'
    });
    console.log('✅ Connected to MongoDB\n');

    const supervisorId = 4;
    
    // Check supervisor's projects
    const projects = await Project.find({ supervisorId: supervisorId });
    const projectIds = projects.map(p => p.id);
    console.log(`📊 Supervisor's projects: ${projectIds.join(', ')}`);

    // Check employees with currentProjectId
    console.log('\n📋 Checking employees with currentProjectId...');
    const employeesWithCurrentProjectId = await Employee.find({ 
      currentProjectId: { $exists: true, $ne: null }
    });
    console.log(`✅ Found ${employeesWithCurrentProjectId.length} employees with currentProjectId`);
    
    employeesWithCurrentProjectId.slice(0, 5).forEach((emp, index) => {
      console.log(`  ${index + 1}. ${emp.fullName} (ID: ${emp.id}) - currentProjectId: ${emp.currentProjectId}`);
    });

    // Check employees in supervisor's projects
    console.log('\n📋 Checking employees in supervisor\'s projects...');
    const employeesInSupervisorProjects = await Employee.find({ 
      currentProjectId: { $in: projectIds }
    });
    console.log(`✅ Found ${employeesInSupervisorProjects.length} employees in supervisor's projects`);
    
    employeesInSupervisorProjects.forEach((emp, index) => {
      console.log(`  ${index + 1}. ${emp.fullName} (ID: ${emp.id}) - Project ID: ${emp.currentProjectId}`);
    });

    // Check if the project IDs match
    console.log('\n📋 Checking project ID types...');
    console.log(`Project IDs from projects: ${projectIds.map(id => `${id} (${typeof id})`).join(', ')}`);
    
    if (employeesWithCurrentProjectId.length > 0) {
      const sampleEmployee = employeesWithCurrentProjectId[0];
      console.log(`Sample employee currentProjectId: ${sampleEmployee.currentProjectId} (${typeof sampleEmployee.currentProjectId})`);
    }

    // Try different query approaches
    console.log('\n📋 Trying different query approaches...');
    
    // Approach 1: String comparison
    const stringProjectIds = projectIds.map(id => id.toString());
    const employeesStringQuery = await Employee.find({ 
      currentProjectId: { $in: stringProjectIds }
    });
    console.log(`String query result: ${employeesStringQuery.length} employees`);

    // Approach 2: Number comparison
    const numberProjectIds = projectIds.map(id => Number(id));
    const employeesNumberQuery = await Employee.find({ 
      currentProjectId: { $in: numberProjectIds }
    });
    console.log(`Number query result: ${employeesNumberQuery.length} employees`);

    // Approach 3: Mixed query
    const mixedProjectIds = [...projectIds, ...stringProjectIds, ...numberProjectIds];
    const employeesMixedQuery = await Employee.find({ 
      currentProjectId: { $in: mixedProjectIds }
    });
    console.log(`Mixed query result: ${employeesMixedQuery.length} employees`);

    // Show the actual data structure
    if (employeesWithCurrentProjectId.length > 0) {
      console.log('\n📋 Sample employee data structure:');
      const sample = employeesWithCurrentProjectId[0];
      console.log(JSON.stringify({
        id: sample.id,
        fullName: sample.fullName,
        currentProjectId: sample.currentProjectId,
        currentProject: sample.currentProject
      }, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

debugEmployeeProjectAssignment();