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

async function forceUpdateSupervisorUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the current supervisor user
    const currentUser = await User.findOne({ email: 'supervisor@gmail.com' });
    console.log('👤 Current supervisor user:', {
      _id: currentUser._id,
      id: currentUser.id,
      email: currentUser.email
    });

    // Force update using MongoDB's $set operator
    console.log('🔧 Force updating user id to numeric 4...');
    const updateResult = await User.updateOne(
      { email: 'supervisor@gmail.com' },
      { $set: { id: 4 } }
    );
    
    console.log('Update result:', updateResult);

    // Also update the employee to have numeric IDs
    console.log('🔧 Force updating Kawaja employee to have numeric id: 4...');
    const empUpdateResult = await Employee.updateOne(
      { fullName: 'Kawaja' },
      { $set: { id: 4, userId: 4 } }
    );
    
    console.log('Employee update result:', empUpdateResult);

    // Verify the changes
    const updatedUser = await User.findOne({ email: 'supervisor@gmail.com' });
    const updatedEmployee = await Employee.findOne({ fullName: 'Kawaja' });

    console.log('\n✅ Final verification:');
    console.log('User:', {
      id: updatedUser.id,
      email: updatedUser.email,
      idType: typeof updatedUser.id
    });

    console.log('Employee:', {
      id: updatedEmployee.id,
      name: updatedEmployee.fullName,
      userId: updatedEmployee.userId,
      idType: typeof updatedEmployee.id,
      userIdType: typeof updatedEmployee.userId
    });

    console.log(`\nMatch check: user.id (${updatedUser.id}) === employee.userId (${updatedEmployee.userId}): ${updatedUser.id == updatedEmployee.userId ? 'YES' : 'NO'}`);

    await mongoose.disconnect();
    console.log('\n✅ Force update complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

forceUpdateSupervisorUser();