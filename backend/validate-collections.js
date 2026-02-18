import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI;

// Official collection names from models
const OFFICIAL_COLLECTIONS = {
  // Worker Task Management
  'workerTaskAssignment': 'WorkerTaskAssignment model',
  'tasks': 'Task model',
  'workertaskprogresses': 'WorkerTaskProgress model',
  
  // Fleet/Driver Management
  'fleetTasks': 'FleetTask model',
  'fleettaskpassengers': 'FleetTaskPassenger model',
  'transporttasks': 'TransportTask model',
  
  // Attendance & Employee
  'attendances': 'Attendance model',
  'employees': 'Employee model',
  'users': 'User model',
  
  // Projects & Companies
  'projects': 'Project model',
  'companies': 'Company model',
  
  // Requests & Approvals
  'leaverequests': 'LeaveRequest model',
  'materialrequests': 'MaterialRequest model',
  'toolrequests': 'ToolRequest model',
  
  // Notifications
  'notifications': 'Notification model',
  'notificationaudits': 'NotificationAudit model',
  
  // Other
  'locationlogs': 'LocationLog model',
  'vehicles': 'Vehicle model',
  'tools': 'Tool model',
  'materials': 'Material model',
};

// Known deprecated/backup collections (should be ignored)
const BACKUP_PATTERN = /_backup_\d+$/;

async function validateCollections() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const allCollections = await db.listCollections().toArray();
    
    console.log('📊 Database Collection Validation Report');
    console.log('='.repeat(60) + '\n');

    // Check for unauthorized collections
    const unauthorizedCollections = [];
    const emptyCollections = [];
    const validCollections = [];

    for (const col of allCollections) {
      const name = col.name;
      
      // Skip system collections
      if (name.startsWith('system.')) continue;
      
      // Skip backup collections
      if (BACKUP_PATTERN.test(name)) continue;
      
      const count = await db.collection(name).countDocuments();
      
      if (OFFICIAL_COLLECTIONS[name]) {
        validCollections.push({ name, count, purpose: OFFICIAL_COLLECTIONS[name] });
      } else {
        if (count === 0) {
          emptyCollections.push(name);
        } else {
          unauthorizedCollections.push({ name, count });
        }
      }
    }

    // Report valid collections
    console.log('✅ Valid Collections:\n');
    validCollections.sort((a, b) => a.name.localeCompare(b.name));
    for (const col of validCollections) {
      console.log(`   ${col.name.padEnd(30)} ${String(col.count).padStart(6)} docs  (${col.purpose})`);
    }

    // Report unauthorized collections
    if (unauthorizedCollections.length > 0) {
      console.log('\n⚠️  Unauthorized Collections (not in official list):\n');
      for (const col of unauthorizedCollections) {
        console.log(`   ${col.name.padEnd(30)} ${String(col.count).padStart(6)} docs  ⚠️  REVIEW NEEDED`);
      }
    }

    // Report empty collections
    if (emptyCollections.length > 0) {
      console.log('\n🗑️  Empty Collections (can be removed):\n');
      for (const name of emptyCollections) {
        console.log(`   ${name.padEnd(30)}      0 docs  💡 Safe to drop`);
      }
    }

    // Check for common naming issues
    console.log('\n🔍 Checking for Common Issues:\n');
    
    const issues = [];
    
    // Check for plural/singular confusion
    const taskCollections = allCollections.filter(c => 
      c.name.toLowerCase().includes('task') && !BACKUP_PATTERN.test(c.name)
    );
    
    if (taskCollections.some(c => c.name === 'workertaskassignments')) {
      issues.push('❌ Found "workertaskassignments" (plural) - should use "workerTaskAssignment" (singular)');
    }
    
    if (taskCollections.some(c => c.name === 'workerTaskProgress')) {
      issues.push('❌ Found "workerTaskProgress" (singular) - should use "workertaskprogresses" (plural)');
    }

    // Check for documents with null IDs
    for (const colName of Object.keys(OFFICIAL_COLLECTIONS)) {
      if (allCollections.some(c => c.name === colName)) {
        const nullCount = await db.collection(colName).countDocuments({
          $or: [{ id: null }, { id: { $exists: false } }]
        });
        
        if (nullCount > 0) {
          issues.push(`⚠️  Collection "${colName}" has ${nullCount} documents with null/missing id field`);
        }
      }
    }

    if (issues.length > 0) {
      issues.forEach(issue => console.log(`   ${issue}`));
    } else {
      console.log('   ✅ No issues found!');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 Summary:\n');
    console.log(`   Valid Collections:        ${validCollections.length}`);
    console.log(`   Unauthorized Collections: ${unauthorizedCollections.length}`);
    console.log(`   Empty Collections:        ${emptyCollections.length}`);
    console.log(`   Issues Found:             ${issues.length}`);

    if (unauthorizedCollections.length > 0 || issues.length > 0) {
      console.log('\n💡 Recommendation: Run cleanup script to fix issues');
      console.log('   node backend/cleanup-unused-collections.js');
    } else {
      console.log('\n✅ Database collections are properly configured!');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

validateCollections();
