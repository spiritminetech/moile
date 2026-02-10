import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));

async function debugEmployeeId() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check last employee
    const lastEmployee = await Employee.findOne().sort({ id: -1 });
    console.log('Last employee:', lastEmployee);
    console.log('Last employee ID:', lastEmployee?.id);

    // Check all employees with null id
    const nullIdEmployees = await Employee.find({ id: null });
    console.log('\nEmployees with null id:', nullIdEmployees.length);

    // Get max id
    const maxId = await Employee.findOne({ id: { $ne: null } }).sort({ id: -1 });
    console.log('\nMax ID employee:', maxId?.id);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

debugEmployeeId();
