import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/modules/user/User.js';
import jwt from 'jsonwebtoken';

dotenv.config();

const testCompleteGeofenceFlow = async () => {
  try {
    console.log('🧪 Testing Complete Geofence Flow');
    console.log('=================================');
    
    // Connect to database to get user info
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME || 'erp' });
    
    // Get the worker user we created
    const user = await User.findOne({ email: 'worker1@gmail.com' });
    if (!user) {
      throw new Error('Worker user not found');
    }
    
    // Create a JWT token for authentication
    const token = jwt.sign(
      { 
        userId: user.id, 
        companyId: 1,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log('✅ Authentication token created for worker1@gmail.com');
    
    // Test the worker attendance validate-location endpoint
    const apiUrl = 'http://localhost:5002/api/worker/attendance/validate-location';
    
    // Test data - using our fallback coordinates
    const testData = {
      projectId: '1003',
      latitude: 40.7128,  // Our fallback location
      longitude: -74.0060,
      accuracy: 10
    };
    
    console.log('📍 Testing with data:', testData);
    
    const response = await axios.post(apiUrl, testData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('📥 Response Data:', JSON.stringify(response.data, null, 2));
    
    // Analyze the response
    const { valid, insideGeofence, distance, canProceed, projectGeofence } = response.data;
    
    console.log('\\n🎯 Analysis:');
    console.log('- Valid:', valid);
    console.log('- Inside Geofence:', insideGeofence);
    console.log('- Distance:', distance, 'meters');
    console.log('- Can Proceed:', canProceed);
    console.log('- Project Center:', projectGeofence.center.latitude, projectGeofence.center.longitude);
    console.log('- Project Radius:', projectGeofence.radius, 'meters');
    
    if (valid && insideGeofence && canProceed && distance === 0) {
      console.log('\\n🎉 SUCCESS: Geofence validation is working perfectly!');
      console.log('✅ The fallback location matches the project coordinates exactly');
      console.log('✅ Worker can now check in/out without location service errors');
    } else if (valid && canProceed) {
      console.log('\\n✅ SUCCESS: Geofence validation is working (within allowed range)');
      console.log(`📏 Distance: ${distance}m (within ${projectGeofence.radius}m radius)`);
    } else {
      console.log('\\n❌ ISSUE: Geofence validation failed');
      console.log('🔍 Check if coordinates match between fallback location and project');
    }
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
};

testCompleteGeofenceFlow();