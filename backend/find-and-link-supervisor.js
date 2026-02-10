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

async function findAndLinkSupervisor() {
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

    // Look for the "Supervisor Gmail" employee
    const supervisorGmailEmployee = await Employee.findOne({ 
      fullName: "Supervisor Gmail" 
    });
    
    if (supervisorGmailEmployee) {
      console.log('\n👷 Found "Supervisor Gmail" employee:', {
        id: supervisorGmailEmployee.id,
        name: supervisorGmailEmployee.fullName,
        userId: supervisorGmailEmployee.userId,
        idType: typeof supervisorGmailEmployee.id
      });

      // Update the employee to link to the supervisor user
      console.log('\n🔧 Linking supervisor user to "Supervisor Gmail" employee...');
      await Employee.updateOne(
        { _id: supervisorGmailEmployee._id },
        { userId: user.id }
      );
      
      console.log('✅ Successfully linked supervisor user to employee');
    } else {
      console.log('\n❌ "Supervisor Gmail" employee not found');
      
      // Look for any employee with supervisor in the name
      const anySupEmployee = await Employee.findOne({
        fullName: { $regex: 'supervisor', $options: 'i' }
      });
      
      if (anySupEmployee) {
        console.log('\n👷 Found alternative supervisor employee:', {
          id: anySupEmployee.id,
          name: anySupEmployee.fullName,
          userId: anySupEmployee.userId,
          idType: typeof anySupEmployee.id
        });

        // Link this employee instead
        console.log('\n🔧 Linking supervisor user to alternative employee...');
        await Employee.updateOne(
          { _id: anySupEmployee._id },
          { userId: user.id }
        );
        
        console.log('✅ Successfully linked supervisor user to alternative employee');
      }
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
    console.log('\n✅ Complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

findAndLinkSupervisor();