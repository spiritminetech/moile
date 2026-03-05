# Quotation Terms API Documentation

## Overview
This API provides CRUD operations for managing quotation terms and conditions. Terms can be categorized by type (Payment, Warranty, Delivery, Validity, General) and support drag-and-drop reordering.

## Model Schema
```javascript
{
  quotationId: Number,     // Required, indexed
  termType: String,        // Required, enum: ['Payment', 'Warranty', 'Delivery', 'Validity', 'General']
  title: String,           // Optional
  description: String,     // Required
  sortOrder: Number,       // Default: 0
  createdAt: Date,         // Auto-generated
  updatedAt: Date          // Auto-generated
}
```

## API Endpoints

### 1. Get All Terms for a Quotation
```http
GET /api/quotations/:id/terms
```

**Parameters:**
- `id` (path): Quotation ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "quotationId": 65fa1,
      "termType": "Payment",
      "title": "Payment Terms",
      "description": "30 days from invoice date",
      "sortOrder": 1,
      "createdAt": "2024-01-27T10:00:00.000Z",
      "updatedAt": "2024-01-27T10:00:00.000Z"
    }
  ]
}
```

### 2. Create New Term
```http
POST /api/quotation-terms
```

**Request Body:**
```json
{
  "quotationId": 65fa1,
  "termType": "Payment",
  "title": "Payment Terms",
  "description": "30 days from invoice date",
  "sortOrder": 1
}
```

**Required Fields:**
- `quotationId`
- `termType`
- `description`

**Response:**
```json
{
  "success": true,
  "message": "Quotation term created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "quotationId": 65fa1,
    "termType": "Payment",
    "title": "Payment Terms",
    "description": "30 days from invoice date",
    "sortOrder": 1,
    "createdAt": "2024-01-27T10:00:00.000Z",
    "updatedAt": "2024-01-27T10:00:00.000Z"
  }
}
```

### 3. Update Term
```http
PUT /api/quotation-terms/:id
```

**Parameters:**
- `id` (path): Term ID

**Request Body:**
```json
{
  "description": "20% advance, balance in 30 days",
  "title": "Updated Payment Terms"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quotation term updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "quotationId": 65fa1,
    "termType": "Payment",
    "title": "Updated Payment Terms",
    "description": "20% advance, balance in 30 days",
    "sortOrder": 1,
    "createdAt": "2024-01-27T10:00:00.000Z",
    "updatedAt": "2024-01-27T10:30:00.000Z"
  }
}
```

### 4. Delete Term
```http
DELETE /api/quotation-terms/:id
```

**Parameters:**
- `id` (path): Term ID

**Response:**
```json
{
  "success": true,
  "message": "Quotation term deleted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "quotationId": 65fa1,
    "termType": "Payment",
    "title": "Payment Terms",
    "description": "30 days from invoice date",
    "sortOrder": 1
  }
}
```

### 5. Reorder Terms (Drag & Drop)
```http
PUT /api/quotation-terms/reorder
```

**Request Body:**
```json
{
  "terms": [
    { "id": "507f1f77bcf86cd799439011", "sortOrder": 1 },
    { "id": "507f1f77bcf86cd799439012", "sortOrder": 2 },
    { "id": "507f1f77bcf86cd799439013", "sortOrder": 3 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Terms reordered successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "sortOrder": 1,
      // ... other fields
    }
  ]
}
```

## Term Types
- **Payment**: Payment-related terms (advance, payment schedule, etc.)
- **Warranty**: Warranty and guarantee terms
- **Delivery**: Delivery and timeline terms
- **Validity**: Quote validity and expiration terms
- **General**: General terms and conditions

## Error Responses
All endpoints return error responses in this format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development mode)"
}
```

## Common HTTP Status Codes
- `200`: Success
- `201`: Created successfully
- `400`: Bad request (validation error)
- `404`: Resource not found
- `500`: Internal server error

## Usage Examples

### Frontend Integration
```javascript
// Fetch terms for a quotation
const fetchTerms = async (quotationId) => {
  const response = await fetch(`/api/quotations/${quotationId}/terms`);
  const result = await response.json();
  return result.data;
};

// Add new term
const addTerm = async (termData) => {
  const response = await fetch('/api/quotation-terms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(termData)
  });
  return response.json();
};

// Update term
const updateTerm = async (termId, updates) => {
  const response = await fetch(`/api/quotation-terms/${termId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return response.json();
};

// Delete term
const deleteTerm = async (termId) => {
  const response = await fetch(`/api/quotation-terms/${termId}`, {
    method: 'DELETE'
  });
  return response.json();
};

// Reorder terms
const reorderTerms = async (termOrder) => {
  const response = await fetch('/api/quotation-terms/reorder', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ terms: termOrder })
  });
  return response.json();
};
```

## Testing
Run the test script to verify all endpoints:
```bash
node test-quotation-terms.js
```

Make sure your server is running on `http://localhost:5000` before running tests.