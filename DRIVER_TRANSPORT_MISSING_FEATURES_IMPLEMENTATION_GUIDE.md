# Driver Transport Screen - Missing Features Implementation Guide

## Overview
This document provides detailed information on what needs to be implemented to complete the driver transport screen requirements. This is a GUIDE ONLY - no code has been implemented yet.

**Date**: February 11, 2026  
**Purpose**: Implementation Planning Document

---

## 🎯 MISSING FEATURES SUMMARY

### 1. Delay/Breakdown Report Methods in DriverApiService
### 2. Incident Report Screen with Issue Type Selection
### 3. Photo Upload Functionality for Incidents
### 4. Geofence Violation Notifications

---

## 📋 FEATURE 1: Add Delay/Breakdown Methods to DriverApiService

### Current Status: ❌ NOT IMPLEMENTED

### File to Modify:
`moile/ConstructionERPMobile/src/services/api/DriverApiService.ts`

### Location to Add:
After line 1070 (after `getDelayAuditTrail()` method, before class closing)

### Methods to Add:

#### Method 1: reportDelay()

**Purpose**: Report traffic delays or other delay incidents

**Method Signature**:
```typescript
async reportDelay(
  taskId: number,
  delayData: {
    delayReason: string;
    estimatedDelay: number;  // in minutes
    currentLocation: GeoLocation;
    photo?: File;
    notes?: string;
  }
): Promise<ApiResponse<{
  incidentId: number;
  incidentType: string;
  delayReason: string;
  estimatedDelay: number;
  status: string;
  reportedAt: string;
}>>
```

**Backend Endpoint**: `POST /api/driver/transport-tasks/:taskId/delay`

**Request Body**:
```json
{
  "delayReason": "Heavy traffic on highway",
  "estimatedDelay": 30,
  "currentLocation": {
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "notes": "Accident on main road causing congestion"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Delay reported successfully",
  "incident": {
    "id": 123,
    "incidentType": "DELAY",
    "delayReason": "Heavy traffic on highway",
    "estimatedDelay": 30,
    "status": "REPORTED",
    "reportedAt": "2026-02-11T10:30:00.000Z"
  }
}
```

**Implementation Notes**:
- Backend endpoint already exists (verified in driverController.js line 1696)
- Need to add FormData support for photo upload
- Should show loading indicator during submission
- Should refresh task list after successful report

---

#### Method 2: reportBreakdown()

**Purpose**: Report vehicle breakdown or mechanical issues

**Method Signature**:
```typescript
async reportBreakdown(
  taskId: number,
  breakdownData: {
    breakdownType: string;  // e.g., "Engine failure", "Flat tire", "Battery dead"
    description: string;
    location: GeoLocation;
    requiresAssistance: boolean;
    photo?: File;
    notes?: string;
  }
): Promise<ApiResponse<{
  incidentId: number;
  incidentType: string;
  breakdownType: string;
  status: string;
  requiresAssistance: boolean;
  reportedAt: string;
}>>
```

**Backend Endpoint**: `POST /api/driver/transport-tasks/:taskId/breakdown`

**Request Body**:
```json
{
  "breakdownType": "Engine failure",
  "description": "Engine overheating, smoke from hood",
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "requiresAssistance": true,
  "notes": "Need tow truck immediately"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Breakdown reported successfully",
  "incident": {
    "id": 124,
    "incidentType": "BREAKDOWN",
    "breakdownType": "Engine failure",
    "status": "REPORTED",
    "requiresAssistance": true,
    "reportedAt": "2026-02-11T10:35:00.000Z"
  }
}
```

**Implementation Notes**:
- Backend endpoint already exists (verified in driverController.js line 1770)
- Should trigger emergency notification if requiresAssistance is true
- Should disable task actions until breakdown is resolved
- Photo upload is critical for breakdown verification

---

#### Method 3: reportIncident() (Generic)

**Purpose**: Generic incident reporting (accidents, other issues)

**Method Signature**:
```typescript
async reportIncident(
  taskId: number,
  incidentData: {
    incidentType: 'DELAY' | 'BREAKDOWN' | 'ACCIDENT' | 'OTHER';
    description: string;
    location: GeoLocation;
    estimatedDelay?: number;
    breakdownType?: string;
    requiresAssistance?: boolean;
    photos?: File[];
    notes?: string;
  }
): Promise<ApiResponse<any>>
```

**Backend Endpoint**: `POST /api/driver/transport-tasks/:taskId/incident`

**Implementation Notes**:
- This is a unified method that can handle all incident types
- Backend may need a new endpoint or can route to existing delay/breakdown endpoints
- Supports multiple photo uploads
- More flexible than separate methods

---

### Implementation Checklist:

- [ ] Add `reportDelay()` method to DriverApiService class
- [ ] Add `reportBreakdown()` method to DriverApiService class
- [ ] Add `reportIncident()` method (optional, for unified approach)
- [ ] Add TypeScript interfaces for request/response types
- [ ] Add error handling for network failures
- [ ] Add photo upload support using FormData
- [ ] Test with backend endpoints
- [ ] Update API service tests

---

## 📱 FEATURE 2: Create Incident Report Screen

### Current Status: ❌ NOT IMPLEMENTED

### New File to Create:
`moile/ConstructionERPMobile/src/screens/driver/ReportIncidentScreen.tsx`

### Screen Purpose:
Allow drivers to report delays, breakdowns, and other incidents during transport tasks

### Screen Location in Navigation:
- Accessible from DriverDashboard via "Report Issue" button
- Accessible from TransportTasksScreen via task action menu
- Should be a modal or full-screen form

### Screen Components Needed:

#### 1. Issue Type Selection

**Component**: Radio buttons or segmented control

**Options**:
```typescript
const incidentTypes = [
  { value: 'DELAY', label: '🚦 Traffic Delay', icon: 'clock-alert' },
  { value: 'BREAKDOWN', label: '🔧 Vehicle Breakdown', icon: 'car-wrench' },
  { value: 'ACCIDENT', label: '🚨 Accident', icon: 'car-crash' },
  { value: 'OTHER', label: '⚠️ Other Issue', icon: 'alert-circle' }
];
```

**UI Design**:
```
┌─────────────────────────────────────┐
│  Select Issue Type                  │
├─────────────────────────────────────┤
│  ○ 🚦 Traffic Delay                 │
│  ○ 🔧 Vehicle Breakdown             │
│  ○ 🚨 Accident                      │
│  ○ ⚠️ Other Issue                   │
└─────────────────────────────────────┘
```

---

#### 2. Conditional Fields Based on Issue Type

**For DELAY**:
- Delay Reason (dropdown or text input)
  - Options: "Heavy traffic", "Road construction", "Weather conditions", "Accident on route", "Other"
- Estimated Delay Time (number input in minutes)
- Current Location (auto-captured from GPS)
- Optional Photo
- Remarks (text area)

**For BREAKDOWN**:
- Breakdown Type (dropdown)
  - Options: "Engine failure", "Flat tire", "Battery dead", "Transmission issue", "Overheating", "Other"
- Description (required text area)
- Current Location (auto-captured from GPS)
- Requires Assistance? (toggle switch)
- Photo (recommended/required)
- Remarks (text area)

**For ACCIDENT**:
- Accident Type (dropdown)
  - Options: "Minor collision", "Major collision", "Hit object", "Hit by vehicle", "Other"
- Description (required text area)
- Injuries? (yes/no toggle)
- Police Notified? (yes/no toggle)
- Current Location (auto-captured from GPS)
- Photos (multiple, required)
- Remarks (text area)

**For OTHER**:
- Description (required text area)
- Current Location (auto-captured from GPS)
- Optional Photo
- Remarks (text area)

---

#### 3. Photo Upload Section

**Component**: Image picker with camera and gallery options

**Features**:
- Take photo with camera (with GPS tag)
- Select from gallery
- Multiple photo support (up to 5 photos)
- Photo preview with delete option
- Show GPS coordinates on each photo
- Compress images before upload

**UI Design**:
```
┌─────────────────────────────────────┐
│  Photos (Optional)                  │
├─────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ 📷  │ │ 🖼️  │ │ 🖼️  │  + Add    │
│  │Photo│ │Photo│ │Photo│           │
│  └─────┘ └─────┘ └─────┘           │
│                                     │
│  📍 GPS: 12.9716, 77.5946          │
└─────────────────────────────────────┘
```

---

#### 4. Location Display

**Component**: Map preview or coordinates display

**Features**:
- Show current GPS location
- Display accuracy
- Refresh location button
- Show address if available
- Visual indicator if location is unavailable

**UI Design**:
```
┌─────────────────────────────────────┐
│  Current Location                   │
├─────────────────────────────────────┤
│  📍 Latitude: 12.9716               │
│  📍 Longitude: 77.5946              │
│  📍 Accuracy: ±10m                  │
│  🔄 Refresh Location                │
└─────────────────────────────────────┘
```

---

#### 5. Submit Button

**Component**: Primary action button

**Features**:
- Validate all required fields
- Show loading indicator during submission
- Disable during submission
- Success/error feedback
- Navigate back on success

**UI Design**:
```
┌─────────────────────────────────────┐
│  [Submit Report]                    │
└─────────────────────────────────────┘
```

---

### Screen State Management:

```typescript
interface IncidentReportState {
  taskId: number;
  incidentType: 'DELAY' | 'BREAKDOWN' | 'ACCIDENT' | 'OTHER' | null;
  
  // Delay fields
  delayReason?: string;
  estimatedDelay?: number;
  
  // Breakdown fields
  breakdownType?: string;
  requiresAssistance?: boolean;
  
  // Accident fields
  accidentType?: string;
  hasInjuries?: boolean;
  policeNotified?: boolean;
  
  // Common fields
  description: string;
  currentLocation: GeoLocation | null;
  photos: File[];
  notes: string;
  
  // UI state
  isSubmitting: boolean;
  isLoadingLocation: boolean;
}
```

---

### Validation Rules:

**All Types**:
- Incident type must be selected
- Current location must be available
- Description required (except for DELAY)

**DELAY**:
- Delay reason required
- Estimated delay must be > 0 and < 1440 (24 hours)

**BREAKDOWN**:
- Breakdown type required
- Description required (min 10 characters)
- Photo recommended (show warning if missing)

**ACCIDENT**:
- Accident type required
- Description required (min 20 characters)
- At least 1 photo required
- If injuries = yes, police notified should be yes

---

### Navigation Integration:

**From DriverDashboard**:
```typescript
// Add button to dashboard
<ConstructionButton
  title="🚨 Report Issue"
  onPress={() => navigation.navigate('ReportIncident', { 
    taskId: activeTask?.taskId 
  })}
  variant="warning"
  icon="alert-circle"
/>
```

**From TransportTasksScreen**:
```typescript
// Add to task action menu
<MenuItem
  title="Report Issue"
  icon="alert-circle"
  onPress={() => navigation.navigate('ReportIncident', { 
    taskId: task.taskId 
  })}
/>
```

---

### Implementation Checklist:

- [ ] Create ReportIncidentScreen.tsx file
- [ ] Add screen to navigation stack
- [ ] Implement issue type selection UI
- [ ] Implement conditional form fields
- [ ] Add photo picker integration
- [ ] Add GPS location capture
- [ ] Implement form validation
- [ ] Connect to DriverApiService methods
- [ ] Add loading and error states
- [ ] Add success feedback
- [ ] Test all incident types
- [ ] Add accessibility labels
- [ ] Test on iOS and Android

---

## 📸 FEATURE 3: Photo Upload Functionality

### Current Status: ❌ NOT IMPLEMENTED

### Implementation Requirements:

#### 1. Photo Picker Library

**Recommended Library**: `react-native-image-picker`

**Installation**:
```bash
npm install react-native-image-picker
```

**Permissions Required**:
- iOS: Camera, Photo Library
- Android: Camera, Read External Storage

---

#### 2. Photo Upload Utility

**New File to Create**:
`moile/ConstructionERPMobile/src/utils/photoUpload.ts`

**Functions Needed**:

```typescript
// Open camera to take photo
async function takePhoto(): Promise<PhotoResult>

// Open gallery to select photo
async function selectPhoto(): Promise<PhotoResult>

// Select multiple photos
async function selectMultiplePhotos(maxPhotos: number): Promise<PhotoResult[]>

// Compress image before upload
async function compressImage(photo: PhotoResult): Promise<PhotoResult>

// Add GPS tag to photo metadata
async function addGPSTag(photo: PhotoResult, location: GeoLocation): Promise<PhotoResult>

// Upload photo to server
async function uploadPhoto(photo: PhotoResult, endpoint: string): Promise<string>

// Upload multiple photos
async function uploadMultiplePhotos(photos: PhotoResult[], endpoint: string): Promise<string[]>
```

---

#### 3. Photo Component

**New File to Create**:
`moile/ConstructionERPMobile/src/components/common/PhotoUploader.tsx`

**Component Features**:
- Camera button
- Gallery button
- Photo preview grid
- Delete photo option
- Upload progress indicator
- GPS tag display
- Max photos limit (e.g., 5)

**Props**:
```typescript
interface PhotoUploaderProps {
  maxPhotos?: number;
  onPhotosChange: (photos: File[]) => void;
  currentLocation?: GeoLocation;
  required?: boolean;
  showGPSTag?: boolean;
}
```

---

#### 4. Backend Photo Upload Endpoint

**Endpoint**: `POST /api/driver/incidents/:incidentId/photos`

**Request**: FormData with multiple files

**Response**:
```json
{
  "success": true,
  "message": "Photos uploaded successfully",
  "photoUrls": [
    "https://storage.example.com/incidents/photo1.jpg",
    "https://storage.example.com/incidents/photo2.jpg"
  ]
}
```

---

#### 5. Photo Storage

**Database Field**: `tripIncidents.photoUrls` (Array of strings)

**Storage Options**:
- Local file system (for development)
- AWS S3 (recommended for production)
- Azure Blob Storage
- Google Cloud Storage

---

### Implementation Checklist:

- [ ] Install react-native-image-picker
- [ ] Configure camera permissions (iOS/Android)
- [ ] Create photoUpload utility functions
- [ ] Create PhotoUploader component
- [ ] Implement image compression
- [ ] Add GPS tagging to photos
- [ ] Create backend photo upload endpoint
- [ ] Configure cloud storage (S3/Azure/GCS)
- [ ] Test photo upload flow
- [ ] Add error handling for upload failures
- [ ] Add retry mechanism for failed uploads
- [ ] Test on iOS and Android devices

---

## 🔔 FEATURE 4: Geofence Violation Notifications

### Current Status: ⚠️ PARTIALLY IMPLEMENTED

**What Exists**:
- ✅ Notification infrastructure (NotificationService)
- ✅ Geofence validation logic
- ✅ Notification schema in database

**What's Missing**:
- ❌ Automatic notification trigger on geofence violation
- ❌ Notification to supervisor/admin
- ❌ Mandatory remark enforcement in UI

---

### Implementation Requirements:

#### 1. Backend Notification Trigger

**File to Modify**:
`moile/backend/src/modules/driver/driverController.js`

**Method to Modify**: `confirmDropoffComplete()` (around line 1100)

**Location to Add**: After geofence validation fails

**Code to Add**:
```javascript
// After geofence validation
if (!geofenceResult.isValid) {
  // Get supervisor and admin IDs
  const project = await Project.findOne({ id: task.projectId });
  const supervisorId = project.supervisorId;
  const adminId = project.projectManagerId;
  
  // Create notification
  const notificationService = new NotificationService();
  await notificationService.createNotification({
    type: 'GEOFENCE_VIOLATION',
    priority: 'HIGH',
    title: 'Drop Location Outside Geofence',
    message: `Driver ${driver.fullName} attempted drop ${geofenceResult.distance}m from project site`,
    senderId: driverId,
    recipients: [supervisorId, adminId].filter(Boolean),
    actionData: {
      alertType: 'GEOFENCE_VIOLATION',
      taskId: taskId,
      driverId: driverId,
      driverName: driver.fullName,
      projectId: task.projectId,
      projectName: project.projectName,
      distance: geofenceResult.distance,
      allowedRadius: geofenceResult.allowedRadius,
      coordinates: {
        latitude: req.body.latitude,
        longitude: req.body.longitude
      },
      timestamp: new Date().toISOString()
    },
    requiresAcknowledgment: true
  });
  
  // Return error with notification sent flag
  return res.status(400).json({
    success: false,
    message: 'Drop location outside project geofence',
    geofenceValidation: {
      distance: geofenceResult.distance,
      allowedRadius: geofenceResult.allowedRadius,
      message: geofenceResult.message
    },
    notificationSent: true,
    requiresMandatoryRemark: true
  });
}
```

---

#### 2. Frontend Mandatory Remark Enforcement

**File to Modify**:
`moile/ConstructionERPMobile/src/screens/driver/TransportTasksScreen.tsx`

**Method to Modify**: `handleCompleteDropoff()`

**Logic to Add**:
```typescript
// After API call fails with geofence violation
if (error.response?.data?.requiresMandatoryRemark) {
  // Show dialog requiring mandatory remark
  Alert.prompt(
    'Location Outside Geofence',
    `You are ${error.response.data.geofenceValidation.distance}m from the project site. A mandatory remark is required. Supervisor has been notified.`,
    [
      {
        text: 'Cancel',
        style: 'cancel'
      },
      {
        text: 'Submit with Remark',
        onPress: async (remark) => {
          if (!remark || remark.trim().length < 10) {
            Alert.alert('Error', 'Remark must be at least 10 characters');
            return;
          }
          
          // Retry with mandatory remark
          await retryDropoffWithRemark(taskId, locationId, remark);
        }
      }
    ],
    'plain-text'
  );
}
```

---

#### 3. Notification Display in Supervisor/Admin App

**File to Check**:
`moile/ConstructionERPMobile/src/screens/supervisor/NotificationsScreen.tsx`

**Features Needed**:
- Display geofence violation notifications
- Show distance from site
- Show driver name and task details
- Show map with driver location vs site location
- Acknowledge button
- Action buttons (Contact driver, View task)

**Notification Card Design**:
```
┌─────────────────────────────────────┐
│  🚨 Geofence Violation              │
│  HIGH PRIORITY                      │
├─────────────────────────────────────┤
│  Driver: John Doe                   │
│  Task: Transport to Site A          │
│  Distance: 250m from site           │
│  Time: 10:30 AM                     │
│                                     │
│  📍 View on Map                     │
│  📞 Call Driver                     │
│  ✅ Acknowledge                     │
└─────────────────────────────────────┘
```

---

#### 4. Notification Types to Add

**New Notification Types**:
```typescript
enum NotificationType {
  GEOFENCE_VIOLATION = 'GEOFENCE_VIOLATION',
  DELAY_REPORTED = 'DELAY_REPORTED',
  BREAKDOWN_REPORTED = 'BREAKDOWN_REPORTED',
  ACCIDENT_REPORTED = 'ACCIDENT_REPORTED',
  EMERGENCY_ASSISTANCE = 'EMERGENCY_ASSISTANCE'
}
```

---

### Implementation Checklist:

- [ ] Add notification trigger in confirmDropoffComplete()
- [ ] Get supervisor and admin IDs from project
- [ ] Create notification with geofence violation details
- [ ] Add mandatory remark enforcement in frontend
- [ ] Show alert dialog when geofence violation occurs
- [ ] Require minimum remark length (10 characters)
- [ ] Display geofence violation notifications in supervisor app
- [ ] Add map view showing driver location vs site
- [ ] Add action buttons (call driver, view task)
- [ ] Test notification delivery
- [ ] Test acknowledgment flow
- [ ] Add notification for delay reports
- [ ] Add notification for breakdown reports

---

## 🎯 INTEGRATION POINTS

### Where to Add "Report Issue" Button:

#### 1. DriverDashboard Screen

**Location**: After VehicleStatusCard, before bottom spacing

**Button Design**:
```typescript
<ConstructionCard variant="outlined" style={styles.reportIssueCard}>
  <ConstructionButton
    title="🚨 Report Issue"
    onPress={() => navigation.navigate('ReportIncident', { 
      taskId: activeTask?.taskId 
    })}
    variant="warning"
    size="large"
    icon="alert-circle"
    disabled={!activeTask}
  />
  <Text style={styles.reportIssueHint}>
    Report delays, breakdowns, or other issues
  </Text>
</ConstructionCard>
```

---

#### 2. TransportTasksScreen

**Location**: In RouteNavigationComponent action buttons

**Button Design**:
```typescript
<ConstructionButton
  title="Report Issue"
  onPress={() => navigation.navigate('ReportIncident', { 
    taskId: selectedTask.taskId 
  })}
  variant="warning"
  size="medium"
  icon="alert-circle"
/>
```

---

#### 3. TransportTaskCard Component

**Location**: In task action menu (three-dot menu)

**Menu Item**:
```typescript
<MenuItem
  title="Report Issue"
  icon="alert-circle"
  iconColor={ConstructionTheme.colors.warning}
  onPress={() => onReportIssue(task.taskId)}
/>
```

---

## 📊 TESTING CHECKLIST

### Delay Report Testing:
- [ ] Select delay type
- [ ] Enter delay reason
- [ ] Enter estimated delay time
- [ ] Capture GPS location
- [ ] Upload photo (optional)
- [ ] Submit report
- [ ] Verify backend creates tripIncident record
- [ ] Verify notification sent to supervisor
- [ ] Verify task list updates

### Breakdown Report Testing:
- [ ] Select breakdown type
- [ ] Enter description
- [ ] Toggle requires assistance
- [ ] Capture GPS location
- [ ] Upload photo (required)
- [ ] Submit report
- [ ] Verify backend creates tripIncident record
- [ ] Verify emergency notification if assistance required
- [ ] Verify task actions disabled

### Geofence Violation Testing:
- [ ] Attempt drop outside geofence
- [ ] Verify error message shown
- [ ] Verify mandatory remark prompt
- [ ] Verify supervisor notification sent
- [ ] Enter mandatory remark
- [ ] Verify drop blocked until approved
- [ ] Test with different distances (50m, 100m, 200m)

### Photo Upload Testing:
- [ ] Take photo with camera
- [ ] Select photo from gallery
- [ ] Upload multiple photos
- [ ] Verify GPS tag added
- [ ] Verify image compression
- [ ] Verify upload progress shown
- [ ] Verify photo URLs saved in database
- [ ] Test on iOS and Android

---

## 🚀 IMPLEMENTATION PRIORITY

### Phase 1 (High Priority):
1. Add reportDelay() and reportBreakdown() to DriverApiService
2. Create basic ReportIncidentScreen with issue type selection
3. Add "Report Issue" button to DriverDashboard

### Phase 2 (Medium Priority):
4. Implement photo upload functionality
5. Add geofence violation notifications
6. Add mandatory remark enforcement

### Phase 3 (Low Priority):
7. Add notification display in supervisor app
8. Add map view for geofence violations
9. Add incident history view

---

## 📝 NOTES

### Backend Endpoints Already Exist:
- ✅ POST /api/driver/transport-tasks/:taskId/delay
- ✅ POST /api/driver/transport-tasks/:taskId/breakdown
- ✅ Database schema (tripIncidents collection)
- ✅ Geofence validation utility

### What Needs to Be Built:
- ❌ Frontend API service methods
- ❌ Incident report screen UI
- ❌ Photo upload integration
- ❌ Notification triggers
- ❌ Mandatory remark enforcement

### Estimated Development Time:
- DriverApiService methods: 2-3 hours
- ReportIncidentScreen: 8-10 hours
- Photo upload: 4-6 hours
- Geofence notifications: 3-4 hours
- Testing: 4-6 hours
- **Total: 21-29 hours (3-4 days)**

---

## ✅ CONCLUSION

This document provides complete information on what needs to be implemented to finish the driver transport screen requirements. All backend APIs are ready - only frontend implementation is needed.

**Key Takeaways**:
1. Backend is 100% ready for delay/breakdown reports
2. Frontend needs 3 main components: API methods, incident screen, photo upload
3. Geofence notifications need wiring between existing components
4. Estimated 3-4 days of development work

**Next Steps**:
1. Review this document with development team
2. Prioritize features (Phase 1, 2, 3)
3. Assign tasks to developers
4. Begin implementation starting with DriverApiService methods
5. Test each feature as it's completed
