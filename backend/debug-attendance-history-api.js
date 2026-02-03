// Debug attendance history API response
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getAttendanceHistory } from './src/modules/worker/workerAttendanceController.js';

dotenv.config();

async function debugAttendanceHistoryAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Mock request object for testing
    const mockReq = {
      user: {
        userId: 64,
        companyId: 1,
        role: 'WORKER'
      },
      query: {}
    };

    // Mock response object
    const mockRes = {
      json: (data) => {
        console.log('📊 API Response:');
        console.log(JSON.stringify(data, null, 2));
        return data;
      },
      status: (code) => ({
        json: (data) => {
          console.log(`❌ Error Response (${code}):`, data);
          return data;
        }
      })
    };

    console.log('🔍 Testing attendance history API...');
    await getAttendanceHistory(mockReq, mockRes);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

debugAttendanceHistoryAPI();