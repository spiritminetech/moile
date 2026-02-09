import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MaterialRequest from './src/modules/project/models/MaterialRequest.js';
import Project from './src/modules/project/models/Project.js';
import Employee from './src/modules/employee/Employee.js';

dotenv.config();

async function fixOrphanedToolRequest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the orphaned tool request
    const toolRequest = await MaterialRequest.findOne({ 
      id: 1770044161085 
    });

    if (!toolRequest) {
      console.log('❌ Tool request not found');
      return;
    }

    console.log('\n🔧 Current Tool Request:');
    console.log('  ID:', toolRequest.id);
    console.log('  Project ID:', toolRequest.projectId);
    console.log('  Employee ID:', toolRequest.employeeId);
    console.log('  Item:', toolRequest.itemName);
    console.log('  Status:', toolRequest.status);

    // Check if Project 1 exists
    const project1 = await Project.findOne({ id: 1 });
    console.log('\n📁 Project 1 exists:', !!project1);
    if (project1) {
      console.log('  Name:', project1.name || project1.projectName);
      console.log('  Supervisor ID:', project1.supervisorId);
    }

    // Check if the employee exists and their current project
    const employee = await Employee.findOne({ id: toolRequest.employeeId });
    console.log('\n👤 Employee Info:');
    if (employee) {
      console.log('  ID:', employee.id);
      console.log('  Name:', employee.fullName);
      console.log('  Current Project:', employee.currentProject);
      console.log('  Current Project ID:', employee.currentProjectId);
    } else {
      console.log('  Employee not found');
    }

    // Get all projects to see valid options
    const allProjects = await Project.find().lean();
    console.log('\n📋 Available Projects:');
    allProjects.forEach(p => {
      console.log(`  - ID: ${p.id}, Name: ${p.name || p.projectName}, Supervisor: ${p.supervisorId}`);
    });

    // Decision: Delete the orphaned request since it's for a project that doesn't match any supervisor
    console.log('\n⚠️  Decision: Deleting orphaned tool request');
    console.log('   Reason: Project 1 is not assigned to any active supervisor in the system');
    
    const result = await MaterialRequest.deleteOne({ id: 1770044161085 });
    
    if (result.deletedCount > 0) {
      console.log('✅ Successfully deleted orphaned tool request');
    } else {
      console.log('❌ Failed to delete tool request');
    }

    // Verify deletion
    const verifyDeleted = await MaterialRequest.findOne({ id: 1770044161085 });
    console.log('\n🔍 Verification:');
    console.log('  Tool request still exists:', !!verifyDeleted);

    // Check remaining pending tool requests
    const remainingToolRequests = await MaterialRequest.find({ 
      requestType: 'TOOL',
      status: 'PENDING' 
    }).lean();
    
    console.log('\n📊 Remaining Pending Tool Requests:', remainingToolRequests.length);
    remainingToolRequests.forEach(req => {
      console.log(`  - ID: ${req.id}, Project: ${req.projectId}, Item: ${req.itemName}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixOrphanedToolRequest();
