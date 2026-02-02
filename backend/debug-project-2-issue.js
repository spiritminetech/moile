import mongoose from 'mongoose';
import Project from './src/modules/project/models/Project.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Employee from './src/modules/employee/Employee.js';
import appConfig from './src/config/app.config.js';

async function debugProject2Issue() {
  try {
    // Connect to MongoDB
    await mongoose.connect(appConfig.database.uri, { 
      dbName: appConfig.database.name,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    console.log('🔍 DEBUGGING PROJECT 2 ISSUE');
    console.log('============================');
    console.log('User Location: 12.865145716526893, 77.64679448904312 (Bangalore, India)');
    console.log('Requested Project ID: 2');
    console.log('');

    // 1. Check if Project ID 2 exists
    console.log('📋 Step 1: Checking if Project ID 2 exists...');
    const project2 = await Project.findOne({ id: 2 });
    
    if (project2) {
      console.log('✅ Project ID 2 found:');
      console.log(`  Name: ${project2.projectName}`);
      console.log(`  Company ID: ${project2.companyId}`);
      console.log(`  Location: ${project2.latitude}, ${project2.longitude}`);
      console.log(`  Geofence Radius: ${project2.geofenceRadius}m`);
      console.log(`  Status: ${project2.status}`);
    } else {
      console.log('❌ Project ID 2 NOT FOUND');
      
      // Check what projects exist
      const allProjects = await Project.find({}).sort({ id: 1 });
      console.log(`\n📋 Available Projects (${allProjects.length} total):`);
      allProjects.slice(0, 10).forEach(project => {
        console.log(`  ID: ${project.id} | Name: ${project.projectName} | Company: ${project.companyId} | Status: ${project.status}`);
      });
      if (allProjects.length > 10) {
        console.log(`  ... and ${allProjects.length - 10} more projects`);
      }
    }

    // 2. Check worker assignments for Project 2
    console.log('\n👤 Step 2: Checking worker assignments for Project 2...');
    const employee = await Employee.findOne({ userId: 2, companyId: 1 });
    if (employee) {
      console.log(`Employee found: ${employee.fullName} (ID: ${employee.id})`);
      
      const today = new Date().toISOString().split('T')[0];
      const assignments = await WorkerTaskAssignment.find({
        employeeId: employee.id,
        projectId: 2,
        date: today
      });
      
      console.log(`Assignments for Project 2 today: ${assignments.length}`);
      assignments.forEach(assignment => {
        console.log(`  Task ID: ${assignment.taskId} | Status: ${assignment.status}`);
      });
      
      if (assignments.length === 0) {
        console.log('❌ No task assignments found for Project 2 today');
        
        // Check all assignments for this employee
        const allAssignments = await WorkerTaskAssignment.find({
          employeeId: employee.id,
          date: today
        });
        console.log(`\nAll assignments today: ${allAssignments.length}`);
        allAssignments.forEach(assignment => {
          console.log(`  Project ID: ${assignment.projectId} | Task ID: ${assignment.taskId} | Status: ${assignment.status}`);
        });
      }
    }

    // 3. Check projects in worker's company
    console.log('\n🏢 Step 3: Checking projects in Company 1...');
    const companyProjects = await Project.find({ companyId: 1 }).sort({ id: 1 });
    console.log(`Projects in Company 1: ${companyProjects.length}`);
    companyProjects.forEach(project => {
      console.log(`  ID: ${project.id} | Name: ${project.projectName} | Location: ${project.latitude}, ${project.longitude} | Status: ${project.status}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

debugProject2Issue();