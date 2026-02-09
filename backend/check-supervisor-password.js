import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const CompanyUserSchema = new mongoose.Schema({
  userId: Number,
  email: String,
  password: String,
  role: String,
  fullName: String
}, { collection: 'companyusers' });

const CompanyUser = mongoose.model('CompanyUser', CompanyUserSchema);

async function checkPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const supervisor = await CompanyUser.findOne({ email: 'supervisor@gmail.com' });
    
    if (!supervisor) {
      console.log('❌ Supervisor not found');
      return;
    }

    console.log('📋 Supervisor found:');
    console.log('   Email:', supervisor.email);
    console.log('   Role:', supervisor.role);
    console.log('   Password hash:', supervisor.password?.substring(0, 20) + '...');

    // Test common passwords
    const testPasswords = ['password123', 'password', '123456', 'admin123'];
    
    console.log('\n🔐 Testing passwords:');
    for (const pwd of testPasswords) {
      const match = await bcrypt.compare(pwd, supervisor.password);
      console.log(`   ${pwd}: ${match ? '✅ MATCH' : '❌ No match'}`);
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPassword();
