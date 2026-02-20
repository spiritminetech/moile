# Expo Setup Fix Guide

## Problem
```
ConfigError: Cannot determine the project's Expo SDK version because the module `expo` is not installed.
```

## Solution

### Option 1: Quick Fix (Automated)

Run the fix script:
```bash
cd moile/ConstructionERPMobile
fix-expo-setup.bat
```

### Option 2: Manual Fix

#### Step 1: Clean Installation
```bash
cd moile/ConstructionERPMobile

# Remove node_modules and package-lock.json
rmdir /s /q node_modules
del package-lock.json

# Reinstall all dependencies
npm install
```

#### Step 2: Verify Expo Installation
```bash
npm list expo
```

**Expected output**:
```
constructionerpmobile@1.0.0
└── expo@54.0.33
```

#### Step 3: Clear Expo Cache
```bash
npx expo start --clear
```

### Option 3: If Still Not Working

#### Install Expo Explicitly
```bash
npm install expo@~54.0.33
```

#### Install Expo CLI Globally (Optional)
```bash
npm install -g expo-cli
```

---

## Common Issues & Solutions

### Issue 1: "expo is not recognized"
**Solution**: Install Expo CLI globally
```bash
npm install -g expo-cli
```

### Issue 2: "Module not found: expo"
**Solution**: Reinstall expo
```bash
npm install expo@~54.0.33 --save
```

### Issue 3: Cache issues
**Solution**: Clear all caches
```bash
# Clear npm cache
npm cache clean --force

# Clear Expo cache
npx expo start --clear

# Clear Metro bundler cache
npx react-native start --reset-cache
```

### Issue 4: Version mismatch
**Solution**: Check and fix versions
```bash
# Check current versions
npm list expo
npm list react-native

# Update to compatible versions
npm install expo@~54.0.33
npm install react-native@0.81.5
```

---

## Verification Steps

### 1. Check Expo Installation
```bash
npm list expo
```
Should show: `expo@54.0.33`

### 2. Check React Native Installation
```bash
npm list react-native
```
Should show: `react-native@0.81.5`

### 3. Check Node Modules
```bash
dir node_modules\expo
```
Should show the expo directory exists

### 4. Start Expo
```bash
npx expo start --clear
```
Should start without errors

---

## After Fix - Start the App

### Start Development Server
```bash
npx expo start --clear
```

### Options:
- Press `a` - Open on Android emulator
- Press `i` - Open on iOS simulator
- Press `w` - Open in web browser
- Scan QR code with Expo Go app on your phone

---

## Project Configuration

Your project is configured with:
- **Expo SDK**: 54.0.33
- **React**: 19.1.0
- **React Native**: 0.81.5
- **TypeScript**: 5.9.2

All dependencies are compatible with these versions.

---

## Troubleshooting

### If you see "Cannot find module 'expo'"
```bash
cd moile/ConstructionERPMobile
npm install
```

### If you see "Expo SDK version mismatch"
```bash
npx expo install --fix
```

### If you see "Metro bundler error"
```bash
npx expo start --clear --reset-cache
```

### If nothing works
```bash
# Nuclear option - complete reinstall
rmdir /s /q node_modules
del package-lock.json
npm cache clean --force
npm install
npx expo start --clear
```

---

## Quick Commands Reference

```bash
# Install dependencies
npm install

# Start Expo (clear cache)
npx expo start --clear

# Start on Android
npx expo start --android

# Start on iOS
npx expo start --ios

# Start on Web
npx expo start --web

# Clear all caches
npx expo start --clear --reset-cache

# Check for issues
npx expo doctor

# Fix dependencies
npx expo install --fix
```

---

## Expected Output After Fix

When you run `npx expo start --clear`, you should see:

```
Starting Metro Bundler
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
› Press ? │ show all commands
```

---

## Still Having Issues?

1. Check Node.js version:
   ```bash
   node --version
   ```
   Should be v18 or higher

2. Check npm version:
   ```bash
   npm --version
   ```
   Should be v9 or higher

3. Update npm if needed:
   ```bash
   npm install -g npm@latest
   ```

4. Check if you're in the correct directory:
   ```bash
   cd moile/ConstructionERPMobile
   dir package.json
   ```

5. Verify package.json has expo:
   ```bash
   type package.json | findstr "expo"
   ```
   Should show: `"expo": "~54.0.33"`
