import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// Define schemas without strict validation to see actual data
const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const User = mongoose.model('User', UserSchema);

const EmployeeSchema = new mongoose.Schema({}, { strict: false, collection: 'employees' });
const Employee = mongoose.model('Employee', EmployeeSchema);

async function getSupervisorUserId() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the supervisor@gmail.com user
    const user = await User.findOne({ email: 'supervisor@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      idType: typeof user.id
    });

    // Find employee with this userId
    const employee = await Employee.findOne({ userId: user.id });
    
    if (employee) {
      console.log('\n👷 Employee found:', {
        id: employee.id,
        name: employee.fullName,
        userId: employee.userId,
        idType: typeof employee.id
      });
    } else {
      console.log('\n❌ No employee found with userId:', user.id);
    }

    await mongoose.disconnect();
    console.log('\n✅ Complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

getSupervisorUserId();