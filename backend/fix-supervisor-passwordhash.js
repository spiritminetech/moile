import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/modules/user/User.js';
import bcrypt from 'bcryptjs';

dotenv.config();

async function fixSupervisorPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'supervisor@gmail.com';
    const newPassword = 'password123';

    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User ${email} not found`);
      return;
    }

    console.log(`\n📧 Found user: ${email}`);
    console.log(`   - userId: ${user.id}`);
    console.log(`   - Current passwordHash: ${user.passwordHash ? user.passwordHash.substring(0, 30) + '...' : 'NOT SET'}`);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the user with correct field name
    user.passwordHash = hashedPassword;
    await user.save();

    console.log(`\n✅ Password updated successfully!`);
    console.log(`   - New password: ${newPassword}`);
    console.log(`   - Hash: ${hashedPassword.substring(0, 30)}...`);

    // Verify the password works
    const isMatch = await bcrypt.compare(newPassword, user.passwordHash);
    console.log(`   - Verification: ${isMatch ? '✅ PASS' : '❌ FAIL'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixSupervisorPassword();
