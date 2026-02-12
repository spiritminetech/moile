# Photo Upload - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### 1. Create Upload Directories
```bash
cd moile/backend
mkdir -p uploads/pickup
mkdir -p uploads/dropoff
```

### 2. Verify Backend Files
Check these files exist:
- ✅ `src/modules/driver/photoUploadController.js` (NEW)
- ✅ `src/modules/driver/driverRoutes.js` (MODIFIED)
- ✅ `src/modules/fleetTask/models/FleetTask.js` (MODIFIED)

### 3. Start Backend Server
```bash
cd moile/backend
npm start
# or
node index.js
```

### 4. Test Endpoints (Optional)
```bash
cd moile/backend
node test-photo-upload-endpoints.js
```

---

## 📱 Mobile App Testing

### 1. Start Mobile App
```bash
cd moile/ConstructionERPMobile
npm start
# or
expo start
```

### 2. Test Photo Upload Flow

#### Pickup Photo Upload:
1. Login as driver
2. Navigate to Transport Tasks
3. Select a task
4. Click "Complete Pickup"
5. Choose "Take Photo"
6. Take photo or select from gallery
7. Confirm pickup
8. ✅ Photo should upload automatically

#### Dropoff Photo Upload:
1. Complete all pickups first
2. Navigate to dropoff location
3. Click "Complete Dropoff"
4. Choose "Take Photo"
5. Take photo or select from gallery
6. Confirm dropoff
7. ✅ Photo should upload automatically

### 3. Verify Upload

**Check Console Logs:**
```
📤 Uploading pickup photo...
✅ Pickup photo uploaded successfully: /uploads/pickup/...
```

**Check Backend Logs:**
```
📸 Upload pickup photo for task: 123, location: 1
✅ Pickup photo uploaded successfully: /uploads/pickup/...
```

**Check File System:**
```bash
ls -la moile/backend/uploads/pickup/
ls -la moile/backend/uploads/dropoff/
```

---

## 🧪 Manual API Testing with Postman

### 1. Login to Get Token
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "driver@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Upload Pickup Photo
```
POST http://localhost:5000/api/driver/transport-tasks/123/pickup-photo
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- photo: [Select image file]
- taskId: 123
- locationId: 1
- latitude: 12.9716
- longitude: 77.5946
- accuracy: 10
- timestamp: 2026-02-11T10:30:00.000Z

Expected Response:
{
  "success": true,
  "message": "Pickup photo uploaded successfully",
  "photoUrl": "/uploads/pickup/pickup-task123-loc1-1707648000000.jpg",
  "photoId": "pickup-task123-loc1-1707648000000.jpg"
}
```

### 3. Upload Dropoff Photo
```
POST http://localhost:5000/api/driver/transport-tasks/123/dropoff-photo
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- photo: [Select image file]
- taskId: 123
- latitude: 12.9716
- longitude: 77.5946
- accuracy: 10
- timestamp: 2026-02-11T11:30:00.000Z

Expected Response:
{
  "success": true,
  "message": "Dropoff photo uploaded successfully",
  "photoUrl": "/uploads/dropoff/dropoff-task123-1707648000000.jpg",
  "photoId": "dropoff-task123-1707648000000.jpg"
}
```

---

## 🔍 Troubleshooting

### Issue: "No photo file uploaded"
**Solution:**
- Ensure field name is `photo` (not `file` or `image`)
- Check Content-Type is `multipart/form-data`
- Verify file is selected in FormData

### Issue: "Task not found"
**Solution:**
- Use valid task ID from `/api/driver/transport-tasks`
- Ensure task belongs to logged-in driver
- Check authentication token is valid

### Issue: Upload directory not found
**Solution:**
```bash
cd moile/backend
mkdir -p uploads/pickup
mkdir -p uploads/dropoff
chmod 755 uploads/pickup
chmod 755 uploads/dropoff
```

### Issue: Permission denied
**Solution:**
```bash
cd moile/backend
chmod 755 uploads
chmod 755 uploads/pickup
chmod 755 uploads/dropoff
```

---

## ✅ Verification Checklist

### Backend
- [ ] Upload directories created
- [ ] Backend server running
- [ ] No errors in console
- [ ] Routes registered correctly

### Frontend
- [ ] Mobile app running
- [ ] Driver can login
- [ ] Transport tasks visible
- [ ] Photo capture works
- [ ] Upload attempt made

### Integration
- [ ] Photo uploads successfully
- [ ] Photo URL returned
- [ ] Photo saved in database
- [ ] Photo file exists on disk
- [ ] GPS coordinates stored

---

## 📊 Expected Results

### Successful Upload
```
Frontend Console:
📤 Uploading pickup photo...
✅ Pickup photo uploaded successfully: /uploads/pickup/pickup-task123-loc1-1707648000000.jpg

Backend Console:
📸 Upload pickup photo for task: 123, location: 1
✅ Pickup photo uploaded successfully: /uploads/pickup/pickup-task123-loc1-1707648000000.jpg

File System:
moile/backend/uploads/pickup/pickup-task123-loc1-1707648000000.jpg (exists)

Database:
FleetTask.pickupPhotos: [
  {
    photoUrl: "/uploads/pickup/pickup-task123-loc1-1707648000000.jpg",
    fileName: "pickup-task123-loc1-1707648000000.jpg",
    fileSize: 245678,
    locationId: 1,
    gpsLocation: { latitude: 12.9716, longitude: 77.5946, accuracy: 10 }
  }
]
```

---

## 🎯 Next Steps

### After Successful Testing
1. Test with multiple photos
2. Test with different file sizes
3. Test with no GPS location
4. Test error scenarios
5. Test with slow network
6. Deploy to staging environment
7. Test with real devices
8. Monitor disk space usage
9. Set up photo cleanup (optional)
10. Configure cloud storage (optional)

### Production Deployment
1. Configure cloud storage (S3/Azure/GCS)
2. Set up CDN for photo serving
3. Implement photo compression
4. Add photo cleanup job
5. Monitor disk space
6. Set up alerts
7. Configure backups
8. Test disaster recovery

---

## 📞 Support

**Common Issues:**
- Upload directory permissions
- File size limits
- MIME type validation
- Authentication errors
- Task authorization

**Check These First:**
1. Backend server logs
2. Frontend console logs
3. Upload directory exists
4. File permissions correct
5. Authentication token valid

**Still Having Issues?**
- Review `BACKEND_PHOTO_UPLOAD_IMPLEMENTATION_COMPLETE.md`
- Check `test-photo-upload-endpoints.js` results
- Verify all files are in place
- Test with Postman/curl first

---

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Photos upload without errors
- ✅ Photo URLs returned in response
- ✅ Photos visible in upload directory
- ✅ GPS coordinates stored correctly
- ✅ Database updated with photo metadata
- ✅ No errors in console logs
- ✅ Test script passes all tests

**Status:** Ready for testing! 🚀
