#!/usr/bin/env node

/**
 * Fix task dependency issues - remove invalid dependencies
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

// Load environment variables
dotenv.config();

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

async function fixDependencyIssues() {
  console.log('🔍 Finding and fixing dependency issues...\n');

  try {
    // 1. Find all assignments with dependencies
    const assignmentsWithDeps = await WorkerTaskAssignment.find({
      dependencies: { $exists: true, $ne: [] }
    });

    console.log(`Found ${assignmentsWithDeps.length} assignments with dependencies`);

    if (assignmentsWithDeps.length === 0) {
      console.log('No assignments with dependencies found.');
      return;
    }

    // 2. Get all unique dependency IDs
    const allDepIds = new Set();
    assignmentsWithDeps.forEach(assignment => {
      assignment.dependencies.forEach(depId => allDepIds.add(depId));
    });

    console.log(`Total unique dependency IDs: ${allDepIds.size}`);
    console.log('Dependency IDs:', Array.from(allDepIds).sort((a, b) => a - b));

    // 3. Check which ones exist
    const existingAssignments = await WorkerTaskAssignment.find({
      id: { $in: Array.from(allDepIds) }
    });

    const existingIds = new Set(existingAssignments.map(a => a.id));
    const missingIds = Array.from(allDepIds).filter(id => !existingIds.has(id));

    console.log(`\nExisting dependency IDs: ${existingIds.size}`);
    console.log(`Missing dependency IDs: ${missingIds.length}`);
    
    if (missingIds.length > 0) {
      console.log('❌ Missing IDs:', missingIds.sort((a, b) => a - b));
      
      // Show which assignments are affected
      console.log('\nAssignments affected by missing dependencies:');
      for (const missingId of missingIds) {
        const affected = assignmentsWithDeps.filter(a => a.dependencies.includes(missingId));
        console.log(`\nMissing dependency ${missingId} affects ${affected.length} assignments:`);
        affected.forEach(assignment => {
          console.log(`  - Assignment ${assignment.id} (Employee: ${assignment.employeeId}, Project: ${assignment.projectId})`);
          console.log(`    Dependencies: [${assignment.dependencies.join(', ')}]`);
        });
      }
    }

    // 4. Fix assignments with missing dependencies
    let fixedCount = 0;
    for (const assignment of assignmentsWithDeps) {
      const validDeps = assignment.dependencies.filter(depId => existingIds.has(depId));
      
      if (validDeps.length !== assignment.dependencies.length) {
        const removedDeps = assignment.dependencies.filter(depId => !existingIds.has(depId));
        
        console.log(`\n🔧 Fixing assignment ${assignment.id}:`);
        console.log(`  Removing invalid dependencies: [${removedDeps.join(', ')}]`);
        console.log(`  Keeping valid dependencies: [${validDeps.join(', ')}]`);
        
        await WorkerTaskAssignment.updateOne(
          { _id: assignment._id },
          { $set: { dependencies: validDeps } }
        );
        
        fixedCount++;
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} assignments by removing invalid dependencies`);
    
    if (fixedCount > 0) {
      console.log('\n📱 You can now try starting tasks again - the dependency errors should be resolved!');
    }

  } catch (error) {
    console.error('❌ Error fixing dependencies:', error);
    throw error;
  }
}

async function main() {
  await connectToDatabase();
  
  try {
    await fixDependencyIssues();
    console.log('\n✅ Dependency fix completed!');
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

main().catch(console.error);