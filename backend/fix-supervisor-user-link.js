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

async function fixSupervisorUserLink() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the supervisor@gmail.com user
    const user = await User.findOne({ email: 'supervisor@gmail.com' });
    console.log('👤 Supervisor user:', {
      id: user.id,
      email: user.email,
      name: user.name
    });

    // Get the "Supervisor Gmail" employee (the problematic one)
    const problematicEmployee = await Employee.findOne({ 
      id: "6988a902414b8c4f1158468b" 
    });
    
    if (problematicEmployee) {
      console.log('\n🚨 Found problematic employee:', {
        id: problematicEmployee.id,
        name: problematicEmployee.fullName,
        userId: problematicEmployee.userId,
        idType: typeof problematicEmployee.id
      });

      // Update the employee to link to the supervisor user
      console.log('\n🔧 Linking supervisor user to employee...');
      await Employee.updateOne(
        { id: "6988a902414b8c4f1158468b" },
        { userId: user.id }
      );
      
      console.log('✅ Successfully linked supervisor user to employee');
    }

    // Verify the link
    const linkedEmployee = await Employee.findOne({ userId: user.id });
    if (linkedEmployee) {
      console.log('\n✅ Verification - Employee linked to supervisor user:', {
        id: linkedEmployee.id,
        name: linkedEmployee.fullName,
        userId: linkedEmployee.userId,
        idType: typeof linkedEmployee.id
      });
    } else {
      console.log('\n❌ Verification failed - No employee linked to supervisor user');
    }

    await mongoose.disconnect();
    console.log('\n✅ Fix complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

fixSupervisorUserLink();