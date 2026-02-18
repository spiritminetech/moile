# Database Collections Reference

## Official Collection Names

This document defines the OFFICIAL collection names used by the application. Any collections not listed here are considered unused/deprecated and should be removed.

### Worker Task Management

| Collection Name | Model | Purpose | Status |
|----------------|-------|---------|--------|
| `workerTaskAssignment` | WorkerTaskAssignment | Task assignments for workers | ✅ ACTIVE |
| `tasks` | Task | Master task definitions | ✅ ACTIVE |
| `workertaskprogresses` | WorkerTaskProgress | Task progress tracking | ✅ ACTIVE |

### Fleet/Driver Management

| Collection Name | Model | Purpose | Status |
|----------------|-------|---------|--------|
| `fleetTasks` | FleetTask | Fleet/transport tasks | ✅ ACTIVE |
| `fleettaskpassengers` | FleetTaskPassenger | Passenger assignments | ✅ ACTIVE |
| `transporttasks` | TransportTask | Transport task details | ✅ ACTIVE |

### Attendance & Employee

| Collection Name | Model | Purpose | Status |
|----------------|-------|---------|--------|
| `attendances` | Attendance | Worker attendance records | ✅ ACTIVE |
| `employees` | Employee | Employee master data | ✅ ACTIVE |
| `users` | User | User authentication | ✅ ACTIVE |

### Projects & Companies

| Collection Name | Model | Purpose | Status |
|----------------|-------|---------|--------|
| `projects` | Project | Project master data | ✅ ACTIVE |
| `companies` | Company | Company master data | ✅ ACTIVE |

### Requests & Approvals

| Collection Name | Model | Purpose | Status |
|----------------|-------|---------|--------|
| `leaverequests` | LeaveRequest | Leave requests | ✅ ACTIVE |
| `materialrequests` | MaterialRequest | Material requests | ✅ ACTIVE |
| `toolrequests` | ToolRequest | Tool requests | ✅ ACTIVE |

## Removed Collections (Backups Available)

The following collections were removed on 2026-02-15 due to being unused/duplicate:

| Collection Name | Reason | Backup Name |
|----------------|--------|-------------|
| `workertaskassignments` | Duplicate (plural) - model uses singular | `workertaskassignments_backup_*` |
| `workerTaskPhoto` | Unused/old | `workerTaskPhoto_backup_*` |
| `taskIssues` | Unused/old | `taskIssues_backup_*` |
| `fleetTaskTools` | Unused/old | `fleetTaskTools_backup_*` |
| `fleetTaskMaterials` | Unused/old | `fleetTaskMaterials_backup_*` |
| `fleetTaskPhotos` | Duplicate | `fleetTaskPhotos_backup_*` |
| `workerTaskProgress` | Duplicate (singular) - model uses plural | `workerTaskProgress_backup_*` |

## Collection Naming Convention

### Rules

1. **Use the EXACT name from the Mongoose model's collection option**
2. **Singular vs Plural**: Follow the model definition exactly
3. **Case Sensitivity**: MongoDB collection names are case-sensitive
4. **No Manual Creation**: Always let Mongoose create collections

### Example

```javascript
// CORRECT - Model defines collection name
const WorkerTaskAssignmentSchema = new mongoose.Schema({
  // schema fields
}, {
  collection: 'workerTaskAssignment', // Singular - this is the official name
  timestamps: true
});

// WRONG - Don't manually create with different name
db.collection('workertaskassignments') // Plural - will cause confusion
```

## Validation Script

Run this script to validate your database collections:

```bash
node backend/validate-collections.js
```

This will:
- Check for unauthorized collections
- Verify all models point to correct collections
- Report any mismatches or duplicates

## Migration Guide

If you need to add a new collection:

1. Define the Mongoose model with explicit `collection` name
2. Add it to this reference document
3. Run validation script to ensure no conflicts
4. Update any related documentation

## Troubleshooting

### Issue: "No tasks found" but data exists

**Cause**: Data is in wrong collection (e.g., `workertaskassignments` instead of `workerTaskAssignment`)

**Solution**:
1. Check model's collection name in schema definition
2. Verify data is in correct collection
3. Run cleanup script if needed: `node backend/cleanup-unused-collections.js`

### Issue: Duplicate key error on `id: null`

**Cause**: Documents with null/missing `id` field

**Solution**:
```javascript
// Delete documents with null id
await db.collection('collectionName').deleteMany({ 
  $or: [{ id: null }, { id: { $exists: false } }] 
});
```

## Best Practices

1. ✅ Always use Mongoose models for database operations
2. ✅ Never manually create collections
3. ✅ Check this reference before querying
4. ✅ Run validation script after schema changes
5. ❌ Don't assume collection names (check model definition)
6. ❌ Don't create duplicate collections with different casing
7. ❌ Don't use raw MongoDB queries without verifying collection name

---

**Last Updated**: 2026-02-15
**Maintained By**: Development Team
