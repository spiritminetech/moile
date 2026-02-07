import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

async function checkSupervisorGmail() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Find user with supervisor@gmail.com
    console.log('🔍 Checking supervisor@gmail.com...\n');
    const user = await db.collection('users').findOne({ email: 'supervisor@gmail.com' });
    
    if (!user) {
      console.log('❌ User with email supervisor@gmail.com NOT FOUND\n');
      
      // Show all supervisor emails
      console.log('📧 Available supervisor emails:');
      const supervisorUsers = await db.collection('users').find({ 
        roleId: { $in: [5, 8] } 
      }).toArray();
      
      supervisorUsers.forEach(u => {
        console.log(`   - ${u.email} (User ID: ${u.id}, Role ID: ${u.roleId}, Active: ${u.active})`);
      });
      
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log('✅ User found:');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role ID: ${user.roleId}`);
    console.log(`   Company ID: ${user.companyId}`);
    console.log(`   Active: ${user.active}`);
    console.log(`   Employee ID: ${user.employeeId}`);
    console.log(`   Has Password: ${user.password ? 'Yes' : 'No'}`);

    // Check password only if it exists
    let isPasswordValid = false;
    if (user.password) {
      isPasswordValid = await bcrypt.compare('password123', user.password);
      console.log(`   Password 'password123' valid: ${isPasswordValid}`);
    } else {
      console.log(`   ⚠️ No password set for this user!`);
    }

    if (!isPasswordValid) {
      console.log('\n⚠️ Password does NOT match!');
      console.log('   You may need to reset the password or use a different account');
    }

    // Check employee
    if (user.employeeId) {
      const employee = await db.collection('employees').findOne({ id: user.employeeId });
      if (employee) {
        console.log(`\n👤 Employee Details:`);
        console.log(`   Employee ID: ${employee.id}`);
        console.log(`   Name: ${employee.fullName}`);
        console.log(`   Employee Code: ${employee.employeeCode}`);
      }
    }

    // Check supervisor record
    const supervisor = await db.collection('supervisors').findOne({ 
      $or: [
        { userId: user.id },
        { employeeId: user.employeeId }
      ]
    });

    if (supervisor) {
      console.log(`\n📋 Supervisor Record:`);
      console.log(`   Supervisor ID: ${supervisor.id}`);
      console.log(`   User ID: ${supervisor.userId}`);
      console.log(`   Employee ID: ${supervisor.employeeId}`);
      console.log(`   Company ID: ${supervisor.companyId}`);

      // Check projects
      const projects = await db.collection('projects').find({ 
        supervisorId: supervisor.id 
      }).toArray();

      console.log(`\n📍 Projects assigned (${projects.length}):`);
      if (projects.length > 0) {
        projects.forEach(p => {
          console.log(`   - Project ${p.id}: ${p.projectName} (${p.location || 'N/A'})`);
        });
      } else {
        console.log('   ⚠️ No projects assigned to this supervisor');
        console.log('   This is why you may be getting different responses!');
      }
    } else {
      console.log(`\n⚠️ No supervisor record found for this user`);
      console.log('   This user may not have supervisor permissions set up correctly');
    }

    // Compare with supervisor@company.com
    console.log('\n\n🔄 Comparing with supervisor@company.com...\n');
    
    const companyUser = await db.collection('users').findOne({ email: 'supervisor@company.com' });
    if (companyUser) {
      console.log('✅ supervisor@company.com found:');
      console.log(`   User ID: ${companyUser.id}`);
      console.log(`   Role ID: ${companyUser.roleId}`);
      console.log(`   Company ID: ${companyUser.companyId}`);
      console.log(`   Employee ID: ${companyUser.employeeId}`);

      const companySupervisor = await db.collection('supervisors').findOne({ 
        $or: [
          { userId: companyUser.id },
          { employeeId: companyUser.employeeId }
        ]
      });

      if (companySupervisor) {
        const companyProjects = await db.collection('projects').find({ 
          supervisorId: companySupervisor.id 
        }).toArray();

        console.log(`   Projects: ${companyProjects.length}`);
        if (companyProjects.length > 0) {
          companyProjects.forEach(p => {
            console.log(`     - Project ${p.id}: ${p.projectName}`);
          });
        }
      }
    } else {
      console.log('❌ supervisor@company.com NOT found');
    }

    // Show recommendation
    console.log('\n\n💡 RECOMMENDATION:\n');
    if (!isPasswordValid) {
      console.log('   ❌ Password is incorrect for supervisor@gmail.com');
      console.log('   → Try a different password or use supervisor@company.com instead\n');
    } else if (!supervisor || supervisor.projects === 0) {
      console.log('   ⚠️ supervisor@gmail.com has no projects assigned');
      console.log('   → This is why responses vary - no data to return');
      console.log('   → Use supervisor@company.com which has projects assigned\n');
    } else {
      console.log('   ✅ supervisor@gmail.com should work correctly\n');
    }

    console.log('✅ Done\n');
    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkSupervisorGmail();
