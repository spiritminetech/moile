import axios from 'axios';

const BASE = 'http://localhost:5002/api';
const CREDS = { email: 'supervisor@gmail.com', password: 'Password123' };

async function test() {
  // Login
  const loginRes = await axios.post(`${BASE}/auth/login`, CREDS);
  const token = loginRes.data.token;
  const headers = { Authorization: `Bearer ${token}` };

  console.log('Testing GET /supervisor/team-list?projectId=1\n');
  
  try {
    const res = await axios.get(`${BASE}/supervisor/team-list?projectId=1`, { headers });
    console.log('✅ Success!');
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log('❌ Error!');
    console.log('Status:', err.response?.status);
    console.log('Response:', JSON.stringify(err.response?.data, null, 2));
    console.log('Message:', err.message);
  }
}

test();
