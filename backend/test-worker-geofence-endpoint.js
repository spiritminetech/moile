import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/modules/user/User.js';
import jwt from 'jsonwebtoken';

dotenv.config();

const testWorkerGeofenceEndpoint = async () => {
  try {
    console.log('🧪 Testing Worker Geofence Validation Endpoint');
    console.log('===============================================');
    
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
    
    // Test the GET endpoint that might be causing the issue
    const apiUrl = 'http://localhost:5002/api/worker/geofence/validate';
    
    // Test with query parameters (GET request)
    const params = {
      projectId: '1003',
      latitude: 40.7128,
      longitude: -74.0060,
      accuracy: 10
    };
    
    console.log('📍 Testing GET endpoint with params:', params);
    
    try {
      const response = await axios.get(apiUrl, {
        params: params,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 10000
      });
      
      console.log('✅ GET Endpoint Response Status:', response.status);
      console.log('📥 GET Response Data:', JSON.stringify(response.data, null, 2));
      
      // Check if this endpoint returns the old coordinates
      if (response.data.projectGeofence) {
        const { center } = response.data.projectGeofence;
        console.log('\\n🎯 GET Endpoint Analysis:');
        console.log('- Project Center:', center.latitude, center.longitude);
        
        if (center.latitude === 12.865141646709928) {
          console.log('❌ FOUND THE PROBLEM: GET endpoint returns old coordinates!');
          console.log('🔍 This is likely the endpoint your mobile app is calling');
        } else {
          console.log('✅ GET endpoint has correct coordinates');
        }
      }
      
    } catch (error) {
      console.log('❌ GET Endpoint Error:', error.response?.status || error.message);
      if (error.response?.data) {
        console.log('📥 GET Error data:', error.response.data);
      }
    }
    
    // Also test different project IDs on the GET endpoint
    console.log('\\n📍 Testing GET endpoint with different project IDs:');
    for (const projectId of ['1', '2', '1003']) {
      try {
        const response = await axios.get(apiUrl, {
          params: {
            projectId: projectId,
            latitude: 40.7128,
            longitude: -74.0060,
            accuracy: 10
          },
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 5000
        });
        
        const center = response.data.projectGeofence?.center;
        console.log(`Project ${projectId}: ${center?.latitude}, ${center?.longitude}`);
        
        if (center?.latitude === 12.865141646709928) {
          console.log(`❌ Project ${projectId} has OLD coordinates on GET endpoint!`);
        }
        
      } catch (error) {
        console.log(`❌ Project ${projectId}: ${error.response?.status || error.message}`);
      }
    }
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
};

testWorkerGeofenceEndpoint();