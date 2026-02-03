import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/modules/user/User.js';
import jwt from 'jsonwebtoken';

dotenv.config();

const testTodaysAttendanceAPI = async () => {
  try {
    console.log('🧪 Testing Today\'s Attendance API');
    console.log('=================================');
    
    // Connect to database to get user info
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME || 'erp' });
    
    // Get the worker user
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
    
    // Test the API endpoint that mobile app calls
    const apiUrl = 'http://localhost:5002/api/worker/attendance/today';
    
    console.log('📍 Testing GET /worker/attendance/today');
    
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('📥 Response Data:', JSON.stringify(response.data, null, 2));
    
    // Analyze the response format
    const data = response.data;
    console.log('\n🎯 Analysis:');
    console.log('- Session:', data.session);
    console.log('- Check In Time:', data.checkInTime);
    console.log('- Check Out Time:', data.checkOutTime);
    console.log('- Project ID:', data.projectId);
    console.log('- Date:', data.date);
    
    // Check if the format matches what mobile app expects
    if (data.session && data.checkInTime !== undefined) {
      console.log('✅ API returns proper attendance data');
      
      if (data.session === 'CHECKED_IN' && data.checkInTime) {
        console.log('✅ Worker is checked in - Today\'s Summary should show');
      } else if (data.session === 'NOT_LOGGED_IN') {
        console.log('❌ Worker is not checked in - Today\'s Summary will be empty');
      }
    } else {
      console.log('❌ API response format might not match mobile app expectations');
    }
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
};

testTodaysAttendanceAPI();