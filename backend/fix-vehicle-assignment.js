// Fix Vehicle Assignment Issues
// Run this script to update fleetVehicles and fleetTasks collections

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FleetVehicle from './src/modules/fleetTask/submodules/fleetvehicle/FleetVehicle.js';
import FleetTask from './src/modules/fleetTask/models/FleetTask.js';
import Driver from './src/modules/driver/Driver.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function fixVehicleAssignment() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Issue 1: Fix fleetVehicles - Add assignedDriverId
    console.log('\n📝 Issue 1: Fixing fleetVehicles collection...');
    
    const vehicle = await FleetVehicle.findOne({ id: 1 });
    
    if (vehicle) {
      console.log('Found vehicle:', {
        id: vehicle.id,
        registrationNo: vehicle.registrationNo,
        currentAssignedDriverId: vehicle.assignedDriverId
      });

      // Get driver info
      const driver = await Driver.findOne({ id: 50 });
      
      if (driver) {
        console.log('Found driver:', {
          id: driver.id,
          employeeName: driver.employeeName,
          vehicleId: driver.vehicleId
        });

        // Update vehicle with driver assignment
        vehicle.assignedDriverId = 50;
        vehicle.assignedDriverName = driver.employeeName;
        vehicle.status = 'IN_SERVICE';  // Update status since it's assigned
        vehicle.updatedAt = new Date();
        
        await vehicle.save();
        
        console.log('✅ Updated vehicle with driver assignment:', {
          vehicleId: vehicle.id,
          assignedDriverId: vehicle.assignedDriverId,
          assignedDriverName: vehicle.assignedDriverName,
          status: vehicle.status
        });
      } else {
        console.log('⚠️ Driver with id 50 not found');
      }
    } else {
      console.log('⚠️ Vehicle with id 1 not found');
    }

    // Issue 2: Fix fleetTasks - Reset status to PLANNED
    console.log('\n📝 Issue 2: Fixing fleetTasks collection...');
    
    const task = await FleetTask.findOne({ id: 10003 });
    
    if (task) {
      console.log('Found task:', {
        id: task.id,
        currentStatus: task.status,
        actualStartTime: task.actualStartTime,
        driverId: task.driverId,
        vehicleId: task.vehicleId
      });

      // Check if task should be reset
      if (task.status === 'ONGOING' && task.actualStartTime) {
        console.log('\n⚠️ Task is already started. Do you want to reset it?');
        console.log('Options:');
        console.log('1. Keep as ONGOING (already started)');
        console.log('2. Reset to PLANNED (for testing)');
        console.log('\nTo reset, run: node fix-vehicle-assignment.js --reset-task');
        
        if (process.argv.includes('--reset-task')) {
          task.status = 'PLANNED';
          task.actualStartTime = null;
          task.notes = '';
          task.updatedAt = new Date();
          
          await task.save();
          
          console.log('✅ Reset task to PLANNED status:', {
            taskId: task.id,
            status: task.status,
            actualStartTime: task.actualStartTime
          });
        }
      } else if (task.status === 'PLANNED') {
        console.log('✅ Task is already in PLANNED status - ready to start');
      }
    } else {
      console.log('⚠️ Task with id 10003 not found');
    }

    // Issue 3: Add missing fields to fleetVehicles
    console.log('\n📝 Issue 3: Adding missing fields to fleetVehicles...');
    
    if (vehicle) {
      // Add missing fields if they don't exist
      const updates = {};
      
      if (!vehicle.fuelType) {
        updates.fuelType = 'Diesel';
      }
      
      if (!vehicle.year) {
        updates.year = 2023;
      }
      
      if (!vehicle.insurancePolicyNumber) {
        updates.insurancePolicyNumber = 'INS-' + vehicle.registrationNo;
      }
      
      if (!vehicle.assignedRoute) {
        updates.assignedRoute = {
          routeName: 'Construction Site to Dormitory',
          routeCode: 'RT-001',
          pickupLocations: ['Construction Site'],
          dropoffLocation: 'Worker Dormitory - Block A',
          estimatedDistance: 15,
          estimatedDuration: 60
        };
      }

      if (Object.keys(updates).length > 0) {
        await FleetVehicle.updateOne(
          { id: 1 },
          { $set: updates }
        );
        
        console.log('✅ Added missing fields to vehicle:', updates);
      } else {
        console.log('✅ All fields already present');
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    
    const updatedVehicle = await FleetVehicle.findOne({ id: 1 });
    const updatedTask = await FleetTask.findOne({ id: 10003 });
    
    console.log('\n🚗 Vehicle (id: 1):');
    console.log('  Registration:', updatedVehicle?.registrationNo);
    console.log('  Assigned Driver ID:', updatedVehicle?.assignedDriverId || '❌ NOT SET');
    console.log('  Assigned Driver Name:', updatedVehicle?.assignedDriverName || '❌ NOT SET');
    console.log('  Status:', updatedVehicle?.status);
    console.log('  Fuel Type:', updatedVehicle?.fuelType || '❌ NOT SET');
    console.log('  Year:', updatedVehicle?.year || '❌ NOT SET');
    
    console.log('\n📋 Task (id: 10003):');
    console.log('  Status:', updatedTask?.status);
    console.log('  Driver ID:', updatedTask?.driverId);
    console.log('  Vehicle ID:', updatedTask?.vehicleId);
    console.log('  Actual Start Time:', updatedTask?.actualStartTime || 'Not started');
    console.log('  Can Start Route:', updatedTask?.status === 'PLANNED' ? '✅ YES' : '❌ NO (already started)');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Fix completed!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the fix
fixVehicleAssignment();
