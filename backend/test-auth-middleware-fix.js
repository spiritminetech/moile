// Test the authentication middleware fix
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';

const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp';
const JWT_SECRET = 'your_super_secure_jwt_secret_key_2024';

async function testAuthMiddlewareFix() {
  console.log('🧪 Testing Authentication Middleware Fix');
  console.log('=======================================');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get Employee 107 data
    const employee107 = await Employee.findOne({ id: 107 });
    const user64 = await User.findOne({ id: 64 });

    if (!employee107 || !user64) {
      console.log('❌ Employee 107 or User 64 not found');
      return;
    }

    console.log('\n1️⃣ Employee 107 Data:');
    console.log(`   Employee ID: ${employee107.id}`);
    console.log(`   Name: ${employee107.fullName}`);
    console.log(`   User ID: ${employee107.userId}`);

    console.log('\n2️⃣ User 64 Data:');
    console.log(`   User ID: ${user64.id}`);
    console.log(`   Email: ${user64.email}`);

    // Create a JWT token like the auth service does
    const tokenPayload = {
      userId: user64.id,  // This is what auth service creates
      companyId: 1,
      roleId: 1,
      role: 'worker',
      email: user64.email,
      permissions: []
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });
    console.log('\n3️⃣ Created JWT Token:');
    console.log('   Token payload:', tokenPayload);

    // Simulate what the middleware does
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('\n4️⃣ Decoded Token:');
    console.log('   Decoded data:', decoded);

    // Simulate employee lookup in middleware
    const employeeLookup = await Employee.findOne({ userId: decoded.userId });
    console.log('\n5️⃣ Employee Lookup Result:');
    console.log('   Found employee:', employeeLookup ? {
      id: employeeLookup.id,
      name: employeeLookup.fullName,
      userId: employeeLookup.userId
    } : 'Not found');

    // Simulate what req.user would look like after middleware
    const reqUser = {
      id: decoded.userId,  // ← This is the fix
      userId: decoded.userId,
      companyId: decoded.companyId,
      role: decoded.role,
      email: decoded.email,
      employeeId: employeeLookup?.id
    };

    console.log('\n6️⃣ req.user after middleware:');
    console.log('   req.user:', reqUser);

    // Simulate what the controller would do
    const userId = reqUser.id;  // This is what controller uses
    const employee = await Employee.findOne({ userId }).lean();

    console.log('\n7️⃣ Controller Employee Lookup:');
    console.log('   userId from req.user.id:', userId);
    console.log('   Employee found:', employee ? {
      id: employee.id,
      name: employee.fullName,
      userId: employee.userId
    } : 'Not found');

    // Test leave request data creation
    if (employee) {
      const leaveRequestData = {
        id: Date.now(),
        companyId: employee.companyId,
        employeeId: employee.id,  // ← This should now be 107
        leaveType: 'MEDICAL',
        fromDate: new Date('2026-02-10'),
        toDate: new Date('2026-02-12'),
        reason: 'Test leave request',
        createdBy: userId,
        status: 'PENDING'
      };

      console.log('\n8️⃣ Leave Request Data:');
      console.log('   Employee ID:', leaveRequestData.employeeId);
      console.log('   Created By:', leaveRequestData.createdBy);
      console.log('   Company ID:', leaveRequestData.companyId);

      if (leaveRequestData.employeeId === 107) {
        console.log('✅ SUCCESS: Leave request will be created for Employee 107');
      } else {
        console.log('❌ FAILURE: Leave request will be created for wrong employee');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testAuthMiddlewareFix();