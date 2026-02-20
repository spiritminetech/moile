import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';
import Project from './src/modules/project/models/Project.js';

dotenv.config();

async function fixWorker2Assignment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find worker2
    const worker2User = await User.findOne({ email: 'worker2@gmail.com' });
    if (!worker2User) {
      console.log('❌ worker2@gmail.com user not found');
      return;
    }

    const worker2 = await Employee.findOne({ userId: worker2User.id });
    if (!worker2) {
      console.log('❌ worker2 employee record not found');
      return;
    }

    console.log(`👤 Found worker2: ${worker2.fullName} (ID: ${worker2.id})`);
    console.log(`   Current Project: ${JSON.stringify(worker2.currentProject)}`);

    // Find supervisor@gmail.com's projects
    const supervisorUser = await User.findOne({ email: 'supervisor@gmail.com' });
    const supervisor = await Employee.findOne({ userId: supervisorUser.id });
    
    const supervisorProjects = await Project.find({ supervisorId: supervisor.id }).lean();
    console.log(`\n📋 Supervisor ${supervisor.fullName} has ${supervisorProjects.length} projects:`);
    supervisorProjects.forEach(p => console.log(`   - Project ${p.id}: ${p.projectName}`));

    // Assign worker2 to the first project (Hospital Wing Extension - 1002)
    const projectToAssign = supervisorProjects[0];
    
    console.log(`\n🔧 Assigning worker2 to Project ${projectToAssign.id}: ${projectToAssign.projectName}`);

    await Employee.findOneAndUpdate(
      { id: worker2.id },
      {
        currentProject: {
          id: projectToAssign.id,
          name: projectToAssign.projectName,
          code: projectToAssign.projectCode
        }
      },
      { new: true }
    );

    console.log('✅ Successfully assigned worker2 to project!');

    // Verify
    const updatedWorker2 = await Employee.findOne({ id: worker2.id }).lean();
    console.log(`\n✅ Verification:`);
    console.log(`   Worker: ${updatedWorker2.fullName}`);
    console.log(`   Current Project: ${JSON.stringify(updatedWorker2.currentProject)}`);

    console.log('\n✅ Now supervisor@gmail.com should see worker2@gmail.com leave requests!');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixWorker2Assignment();
