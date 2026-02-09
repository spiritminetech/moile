import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/modules/user/User.js';
import bcrypt from 'bcryptjs';

dotenv.config();

async function checkCredentials() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const supervisorEmails = ['supervisor@gmail.com', 'supervisor1@gmail.com'];

    for (const email of supervisorEmails) {
      const user = await User.findOne({ email });
      
      if (user) {
        console.log(`\n📧 ${email}:`);
        console.log(`   - userId: ${user.id}`);
        console.log(`   - role: ${user.role}`);
        console.log(`   - password hash: ${user.password.substring(0, 30)}...`);
        
        // Test common passwords
        const testPasswords = ['password123', 'Password123', 'password', '123456'];
        for (const pwd of testPasswords) {
          const isMatch = await bcrypt.compare(pwd, user.password);
          if (isMatch) {
            console.log(`   ✅ Password is: "${pwd}"`);
            break;
          }
        }
      } else {
        console.log(`\n❌ ${email} not found`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkCredentials();
