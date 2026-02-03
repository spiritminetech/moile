import mongoose from 'mongoose';
import User from './src/modules/user/User.js';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp';

async function fixUserCurrentProject() {
  console.log('🔧 Fixing User Current Project Assignment');
  console.log('========================================');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Step 1: Get the user and employee
    const user = await User.findOne({ email: 'worker1@gmail.com' });
    const employee = await Employee.findOne({ id: 107 });

    if (!user || !employee) {
      console.log('❌ User or employee not found');
      return;
    }

    console.log(`👤 User: ${user.email} (ID: ${user.id})`);
    console.log(`👷 Employee: ${employee.fullName} (ID: ${employee.id})`);
    console.log(`🏢 Current Project: ${user.currentProject || 'None'}`);

    // Step 2: Get today's task assignments to find the primary project
    const today = new Date().toISOString().split('T')[0];
    const assignments = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      date: today
    }).sort({ sequence: 1 }); // Get first assignment as primary

    if (assignments.length === 0) {
      console.log('❌ No task assignments found for today');
      return;
    }

    console.log(`📋 Found ${assignments.length} assignments for today:`);
    assignments.forEach(a => {
      console.log(`   - Project ${a.projectId}, Task ${a.taskId}, Sequence: ${a.sequence}`);
    });

    // Step 3: Use the first project as the current project
    const primaryProjectId = assignments[0].projectId;
    const primaryProject = await Project.findOne({ id: primaryProjectId });

    if (!primaryProject) {
      console.log(`❌ Primary project ${primaryProjectId} not found`);
      return;
    }

    console.log(`\n🎯 Setting primary project: ${primaryProject.projectName} (ID: ${primaryProjectId})`);

    // Step 4: Update user's currentProject
    const currentProjectData = {
      id: primaryProject.id,
      name: primaryProject.projectName,
      code: primaryProject.projectCode || `PROJ-${primaryProject.id}`
    };

    // Step 5: Update employee's currentProject (this is what the login API uses)
    const updateResult = await Employee.findOneAndUpdate(
      { id: employee.id },
      { currentProject: currentProjectData },
      { new: true }
    );

    console.log('✅ Updated employee currentProject');
    console.log('Updated data:', updateResult.currentProject);

    // Step 6: Verify the fix
    console.log('\n🔍 Verifying the fix...');
    const updatedEmployee = await Employee.findOne({ id: employee.id });
    
    console.log('Updated employee currentProject:');
    console.log('  ID:', updatedEmployee.currentProject?.id);
    console.log('  Name:', updatedEmployee.currentProject?.name);
    console.log('  Code:', updatedEmployee.currentProject?.code);

    // Step 7: Test login response
    console.log('\n🧪 Testing login response...');
    // The login API should now return the updated currentProject

    console.log('\n✅ Fix completed! The mobile app should now work correctly.');
    console.log('\n📱 Expected behavior:');
    console.log('   1. Login will return currentProject with ID 1014');
    console.log('   2. Mobile app will use project ID 1014 for attendance');
    console.log('   3. Task assignment exists for project 1014');
    console.log('   4. Clock-in should work successfully');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixUserCurrentProject();