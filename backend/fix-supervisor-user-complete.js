import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function fixSupervisorUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // 1. Fix the user password
    console.log('=== FIXING USER PASSWORD ===\n');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const userUpdate = await db.collection('users').updateOne(
      { email: 'supervisor@gmail.com' },
      { 
        $set: { 
          password: hashedPassword,
          role: 'supervisor'
        } 
      }
    );
    
    console.log(`✅ User password updated: ${userUpdate.modifiedCount} document(s)`);

    // 2. Create company user record if missing
    console.log('\n=== CREATING COMPANY USER RECORD ===\n');
    
    const user = await db.collection('users').findOne({ email: 'supervisor@gmail.com' });
    
    const existingCompanyUser = await db.collection('companyusers').findOne({ userId: user.id });
    
    if (!existingCompanyUser) {
      // Get the highest company user ID
      const lastCompanyUser = await db.collection('companyusers').findOne({}, { sort: { id: -1 } });
      const nextId = lastCompanyUser ? lastCompanyUser.id + 1 : 1;
      
      const companyUser = {
        id: nextId,
        userId: user.id,
        companyId: 1, // Default company
        role: 'supervisor',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('companyusers').insertOne(companyUser);
      console.log(`✅ Company user created with ID: ${nextId}`);
    } else {
      console.log('✅ Company user already exists');
      // Update role if needed
      await db.collection('companyusers').updateOne(
        { userId: user.id },
        { $set: { role: 'supervisor' } }
      );
      console.log('✅ Company user role updated to supervisor');
    }

    // 3. Verify the fixes
    console.log('\n=== VERIFICATION ===\n');
    
    const updatedUser = await db.collection('users').findOne({ email: 'supervisor@gmail.com' });
    console.log('User:');
    console.log(`  Email: ${updatedUser.email}`);
    console.log(`  Password: ${updatedUser.password ? 'SET ✅' : 'MISSING ❌'}`);
    console.log(`  Role: ${updatedUser.role || 'NOT SET'}`);
    
    const companyUser = await db.collection('companyusers').findOne({ userId: updatedUser.id });
    console.log('\nCompany User:');
    console.log(`  Exists: ${companyUser ? 'YES ✅' : 'NO ❌'}`);
    if (companyUser) {
      console.log(`  Role: ${companyUser.role}`);
      console.log(`  Company ID: ${companyUser.companyId}`);
    }
    
    const supervisor = await db.collection('supervisors').findOne({ userId: updatedUser.id });
    console.log('\nSupervisor:');
    console.log(`  Exists: ${supervisor ? 'YES ✅' : 'NO ❌'}`);
    if (supervisor) {
      console.log(`  Supervisor ID: ${supervisor.id}`);
    }

    console.log('\n✅ All fixes applied successfully!');
    console.log('\nYou can now login with:');
    console.log('  Email: supervisor@gmail.com');
    console.log('  Password: password123');
    console.log('\nTest the API:');
    console.log('  POST http://192.168.1.8:5002/api/auth/login');
    console.log('  GET http://192.168.1.8:5002/api/supervisor/active-tasks/1');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

fixSupervisorUser();
