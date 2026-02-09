# Driver Data Insertion Script

## Overview
This script inserts complete test data for **Driver ID: 50** and **Employee ID: 50** into the MongoDB database. It covers all driver screens in the mobile app.

## Driver Credentials
- **Email**: `driver1@gmail.com`
- **Password**: `Anbu24@`
- **Driver ID**: `50`
- **Employee ID**: `50`

---

## What Data Gets Inserted?

### 1. **Driver User Account**
- Name: John Driver
- Email: driver1@gmail.com
- Password: Anbu24@ (hashed)
- Role: DRIVER
- Phone: +1234567890
- Employee ID: EMP50
- Company: ABC Construction Ltd

### 2. **Vehicle Assignment**
- Registration No: ABC-1234
- Type: Van
- Capacity: 12 passengers
- Fuel Type: Diesel
- Assigned to Driver ID: 50
- Fuel Level: 75%
- Mileage: 45,000 km
- Insurance Expiry: 2024-12-31
- Road Tax Expiry: 2024-12-31

### 3. **Transport Tasks (Today)**
- **Task 1**: Dormitory A → Site Alpha (07:00-08:00, 10 passengers)
- **Task 2**: Dormitory B → Site Alpha (07:30-08:30, 8 passengers)
- **Task 3**: Site Alpha → Dormitory A (17:00-18:00, 10 passengers)

### 4. **Attendance Records**
- **Today**: Checked in at 7:00 AM (not checked out yet)
- **Past 7 days**: Complete attendance records (7:00 AM - 5:00 PM, 10 hours each)

### 5. **Trip History**
- **Past 10 days**: Complete trip records
- Total distance: 45-65 km per day
- Fuel used: 8.5-13.5 liters per day
- Workers transported: 18 per day
- Some trips include delays (traffic jams)

### 6. **Maintenance Alerts**
- **Alert 1**: Scheduled Service (due in 15 days, MEDIUM severity)
- **Alert 2**: Insurance Renewal (due in 30 days, HIGH severity)
- **Alert 3**: Tire Replacement (due in 45 days, LOW severity)

### 7. **Driver License**
- License Number: DL-2024-123456
- Class: Commercial
- Issue Date: 2020-01-15
- Expiry Date: 2025-01-15
- Issuing Authority: State Transport Authority

---

## Prerequisites

### 1. MongoDB Running
Ensure MongoDB is running on your system:

```bash
# Check if MongoDB is running
mongosh

# Or start MongoDB service
# Windows:
net start MongoDB

# macOS:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod
```

### 2. Backend Dependencies Installed
```bash
cd moile/backend
npm install
```

---

## How to Run

### Method 1: Using npm script (Recommended)
```bash
cd moile/backend
npm run insert:driver-data
```

### Method 2: Direct node execution
```bash
cd moile/backend
node scripts/insert-driver-data.js
```

### Method 3: With custom MongoDB URI
```bash
cd moile/backend
MONGODB_URI="mongodb://localhost:27017/your_database" node scripts/insert-driver-data.js
```

---

## Expected Output

```
🚀 Starting Driver Data Insertion Script...
📧 Driver Email: driver1@gmail.com
🔑 Driver ID: 50
👤 Employee ID: 50
────────────────────────────────────────────────────────────
✅ Connected to MongoDB

📝 Inserting Driver User...
✅ Driver user inserted: driver1@gmail.com

🚗 Inserting Vehicle...
✅ Vehicle inserted: ABC-1234

🚛 Inserting Transport Tasks...
✅ Transport task inserted: Dormitory A → Site Alpha
✅ Transport task inserted: Dormitory B → Site Alpha
✅ Transport task inserted: Site Alpha → Dormitory A

⏰ Inserting Attendance Records...
✅ Today's attendance inserted
✅ Past 7 days attendance inserted

🗺️ Inserting Trip Records...
✅ Past 10 days trip records inserted

🔧 Inserting Maintenance Alerts...
✅ Maintenance alert inserted: Scheduled Service
✅ Maintenance alert inserted: Insurance Renewal
✅ Maintenance alert inserted: Tire Replacement

📄 Inserting Driver License...
✅ Driver license inserted: DL-2024-123456

────────────────────────────────────────────────────────────
✅ All driver data inserted successfully!

📊 Summary:
  • Driver User: 1
  • Vehicle: 1
  • Transport Tasks: 3 (today)
  • Attendance Records: 8 (today + 7 days history)
  • Trip Records: 10 (past 10 days)
  • Maintenance Alerts: 3
  • Driver License: 1

🎉 You can now login with:
   Email: driver1@gmail.com
   Password: Anbu24@
────────────────────────────────────────────────────────────

👋 Database connection closed
```

---

## Verify Data Insertion

### Using MongoDB Shell
```bash
mongosh

use construction_erp

# Check driver user
db.users.findOne({ id: 50 })

# Check vehicle
db.vehicles.findOne({ assignedDriverId: 50 })

# Check transport tasks
db.transporttasks.find({ driverId: 50 }).pretty()

# Check attendance
db.attendances.find({ employeeId: 50 }).sort({ date: -1 }).limit(5)

# Check trip records
db.triprecords.find({ driverId: 50 }).sort({ date: -1 }).limit(5)

# Check maintenance alerts
db.maintenancealerts.find({ vehicleId: 101 }).pretty()

# Check driver license
db.driverlicenses.findOne({ driverId: 50 })
```

### Using MongoDB Compass
1. Connect to `mongodb://localhost:27017`
2. Select database: `construction_erp`
3. Browse collections:
   - `users` → Find document with `id: 50`
   - `vehicles` → Find document with `assignedDriverId: 50`
   - `transporttasks` → Find documents with `driverId: 50`
   - `attendances` → Find documents with `employeeId: 50`
   - `triprecords` → Find documents with `driverId: 50`
   - `maintenancealerts` → Find documents with `vehicleId: 101`
   - `driverlicenses` → Find document with `driverId: 50`

---

## Test in Mobile App

### 1. Start Backend Server
```bash
cd moile/backend
npm start
```

### 2. Start Mobile App
```bash
cd moile/ConstructionERPMobile
npm start
```

### 3. Login
- Email: `driver1@gmail.com`
- Password: `Anbu24@`

### 4. Verify Each Screen

#### Dashboard Screen
- ✅ Should show 3 transport tasks for today
- ✅ Should show assigned vehicle: ABC-1234
- ✅ Should show performance metrics

#### Transport Tasks Screen
- ✅ Should list 3 tasks:
  - Dormitory A → Site Alpha (07:00-08:00)
  - Dormitory B → Site Alpha (07:30-08:30)
  - Site Alpha → Dormitory A (17:00-18:00)
- ✅ Each task should show status: PLANNED
- ✅ Should show passenger counts

#### Attendance Screen
- ✅ Should show today's check-in at 7:00 AM
- ✅ Should show "Checked In" status
- ✅ Should show past 7 days attendance history
- ✅ Each past day should show 10 hours worked

#### Trip Updates Screen
- ✅ Should show past 10 days trip history
- ✅ Each trip should show:
  - Date
  - Distance (45-65 km)
  - Fuel used (8.5-13.5 L)
  - Workers transported (18)
  - Status: COMPLETED
- ✅ Some trips should show delays

#### Vehicle Info Screen
- ✅ Should show vehicle: ABC-1234
- ✅ Should show vehicle type: Van
- ✅ Should show capacity: 12 passengers
- ✅ Should show fuel level: 75%
- ✅ Should show 3 maintenance alerts:
  - Scheduled Service (MEDIUM)
  - Insurance Renewal (HIGH)
  - Tire Replacement (LOW)

#### Profile Screen
- ✅ Should show driver name: John Driver
- ✅ Should show email: driver1@gmail.com
- ✅ Should show phone: +1234567890
- ✅ Should show employee ID: EMP50
- ✅ Should show license number: DL-2024-123456
- ✅ Should show license expiry: 2025-01-15

---

## Troubleshooting

### Error: "Cannot connect to MongoDB"
**Solution**: Ensure MongoDB is running
```bash
# Check MongoDB status
mongosh

# Start MongoDB if not running
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### Error: "Module not found"
**Solution**: Install dependencies
```bash
cd moile/backend
npm install
```

### Error: "Duplicate key error"
**Solution**: Data already exists. Clear existing data first:
```bash
mongosh

use construction_erp

# Remove existing driver data
db.users.deleteOne({ id: 50 })
db.vehicles.deleteOne({ assignedDriverId: 50 })
db.transporttasks.deleteMany({ driverId: 50 })
db.attendances.deleteMany({ employeeId: 50 })
db.triprecords.deleteMany({ driverId: 50 })
db.maintenancealerts.deleteMany({ vehicleId: 101 })
db.driverlicenses.deleteOne({ driverId: 50 })

# Then run the script again
```

### Error: "bcrypt/bcryptjs not found"
**Solution**: Install bcrypt
```bash
cd moile/backend
npm install bcryptjs
```

---

## Re-running the Script

The script uses `findOneAndUpdate` with `upsert: true`, so it's safe to run multiple times. It will:
- **Update** existing records if they exist
- **Insert** new records if they don't exist

To completely reset and re-insert:
```bash
# 1. Clear existing data
mongosh
use construction_erp
db.users.deleteOne({ id: 50 })
db.vehicles.deleteOne({ assignedDriverId: 50 })
db.transporttasks.deleteMany({ driverId: 50 })
db.attendances.deleteMany({ employeeId: 50 })
db.triprecords.deleteMany({ driverId: 50 })
db.maintenancealerts.deleteMany({ vehicleId: 101 })
db.driverlicenses.deleteOne({ driverId: 50 })
exit

# 2. Run script again
cd moile/backend
npm run insert:driver-data
```

---

## Customization

### Change Driver Credentials
Edit `moile/backend/scripts/insert-driver-data.js`:
```javascript
const DRIVER_EMAIL = 'your-email@example.com';
const DRIVER_PASSWORD = 'YourPassword123';
const DRIVER_ID = 50;
const EMPLOYEE_ID = 50;
```

### Change MongoDB Connection
```bash
# Set environment variable
export MONGODB_URI="mongodb://localhost:27017/your_database"

# Or edit the script
const MONGODB_URI = 'mongodb://localhost:27017/your_database';
```

### Add More Data
Edit the script to add more:
- Transport tasks
- Attendance records
- Trip history
- Maintenance alerts

---

## Next Steps

After running this script:

1. ✅ **Start Backend**: `cd moile/backend && npm start`
2. ✅ **Start Mobile App**: `cd moile/ConstructionERPMobile && npm start`
3. ✅ **Login**: Use `driver1@gmail.com` / `Anbu24@`
4. ✅ **Test All Screens**: Verify data appears correctly
5. ✅ **Implement Dynamic Data Service**: Follow `DRIVER_DYNAMIC_DATA_IMPLEMENTATION_GUIDE.md`

---

## Support

For issues:
1. Check MongoDB is running
2. Check backend server is running
3. Verify data in MongoDB using `mongosh` or Compass
4. Check console logs for errors
5. Review backend API logs

---

## Summary

This script provides a complete, ready-to-use dataset for testing all driver functionality in the mobile app. Simply run the script, start your servers, and login to see all screens populated with realistic data! 🚀
