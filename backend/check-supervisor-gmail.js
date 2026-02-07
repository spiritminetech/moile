import connectDB from './src/config/database.js';
import User from './src/modules/user/User.js';
import Employee from './src/modules/employee/Employee.js';
import Supervisor from './src/modules/supervisor/Supervisor.js';
import Project from './src/modules/project/Project.js';
import bcrypt from 'bcryptjs';

async function checkSupervisorGmail() {
  try {
    await connectDB();
    console.log('\n🔍 Checking supervisor@gmail.com...\n');

    // Find user
    const user = await User.findOne({ email: 'supervisor@gmail.com' }).lean();
    
    if (!user) {
      console.log('❌ User with email supervisor@gmail.com NOT FOUND\n');
      
      // Show all supervisor emails
      console.log('📧 Available supervisor emails:');
      const allUsers = await User.find({ 
        roleId: { $in: [5, 8] } 
      }).select('id email roleId active').lean();
      
      allUsers.forEach(u => {
        console.log(`   - ${u.email} (User ID: ${u.id}, Role ID: ${u.roleId}, Active: ${u.active})`);
      });
      
      process.exit(0);
    }

    console.log('✅ User found:');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role ID: ${user.roleId}`);
    console.log(`   Company ID: ${user.companyId}`);
    console.log(`   Active: ${user.active}`);
    console.log(`   Employee ID: ${user.employeeId}`);

    // Check password
    const isPasswordValid = await bcrypt.compare('password123', user.password);
    console.log(`   Password 'password123' valid: ${isPasswordValid}`);

    if (!isPasswordValid) {
      console.log('\n⚠️ Password does NOT match!');
    }

    // Check employee
    if (user.employeeId) {
      const employee = await Employee.findOne({ id: user.employeeId }).lean();
      if (employee) {
        console.log(`\n👤 Employee Details:`);
        console.log(`   Employee ID: ${employee.id}`);
        console.log(`   Name: ${employee.fullName}`);
        console.log(`   Employee Code: ${employee.employeeCode}`);
      }
    }

    // Check supervisor record
    const supervisor = await Supervisor.findOne({ 
      $or: [
        { userId: user.id },
        { employeeId: user.employeeId }
      ]
    }).lean();

    if (supervisor) {
      console.log(`\n📋 Supervisor Record:`);
      console.log(`   Supervisor ID: ${supervisor.id}`);
      console.log(`   User ID: ${supervisor.userId}`);
      console.log(`   Employee ID: ${supervisor.employeeId}`);
      console.log(`   Company ID: ${supervisor.companyId}`);

      // Check projects
      const projects = await Project.find({ 
        supervisorId: supervisor.id 
      }).select('id projectName location').lean();

      console.log(`\n📍 Projects assigned (${projects.length}):`);
      if (projects.length > 0) {
        projects.forEach(p => {
          console.log(`   - Project ${p.id}: ${p.projectName} (${p.location})`);
        });
      } else {
        console.log('   ⚠️ No projects assigned to this supervisor');
      }
    } else {
      console.log(`\n⚠️ No supervisor record found for this user`);
      console.log('   This user may not have supervisor permissions set up correctly');
    }

    // Compare with supervisor@company.com
    console.log('\n\n🔄 Comparing with supervisor@company.com...\n');
    
    const companyUser = await User.findOne({ email: 'supervisor@company.com' }).lean();
    if (companyUser) {
      console.log('✅ supervisor@company.com found:');
      console.log(`   User ID: ${companyUser.id}`);
      console.log(`   Role ID: ${companyUser.roleId}`);
      console.log(`   Company ID: ${companyUser.companyId}`);
      console.log(`   Employee ID: ${companyUser.employeeId}`);

      const companySupervisor = await Supervisor.findOne({ 
        $or: [
          { userId: companyUser.id },
          { employeeId: companyUser.employeeId }
        ]
      }).lean();

      if (companySupervisor) {
        const companyProjects = await Project.find({ 
          supervisorId: companySupervisor.id 
        }).select('id projectName').lean();

        console.log(`   Projects: ${companyProjects.length}`);
        companyProjects.forEach(p => {
          console.log(`     - Project ${p.id}: ${p.projectName}`);
        });
      }
    }

    console.log('\n✅ Done\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSupervisorGmail();
