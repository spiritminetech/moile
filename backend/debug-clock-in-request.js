// Debug the exact clock-in request that's failing
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import Project from './src/modules/project/models/Project.js';
import Employee from './src/modules/employee/Employee.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

async function debugClockInRequest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Decode the JWT token to get user info
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjY0LCJjb21wYW55SWQiOjEsInJvbGVJZCI6NCwicm9sZSI6IldPUktFUiIsImVtYWlsIjoid29ya2VyMUBnbWFpbC5jb20iLCJwZXJtaXNzaW9ucyI6WyJBVFRFTkRBTkNFX1ZJRVciLCJDT01NT05fQVRURU5EQU5DRV9WSUVXIiwiUFJPRklMRV9WSUVXIiwiV09SS0VSX1RBU0tfVklFVyIsIldPUktFUl9UUklQX1ZJRVciLCJMRUFWRV9SRVFVRVNUX1ZJRVciLCJXT1JLRVJfVEFTS19VUERBVEUiLCJXT1JLRVJfQVRURU5EQU5DRV9WSUVXIiwiV09SS0VSX0FUVEVOREFOQ0VfVVBEQVRFIiwiV09SS0VSX0RBU0hCT0FSRF9WSUVXIiwiV09SS0VSX1BST0ZJTEVfVklFVyJdLCJpYXQiOjE3NzAwMzQzNTMsImV4cCI6MTc3MDA2MzE1M30.7lC22eiic6Nz4svnHzRPE0fyq3aw4e87cwtsAhqQvkc";
    const decoded = jwt.decode(token);
    
    console.log('🔍 Simulating clock-in request...');
    console.log('📊 Request data from mobile app:');
    console.log('  projectId: 1');
    console.log('  companyId:', decoded.companyId);
    console.log('  userId:', decoded.userId);

    // Step 1: Find employee
    console.log('\n1️⃣ Finding employee...');
    const employee = await Employee.findOne({
      userId: decoded.userId,
      companyId: decoded.companyId,
      status: { $in: ["active", "ACTIVE"] }
    });
    
    if (employee) {
      console.log(`✅ Employee found: ID ${employee.id}, Name: ${employee.fullName}`);
    } else {
      console.log('❌ Employee not found!');
      return;
    }

    // Step 2: Find project
    console.log('\n2️⃣ Finding project...');
    console.log(`Query: Project.findOne({ id: 1, companyId: ${decoded.companyId} })`);
    
    const project = await Project.findOne({ id: 1, companyId: decoded.companyId });
    
    if (project) {
      console.log(`✅ Project found: ID ${project.id}, Name: ${project.projectName}`);
      console.log(`   Company: ${project.companyId}, Status: ${project.status}`);
    } else {
      console.log('❌ Project not found!');
      
      // Debug: Check what projects exist for this company
      console.log('\n🔍 Debugging: All projects for company', decoded.companyId);
      const allCompanyProjects = await Project.find({ companyId: decoded.companyId });
      console.log(`Found ${allCompanyProjects.length} projects:`);
      allCompanyProjects.forEach(p => {
        console.log(`  - ID: ${p.id}, Name: ${p.projectName}, Company: ${p.companyId}`);
      });
      
      // Check if project 1 exists with different company
      console.log('\n🔍 Checking if project ID 1 exists with different company...');
      const project1AnyCompany = await Project.findOne({ id: 1 });
      if (project1AnyCompany) {
        console.log(`Found project 1 with company ${project1AnyCompany.companyId} (expected ${decoded.companyId})`);
      } else {
        console.log('Project ID 1 does not exist at all');
      }
      
      return;
    }

    // Step 3: Check task assignment
    console.log('\n3️⃣ Checking task assignment...');
    const today = new Date().toISOString().split("T")[0];
    console.log(`Looking for task assignment: employeeId=${employee.id}, projectId=1, date=${today}`);
    
    const assignment = await WorkerTaskAssignment.findOne({
      employeeId: employee.id,
      projectId: 1,
      date: today
    });
    
    if (assignment) {
      console.log(`✅ Task assignment found: ID ${assignment.id}`);
    } else {
      console.log('❌ No task assignment found for today');
      
      // Check all assignments for this employee
      const allAssignments = await WorkerTaskAssignment.find({ employeeId: employee.id });
      console.log(`Employee has ${allAssignments.length} total assignments:`);
      allAssignments.forEach(a => {
        console.log(`  - Project ${a.projectId}, Date: ${a.date}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

debugClockInRequest();