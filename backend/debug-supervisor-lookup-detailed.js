import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function debugSupervisorLookup() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Check the assignments for employee 2
    console.log('\n📋 Step 1: Check assignments for employee 2');
    const assignments = await WorkerTaskAssignment.find({ 
      employeeId: 2,
      date: { $gte: new Date('2026-02-14T00:00:00.000Z'), $lte: new Date('2026-02-14T23:59:59.999Z') }
    }).lean();
    
    console.log(`Found ${assignments.length} assignments`);
    assignments.forEach(a => {
      console.log(`  - Assignment ${a.id}: supervisorId = ${a.supervisorId} (type: ${typeof a.supervisorId})`);
    });

    if (assignments.length === 0) {
      console.log('❌ No assignments found for today');
      await mongoose.disconnect();
      return;
    }

    const supervisorId = assignments[0].supervisorId;
    console.log(`\n🔍 Step 2: Looking up supervisor with ID: ${supervisorId} (type: ${typeof supervisorId})`);

    // 2. Try different query methods
    console.log('\n📊 Step 3: Try different query methods');
    
    // Method 1: Direct query with number
    console.log('\nMethod 1: Employee.findOne({ id: supervisorId })');
    const supervisor1 = await Employee.findOne({ id: supervisorId });
    console.log('Result:', supervisor1 ? `Found: ${supervisor1.fullName}` : 'NOT FOUND');

    // Method 2: Direct query with explicit number conversion
    console.log('\nMethod 2: Employee.findOne({ id: Number(supervisorId) })');
    const supervisor2 = await Employee.findOne({ id: Number(supervisorId) });
    console.log('Result:', supervisor2 ? `Found: ${supervisor2.fullName}` : 'NOT FOUND');

    // Method 3: Check all employees with id 4
    console.log('\nMethod 3: Find all employees with id 4');
    const allSupervisors = await Employee.find({ id: 4 }).lean();
    console.log(`Found ${allSupervisors.length} employees with id 4`);
    allSupervisors.forEach(s => {
      console.log(`  - ${s.fullName}, id: ${s.id} (type: ${typeof s.id}), status: ${s.status}`);
    });

    // Method 4: Check the employees collection directly
    console.log('\nMethod 4: Query employees collection directly');
    const employeesCollection = mongoose.connection.db.collection('employees');
    const directQuery = await employeesCollection.findOne({ id: 4 });
    console.log('Direct query result:', directQuery ? `Found: ${directQuery.fullName}` : 'NOT FOUND');
    if (directQuery) {
      console.log('  Full document:', JSON.stringify(directQuery, null, 2));
    }

    // Method 5: Check if there are any employees at all
    console.log('\nMethod 5: Count all employees');
    const employeeCount = await Employee.countDocuments();
    console.log(`Total employees in database: ${employeeCount}`);

    // Method 6: List all employees with their IDs
    console.log('\nMethod 6: List first 10 employees');
    const allEmployees = await Employee.find().limit(10).lean();
    allEmployees.forEach(e => {
      console.log(`  - ID: ${e.id} (${typeof e.id}), Name: ${e.fullName}, Status: ${e.status}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

debugSupervisorLookup();
