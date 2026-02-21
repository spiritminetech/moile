import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function checkUserCompany() {
  try {
    console.log('🔍 Checking user and company data...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    // Check the user with userId 2
    console.log('👤 Looking for user with ID 2 or email worker@gmail.com...\n');
    
    const userById = await db.collection('users').findOne({ id: 2 });
    const userByEmail = await db.collection('users').findOne({ email: 'worker@gmail.com' });
    
    if (userById) {
      console.log('✅ Found user by ID 2:');
      console.log(`   _id: ${userById._id}`);
      console.log(`   id: ${userById.id}`);
      console.log(`   email: ${userById.email}`);
      console.log(`   role: ${userById.role}`);
      console.log(`   companyId: ${userById.companyId}`);
      console.log(`   employeeId: ${userById.employeeId}`);
    }
    
    if (userByEmail) {
      console.log('\n✅ Found user by email worker@gmail.com:');
      console.log(`   _id: ${userByEmail._id}`);
      console.log(`   id: ${userByEmail.id}`);
      console.log(`   email: ${userByEmail.email}`);
      console.log(`   role: ${userByEmail.role}`);
      console.log(`   companyId: ${userByEmail.companyId}`);
      console.log(`   employeeId: ${userByEmail.employeeId}`);
    }
    
    if (!userById && !userByEmail) {
      console.log('❌ User not found!\n');
      console.log('📋 All users in database:');
      const allUsers = await db.collection('users').find().limit(10).toArray();
      allUsers.forEach(u => {
        console.log(`   - ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, CompanyId: ${u.companyId}`);
      });
    }
    
    // Check employee linked to this user
    const user = userById || userByEmail;
    if (user && user.employeeId) {
      console.log('\n👷 Checking linked employee...');
      const employee = await db.collection('employees').findOne({ 
        $or: [
          { _id: new mongoose.Types.ObjectId(user.employeeId) },
          { id: user.employeeId }
        ]
      });
      
      if (employee) {
        console.log('✅ Found employee:');
        console.log(`   _id: ${employee._id}`);
        console.log(`   id: ${employee.id}`);
        console.log(`   name: ${employee.name}`);
        console.log(`   email: ${employee.email}`);
        console.log(`   companyId: ${employee.companyId}`);
      } else {
        console.log('❌ Employee not found!');
      }
    }
    
    // Check companies
    console.log('\n🏢 Companies in database:');
    const companies = await db.collection('companies').find().toArray();
    if (companies.length > 0) {
      companies.forEach(c => {
        console.log(`   - ID: ${c.id}, Name: ${c.name}, _id: ${c._id}`);
      });
    } else {
      console.log('   ❌ No companies found!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
    process.exit(0);
  }
}

checkUserCompany();
