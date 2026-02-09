import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/modules/user/User.js';
import CompanyUser from './src/modules/companyUser/CompanyUser.js';
import bcrypt from 'bcryptjs';

dotenv.config();

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'supervisor@gmail.com';
    const password = 'password123';

    console.log(`\n🔐 Testing login for: ${email}`);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`✅ User found: ${user.id}`);
    console.log(`   - Has password: ${!!user.password}`);

    // Check password
    if (user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      console.log(`   - Password match: ${isMatch ? '✅ YES' : '❌ NO'}`);
    }

    // Find company user
    const companyUser = await CompanyUser.findOne({ userId: user.id });
    if (companyUser) {
      console.log(`✅ CompanyUser found:`);
      console.log(`   - companyId: ${companyUser.companyId}`);
      console.log(`   - role: ${companyUser.role}`);
    } else {
      console.log('❌ CompanyUser not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testLogin();
