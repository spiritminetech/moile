import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';

dotenv.config();

async function addEmail() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if Employee schema has email field
    const schema = Employee.schema.obj;
    console.log('\n📋 Employee schema fields:', Object.keys(schema));

    // Try to update using the employees collection directly
    console.log('\n📝 Adding email to supervisor ID 4...');
    
    const employeesCollection = mongoose.connection.db.collection('employees');
    const result = await employeesCollection.updateOne(
      { id: 4 },
      { $set: { email: 'kawaja@construction.com' } }
    );

    console.log(`✅ Modified ${result.modifiedCount} document(s)`);

    // Verify
    const supervisor = await employeesCollection.findOne({ id: 4 });
    console.log('\n✅ Verification:');
    console.log(`  Name: ${supervisor.fullName}`);
    console.log(`  Email: ${supervisor.email || 'NOT SET'}`);
    console.log(`  Phone: ${supervisor.phone}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

addEmail();
