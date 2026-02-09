/**
 * Fix Supervisor Project Assignment
 * Assigns supervisor@gmail.com to a project
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import User from './src/modules/user/User.js';

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

async function fixSupervisorProjectAssignment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    log('✅ Connected to MongoDB', 'green');

    // Find supervisor user
    const supervisorUser = await User.findOne({ email: 'supervisor@gmail.com' });
    if (!supervisorUser) {
      log('❌ Supervisor user not found', 'red');
      return;
    }

    log(`\n✅ Supervisor User Found:`, 'green');
    log(`   ID: ${supervisorUser.id}`, 'cyan');
    log(`   Email: ${supervisorUser.email}`, 'cyan');

    // Find supervisor employee
    const supervisor = await Employee.findOne({ userId: supervisorUser.id });
    if (!supervisor) {
      log('❌ Supervisor employee record not found', 'red');
      return;
    }

    log(`\n✅ Supervisor Employee Found:`, 'green');
    log(`   ID: ${supervisor.id}`, 'cyan');
    log(`   Name: ${supervisor.fullName}`, 'cyan');

    // Find all projects
    const projects = await Project.find({}).lean();
    log(`\n📋 Available Projects:`, 'yellow');
    projects.forEach(p => {
      log(`   Project ${p.id}: ${p.projectName} (Supervisor: ${p.supervisorId || 'None'})`, 'cyan');
    });

    // Find a project without a supervisor or assign to project 1
    let targetProject = projects.find(p => !p.supervisorId) || projects[0];
    
    if (!targetProject) {
      log('\n❌ No projects found', 'red');
      return;
    }

    log(`\n🔧 Assigning supervisor to Project ${targetProject.id}: ${targetProject.projectName}`, 'yellow');

    // Update project with supervisor
    await Project.findOneAndUpdate(
      { id: targetProject.id },
      { supervisorId: supervisor.id }
    );

    // Update supervisor's current project
    await Employee.findOneAndUpdate(
      { id: supervisor.id },
      { currentProjectId: targetProject.id }
    );

    log('✅ Supervisor assigned to project successfully', 'green');

    // Verify
    const updatedProject = await Project.findOne({ id: targetProject.id }).lean();
    const updatedSupervisor = await Employee.findOne({ id: supervisor.id }).lean();

    log(`\n✅ Verification:`, 'green');
    log(`   Project ${updatedProject.id} supervisor: ${updatedProject.supervisorId}`, 'cyan');
    log(`   Supervisor ${updatedSupervisor.id} current project: ${updatedSupervisor.currentProjectId}`, 'cyan');

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await mongoose.disconnect();
    log('\n✅ Disconnected from MongoDB', 'green');
  }
}

fixSupervisorProjectAssignment();
