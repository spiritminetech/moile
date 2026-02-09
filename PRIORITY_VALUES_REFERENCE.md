# Task Priority Values - Quick Reference

## For Mobile App Developers

When creating or updating tasks from the mobile app, use these priority values:

| Priority Label | API Value | Description |
|---------------|-----------|-------------|
| Low | `'low'` | Low priority task |
| Normal | `'normal'` | Standard priority task |
| High | `'high'` | High priority task |
| Urgent | `'urgent'` | Critical/urgent task |

## For Backend Developers

The database schema uses these enum values:

| Database Value | Description |
|---------------|-------------|
| `'low'` | Low priority |
| `'medium'` | Medium/normal priority |
| `'high'` | High priority |
| `'critical'` | Critical/urgent priority |

## Automatic Mapping

The backend automatically maps mobile app values to database values:

```
Mobile App → Database
─────────────────────
'low'      → 'low'
'normal'   → 'medium'
'medium'   → 'medium'
'high'     → 'high'
'urgent'   → 'critical'
'critical' → 'critical'
```

## API Endpoints

### Create and Assign Task
**POST** `/api/supervisor/create-and-assign-task`

```json
{
  "taskName": "Task Name",
  "priority": "normal",  // ← Use mobile app values
  "employeeId": 107,
  "projectId": 1
}
```

### Update Task Priority
**PUT** `/api/supervisor/task-assignments/:assignmentId/priority`

```json
{
  "priority": "urgent",  // ← Use mobile app values
  "instructions": "Updated instructions"
}
```

## Implementation Details

Priority mapping is implemented in:
- `createAndAssignTask()` - Line ~3150
- `updateTaskPriority()` - Line ~3040

Both functions in: `backend/src/modules/supervisor/supervisorController.js`

## Error Handling

Invalid priority values return:
```json
{
  "success": false,
  "errors": ["Priority must be one of: low, normal, medium, high, urgent, critical"]
}
```

## Notes

- Priority values are **case-insensitive** (converted to lowercase)
- Both mobile and database values are accepted for backward compatibility
- Default priority is `'medium'` if not specified
