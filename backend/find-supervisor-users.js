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

async function findSupervisorUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find users with supervisor role
    const supervisorUsers = await User.find({
      role: 'SUPERVISOR'
    }).limit(10);

    console.log(`📊 Found ${supervisorUsers.length} supervisor users:`);
    supervisorUsers.forEach((user, idx) => {
      console.log(`\n${idx + 1}. Supervisor User:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Company: ${user.companyId}`);
    });

    // Also check for any users with 'supervisor' in email
    const supervisorEmailUsers = await User.find({
      email: { $regex: 'supervisor', $options: 'i' }
    }).limit(10);

    console.log(`\n📧 Found ${supervisorEmailUsers.length} users with 'supervisor' in email:`);
    supervisorEmailUsers.forEach((user, idx) => {
      console.log(`\n${idx + 1}. User:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Company: ${user.companyId}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Analysis complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

findSupervisorUsers();