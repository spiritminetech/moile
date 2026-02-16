# Quick Start Testing Guide - Today's Task Features

## 🚀 Quick Setup (5 minutes)

### 1. Get Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Maps SDK for Android" and "Maps SDK for iOS"
4. Create API key in Credentials section
5. Copy the API key

### 2. Configure App
Edit `ConstructionERPMobile/app.json`:
```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_API_KEY_HERE"
        }
      }
    },
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

### 3. Rebuild App
```bash
cd ConstructionERPMobile
npx expo prebuild --clean
npm run android  # or npm run ios
```

## 🧪 Testing Checklist

### Test 1: Map Display (2 minutes)
1. Login as worker
2. Go to "Today's Tasks"
3. Tap any task card
4. Tap "View on Map" button
5. ✅ Map should display with:
   - Red marker at project location
   - Circle showing geofence
   - Your blue dot location
   - Distance information

### Test 2: Map Navigation (1 minute)
1. On map screen, tap map type button (🛰️/🗺️)
2. ✅ Map should toggle between standard and satellite view
3. Tap "Navigate to Site" button
4. ✅ Native maps app should open with directions

### Test 3: Instruction Acknowledgment (3 minutes)
1. Find a task with supervisor instructions
2. Read the instructions
3. Tap checkbox "I have read and understood"
4. ✅ Checkbox should turn green with checkmark
5. Tap "Acknowledge Instructions" button
6. ✅ Confirmation dialog should appear
7. Tap "I Understand"
8. ✅ Green badge should show "Acknowledged on [date]"

### Test 4: Project Information (1 minute)
1. View any task card
2. ✅ Should see project info section with:
   - Project code and name
   - Site name
   - Nature of work
   - Client name (if available)

## 🐛 Common Issues

### Issue: Map not displaying
**Solution**: 
- Check API key is correct in app.json
- Rebuild app with `npx expo prebuild --clean`
- Ensure location permissions granted

### Issue: "View on Map" button not working
**Solution**:
- Check task has `projectGeofence` data
- Check navigation prop passed to TaskCard
- Check console for errors

### Issue: Acknowledgment not saving
**Solution**:
- Check backend API endpoints exist:
  - POST `/worker/tasks/:id/instructions/read`
  - POST `/worker/tasks/:id/instructions/acknowledge`
- Check network connection
- Check console for API errors

### Issue: Distance showing as null
**Solution**:
- Enable location services on device
- Grant location permissions to app
- Wait for GPS to acquire location

## 📱 Test Data Requirements

### Backend Test Data Needed
```javascript
// Task with all new fields
{
  assignmentId: 1,
  taskName: "Install Electrical Wiring",
  projectCode: "PROJ-001",
  projectName: "Downtown Office Complex",
  siteName: "Building A - 3rd Floor",
  natureOfWork: "Electrical Installation",
  clientName: "ABC Corporation",
  supervisorInstructions: "Follow safety protocols. Wear PPE at all times.",
  instructionAttachments: [
    { id: 1, filename: "safety-guide.pdf", url: "..." }
  ],
  instructionReadStatus: null, // or { hasRead: true, acknowledgedAt: "..." }
  projectGeofence: {
    latitude: 1.3521,
    longitude: 103.8198,
    radius: 100,
    strictMode: true,
    allowedVariance: 10
  }
}
```

## ⚡ Quick Test Script

Run this to test all features in sequence:

```bash
# 1. Start backend
cd backend
npm start

# 2. Start mobile app (in new terminal)
cd ConstructionERPMobile
npm start

# 3. Open on device
# Scan QR code with Expo Go app

# 4. Test sequence:
# - Login as worker
# - View Today's Tasks
# - Tap task → View on Map
# - Toggle map type
# - Tap Navigate
# - Go back
# - Read instructions
# - Check acknowledgment box
# - Acknowledge instructions
# - Verify green badge appears
```

## 📊 Success Criteria

All features working correctly when:
- ✅ Map displays with correct location
- ✅ Geofence circle shows correct radius
- ✅ Distance calculates accurately
- ✅ Navigation opens native maps
- ✅ Instruction checkbox works
- ✅ Acknowledgment saves to backend
- ✅ Acknowledgment badge displays
- ✅ Project info shows all fields
- ✅ Back navigation works smoothly

## 🎯 Performance Targets

- Map loads in < 2 seconds
- Distance updates in real-time
- Acknowledgment saves in < 1 second
- Smooth 60fps map interactions
- No memory leaks during navigation

## 📞 Support

If issues persist:
1. Check console logs for errors
2. Verify backend API responses
3. Test on different device
4. Check network connectivity
5. Review implementation docs

---

**Estimated Testing Time**: 10-15 minutes  
**Prerequisites**: Google Maps API key, Backend running, Test data loaded  
**Device**: Physical device recommended (GPS required)
