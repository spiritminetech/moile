import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function debugSupervisorAccess() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Check the supervisor@gmail.com user
    console.log('=== CHECKING SUPERVISOR USER ===\n');
    const user = await db.collection('users').findOne({ email: 'supervisor@gmail.com' });
    
    if (!user) {
      console.log('❌ User with email supervisor@gmail.com NOT FOUND!');
      console.log('\nLet me check what users exist:');
      const allUsers = await db.collection('users').find({}).toArray();
      console.log(`\nTotal users: ${allUsers.length}`);
      allUsers.forEach(u => {
        console.log(`  - Email: ${u.email}, ID: ${u.id}, Role: ${u.role}`);
      });
    } else {
      console.log('✅ User found:');
      console.log(`   Email: ${user.email}`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password Hash: ${user.password ? 'EXISTS' : 'MISSING'}`);
      
      // Check supervisor record
      console.log('\n=== CHECKING SUPERVISOR RECORD ===\n');
      const supervisor = await db.collection('supervisors').findOne({ userId: user.id });
      
      if (!supervisor) {
        console.log('❌ Supervisor record NOT FOUND for this user!');
        console.log('\nLet me check all supervisors:');
        const allSupervisors = await db.collection('supervisors').find({}).toArray();
        console.log(`\nTotal supervisors: ${allSupervisors.length}`);
        allSupervisors.forEach(s => {
          console.log(`  - Supervisor ID: ${s.id}, User ID: ${s.userId}, Name: ${s.fullName}`);
        });
      } else {
        console.log('✅ Supervisor record found:');
        console.log(`   Supervisor ID: ${supervisor.id}`);
        console.log(`   User ID: ${supervisor.userId}`);
        console.log(`   Full Name: ${supervisor.fullName}`);
        
        // Check projects
        console.log('\n=== CHECKING PROJECTS ===\n');
        const projects = await db.collection('projects').find({ supervisorId: supervisor.id }).toArray();
        console.log(`✅ Projects assigned to this supervisor: ${projects.length}`);
        projects.forEach(p => {
          console.log(`   - Project ${p.id}: ${p.projectName || p.name}`);
        });
        
        // Check if project 1 exists and who it's assigned to
        console.log('\n=== CHECKING PROJECT 1 ===\n');
        const project1 = await db.collection('projects').findOne({ id: 1 });
        if (project1) {
          console.log('✅ Project 1 exists:');
          console.log(`   Name: ${project1.projectName || project1.name}`);
          console.log(`   Supervisor ID: ${project1.supervisorId}`);
          console.log(`   Is this supervisor assigned? ${project1.supervisorId === supervisor.id ? 'YES ✅' : 'NO ❌'}`);
        } else {
          console.log('❌ Project 1 does NOT exist!');
        }
      }
      
      // Check company user
      console.log('\n=== CHECKING COMPANY USER ===\n');
      const companyUser = await db.collection('companyusers').findOne({ userId: user.id });
      if (companyUser) {
        console.log('✅ Company user found:');
        console.log(`   Role: ${companyUser.role}`);
        console.log(`   Company ID: ${companyUser.companyId}`);
      } else {
        console.log('❌ Company user record NOT FOUND!');
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

debugSupervisorAccess();
