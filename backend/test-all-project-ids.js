import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/modules/user/User.js';
import jwt from 'jsonwebtoken';

dotenv.config();

const testAllProjectIds = async () => {
  try {
    console.log('🧪 Testing All Project IDs for Geofence Validation');
    console.log('==================================================');
    
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
    
    // Test different project IDs that might be causing the issue
    const projectIdsToTest = ['1', '2', '1003'];
    const apiUrl = 'http://localhost:5002/api/worker/attendance/validate-location';
    
    // Test data - using our fallback coordinates
    const testData = {
      latitude: 40.7128,  // Our fallback location
      longitude: -74.0060,
      accuracy: 10
    };
    
    for (const projectId of projectIdsToTest) {
      console.log(`\n📍 Testing Project ID: ${projectId}`);
      console.log('-----------------------------------');
      
      try {
        const response = await axios.post(apiUrl, {
          ...testData,
          projectId: projectId
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          timeout: 10000
        });
        
        console.log('✅ Status:', response.status);
        const { valid, distance, projectGeofence } = response.data;
        console.log('📊 Valid:', valid);
        console.log('📏 Distance:', distance, 'meters');
        console.log('📍 Project Center:', projectGeofence.center.latitude, projectGeofence.center.longitude);
        console.log('📐 Radius:', projectGeofence.radius, 'meters');
        
        if (distance > 1000000) {
          console.log('❌ PROBLEM: This project has the old coordinates!');
          console.log('🔍 This might be the project ID your mobile app is using');
        } else {
          console.log('✅ OK: This project has correct coordinates');
        }
        
      } catch (error) {
        console.log('❌ Error for project', projectId, ':', error.response?.status || error.message);
        if (error.response?.data) {
          console.log('📥 Error data:', error.response.data);
        }
      }
    }
    
    await mongoose.connection.close();
    
    console.log('\n🎯 ANALYSIS:');
    console.log('If any project shows distance > 1,000,000 meters, that project has old coordinates.');
    console.log('Check which project ID your mobile app is actually sending in the request.');
    
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
};

testAllProjectIds();