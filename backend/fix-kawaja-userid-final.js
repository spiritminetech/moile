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

async function fixKawajaUserIdFinal() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Update Kawaja employee to have userId: 4 (number)
    console.log('🔧 Updating Kawaja employee to have userId: 4...');
    const updateResult = await Employee.updateOne(
      { fullName: 'Kawaja' },
      { $set: { userId: 4 } }
    );
    
    console.log('Update result:', updateResult);

    // Verify the update
    const updatedKawaja = await Employee.findOne({ fullName: 'Kawaja' });
    if (updatedKawaja) {
      console.log('\n✅ Updated Kawaja employee:', {
        id: updatedKawaja.id,
        name: updatedKawaja.fullName,
        userId: updatedKawaja.userId,
        userIdType: typeof updatedKawaja.userId
      });
    }

    // Test the lookup that the API will do
    const foundEmployee = await Employee.findOne({ userId: 4 });
    if (foundEmployee) {
      console.log('\n✅ API lookup test - Employee found with userId: 4:', {
        id: foundEmployee.id,
        name: foundEmployee.fullName,
        userId: foundEmployee.userId
      });
    } else {
      console.log('\n❌ API lookup test - No employee found with userId: 4');
    }

    await mongoose.disconnect();
    console.log('\n✅ Fix complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

fixKawajaUserIdFinal();