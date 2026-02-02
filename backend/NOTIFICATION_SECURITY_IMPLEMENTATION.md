# Notification Security Implementation

## Overview

This document outlines the comprehensive security and access control features implemented for the Worker Mobile Notifications system, addressing Requirements 9.1, 9.2, 9.3, and 9.4.

## Security Features Implemented

### 1. JWT Token Validation (Requirement 9.1)

**Implementation**: Enhanced JWT authentication middleware (`notificationAuthMiddleware.js`)

**Features**:
- Validates JWT token presence and format
- Verifies token signature and expiration
- Checks user existence and active status
- Validates company association
- Provides detailed error responses for different failure scenarios

**Error Handling**:
- `AUTHENTICATION_REQUIRED`: Missing or invalid authorization header
- `TOKEN_EXPIRED`: Expired JWT tokens
- `MALFORMED_TOKEN`: Invalid JWT structure
- `USER_NOT_FOUND`: Token references non-existent user
- `USER_INACTIVE`: User account is deactivated
- `NO_COMPANY_ACCESS`: User not associated with any company

### 2. Permission-Based Notification Filtering (Requirements 9.2, 9.4)

**Implementation**: Role-based authorization system with granular permissions

**Permission Levels**:
- **Workers**: Can only read their own notifications, manage their own devices
- **Supervisors**: Can create notifications, read all company notifications, view system health
- **Admins**: Full access to all notification operations

**Access Control Features**:
- Operation-specific permission checks
- Company-based data isolation
- Recipient validation for cross-company access prevention
- Device management restrictions

### 3. Encryption for Notification Content (Requirement 9.3)

**Implementation**: AES-256-CBC encryption with integrity verification

**Features**:
- Automatic encryption of notification titles and messages when enabled
- Secure key derivation using scrypt
- Integrity verification using SHA-256 hashes
- Transparent encryption/decryption in notification model
- Environment-controlled encryption toggle

**Configuration**:
```env
NOTIFICATION_ENCRYPTION_ENABLED=true
NOTIFICATION_ENCRYPTION_KEY=your_notification_encryption_key_32_chars_long_2024
```

### 4. Enhanced Security Utilities

**SecurityUtil Class Features**:
- **Encryption/Decryption**: AES-256-CBC with integrity checks
- **Content Validation**: Malicious content detection and input sanitization
- **Hash Generation**: SHA-256 content hashing for integrity
- **Token Generation**: Cryptographically secure random tokens
- **JWT Validation**: Structure and claims validation
- **Session Management**: Secure session token generation and verification
- **Data Masking**: Sensitive data masking for audit logs
- **IP Validation**: IP address format validation

## Security Middleware Stack

### Applied to All Notification Routes:

1. **Security Headers**: Prevents clickjacking, XSS, and information disclosure
2. **JWT Authentication**: Validates user identity and permissions
3. **Security Audit Logging**: Logs all security-relevant events
4. **Company Access Control**: Enforces company-based data isolation
5. **Rate Limiting**: Prevents abuse with configurable limits
6. **Input Sanitization**: Removes malicious content from user input

### Middleware Configuration:

```javascript
// Security headers
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'none'

// Rate limiting (configurable)
NOTIFICATION_RATE_LIMIT_REQUESTS=100
NOTIFICATION_RATE_LIMIT_WINDOW_MS=900000
```

## Input Validation and Sanitization

### Content Validation Rules:
- **Type Validation**: Only valid notification types accepted
- **Priority Validation**: Only valid priority levels accepted
- **Length Limits**: Configurable maximum lengths for titles and messages
- **Malicious Content Detection**: Blocks script tags, JavaScript protocols, event handlers
- **Required Fields**: Ensures all mandatory fields are present

### Device Registration Validation:
- **Token Format**: Validates device token length and format
- **Platform Validation**: Only 'ios' and 'android' platforms accepted
- **Version Format**: Validates app version format (x.y.z)

## Audit and Compliance Features

### Security Audit Logging:
- **Request Logging**: Method, path, user info, IP address, user agent
- **Response Logging**: Status codes, response times, success/error status
- **Sensitive Data Masking**: Automatically masks passwords, tokens, and keys
- **Unique Request IDs**: Correlates requests and responses

### Audit Trail Integration:
- **Operation Signatures**: HMAC-SHA256 signatures for audit records
- **Integrity Verification**: Tamper-evident audit records
- **Comprehensive Logging**: All notification lifecycle events tracked

## Error Handling and Security

### Comprehensive Error Responses:
- **Structured Error Format**: Consistent error response structure
- **Security-Aware Messages**: No sensitive information in error messages
- **Detailed Logging**: Full error details logged for debugging
- **Graceful Degradation**: System continues operating during partial failures

### Circuit Breaker Pattern:
- **External Service Protection**: Prevents cascade failures
- **Automatic Recovery**: Self-healing when services recover
- **Fallback Mechanisms**: Alternative delivery methods when primary fails

## Configuration and Environment Variables

### Security Configuration:
```env
# Authentication
JWT_SECRET=your_super_secure_jwt_secret_key_2024

# Encryption
NOTIFICATION_ENCRYPTION_ENABLED=true
NOTIFICATION_ENCRYPTION_KEY=your_notification_encryption_key_32_chars_long_2024

# Rate Limiting
NOTIFICATION_RATE_LIMIT_REQUESTS=100
NOTIFICATION_RATE_LIMIT_WINDOW_MS=900000

# Content Validation
NOTIFICATION_CONTENT_MAX_LENGTH=5000
NOTIFICATION_TITLE_MAX_LENGTH=1000

# Audit
NOTIFICATION_AUDIT_ENABLED=true
```

## Testing and Validation

### Security Test Coverage:
- **Unit Tests**: Individual security functions tested
- **Integration Tests**: End-to-end security flow validation
- **Middleware Tests**: Authentication and authorization testing
- **Input Validation Tests**: Malicious content detection testing
- **Encryption Tests**: Encryption/decryption functionality testing

### Test Files Created:
- `backend/src/utils/securityUtil.test.js`: Security utility tests
- `backend/src/middleware/notificationAuthMiddleware.test.js`: Middleware tests
- `backend/src/modules/notification/notificationSecurity.integration.test.js`: Integration tests

## Security Best Practices Implemented

1. **Defense in Depth**: Multiple layers of security controls
2. **Principle of Least Privilege**: Users only get minimum required permissions
3. **Input Validation**: All user input validated and sanitized
4. **Secure Defaults**: Security features enabled by default
5. **Audit Logging**: Comprehensive logging for security monitoring
6. **Error Handling**: Secure error responses without information leakage
7. **Encryption**: Sensitive data encrypted at rest and in transit
8. **Access Control**: Role-based and company-based access restrictions

## Compliance and Standards

### Requirements Addressed:
- **9.1**: JWT token validation for all notification operations ✅
- **9.2**: Permission-based notification filtering ✅
- **9.3**: Encryption for notification content ✅
- **9.4**: Access control preventing cross-company data access ✅

### Security Standards:
- **OWASP Top 10**: Protection against common web vulnerabilities
- **Data Protection**: Encryption and access controls for sensitive data
- **Audit Requirements**: Comprehensive logging for compliance
- **Singapore Regulations**: 7-year audit retention and data protection

## Deployment Considerations

### Production Security:
1. **Environment Variables**: All secrets stored in environment variables
2. **Key Management**: Secure key generation and rotation procedures
3. **Monitoring**: Security event monitoring and alerting
4. **Regular Updates**: Security patches and dependency updates
5. **Penetration Testing**: Regular security assessments

### Performance Impact:
- **Encryption Overhead**: Minimal impact on notification processing
- **Authentication Caching**: JWT validation optimized for performance
- **Rate Limiting**: Configurable limits to balance security and usability
- **Audit Logging**: Asynchronous logging to minimize performance impact

## Conclusion

The notification security implementation provides comprehensive protection against common security threats while maintaining system performance and usability. All requirements have been successfully implemented with extensive testing and documentation.