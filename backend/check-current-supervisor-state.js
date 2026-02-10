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

async function checkCurrentSupervisorState() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check the supervisor@gmail.com user
    const user = await User.findOne({ email: 'supervisor@gmail.com' });
    console.log('👤 Supervisor user:', {
      _id: user._id,
      id: user.id,
      email: user.email,
      idType: typeof user.id
    });

    // Check employee with userId: 4
    const employee4 = await Employee.findOne({ userId: 4 });
    if (employee4) {
      console.log('\n👷 Employee with userId: 4:', {
        _id: employee4._id,
        id: employee4.id,
        name: employee4.fullName,
        userId: employee4.userId,
        idType: typeof employee4.id
      });
    }

    // Check if there's an employee with id: 4
    const employeeId4 = await Employee.findOne({ id: 4 });
    if (employeeId4) {
      console.log('\n👷 Employee with id: 4:', {
        _id: employeeId4._id,
        id: employeeId4.id,
        name: employeeId4.fullName,
        userId: employeeId4.userId,
        idType: typeof employeeId4.id
      });
    } else {
      console.log('\n❌ No employee found with id: 4');
    }

    // Check the "Supervisor Gmail" employee
    const supervisorGmail = await Employee.findOne({ fullName: "Supervisor Gmail" });
    if (supervisorGmail) {
      console.log('\n👷 "Supervisor Gmail" employee:', {
        _id: supervisorGmail._id,
        id: supervisorGmail.id,
        name: supervisorGmail.fullName,
        userId: supervisorGmail.userId,
        idType: typeof supervisorGmail.id
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Check complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

checkCurrentSupervisorState();