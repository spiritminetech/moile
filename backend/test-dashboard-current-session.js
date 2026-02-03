// Test to demonstrate dashboard current session behavior
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:5002/api';

const testDashboardCurrentSession = async () => {
  try {
    console.log('\n🧪 Testing Dashboard Current Session Display');
    console.log('===========================================');

    // 1. Login to get fresh token
    console.log('\n1️⃣ Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'worker1@gmail.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // 2. Check current attendance status
    console.log('\n2️⃣ Checking current attendance status...');
    const statusResponse = await axios.get(`${API_BASE}/worker/attendance/today`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const attendanceData = statusResponse.data;
    console.log('📊 Current Status:', attendanceData.session);
    console.log('📊 Work Duration:', attendanceData.workDuration, 'minutes');

    // 3. Simulate dashboard logic
    console.log('\n3️⃣ Dashboard Logic Simulation:');
    
    const currentSessionDuration = attendanceData.session === 'CHECKED_IN' || attendanceData.session === 'ON_LUNCH' 
      ? (attendanceData.workDuration || 0) 
      : 0;
    
    const totalHours = attendanceData.workDuration || 0;

    const formatDuration = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    };

    console.log('🎯 Dashboard Display:');
    console.log('   Current Session:', formatDuration(currentSessionDuration));
    console.log('   Total Today:', formatDuration(totalHours));

    // 4. Explain the logic
    console.log('\n4️⃣ Logic Explanation:');
    if (attendanceData.session === 'CHECKED_OUT') {
      console.log('✅ Worker is CHECKED_OUT');
      console.log('   → Current Session = 0h 0m (no active work)');
      console.log('   → Total Today = work completed today');
    } else if (attendanceData.session === 'CHECKED_IN') {
      console.log('✅ Worker is CHECKED_IN');
      console.log('   → Current Session = active work time');
      console.log('   → Total Today = same as current session');
    } else {
      console.log('✅ Worker is NOT_LOGGED_IN');
      console.log('   → Both values = 0h 0m');
    }

    // 5. If worker is checked out, show what clock-in would do
    if (attendanceData.session === 'CHECKED_OUT') {
      console.log('\n5️⃣ To see "Current Session" with time:');
      console.log('   📱 Worker needs to clock in again');
      console.log('   📱 Then "Current Session" will show active work time');
      console.log('   📱 "Total Today" will include previous + current work');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

testDashboardCurrentSession();