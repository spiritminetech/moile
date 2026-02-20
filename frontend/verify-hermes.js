// Quick script to verify Hermes configuration
// Run this after rebuilding your app

console.log('🔍 Checking Hermes Configuration...\n');

// Check app.json
const fs = require('fs');
const path = require('path');

try {
  const appJsonPath = path.join(__dirname, 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  console.log('📱 app.json Configuration:');
  console.log('  Root jsEngine:', appJson.expo.jsEngine || '❌ Not set');
  console.log('  iOS jsEngine:', appJson.expo.ios?.jsEngine || '❌ Not set');
  console.log('  Android jsEngine:', appJson.expo.android?.jsEngine || '❌ Not set');
  
  const hermesEnabled = 
    appJson.expo.jsEngine === 'hermes' ||
    appJson.expo.ios?.jsEngine === 'hermes' ||
    appJson.expo.android?.jsEngine === 'hermes';
  
  if (hermesEnabled) {
    console.log('\n✅ Hermes is ENABLED in configuration');
    console.log('\n📝 Next Steps:');
    console.log('1. Stop the current Metro bundler (Ctrl+C)');
    console.log('2. Clear cache: npx expo start -c');
    console.log('3. Rebuild app: npx expo run:android (or run:ios)');
    console.log('4. Press "j" to open debugger');
  } else {
    console.log('\n❌ Hermes is NOT enabled');
    console.log('\n📝 To enable Hermes:');
    console.log('1. Add "jsEngine": "hermes" to app.json');
    console.log('2. See HERMES_DEBUGGER_FIX.md for details');
  }
  
  console.log('\n💡 To verify Hermes is running in your app:');
  console.log('Add this to your App.tsx:');
  console.log('  console.log("Hermes:", !!global.HermesInternal);');
  
} catch (error) {
  console.error('❌ Error reading app.json:', error.message);
}
