import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';
import Project from './src/modules/project/models/Project.js';

dotenv.config();

async function assignWorker2ToProject() {
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

    // Find Project 1017 (ManuCore System)
    const project = await Project.findOne({ id: 1017 }).lean();
    if (!project) {
      console.log('❌ Project 1017 not found');
      return;
    }

    console.log(`\n📋 Project 1017: ${project.projectName}`);
    console.log(`   Supervisor ID: ${project.supervisorId}`);

    // Assign worker2 to Project 1017
    console.log(`\n🔧 Assigning worker2 to Project 1017...`);

    await Employee.findOneAndUpdate(
      { id: worker2.id },
      {
        currentProject: {
          id: project.id,
          name: project.projectName,
          code: project.projectCode
        }
      },
      { new: true }
    );

    console.log('✅ Successfully assigned worker2 to Project 1017!');

    // Verify
    const updatedWorker2 = await Employee.findOne({ id: worker2.id }).lean();
    console.log(`\n✅ Verification:`);
    console.log(`   Worker: ${updatedWorker2.fullName}`);
    console.log(`   Current Project: ${JSON.stringify(updatedWorker2.currentProject)}`);

    console.log('\n✅ Now supervisor1@gmail.com should see worker2@gmail.com leave requests!');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

assignWorker2ToProject();
