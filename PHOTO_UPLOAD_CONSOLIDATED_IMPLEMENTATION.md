# Photo Upload - Consolidated Implementation ✅

## Summary
Photo upload functionality has been successfully integrated into the existing `driverController.js` file. All photo upload logic is now in one place, making it easier to maintain and understand.

---

## Implementation Details

### Files Modified

#### 1. `driverController.js`
**Path:** `moile/backend/src/modules/driver/driverController.js`

**Added Functions:**
- `uploadPickupPhotoMulter` - Multer middleware for pickup photos
- `uploadDropoffPhotoMulter` - Multer middleware for dropoff photos
- `uploadPickupPhoto` - Handler for pickup photo upload
- `uploadDropoffPhoto` - Handler for dropoff photo upload

**Location:** Added at the end of the file (after `getDelayAuditTrail`)

#### 2. `driverRoutes.js`
**Path:** `moile/backend/src/modules/driver/driverRoutes.js`

**Changes:**
- Updated imports to include photo upload functions from `driverController.js`
- Routes remain the same:
  - `POST /api/driver/transport-tasks/:taskId/pickup-photo`
  - `POST /api/driver/transport-tasks/:taskId/dropoff-photo`

#### 3. `FleetTask.js`
**Path:** `moile/backend/src/modules/fleetTask/models/FleetTask.js`

**Changes:**
- Added `pickupPhotos` array field
- Added `dropoffPhotos` array field

---

## Code Structure

### Multer Configuration

**Pickup Photos:**
```javascript
const pickupPhotoStorage = multer.diskStorage({
  destination: "uploads/pickup/",
  filename: `pickup-task{taskId}-loc{locationId}-{timestamp}.{ext}`
});

export const uploadPickupPhotoMulter = multer({
  storage: pickupPhotoStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});
```

**Dropoff Photos:**
```javascript
const dropoffPhotoStorage = multer.diskStorage({
  destination: "uploads/dropoff/",
  filename: `dropoff-task{taskId}-{timestamp}.{ext}`
});

export const uploadDropoffPhotoMulter = multer({
  storage: dropoffPhotoStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});
```

### Upload Handlers

**Pickup Photo Upload:**
```javascript
export const uploadPickupPhoto = async (req, res) => {
  // 1. Validate file and locationId
  // 2. Verify task belongs to driver
  // 3. Save photo to disk
  // 4. Store metadata in database
  // 5. Return success response
};
```

**Dropoff Photo Upload:**
```javascript
export const uploadDropoffPhoto = async (req, res) => {
  // 1. Validate file
  // 2. Verify task belongs to driver
  // 3. Save photo to disk
  // 4. Store metadata in database
  // 5. Return success response
};
```

---

## API Endpoints

### 1. Upload Pickup Photo

**Endpoint:** `POST /api/driver/transport-tasks/:taskId/pickup-photo`

**Request:**
```
Content-Type: multipart/form-data
Authorization: Bearer {token}

FormData:
- photo: File (required)
- taskId: string (required)
- locationId: string (required)
- latitude: string (optional)
- longitude: string (optional)
- accuracy: string (optional)
- timestamp: string (optional)
```

**Response:**
```json
{
  "success": true,
  "message": "Pickup photo uploaded successfully",
  "photoUrl": "/uploads/pickup/pickup-task123-loc1-1707648000000.jpg",
  "photoId": "pickup-task123-loc1-1707648000000.jpg",
  "data": {
    "photoUrl": "/uploads/pickup/pickup-task123-loc1-1707648000000.jpg",
    "photoId": "pickup-task123-loc1-1707648000000.jpg",
    "uploadedAt": "2026-02-11T10:30:00.000Z",
    "fileSize": 245678,
    "gpsTagged": true
  }
}
```

### 2. Upload Dropoff Photo

**Endpoint:** `POST /api/driver/transport-tasks/:taskId/dropoff-photo`

**Request:**
```
Content-Type: multipart/form-data
Authorization: Bearer {token}

FormData:
- photo: File (required)
- taskId: string (required)
- latitude: string (optional)
- longitude: string (optional)
- accuracy: string (optional)
- timestamp: string (optional)
```

**Response:**
```json
{
  "success": true,
  "message": "Dropoff photo uploaded successfully",
  "photoUrl": "/uploads/dropoff/dropoff-task123-1707648000000.jpg",
  "photoId": "dropoff-task123-1707648000000.jpg",
  "data": {
    "photoUrl": "/uploads/dropoff/dropoff-task123-1707648000000.jpg",
    "photoId": "dropoff-task123-1707648000000.jpg",
    "uploadedAt": "2026-02-11T11:30:00.000Z",
    "fileSize": 312456,
    "gpsTagged": true
  }
}
```

---

## Database Schema

### FleetTask Model

**New Fields:**
```javascript
pickupPhotos: [{
  photoUrl: String,           // /uploads/pickup/...
  photoPath: String,          // uploads/pickup/...
  fileName: String,           // pickup-task123-...
  fileSize: Number,           // bytes
  mimeType: String,           // image/jpeg
  locationId: Number,         // pickup location ID
  uploadedAt: Date,           // timestamp
  uploadedBy: Number,         // driver ID
  gpsLocation: {
    latitude: Number,
    longitude: Number,
    accuracy: Number
  }
}]

dropoffPhotos: [{
  photoUrl: String,           // /uploads/dropoff/...
  photoPath: String,          // uploads/dropoff/...
  fileName: String,           // dropoff-task123-...
  fileSize: Number,           // bytes
  mimeType: String,           // image/jpeg
  uploadedAt: Date,           // timestamp
  uploadedBy: Number,         // driver ID
  gpsLocation: {
    latitude: Number,
    longitude: Number,
    accuracy: Number
  }
}]
```

---

## File Organization

### Before (Separate Controller)
```
src/modules/driver/
├── driverController.js
├── photoUploadController.js  ❌ Separate file
└── driverRoutes.js
```

### After (Consolidated)
```
src/modules/driver/
├── driverController.js       ✅ All logic in one file
└── driverRoutes.js
```

**Benefits:**
- ✅ Easier to maintain
- ✅ All driver logic in one place
- ✅ Consistent with existing code structure
- ✅ Fewer files to manage
- ✅ Simpler imports

---

## Setup Instructions

### 1. Create Upload Directories
```bash
cd moile/backend
mkdir -p uploads/pickup
mkdir -p uploads/dropoff
chmod 755 uploads/pickup
chmod 755 uploads/dropoff
```

### 2. Start Backend Server
```bash
cd moile/backend
npm start
```

### 3. Verify Implementation
```bash
# Check if routes are registered
curl http://localhost:5000/api/driver/transport-tasks/123/pickup-photo
# Should return 401 (authentication required)

# Run tests
node test-photo-upload-endpoints.js
```

---

## Testing

### Test with Postman

**1. Login:**
```
POST http://localhost:5000/api/auth/login
{
  "email": "driver@example.com",
  "password": "password123"
}
```

**2. Upload Pickup Photo:**
```
POST http://localhost:5000/api/driver/transport-tasks/123/pickup-photo
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- photo: [Select file]
- taskId: 123
- locationId: 1
- latitude: 12.9716
- longitude: 77.5946
```

**3. Upload Dropoff Photo:**
```
POST http://localhost:5000/api/driver/transport-tasks/123/dropoff-photo
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- photo: [Select file]
- taskId: 123
- latitude: 12.9716
- longitude: 77.5946
```

---

## Error Handling

### Validation Errors
```javascript
// No photo file
{
  "success": false,
  "message": "No photo file uploaded"
}

// Missing location ID (pickup only)
{
  "success": false,
  "message": "Location ID is required"
}
```

### Authorization Errors
```javascript
// Task not found or not authorized
{
  "success": false,
  "message": "Task not found or not assigned to this driver"
}
```

### Server Errors
```javascript
{
  "success": false,
  "message": "Server error while uploading photo",
  "error": "Detailed error message"
}
```

**Note:** Uploaded files are automatically deleted on error to prevent orphaned files.

---

## Security Features

### 1. Authentication
- JWT token required
- Token verified via middleware
- Driver ID extracted from token

### 2. Authorization
- Task ownership verified
- Company ID verified
- Unauthorized access returns 404

### 3. File Validation
- File type validation (images only)
- File size limit (10MB)
- MIME type checking
- Invalid files rejected

### 4. Error Handling
- Files deleted on error
- Graceful error messages
- No sensitive data leaked
- Proper HTTP status codes

---

## Integration with Frontend

The frontend is already configured to use these endpoints:

**DriverApiService.ts:**
```typescript
async uploadPickupPhoto(taskId, locationId, photoFormData) {
  return apiClient.uploadFile(
    `/driver/transport-tasks/${taskId}/pickup-photo`,
    photoFormData
  );
}

async uploadDropoffPhoto(taskId, photoFormData) {
  return apiClient.uploadFile(
    `/driver/transport-tasks/${taskId}/dropoff-photo`,
    photoFormData
  );
}
```

**TransportTasksScreen.tsx:**
```typescript
// Pickup photo upload
if (capturedPhoto) {
  const photoFormData = preparePhotoForUpload(capturedPhoto);
  await driverApiService.uploadPickupPhoto(taskId, locationId, photoFormData);
}

// Dropoff photo upload
if (capturedPhoto) {
  const photoFormData = preparePhotoForUpload(capturedPhoto);
  await driverApiService.uploadDropoffPhoto(taskId, photoFormData);
}
```

---

## Verification Checklist

### Backend
- [x] Photo upload functions added to driverController.js
- [x] Multer configuration added
- [x] Routes updated in driverRoutes.js
- [x] FleetTask model updated with photo fields
- [x] No syntax errors
- [ ] Upload directories created
- [ ] Backend server running

### Frontend
- [x] API methods implemented
- [x] Photo capture working
- [x] FormData preparation working
- [x] Upload integration complete

### Testing
- [ ] Upload directories exist
- [ ] Backend server running
- [ ] Test script passes
- [ ] Manual testing complete
- [ ] Photos saved to disk
- [ ] Database updated correctly

---

## Status

**Implementation:** ✅ Complete
**Consolidation:** ✅ Complete
**Testing:** ⏳ Ready to test
**Deployment:** ⏳ Pending

**All photo upload logic is now in `driverController.js`**

---

## Next Steps

1. **Create upload directories:**
   ```bash
   mkdir -p moile/backend/uploads/pickup
   mkdir -p moile/backend/uploads/dropoff
   ```

2. **Start backend server:**
   ```bash
   cd moile/backend
   npm start
   ```

3. **Test endpoints:**
   ```bash
   node test-photo-upload-endpoints.js
   ```

4. **Test with mobile app:**
   - Start Expo app
   - Complete pickup/dropoff with photos
   - Verify uploads work

---

## Summary of Changes

### What Changed
- ✅ Moved photo upload functions from separate file to `driverController.js`
- ✅ Updated imports in `driverRoutes.js`
- ✅ Consolidated all driver logic in one file
- ✅ No separate `photoUploadController.js` file

### What Stayed the Same
- ✅ API endpoints unchanged
- ✅ Request/response format unchanged
- ✅ Frontend integration unchanged
- ✅ Database schema unchanged
- ✅ File storage structure unchanged

### Benefits
- ✅ Simpler file structure
- ✅ Easier to maintain
- ✅ Consistent with existing code
- ✅ All driver logic in one place

**The implementation is complete and ready for testing!** 🚀
