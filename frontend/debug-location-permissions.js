// Debug script to check location permissions and state
// This helps understand why "Location Permission Required" appears

import * as Location from 'expo-location';

async function debugLocationPermissions() {
  console.log('🔍 Debugging Location Permissions');
  console.log('='.repeat(50));
  
  try {
    // Check current permission status
    console.log('1️⃣ Checking current permission status...');
    const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
    console.log('   Current permission status:', currentStatus);
    console.log('   Is granted:', currentStatus === 'granted');
    
    // Check if location services are enabled
    console.log('\n2️⃣ Checking location services...');
    const isEnabled = await Location.hasServicesEnabledAsync();
    console.log('   Location services enabled:', isEnabled);
    
    // Try to request permissions (should be instant if already granted)
    console.log('\n3️⃣ Requesting permissions...');
    const { status: requestedStatus } = await Location.requestForegroundPermissionsAsync();
    console.log('   Requested permission status:', requestedStatus);
    console.log('   Is granted after request:', requestedStatus === 'granted');
    
    // Try to get current location
    console.log('\n4️⃣ Testing location access...');
    if (requestedStatus === 'granted' && isEnabled) {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
        });
        console.log('   ✅ Successfully got location:');
        console.log('     Latitude:', location.coords.latitude);
        console.log('     Longitude:', location.coords.longitude);
        console.log('     Accuracy:', location.coords.accuracy);
        console.log('     Timestamp:', new Date(location.timestamp));
      } catch (locationError) {
        console.log('   ❌ Failed to get location:', locationError.message);
      }
    } else {
      console.log('   ⚠️ Cannot get location - permission denied or services disabled');
    }
    
    // Summary
    console.log('\n🎯 Summary:');
    console.log('   Permission granted:', requestedStatus === 'granted');
    console.log('   Services enabled:', isEnabled);
    console.log('   Should work:', requestedStatus === 'granted' && isEnabled);
    
    if (requestedStatus !== 'granted') {
      console.log('\n❌ ISSUE: Location permission not granted');
      console.log('   Solution: Grant location permission in device settings');
    }
    
    if (!isEnabled) {
      console.log('\n❌ ISSUE: Location services disabled');
      console.log('   Solution: Enable location services in device settings');
    }
    
    if (requestedStatus === 'granted' && isEnabled) {
      console.log('\n✅ Location should work properly');
      console.log('   If you still see "Location Permission Required", it might be a state management issue');
    }
    
  } catch (error) {
    console.error('❌ Error debugging location permissions:', error);
  }
}

// Run the debug
debugLocationPermissions();