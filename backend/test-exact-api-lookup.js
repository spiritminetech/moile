import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

// Define schemas without strict validation to see actual data
const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const User = mongoose.model('User', UserSchema);

const EmployeeSchema = new mongoose.Schema({}, { strict: false, collection: 'employees' });
const Employee = mongoose.model('Employee', EmployeeSchema);

async function testExactApiLookup() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Simulate the exact login process
    const user = await User.findOne({ email: 'supervisor@gmail.com' });
    console.log('👤 User found during login:', {
      id: user.id,
      email: user.email,
      name: user.name
    });

    // Create a JWT token like the API does
    const token = jwt.sign(
      { 
        id: user.id,
        userId: user.id, // Some APIs use userId
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Decode the token to see what the API receives
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('\n🔑 Token payload (what API receives):', {
      id: decoded.id,
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    });

    // Simulate the exact supervisor lookup from getPendingApprovalsSummary
    const userId = decoded.id || decoded.userId;
    console.log('\n🔍 Looking for supervisor with userId:', userId);
    
    const supervisor = await Employee.findOne({ userId }).lean();
    
    if (supervisor) {
      console.log('✅ Supervisor found:', {
        id: supervisor.id,
        name: supervisor.fullName,
        userId: supervisor.userId,
        idType: typeof supervisor.id
      });
    } else {
      console.log('❌ Supervisor NOT found');
      
      // Check what employees exist with userId
      const employeesWithUserId = await Employee.find({ 
        userId: { $exists: true, $ne: null } 
      }).limit(5);
      
      console.log('\n📊 Employees with userId (first 5):');
      employeesWithUserId.forEach((emp, idx) => {
        console.log(`${idx + 1}. ${emp.fullName}: userId=${emp.userId} (type: ${typeof emp.userId})`);
        console.log(`   Match with ${userId}: ${emp.userId === userId ? 'YES' : 'NO'}`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Test complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

testExactApiLookup();