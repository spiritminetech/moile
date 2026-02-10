// Test script to verify image URL accessibility
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://192.168.0.3:5002';

// Test 1: Check if server is running
const testServerHealth = async () => {
  console.log('\n🏥 Testing server health...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Server is running');
    console.log('📋 Server info:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Server health check failed:', error.message);
    return false;
  }
};

// Test 2: Check static file serving
const testStaticFileServing = async () => {
  console.log('\n📁 Testing static file serving...');
  
  try {
    // Check if uploads directory exists
    const uploadsDir = path.join(__dirname, 'uploads', 'workers');
    if (!fs.existsSync(uploadsDir)) {
      console.log('⚠️ Uploads directory does not exist:', uploadsDir);
      return false;
    }
    
    // List files in uploads/workers directory
    const files = fs.readdirSync(uploadsDir);
    console.log('📋 Files in uploads/workers:', files);
    
    if (files.length === 0) {
      console.log('⚠️ No files found in uploads/workers directory');
      return false;
    }
    
    // Test accessing the first image file
    const testFile = files[0];
    const testUrl = `${BASE_URL}/uploads/workers/${testFile}`;
    
    console.log('🧪 Testing image URL:', testUrl);
    
    const response = await axios.get(testUrl, {
      responseType: 'arraybuffer',
      timeout: 5000
    });
    
    if (response.status === 200) {
      console.log('✅ Image URL is accessible');
      console.log('📋 Content-Type:', response.headers['content-type']);
      console.log('📋 Content-Length:', response.headers['content-length'], 'bytes');
      return true;
    } else {
      console.log('❌ Image URL returned status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Static file serving test failed:', error.message);
    if (error.response) {
      console.log('📋 Response status:', error.response.status);
      console.log('📋 Response headers:', error.response.headers);
    }
    return false;
  }
};

// Test 3: Test CORS headers
const testCORSHeaders = async () => {
  console.log('\n🌐 Testing CORS headers...');
  
  try {
    const uploadsDir = path.join(__dirname, 'uploads', 'workers');
    const files = fs.readdirSync(uploadsDir);
    
    if (files.length === 0) {
      console.log('⚠️ No files to test CORS with');
      return false;
    }
    
    const testFile = files[0];
    const testUrl = `${BASE_URL}/uploads/workers/${testFile}`;
    
    // Make an OPTIONS request to check CORS
    const optionsResponse = await axios.options(testUrl);
    console.log('✅ OPTIONS request successful');
    console.log('📋 CORS headers:', {
      'access-control-allow-origin': optionsResponse.headers['access-control-allow-origin'],
      'access-control-allow-methods': optionsResponse.headers['access-control-allow-methods'],
      'access-control-allow-headers': optionsResponse.headers['access-control-allow-headers']
    });
    
    return true;
  } catch (error) {
    console.error('❌ CORS test failed:', error.message);
    return false;
  }
};

// Test 4: Test from mobile app perspective
const testMobileAppAccess = async () => {
  console.log('\n📱 Testing mobile app access simulation...');
  
  try {
    const uploadsDir = path.join(__dirname, 'uploads', 'workers');
    const files = fs.readdirSync(uploadsDir);
    
    if (files.length === 0) {
      console.log('⚠️ No files to test mobile access with');
      return false;
    }
    
    const testFile = files[0];
    const testUrl = `${BASE_URL}/uploads/workers/${testFile}`;
    
    // Simulate mobile app request with typical headers
    const response = await axios.get(testUrl, {
      headers: {
        'User-Agent': 'React Native',
        'Accept': 'image/*',
        'Origin': 'http://192.168.0.3:8081' // Typical React Native dev server
      },
      responseType: 'arraybuffer',
      timeout: 10000
    });
    
    if (response.status === 200) {
      console.log('✅ Mobile app simulation successful');
      console.log('📋 Response headers:', {
        'content-type': response.headers['content-type'],
        'content-length': response.headers['content-length'],
        'access-control-allow-origin': response.headers['access-control-allow-origin']
      });
      return true;
    } else {
      console.log('❌ Mobile app simulation failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Mobile app access test failed:', error.message);
    if (error.response) {
      console.log('📋 Error response status:', error.response.status);
      console.log('📋 Error response headers:', error.response.headers);
    }
    return false;
  }
};

// Main test function
const runTests = async () => {
  console.log('🧪 Starting Image Access Tests...');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Server health
    const serverHealthy = await testServerHealth();
    
    // Test 2: Static file serving
    const staticFilesWorking = await testStaticFileServing();
    
    // Test 3: CORS headers
    const corsWorking = await testCORSHeaders();
    
    // Test 4: Mobile app access
    const mobileAccessWorking = await testMobileAppAccess();
    
    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 TEST SUMMARY:');
    console.log(`🏥 Server Health: ${serverHealthy ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📁 Static Files: ${staticFilesWorking ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🌐 CORS Headers: ${corsWorking ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📱 Mobile Access: ${mobileAccessWorking ? '✅ PASS' : '❌ FAIL'}`);
    
    const allTestsPassed = serverHealthy && staticFilesWorking && corsWorking && mobileAccessWorking;
    console.log(`\n🎯 OVERALL: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allTestsPassed) {
      console.log('\n🎉 Image URLs should work correctly in the mobile app!');
    } else {
      console.log('\n🔧 Some issues were found. Check the logs above for details.');
      
      if (!serverHealthy) {
        console.log('💡 Make sure the backend server is running on http://192.168.0.3:5002');
      }
      if (!staticFilesWorking) {
        console.log('💡 Check if the uploads/workers directory exists and has image files');
      }
      if (!corsWorking) {
        console.log('💡 CORS configuration may need adjustment for mobile app access');
      }
      if (!mobileAccessWorking) {
        console.log('💡 Mobile app may not be able to access images due to network/CORS issues');
      }
    }
    
  } catch (error) {
    console.error('\n💥 Unexpected error during testing:', error);
  }
};

// Run the tests
runTests();