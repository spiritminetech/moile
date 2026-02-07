import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

async function checkBothSupervisors() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Check supervisor@gmail.com
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 CHECKING: supervisor@gmail.com');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const gmailUser = await db.collection('users').findOne({ email: 'supervisor@gmail.com' });
    
    if (gmailUser) {
      console.log('📄 Full User Document:');
      console.log(JSON.stringify(gmailUser, null, 2));
      
      // Try to login
      console.log('\n🔐 Testing Login...');
      if (gmailUser.passwordHash) {
        const isValid = await bcrypt.compare('password123', gmailUser.passwordHash);
        console.log(`   Password 'password123': ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      } else {
        console.log('   ❌ No passwordHash field found');
      }

      // Check supervisor record
      const gmailSupervisor = await db.collection('supervisors').findOne({ 
        userId: gmailUser.id 
      });
      
      if (gmailSupervisor) {
        console.log('\n📋 Supervisor Record Found:');
        console.log(JSON.stringify(gmailSupervisor, null, 2));

        const gmailProjects = await db.collection('projects').find({ 
          supervisorId: gmailSupervisor.id 
        }).toArray();
        
        console.log(`\n📍 Projects: ${gmailProjects.length}`);
        gmailProjects.forEach(p => {
          console.log(`   - Project ${p.id}: ${p.projectName}`);
        });
      } else {
        console.log('\n❌ No supervisor record found');
      }
    } else {
      console.log('❌ User NOT found');
    }

    // Check supervisor@company.com
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('🔍 CHECKING: supervisor@company.com');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const companyUser = await db.collection('users').findOne({ email: 'supervisor@company.com' });
    
    if (companyUser) {
      console.log('📄 Full User Document:');
      console.log(JSON.stringify(companyUser, null, 2));
      
      // Try to login
      console.log('\n🔐 Testing Login...');
      if (companyUser.passwordHash) {
        const isValid = await bcrypt.compare('password123', companyUser.passwordHash);
        console.log(`   Password 'password123': ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      } else {
        console.log('   ❌ No passwordHash field found');
      }

      // Check supervisor record
      const companySupervisor = await db.collection('supervisors').findOne({ 
        userId: companyUser.id 
      });
      
      if (companySupervisor) {
        console.log('\n📋 Supervisor Record Found:');
        console.log(JSON.stringify(companySupervisor, null, 2));

        const companyProjects = await db.collection('projects').find({ 
          supervisorId: companySupervisor.id 
        }).toArray();
        
        console.log(`\n📍 Projects: ${companyProjects.length}`);
        companyProjects.forEach(p => {
          console.log(`   - Project ${p.id}: ${p.projectName}`);
        });
      } else {
        console.log('\n❌ No supervisor record found');
      }
    } else {
      console.log('❌ User NOT found');
    }

    // Final recommendation
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('💡 RECOMMENDATION');
    console.log('═══════════════════════════════════════════════════════════\n');

    if (gmailUser && gmailUser.passwordHash) {
      const gmailValid = await bcrypt.compare('password123', gmailUser.passwordHash);
      const gmailSupervisor = await db.collection('supervisors').findOne({ userId: gmailUser.id });
      const gmailProjects = gmailSupervisor ? 
        await db.collection('projects').countDocuments({ supervisorId: gmailSupervisor.id }) : 0;

      if (gmailValid && gmailProjects > 0) {
        console.log('✅ Use: supervisor@gmail.com with password123');
        console.log(`   Has ${gmailProjects} projects assigned`);
      } else if (!gmailValid) {
        console.log('❌ supervisor@gmail.com: Password is incorrect');
      } else if (gmailProjects === 0) {
        console.log('⚠️ supervisor@gmail.com: No projects assigned');
        console.log('   This is why you get varying responses!');
      }
    }

    if (companyUser && companyUser.passwordHash) {
      const companyValid = await bcrypt.compare('password123', companyUser.passwordHash);
      const companySupervisor = await db.collection('supervisors').findOne({ userId: companyUser.id });
      const companyProjects = companySupervisor ? 
        await db.collection('projects').countDocuments({ supervisorId: companySupervisor.id }) : 0;

      if (companyValid && companyProjects > 0) {
        console.log('\n✅ Use: supervisor@company.com with password123');
        console.log(`   Has ${companyProjects} projects assigned`);
      } else if (!companyValid) {
        console.log('\n❌ supervisor@company.com: Password is incorrect');
      } else if (companyProjects === 0) {
        console.log('\n⚠️ supervisor@company.com: No projects assigned');
      }
    }

    console.log('\n');
    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkBothSupervisors();
