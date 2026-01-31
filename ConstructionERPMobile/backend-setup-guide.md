# Backend Server Setup Guide

## Your React Native app is now configured to connect to:
**API Base URL**: `http://192.168.1.8:5002/api`

## Required API Endpoints:

### 1. Login Endpoint
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "autoSelected": true,
    "token": "jwt.token.here",
    "refreshToken": "refresh.token.here",
    "expiresIn": 3600,
    "employeeId": 1,
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "Worker"
    },
    "company": {
      "id": 1,
      "name": "ABC Construction",
      "role": "Worker"
    },
    "permissions": ["read", "write"]
  }
}
```

**Error Response (400/401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### 2. Logout Endpoint
**POST** `/auth/logout`

**Request Body:**
```json
{
  "refreshToken": "refresh.token.here"
}
```

### 3. Health Check (Optional)
**GET** `/health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Quick Express.js Server Example:

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for your React Native app
app.use(cors({
  origin: ['http://192.168.1.8:3000', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Your authentication logic here
  if (email && password) {
    res.json({
      success: true,
      data: {
        success: true,
        autoSelected: true,
        token: 'your.jwt.token',
        refreshToken: 'your.refresh.token',
        expiresIn: 3600,
        employeeId: 1,
        user: {
          id: 1,
          email: email,
          name: 'John Doe',
          role: 'Worker'
        },
        company: {
          id: 1,
          name: 'ABC Construction',
          role: 'Worker'
        },
        permissions: ['read', 'write']
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Start server
app.listen(5002, '0.0.0.0', () => {
  console.log('Server running on http://192.168.1.8:5002');
});
```

## How to Start Your Backend:

1. **Create a new folder** for your backend
2. **Initialize npm**: `npm init -y`
3. **Install dependencies**: `npm install express cors`
4. **Create server.js** with the code above
5. **Start server**: `node server.js`
6. **Test**: Visit `http://192.168.1.8:5002/api/health`

## Network Configuration:

Your React Native app will automatically use:
- **Android Emulator**: `http://10.0.2.2:5002/api`
- **iOS Simulator**: `http://192.168.1.8:5002/api`
- **Physical Devices**: `http://192.168.1.8:5002/api`

## Testing the Connection:

1. **Reload your React Native app**
2. **Click "🔍 Test Connection"** on the login screen
3. **See which URLs are working**
4. **Try logging in** with your real credentials