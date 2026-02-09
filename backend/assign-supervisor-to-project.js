import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './src/modules/project/models/Project.js';
import Employee from './src/modules/employee/Employee.js';

dotenv.config();

async function assignSupervisorToProject() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find supervisor
    const supervisor = await Employee.findOne({ id: 4 });
    if (!supervisor) {
      console.error('❌ Supervisor with ID 4 not found');
      return;
    }

    console.log(`✅ Found Supervisor: ${supervisor.fullName} (ID: ${supervisor.id})`);

    // Find existing projects
    const projects = await Project.find({}).limit(5);
    console.log(`\n📋 Found ${projects.length} projects:`);
    projects.forEach(p => {
      console.log(`   - ID: ${p.id}, Name: ${p.projectName}, Supervisor: ${p.supervisorId || 'None'}`);
    });

    if (projects.length === 0) {
      console.error('\n❌ No projects found in database');
      return;
    }

    // Assign supervisor to first project
    const project = projects[0];
    await Project.findOneAndUpdate(
      { id: project.id },
      { supervisorId: supervisor.id },
      { new: true }
    );

    console.log(`\n✅ Assigned Supervisor ${supervisor.id} to Project ${project.id} (${project.projectName})`);

    // Update employee's current project
    await Employee.findOneAndUpdate(
      { id: supervisor.id },
      { currentProjectId: project.id },
      { new: true }
    );

    console.log(`✅ Updated supervisor's currentProjectId to ${project.id}`);

    // Verify
    const updatedProject = await Project.findOne({ id: project.id });
    console.log(`\n✅ Verification:`);
    console.log(`   Project: ${updatedProject.projectName}`);
    console.log(`   Supervisor ID: ${updatedProject.supervisorId}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

assignSupervisorToProject();
