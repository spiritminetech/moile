import axios from 'axios';

const BASE_URL = 'http://localhost:5002/api';

async function test() {
  try {
    // Login
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Test projects endpoint
    console.log('Testing GET /supervisor/projects');
    const projectsResponse = await axios.get(`${BASE_URL}/supervisor/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Response:', JSON.stringify(projectsResponse.data, null, 2));

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

test();
