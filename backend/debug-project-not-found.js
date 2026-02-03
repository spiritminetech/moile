// Debug script to investigate "Project not found" error during clock-in
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './src/modules/project/models/Project.js';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';

dotenv.config();

async function debugProjectNotFound() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Check all projects in database
    console.log('\n📊 ALL PROJECTS IN DATABASE:');
    const allProjects = await Project.find({}).sort({ id: 1 });
    console.log(`Found ${allProjects.length} projects:`);
    allProjects.forEach(project => {
      console.log(`  - Project ID: ${project.id}, Company: ${project.companyId}, Name: "${project.projectName}", Status: ${project.status}`);
      console.log(`    Coordinates: ${project.latitude}, ${project.longitude}`);
      console.log(`    Geofence: ${project.geofence ? JSON.stringify(project.geofence) : 'None'}`);
    });

    // 2. Check the specific worker user
    console.log('\n👤 WORKER USER INFO:');
    const workerUser = await User.findOne({ email: 'worker1@gmail.com' });
    if (workerUser) {
      console.log(`User ID: ${workerUser.id}, Company: ${workerUser.companyId}, Email: ${workerUser.email}`);
      console.log(`Current Project: ${JSON.stringify(workerUser.currentProject)}`);
    } else {
      console.log('❌ Worker user not found!');
    }

    // 3. Check the employee record
    console.log('\n👷 EMPLOYEE INFO:');
    const employee = await Employee.findOne({ userId: workerUser?.id });
    if (employee) {
      console.log(`Employee ID: ${employee.id}, Company: ${employee.companyId}, Name: ${employee.fullName}`);
      console.log(`Status: ${employee.status}`);
      console.log(`Current Project: ${JSON.stringify(employee.currentProject)}`);
    } else {
      console.log('❌ Employee record not found!');
    }

    // 4. Test project lookup queries that the API uses
    console.log('\n🔍 TESTING PROJECT LOOKUP QUERIES:');
    
    if (workerUser && employee) {
      // Test query 1: Project ID 1 with worker's company
      const project1 = await Project.findOne({ id: 1, companyId: workerUser.companyId });
      console.log(`Project ID 1 with company ${workerUser.companyId}:`, project1 ? 'FOUND' : 'NOT FOUND');
      if (project1) {
        console.log(`  Name: ${project1.projectName}, Status: ${project1.status}`);
      }

      // Test query 2: Project ID 1003 with worker's company
      const project1003 = await Project.findOne({ id: 1003, companyId: workerUser.companyId });
      console.log(`Project ID 1003 with company ${workerUser.companyId}:`, project1003 ? 'FOUND' : 'NOT FOUND');
      if (project1003) {
        console.log(`  Name: ${project1003.projectName}, Status: ${project1003.status}`);
      }

      // Test query 3: All projects for this company
      const companyProjects = await Project.find({ companyId: workerUser.companyId });
      console.log(`All projects for company ${workerUser.companyId}: ${companyProjects.length} found`);
      companyProjects.forEach(p => {
        console.log(`  - ID: ${p.id}, Name: ${p.projectName}`);
      });
    }

    // 5. Check for any data type issues
    console.log('\n🔧 DATA TYPE ANALYSIS:');
    const sampleProject = await Project.findOne({});
    if (sampleProject) {
      console.log(`Sample project ID type: ${typeof sampleProject.id} (value: ${sampleProject.id})`);
      console.log(`Sample project companyId type: ${typeof sampleProject.companyId} (value: ${sampleProject.companyId})`);
    }

    if (workerUser) {
      console.log(`Worker companyId type: ${typeof workerUser.companyId} (value: ${workerUser.companyId})`);
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

debugProjectNotFound();