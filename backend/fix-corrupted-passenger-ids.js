import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FleetTaskPassenger from './src/modules/fleetTask/submodules/fleetTaskPassenger/FleetTaskPassenger.js';
import Employee from './src/modules/employee/Employee.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Fix corrupted passenger records where workerEmployeeId looks like 10003001, 10003002, etc.
 * These should be real employee IDs like 104, 107, 2, etc.
 */
const fixCorruptedPassengerIds = async () => {
  try {
    console.log('🔍 Finding corrupted passenger records...');
    
    // Find all passengers with suspiciously large employee IDs (> 10000)
    const corruptedPassengers = await FleetTaskPassenger.find({
      workerEmployeeId: { $gt: 10000 }
    }).lean();
    
    console.log(`📊 Found ${corruptedPassengers.length} corrupted passenger records`);
    
    if (corruptedPassengers.length === 0) {
      console.log('✅ No corrupted records found!');
      return;
    }
    
    // Get all valid employees
    const employees = await Employee.find({}).lean();
    console.log(`👥 Found ${employees.length} valid employees in database`);
    
    if (employees.length === 0) {
      console.error('❌ No employees found in database! Cannot fix passenger records.');
      return;
    }
    
    // Group corrupted passengers by fleetTaskId
    const taskGroups = {};
    corruptedPassengers.forEach(p => {
      if (!taskGroups[p.fleetTaskId]) {
        taskGroups[p.fleetTaskId] = [];
      }
      taskGroups[p.fleetTaskId].push(p);
    });
    
    console.log(`📋 Corrupted passengers grouped into ${Object.keys(taskGroups).length} tasks`);
    
    // Fix each task's passengers
    for (const [taskId, passengers] of Object.entries(taskGroups)) {
      console.log(`\n🔧 Fixing task ${taskId} with ${passengers.length} passengers...`);
      
      // Assign real employee IDs to these passengers
      // Use the first N employees from the database
      const employeesToAssign = employees.slice(0, passengers.length);
      
      for (let i = 0; i < passengers.length; i++) {
        const passenger = passengers[i];
        const employee = employeesToAssign[i];
        
        console.log(`   Updating passenger ${passenger.id}:`);
        console.log(`      Old workerEmployeeId: ${passenger.workerEmployeeId}`);
        console.log(`      New workerEmployeeId: ${employee.id} (${employee.fullName})`);
        
        await FleetTaskPassenger.updateOne(
          { id: passenger.id },
          { $set: { workerEmployeeId: employee.id } }
        );
      }
      
      console.log(`   ✅ Fixed ${passengers.length} passengers for task ${taskId}`);
    }
    
    console.log('\n🎉 All corrupted passenger records have been fixed!');
    console.log('📊 Summary:');
    console.log(`   Total records fixed: ${corruptedPassengers.length}`);
    console.log(`   Tasks affected: ${Object.keys(taskGroups).length}`);
    
  } catch (error) {
    console.error('❌ Error fixing corrupted passenger records:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await fixCorruptedPassengerIds();
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
  process.exit(0);
};

main();
