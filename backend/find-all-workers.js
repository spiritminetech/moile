// Find all worker accounts in the database
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/modules/user/User.js';
import Employee from './src/modules/employee/Employee.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function findAllWorkers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('='.repeat(80));
    console.log('🔍 FINDING ALL WORKER ACCOUNTS');
    console.log('='.repeat(80));

    // Find all users with worker role
    const workerUsers = await User.find({ role: 'worker' }).sort({ id: 1 });
    
    console.log(`\nFound ${workerUsers.length} worker user(s):\n`);
    
    for (const user of workerUsers) {
      console.log('─'.repeat(80));
      console.log('👤 Worker User:');
      console.log('   User ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Username:', user.username);
      console.log('   Role:', user.role);
      console.log('   Company ID:', user.companyId);
      console.log('   Status:', user.status);
      
      // Find corresponding employee
      const employee = await Employee.findOne({
        userId: user.id,
        companyId: user.companyId
      });
      
      if (employee) {
        console.log('\n   📋 Employee Record:');
        console.log('      Employee ID:', employee.id);
        console.log('      Full Name:', employee.fullName);
        console.log('      Status:', employee.status);
        console.log('      Trade:', employee.trade || 'N/A');
      } else {
        console.log('\n   ❌ No employee record found');
      }
      console.log();
    }
    
    if (workerUsers.length === 0) {
      console.log('❌ No worker accounts found in the database');
      console.log('\n💡 You may need to create a worker account first');
    }
    
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

findAllWorkers();
