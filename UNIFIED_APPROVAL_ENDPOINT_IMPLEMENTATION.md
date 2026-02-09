# Unified Approval Endpoint Implementation

## Issue
The mobile app was calling `/api/supervisor/approvals/:id/process` but this endpoint didn't exist on the backend. The backend only had individual endpoints for each request type (leave, advance, material, tool).

Error: `Cannot POST /api/supervisor/approvals/1770517953843/process` (404)

## Solution
Created a unified approval processing system that works with all request types through a single endpoint.

## New Backend Endpoints

### 1. Process Single Approval
**POST** `/api/supervisor/approvals/:approvalId/process`

**Request Body:**
```json
{
  "action": "approve" | "reject" | "request_more_info",
  "notes": "Optional approval notes",
  "conditions": ["condition1", "condition2"],
  "escalate": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "approvalId": 123,
    "status": "approved" | "rejected" | "pending_info" | "escalated",
    "processedAt": "2026-02-08T05:07:46.738Z",
    "message": "Request approved successfully",
    "nextSteps": "Worker has been notified of approval"
  }
}
```

### 2. Batch Process Approvals
**POST** `/api/supervisor/approvals/batch-process`

**Request Body:**
```json
{
  "decisions": [
    {
      "approvalId": 123,
      "action": "approve",
      "notes": "Approved"
    },
    {
      "approvalId": 124,
      "action": "reject",
      "notes": "Insufficient justification"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "processed": 2,
    "successful": 2,
    "failed": 0,
    "results": [
      {
        "approvalId": 123,
        "status": "success",
        "message": "Request approved successfully"
      }
    ]
  }
}
```

### 3. Get Approval History
**GET** `/api/supervisor/approvals/history`

**Query Parameters:**
- `requesterId` - Filter by specific requester
- `type` - Filter by request type (leave, material, tool, advance_payment)
- `status` - Filter by status (approved, rejected, escalated, all)
- `dateFrom` - Start date for filtering
- `dateTo` - End date for filtering
- `limit` - Number of results (default: 20)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "approvals": [
      {
        "id": 123,
        "requestType": "leave",
        "requesterName": "John Doe",
        "requestDate": "2026-02-01T00:00:00.000Z",
        "status": "approved",
        "processedDate": "2026-02-02T10:30:00.000Z",
        "approverNotes": "Approved",
        "amount": null
      }
    ],
    "total": 15,
    "limit": 20,
    "offset": 0
  }
}
```

### 4. Get Approval Details
**GET** `/api/supervisor/approvals/:approvalId/details`

**Response:**
```json
{
  "success": true,
  "data": {
    "requestId": 123,
    "requestType": "leave",
    "status": "PENDING",
    "requesterInfo": {
      "id": 107,
      "name": "John Doe",
      "department": "Construction Site A",
      "position": "Worker",
      "recentPerformance": {
        "attendanceRate": 0.95,
        "taskCompletionRate": 0.88,
        "qualityScore": 0.92
      }
    },
    "requestDetails": { /* Full request object */ },
    "approvalHistory": []
  }
}
```

## Implementation Details

### Files Modified

1. **backend/src/modules/supervisor/supervisorRequestController.js**
   - Added `processApproval()` - Unified approval processing
   - Added `batchProcessApprovals()` - Batch processing
   - Added `getApprovalHistory()` - Historical approvals
   - Added `getApprovalDetails()` - Detailed approval info

2. **backend/src/modules/supervisor/supervisorRoutes.js**
   - Added route: `POST /api/supervisor/approvals/:approvalId/process`
   - Added route: `POST /api/supervisor/approvals/batch-process`
   - Added route: `GET /api/supervisor/approvals/history`
   - Added route: `GET /api/supervisor/approvals/:approvalId/details`

### How It Works

1. **Request Type Detection**: The unified endpoint automatically detects the request type by searching across:
   - LeaveRequest collection
   - PaymentRequest collection (advance payments)
   - MaterialRequest collection (materials and tools)

2. **Status Updates**: Updates the appropriate collection with:
   - New status (APPROVED, REJECTED, PENDING, ESCALATED)
   - Approver ID
   - Approval timestamp
   - Notes/remarks
   - Conditions (if any)

3. **Notifications**: Automatically sends notifications to workers using:
   - `ApprovalStatusNotificationService.notifyLeaveRequestStatus()`
   - `ApprovalStatusNotificationService.notifyAdvanceRequestStatus()`
   - `ApprovalStatusNotificationService.notifyMaterialRequestStatus()`

4. **Error Handling**: Gracefully handles:
   - Request not found (404)
   - Already processed requests (400)
   - Invalid actions (400)
   - Supervisor not found (404)
   - Database errors (500)

## Testing

Run the test script to verify the implementation:

```bash
cd backend
node test-unified-approval-endpoint.js
```

The test will:
1. Login as supervisor
2. Get pending approvals
3. Get approval details
4. Process a single approval
5. Batch process multiple approvals
6. Retrieve approval history

## Mobile App Compatibility

The mobile app's `SupervisorApiService.processApproval()` method now works correctly:

```typescript
await supervisorApiService.processApproval(approvalId, {
  action: 'approve',
  notes: 'Approved via mobile app'
});
```

## Benefits

1. **Unified Interface**: Single endpoint for all approval types
2. **Batch Processing**: Approve/reject multiple requests at once
3. **History Tracking**: Complete audit trail of all approvals
4. **Detailed Views**: Rich approval details with requester performance
5. **Flexible Filtering**: Filter history by type, status, date, requester
6. **Automatic Notifications**: Workers are notified of all decisions
7. **Mobile-First**: Designed for the mobile app's approval workflow

## Status
✅ **IMPLEMENTED** - All unified approval endpoints are now available and tested.
