// Script to check the actual passenger collection schema in database
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkPassengerSchema() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    
    console.log('✅ Connected to MongoDB\n');

    // Get the database
    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📚 Available collections:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Find passenger-related collections
    const passengerCollections = collections.filter(col => 
      col.name.toLowerCase().includes('passenger')
    );
    
    console.log('\n🎯 Passenger-related collections:');
    passengerCollections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Check each passenger collection
    for (const col of passengerCollections) {
      console.log(`\n\n📋 Collection: ${col.name}`);
      console.log('─'.repeat(60));
      
      const collection = db.collection(col.name);
      const count = await collection.countDocuments();
      console.log(`Total documents: ${count}`);
      
      if (count > 0) {
        // Get a sample document to see the schema
        const sample = await collection.findOne();
        console.log('\n📄 Sample document structure:');
        console.log(JSON.stringify(sample, null, 2));
        
        // Get all unique field names
        const allDocs = await collection.find().limit(10).toArray();
        const allFields = new Set();
        allDocs.forEach(doc => {
          Object.keys(doc).forEach(key => allFields.add(key));
        });
        
        console.log('\n🔑 All fields found in collection:');
        Array.from(allFields).sort().forEach(field => {
          console.log(`   - ${field}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n\n🔌 Disconnected from MongoDB');
  }
}

checkPassengerSchema();
