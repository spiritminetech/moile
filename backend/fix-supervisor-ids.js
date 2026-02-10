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

async function fixSupervisorIds() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the supervisor@gmail.com user
    const user = await User.findOne({ email: 'supervisor@gmail.com' });
    console.log('👤 Supervisor user:', {
      id: user.id,
      email: user.email
    });

    // Update the user to have id: 4
    console.log('\n🔧 Updating user to have id: 4...');
    await User.updateOne(
      { email: 'supervisor@gmail.com' },
      { id: 4 }
    );

    // Find the "Supervisor Gmail" employee
    const supervisorEmployee = await Employee.findOne({ 
      fullName: "Supervisor Gmail" 
    });
    
    if (supervisorEmployee) {
      console.log('\n👷 Current supervisor employee:', {
        id: supervisorEmployee.id,
        name: supervisorEmployee.fullName,
        userId: supervisorEmployee.userId,
        idType: typeof supervisorEmployee.id
      });

      // Update the employee to have id: 4 and userId: 4
      console.log('\n🔧 Updating employee to have id: 4 and userId: 4...');
      await Employee.updateOne(
        { _id: supervisorEmployee._id },
        { 
          id: 4,
          userId: 4
        }
      );
      
      console.log('✅ Successfully updated supervisor employee');
    }

    // Verify the changes
    const updatedUser = await User.findOne({ email: 'supervisor@gmail.com' });
    const updatedEmployee = await Employee.findOne({ userId: 4 });
    
    console.log('\n✅ Verification:');
    console.log('User:', {
      id: updatedUser.id,
      email: updatedUser.email,
      idType: typeof updatedUser.id
    });
    
    if (updatedEmployee) {
      console.log('Employee:', {
        id: updatedEmployee.id,
        name: updatedEmployee.fullName,
        userId: updatedEmployee.userId,
        idType: typeof updatedEmployee.id
      });
    } else {
      console.log('❌ Employee not found with userId: 4');
    }

    await mongoose.disconnect();
    console.log('\n✅ Fix complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

fixSupervisorIds();