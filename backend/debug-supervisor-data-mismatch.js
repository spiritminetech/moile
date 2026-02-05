import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Task from './src/modules/task/Task.js';
import Attendance from './src/modules/attendance/Attendance.js';
import User from './src/modules/user/User.js';
import CompanyUser from './src/modules/companyUser/CompanyUser.js';

// Load environment variables
dotenv.config();

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

/**
 * Debug supervisor data mismatch
 */
async function debugSupervisorDataMismatch() {
  console.log('🔍 DEBUGGING SUPERVISOR DATA MISMATCH');
  console.log('='.repeat(60));

  await connectDB();

  try {
    // Step 1: Check supervisor user details
    console.log('\n👤 STEP 1: Supervisor User Analysis');
    console.log('-'.repeat(40));

    const supervisorUser = await User.findOne({ email: 'supervisor@gmail.com' });
    console.log('Supervisor User:', {
      id: supervisorUser.id,
      _id: supervisorUser._id,
      email: supervisorUser.email,
      fullName: supervisorUser.fullName,
      name: supervisorUser.name
    });

    // Step 2: Check all projects and their supervisor IDs
    console.log('\n🏗️  STEP 2: All Projects Analysis');
    console.log('-'.repeat(40));

    const allProjects = await Project.find();
    console.log(`Total projects in database: ${allProjects.length}`);
    
    console.log('\nAll projects with supervisor IDs:');
    allProjects.forEach((project, index) => {
      console.log(`Project ${index + 1}:`);
      console.log(`  - ID: ${project.id}`);
      console.log(`  - Name: ${project.projectName || project.name}`);
      console.log(`  - Supervisor ID: ${project.supervisorId}`);
      console.log(`  - Matches user ID: ${project.supervisorId === supervisorUser.id ? '✅' : '❌'}`);
    });

    // Step 3: Check projects assigned to supervisor (what dashboard uses)
    console.log('\n📊 STEP 3: Dashboard Logic Analysis');
    console.log('-'.repeat(40));

    // This is what the dashboard does
    const dashboardProjects = await Project.find({ supervisorId: supervisorUser.id });
    console.log(`Projects found by dashboard logic: ${dashboardProjects.length}`);
    
    dashboardProjects.forEach((project, index) => {
      console.log(`Dashboard Project ${index + 1}:`);
      console.log(`  - ID: ${project.id}`);
      console.log(`  - Name: ${project.projectName || project.name}`);
    });

    // Step 4: Check what the setup script found
    console.log('\n🔧 STEP 4: Setup Script Logic Analysis');
    console.log('-'.repeat(40));

    // This is what the setup script did (different logic)
    const setupProjects = await Project.find({ supervisorId: supervisorUser.id });
    console.log(`Projects found by setup script: ${setupProjects.length}`);

    // Step 5: Check worker assignments
    console.log('\n👥 STEP 5: Worker Assignment Analysis');
    console.log('-'.repeat(40));

    if (dashboardProjects.length > 0) {
      const projectIds = dashboardProjects.map(p => p.id);
      console.log('Project IDs for assignment check:', projectIds);

      const assignments = await WorkerTaskAssignment.find({
        projectId: { $in: projectIds },
        date: new Date().toISOString().split('T')[0]
      });

      console.log(`Task assignments for today: ${assignments.length}`);
      
      if (assignments.length > 0) {
        const employeeIds = [...new Set(assignments.map(a => a.employeeId))];
        console.log(`Unique employees with assignments: ${employeeIds.length}`);
        console.log('Employee IDs:', employeeIds);

        // Check if these employees exist
        const employees = await Employee.find({ id: { $in: employeeIds } });
        console.log(`Employees found in database: ${employees.length}`);
      }
    }

    // Step 6: Check if there are projects with different supervisor ID patterns
    console.log('\n🔍 STEP 6: Supervisor ID Pattern Analysis');
    console.log('-'.repeat(40));

    const uniqueSupervisorIds = [...new Set(allProjects.map(p => p.supervisorId))];
    console.log('Unique supervisor IDs in projects:', uniqueSupervisorIds);

    for (const supId of uniqueSupervisorIds) {
      const projectsForSup = await Project.find({ supervisorId: supId });
      console.log(`Supervisor ID ${supId}: ${projectsForSup.length} projects`);
      
      if (supId === supervisorUser.id) {
        console.log('  ✅ This matches our supervisor user');
      }
    }

    // Step 7: Potential fix - check if we need to update supervisor IDs
    console.log('\n💡 STEP 7: Potential Solutions');
    console.log('-'.repeat(40));

    if (dashboardProjects.length === 0) {
      console.log('❌ No projects assigned to supervisor user ID:', supervisorUser.id);
      console.log('Possible solutions:');
      console.log('1. Update existing projects to use supervisor ID:', supervisorUser.id);
      console.log('2. Check if supervisor should be assigned to different projects');
      console.log('3. Verify the supervisor user ID is correct');

      // Check if there are unassigned projects
      const unassignedProjects = await Project.find({ 
        $or: [
          { supervisorId: { $exists: false } },
          { supervisorId: null },
          { supervisorId: '' }
        ]
      });

      if (unassignedProjects.length > 0) {
        console.log(`\n📋 Found ${unassignedProjects.length} unassigned projects:`);
        unassignedProjects.forEach((project, index) => {
          console.log(`  ${index + 1}. ${project.projectName || project.name} (ID: ${project.id})`);
        });
        console.log('\nWould you like to assign these to the supervisor? (Manual action required)');
      }
    }

  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🏁 DEBUG COMPLETED');
    console.log('='.repeat(60));
  }
}

// Run the debug
debugSupervisorDataMismatch().catch(error => {
  console.error('❌ Debug failed:', error.message);
  process.exit(1);
});