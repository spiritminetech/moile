// Check supervisor setup
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function checkSupervisorSetup() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check supervisor user
    const supervisorUser = await User.findOne({ email: 'supervisor@gmail.com' });
    if (!supervisorUser) {
      console.log('❌ No supervisor user found with email: supervisor@gmail.com');
      process.exit(1);
    }
    console.log('✅ Supervisor User Found:');
    console.log('   ID:', supervisorUser.id);
    console.log('   Email:', supervisorUser.email);
    console.log('   Role:', supervisorUser.role);
    console.log('');

    // Check supervisor employee record
    const supervisorEmployee = await Employee.findOne({ userId: supervisorUser.id });
    if (!supervisorEmployee) {
      console.log('❌ No employee record found for supervisor user');
      console.log('   Creating supervisor employee record...\n');
      
      const maxId = await Employee.findOne().sort({ id: -1 }).select('id');
      const newId = (maxId?.id || 0) + 1;
      
      const newSupervisor = await Employee.create({
        id: newId,
        userId: supervisorUser.id,
        fullName: 'Supervisor User',
        email: 'supervisor@gmail.com',
        phone: '+1234567890',
        role: 'Supervisor',
        companyId: 1,
        projectId: 1,
        status: 'active',
        dateOfJoining: new Date()
      });
      
      console.log('✅ Created supervisor employee record:');
      console.log('   ID:', newSupervisor.id);
      console.log('   Name:', newSupervisor.fullName);
      console.log('   Role:', newSupervisor.role);
    } else {
      console.log('✅ Supervisor Employee Found:');
      console.log('   ID:', supervisorEmployee.id);
      console.log('   Name:', supervisorEmployee.fullName);
      console.log('   Role:', supervisorEmployee.role);
      console.log('   Project ID:', supervisorEmployee.projectId);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkSupervisorSetup();
