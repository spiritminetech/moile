// Test distance calculation between fallback coordinates and project location

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
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

console.log('🧪 Testing Distance Calculation');
console.log('='.repeat(40));

// Project coordinates (from database)
const projectLat = 1.3521;
const projectLon = 103.8198;

// Updated fallback coordinates (mobile app)
const fallbackLat = 1.3521;
const fallbackLon = 103.8198;

// Old fallback coordinates (for comparison)
const oldFallbackLat = 40.7128;
const oldFallbackLon = -74.0060;

console.log('📍 Project Location (Singapore):');
console.log(`  Latitude: ${projectLat}`);
console.log(`  Longitude: ${projectLon}`);

console.log('\n📱 New Fallback Location (Mobile App):');
console.log(`  Latitude: ${fallbackLat}`);
console.log(`  Longitude: ${fallbackLon}`);

console.log('\n📱 Old Fallback Location (New York):');
console.log(`  Latitude: ${oldFallbackLat}`);
console.log(`  Longitude: ${oldFallbackLon}`);

const newDistance = calculateDistance(projectLat, projectLon, fallbackLat, fallbackLon);
const oldDistance = calculateDistance(projectLat, projectLon, oldFallbackLat, oldFallbackLon);

console.log('\n🎯 Distance Results:');
console.log(`  New fallback distance: ${Math.round(newDistance)}m`);
console.log(`  Old fallback distance: ${Math.round(oldDistance)}m`);

console.log('\n✅ Geofence Validation:');
console.log(`  Project geofence radius: 150m`);
console.log(`  New fallback within geofence: ${newDistance <= 150 ? 'YES' : 'NO'}`);
console.log(`  Old fallback within geofence: ${oldDistance <= 150 ? 'NO (way too far)' : 'NO'}`);

if (newDistance <= 150) {
  console.log('\n🎉 SUCCESS: Task start should now work!');
} else {
  console.log('\n❌ ISSUE: Still outside geofence');
}