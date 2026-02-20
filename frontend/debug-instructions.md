# React Native API Debugging Guide

## Method 1: Console Logs (Already Added)
I've added comprehensive logging to your app. You'll see:
- 📝 Form data when you submit login
- 🔐 Login credentials being sent
- 🚀 API requests with full details
- ✅ API responses
- ❌ Any errors

## Method 2: React Native Debugger
1. **Enable Remote Debugging**:
   - Shake your device or press `Cmd+D` (iOS) / `Ctrl+M` (Android)
   - Select "Debug" or "Open Debugger"
   - This opens Chrome DevTools

2. **View Network Tab**:
   - Open Chrome DevTools (F12)
   - Go to Network tab
   - You'll see all HTTP requests

## Method 3: Flipper (Advanced)
1. Install Flipper: https://fbflipper.com/
2. Add network plugin
3. See all network requests in real-time

## Method 4: Reactotron (Recommended for Development)
1. Install Reactotron: https://github.com/infinitered/reactotron
2. Add to your project
3. See API calls, state changes, and more

## Method 5: Metro Console
Check the Metro bundler console where you ran `npx expo start`. All console.log statements will appear there.

## What You'll See Now:
When you try to login, you'll see logs like:
```
📝 Login form submission: { email: "test@example.com", passwordLength: 8, ... }
🔐 Login attempt: { email: "test@example.com", passwordLength: 8, ... }
🚀 API Request: { method: "POST", url: "http://localhost:5002/api/auth/login", data: {...} }
✅ API Response: { status: 200, data: {...} }
```

## Current API Endpoint:
Your app is configured to call: `http://localhost:5002/api/auth/login`

Make sure your backend server is running on this URL, or update the API_CONFIG.BASE_URL in constants/index.ts