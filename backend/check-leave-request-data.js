import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// Define schemas without strict validation to see actual data
const LeaveRequestSchema = new mongoose.Schema({}, { strict: false, collection: 'leaveRequests' });
const LeaveRequest = mongoose.model('LeaveRequest', LeaveRequestSchema);

const EmployeeSchema = new mongoose.Schema({}, { strict: false, collection: 'employees' });
const Employee = mongoose.model('Employee', EmployeeSchema);

async function checkLeaveRequestData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check all leave requests
    const leaveRequests = await LeaveRequest.find({}).limit(10);
    
    console.log('📋 Leave Requests (first 10):');
    leaveRequests.forEach((req, idx) => {
      console.log(`\n${idx + 1}. Leave Request:`);
      console.log(`   _id: ${req._id}`);
      console.log(`   id: ${req.id}`);
      console.log(`   employeeId: ${req.employeeId} (type: ${typeof req.employeeId})`);
      console.log(`   status: ${req.status}`);
      console.log(`   leaveType: ${req.leaveType}`);
    });

    // Check for problematic records
    const problematicRequests = await LeaveRequest.find({
      employeeId: { $type: "string" }
    });

    console.log(`\n🚨 Found ${problematicRequests.length} leave requests with string employeeId:`);
    problematicRequests.forEach((req, idx) => {
      console.log(`\n${idx + 1}. Problematic Request:`);
      console.log(`   _id: ${req._id}`);
      console.log(`   id: ${req.id}`);
      console.log(`   employeeId: ${req.employeeId} (type: ${typeof req.employeeId})`);
      console.log(`   status: ${req.status}`);
    });

    // Check employees to understand the ID structure
    const employees = await Employee.find({}).limit(5);
    console.log('\n👷 Employee ID Structure (first 5):');
    employees.forEach((emp, idx) => {
      console.log(`\n${idx + 1}. Employee:`);
      console.log(`   _id: ${emp._id} (MongoDB ObjectId)`);
      console.log(`   id: ${emp.id} (numeric field)`);
      console.log(`   fullName: ${emp.fullName}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Analysis complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

checkLeaveRequestData();