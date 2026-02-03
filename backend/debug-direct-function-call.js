import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getWorkerTaskHistory } from './src/modules/worker/workerController.js';

dotenv.config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function testDirectFunctionCall() {
  await connectDB();
  
  try {
    console.log('🔍 Testing direct function call...');
    
    // Mock request and response objects
    const mockReq = {
      user: {
        userId: 2,
        companyId: 1,
        role: 'WORKER',
        email: 'worker@gmail.com'
      },
      query: {
        page: '1',
        limit: '10'
      }
    };
    
    const mockRes = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.responseData = data;
        console.log(`Response Status: ${this.statusCode}`);
        console.log('Response Data:', JSON.stringify(data, null, 2));
        return this;
      }
    };
    
    console.log('Calling getWorkerTaskHistory directly...');
    await getWorkerTaskHistory(mockReq, mockRes);
    
    if (mockRes.statusCode === 200) {
      console.log('✅ Function call successful');
    } else {
      console.log('❌ Function call failed');
    }
    
  } catch (error) {
    console.error('❌ Error in direct function call:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

testDirectFunctionCall();