# 🚛 Driver Mobile App Testing Guide

## Overview

This guide provides comprehensive instructions for testing all driver functionality in the Construction ERP Mobile app. It covers API integration testing, UI functionality verification, and end-to-end workflow testing.

## 📋 Quick Start Checklist

### Prerequisites
- [ ] Mobile app development environment set up
- [ ] Backend API server running
- [ ] Valid driver authentication token
- [ ] Test data in database (driver, vehicle, tasks, workers)
- [ ] Device/emulator with location services enabled

### Testing Scripts
- [ ] `test-driver-api-integration.js` - Tests all 29 driver APIs
- [ ] `verify-driver-mobile-functionality.js` - Verifies app implementation
- [ ] Manual testing workflows (this guide)

## 🔧 Setup Instructions

### 1. Configure Testing Scripts

Update configuration in both testing scripts:

```javascript
// In test-driver-api-integration.js
const CONFIG = {
  BASE_URL: 'http://your-api-server:3000',  // Your API URL
  DRIVER_TOKEN: 'your_actual_driver_token', // Valid driver token
  
  TEST_DATA: {
    driverId: 'DRV001',    // Existing driver ID
    taskId: 1,             // Existing transport task ID
    vehicleId: 1,          // Existing vehicle ID
    locationId: 1,         // Existing location ID
    workerId: 1,           // Existing worker ID
    testDate: '2026-02-08' // Current date
  }
};
```

### 2. Run Verification Scripts

```bash
# Verify app implementation
node verify-driver-mobile-functionality.js

# Test API integration
node test-driver-api-integration.js
```

## 📱 Screen-by-Screen Testing

### Screen 1: Driver Dashboard

**What to Test:**
- [ ] Dashboard loads with driver summary data
- [ ] Today's transport tasks display correctly
- [ ] Vehicle information shows assigned vehicle
- [ ] Performance metrics display (if available)
- [ ] Pull-to-refresh functionality works
- [ ] Logout functionality works

**API Endpoints Tested:**
- `GET /api/v1/driver/dashboard/summary`
- `GET /api/v1/driver/transport-tasks`
- `GET /api/v1/driver/vehicle`

**Manual Testing Steps:**
1. Open app and login as driver
2. Verify dashboard shows correct driver name
3. Check transport tasks count matches backend data
4. Verify vehicle plate number displays correctly
5. Pull down to refresh and verify data updates
6. Tap logout and verify user is logged out

**Expected Results:**
- Dashboard loads within 3 seconds
- All data displays correctly
- No error messages or crashes
- Smooth navigation and interactions

### Screen 2: Transport Tasks

**What to Test:**
- [ ] Transport tasks list loads correctly
- [ ] Task details show pickup/dropoff locations
- [ ] Worker count displays accurately
- [ ] Task status updates work
- [ ] Route optimization functions
- [ ] Navigation integration works

**API Endpoints Tested:**
- `GET /api/v1/driver/transport-tasks`
- `PUT /api/v1/driver/transport-tasks/{id}/status`
- `POST /api/v1/driver/transport-tasks/{id}/optimize-route`
- `GET /api/v1/driver/transport-tasks/{id}/navigation`

**Manual Testing Steps:**
1. Navigate to Transport Tasks screen
2. Verify tasks display with correct routes
3. Select a task and verify details load
4. Try updating task status
5. Test route optimization feature
6. Verify navigation buttons work

**Expected Results:**
- Tasks load and display correctly
- Status updates reflect in real-time
- Route optimization provides feedback
- Navigation opens external maps app

### Screen 3: Worker Management

**What to Test:**
- [ ] Worker manifests load for selected task
- [ ] Worker check-in functionality works
- [ ] Worker check-out functionality works
- [ ] Photo capture for check-ins works
- [ ] Location tracking during check-ins
- [ ] Pickup completion workflow

**API Endpoints Tested:**
- `GET /api/v1/driver/transport-tasks/{id}/manifests`
- `POST /api/v1/driver/transport-tasks/locations/{id}/checkin`
- `POST /api/v1/driver/transport-tasks/locations/{id}/checkout`
- `POST /api/v1/driver/transport-tasks/{id}/pickup-complete`

**Manual Testing Steps:**
1. Select a transport task with workers
2. Navigate to worker management view
3. Verify worker list displays correctly
4. Test checking in a worker
5. Verify location is captured
6. Test photo capture functionality
7. Complete pickup process

**Expected Results:**
- Worker lists load correctly
- Check-in process captures location
- Photos upload successfully
- Pickup completion updates task status

### Screen 4: Trip Updates

**What to Test:**
- [ ] Delay reporting functionality
- [ ] Breakdown reporting with photos
- [ ] Photo upload for various categories
- [ ] Location tracking for incidents
- [ ] Emergency assistance requests

**API Endpoints Tested:**
- `POST /api/v1/driver/transport-tasks/{id}/delay`
- `POST /api/v1/driver/transport-tasks/{id}/breakdown`
- `POST /api/v1/driver/transport-tasks/{id}/photos`
- `POST /api/v1/driver/support/emergency-assistance`

**Manual Testing Steps:**
1. Navigate to Trip Updates screen
2. Test reporting a delay
3. Test reporting a breakdown
4. Upload photos for different categories
5. Test emergency assistance request
6. Verify all reports include location data

**Expected Results:**
- Reports submit successfully
- Photos upload without errors
- Location data is captured accurately
- Emergency requests trigger notifications

### Screen 5: Driver Attendance

**What to Test:**
- [ ] Clock in functionality with vehicle pre-check
- [ ] Clock out functionality with post-check
- [ ] Today's attendance session displays
- [ ] Attendance history loads correctly
- [ ] Performance analytics display
- [ ] Location tracking for clock in/out

**API Endpoints Tested:**
- `POST /api/v1/driver/attendance/clock-in`
- `POST /api/v1/driver/attendance/clock-out`
- `GET /api/v1/driver/attendance/summary`
- `GET /api/v1/driver/trips/history`

**Manual Testing Steps:**
1. Navigate to Attendance screen
2. Test clock in process with pre-check
3. Verify session status updates
4. Test clock out process with post-check
5. Review attendance history
6. Check performance analytics

**Expected Results:**
- Clock in/out processes complete successfully
- Session status updates in real-time
- History displays correctly
- Analytics show meaningful data

### Screen 6: Vehicle Information

**What to Test:**
- [ ] Assigned vehicle details display
- [ ] Maintenance alerts show correctly
- [ ] Fuel log entry functionality
- [ ] Vehicle issue reporting
- [ ] Pre-trip inspection features

**API Endpoints Tested:**
- `GET /api/v1/driver/vehicle`
- `GET /api/v1/driver/vehicle/maintenance-alerts`
- `POST /api/v1/driver/vehicle/fuel-log`
- `POST /api/v1/driver/vehicle/issue-report`

**Manual Testing Steps:**
1. Navigate to Vehicle Info screen
2. Verify vehicle details are correct
3. Check maintenance alerts
4. Add a fuel log entry
5. Report a vehicle issue
6. Test photo upload for issues

**Expected Results:**
- Vehicle information displays accurately
- Maintenance alerts are visible
- Fuel logs save successfully
- Issue reports submit with photos

### Screen 7: Driver Profile

**What to Test:**
- [ ] Driver profile information loads
- [ ] Profile editing functionality
- [ ] Photo upload for profile
- [ ] License details management
- [ ] Emergency contacts display

**API Endpoints Tested:**
- `GET /api/v1/driver/profile`
- `PUT /api/v1/driver/profile`
- `POST /api/v1/driver/profile/photo`
- `GET /api/v1/driver/support/emergency-contacts`

**Manual Testing Steps:**
1. Navigate to Profile screen
2. Verify all profile data displays
3. Edit profile information
4. Upload a new profile photo
5. Update license details
6. Review emergency contacts

**Expected Results:**
- Profile loads completely
- Edits save successfully
- Photo uploads work
- All data persists correctly

## 🔄 End-to-End Workflow Testing

### Complete Driver Day Workflow

**Scenario:** Test a complete driver workday from start to finish

**Steps:**
1. **Morning Setup**
   - [ ] Driver logs into app
   - [ ] Clocks in with vehicle pre-check
   - [ ] Reviews today's transport tasks
   - [ ] Optimizes route for efficiency

2. **First Pickup**
   - [ ] Navigates to first pickup location
   - [ ] Checks in workers using app
   - [ ] Takes photos of workers boarding
   - [ ] Confirms pickup completion
   - [ ] Updates task status to "en route to site"

3. **Site Dropoff**
   - [ ] Arrives at construction site
   - [ ] Checks out workers at site
   - [ ] Confirms dropoff completion
   - [ ] Updates task status to "completed"

4. **Incident Handling**
   - [ ] Reports a minor delay due to traffic
   - [ ] Uploads photo of traffic situation
   - [ ] Notifies dispatch through app

5. **End of Day**
   - [ ] Completes all assigned tasks
   - [ ] Logs fuel usage
   - [ ] Reports any vehicle issues
   - [ ] Clocks out with post-check
   - [ ] Reviews daily performance

**Success Criteria:**
- All steps complete without errors
- Data syncs correctly with backend
- Notifications sent appropriately
- Reports generated accurately

## 🚨 Error Handling Testing

### Network Connectivity Issues

**Test Scenarios:**
- [ ] App behavior when offline
- [ ] Data sync when connection restored
- [ ] Error messages for failed requests
- [ ] Retry mechanisms for critical operations

**Testing Steps:**
1. Turn off device internet connection
2. Try to perform various operations
3. Verify appropriate error messages
4. Turn internet back on
5. Verify data syncs correctly

### Authentication Issues

**Test Scenarios:**
- [ ] Expired token handling
- [ ] Invalid credentials
- [ ] Session timeout
- [ ] Automatic re-authentication

**Testing Steps:**
1. Use expired or invalid token
2. Verify app handles gracefully
3. Test automatic logout
4. Verify re-login process

### Location Services Issues

**Test Scenarios:**
- [ ] Location permission denied
- [ ] GPS not available
- [ ] Location accuracy issues
- [ ] Fallback mechanisms

**Testing Steps:**
1. Deny location permissions
2. Try location-dependent features
3. Verify fallback behavior
4. Test with poor GPS signal

## 📊 Performance Testing

### Load Testing

**Metrics to Monitor:**
- [ ] App startup time (< 3 seconds)
- [ ] Screen navigation time (< 1 second)
- [ ] API response times (< 2 seconds)
- [ ] Image upload times (< 10 seconds)
- [ ] Memory usage (< 200MB)
- [ ] Battery consumption

**Testing Tools:**
- React Native Performance Monitor
- Flipper for debugging
- Device performance monitoring

### Data Usage Testing

**Test Scenarios:**
- [ ] Data consumption for typical usage
- [ ] Image upload data usage
- [ ] Background sync data usage
- [ ] Offline mode data savings

## 🔒 Security Testing

### Data Protection

**Test Areas:**
- [ ] Authentication token storage
- [ ] Sensitive data encryption
- [ ] Photo/file security
- [ ] Location data protection
- [ ] API communication security

### Privacy Compliance

**Verify:**
- [ ] Location data consent
- [ ] Photo capture permissions
- [ ] Data retention policies
- [ ] User data deletion

## 📱 Device Compatibility Testing

### Test on Multiple Devices

**Android Devices:**
- [ ] Different screen sizes
- [ ] Various Android versions
- [ ] Different manufacturers
- [ ] Performance on older devices

**iOS Devices:**
- [ ] iPhone models
- [ ] iPad compatibility
- [ ] iOS version compatibility
- [ ] Performance optimization

## 🐛 Bug Reporting Template

When reporting issues, include:

```
**Bug Title:** [Brief description]

**Environment:**
- Device: [Model and OS version]
- App Version: [Version number]
- Backend URL: [API server URL]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots/Videos:**
[Attach if applicable]

**Additional Notes:**
[Any other relevant information]
```

## ✅ Testing Completion Checklist

### Before Release

- [ ] All API endpoints tested and working
- [ ] All screens function correctly
- [ ] Error handling works properly
- [ ] Offline functionality tested
- [ ] Performance meets requirements
- [ ] Security measures verified
- [ ] Device compatibility confirmed
- [ ] End-to-end workflows tested
- [ ] User acceptance testing completed
- [ ] Documentation updated

### Post-Release Monitoring

- [ ] Monitor crash reports
- [ ] Track API error rates
- [ ] Monitor user feedback
- [ ] Performance metrics tracking
- [ ] Usage analytics review

## 📞 Support and Troubleshooting

### Common Issues and Solutions

**Issue:** APIs returning 401 Unauthorized
**Solution:** Update DRIVER_TOKEN with valid authentication token

**Issue:** Location services not working
**Solution:** Enable location permissions in device settings

**Issue:** Photos not uploading
**Solution:** Check network connection and file size limits

**Issue:** App crashes on startup
**Solution:** Clear app cache and restart

### Getting Help

- Check console logs for error messages
- Review API server logs for backend issues
- Use React Native debugger for detailed analysis
- Contact development team with bug reports

---

## 🎯 Success Metrics

A successful driver mobile app should achieve:

- **Functionality:** 100% of core features working
- **Performance:** < 3 second load times
- **Reliability:** < 1% crash rate
- **User Satisfaction:** > 4.0/5.0 rating
- **API Success Rate:** > 99% successful requests
- **Offline Capability:** Core functions work offline

---

*Last Updated: February 8, 2026*
*Version: 1.0*