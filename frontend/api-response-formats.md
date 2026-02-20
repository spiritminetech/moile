# API Response Format Guide

The React Native app now supports multiple API response formats. Here are the common formats:

## Format 1: Nested Success Response (Recommended)
```json
{
  "success": true,
  "data": {
    "token": "your.jwt.token.here",
    "refreshToken": "your.refresh.token",
    "expiresIn": 3600,
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "Worker"
    },
    "company": {
      "id": 1,
      "name": "ABC Construction",
      "role": "Worker"
    },
    "permissions": ["read", "write"]
  },
  "message": "Login successful"
}
```

## Format 2: Direct Response
```json
{
  "token": "your.jwt.token.here",
  "refresh_token": "your.refresh.token",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "Worker"
  },
  "company": {
    "id": 1,
    "name": "ABC Construction",
    "role": "Worker"
  }
}
```

## Format 3: Status-based Response
```json
{
  "status": "success",
  "token": "your.jwt.token.here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "Worker"
  }
}
```

## Format 4: Laravel/PHP Style
```json
{
  "data": {
    "access_token": "your.jwt.token.here",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "Worker"
    }
  }
}
```

## Required Fields (Minimum):
- **token** (or access_token): JWT authentication token
- **user**: User object with id, email, name, role
- **expiresIn** (or expires_in): Token expiration time in seconds

## Optional Fields:
- **refreshToken** (or refresh_token): For token refresh
- **company**: Company information
- **permissions**: User permissions array
- **success**: Success indicator
- **message**: Response message

## Error Response Format:
```json
{
  "success": false,
  "message": "Invalid email or password",
  "errors": {
    "email": ["Email is required"],
    "password": ["Password is required"]
  }
}
```

The app will automatically detect and handle any of these formats!