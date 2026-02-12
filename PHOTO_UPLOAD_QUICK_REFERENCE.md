# Photo Upload - Quick Reference Guide

## ✅ What's Implemented

### Frontend (Mobile App)
- ✅ Photo capture with camera
- ✅ Photo selection from gallery
- ✅ GPS tagging (from EXIF or current location)
- ✅ Photo compression (quality: 0.8)
- ✅ FormData preparation for upload
- ✅ Upload API calls to backend
- ✅ Error handling (graceful degradation)
- ✅ User notifications (success/failure)

### API Methods
```typescript
// In DriverApiService.ts
await driverApiService.uploadPickupPhoto(taskId, locationId, photoFormData);
await driverApiService.uploadDropoffPhoto(taskId, photoFormData);
```

### Photo Capture Flow
```typescript
// In TransportTasksScreen.tsx
const capturedPhoto = await showPhotoOptions(locationState.currentLocation);
if (capturedPhoto) {
  const photoFormData = preparePhotoForUpload(capturedPhoto);
  await driverApiService.uploadPickupPhoto(taskId, locationId, photoFormData);
}
```

---

## ⚠️ What's NOT Implemented (Backend Required)

### Backend Endpoints Needed
```
POST /driver/transport-tasks/{taskId}/pickup-photo
POST /driver/transport-tasks/{taskId}/dropoff-photo
```

### Backend Tasks
1. Create photo upload endpoints
2. Configure cloud storage (S3/Azure/GCS)
3. Validate photo files (size, format)
4. Store photo metadata in database
5. Link photos to transport tasks

---

## 🚀 How to Test (Frontend Only)

### Test Photo Capture
1. Run app: `npm start` or `expo start`
2. Navigate to Transport Tasks
3. Select a task
4. Click "Complete Pickup" or "Complete Dropoff"
5. Choose "Take Photo" when prompted
6. Take photo or select from gallery
7. Check console logs for upload attempt

### Expected Console Logs
```
📤 Uploading pickup photo...
✅ Pickup photo uploaded successfully: https://...
```

Or if backend not ready:
```
📤 Uploading pickup photo...
❌ Upload pickup photo error: Network Error
⚠️ Photo upload failed, continuing with pickup completion
```

---

## 📱 User Experience

### Pickup Completion
1. Driver clicks "Complete Pickup"
2. System verifies worker count
3. Prompt: "Take pickup photo?"
4. Driver takes photo or selects from gallery
5. Photo preview shown with GPS tag
6. Driver confirms pickup
7. **Photo uploads automatically** ✅
8. Success message: "Pickup complete! Photo uploaded ✓"

### Dropoff Completion
1. Driver clicks "Complete Dropoff"
2. System verifies worker count and geofence
3. Prompt: "Take dropoff photo?"
4. Driver takes photo or selects from gallery
5. Photo preview shown with GPS tag
6. Driver confirms dropoff
7. **Photo uploads automatically** ✅
8. Success message: "Dropoff complete! Photo uploaded ✓"

---

## 🔧 Backend Implementation Guide

### 1. Create Upload Endpoints

```javascript
// Example Node.js/Express endpoint
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/driver/transport-tasks/:taskId/pickup-photo', 
  upload.single('photo'), 
  async (req, res) => {
    const { taskId } = req.params;
    const { locationId, latitude, longitude, timestamp } = req.body;
    const photo = req.file;
    
    // Upload to S3/Azure/GCS
    const photoUrl = await uploadToCloud(photo);
    
    // Save to database
    const photoRecord = await db.photos.create({
      taskId,
      locationId,
      photoUrl,
      latitude,
      longitude,
      timestamp,
      type: 'pickup'
    });
    
    res.json({
      success: true,
      message: 'Photo uploaded successfully',
      photoUrl: photoUrl,
      photoId: photoRecord.id
    });
  }
);
```

### 2. Configure Cloud Storage

#### AWS S3
```javascript
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

async function uploadToS3(file) {
  const params = {
    Bucket: 'transport-photos',
    Key: `pickup/${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype
  };
  
  const result = await s3.upload(params).promise();
  return result.Location;
}
```

#### Azure Blob Storage
```javascript
const { BlobServiceClient } = require('@azure/storage-blob');

async function uploadToAzure(file) {
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient('transport-photos');
  const blobName = `pickup/${Date.now()}-${file.originalname}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
  await blockBlobClient.uploadData(file.buffer);
  return blockBlobClient.url;
}
```

### 3. Database Schema

```sql
CREATE TABLE transport_photos (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  location_id INTEGER,
  photo_url VARCHAR(500) NOT NULL,
  photo_type VARCHAR(20) NOT NULL, -- 'pickup' or 'dropoff'
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  accuracy DECIMAL(10, 2),
  captured_at TIMESTAMP NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  file_size INTEGER,
  file_name VARCHAR(255),
  FOREIGN KEY (task_id) REFERENCES fleet_tasks(id)
);
```

---

## 📊 Data Flow

```
Mobile App                    Backend                     Cloud Storage
-----------                   -------                     -------------
1. Capture photo
2. Add GPS tag
3. Compress image
4. Create FormData
5. POST /pickup-photo    -->  6. Receive multipart
                              7. Validate file
                              8. Upload to S3/Azure  -->  9. Store file
                              10. Get photo URL      <--  11. Return URL
                              12. Save to database
13. Receive response     <--  14. Return success
14. Show success message
```

---

## 🐛 Troubleshooting

### Photo Upload Fails
**Symptom:** "Photo could not be uploaded" alert
**Causes:**
- Backend endpoint not implemented
- Network connection issue
- Backend server down
- Invalid photo format

**Solution:**
- Check backend logs
- Verify endpoint exists
- Test with Postman/curl
- Check network connectivity

### Camera Permission Denied
**Symptom:** "Camera permission required" alert
**Solution:**
- Go to device Settings > Apps > ConstructionERP
- Enable Camera permission
- Restart app

### GPS Not Tagged
**Symptom:** Photo uploaded without GPS coordinates
**Causes:**
- Location permission denied
- GPS disabled on device
- Indoor location (weak signal)

**Solution:**
- Enable location permission
- Enable GPS on device
- Move to outdoor location

---

## 📝 Testing Checklist

### Before Backend Implementation
- [x] Photo capture works (camera)
- [x] Photo capture works (gallery)
- [x] GPS tagging works
- [x] FormData preparation works
- [x] Upload attempt is made
- [x] Error handling works
- [x] Pickup/dropoff continues on upload failure

### After Backend Implementation
- [ ] Photo uploads successfully
- [ ] Photo appears in cloud storage
- [ ] Photo metadata saved in database
- [ ] Photo URL returned to app
- [ ] Success message shown to user
- [ ] Photo viewable in admin panel
- [ ] GPS coordinates stored correctly

---

## 🎯 Current Status

**Frontend:** ✅ COMPLETE
- Photo capture: Working
- Photo upload: Implemented
- Error handling: Implemented
- User experience: Complete

**Backend:** ⚠️ PENDING
- Upload endpoints: Not implemented
- Cloud storage: Not configured
- Database schema: Not created

**Next Action:** Implement backend endpoints to receive and store photos.

---

## 📞 Support

If you encounter issues:
1. Check console logs for error messages
2. Verify backend endpoints are running
3. Test with Postman/curl
4. Check network connectivity
5. Review backend logs

**Files to check:**
- `moile/ConstructionERPMobile/src/services/api/DriverApiService.ts`
- `moile/ConstructionERPMobile/src/screens/driver/TransportTasksScreen.tsx`
- `moile/ConstructionERPMobile/src/utils/photoCapture.ts`
