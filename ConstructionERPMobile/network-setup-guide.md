# React Native Network Setup Guide

## Why localhost doesn't work in React Native

### The Problem:
- `localhost` or `127.0.0.1` refers to the device itself
- Your backend server runs on your computer, not on the mobile device
- Mobile devices/emulators can't reach your computer's localhost

## Solutions:

### 1. Use Your Computer's IP Address (Recommended)
Replace `localhost` with your computer's actual IP address:

**Windows - Find your IP:**
```cmd
ipconfig
# Look for "IPv4 Address" under your network adapter
# Example: 192.168.1.100
```

**Mac/Linux - Find your IP:**
```bash
ifconfig
# Look for inet under en0 or your network interface
# Example: 192.168.1.100
```

**Update your API URL:**
```typescript
BASE_URL: 'http://192.168.1.100:5002/api'  // Replace with YOUR IP
```

### 2. Platform-Specific Solutions

#### Android Emulator:
```typescript
BASE_URL: 'http://10.0.2.2:5002/api'  // Special IP for Android emulator
```

#### iOS Simulator:
```typescript
BASE_URL: 'http://localhost:5002/api'  // iOS simulator can use localhost
```

### 3. Dynamic IP Detection (Best for Development)
```typescript
import { Platform } from 'react-native';

const getBaseURL = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5002/api';  // Android emulator
    } else {
      return 'http://192.168.1.100:5002/api';  // Replace with your IP
    }
  }
  return 'https://your-production-api.com/api';  // Production
};
```

### 4. Use Expo's Network Utils
```bash
npx expo install expo-network
```

### 5. Backend CORS Configuration
Make sure your backend allows requests from mobile:

**Express.js example:**
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.1.100:3000'],
  credentials: true
}));
```

## Quick Fix for Your App:

1. Find your computer's IP address
2. Update the BASE_URL in constants/index.ts
3. Make sure your backend server is running
4. Ensure firewall allows connections on port 5002