# Quick Test Guide - Supervisor ID 4 APIs

## 🚀 Quick Start

### 1. Setup Test Data (Run Once)
```bash
node setup-supervisor-4-test-data.js
```

### 2. Verify Data
```bash
node verify-supervisor-4-data.js
```

### 3. Start Backend Server
```bash
npm start
```

### 4. Test APIs
```bash
node test-supervisor-4-apis.js
```

## 📊 Expected Results

### Workers Assigned: 5 workers
- ✅ Test Worker 1: Present, On Time (8:00 AM)
- ⏰ Test Worker 2: Late (9:30 AM)
- ❌ Test Worker 3: Absent
- 📍 Test Worker 4: Present + Geofence Violation (8:15 AM)
- ⏰📍 Test Worker 5: Late + Geofence Violation (10:00 AM)

### Late/Absent Workers: 3 workers
- Test Worker 2 (Late)
- Test Worker 3 (Absent)
- Test Worker 5 (Late)

### Geofence Violations: 2 violations
- Test Worker 4
- Test Worker 5

## 🔐 Login Credentials
- **Email**: supervisor4@test.com
- **Password**: password123

## 📝 API Endpoints
1. `GET /api/supervisor/workers-assigned`
2. `GET /api/supervisor/late-absent-workers`
3. `GET /api/supervisor/geofence-violations`
4. `POST /api/supervisor/manual-attendance-override`

## 🛠️ Useful Commands

### Recreate all test data
```bash
node setup-supervisor-4-test-data.js
```

### Check what data exists
```bash
node verify-supervisor-4-data.js
```

### Test all APIs at once
```bash
node test-supervisor-4-apis.js
```

## ✅ Success Criteria
- All 5 workers appear in workers-assigned
- 3 workers appear in late-absent-workers
- 2 workers appear in geofence-violations
- Manual override successfully updates attendance
