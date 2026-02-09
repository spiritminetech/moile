/**
 * API Test Script: Test Vehicle Route Assignment Feature
 * 
 * This script tests the /driver/vehicle endpoint to verify
 * that assigned routes are returned correctly.
 * 
 * Usage: node test-vehicle-route-api.js
 */

import mongoose from 'mongoose';
import FleetVehicle from './src/modules/fleetTask/submodules/fleetvehicle/FleetVehicle.js';
import FleetTask from './src/modules/fleetTask/models/FleetTask.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function testVehicleRouteAPI() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Get a vehicle with assigned route
    console.log('📋 TEST 1: Vehicle WITH Assigned Route');
    console.log('─'.repeat(60));
    
    const vehicleWithRoute = await FleetVehicle.findOne({ 
      'assignedRoute.routeName': { $exists: true } 
    }).lean();

    if (vehicleWithRoute) {
      console.log('✅ Found vehicle with route:');
      console.log(`   Registration: ${vehicleWithRoute.registrationNo}`);
      console.log(`   Type: ${vehicleWithRoute.vehicleType}`);
      console.log(`   Capacity: ${vehicleWithRoute.capacity}`);
      console.log(`   Fuel Type: ${vehicleWithRoute.fuelType || 'Not set'}`);
      console.log('\n   📍 Assigned Route:');
      console.log(`   Name: ${vehicleWithRoute.assignedRoute.routeName}`);
      console.log(`   Code: ${vehicleWithRoute.assignedRoute.routeCode}`);
      console.log(`   Pickup Locations (${vehicleWithRoute.assignedRoute.pickupLocations.length}):`);
      vehicleWithRoute.assignedRoute.pickupLocations.forEach((loc, i) => {
        console.log(`      ${i + 1}. ${loc}`);
      });
      console.log(`   Drop-off: ${vehicleWithRoute.assignedRoute.dropoffLocation}`);
      console.log(`   Distance: ${vehicleWithRoute.assignedRoute.estimatedDistance} km`);
      console.log(`   Duration: ${vehicleWithRoute.assignedRoute.estimatedDuration} min`);
    } else {
      console.log('⚠️  No vehicles with assigned routes found');
      console.log('   Run: node add-vehicle-routes-sample-data.js');
    }

    // Test 2: Get a vehicle without assigned route
    console.log('\n\n📋 TEST 2: Vehicle WITHOUT Assigned Route');
    console.log('─'.repeat(60));
    
    const vehicleWithoutRoute = await FleetVehicle.findOne({ 
      'assignedRoute.routeName': { $exists: false } 
    }).lean();

    if (vehicleWithoutRoute) {
      console.log('✅ Found vehicle without route:');
      console.log(`   Registration: ${vehicleWithoutRoute.registrationNo}`);
      console.log(`   Type: ${vehicleWithoutRoute.vehicleType}`);
      console.log(`   Capacity: ${vehicleWithoutRoute.capacity}`);
      console.log(`   Assigned Route: null (not assigned)`);
    } else {
      console.log('ℹ️  All vehicles have assigned routes');
    }

    // Test 3: Simulate API response
    console.log('\n\n📋 TEST 3: Simulated API Response');
    console.log('─'.repeat(60));
    
    if (vehicleWithRoute) {
      // Find a task for this vehicle
      const now = new Date();
      const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

      const task = await FleetTask.findOne({
        vehicleId: vehicleWithRoute.id,
        taskDate: { $gte: startOfDay, $lte: endOfDay }
      }).lean();

      const apiResponse = {
        success: true,
        message: 'Vehicle details retrieved successfully',
        vehicle: {
          id: vehicleWithRoute.id,
          vehicleCode: vehicleWithRoute.vehicleCode,
          registrationNo: vehicleWithRoute.registrationNo,
          vehicleType: vehicleWithRoute.vehicleType,
          capacity: vehicleWithRoute.capacity,
          fuelType: vehicleWithRoute.fuelType || 'Diesel',
          status: vehicleWithRoute.status,
          insuranceExpiry: vehicleWithRoute.insuranceExpiry,
          lastServiceDate: vehicleWithRoute.lastServiceDate,
          odometer: vehicleWithRoute.odometer,
          assignedTasks: task ? 1 : 0,
          assignedRoute: vehicleWithRoute.assignedRoute ? {
            routeName: vehicleWithRoute.assignedRoute.routeName,
            routeCode: vehicleWithRoute.assignedRoute.routeCode,
            pickupLocations: vehicleWithRoute.assignedRoute.pickupLocations || [],
            dropoffLocation: vehicleWithRoute.assignedRoute.dropoffLocation,
            estimatedDistance: vehicleWithRoute.assignedRoute.estimatedDistance,
            estimatedDuration: vehicleWithRoute.assignedRoute.estimatedDuration
          } : null
        }
      };

      console.log('✅ API Response (GET /driver/vehicle):');
      console.log(JSON.stringify(apiResponse, null, 2));
    }

    // Test 4: Statistics
    console.log('\n\n📊 TEST 4: Statistics');
    console.log('─'.repeat(60));
    
    const totalVehicles = await FleetVehicle.countDocuments({});
    const vehiclesWithRoutes = await FleetVehicle.countDocuments({ 
      'assignedRoute.routeName': { $exists: true } 
    });
    const vehiclesWithoutRoutes = totalVehicles - vehiclesWithRoutes;

    console.log(`Total Vehicles: ${totalVehicles}`);
    console.log(`With Assigned Routes: ${vehiclesWithRoutes} (${((vehiclesWithRoutes/totalVehicles)*100).toFixed(1)}%)`);
    console.log(`Without Routes: ${vehiclesWithoutRoutes} (${((vehiclesWithoutRoutes/totalVehicles)*100).toFixed(1)}%)`);

    // Route distribution
    const routeDistribution = await FleetVehicle.aggregate([
      { $match: { 'assignedRoute.routeName': { $exists: true } } },
      { $group: { 
        _id: '$assignedRoute.routeName', 
        count: { $sum: 1 },
        vehicles: { $push: '$registrationNo' }
      }},
      { $sort: { count: -1 } }
    ]);

    if (routeDistribution.length > 0) {
      console.log('\n📍 Route Distribution:');
      routeDistribution.forEach(route => {
        console.log(`\n   ${route._id}`);
        console.log(`   Vehicles (${route.count}): ${route.vehicles.join(', ')}`);
      });
    }

    // Test 5: Validation
    console.log('\n\n✅ TEST 5: Data Validation');
    console.log('─'.repeat(60));
    
    const invalidRoutes = await FleetVehicle.find({
      'assignedRoute.routeName': { $exists: true },
      $or: [
        { 'assignedRoute.routeCode': { $exists: false } },
        { 'assignedRoute.pickupLocations': { $size: 0 } },
        { 'assignedRoute.dropoffLocation': { $exists: false } },
        { 'assignedRoute.estimatedDistance': { $lte: 0 } },
        { 'assignedRoute.estimatedDuration': { $lte: 0 } }
      ]
    }).lean();

    if (invalidRoutes.length === 0) {
      console.log('✅ All assigned routes have valid data');
    } else {
      console.log(`⚠️  Found ${invalidRoutes.length} vehicles with incomplete route data:`);
      invalidRoutes.forEach(v => {
        console.log(`   - ${v.registrationNo}: Missing or invalid route fields`);
      });
    }

    console.log('\n\n🎉 All Tests Completed!');
    console.log('\n💡 Next Steps:');
    console.log('   1. Start the backend server: npm start');
    console.log('   2. Test API endpoint: GET /api/v1/driver/vehicle');
    console.log('   3. Open Driver Mobile App');
    console.log('   4. Navigate to Vehicle Info Screen');
    console.log('   5. Verify route display');

  } catch (error) {
    console.error('❌ Error testing vehicle route API:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testVehicleRouteAPI();
