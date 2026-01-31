// Quick Test Server for React Native App
// Run with: node test-server.js

const http = require('http');
const url = require('url');

const PORT = 5002;
const HOST = '0.0.0.0'; // Listen on all interfaces

// Simple request handler
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  console.log(`${new Date().toISOString()} - ${method} ${path}`);

  // Health check endpoint
  if (path === '/api/health' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Test server is running!'
    }));
    return;
  }

  // Login endpoint
  if (path === '/api/auth/login' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body);
        console.log('Login attempt:', { email, passwordLength: password?.length });

        // Simple validation
        if (!email || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: 'Email and password are required'
          }));
          return;
        }

        // Mock successful login response
        const response = {
          success: true,
          data: {
            success: true,
            autoSelected: true,
            token: `mock.jwt.token.${Date.now()}`,
            refreshToken: `mock.refresh.token.${Date.now()}`,
            expiresIn: 3600,
            employeeId: 1,
            user: {
              id: 1,
              email: email,
              name: email.includes('supervisor') ? 'Test Supervisor' : 
                    email.includes('driver') ? 'Test Driver' : 'Test Worker',
              role: email.includes('supervisor') ? 'Supervisor' : 
                    email.includes('driver') ? 'Driver' : 'Worker'
            },
            company: {
              id: 1,
              name: 'Test Construction Company',
              role: email.includes('supervisor') ? 'Supervisor' : 
                    email.includes('driver') ? 'Driver' : 'Worker'
            },
            permissions: ['read', 'write']
          },
          message: 'Login successful'
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
        console.log('Login successful for:', email);
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Invalid JSON in request body'
        }));
      }
    });
    return;
  }

  // Logout endpoint
  if (path === '/api/auth/logout' && method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Logout successful'
    }));
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: false,
    message: `Endpoint not found: ${method} ${path}`,
    availableEndpoints: [
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/logout'
    ]
  }));
});

server.listen(PORT, HOST, () => {
  console.log('🚀 Test Server Started!');
  console.log(`📍 Server running on: http://192.168.1.8:${PORT}`);
  console.log(`🔗 Health check: http://192.168.1.8:${PORT}/api/health`);
  console.log(`🔐 Login endpoint: http://192.168.1.8:${PORT}/api/auth/login`);
  console.log('');
  console.log('📱 Your React Native app should now be able to connect!');
  console.log('');
  console.log('Test credentials (any email/password will work):');
  console.log('• worker@test.com / password123');
  console.log('• supervisor@test.com / password123');
  console.log('• driver@test.com / password123');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.log('Try stopping other servers or use a different port.');
  } else {
    console.error('❌ Server error:', err.message);
  }
});