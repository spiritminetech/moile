import mongoose from 'mongoose';
import User from './src/modules/user/User.js';
import bcrypt from 'bcrypt';

async function checkUser() {
  try {
    await mongoose.connect('mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp');
    console.log('✅ Connected to MongoDB');
    
    const user = await User.findOne({ email: 'dashboard.worker@company.com' });
    if (user) {
      console.log('👤 User found:', user.email);
      console.log('   ID:', user.id);
      console.log('   Active:', user.isActive);
      
      // Test password
      const isValid = await bcrypt.compare('password123', user.passwordHash);
      console.log('   Password valid:', isValid);
    } else {
      console.log('❌ User dashboard.worker@company.com not found');
      
      // List all users to see what exists
      console.log('\n📋 All users in database:');
      const allUsers = await User.find({}, 'email isActive').limit(10);
      allUsers.forEach(u => {
        console.log(`   - ${u.email} (Active: ${u.isActive})`);
      });
    }
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUser();