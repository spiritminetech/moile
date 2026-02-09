import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';

dotenv.config();

async function fixSupervisorStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find employees with lowercase 'active' status
    const employeesWithLowercaseStatus = await Employee.find({ status: 'active' });
    console.log(`\n📊 Found ${employeesWithLowercaseStatus.length} employee(s) with lowercase 'active' status`);

    if (employeesWithLowercaseStatus.length > 0) {
      // Update all to uppercase 'ACTIVE'
      const result = await Employee.updateMany(
        { status: 'active' },
        { $set: { status: 'ACTIVE' } }
      );

      console.log(`✅ Updated ${result.modifiedCount} employee(s) to ACTIVE status`);

      // Verify the update
      for (const emp of employeesWithLowercaseStatus) {
        const updated = await Employee.findOne({ id: emp.id });
        console.log(`   - ${updated.fullName} (id: ${updated.id}): ${updated.status}`);
      }
    } else {
      console.log('✅ All employees already have correct status format');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixSupervisorStatus();
