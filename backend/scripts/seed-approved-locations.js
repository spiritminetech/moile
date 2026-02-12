/**
 * Seed Script: Add Sample Approved Locations
 * 
 * This script adds sample approved locations for testing the geofence validation.
 * Run with: node scripts/seed-approved-locations.js
 */

import mongoose from 'mongoose';
import ApprovedLocation from '../src/modules/location/ApprovedLocation.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

// Sample approved locations for Company ID 1
const sampleLocations = [
  {
    id: 1,
    companyId: 1,
    name: 'Main Depot',
    type: 'depot',
    address: '123 Industrial Road, Singapore 123456',
    center: {
      latitude: 1.3521,
      longitude: 103.8198
    },
    radius: 100,  // 100 meters
    active: true,
    allowedForClockIn: true,
    allowedForRouteStart: true,
    notes: 'Main vehicle depot and driver reporting location'
  },
  {
    id: 2,
    companyId: 1,
    name: 'Worker Dormitory A',
    type: 'dormitory',
    address: '456 Dormitory Lane, Singapore 234567',
    center: {
      latitude: 1.3621,
      longitude: 103.8298
    },
    radius: 150,  // 150 meters
    active: true,
    allowedForClockIn: true,
    allowedForRouteStart: true,
    notes: 'Primary worker dormitory - pickup location'
  },
  {
    id: 3,
    companyId: 1,
    name: 'Worker Dormitory B',
    type: 'dormitory',
    address: '789 Housing Street, Singapore 345678',
    center: {
      latitude: 1.3721,
      longitude: 103.8398
    },
    radius: 150,  // 150 meters
    active: true,
    allowedForClockIn: true,
    allowedForRouteStart: true,
    notes: 'Secondary worker dormitory - pickup location'
  },
  {
    id: 4,
    companyId: 1,
    name: 'Equipment Yard',
    type: 'yard',
    address: '321 Storage Avenue, Singapore 456789',
    center: {
      latitude: 1.3421,
      longitude: 103.8098
    },
    radius: 200,  // 200 meters
    active: true,
    allowedForClockIn: true,
    allowedForRouteStart: true,
    notes: 'Equipment storage and maintenance yard'
  },
  {
    id: 5,
    companyId: 1,
    name: 'Head Office',
    type: 'office',
    address: '555 Business Park, Singapore 567890',
    center: {
      latitude: 1.3321,
      longitude: 103.7998
    },
    radius: 50,  // 50 meters
    active: true,
    allowedForClockIn: true,
    allowedForRouteStart: false,  // Office not allowed for route start
    notes: 'Company head office - admin staff only'
  }
];

async function seedApprovedLocations() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🗑️  Clearing existing approved locations...');
    const deleteResult = await ApprovedLocation.deleteMany({ companyId: 1 });
    console.log(`   Deleted ${deleteResult.deletedCount} existing locations\n`);

    console.log('📍 Inserting sample approved locations...');
    for (const location of sampleLocations) {
      const newLocation = new ApprovedLocation(location);
      await newLocation.save();
      console.log(`   ✅ Created: ${location.name} (${location.type})`);
      console.log(`      Coordinates: ${location.center.latitude}, ${location.center.longitude}`);
      console.log(`      Radius: ${location.radius}m`);
      console.log(`      Clock-in: ${location.allowedForClockIn ? 'Yes' : 'No'}, Route start: ${location.allowedForRouteStart ? 'Yes' : 'No'}\n`);
    }

    console.log('✅ Successfully seeded approved locations!');
    console.log(`\n📊 Summary:`);
    console.log(`   Total locations: ${sampleLocations.length}`);
    console.log(`   Depots: ${sampleLocations.filter(l => l.type === 'depot').length}`);
    console.log(`   Dormitories: ${sampleLocations.filter(l => l.type === 'dormitory').length}`);
    console.log(`   Yards: ${sampleLocations.filter(l => l.type === 'yard').length}`);
    console.log(`   Offices: ${sampleLocations.filter(l => l.type === 'office').length}`);

    console.log(`\n🧪 Test Coordinates:`);
    console.log(`   Inside Main Depot: { latitude: 1.3521, longitude: 103.8198 }`);
    console.log(`   Inside Dormitory A: { latitude: 1.3621, longitude: 103.8298 }`);
    console.log(`   Outside all locations: { latitude: 1.4000, longitude: 103.9000 }`);

  } catch (error) {
    console.error('❌ Error seeding approved locations:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seed function
seedApprovedLocations();
