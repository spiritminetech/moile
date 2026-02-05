# Certification Display Fix Summary

## Issue Description
The profile section was showing certifications with "Unknown" names and empty fields for issuer and certificate number because the backend wasn't properly mapping the database fields to the format expected by the frontend.

## Root Cause
The database schema for `EmployeeCertifications` has different field names than what the frontend expects:

**Database Schema:**
- `name` - certification name
- `type` - training or professional cert
- `ownership` - employee or company
- `issueDate` and `expiryDate` - dates
- `documentPath` - file path

**Frontend Expected:**
- `name`, `issuer`, `certificateNumber`, `status`
- Proper date formatting
- Status calculation based on expiry dates

## Changes Made

### Backend Changes

#### 1. Fixed Certification Data Mapping (`workerController.js`)
```javascript
certifications: certifications ? certifications.map(cert => ({
  id: cert.id || cert._id,
  name: cert.name || 'Unknown Certification',
  issuer: cert.ownership === 'company' ? company.name : 'External Provider',
  issueDate: cert.issueDate ? cert.issueDate.toISOString() : new Date().toISOString(),
  expiryDate: cert.expiryDate ? cert.expiryDate.toISOString() : new Date().toISOString(),
  certificateNumber: cert.documentPath ? path.basename(cert.documentPath, path.extname(cert.documentPath)) : 'N/A',
  status: cert.expiryDate ? (
    new Date(cert.expiryDate) < new Date() ? 'expired' :
    new Date(cert.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'expiring_soon' :
    'active'
  ) : 'active'
})) : []
```

#### 2. Smart Field Mapping
- **Issuer**: Maps `ownership` field - if "company" uses company name, otherwise "External Provider"
- **Certificate Number**: Extracts filename from `documentPath` (without extension)
- **Status**: Calculates based on expiry date:
  - `expired` - past expiry date
  - `expiring_soon` - expires within 30 days
  - `active` - expires after 30 days or no expiry

### Frontend Changes

#### 1. Enhanced Error Handling (`ProfileScreen.tsx`)
- Better handling of missing certification data
- Graceful fallbacks for missing fields
- Empty state display when no certifications exist

#### 2. Improved Display Logic
```javascript
<Text style={styles.infoValue}>{cert.issuer || 'N/A'}</Text>
<Text style={styles.infoValue}>{cert.certificateNumber || 'N/A'}</Text>
<Text style={styles.infoValue}>
  {cert.issueDate ? formatDate(cert.issueDate) : 'N/A'}
</Text>
```

### Sample Data Creation

#### 1. Created Sample Certification Script (`create-sample-certifications-64.js`)
- Creates realistic certification data for your user (ID 64)
- Includes various certification types and statuses
- Provides different expiry scenarios for testing

## Sample Certifications Created

1. **Safety Induction Training** (Warning - expires in 25 days)
2. **First Aid Certification** (Urgent - expires in 5 days)  
3. **Construction Skills Certification** (Active - expires in 180 days)
4. **Height Work Training** (Warning - expires in 15 days)
5. **Electrical Safety Course** (Expired - expired 10 days ago)

## How to Test

### 1. Create Sample Data
```bash
cd moile/backend
node create-sample-certifications-64.js
```

### 2. Restart Backend
```bash
npm start
```

### 3. Test in Mobile App
1. Open the Profile screen
2. Check the Certifications section
3. Verify all fields display correctly:
   - Certification names
   - Issuers (company name or "External Provider")
   - Certificate numbers (extracted from document paths)
   - Issue and expiry dates
   - Status badges with correct colors

## Expected Results

After the fix:
- **Certification Names**: Display actual names instead of "Unknown"
- **Issuers**: Show company name for company-owned certs, "External Provider" for employee-owned
- **Certificate Numbers**: Extract meaningful IDs from document paths
- **Dates**: Properly formatted issue and expiry dates
- **Status**: Color-coded badges (green=active, orange=expiring soon, red=expired)
- **Empty State**: Friendly message when no certifications exist

## Status Color Coding

- **Green (Active)**: Expires after 30 days or no expiry
- **Orange (Expiring Soon)**: Expires within 30 days
- **Red (Expired)**: Past expiry date

## Files Modified

### Backend:
- `moile/backend/src/modules/worker/workerController.js`

### Frontend:
- `moile/ConstructionERPMobile/src/screens/worker/ProfileScreen.tsx`

### Testing:
- `moile/backend/create-sample-certifications-64.js` (new)
- `moile/CERTIFICATION_DISPLAY_FIX_SUMMARY.md` (new)

## Next Steps

1. Run the sample data creation script
2. Test the profile screen to verify certifications display correctly
3. Check the dashboard for certification alerts
4. Consider adding more certification management features if needed