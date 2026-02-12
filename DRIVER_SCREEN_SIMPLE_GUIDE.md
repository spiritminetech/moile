# Driver App - Simple Guide (What Happens When You Click)

This guide explains what happens behind the scenes when you use the driver app - in simple, everyday language.

---

## 📱 1. DASHBOARD - Your Home Screen

### When you open the app and see your dashboard:

**What you see:**
- Your name and photo
- Today's trips count
- Number of passengers
- Your vehicle details

**What happens behind the scenes:**
1. App checks who you are (your driver ID)
2. App looks up your trips scheduled for today
3. App counts how many passengers you need to pick up
4. App finds which vehicle is assigned to you
5. App shows all this information on your screen

**Where this information comes from:**
- Your trips → Stored in "Trip Records"
- Passenger count → Stored in "Passenger List"
- Vehicle info → Stored in "Vehicle Records"
- Your details → Stored in "Employee Records"

---

## 🚌 2. TODAY'S TRIPS - Viewing Your Transport Tasks

### When you tap "View Today's Tasks":

**What you see:**
- List of all your trips for today
- Pickup and drop locations
- Number of workers to transport
- Trip status (Planned, Ongoing, Completed)

**What happens behind the scenes:**
1. App asks: "Show me all trips for this driver today"
2. System finds all your scheduled trips
3. For each trip, system gets:
   - Which project it's for
   - Which vehicle you're using
   - How many workers are assigned
   - Where to pick them up
   - Where to drop them off
4. App displays everything in a list

**Where this information comes from:**
- Trip details → Stored in "Trip Records"
- Project names → Stored in "Project Records"
- Vehicle numbers → Stored in "Vehicle Records"
- Worker count → Stored in "Passenger List"

---

## 🚦 3. STARTING YOUR ROUTE

### When you tap "Start Route":

**What you see:**
- Confirmation message
- Route navigation starts

**What happens behind the scenes:**
1. App checks your GPS location
2. App verifies: "Is driver at the depot/approved location?"
3. App checks: "Has driver clocked in for work today?"
4. If everything is OK:
   - Trip status changes from "Planned" to "Ongoing"
   - Start time is recorded
   - Your location is saved
5. If something is wrong:
   - App shows error message (e.g., "You must clock in first")

**Where this information is saved:**
- Trip status → Updated in "Trip Records"
- Start time → Saved in "Trip Records"
- Your location → Saved in "Trip Records"

**What gets checked:**
- Your attendance → Checked in "Attendance Records"
- Your location → Checked against "Approved Locations"

---

## 👥 4. VIEWING WORKER LIST

### When you tap "View Workers" or "Worker Manifest":

**What you see:**
- List of all workers you need to pick up
- Worker names, room numbers, phone numbers
- Status: "Checked In" or "Pending"

**What happens behind the scenes:**
1. App asks: "Who are the passengers for this trip?"
2. System finds all workers assigned to your trip
3. For each worker, system gets:
   - Full name
   - Employee ID
   - Room number
   - Phone number
   - Department
4. System checks: "Has this worker already clocked in today?"
5. App shows green badge if checked in, gray if pending

**Where this information comes from:**
- Worker assignments → Stored in "Passenger List"
- Worker details → Stored in "Employee Records"
- Check-in status → Checked in "Attendance Records"

---

## ✅ 5. CHECKING IN A WORKER

### When you tap "Check In" next to a worker's name:

**What you see:**
- Worker's status changes to "Checked In"
- Green checkmark appears

**What happens behind the scenes:**
1. App records current time
2. App records your GPS location
3. System updates worker's pickup status to "Confirmed"
4. System creates/updates worker's attendance record:
   - Records check-in time
   - Records GPS location
   - Marks worker as present for work
5. Supervisor gets notified that worker has boarded

**Where this information is saved:**
- Pickup status → Updated in "Passenger List"
- Attendance record → Created/Updated in "Attendance Records"
- Check-in time → Saved in "Attendance Records"
- GPS location → Saved in "Attendance Records"

---

## 📸 6. COMPLETING PICKUP

### When you tap "Complete Pickup":

**What you see:**
- Camera opens to take photo
- Confirmation message
- Trip status changes

**What happens behind the scenes:**
1. App asks you to take a photo (proof of pickup)
2. App records:
   - How many workers you picked up
   - Current time
   - Your GPS location
3. System checks: "Are all pickups done for this trip?"
4. If yes:
   - Trip status changes to "Pickup Complete"
   - System records actual pickup time
5. Photo is uploaded and saved
6. Supervisor gets notification

**Where this information is saved:**
- Trip status → Updated in "Trip Records"
- Pickup time → Saved in "Trip Records"
- Photo → Uploaded to storage
- Worker count → Saved in "Trip Records"

---

## 🏗️ 7. COMPLETING DROP-OFF

### When you tap "Complete Drop-off":

**What you see:**
- Camera opens to take photo
- Confirmation message
- Trip marked as "Completed"

**What happens behind the scenes:**
1. App asks you to take a photo (proof of drop-off)
2. App records:
   - How many workers you dropped off
   - Current time
   - Your GPS location
3. System updates:
   - Trip status changes to "Completed"
   - Records actual end time
   - Calculates total trip duration
4. For each worker:
   - Drop-off status marked as "Confirmed"
   - Workers can now submit their own attendance
5. Photo is uploaded and saved
6. Supervisor gets notification

**Where this information is saved:**
- Trip status → Updated in "Trip Records"
- End time → Saved in "Trip Records"
- Photo → Uploaded to storage
- Drop-off status → Updated in "Passenger List"

---

## 🕐 8. CLOCKING IN FOR WORK

### When you tap "Clock In":

**What you see:**
- Current time displayed
- GPS location shown
- "Clocked In Successfully" message

**What happens behind the scenes:**
1. App gets your current GPS location
2. App checks: "Is driver at approved location (depot/office)?"
3. If location is OK:
   - System creates attendance record for you
   - Records check-in time
   - Records GPS location
   - Marks you as "on duty"
4. If location is wrong:
   - App shows error: "You must be at depot to clock in"

**Where this information is saved:**
- Attendance record → Created in "Attendance Records"
- Check-in time → Saved in "Attendance Records"
- GPS location → Saved in "Attendance Records"

**Why this matters:**
- You cannot start routes without clocking in first
- Your work hours are tracked for payroll
- System knows you're available for trips

---

## 🕐 9. CLOCKING OUT

### When you tap "Clock Out":

**What you see:**
- Total hours worked displayed
- Regular hours and overtime shown
- "Clocked Out Successfully" message

**What happens behind the scenes:**
1. App gets your current GPS location
2. App records clock-out time
3. System calculates:
   - Total time worked (clock-out minus clock-in)
   - Regular hours (usually 8 hours)
   - Overtime hours (if you worked more than 8 hours)
4. System updates your attendance record
5. Marks you as "off duty"

**Where this information is saved:**
- Clock-out time → Saved in "Attendance Records"
- Total hours → Calculated and saved in "Attendance Records"
- Overtime → Saved in "Attendance Records"

---

## 🚗 10. VIEWING VEHICLE INFORMATION

### When you tap "Vehicle Info":

**What you see:**
- Vehicle plate number
- Vehicle model and type
- Fuel level
- Mileage
- Insurance expiry
- Maintenance alerts

**What happens behind the scenes:**
1. App finds which vehicle is assigned to you today
2. System looks up complete vehicle information:
   - Registration details
   - Current fuel level
   - Current mileage (odometer reading)
   - Insurance expiry date
   - Last service date
3. System checks for alerts:
   - Insurance expiring soon?
   - Service due soon?
   - High mileage?
4. App displays everything with color-coded alerts

**Where this information comes from:**
- Vehicle assignment → Found in "Trip Records"
- Vehicle details → Stored in "Vehicle Records"
- Maintenance info → Stored in "Vehicle Records"

---

## 📊 11. VIEWING TRIP HISTORY

### When you tap "Trip History":

**What you see:**
- List of past completed trips
- Dates, routes, passenger counts
- Actual times vs scheduled times

**What happens behind the scenes:**
1. App asks: "Show me all completed trips for this driver"
2. You can select date range (last week, last month, etc.)
3. System finds all your completed trips in that period
4. For each trip, system gets:
   - Date and time
   - Route (pickup and drop locations)
   - Number of passengers
   - Actual start and end times
   - Project name
5. App displays trips in order (newest first)

**Where this information comes from:**
- Trip history → Stored in "Trip Records"
- Project names → Stored in "Project Records"
- Passenger counts → Stored in "Passenger List"

---

## 👤 12. VIEWING YOUR PROFILE

### When you tap "Profile":

**What you see:**
- Your photo and name
- Employee ID
- License details
- Contact information
- Assigned vehicles

**What happens behind the scenes:**
1. System looks up your complete profile:
   - Personal information
   - Employment details
   - License information
   - Contact details
2. System finds vehicles assigned to you
3. System calculates your performance:
   - Total trips completed
   - On-time performance
   - Safety record

**Where this information comes from:**
- Personal details → Stored in "Employee Records"
- License info → Stored in "Driver Records"
- Vehicle assignments → Stored in "Vehicle Records"
- Performance data → Calculated from "Trip Records"

---

## 🔔 NOTIFICATIONS - What Triggers Them

### You receive notifications when:

1. **New trip assigned**
   - System creates new trip for you
   - Notification sent to your phone

2. **Trip time approaching**
   - System checks time
   - Sends reminder 30 minutes before trip

3. **Worker checked in**
   - Worker clocks in at site
   - You get notification they're ready

4. **Supervisor sends message**
   - Supervisor types message
   - System sends to your app immediately

5. **Vehicle maintenance due**
   - System checks vehicle service dates
   - Sends alert if maintenance needed

---

## 📍 GPS AND LOCATION - How It Works

### Why app needs your location:

1. **Clock In/Out**
   - Verifies you're at depot/approved location
   - Prevents fake clock-ins from home

2. **Start Route**
   - Confirms you're at starting point
   - Records where trip began

3. **Worker Check-In**
   - Records where worker boarded
   - Proves pickup happened at correct location

4. **Complete Pickup/Drop-off**
   - Confirms you're at correct location
   - Creates proof of service

5. **Safety**
   - Supervisor can see where you are
   - Helps in emergencies

**What gets saved:**
- GPS coordinates (latitude, longitude)
- Accuracy (how precise the location is)
- Timestamp (when location was recorded)

---

## ⚠️ ERROR MESSAGES - What They Mean

### "You must clock in first"
- **What happened:** You tried to start route without clocking in
- **What to do:** Go to Attendance screen and clock in

### "You must be at approved location"
- **What happened:** Your GPS shows you're not at depot
- **What to do:** Drive to depot or approved starting point

### "Cannot start route - trip already started"
- **What happened:** Trip status is already "Ongoing"
- **What to do:** Check if you already started this trip

### "All workers must be checked in"
- **What happened:** You tried to complete pickup but some workers not checked in
- **What to do:** Check in all workers first

### "GPS accuracy too low"
- **What happened:** Your phone's GPS signal is weak
- **What to do:** Move to open area, wait for better signal

---

## 💾 DATA STORAGE - Where Everything is Kept

Think of the system like a filing cabinet with different drawers:

**Trip Records Drawer:**
- All your trips (past, present, future)
- Trip status, times, locations
- Photos you took

**Passenger List Drawer:**
- Which workers assigned to which trip
- Check-in/check-out status
- Pickup and drop locations

**Vehicle Records Drawer:**
- All vehicle information
- Maintenance history
- Current assignments

**Employee Records Drawer:**
- Your personal information
- All workers' information
- Contact details

**Attendance Records Drawer:**
- Everyone's clock-in/clock-out times
- Work hours
- GPS locations

**Project Records Drawer:**
- All construction projects
- Project locations
- Assigned workers

**Approved Locations Drawer:**
- Depot locations
- Construction sites
- Geofence boundaries

---

## 🔄 REAL-TIME UPDATES

### How information stays current:

**When you check in a worker:**
1. Your app updates immediately (green checkmark)
2. Information sent to server
3. Supervisor's app updates automatically
4. Worker's app updates (shows "checked in")

**When supervisor assigns new trip:**
1. Supervisor creates trip in their app
2. Information saved to server
3. Your app receives notification
4. New trip appears in your task list

**When you complete trip:**
1. Your app marks trip complete
2. Information sent to server
3. Supervisor sees completion
4. Workers can now submit attendance
5. Trip moves to history

---

## 🔐 SECURITY AND PRIVACY

### What the system protects:

**Your Information:**
- Only you and supervisors can see your trips
- Your location only tracked during work hours
- Personal details kept confidential

**Worker Information:**
- You only see workers assigned to your trips
- Cannot access other drivers' passenger lists
- Worker contact info protected

**GPS Tracking:**
- Only recorded during active trips
- Used for work verification only
- Not tracked during off-hours

---

## 📱 OFFLINE MODE

### What happens if internet connection lost:

**You can still:**
- View trips already loaded
- See worker list
- Take photos

**You cannot:**
- Start new routes
- Check in workers
- Complete pickups/drop-offs
- Clock in/out

**When connection returns:**
- App automatically syncs
- Pending actions are processed
- Data is updated

---

## ⏱️ TIMING AND SCHEDULES

### How the system tracks time:

**Scheduled Times:**
- Set by office/supervisor
- Shows when trip should start/end
- Used for planning

**Actual Times:**
- Recorded when you actually start/complete
- Used for payroll and reports
- Compared with scheduled times

**Late/Early:**
- System compares actual vs scheduled
- Calculates delays
- Reports to supervisor

---

## 📞 SUPPORT AND HELP

### If something goes wrong:

**App not working:**
- Check internet connection
- Close and reopen app
- Contact IT support

**Cannot clock in:**
- Check GPS is enabled
- Verify you're at depot
- Contact supervisor

**Trip not showing:**
- Pull down to refresh
- Check date filter
- Contact supervisor

**Worker not in list:**
- Refresh worker manifest
- Check trip details
- Contact supervisor

---

## 🎯 SUMMARY - The Big Picture

**When you use the driver app:**

1. **Everything you do is recorded** - for safety, payroll, and reporting
2. **GPS location is important** - proves you're at right place
3. **Time is tracked automatically** - for accurate work hours
4. **Information is shared** - supervisors and workers see updates
5. **Photos are proof** - documents that work was done
6. **System checks everything** - prevents mistakes and fraud

**The system helps you by:**
- Showing your daily schedule
- Tracking your work hours
- Recording trip completions
- Keeping vehicle information
- Notifying you of changes
- Providing trip history

**Remember:**
- Always clock in before starting routes
- Check in all workers properly
- Take photos at pickup and drop-off
- Complete trips in the app
- Clock out at end of day

---

## 📋 QUICK REFERENCE

| What You Do | What Gets Saved | Where It's Saved |
|-------------|-----------------|------------------|
| Clock In | Check-in time, GPS location | Attendance Records |
| Start Route | Start time, GPS location, trip status | Trip Records |
| Check In Worker | Worker pickup status, time, GPS | Passenger List + Attendance Records |
| Complete Pickup | Photo, worker count, time, GPS | Trip Records |
| Complete Drop-off | Photo, worker count, time, GPS, trip status | Trip Records + Passenger List |
| Clock Out | Clock-out time, total hours, overtime | Attendance Records |
| View Dashboard | Nothing saved (just viewing) | - |
| View Vehicle Info | Nothing saved (just viewing) | - |
| View Trip History | Nothing saved (just viewing) | - |

---

**Remember: The app is your digital logbook - it records everything you do to keep accurate records and ensure everyone's safety!**
