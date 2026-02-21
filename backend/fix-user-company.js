import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function fixUserCompany() {
  try {
    console.log('🔧 Fixing user company assignment...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    // Get the user
    const user = await db.collection('users').findOne({ id: 2 });
    console.log('👤 Current user state:');
    console.log(`   Email: ${user.email}`);
    console.log(`   CompanyId: ${user.companyId || 'MISSING'}`);
    console.log(`   EmployeeId: ${user.employeeId}`);
    
    // Get the employee
    const employee = await db.collection('employees').findOne({ id: user.employeeId });
    console.log('\n👷 Linked employee:');
    console.log(`   ID: ${employee.id}`);
    console.log(`   CompanyId: ${employee.companyId}`);
    
    // Update the user with the employee's companyId
    console.log('\n🔄 Updating user with companyId from employee...');
    const result = await db.collection('users').updateOne(
      { id: 2 },
      { 
        $set: { 
          companyId: employee.companyId,
          role: 'WORKER' // Also set the role if missing
        } 
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} user record(s)`);
    
    // Verify the update
    const updatedUser = await db.collection('users').findOne({ id: 2 });
    console.log('\n✅ Updated user state:');
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   CompanyId: ${updatedUser.companyId}`);
    console.log(`   Role: ${updatedUser.role}`);
    console.log(`   EmployeeId: ${updatedUser.employeeId}`);
    
    console.log('\n🎉 User can now access the worker profile!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
    process.exit(0);
  }
}

fixUserCompany();
