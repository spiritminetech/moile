import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// Define schemas without strict validation to see actual data
const EmployeeSchema = new mongoose.Schema({}, { strict: false, collection: 'employees' });
const Employee = mongoose.model('Employee', EmployeeSchema);

async function checkKawajaCurrentState() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check Kawaja employee
    const kawaja = await Employee.findOne({ fullName: 'Kawaja' });
    if (kawaja) {
      console.log('👷 Kawaja employee current state:', {
        _id: kawaja._id,
        id: kawaja.id,
        name: kawaja.fullName,
        userId: kawaja.userId,
        idType: typeof kawaja.id,
        userIdType: typeof kawaja.userId
      });
    }

    // Try to find employee with userId: 4 (number)
    const emp4Number = await Employee.findOne({ userId: 4 });
    console.log('\n🔍 Employee with userId: 4 (number):', emp4Number ? 'FOUND' : 'NOT FOUND');
    if (emp4Number) {
      console.log('   Name:', emp4Number.fullName);
      console.log('   ID:', emp4Number.id);
      console.log('   UserId:', emp4Number.userId, '(type:', typeof emp4Number.userId, ')');
    }

    // Try to find employee with userId: "4" (string)
    const emp4String = await Employee.findOne({ userId: "4" });
    console.log('\n🔍 Employee with userId: "4" (string):', emp4String ? 'FOUND' : 'NOT FOUND');
    if (emp4String) {
      console.log('   Name:', emp4String.fullName);
      console.log('   ID:', emp4String.id);
      console.log('   UserId:', emp4String.userId, '(type:', typeof emp4String.userId, ')');
    }

    await mongoose.disconnect();
    console.log('\n✅ Check complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

checkKawajaCurrentState();