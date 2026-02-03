// Debug JWT token to see what user data is actually in the token
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';

const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp';
const JWT_SECRET = 'your_super_secure_jwt_secret_key_2024';

async function debugJWTTokenIssue() {
  console.log('🔍 Debugging JWT Token Issue');
  console.log('============================');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check both employees
    console.log('\n1️⃣ Employee Data Verification...');
    
    const employee27 = await Employee.findOne({ id: 27 });
    const employee107 = await Employee.findOne({ id: 107 });
    
    console.log('Employee 27:', employee27 ? {
      id: employee27.id,
      name: employee27.fullName,
      userId: employee27.userId
    } : 'Not found');
    
    console.log('Employee 107:', employee107 ? {
      id: employee107.id,
      name: employee107.fullName,
      userId: employee107.userId
    } : 'Not found');

    // Check users
    console.log('\n2️⃣ User Data Verification...');
    
    if (employee27?.userId) {
      const user27 = await User.findOne({ id: employee27.userId });
      console.log('User for Employee 27:', user27 ? {
        id: user27.id,
        email: user27.email,
        name: user27.name
      } : 'Not found');
    }
    
    if (employee107?.userId) {
      const user107 = await User.findOne({ id: employee107.userId });
      console.log('User for Employee 107:', user107 ? {
        id: user107.id,
        email: user107.email,
        name: user107.name
      } : 'Not found');
    }

    // Generate sample tokens to see what they should look like
    console.log('\n3️⃣ Sample JWT Tokens...');
    
    if (employee107?.userId) {
      const sampleToken107 = jwt.sign(
        { 
          id: employee107.userId,
          email: 'worker1@gmail.com',
          role: 'worker'
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      console.log('Sample token for Employee 107 (userId 64):');
      console.log('Token:', sampleToken107.substring(0, 50) + '...');
      
      // Decode it to verify
      const decoded = jwt.verify(sampleToken107, JWT_SECRET);
      console.log('Decoded token data:', decoded);
    }

    // Check what happens in the authentication flow
    console.log('\n4️⃣ Authentication Flow Analysis...');
    console.log('When you log in as Employee 107:');
    console.log('1. Login should use email: worker1@gmail.com');
    console.log('2. JWT should contain userId: 64');
    console.log('3. Employee lookup should find Employee 107');
    console.log('4. Leave request should use employeeId: 107');
    
    console.log('\n5️⃣ Possible Issues...');
    console.log('❓ Check these possibilities:');
    console.log('1. JWT token still contains old userId from previous login');
    console.log('2. Mobile app cached old authentication data');
    console.log('3. Multiple browser/app sessions with different users');
    console.log('4. Authentication middleware using wrong user lookup');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugJWTTokenIssue();