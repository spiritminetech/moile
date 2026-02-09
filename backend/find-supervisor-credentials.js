import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import CompanyUser from './src/modules/companyUser/CompanyUser.js';

dotenv.config();

async function findSupervisorCredentials() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find supervisor employee
    const supervisor = await Employee.findOne({ id: 4 }).lean();
    
    console.log('\n📋 Supervisor Employee:');
    console.log('  ID:', supervisor.id);
    console.log('  Name:', supervisor.fullName);
    console.log('  User ID:', supervisor.userId);
    console.log('  Email:', supervisor.email);

    // Find the user account
    if (supervisor.userId) {
      const user = await CompanyUser.findOne({ id: supervisor.userId }).lean();
      
      if (user) {
        console.log('\n👤 User Account:');
        console.log('  ID:', user.id);
        console.log('  Email:', user.email);
        console.log('  Role:', user.role);
        console.log('  Has Password Hash:', !!user.passwordHash);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

findSupervisorCredentials();
