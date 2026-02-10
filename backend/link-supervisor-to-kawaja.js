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

async function linkSupervisorToKawaja() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Update the supervisor user to have id: 4
    console.log('🔧 Updating supervisor@gmail.com user to have id: 4...');
    await User.updateOne(
      { email: 'supervisor@gmail.com' },
      { id: 4 }
    );

    // Update Kawaja employee to have numeric id: 4 (instead of ObjectId string)
    console.log('🔧 Updating Kawaja employee to have numeric id: 4...');
    await Employee.updateOne(
      { fullName: 'Kawaja' },
      { 
        id: 4,
        userId: 4
      }
    );

    // Verify the setup
    const user = await User.findOne({ email: 'supervisor@gmail.com' });
    const employee = await Employee.findOne({ userId: 4 });

    console.log('\n✅ Verification:');
    console.log('Supervisor User:', {
      id: user.id,
      email: user.email,
      idType: typeof user.id
    });

    if (employee) {
      console.log('Linked Employee:', {
        id: employee.id,
        name: employee.fullName,
        userId: employee.userId,
        idType: typeof employee.id
      });
      
      console.log(`\nMatch check: user.id (${user.id}) === employee.userId (${employee.userId}): ${user.id == employee.userId ? 'YES' : 'NO'}`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Link complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

linkSupervisorToKawaja();