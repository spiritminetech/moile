// List all users in the database
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/modules/user/User.js';
import Employee from './src/modules/employee/Employee.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function listAllUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('='.repeat(80));
    console.log('🔍 LISTING ALL USERS IN DATABASE');
    console.log('='.repeat(80));

    const users = await User.find({}).sort({ id: 1 });
    
    console.log(`\nFound ${users.length} user(s) total:\n`);
    
    for (const user of users) {
      console.log('─'.repeat(80));
      console.log(`${(user.role || 'UNKNOWN').toUpperCase()} User:`);
      console.log('   User ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Username:', user.username);
      console.log('   Role:', user.role || 'N/A');
      console.log('   Company ID:', user.companyId);
      console.log('   Status:', user.status || 'N/A');
      
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
      } else {
        console.log('\n   ⚠️  No employee record linked');
      }
      console.log();
    }
    
    if (users.length === 0) {
      console.log('❌ No users found in the database');
    }
    
    console.log('='.repeat(80));
    console.log('\n📊 SUMMARY BY ROLE:');
    const roleCount = {};
    users.forEach(u => {
      roleCount[u.role] = (roleCount[u.role] || 0) + 1;
    });
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`);
    });
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

listAllUsers();
