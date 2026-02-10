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

async function fixSupervisorLinkFinal() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the supervisor user
    const user = await User.findOne({ email: 'supervisor@gmail.com' });
    console.log('👤 Supervisor user:', {
      id: user.id,
      email: user.email
    });

    // Update Kawaja employee to have userId matching the user's id
    console.log('🔧 Updating Kawaja employee userId to match supervisor user id...');
    const updateResult = await Employee.updateOne(
      { fullName: 'Kawaja' },
      { $set: { userId: user.id } }
    );
    
    console.log('Update result:', updateResult);

    // Verify the link
    const linkedEmployee = await Employee.findOne({ userId: user.id });
    
    if (linkedEmployee) {
      console.log('\n✅ Successfully linked!');
      console.log('Employee:', {
        id: linkedEmployee.id,
        name: linkedEmployee.fullName,
        userId: linkedEmployee.userId,
        idType: typeof linkedEmployee.id
      });
      
      console.log(`\nMatch: user.id (${user.id}) === employee.userId (${linkedEmployee.userId}): ${user.id === linkedEmployee.userId ? 'YES' : 'NO'}`);
    } else {
      console.log('\n❌ Link failed - no employee found with matching userId');
    }

    await mongoose.disconnect();
    console.log('\n✅ Fix complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

fixSupervisorLinkFinal();