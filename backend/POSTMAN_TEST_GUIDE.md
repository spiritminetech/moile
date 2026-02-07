# Postman Testing Guide - Supervisor ID 4 APIs

## 🚀 Prerequisites
1. Backend server running on `http://localhost:3000`
2. Test data created (run `node setup-supervisor-4-test-data.js`)

---

## 📋 Step-by-Step Postman Testing

### Step 1: Login to Get Token

**Method**: `POST`  
**URL**: `http://localhost:3000/api/auth/login`

**Headers**:
```
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "email": "supervisor4@test.com",
  "password": "password123"
}
```

**Expected Response**:
```json
