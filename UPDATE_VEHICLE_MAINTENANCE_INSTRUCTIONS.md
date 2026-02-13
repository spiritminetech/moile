# Update Vehicle Maintenance Dates - Instructions

## What This Does

This script updates your vehicle collection in MongoDB to add maintenance date fields:
- `lastServiceDate` - When the vehicle was last serviced
- `nextServiceDate` - When the next service is due
- `lastServiceMileage` - Odometer reading at last service
- `nextServiceMileage` - Odometer reading when next service is due

## How to Run

### Step 1: Navigate to backend folder
```bash
cd moile/backend
```

### Step 2: Run the update script
```bash
node update-vehicle-maintenance-dates.js
```

### Step 3: Verify the output
You should see:
```
✅ Connected to MongoDB
📋 Current vehicle data: ...
✅ Vehicle maintenance dates updated successfully
📋 Updated vehicle data: ...
📅 Service Schedule:
   Last Service: [date] at [mileage] km
   Next Service: [date] at [mileage] km
   Current Mileage: 45,060 km
   Days until next service: 60 days
   KM until next service: 5,000 km
✅ Script completed
✅ MongoDB connection closed
```

## What Gets Updated

For vehicle ID 1 (ABC123):
- **Last Service Date**: 30 days ago
- **Last Service Mileage**: Current odometer - 5000 km = 40,060 km
- **Next Service Date**: 60 days from today
- **Next Service Mileage**: Current odometer + 5000 km = 50,060 km

## After Running the Script

### In the Mobile App:
1. Open Vehicle Information screen
2. Click "📋 View Maintenance History"
3. You should see:
   ```
   🔧 Maintenance Information

   📊 Current Mileage: 45,060 km

   📅 Last Service:
      Date: [30 days ago]
      Mileage: 40,060 km

   📅 Next Service:
      Date: [60 days from now] (60 days)
      Mileage: 50,060 km (5,000 km remaining)
   ```

## Customizing the Dates

If you want different dates, edit the script:

```javascript
// Change these lines in update-vehicle-maintenance-dates.js

// Last service was X days ago
const lastServiceDate = new Date(today);
lastServiceDate.setDate(today.getDate() - 30); // Change 30 to your value

// Next service is in X days
const nextServiceDate = new Date(today);
nextServiceDate.setDate(today.getDate() + 60); // Change 60 to your value

// Last service mileage
lastServiceMileage: vehicle.odometer - 5000, // Change 5000 to your value

// Next service mileage
nextServiceMileage: vehicle.odometer + 5000, // Change 5000 to your value
```

## Troubleshooting

### Error: Cannot find module 'dotenv'
```bash
npm install dotenv
```

### Error: MongoDB connection failed
- Check your `.env` file has correct `MONGODB_URI`
- Make sure MongoDB is running
- Verify connection string is correct

### Error: Vehicle not found
- Check the vehicle ID in the script matches your database
- Verify companyId is correct (currently set to 1)

## Manual Update (Alternative)

If you prefer to update manually in MongoDB Compass or shell:

```javascript
db.fleetvehicles.updateOne(
  { id: 1, companyId: 1 },
  {
    $set: {
      lastServiceDate: new Date("2026-01-14"), // 30 days ago from Feb 13
      nextServiceDate: new Date("2026-04-14"), // 60 days from Feb 13
      lastServiceMileage: 40060,
      nextServiceMileage: 50060,
      updatedAt: new Date()
    }
  }
)
```

## What the Mobile App Shows

After updating, the "View Maintenance History" button will display:

✅ **Current Mileage** - Always shown first (most important)
✅ **Last Service** - Date and mileage when last serviced
✅ **Next Service** - Date and mileage when next service is due
✅ **Days/KM Remaining** - How many days and kilometers until next service
⚠️ **Overdue Warnings** - If service is overdue by date or mileage

## Notes

- The script only updates vehicle with `id: 1` and `companyId: 1`
- To update multiple vehicles, modify the script to loop through all vehicles
- The script is safe to run multiple times (it will just update the dates)
- Original data is preserved (only adds new fields)
