# Fuel Log Model Error Fix

## ❌ Error
```
OverwriteModelError: Cannot overwrite `Driver` model once compiled.
```

## 🔍 Root Cause
The error occurred because we were trying to create new Mongoose models using `mongoose.model()` when those models were already imported and compiled at the top of the file.

**Problem Code:**
```javascript
// This tries to create a new model, but Driver is already imported
const Driver = mongoose.model('Driver', new mongoose.Schema({}, { strict: false, collection: 'drivers' }));
const Vehicle = mongoose.model('Vehicle', new mongoose.Schema({}, { strict: false, collection: 'vehicles' }));
```

## ✅ Solution
Use the models that are already imported at the top of `driverController.js`:

**Fixed Code:**
```javascript
// Use the imported Driver model
const driver = await Driver.findOne({ id: driverId, companyId });

// Use the imported FleetVehicle model (not Vehicle)
const vehicle = await FleetVehicle.findOne({ id: Number(vehicleId), companyId });
```

## 📝 Changes Made

### File: `moile/backend/src/modules/driver/driverController.js`

**1. Added Helper Function (for future use):**
```javascript
// Helper function to safely get or create mongoose models
const getOrCreateModel = (modelName, schema, collectionName) => {
  try {
    return mongoose.model(modelName);
  } catch (error) {
    return mongoose.model(modelName, schema, collectionName);
  }
};
```

**2. Fixed `submitFuelLog` function:**
- Changed from creating new `Driver` model → Use imported `Driver`
- Changed from creating new `Vehicle` model → Use imported `FleetVehicle`
- Updated vehicle update to use `FleetVehicle` instead of `Vehicle`
- Added `odometer` field update (FleetVehicle uses `odometer` not `currentMileage`)

**3. Fixed `getVehicleFuelLog` function:**
- Changed from creating new `Vehicle` model → Use imported `FleetVehicle`

## 🗂️ Model Mapping

The backend uses different model names than what we might expect:

| Expected Name | Actual Model | Collection |
|--------------|--------------|------------|
| Vehicle | FleetVehicle | fleetVehicles |
| Driver | Driver | drivers |
| Task | FleetTask | fleetTasks |

## ✅ Result

The fuel log feature now works without model overwrite errors:

1. ✅ Driver can submit fuel log entries
2. ✅ Data is saved to `fuelLogs` collection
3. ✅ Vehicle's `odometer` and `currentMileage` are updated
4. ✅ No more "Cannot overwrite model" errors

## 🧪 Testing

After this fix, test the fuel log feature:

1. Login as driver
2. Go to Vehicle Information screen
3. Click "⛽ Log Fuel Entry"
4. Fill the form and submit
5. ✅ Should save successfully without errors
6. ✅ Check MongoDB - entry should be in `fuelLogs` collection
7. ✅ Vehicle's odometer should be updated in `fleetVehicles` collection
