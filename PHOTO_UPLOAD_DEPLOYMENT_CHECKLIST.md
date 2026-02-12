# Photo Upload - Deployment Checklist ✅

## Pre-Deployment Setup

### 1. Backend Setup
```bash
cd moile/backend

# Create upload directories
mkdir -p uploads/pickup
mkdir -p uploads/dropoff

# Set permissions
chmod 755 uploads/pickup
chmod 755 uploads/dropoff

# Verify files exist
ls -la src/modules/driver/photoUploadController.js
ls -la src/modules/driver/driverRoutes.js
ls -la src/modules/fleetTask/models/FleetTask.js
```

**Checklist:**
- [ ] Upload directories created
- [ ] Directory permissions set (755)
- [ ] photoUploadController.js exists
- [ ] driverRoutes.js updated
- [ ] FleetTask.js updated

---

### 2. Start Backend Server
```bash
cd moile/backend
npm start
```

**Verify:**
- [ ] Server starts without errors
- [ ] No module import errors
- [ ] Routes registered correctly
- [ ] Port 5000 listening

**Expected Output:**
```
Server running on port 5000
MongoDB connected
Routes loaded: /api/driver
```

---

### 3. Start Mobile App
```bash
cd moile/ConstructionERPMobile
npm start
# or
expo start
```

**Verify:**
- [ ] Expo starts without errors
- [ ] No import errors
- [ ] QR code displayed
- [ ] Metro bundler running

---

## Testing Phase

### 4. Run Backend Tests (Optional)
```bash
cd moile/backend
node test-photo-upload-endpoints.js
```

**Expected Results:**
- [ ] Login successful
- [ ] Tasks fetched
- [ ] Pickup photo uploaded
- [ ] Dropoff photo uploaded
- [ ] Validation tests passed
- [ ] 4/4 tests passed

---

### 5. Manual Testing - Pickup Photo

**Steps:**
1. [ ] Login as driver
2. [ ] Navigate to Transport Tasks
3. [ ] Select a task
4. [ ] Click "Navigate"
5. [ ] Click "Complete Pickup" for a location
6. [ ] Verify worker count
7. [ ] Choose "Take Photo"
8. [ ] Take photo or select from gallery
9. [ ] Confirm pickup

**Verify:**
- [ ] Photo captured successfully
- [ ] Upload attempt made
- [ ] Success message shown
- [ ] No errors in console

**Console Logs (Frontend):**
```
📤 Uploading pickup photo...
✅ Pickup photo uploaded successfully: /uploads/pickup/...
```

**Console Logs (Backend):**
```
📸 Upload pickup photo for task: 123, location: 1
✅ Pickup photo uploaded successfully: /uploads/pickup/...
```

---

### 6. Manual Testing - Dropoff Photo

**Steps:**
1. [ ] Complete all pickups first
2. [ ] Navigate to dropoff location
3. [ ] Click "Complete Dropoff"
4. [ ] Verify worker count and geofence
5. [ ] Choose "Take Photo"
6. [ ] Take photo or select from gallery
7. [ ] Confirm dropoff

**Verify:**
- [ ] Photo captured successfully
- [ ] Upload attempt made
- [ ] Success message shown
- [ ] No errors in console

---

### 7. Verify File Storage

**Check Upload Directories:**
```bash
cd moile/backend
ls -la uploads/pickup/
ls -la uploads/dropoff/
```

**Verify:**
- [ ] Pickup photos exist
- [ ] Dropoff photos exist
- [ ] File names correct format
- [ ] File sizes reasonable

**Expected Files:**
```
uploads/pickup/pickup-task123-loc1-1707648000000-123456789.jpg
uploads/dropoff/dropoff-task123-1707648000000-987654321.jpg
```

---

### 8. Verify Database Updates

**Check MongoDB:**
```javascript
// Connect to MongoDB
use constructionERP

// Find task with photos
db.fleetTasks.findOne(
  { id: 123 },
  { pickupPhotos: 1, dropoffPhotos: 1 }
)
```

**Verify:**
- [ ] pickupPhotos array populated
- [ ] dropoffPhotos array populated
- [ ] photoUrl present
- [ ] GPS coordinates stored
- [ ] uploadedAt timestamp present

**Expected Structure:**
```javascript
{
  pickupPhotos: [{
    photoUrl: "/uploads/pickup/pickup-task123-loc1-1707648000000.jpg",
    fileName: "pickup-task123-loc1-1707648000000.jpg",
    fileSize: 245678,
    locationId: 1,
    uploadedAt: ISODate("2026-02-11T10:30:00.000Z"),
    uploadedBy: 64,
    gpsLocation: {
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 10
    }
  }],
  dropoffPhotos: [{
    photoUrl: "/uploads/dropoff/dropoff-task123-1707648000000.jpg",
    fileName: "dropoff-task123-1707648000000.jpg",
    fileSize: 312456,
    uploadedAt: ISODate("2026-02-11T11:30:00.000Z"),
    uploadedBy: 64,
    gpsLocation: {
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 10
    }
  }]
}
```

---

## Error Scenario Testing

### 9. Test Error Handling

**Test 1: Upload without photo**
- [ ] Try to upload without selecting photo
- [ ] Verify error message shown
- [ ] Verify pickup/dropoff continues

**Test 2: Upload with invalid task**
- [ ] Try to upload with non-existent task ID
- [ ] Verify 404 error
- [ ] Verify error message shown

**Test 3: Upload with large file**
- [ ] Try to upload file > 10MB
- [ ] Verify file rejected
- [ ] Verify error message shown

**Test 4: Upload without GPS**
- [ ] Disable location permissions
- [ ] Try to upload photo
- [ ] Verify upload succeeds without GPS
- [ ] Verify gpsTagged: false

**Test 5: Network error**
- [ ] Disconnect network
- [ ] Try to upload photo
- [ ] Verify error handling
- [ ] Verify pickup/dropoff continues

---

## Performance Testing

### 10. Performance Checks

**Upload Speed:**
- [ ] Small photo (< 1MB): < 2 seconds
- [ ] Medium photo (1-5MB): < 5 seconds
- [ ] Large photo (5-10MB): < 10 seconds

**Disk Space:**
- [ ] Monitor upload directory size
- [ ] Verify no disk space issues
- [ ] Check for orphaned files

**Database Performance:**
- [ ] Query response time < 100ms
- [ ] No index issues
- [ ] No memory leaks

---

## Security Testing

### 11. Security Checks

**Authentication:**
- [ ] Upload requires valid token
- [ ] Invalid token rejected
- [ ] Expired token rejected

**Authorization:**
- [ ] Driver can only upload to own tasks
- [ ] Cannot upload to other driver's tasks
- [ ] Company ID verified

**File Validation:**
- [ ] Only image files accepted
- [ ] File size limit enforced
- [ ] MIME type validated
- [ ] Malicious files rejected

---

## Production Deployment

### 12. Pre-Production Checklist

**Environment:**
- [ ] Production database configured
- [ ] Upload directories created
- [ ] Permissions set correctly
- [ ] Disk space available (> 10GB)

**Configuration:**
- [ ] File size limits configured
- [ ] Upload paths configured
- [ ] Error logging enabled
- [ ] Monitoring enabled

**Backup:**
- [ ] Database backup configured
- [ ] File backup configured
- [ ] Disaster recovery plan

**Monitoring:**
- [ ] Disk space alerts
- [ ] Error rate alerts
- [ ] Upload success rate tracking
- [ ] Performance monitoring

---

### 13. Production Deployment Steps

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
cd moile/backend
npm install

# 3. Create upload directories
mkdir -p uploads/pickup
mkdir -p uploads/dropoff
chmod 755 uploads/pickup
chmod 755 uploads/dropoff

# 4. Restart backend server
pm2 restart backend
# or
systemctl restart backend

# 5. Verify server running
curl http://localhost:5000/health

# 6. Deploy mobile app
cd moile/ConstructionERPMobile
eas build --platform android
eas build --platform ios
```

**Verify:**
- [ ] Backend server running
- [ ] No errors in logs
- [ ] Upload directories accessible
- [ ] Mobile app deployed

---

### 14. Post-Deployment Verification

**Smoke Tests:**
- [ ] Login works
- [ ] Tasks load
- [ ] Photo capture works
- [ ] Photo upload works
- [ ] Database updates

**Monitor for 24 hours:**
- [ ] No errors in logs
- [ ] Upload success rate > 95%
- [ ] No disk space issues
- [ ] No performance degradation

---

## Rollback Plan

### 15. Rollback Procedure (If Needed)

**If issues occur:**

```bash
# 1. Revert code changes
git revert HEAD

# 2. Restart backend
pm2 restart backend

# 3. Verify old version working
curl http://localhost:5000/health

# 4. Rollback mobile app
eas build --platform android --profile previous
eas build --platform ios --profile previous
```

**Checklist:**
- [ ] Code reverted
- [ ] Backend restarted
- [ ] Old version verified
- [ ] Mobile app rolled back
- [ ] Users notified

---

## Maintenance

### 16. Ongoing Maintenance

**Daily:**
- [ ] Check error logs
- [ ] Monitor disk space
- [ ] Verify upload success rate

**Weekly:**
- [ ] Review upload statistics
- [ ] Check for orphaned files
- [ ] Verify backup working

**Monthly:**
- [ ] Archive old photos (optional)
- [ ] Clean up orphaned files
- [ ] Review performance metrics
- [ ] Update documentation

---

## Success Metrics

### 17. Key Performance Indicators

**Upload Success Rate:**
- Target: > 95%
- Current: ____%

**Average Upload Time:**
- Target: < 5 seconds
- Current: _____ seconds

**Error Rate:**
- Target: < 5%
- Current: ____%

**Disk Space Usage:**
- Target: < 80%
- Current: ____%

**User Satisfaction:**
- Target: > 4.0/5.0
- Current: _____/5.0

---

## Sign-Off

### 18. Deployment Approval

**Tested By:** _____________________
**Date:** _____________________
**Approved By:** _____________________
**Date:** _____________________

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

---

## Quick Reference

### Important Commands

**Start Backend:**
```bash
cd moile/backend && npm start
```

**Start Mobile App:**
```bash
cd moile/ConstructionERPMobile && npm start
```

**Run Tests:**
```bash
cd moile/backend && node test-photo-upload-endpoints.js
```

**Check Logs:**
```bash
tail -f moile/backend/logs/error.log
tail -f moile/backend/logs/access.log
```

**Check Disk Space:**
```bash
du -sh moile/backend/uploads/pickup/
du -sh moile/backend/uploads/dropoff/
```

### Important Files

**Backend:**
- `src/modules/driver/photoUploadController.js`
- `src/modules/driver/driverRoutes.js`
- `src/modules/fleetTask/models/FleetTask.js`

**Frontend:**
- `src/services/api/DriverApiService.ts`
- `src/screens/driver/TransportTasksScreen.tsx`
- `src/utils/photoCapture.ts`

**Documentation:**
- `BACKEND_PHOTO_UPLOAD_IMPLEMENTATION_COMPLETE.md`
- `PHOTO_UPLOAD_QUICK_START_GUIDE.md`
- `PHOTO_UPLOAD_IMPLEMENTATION_SUMMARY.md`

---

## Status

**Implementation:** ✅ Complete
**Testing:** ⏳ In Progress
**Deployment:** ⏳ Pending
**Production:** ⏳ Pending

**Last Updated:** February 11, 2026
