// Quick Test Server for React Native App
// Run with: node test-server.js

const http = require('http');
const url = require('url');

const PORT = 5002;
const HOST = '0.0.0.0'; // Listen on all interfaces

// Mock data for dashboard API
const mockDashboardData = {
  success: true,
  data: {
    project: {
      id: 1,
      name: "Construction Site Alpha",
      code: "CSA-001",
      location: "123 Main Street, City, State",
      geofence: {
        latitude: 40.7130,
        longitude: -74.0058,
        radius: 100
      }
    },
    supervisor: {
      id: 5,
      name: "John Smith",
      phone: "+1-555-0123",
      email: "john.smith@company.com"
    },
    worker: {
      id: 10,
      name: "Mike Johnson",
      role: "Construction Worker",
      checkInStatus: "checked_in",
      currentLocation: {
        latitude: 40.7131,
        longitude: -74.0059,
        insideGeofence: true,
        lastUpdated: "2024-02-01T14:30:00.000Z"
      }
    },
    tasks: [
      {
        assignmentId: 101,
        taskId: 25,
        taskName: "Install Electrical Wiring",
        taskType: "WORK",
        description: "Install electrical wiring in building section A",
        workArea: "Building A - Floor 2",
        floor: "2",
        zone: "North Wing",
        status: "in_progress",
        priority: "high",
        sequence: 1,
        dailyTarget: {
          description: "Complete 50% of electrical installation",
          quantity: 100,
          unit: "meters",
          targetCompletion: 50
        },
        progress: {
          percentage: 25,
          completed: 25,
          remaining: 75,
          lastUpdated: "2024-02-01T13:45:00.000Z"
        },
        timeEstimate: {
          estimated: 480,
          elapsed: 120,
          remaining: 360
        },
        supervisorInstructions: "Follow safety protocols and use proper PPE",
        startTime: "2024-02-01T08:00:00.000Z",
        estimatedEndTime: "2024-02-01T16:00:00.000Z",
        canStart: true,
        canStartMessage: null,
        dependencies: []
      }
    ],
    toolsAndMaterials: {
      tools: [
        {
          id: 15,
          name: "Electric Drill",
          quantity: 2,
          unit: "pieces",
          allocated: true,
          location: "Tool Storage A"
        }
      ],
      materials: [
        {
          id: 30,
          name: "Electrical Wire",
          quantity: 500,
          unit: "meters",
          allocated: 200,
          used: 50,
          remaining: 150,
          location: "Material Storage B"
        }
      ]
    },
    dailySummary: {
      totalTasks: 3,
      completedTasks: 1,
      inProgressTasks: 1,
      queuedTasks: 1,
      errorTasks: 0,
      totalHoursWorked: 2.5,
      remainingHours: 5.5,
      overallProgress: 35
    }
  }
};

// Mock data for project API
const mockProjectData = {
  success: true,
  data: {
    id: 1,
    projectName: "Construction Site Alpha",
    projectCode: "CSA-001",
    description: "Major construction project for commercial building",
    address: "123 Main Street, City, State, 12345",
    companyId: 5,
    status: "ACTIVE",
    startDate: "2024-01-15T00:00:00.000Z",
    endDate: "2024-06-30T00:00:00.000Z",
    budget: 500000,
    currency: "USD",
    geofence: {
      center: {
        latitude: 40.7130,
        longitude: -74.0058
      },
      radius: 100,
      strictMode: true,
      allowedVariance: 10
    },
    latitude: 40.7130,
    longitude: -74.0058,
    geofenceRadius: 100,
    projectManager: {
      id: 8,
      name: "Sarah Wilson",
      email: "sarah.wilson@company.com",
      phone: "+1-555-0456"
    },
    createdAt: "2024-01-10T10:00:00.000Z",
    updatedAt: "2024-02-01T09:30:00.000Z"
  }
};

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
  const query = parsedUrl.query;

  console.log(`${new Date().toISOString()} - ${method} ${path}${Object.keys(query).length ? '?' + new URLSearchParams(query).toString() : ''}`);

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

        // Validate credentials - only accept specific test accounts
        const validCredentials = [
          { email: 'worker@test.com', password: 'password123' },
          { email: 'supervisor@test.com', password: 'password123' },
          { email: 'driver@test.com', password: 'password123' }
        ];

        const isValidCredential = validCredentials.some(
          cred => cred.email === email && cred.password === password
        );

        if (!isValidCredential) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: 'Invalid email or password'
          }));
          console.log('Login failed - invalid credentials:', { email, passwordLength: password?.length });
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

  // Worker Dashboard API - GET /api/worker/tasks/today
  if (path === '/api/worker/tasks/today' && method === 'GET') {
    // Check for Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        message: 'Authorization token required',
        error: 'UNAUTHORIZED'
      }));
      return;
    }

    // Optional date parameter
    const date = query.date;
    if (date) {
      console.log('Dashboard data requested for date:', date);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockDashboardData));
    console.log('Dashboard data sent successfully');
    return;
  }

  // Project Information API - GET /api/project/{projectId}
  if (path.match(/^\/api\/project\/\d+$/) && method === 'GET') {
    // Check for Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        message: 'Authorization token required'
      }));
      return;
    }

    const projectId = parseInt(path.split('/').pop());
    console.log('Project info requested for ID:', projectId);

    if (isNaN(projectId)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        message: 'Invalid project ID format'
      }));
      return;
    }

    if (projectId !== 1) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        message: 'Project not found'
      }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockProjectData));
    console.log('Project data sent successfully for ID:', projectId);
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
      'POST /api/auth/logout',
      'GET /api/worker/tasks/today',
      'GET /api/project/{projectId}'
    ]
  }));
});

server.listen(PORT, HOST, () => {
  console.log('🚀 Test Server Started!');
  console.log(`📍 Server running on: http://192.168.1.8:${PORT}`);
  console.log(`🔗 Health check: http://192.168.1.8:${PORT}/api/health`);
  console.log(`🔐 Login endpoint: http://192.168.1.8:${PORT}/api/auth/login`);
  console.log(`📊 Dashboard endpoint: http://192.168.1.8:${PORT}/api/worker/tasks/today`);
  console.log(`🏗️ Project endpoint: http://192.168.1.8:${PORT}/api/project/1`);
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