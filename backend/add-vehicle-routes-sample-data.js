/**
 * Sample Data Script: Add Assigned Routes to Fleet Vehicles
 * 
 * This script adds predefined route assignments to existing fleet vehicles
 * to demonstrate the new assigned route feature.
 * 
 * Usage: node add-vehicle-routes-sample-data.js
 */

import mongoose from 'mongoose';
import FleetVehicle from './src/modules/fleetTask/submodules/fleetvehicle/FleetVehicle.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

// Sample route configurations
const sampleRoutes = [
  {
    routeName: "Route A: Industrial Area Loop",
    routeCode: "RT-001",
    pickupLocations: [
      "Dormitory A - Industrial Area",
      "Dormitory B - Al Quoz",
      "Dormitory C - Jebel Ali"
    ],
    dropoffLocation: "Construction Site - Tower B, Business Bay",
    estimatedDistance: 35,
    estimatedDuration: 60
  },
  {
    routeName: "Route B: Downtown Express",
    routeCode: "RT-002",
    pickupLocations: [
      "Dormitory D - Deira",
      "Dormitory E - Bur Dubai"
    ],
    dropoffLocation: "Construction Site - Marina Heights",
    estimatedDistance: 25,
    estimatedDuration: 45
  },
  {
    routeName: "Route C: Airport Zone",
    routeCode: "RT-003",
    pickupLocations: [
      "Dormitory F - Al Nahda",
      "Dormitory G - Al Qusais",
      "Dormitory H - Muhaisnah"
    ],
    dropoffLocation: "Construction Site - Airport Expansion Project",
    estimatedDistance: 40,
    estimatedDuration: 70
  },
  {
    routeName: "Route D: South Dubai Circuit",
    routeCode: "RT-004",
    pickupLocations: [
      "Dormitory I - Al Barsha",
      "Dormitory J - Al Quoz Industrial"
    ],
    dropoffLocation: "Construction Site - Dubai Hills Estate",
    estimatedDistance: 30,
    estimatedDuration: 50
  }
];

async function addVehicleRoutes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all vehicles
    const vehicles = await FleetVehicle.find({}).lean();
    console.log(`\n📊 Found ${vehicles.length} vehicles in database`);

    if (vehicles.length === 0) {
      console.log('⚠️  No vehicles found. Please add vehicles first.');
      await mongoose.disconnect();
      return;
    }

    let updatedCount = 0;
    let skippedCount = 0;

    // Assign routes to vehicles
    for (let i = 0; i < vehicles.length; i++) {
      const vehicle = vehicles[i];
      
      // Skip if vehicle already has a route
      if (vehicle.assignedRoute && vehicle.assignedRoute.routeName) {
        console.log(`⏭️  Skipping ${vehicle.registrationNo} - Already has route: ${vehicle.assignedRoute.routeName}`);
        skippedCount++;
        continue;
      }

      // Assign route based on vehicle type and index
      let routeIndex;
      if (vehicle.vehicleType === 'Bus') {
        routeIndex = i % sampleRoutes.length;
      } else if (vehicle.vehicleType === 'Van') {
        routeIndex = (i + 1) % sampleRoutes.length;
      } else {
        routeIndex = (i + 2) % sampleRoutes.length;
      }

      const assignedRoute = sampleRoutes[routeIndex];

      // Update vehicle with route and fuel type
      await FleetVehicle.findOneAndUpdate(
        { id: vehicle.id },
        {
          assignedRoute: assignedRoute,
          fuelType: vehicle.fuelType || (vehicle.vehicleType === 'Bus' ? 'Diesel' : 'Petrol')
        }
      );

      console.log(`✅ Updated ${vehicle.registrationNo} (${vehicle.vehicleType})`);
      console.log(`   Route: ${assignedRoute.routeName}`);
      console.log(`   Code: ${assignedRoute.routeCode}`);
      console.log(`   Pickups: ${assignedRoute.pickupLocations.length} locations`);
      console.log(`   Distance: ${assignedRoute.estimatedDistance} km`);
      console.log(`   Duration: ${assignedRoute.estimatedDuration} min\n`);

      updatedCount++;
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Updated: ${updatedCount} vehicles`);
    console.log(`   ⏭️  Skipped: ${skippedCount} vehicles (already have routes)`);
    console.log(`   📋 Total: ${vehicles.length} vehicles`);

    // Display route distribution
    console.log('\n📍 Route Distribution:');
    const routeCounts = {};
    const updatedVehicles = await FleetVehicle.find({ 'assignedRoute.routeName': { $exists: true } }).lean();
    
    updatedVehicles.forEach(v => {
      const routeName = v.assignedRoute?.routeName || 'No Route';
      routeCounts[routeName] = (routeCounts[routeName] || 0) + 1;
    });

    Object.entries(routeCounts).forEach(([route, count]) => {
      console.log(`   ${route}: ${count} vehicle(s)`);
    });

    console.log('\n✅ Vehicle routes added successfully!');
    console.log('\n💡 Next Steps:');
    console.log('   1. Test the /driver/vehicle API endpoint');
    console.log('   2. Open the Driver Mobile App');
    console.log('   3. Navigate to Vehicle Info Screen');
    console.log('   4. Verify assigned route is displayed');

  } catch (error) {
    console.error('❌ Error adding vehicle routes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
addVehicleRoutes();
