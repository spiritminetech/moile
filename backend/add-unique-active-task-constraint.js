// Add database constraint to prevent multiple active tasks
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function addUniqueActiveTaskConstraint() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('workertaskassignments');

    console.log('🔍 Checking existing indexes...\n');
    
    // List existing indexes
    const existingIndexes = await collection.indexes();
    console.log('Existing indexes:');
    existingIndexes.forEach(index => {
      console.log(`  - ${index.name}`);
    });
    console.log('');

    // Check if our index already exists
    const indexExists = existingIndexes.some(idx => 
      idx.name === 'unique_active_task_per_employee'
    );

    if (indexExists) {
      console.log('✅ Index "unique_active_task_per_employee" already exists!');
      console.log('   No action needed.');
      return;
    }

    console.log('📝 Creating unique partial index...\n');
    console.log('Index Configuration:');
    console.log('  Name: unique_active_task_per_employee');
    console.log('  Fields: { employeeId: 1, status: 1 }');
    console.log('  Unique: true');
    console.log('  Partial Filter: { status: "in_progress" }');
    console.log('');
    console.log('This ensures only ONE task per employee can have status="in_progress"');
    console.log('');

    // Create the unique partial index
    await collection.createIndex(
      { employeeId: 1, status: 1 },
      {
        unique: true,
        partialFilterExpression: { status: 'in_progress' },
        name: 'unique_active_task_per_employee'
      }
    );

    console.log('✅ Index created successfully!\n');

    // Verify the index was created
    const updatedIndexes = await collection.indexes();
    const newIndex = updatedIndexes.find(idx => 
      idx.name === 'unique_active_task_per_employee'
    );

    if (newIndex) {
      console.log('✅ VERIFICATION SUCCESSFUL');
      console.log('='.repeat(80));
      console.log('Index Details:');
      console.log(JSON.stringify(newIndex, null, 2));
      console.log('='.repeat(80));
      console.log('');
      console.log('🎉 DATABASE CONSTRAINT ACTIVE!');
      console.log('');
      console.log('From now on, MongoDB will automatically reject any attempt to:');
      console.log('  - Start a second task while one is already "in_progress"');
      console.log('  - Manually set multiple tasks to "in_progress" status');
      console.log('');
      console.log('This provides database-level protection against the bug.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    
    if (error.code === 11000) {
      console.log('');
      console.log('⚠️ DUPLICATE KEY ERROR');
      console.log('This means you currently have multiple tasks with "in_progress" status.');
      console.log('');
      console.log('FIX REQUIRED:');
      console.log('  1. Run: node backend/fix-multiple-active-tasks.js');
      console.log('  2. Then run this script again');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB\n');
  }
}

addUniqueActiveTaskConstraint();
