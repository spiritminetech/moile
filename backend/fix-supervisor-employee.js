// Fix supervisor employee record
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function fixSupervisorEmployee() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get supervisor user
    const supervisorUser = await User.findOne({ email: 'supervisor@gmail.com' });
    if (!supervisorUser) {
      console.log('❌ No supervisor user found');
      process.exit(1);
    }

    // Update supervisor employee record
    const updated = await Employee.findOneAndUpdate(
      { userId: supervisorUser.id },
      {
        $set: {
          role: 'Supervisor',
          projectId: 1,
          companyId: 1,
          status: 'active'
        }
      },
      { new: true }
    );

    if (updated) {
      console.log('✅ Updated supervisor employee record:');
      console.log('   ID:', updated.id);
      console.log('   Name:', updated.fullName);
      console.log('   Role:', updated.role);
      console.log('   Project ID:', updated.projectId);
      console.log('   Company ID:', updated.companyId);
    } else {
      console.log('❌ Failed to update supervisor employee');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

fixSupervisorEmployee();
