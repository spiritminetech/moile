# Set Project Location to Your Current Location

This guide helps you update the project geofence to match your current GPS coordinates, so you can start tasks from wherever you are.

## 🎯 Quick Steps

### Step 1: Get Your Current Coordinates

1. Open your mobile app
2. Go to "Today's Tasks" screen
3. Look at the **"📍 LOCATION STATUS"** section at the top
4. Note down your coordinates:
   ```
   Your Current Location:
   📍 Lat: 12.971600
   📍 Lng: 77.594600
   ```

### Step 2: Update the Script

1. Open `backend/quick-set-my-location.js`
2. Find these lines (around line 18-19):
   ```javascript
   const MY_LATITUDE = 12.9716;   // 👈 CHANGE THIS
   const MY_LONGITUDE = 77.5946;  // 👈 CHANGE THIS
   ```
3. Replace with YOUR coordinates from Step 1

### Step 3: Run the Script

```bash
cd backend
node quick-set-my-location.js
```

### Step 4: Reload Your App

1. Close and reopen your mobile app
2. Go to "Today's Tasks"
3. Check the location comparison - you should now see:
   - ✅ INSIDE badge (green)
   - Distance: 0m or very small
4. The "Start Task" button should now be enabled!

## 📋 What This Does

The script updates ALL projects in your database to use your current location as their geofence center. This means:

- ✅ All tasks will be "inside geofence" when you're at your current location
- ✅ You can start any task without moving
- ✅ Perfect for testing and development

## 🔧 Alternative: Update Specific Project Only

If you want to update only ONE project instead of all:

1. Open `backend/set-project-to-my-location.js`
2. Edit your coordinates (same as above)
3. The script will show you all projects and update them all
4. Run: `node set-project-to-my-location.js`

## 📍 How to Get Coordinates from Google Maps

If you want to use a different location:

1. Open Google Maps on your computer
2. Right-click on the location you want
3. Click the coordinates at the top (e.g., "12.9716, 77.5946")
4. The coordinates are copied to your clipboard
5. Paste them into the script

## ✅ Verification

After running the script, you should see:

```
✅ Updated 2 projects

📋 Updated Projects:

1. Project 1003
   Location: 12.9716, 77.5946
   Radius: 100m

2. Bangalore Office
   Location: 12.9716, 77.5946
   Radius: 100m

✅ DONE! You can now start tasks from your location!
```

## 🎯 Testing

1. Open mobile app
2. Go to "Today's Tasks"
3. Look at the location comparison:
   - Your location should match project location
   - Distance should be 0m or very small
   - Badge should show "✅ INSIDE"
4. Try to start a task - button should be enabled!

## 🔄 Resetting to Original Location

If you want to set it back to the original project location later, you'll need to know the original coordinates. Consider noting them down before running the script!

## 💡 Pro Tip

For testing, you can set the radius to a larger value (e.g., 500m) so you have more flexibility:

```javascript
const GEOFENCE_RADIUS = 500;  // 500 meters
```

This gives you a bigger area where you can start tasks.
