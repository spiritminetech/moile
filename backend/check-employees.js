import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function checkEmployees() {
  try {
    console.log('🔍 Connecting to MongoDB...\n');
    console.log(`URI: ${process.env.MONGODB_URI.replace(/:[^:@]+@/, ':***@')}`);
    console.log(`Database: ${process.env.DB_NAME}\n`);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected successfully!\n');
    
    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections in database:\n`);
    
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`   ${collection.name}: ${count} documents`);
    }
    
    // Check employees specifically
    const employeeCount = await db.collection('employees').countDocuments();
    console.log(`\n👥 Employees collection: ${employeeCount} documents`);
    
    if (employeeCount > 0) {
      console.log('\n📄 Sample employees:');
      const samples = await db.collection('employees').find().limit(3).toArray();
      samples.forEach((emp, idx) => {
        console.log(`   ${idx + 1}. ID: ${emp._id}`);
        console.log(`      Name: ${emp.name || 'N/A'}`);
        console.log(`      Email: ${emp.email || 'N/A'}`);
        console.log(`      Role: ${emp.role || 'N/A'}`);
      });
    }
    
    console.log('\n✅ Check complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
    process.exit(0);
  }
}

checkEmployees();
