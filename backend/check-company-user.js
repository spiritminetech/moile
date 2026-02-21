import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function checkCompanyUser() {
  try {
    console.log('🔍 Checking CompanyUser records...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    // Check for CompanyUser with userId 2
    console.log('👤 Looking for CompanyUser with userId 2...\n');
    
    const companyUser = await db.collection('companyUsers').findOne({ userId: 2 });
    
    if (companyUser) {
      console.log('✅ Found CompanyUser:');
      console.log(`   _id: ${companyUser._id}`);
      console.log(`   userId: ${companyUser.userId}`);
      console.log(`   companyId: ${companyUser.companyId}`);
      console.log(`   roleId: ${companyUser.roleId}`);
    } else {
      console.log('❌ CompanyUser not found for userId 2!\n');
      
      // Check what CompanyUsers exist
      console.log('📋 All CompanyUsers in database:');
      const allCompanyUsers = await db.collection('companyUsers').find().limit(10).toArray();
      
      if (allCompanyUsers.length > 0) {
        allCompanyUsers.forEach(cu => {
          console.log(`   - userId: ${cu.userId}, companyId: ${cu.companyId}, roleId: ${cu.roleId}`);
        });
      } else {
        console.log('   ❌ No CompanyUsers found in database!');
      }
      
      // Create CompanyUser for this user
      console.log('\n🔧 Creating CompanyUser record...');
      const user = await db.collection('users').findOne({ id: 2 });
      const employee = await db.collection('employees').findOne({ id: user.employeeId });
      
      const newCompanyUser = {
        userId: 2,
        companyId: employee.companyId,
        roleId: 4, // WORKER role
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await db.collection('companyUsers').insertOne(newCompanyUser);
      console.log(`✅ Created CompanyUser with _id: ${result.insertedId}`);
      console.log(`   userId: ${newCompanyUser.userId}`);
      console.log(`   companyId: ${newCompanyUser.companyId}`);
      console.log(`   roleId: ${newCompanyUser.roleId}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
    process.exit(0);
  }
}

checkCompanyUser();
