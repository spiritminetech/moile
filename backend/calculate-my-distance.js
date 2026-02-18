// Calculate distance between your location and project location

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Your location
const myLocation = {
  latitude: 9.908612,
  longitude: 78.090842
};

// Project location
const projectLocation = {
  latitude: 9.908612,
  longitude: 78.090842
};

// Project geofence settings
const projectGeofence = {
  radius: 5000,           // 5km
  allowedVariance: 50000  // 50km
};

// Calculate distance
const distance = calculateDistance(
  myLocation.latitude,
  myLocation.longitude,
  projectLocation.latitude,
  projectLocation.longitude
);

// Check if inside geofence
const maxAllowedDistance = projectGeofence.radius + projectGeofence.allowedVariance;
const isInside = distance <= maxAllowedDistance;

// Display results
console.log('\n=== DISTANCE CALCULATION ===\n');
console.log('Your Location:');
console.log(`  Latitude:  ${myLocation.latitude}`);
console.log(`  Longitude: ${myLocation.longitude}`);
console.log('\nProject Location:');
console.log(`  Latitude:  ${projectLocation.latitude}`);
console.log(`  Longitude: ${projectLocation.longitude}`);
console.log('\n--- Results ---');
console.log(`Distance: ${distance.toFixed(2)} meters`);
console.log(`Distance: ${(distance / 1000).toFixed(2)} kilometers`);
console.log('\nGeofence Settings:');
console.log(`  Radius: ${projectGeofence.radius}m`);
console.log(`  Allowed Variance: ${projectGeofence.allowedVariance}m`);
console.log(`  Total Allowed: ${maxAllowedDistance}m (${(maxAllowedDistance/1000).toFixed(2)}km)`);
console.log('\nValidation:');
console.log(`  Inside Geofence: ${isInside ? '✅ YES' : '❌ NO'}`);
console.log(`  Can Check In: ${isInside ? '✅ YES' : '❌ NO'}`);
console.log('\n');

// To use with different coordinates, modify the values above and run:
// node calculate-my-distance.js
