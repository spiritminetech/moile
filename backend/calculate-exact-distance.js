// Calculate exact distance between employee location and project center
import { calculateDistance, validateGeofence } from './utils/geofenceUtil.js';

// Your actual location from LocationLog
const yourLocation = {
  latitude: 9.9086267,
  longitude: 78.0908659
};

// Project center from database
const projectGeofence = {
  center: {
    latitude: 9.908612,
    longitude: 78.090842
  },
  radius: 100,
  strictMode: false,
  allowedVariance: 100
};

console.log('📍 DISTANCE CALCULATION');
console.log('='.repeat(80));
console.log('\nYour Location:');
console.log('  Latitude:', yourLocation.latitude);
console.log('  Longitude:', yourLocation.longitude);

console.log('\nProject Center:');
console.log('  Latitude:', projectGeofence.center.latitude);
console.log('  Longitude:', projectGeofence.center.longitude);

// Calculate distance
const distance = calculateDistance(
  yourLocation.latitude,
  yourLocation.longitude,
  projectGeofence.center.latitude,
  projectGeofence.center.longitude
);

console.log('\n📏 Distance Result:');
console.log('  Distance:', distance.toFixed(2), 'meters');
console.log('  Geofence Radius:', projectGeofence.radius, 'meters');
console.log('  Allowed Variance:', projectGeofence.allowedVariance, 'meters');
console.log('  Total Allowed:', (projectGeofence.radius + projectGeofence.allowedVariance), 'meters');

// Validate geofence
const validation = validateGeofence(yourLocation, projectGeofence);

console.log('\n✅ Geofence Validation:');
console.log(JSON.stringify(validation, null, 2));

if (validation.insideGeofence) {
  console.log('\n🟢 RESULT: You ARE inside the geofence!');
} else {
  console.log('\n🔴 RESULT: You are OUTSIDE the geofence');
  console.log('   Exceeds by:', (distance - (projectGeofence.radius + projectGeofence.allowedVariance)).toFixed(2), 'meters');
}
